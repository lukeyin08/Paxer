import { ImageResponse } from 'next/og';

export const alt = 'Paxer: the advocate on the patient’s side of the bill';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

// Branded social-share card (dark theme, blue "P" mark + wordmark + tagline).
export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '80px',
          background: '#0a0e14',
          color: '#e6eaf0',
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          <div
            style={{
              width: '88px',
              height: '88px',
              borderRadius: '22px',
              background: '#3b82f6',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '60px',
              fontWeight: 700,
              color: '#ffffff',
            }}
          >
            P
          </div>
          <div style={{ fontSize: '64px', fontWeight: 700, letterSpacing: '-0.02em' }}>Paxer</div>
        </div>
        <div
          style={{
            marginTop: '40px',
            fontSize: '52px',
            fontWeight: 600,
            letterSpacing: '-0.02em',
            lineHeight: 1.1,
            maxWidth: '900px',
          }}
        >
          The advocate on the patient’s side of the bill.
        </div>
        <div style={{ marginTop: '28px', fontSize: '28px', color: '#8a94a3', maxWidth: '880px' }}>
          Audit your medical bills, find the errors, and get your own money back.
        </div>
      </div>
    ),
    { ...size },
  );
}
