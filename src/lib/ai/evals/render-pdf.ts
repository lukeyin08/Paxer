import { createElement as h } from 'react';
import { Document, Page, View, Text, StyleSheet, renderToBuffer } from '@react-pdf/renderer';
import type { Fixture } from './fixtures';

const styles = StyleSheet.create({
  page: { padding: 36, fontSize: 10, fontFamily: 'Helvetica' },
  h1: { fontSize: 16, marginBottom: 4, fontFamily: 'Helvetica-Bold' },
  meta: { marginBottom: 12, color: '#333' },
  row: { flexDirection: 'row', borderBottom: '1 solid #ccc', paddingVertical: 4 },
  head: { flexDirection: 'row', borderBottom: '1.5 solid #000', paddingVertical: 4, fontFamily: 'Helvetica-Bold' },
  cDesc: { width: '46%' },
  cCode: { width: '18%' },
  cCharge: { width: '18%', textAlign: 'right' },
  cResp: { width: '18%', textAlign: 'right' },
});

const usd = (n: number) => `$${n.toFixed(2)}`;

/** Render a synthetic bill/EOB fixture to a PDF buffer for the extraction eval. */
export async function renderFixturePdf(fx: Fixture): Promise<Buffer> {
  const isEob = fx.kind === 'EOB';
  const header = h(
    View,
    { style: styles.head },
    h(Text, { style: styles.cDesc }, 'Description'),
    h(Text, { style: styles.cCode }, 'Code'),
    h(Text, { style: styles.cCharge }, 'Charge'),
    h(Text, { style: styles.cResp }, isEob ? 'Patient Resp' : ''),
  );
  const rows = fx.lines.map((l, i) =>
    h(
      View,
      { style: styles.row, key: String(i) },
      h(Text, { style: styles.cDesc }, l.description),
      h(Text, { style: styles.cCode }, l.cptHcpcsCode ?? ''),
      h(Text, { style: styles.cCharge }, usd(l.charge)),
      h(Text, { style: styles.cResp }, l.patientResponsibility != null ? usd(l.patientResponsibility) : ''),
    ),
  );

  const doc = h(
    Document,
    null,
    h(
      Page,
      { size: 'A4', style: styles.page },
      h(Text, { style: styles.h1 }, isEob ? 'Explanation of Benefits' : 'Itemized Statement'),
      h(
        Text,
        { style: styles.meta },
        `Provider: ${fx.providerName}${fx.payerName ? `   Payer: ${fx.payerName}` : ''}\nDate of service: ${fx.dateOfService}`,
      ),
      header,
      ...rows,
    ),
  );

  return renderToBuffer(doc) as unknown as Promise<Buffer>;
}
