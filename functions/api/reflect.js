import { json, readJson, clip, HttpError } from '../../lib/http.js';
import { callClaudeTool, usingClaude } from '../../lib/claude.js';

const SYSTEM = `You are the editor of a living book of one person's spoken thoughts — and a deeply read historian of ideas across every tradition: Greek and Roman (Heraclitus, Socrates, Plato, Aristotle, Epicurus, Seneca, Epictetus, Marcus Aurelius), Indian (the Upanishads, the Gita, the Buddha, Mahavira, Nagarjuna, Kabir, Tulsidas, Ramana Maharshi, Vivekananda, Tagore, Krishnamurti), Chinese (Laozi, Zhuangzi, Confucius, Mencius), Persian and Sufi (Rumi, Hafiz, Saadi), Abrahamic scripture and mystics, Europe (Montaigne, Spinoza, Pascal, Kant, Kierkegaard, Schopenhauer, Nietzsche, Simone Weil, Camus, Sartre), psychology (William James, Jung, Viktor Frankl) and modern writers.

The author talks freely into a voice recorder, often mixing languages (for example Hindi and English). You receive a raw speech-to-text transcript that may contain recognition errors, filler words, false starts, and asides such as "wait, the recording is on".

Do this:
1. Recover what the author actually meant. Repair obvious recognition errors from context, drop filler and asides. Never add ideas they did not express.
2. Keep their voice. cleaned_original stays in the language(s) they spoke, written naturally: Hindi in Devanagari, English in Latin script, mixed if they mixed.
3. Translate faithfully into the target language.
4. Distil a sutra: one short, memorable aphorism (ideally under 30 words) carrying the core idea in the author's own voice — quotable, like a line from a classic. Give it in the target language (sutra) and in the language the author spoke (sutra_original). If they spoke the target language, the two are identical.
5. Find parallel minds: 2–4 thinkers who reached a related idea, across different traditions where possible. Paraphrase each thinker's idea in your own words. Give the approximate year they expressed it (negative for BCE). Fill "quote" only with a short, real, correctly attributed quotation you are certain of; otherwise leave it as an empty string. Never invent quotations, books or sources. Put the author's own version of the same point beside it ("you"), and say plainly how the two differ.
6. Credit independent discovery. The author reached this thought from their own life, not from a book. Thinkers who said something similar are fellow travellers, not prior owners — never imply the thought is worth less because someone reached it before. Be accurate about who said what and when. In the headline, honour the author's own arrival and name the closest parallel. In your_angle, name precisely what is distinctly the author's: the framing, the image, the application, the context. If it is near-identical to an earlier saying, say so plainly and point to the part that is still theirs.
7. If the transcript holds no real thought (silence, noise, a test, a single word), set is_thought to false and keep other fields minimal.

Voice: speak to the author directly as "you" in essence, headline, your_angle and every difference — never "the author" or "he".
A good sutra is compressed and surprising, often a turn or contrast, e.g. "Fear lives in the future; the present only has room for action." or "Money does not buy respect — only the noise of respect." Avoid flat summaries like "Purpose is about helping others".

Write everything except cleaned_original and sutra_original in the target language. Themes and chapter_hint are always in English, short and lowercase-friendly, so the journal can group them.`;

const TOOL = {
  name: 'save_reflection',
  description: 'Save the edited thought, its translation, aphorism, commentary and parallel minds.',
  input_schema: {
    type: 'object',
    properties: {
      is_thought: { type: 'boolean', description: 'False if the recording contains no real thought.' },
      title: { type: 'string', description: 'A 2–6 word title.' },
      original_language: { type: 'string', description: 'Language(s) the author spoke, e.g. "Hinglish", "Hindi", "English".' },
      cleaned_original: { type: 'string', description: 'The thought in the original language(s), cleaned but faithful.' },
      translation: { type: 'string', description: 'Faithful translation into the target language.' },
      sutra: { type: 'string', description: 'Short quotable aphorism in the target language.' },
      sutra_original: { type: 'string', description: 'The same aphorism in the language the author spoke.' },
      essence: { type: 'string', description: '2–4 sentence commentary: what the idea means and why it matters.' },
      themes: { type: 'array', items: { type: 'string' }, description: '2–5 short English themes, e.g. "purpose", "fear", "work".' },
      chapter_hint: { type: 'string', description: 'Broad English area for a book chapter, e.g. "purpose and meaning".' },
      echoes: {
        type: 'array',
        minItems: 2,
        maxItems: 4,
        items: {
          type: 'object',
          properties: {
            thinker: { type: 'string' },
            tradition: { type: 'string', description: 'e.g. "Stoicism", "Vedanta", "Taoism".' },
            era: { type: 'string', description: 'e.g. "1st c. CE", "c. 500 BCE", "1940s".' },
            idea: { type: 'string', description: 'Their related idea, paraphrased.' },
            you: { type: 'string', description: "The author's own version of the same point, in under 20 words, in the target language." },
            quote: { type: 'string', description: 'A real, certain, short quotation – or an empty string.' },
            year: { type: 'integer', description: 'Approximate year the idea was expressed; negative for BCE.' },
            kinship: { type: 'string', enum: ['close', 'partial', 'contrast'] },
            difference: { type: 'string', description: "How the author's version differs." },
          },
          required: ['thinker', 'tradition', 'era', 'year', 'idea', 'you', 'quote', 'kinship', 'difference'],
        },
      },
      parallel: {
        type: 'object',
        properties: {
          headline: { type: 'string', description: 'One sentence honouring that the author arrived here on their own, naming the closest parallel, e.g. "You reached, on your own, the place Viktor Frankl reached in 1946."' },
          your_angle: { type: 'string', description: "One or two sentences on what is distinctly the author's in this thought." },
        },
        required: ['headline', 'your_angle'],
      },
    },
    required: ['is_thought', 'title', 'original_language', 'cleaned_original', 'translation', 'sutra', 'sutra_original', 'essence', 'themes', 'chapter_hint', 'echoes', 'parallel'],
  },
};

export async function onRequestPost({ request, env }) {
  const body = await readJson(request, 60_000);
  const text = clip(body.text, 20_000).trim();
  if (!text) throw new HttpError(400, 'Nothing to reflect on.');

  const author = clip(body.author, 80) || 'the author';
  const target = clip(body.targetLanguage, 40) || 'English';
  const date = clip(body.date, 60);

  const user = `Author: ${author}\nSpoken on: ${date || 'unknown date'}\nTarget language: ${target}\n\nTranscript:\n"""\n${text}\n"""`;
  const r = await callClaudeTool(env, { system: SYSTEM, user, tool: TOOL, maxTokens: 2500, think: true });

  // Normalise so the client can trust the shape
  const reflection = {
    is_thought: r.is_thought !== false,
    title: clip(r.title, 120),
    original_language: clip(r.original_language, 40),
    cleaned_original: clip(r.cleaned_original, 8000),
    translation: clip(r.translation, 8000),
    sutra: clip(r.sutra, 600),
    sutra_original: clip(r.sutra_original || r.sutra, 600),
    essence: clip(r.essence, 2000),
    themes: (Array.isArray(r.themes) ? r.themes : []).map((t) => clip(t, 40).toLowerCase().trim()).filter(Boolean).slice(0, 6),
    chapter_hint: clip(r.chapter_hint, 80).toLowerCase(),
    echoes: (Array.isArray(r.echoes) ? r.echoes : []).slice(0, 5).map((e) => ({
      thinker: clip(e.thinker, 80),
      tradition: clip(e.tradition, 60),
      era: clip(e.era, 40),
      idea: clip(e.idea, 600),
      you: clip(e.you, 200),
      // Open models misattribute quotations too often – only keep quotes from Claude
      quote: usingClaude(env) ? clip(e.quote, 300) : '',
      kinship: ['close', 'partial', 'contrast'].includes(e.kinship) ? e.kinship : 'partial',
      difference: clip(e.difference, 500),
      year: Number.isFinite(Number(e.year)) ? Math.round(Number(e.year)) : null,
    })),
    parallel: {
      headline: clip(r.parallel?.headline, 300),
      your_angle: clip(r.parallel?.your_angle, 600),
    },
  };
  return json({ reflection });
}
