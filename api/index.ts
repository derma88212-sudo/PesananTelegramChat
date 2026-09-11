import app from '../server.js';
import bootstrapServerless from '../server.js';

// Vercel serverless function entrypoint.
// On a cold start we run a one-time bootstrap (DB seeding + bot webhook setup)
// so the whole application works automatically the moment it is deployed,
// without any manual step. Errors are swallowed so a failed bootstrap never
// breaks API responses (login & panel must always stay reachable).
let bootstrapPromise: Promise<void> | null = null;
function ensureBootstrapped(): Promise<void> {
  if (!bootstrapPromise) {
    bootstrapPromise = bootstrapServerless().catch((err) => {
      console.error('[Vercel Bootstrap] Non-fatal error:', err?.message || err);
    });
  }
  return bootstrapPromise;
}

export default async function handler(req: any, res: any) {
  await ensureBootstrapped();
  return (app as any)(req, res);
}
