import { json, HttpError, safeEqual } from '../../lib/http.js';

export async function onRequest({ request, env, next }) {
  const url = new URL(request.url);
  const isHealth = url.pathname.endsWith('/api/health');

  if (env.ACCESS_CODE && !isHealth) {
    const code = request.headers.get('x-access-code') || '';
    if (!safeEqual(code, env.ACCESS_CODE)) {
      return json({ error: 'This Vichaar server needs an access code. Add it in Settings.', code: 'ACCESS' }, 401);
    }
  }

  try {
    return await next();
  } catch (err) {
    console.error('[vichaar]', err);
    const status = err instanceof HttpError ? err.status : 500;
    return json({ error: err?.message || 'Something went wrong', code: err?.code }, status);
  }
}
