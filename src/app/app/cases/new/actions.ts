'use server';

import { redirect } from 'next/navigation';
import { z } from 'zod';
import { requireUser } from '@/lib/auth/session';
import { writeAuditLog } from '@/lib/audit-log';
import { putFile } from '@/lib/storage';
import {
  addDocument,
  addLineItems,
  createCase,
  recomputeCaseTotals,
  updateCaseProvider,
  upsertPlanBenefits,
} from '@/lib/cases/repo';
import { lineItemInputSchema, planBenefitsInputSchema } from '@/lib/domain/line-item';
import { mockFhirConnector } from '@/lib/connectors/mock-fhir';
import type { Document } from '@/lib/db/schema';

const ACCEPTED = ['application/pdf', 'image/png', 'image/jpeg'];
const MAX_BYTES = 12 * 1024 * 1024;

// ---------------------------------------------------------------------------
// Path 1: Manual entry
// ---------------------------------------------------------------------------
const manualSchema = z.object({
  title: z.string().min(1, 'Give the case a title.'),
  providerName: z.string().optional(),
  payerName: z.string().optional(),
  dateOfService: z.string().optional(),
  lineItems: z.array(lineItemInputSchema).min(1, 'Add at least one line item.'),
  planBenefits: planBenefitsInputSchema.optional(),
});

export async function createManualCase(
  raw: z.input<typeof manualSchema>,
): Promise<{ ok: false; error: string } | never> {
  const user = await requireUser();
  const parsed = manualSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid input.' };
  }
  const data = parsed.data;

  const created = await createCase({
    userId: user.id,
    title: data.title,
    providerName: data.providerName || null,
    payerName: data.payerName || null,
    dateOfService: data.dateOfService || null,
    status: 'DRAFT',
  });
  await addLineItems(created.id, data.lineItems);
  if (data.planBenefits) await upsertPlanBenefits(created.id, data.planBenefits);
  await recomputeCaseTotals(created.id);
  await writeAuditLog({
    userId: user.id,
    entity: 'case',
    entityId: created.id,
    action: 'case.created.manual',
    diff: { lineItems: data.lineItems.length },
  });

  redirect(`/app/cases/${created.id}`);
}

// ---------------------------------------------------------------------------
// Path 2: Upload bill / EOB (stores file + document; extraction is Phase 3)
// ---------------------------------------------------------------------------
function kindForName(name: string): Document['kind'] {
  const n = name.toLowerCase();
  if (n.includes('eob')) return 'EOB';
  if (n.includes('denial')) return 'DENIAL_LETTER';
  if (n.includes('sbc') || n.includes('benefit')) return 'PLAN_SBC';
  if (n.includes('bill') || n.includes('itemized')) return 'ITEMIZED_BILL';
  return 'OTHER';
}

export async function createCaseFromUpload(formData: FormData): Promise<void> {
  const user = await requireUser();
  const title = String(formData.get('title') ?? '').trim() || 'Uploaded case';
  const files = formData.getAll('files').filter((f): f is File => f instanceof File && f.size > 0);

  if (files.length === 0) {
    throw new Error('Please attach at least one file.');
  }
  for (const f of files) {
    if (!ACCEPTED.includes(f.type)) throw new Error(`Unsupported file type: ${f.type}`);
    if (f.size > MAX_BYTES) throw new Error(`File too large: ${f.name}`);
  }

  const created = await createCase({
    userId: user.id,
    title,
    providerName: String(formData.get('providerName') ?? '').trim() || null,
    payerName: String(formData.get('payerName') ?? '').trim() || null,
    status: 'INGESTING',
  });

  for (const file of files) {
    const bytes = Buffer.from(await file.arrayBuffer());
    const stored = await putFile(`cases/${created.id}/${file.name}`, bytes, file.type);
    await addDocument({
      caseId: created.id,
      kind: kindForName(file.name),
      blobUrl: stored.url,
      fileName: file.name,
      mimeType: file.type,
      ingestStatus: 'PENDING', // Phase 3 runs extraction
    });
  }

  await writeAuditLog({
    userId: user.id,
    entity: 'case',
    entityId: created.id,
    action: 'case.created.upload',
    diff: { files: files.length },
  });

  redirect(`/app/cases/${created.id}`);
}

// ---------------------------------------------------------------------------
// Path 3: Connect insurer (stubbed MockFhirConnector)
// ---------------------------------------------------------------------------
export async function connectMockPayer(payerId: string): Promise<void> {
  const user = await requireUser();
  const result = await mockFhirConnector.connect(payerId);

  const created = await createCase({
    userId: user.id,
    title: `Imported claims from ${result.payerName}`,
    payerName: result.payerName,
    status: 'AUDITED',
    notes: result.note,
  });

  let providerName: string | null = null;
  for (const doc of result.documents) {
    const document = await addDocument({
      caseId: created.id,
      kind: doc.kind,
      fileName: doc.fileName,
      ingestStatus: 'DONE', // connector returns already-structured data
    });
    await addLineItems(created.id, doc.lineItems, document.id);
    if (doc.providerName && !providerName) providerName = doc.providerName;
  }
  if (result.planBenefits) await upsertPlanBenefits(created.id, result.planBenefits);
  // Persist the captured provider name (the connector spans providers; record the first).
  if (providerName) {
    await updateCaseProvider(created.id, providerName);
  }
  await recomputeCaseTotals(created.id);

  await writeAuditLog({
    userId: user.id,
    entity: 'case',
    entityId: created.id,
    action: 'case.created.connector',
    diff: { connector: mockFhirConnector.id, documents: result.documents.length },
  });

  redirect(`/app/cases/${created.id}`);
}
