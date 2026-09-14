import app from '../server';

let bootstrapPromise: Promise<void> | null = null;

function ensureBootstrapped(req?: any, res?: any): Promise<void> {
  if (!bootstrapPromise) {
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

  // Meneruskan request ke Express app yang ada di server.ts
  return app(req, res);
}
