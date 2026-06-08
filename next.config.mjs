/** @type {import('next').NextConfig} */
const isDev = process.env.NODE_ENV !== 'production';

// Content-Security-Policy. `'unsafe-inline'` is needed for the no-flash theme
// bootstrap script and Next's hydration scripts (a nonce-based CSP via
// middleware is the future hardening step); `'unsafe-eval'` is dev-only (HMR).
// The non-script directives below still meaningfully harden: no plugins, no
// base-tag hijack, no framing, forms only post to us.
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ''}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  "connect-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  ...(isDev ? [] : ['upgrade-insecure-requests']),
].join('; ');

const securityHeaders = [
  { key: 'Content-Security-Policy', value: csp },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  // HSTS is honored only over HTTPS (browsers ignore it on http://localhost).
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), browsing-topics=()' },
];

const nextConfig = {
  reactStrictMode: true,
  serverExternalPackages: ['@react-pdf/renderer'],
  experimental: {
    serverActions: {
      bodySizeLimit: '15mb',
    },
  },
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }];
  },
};

export default nextConfig;
