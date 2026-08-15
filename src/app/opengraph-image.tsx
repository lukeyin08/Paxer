import { ImageResponse } from 'next/og';

export const alt = 'Paxer: check your medical bills for billing errors';
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
        background: '#FBFAF7',
        color: '#1A1A18',
        fontFamily: 'Helvetica, Arial, sans-serif',
      }}
    >
      <div style={{ display: 'flex', fontSize: '40px', fontWeight: 700, color: '#1E5138' }}>
        Paxer
      </div>
      <div
        style={{
          display: 'flex',
          marginTop: '24px',
          paddingTop: '32px',
          borderTop: '2px solid #1E5138',
          fontSize: '56px',
          fontWeight: 700,
          lineHeight: 1.15,
          maxWidth: '960px',
        }}
      >
        Check your medical bills for billing errors.
      </div>
      <div
        style={{
          display: 'flex',
          marginTop: '28px',
          fontSize: '28px',
          color: '#57554E',
          maxWidth: '900px',
        }}
      >
        Check your medical bills against your insurance plan for billing errors.
      </div>
    </div>,
    { ...size },
  );
}
