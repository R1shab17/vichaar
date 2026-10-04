import { json, readJson, clip, HttpError, requireAI } from '../../lib/http.js';

// ~5 minutes of 16 kHz mono WAV, base64-encoded
const MAX_CHARS = 14_500_000;

// Hints that help Whisper with code-mixed speech
const HINTS = {
  'hi-en': { language: 'hi', prompt: 'यह एक personal thought है, जिसमें Hindi और English mixed हैं। Life, purpose, philosophy.' },
  'pa-en': { language: 'pa', prompt: 'Punjabi and English mixed speech about life and philosophy.' },
  'ur-en': { language: 'ur', prompt: 'Urdu and English mixed speech about life and philosophy.' },
};

export async function onRequestPost({ request, env }) {
  requireAI(env);
  const body = await readJson(request, MAX_CHARS);
  const audio = typeof body.audio === 'string' ? body.audio : '';
  if (audio.length < 200) throw new HttpError(400, 'No audio received.');

  const input = {
    audio,
    task: 'transcribe',
    vad_filter: true,
    condition_on_previous_text: false,
  };
  const lang = clip(body.language, 10);
  if (HINTS[lang]) {
    input.language = HINTS[lang].language;
    input.initial_prompt = HINTS[lang].prompt;
  } else if (lang && lang !== 'auto') {
    input.language = lang;
  }

  const res = await env.AI.run('@cf/openai/whisper-large-v3-turbo', input);
  const text = String(res?.text || '').replace(/\s+/g, ' ').trim();

  return json({
    text,
    language: res?.transcription_info?.language || input.language || null,
    duration: res?.transcription_info?.duration ?? null,
  });
}
