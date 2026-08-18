import { ImageResponse } from 'next/og';

export const alt = 'Paxer: check your medical bills for billing errors';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

/**
 * Social card. Mirrors the site: cream ground, black type, the accent green on
 * the one emphasised word, and the headline the homepage actually uses. The
 * supporting line says something the headline does not — it previously restated
 * it almost verbatim.
 *
 * Set in a system serif-free stack rather than Space Grotesk: satori needs the
 * font binary supplied explicitly, and shipping a webfont fetch into image
 * generation is not worth the failure mode. Weight and tight tracking carry the
 * resemblance.
 */
export default function OpengraphImage() {
  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '72px 80px',
        background: '#F6F4EE',
        color: '#0F0F0F',
        fontFamily: 'Helvetica, Arial, sans-serif',
      }}
    >
      <div style={{ display: 'flex', fontSize: '30px', fontWeight: 700, letterSpacing: '0.1em' }}>
        PAXER
      </div>

      {/* Lines split explicitly: satori treats each span as a flex item, so
          letting it wrap orphaned the accent word onto a line by itself. */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          fontSize: '84px',
          fontWeight: 700,
          letterSpacing: '-0.035em',
          lineHeight: 1.05,
        }}
      >
        <div style={{ display: 'flex' }}>Your medical bill</div>
        <div style={{ display: 'flex' }}>
          <span>might be&nbsp;</span>
          <span style={{ color: '#1D9A64' }}>wrong</span>
        </div>
      </div>

      <div style={{ display: 'flex', fontSize: '28px', color: '#6B6961', maxWidth: '820px' }}>
        Paxer checks a bill against your plan, shows the math, and drafts the dispute letter.
      </div>
    </div>,
    { ...size },
  );
}
