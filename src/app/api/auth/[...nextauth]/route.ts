import { handlers } from '@/lib/auth/config';

// Auth.js route handlers. Node runtime (DB + crypto).
export const runtime = 'nodejs';
export const { GET, POST } = handlers;
