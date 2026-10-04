export class HttpError extends Error {
  constructor(status, message, code) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
    },
  });
}

export async function readJson(request, maxChars = 200_000) {
  const text = await request.text();
  if (text.length > maxChars) throw new HttpError(413, 'That recording is too long. Try a shorter thought.');
  try {
    return JSON.parse(text || '{}');
  } catch {
    throw new HttpError(400, 'Invalid JSON body');
  }
}

export const clip = (value, max) => (typeof value === 'string' ? value : value == null ? '' : String(value)).slice(0, max);

export function requireAI(env) {
  if (!env.AI) throw new HttpError(500, 'Workers AI binding "AI" is not configured on this Pages project.');
}

// Constant-time-ish string compare for the access code
export function safeEqual(a, b) {
  a = String(a || '');
  b = String(b || '');
  let diff = a.length ^ b.length;
  const len = Math.max(a.length, b.length);
  for (let i = 0; i < len; i++) diff |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  return diff === 0;
}
