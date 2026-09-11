import * as server from '../server';

// Vercel serverless function entrypoint.
// On a cold start we run a one-time bootstrap (DB seeding + bot webhook setup)
// so the whole application works automatically the moment it is deployed,
// without any manual step. Errors are swallowed so a failed bootstrap never
// breaks API responses (login & panel must always stay reachable).
let bootstrapPromise: Promise<void> | null = null;

function ensureBootstrapped(req?: any, res?: any): Promise<void> {
  if (!bootstrapPromise) {
    // Memeriksa apakah ada fungsi bootstrapServerless yang ditempelkan ke app
    // atau jika app/server.js itu sendiri berupa fungsi bootstrap.
    const bootstrapFn = (app as any)?.bootstrapServerless || (typeof app === 'function' ? app : null);

    if (typeof bootstrapFn === 'function') {
      bootstrapPromise = Promise.resolve()
        .then(() => bootstrapFn(req, res))
        .then(() => {})
        .catch((err) => {
          console.error('[Vercel Bootstrap] Non-fatal error:', err?.message || err);
        });
    } else {
      bootstrapPromise = Promise.resolve();
    }
  }
  return bootstrapPromise;
}

export default async function handler(req: any, res: any) {
  await ensureBootstrapped(req, res);
  return (app as any)(req, res);
}
