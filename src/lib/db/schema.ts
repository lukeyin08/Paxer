import { relations, sql } from 'drizzle-orm';
import {
  boolean,
  index,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  primaryKey,
  real,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';
import type { AdapterAccountType } from 'next-auth/adapters';

// ---------------------------------------------------------------------------
// Enums (Section 6)
// ---------------------------------------------------------------------------
export const userRole = pgEnum('user_role', ['PATIENT', 'ADMIN']);

export const caseStatus = pgEnum('case_status', [
  'DRAFT',
  'INGESTING',
  'AUDITED',
  'IN_DISPUTE',
  'RESOLVED',
  'CLOSED',
]);

export const documentKind = pgEnum('document_kind', [
  'ITEMIZED_BILL',
  'EOB',
  'DENIAL_LETTER',
  'PLAN_SBC',
  'OTHER',
]);

export const ingestStatus = pgEnum('ingest_status', [
  'PENDING',
  'PROCESSING',
  'NEEDS_REVIEW',
  'DONE',
  'FAILED',
]);

export const findingType = pgEnum('finding_type', [
  'DUPLICATE_CHARGE',
  'UPCODING',
  'UNBUNDLING_NCCI',
  'COST_SHARE_ERROR',
  'BALANCE_BILLING_NSA',
  'OOP_MAX_OVERRUN',
  'CROSS_PROVIDER_DUPLICATE',
  'NON_COVERED_BILLED_TO_PATIENT',
  'OTHER',
]);

export const severity = pgEnum('severity', ['LOW', 'MED', 'HIGH']);
export const detector = pgEnum('detector', ['RULE', 'AI', 'RULE+AI']);
export const findingStatus = pgEnum('finding_status', [
  'OPEN',
  'DISMISSED',
  'DISPUTING',
  'RECOVERED',
]);

export const disputeTarget = pgEnum('dispute_target', ['PROVIDER', 'INSURER']);
export const disputeChannel = pgEnum('dispute_channel', ['MAIL', 'FAX', 'PORTAL']);
export const disputeStatus = pgEnum('dispute_status', [
  'DRAFT',
  'AWAITING_USER_APPROVAL',
  'SIMULATED_SENT',
  'RESPONSE_RECEIVED',
  'WON',
  'PARTIAL',
  'DENIED',
  'ESCALATED',
]);

export const disputeEventType = pgEnum('dispute_event_type', [
  'CREATED',
  'EDITED',
  'APPROVED',
  'SIMULATED_SENT',
  'REMINDER_SENT',
  'RESPONSE_LOGGED',
  'ESCALATED',
  'RESOLVED',
]);

export const recoveryKind = pgEnum('recovery_kind', [
  'BILL_REDUCTION',
  'REFUND',
  'CLAIM_PAID',
]);

export const benchmarkSource = pgEnum('benchmark_source', ['SEED', 'AGGREGATE']);

// ---------------------------------------------------------------------------
// Shared column helpers
// ---------------------------------------------------------------------------
const timestamps = {
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
};

/** Monetary amounts stored as numeric(12,2); read back as string by pg, coerced in queries. */
const money = (name: string) => numeric(name, { precision: 12, scale: 2 });

// ---------------------------------------------------------------------------
// Auth.js tables (Section 6) — Drizzle adapter shape
// ---------------------------------------------------------------------------
export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name'),
  email: text('email').notNull().unique(),
  emailVerified: timestamp('email_verified', { withTimezone: true }),
  image: text('image'),
  role: userRole('role').default('PATIENT').notNull(),
  // Onboarding (Section 7.1)
  state: text('state'),
  consentAt: timestamp('consent_at', { withTimezone: true }),
  passwordHash: text('password_hash'), // seeded demo credentials only
  // Audit-API billing plan ('free' | 'pro'). Drives the monthly call quota.
  apiPlan: text('api_plan').default('free').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
});

// ---------------------------------------------------------------------------
// API keys — authenticate the embedded audit API (B2B). Only the SHA-256 hash
// of the full key is stored; the plaintext is shown to the user exactly once.
// ---------------------------------------------------------------------------
export const apiKeys = pgTable(
  'api_keys',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    keyPrefix: text('key_prefix').notNull(), // display only, e.g. "pax_live_a1b2c3de"
    keyHash: text('key_hash').notNull(), // sha256 hex of the full key
    lastUsedAt: timestamp('last_used_at', { withTimezone: true }),
    revokedAt: timestamp('revoked_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    uniqueIndex('api_keys_key_hash_idx').on(t.keyHash),
    index('api_keys_user_id_idx').on(t.userId),
  ],
);

// Monthly Audit-API usage counter per user (for quota + billing). One row per
// (user, YYYY-MM); incremented atomically on each successful audit call.
export const apiUsage = pgTable(
  'api_usage',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    period: text('period').notNull(), // 'YYYY-MM'
    count: integer('count').default(0).notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [uniqueIndex('api_usage_user_period_idx').on(t.userId, t.period)],
);

export const accounts = pgTable(
  'accounts',
  {
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    type: text('type').$type<AdapterAccountType>().notNull(),
    provider: text('provider').notNull(),
    providerAccountId: text('provider_account_id').notNull(),
    refresh_token: text('refresh_token'),
    access_token: text('access_token'),
    expires_at: integer('expires_at'),
    token_type: text('token_type'),
    scope: text('scope'),
    id_token: text('id_token'),
    session_state: text('session_state'),
  },
  (account) => [primaryKey({ columns: [account.provider, account.providerAccountId] })],
);

export const sessions = pgTable('sessions', {
  sessionToken: text('session_token').primaryKey(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  expires: timestamp('expires', { withTimezone: true }).notNull(),
});

export const verificationTokens = pgTable(
  'verification_tokens',
  {
    identifier: text('identifier').notNull(),
    token: text('token').notNull(),
    expires: timestamp('expires', { withTimezone: true }).notNull(),
  },
  (vt) => [primaryKey({ columns: [vt.identifier, vt.token] })],
);

// ---------------------------------------------------------------------------
// Cases
// ---------------------------------------------------------------------------
export const cases = pgTable(
  'cases',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    status: caseStatus('status').default('DRAFT').notNull(),
    providerName: text('provider_name'),
    payerName: text('payer_name'),
    dateOfService: timestamp('date_of_service', { withTimezone: true }),
    totalBilled: money('total_billed'),
    totalPatientResponsibility: money('total_patient_responsibility'),
    estimatedRecoverable: money('estimated_recoverable'),
    notes: text('notes'),
    ...timestamps,
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
  },
  (t) => [index('cases_user_id_idx').on(t.userId)],
);

// ---------------------------------------------------------------------------
// Documents
// ---------------------------------------------------------------------------
export const documents = pgTable(
  'documents',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    caseId: uuid('case_id')
      .notNull()
      .references(() => cases.id, { onDelete: 'cascade' }),
    kind: documentKind('kind').default('OTHER').notNull(),
    blobUrl: text('blob_url'),
    fileName: text('file_name'),
    mimeType: text('mime_type'),
    ingestStatus: ingestStatus('ingest_status').default('PENDING').notNull(),
    rawExtractJson: jsonb('raw_extract_json'),
    pageCount: integer('page_count'),
    ...timestamps,
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
  },
  (t) => [index('documents_case_id_idx').on(t.caseId)],
);

// ---------------------------------------------------------------------------
// Line items
// ---------------------------------------------------------------------------
export const lineItems = pgTable(
  'line_items',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    documentId: uuid('document_id').references(() => documents.id, { onDelete: 'cascade' }),
    caseId: uuid('case_id')
      .notNull()
      .references(() => cases.id, { onDelete: 'cascade' }),
    description: text('description').notNull(),
    cptHcpcsCode: text('cpt_hcpcs_code'),
    revenueCode: text('revenue_code'),
    // EOB adjustment/reason codes for this line, e.g. ["PR-22"] (coordination of
    // benefits) — lets the audit name a denial precisely instead of guessing.
    adjustmentCodes: jsonb('adjustment_codes').$type<string[]>(),
    units: integer('units').default(1).notNull(),
    chargeAmount: money('charge_amount'),
    allowedAmount: money('allowed_amount'),
    planPaid: money('plan_paid'),
    patientResponsibility: money('patient_responsibility'),
    dateOfService: timestamp('date_of_service', { withTimezone: true }),
    sourceConfidence: real('source_confidence').default(1).notNull(),
    ...timestamps,
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
  },
  (t) => [index('line_items_case_id_idx').on(t.caseId), index('line_items_code_idx').on(t.cptHcpcsCode)],
);

// ---------------------------------------------------------------------------
// Plan benefits (used to recompute correct cost-share)
// ---------------------------------------------------------------------------
export const planBenefits = pgTable(
  'plan_benefits',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    caseId: uuid('case_id')
      .notNull()
      .references(() => cases.id, { onDelete: 'cascade' }),
    deductible: money('deductible'),
    deductibleMet: money('deductible_met'),
    coinsuranceRate: real('coinsurance_rate'),
    copay: money('copay'),
    oopMax: money('oop_max'),
    oopMet: money('oop_met'),
    inNetwork: boolean('in_network').default(true).notNull(),
    sourceDocId: uuid('source_doc_id').references(() => documents.id, { onDelete: 'set null' }),
    ...timestamps,
  },
  (t) => [index('plan_benefits_case_id_idx').on(t.caseId)],
);

// ---------------------------------------------------------------------------
// Findings
// ---------------------------------------------------------------------------
export const findings = pgTable(
  'findings',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    caseId: uuid('case_id')
      .notNull()
      .references(() => cases.id, { onDelete: 'cascade' }),
    lineItemId: uuid('line_item_id').references(() => lineItems.id, { onDelete: 'set null' }),
    type: findingType('type').notNull(),
    severity: severity('severity').default('MED').notNull(),
    title: text('title').notNull(),
    explanationPlain: text('explanation_plain').notNull(),
    evidenceJson: jsonb('evidence_json'),
    estimatedRecovery: money('estimated_recovery'),
    confidence: real('confidence').default(0.5).notNull(),
    detector: detector('detector').default('RULE').notNull(),
    status: findingStatus('status').default('OPEN').notNull(),
    modelId: text('model_id'),
    promptVersion: text('prompt_version'),
    ...timestamps,
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
  },
  (t) => [
    index('findings_case_id_idx').on(t.caseId),
    // Supports the hot recompute/dedup/remaining-findings filters (caseId + status).
    index('findings_case_status_idx').on(t.caseId, t.status),
  ],
);

// ---------------------------------------------------------------------------
// Disputes
// ---------------------------------------------------------------------------
export const disputes = pgTable(
  'disputes',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    caseId: uuid('case_id')
      .notNull()
      .references(() => cases.id, { onDelete: 'cascade' }),
    findingIds: jsonb('finding_ids').$type<string[]>().default([]).notNull(),
    target: disputeTarget('target').notNull(),
    channel: disputeChannel('channel').default('MAIL').notNull(),
    letterHtml: text('letter_html'),
    letterPdfUrl: text('letter_pdf_url'),
    status: disputeStatus('status').default('DRAFT').notNull(),
    deadlineAt: timestamp('deadline_at', { withTimezone: true }),
    modelId: text('model_id'),
    promptVersion: text('prompt_version'),
    ...timestamps,
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
  },
  (t) => [index('disputes_case_id_idx').on(t.caseId)],
);

export const disputeEvents = pgTable(
  'dispute_events',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    disputeId: uuid('dispute_id')
      .notNull()
      .references(() => disputes.id, { onDelete: 'cascade' }),
    type: disputeEventType('type').notNull(),
    payloadJson: jsonb('payload_json'),
    occurredAt: timestamp('occurred_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index('dispute_events_dispute_id_idx').on(t.disputeId)],
);

// ---------------------------------------------------------------------------
// Recoveries
// ---------------------------------------------------------------------------
export const recoveries = pgTable(
  'recoveries',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    caseId: uuid('case_id')
      .notNull()
      .references(() => cases.id, { onDelete: 'cascade' }),
    findingId: uuid('finding_id').references(() => findings.id, { onDelete: 'set null' }),
    disputeId: uuid('dispute_id').references(() => disputes.id, { onDelete: 'set null' }),
    amount: money('amount').notNull(),
    kind: recoveryKind('kind').notNull(),
    recoveredAt: timestamp('recovered_at', { withTimezone: true }).defaultNow().notNull(),
    feeRate: real('fee_rate').notNull(),
    feeAmount: money('fee_amount').notNull(),
    notes: text('notes'),
    ...timestamps,
  },
  (t) => [index('recoveries_case_id_idx').on(t.caseId)],
);

// ---------------------------------------------------------------------------
// Benchmarks (the compounding asset)
// ---------------------------------------------------------------------------
export const benchmarks = pgTable(
  'benchmarks',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    cptHcpcsCode: text('cpt_hcpcs_code').notNull(),
    region: text('region').notNull(), // zip3 or state
    sampleSize: integer('sample_size').default(0).notNull(),
    medianCharge: money('median_charge'),
    p25: money('p25'),
    p75: money('p75'),
    source: benchmarkSource('source').default('SEED').notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  // Unique per (code, region) so SEED and AGGREGATE can't create duplicate rows;
  // recompute upserts onto this constraint.
  (t) => [uniqueIndex('benchmarks_code_region_idx').on(t.cptHcpcsCode, t.region)],
);

// ---------------------------------------------------------------------------
// Audit log
// ---------------------------------------------------------------------------
export const auditLog = pgTable(
  'audit_log',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
    entity: text('entity').notNull(),
    entityId: text('entity_id'),
    action: text('action').notNull(),
    diffJson: jsonb('diff_json'),
    at: timestamp('at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index('audit_log_entity_idx').on(t.entity, t.entityId)],
);

// ---------------------------------------------------------------------------
// Rate limits (fixed-window, Postgres-backed abuse protection — no Redis dep)
// ---------------------------------------------------------------------------
export const rateLimits = pgTable('rate_limits', {
  // Namespaced subject, e.g. "ingest:<userId>" or "magic-link:<email>".
  key: text('key').primaryKey(),
  windowStart: timestamp('window_start', { withTimezone: true }).defaultNow().notNull(),
  count: integer('count').default(0).notNull(),
});

// ---------------------------------------------------------------------------
// Relations
// ---------------------------------------------------------------------------
export const usersRelations = relations(users, ({ many }) => ({
  cases: many(cases),
  accounts: many(accounts),
  sessions: many(sessions),
}));

export const casesRelations = relations(cases, ({ one, many }) => ({
  user: one(users, { fields: [cases.userId], references: [users.id] }),
  documents: many(documents),
  lineItems: many(lineItems),
  findings: many(findings),
  disputes: many(disputes),
  recoveries: many(recoveries),
  planBenefits: many(planBenefits),
}));

export const documentsRelations = relations(documents, ({ one, many }) => ({
  case: one(cases, { fields: [documents.caseId], references: [cases.id] }),
  lineItems: many(lineItems),
}));

export const lineItemsRelations = relations(lineItems, ({ one, many }) => ({
  case: one(cases, { fields: [lineItems.caseId], references: [cases.id] }),
  document: one(documents, { fields: [lineItems.documentId], references: [documents.id] }),
  findings: many(findings),
}));

export const planBenefitsRelations = relations(planBenefits, ({ one }) => ({
  case: one(cases, { fields: [planBenefits.caseId], references: [cases.id] }),
}));

export const findingsRelations = relations(findings, ({ one }) => ({
  case: one(cases, { fields: [findings.caseId], references: [cases.id] }),
  lineItem: one(lineItems, { fields: [findings.lineItemId], references: [lineItems.id] }),
}));

export const disputesRelations = relations(disputes, ({ one, many }) => ({
  case: one(cases, { fields: [disputes.caseId], references: [cases.id] }),
  events: many(disputeEvents),
}));

export const disputeEventsRelations = relations(disputeEvents, ({ one }) => ({
  dispute: one(disputes, { fields: [disputeEvents.disputeId], references: [disputes.id] }),
}));

export const recoveriesRelations = relations(recoveries, ({ one }) => ({
  case: one(cases, { fields: [recoveries.caseId], references: [cases.id] }),
  finding: one(findings, { fields: [recoveries.findingId], references: [findings.id] }),
  dispute: one(disputes, { fields: [recoveries.disputeId], references: [disputes.id] }),
}));

// ---------------------------------------------------------------------------
// Inferred types
// ---------------------------------------------------------------------------
export type User = typeof users.$inferSelect;
export type ApiKey = typeof apiKeys.$inferSelect;
export type Case = typeof cases.$inferSelect;
export type NewCase = typeof cases.$inferInsert;
export type Document = typeof documents.$inferSelect;
export type LineItem = typeof lineItems.$inferSelect;
export type NewLineItem = typeof lineItems.$inferInsert;
export type PlanBenefit = typeof planBenefits.$inferSelect;
export type Finding = typeof findings.$inferSelect;
export type NewFinding = typeof findings.$inferInsert;
export type Dispute = typeof disputes.$inferSelect;
export type DisputeEvent = typeof disputeEvents.$inferSelect;
export type Recovery = typeof recoveries.$inferSelect;
export type Benchmark = typeof benchmarks.$inferSelect;

// re-export sql for convenience in queries
export { sql };
