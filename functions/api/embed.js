import { json, readJson, clip, HttpError } from '../../lib/http.js';
import { embedTexts } from '../../lib/embed.js';

export async function onRequestPost({ request, env }) {
  const body = await readJson(request, 400_000);
  const texts = (Array.isArray(body.texts) ? body.texts : [])
    .map((t) => clip(t, 4000).trim())
    .filter(Boolean)
    .slice(0, 50);
  if (!texts.length) throw new HttpError(400, 'Nothing to embed.');
  const vectors = await embedTexts(env, texts);
  return json({ vectors });
}
