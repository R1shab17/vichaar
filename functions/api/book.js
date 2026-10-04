import { json, readJson, clip, HttpError } from '../../lib/http.js';
import { callClaudeTool } from '../../lib/claude.js';

const SYSTEM = `You are compiling one person's spoken aphorisms ("sutras") into a beautifully ordered book of personal wisdom, in the spirit of the great dialogue- and verse-scriptures — but it is entirely their own book.
- Group the verses into chapters by idea. Use between 2 and 18 chapters, never more than 18; fewer for a small collection. Every verse id must appear in exactly one chapter.
- Order verses inside each chapter so the ideas build on one another. Order chapters so the book moves from the self, through struggle and action, toward meaning.
- Chapter names are short and evocative but clear, e.g. "The Way of Work", "On Fear", "Of Purpose". Subtitles are one short line.
- Each chapter intro is 1–3 sentences, written by an editor who respects the author.
- The preface (90–160 words) introduces the author's way of thinking, drawing only on the verses. The closing is one or two sentences.
- Never name the book after an existing scripture, never claim religious authority, never invent sayings.
- Write all prose in the requested language. If a title is supplied, return it unchanged.`;

const TOOL = {
  name: 'compose_book',
  description: 'Return the structure and editorial text of the book.',
  input_schema: {
    type: 'object',
    properties: {
      title: { type: 'string' },
      subtitle: { type: 'string' },
      preface: { type: 'string' },
      chapters: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            subtitle: { type: 'string' },
            intro: { type: 'string' },
            verse_ids: { type: 'array', items: { type: 'string' } },
          },
          required: ['name', 'subtitle', 'intro', 'verse_ids'],
        },
      },
      closing: { type: 'string' },
    },
    required: ['title', 'subtitle', 'preface', 'chapters', 'closing'],
  },
};

export async function onRequestPost({ request, env }) {
  const body = await readJson(request, 600_000);
  const verses = (Array.isArray(body.verses) ? body.verses : []).slice(0, 500);
  if (verses.length < 2) throw new HttpError(400, 'Record a few more thoughts before compiling the book.');

  const author = clip(body.author, 80) || 'the author';
  const lines = verses
    .map((v) => `${clip(v.id, 12)} | ${clip(v.date, 30)} | ${clip(v.theme, 60)} | ${clip(v.sutra, 400)}`)
    .join('\n');
  const user = `Author: ${author}\nBook title: ${clip(body.title, 120) || '(suggest one, e.g. "The Sutras of ' + author.split(' ')[0] + '")'}\nLanguage: ${clip(body.language, 40) || 'English'}\n\nVerses (id | date | theme | sutra):\n${lines}`;

  const r = await callClaudeTool(env, { system: SYSTEM, user, tool: TOOL, maxTokens: 8000, think: true });

  const valid = new Set(verses.map((v) => String(v.id)));
  const used = new Set();
  const chapters = (Array.isArray(r.chapters) ? r.chapters : []).slice(0, 18).map((c) => ({
    name: clip(c.name, 80),
    subtitle: clip(c.subtitle, 160),
    intro: clip(c.intro, 800),
    verse_ids: (Array.isArray(c.verse_ids) ? c.verse_ids : [])
      .map(String)
      .filter((id) => valid.has(id) && !used.has(id) && used.add(id)),
  })).filter((c) => c.verse_ids.length);

  return json({
    book: {
      title: clip(r.title, 120),
      subtitle: clip(r.subtitle, 200),
      preface: clip(r.preface, 2000),
      chapters,
      closing: clip(r.closing, 600),
    },
  });
}
