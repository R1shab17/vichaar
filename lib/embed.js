import { HttpError, requireAI } from './http.js';

const MODEL = '@cf/baai/bge-m3'; // multilingual: a Hindi question finds an English thought and vice versa

function extractVectors(res) {
  const v = res?.data ?? res?.response ?? res?.result?.data;
  if (Array.isArray(v) && Array.isArray(v[0]) && typeof v[0][0] === 'number') return v;
  return null;
}

export async function embedTexts(env, texts) {
  requireAI(env);
  let vectors = null;
  try {
    vectors = extractVectors(await env.AI.run(MODEL, { text: texts }));
  } catch { /* try the other input shape */ }
  if (!vectors) {
    vectors = extractVectors(await env.AI.run(MODEL, { contexts: texts.map((text) => ({ text })) }));
  }
  if (!vectors || vectors.length !== texts.length) throw new HttpError(502, 'Unexpected response from the embedding model.');
  // Round to keep payloads small – cosine similarity is unaffected in practice
  return vectors.map((vec) => vec.map((x) => Math.round(x * 1e5) / 1e5));
}
