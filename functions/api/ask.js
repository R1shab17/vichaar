import { json, readJson, clip, HttpError } from '../../lib/http.js';
import { callClaudeTool } from '../../lib/claude.js';

const SYSTEM = `You help a person search the journal of thoughts they have spoken aloud over time.
Answer their question using ONLY the journal entries provided. Each entry has an id and the date it was spoken.
- Speak to the author as "you". Mention when they said things ("On 12 August you said…"), and how their view developed if it changed.
- If no entry genuinely addresses the question, say so honestly in one or two sentences and set has_spoken to false. Do not stretch loosely related entries to fit.
- Answer in the same language as the question. Keep it under 120 words. No preamble.
- List the entries you relied on in matches, most relevant first.`;

const TOOL = {
  name: 'answer_from_journal',
  description: 'Answer the question from the journal entries.',
  input_schema: {
    type: 'object',
    properties: {
      has_spoken: { type: 'boolean', description: 'True if at least one entry addresses the question.' },
      answer: { type: 'string' },
      matches: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            relevance: { type: 'string', enum: ['direct', 'related'] },
          },
          required: ['id', 'relevance'],
        },
      },
    },
    required: ['has_spoken', 'answer', 'matches'],
  },
};

export async function onRequestPost({ request, env }) {
  const body = await readJson(request, 300_000);
  const question = clip(body.question, 500).trim();
  if (!question) throw new HttpError(400, 'Ask a question first.');
  const entries = (Array.isArray(body.entries) ? body.entries : []).slice(0, 80);
  if (!entries.length) {
    return json({ has_spoken: false, answer: '', matches: [] });
  }

  const journal = entries
    .map((e) => `[${clip(e.id, 20)}] ${clip(e.date, 40)} — ${clip(e.title, 120)}\nSutra: ${clip(e.sutra, 400)}\nSaid: ${clip(e.text, 900)}`)
    .join('\n\n');
  const user = `Author: ${clip(body.author, 80) || 'the author'}\n\nJournal entries:\n${journal}\n\nQuestion: ${question}`;

  const r = await callClaudeTool(env, { system: SYSTEM, user, tool: TOOL, maxTokens: 900, think: false });
  const ids = new Set(entries.map((e) => String(e.id)));
  return json({
    has_spoken: Boolean(r.has_spoken),
    answer: clip(r.answer, 2000),
    matches: (Array.isArray(r.matches) ? r.matches : [])
      .filter((m) => ids.has(String(m.id)))
      .map((m) => ({ id: String(m.id), relevance: m.relevance === 'direct' ? 'direct' : 'related' })),
  });
}
