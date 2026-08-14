import { ImageResponse } from 'next/og';

export const alt = 'Paxer: the advocate on the patient’s side of the bill';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

// Plain social-share card: white ground, black type, one rule. No mark, no fill.
export default function OpengraphImage() {
  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '80px',
        background: '#ffffff',
        color: '#1a1a1a',
        fontFamily: 'Helvetica, Arial, sans-serif',
      }}
    >
      <div style={{ display: 'flex', fontSize: '40px', fontWeight: 700 }}>Paxer</div>
      <div
        style={{
          display: 'flex',
          marginTop: '24px',
          paddingTop: '32px',
          borderTop: '2px solid #1a1a1a',
          fontSize: '56px',
          fontWeight: 700,
          lineHeight: 1.15,
          maxWidth: '960px',
        }}
      >
        The advocate on the patient’s side of the bill.
      </div>
      <div
        style={{
          display: 'flex',
          marginTop: '28px',
          fontSize: '28px',
          color: '#595959',
          maxWidth: '900px',
        }}
      >
        Audit your medical bills, find the errors, and get your own money back.
      </div>
    </div>,
    { ...size },
  );
}
