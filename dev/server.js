// Local mock server: serves /public and runs the REAL Pages Functions in /functions
// with fake Workers AI + fake Claude, so the full app can be tried with no keys.
//   node dev/server.js   →  http://localhost:8788
import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { join, extname, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { REFLECTIONS, VOICE_TRANSCRIPT } from './mock-data.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const PUBLIC = join(ROOT, 'public');
const PORT = Number(process.env.PORT || 8788);
const FAST = process.env.FAST === '1';
const wait = (ms) => new Promise((r) => setTimeout(r, FAST ? Math.min(ms, 60) : ms));
export const stats = { transcribe: [], reflect: 0, embed: 0, ask: 0, book: 0, toolChoiceFallbacks: 0 };

/* ── fake Workers AI ── */
const CONCEPTS = {
  purpose: ['purpose', 'मकसद', 'मक़सद', 'meaning', 'जीवन', 'life', 'goal', 'why', 'service', 'identity'],
  fear: ['fear', 'डर', 'afraid', 'courage', 'anxiety', 'action'],
  money: ['money', 'पैसा', 'paisa', 'पैसों', 'wealth', 'respect', 'इज़्ज़त', 'status', 'rich'],
  self: ['self', 'खुद', 'yourself', 'understand', 'approval', 'knowledge', 'समझ'],
  work: ['work', 'worship', 'attention', 'काम', 'job', 'devotion', 'discipline', 'habit'],
  death: ['die', 'death', 'मरते', 'mortality', 'time', 'living', 'live'],
  love: ['love', 'lonely', 'loneliness', 'seen', 'people', 'प्यार', 'recognition'],
};
function fakeVector(text) {
  const v = new Array(64).fill(0);
  const words = String(text).toLowerCase().split(/[^\p{L}\p{M}\p{N}]+/u).filter(Boolean);
  const keys = Object.keys(CONCEPTS);
  for (const w of words) {
    keys.forEach((k, i) => { if (CONCEPTS[k].some((c) => w.startsWith(c) || c.startsWith(w) && w.length > 3)) v[i] += 3; });
    let h = 0; for (const ch of w) h = (h * 31 + ch.codePointAt(0)) >>> 0;
    v[8 + (h % 56)] += 0.35;
  }
  return v;
}
const AI = {
  async run(model, input) {
    if (model.includes('whisper')) {
      const buf = Buffer.from(input.audio, 'base64');
      stats.transcribe.push({ bytes: buf.length, header: buf.subarray(0, 4).toString('latin1'), language: input.language, prompt: !!input.initial_prompt });
      await wait(1200);
      return { text: VOICE_TRANSCRIPT, transcription_info: { language: 'hi', duration: 6 }, word_count: 30 };
    }
    if (model.includes('bge-m3')) {
      stats.embed++;
      await wait(250);
      return { data: input.text.map(fakeVector), shape: [input.text.length, 64] };
    }
    if (model.includes('llama') || model.includes('gemma')) {
      stats.workersLLM = (stats.workersLLM || 0) + 1;
      const props = input.response_format?.json_schema?.properties || {};
      const tool = props.sutra ? 'save_reflection' : props.has_spoken ? 'answer_from_journal' : props.chapters ? 'compose_book' : null;
      const user = input.messages.find((m) => m.role === 'user').content;
      stats.models = { ...(stats.models || {}), [model]: ((stats.models || {})[model] || 0) + 1 };
      stats.thinking = (stats.thinking || 0) + (input.chat_template_kwargs ? 0 : 1);
      if (process.env.SLOW_THINK && model.includes('gemma') && !input.chat_template_kwargs) await new Promise((r) => setTimeout(r, Number(process.env.SLOW_THINK)));
      const result = await mockTool(tool, user);
      return model.includes('gemma') ? { choices: [{ message: { content: JSON.stringify(result) } }] } : { response: result };
    }
    throw new Error(`Unknown model ${model}`);
  },
};

async function mockTool(tool, user) {
  let input;
  if (tool === 'save_reflection') {
    stats.reflect++;
    await wait(1600);
    const transcript = user.split('"""')[1] || '';
    const hit = REFLECTIONS.find((x) => x.match.test(transcript));
    input = hit ? hit.r : {
      is_thought: true, title: 'A Passing Thought', original_language: 'English', cleaned_original: transcript.trim(), translation: transcript.trim(),
      sutra: transcript.trim().split(/[.!?।]/)[0].slice(0, 140), sutra_original: transcript.trim().split(/[.!?।]/)[0].slice(0, 140),
      essence: 'A thought worth returning to.', themes: ['reflection'], chapter_hint: 'reflections', echoes: [], parallel: { headline: 'A thought of your own.', your_angle: 'Mock reflection.' },
    };
  } else if (tool === 'answer_from_journal') {
    stats.ask++;
    await wait(1200);
    const q = user.split('Question:').pop();
    const qv = fakeVector(q);
    const entries = [...user.matchAll(/\[(e\d+)\] ([^—]+) — ([^\n]+)\nSutra: ([^\n]+)\nSaid: ([^\n]*)/g)].map((m) => ({ id: m[1], date: m[2].trim(), title: m[3], text: m[4] + ' ' + m[5] }));
    const scored = entries.map((e) => { const v = fakeVector(e.text); return { e, s: v.slice(0, 8).reduce((a, x, i) => a + x * qv[i], 0) }; }).filter((x) => x.s > 0).sort((a, b) => b.s - a.s);
    if (!scored.length) input = { has_spoken: false, answer: 'You haven’t spoken about this yet. It might be worth a thought of its own.', matches: [] };
    else {
      const top = scored[0].e;
      input = { has_spoken: true, answer: `Yes. On ${top.date} you said ${top.text.split(' Said:')[0].replace(/\s+$/, '')} — you tie it to people rather than position, and you have come back to the idea of living for others more than once.`, matches: scored.slice(0, 2).map((x, i) => ({ id: x.e.id, relevance: i === 0 ? 'direct' : 'related' })) };
    }
  } else if (tool === 'compose_book') {
    stats.book++;
    await wait(2200);
    const verses = [...user.matchAll(/^(v\d+) \| ([^|]+) \| ([^|]*) \| (.+)$/gm)].map((m) => ({ id: m[1], theme: m[3].trim() }));
    const groups = [
      { name: 'Of the Self', subtitle: 'Where every journey starts', intro: 'Before the world, the one who walks in it.', match: /self|knowing|time|mortality/ },
      { name: 'The Way of Work', subtitle: 'Effort, attention and fear', intro: 'On doing — and on what doing quiets.', match: /work|fear|courage|discipline/ },
      { name: 'Of Others and Worth', subtitle: 'Love, respect and purpose', intro: 'What we are for, and for whom.', match: /love|money|worth|purpose|meaning/ },
    ];
    const chapters = groups.map((g) => ({ name: g.name, subtitle: g.subtitle, intro: g.intro, verse_ids: verses.filter((v) => g.match.test(v.theme)).map((v) => v.id) }));
    input = {
      title: 'The Sutras of Rishab',
      subtitle: 'Thoughts spoken aloud, kept for good',
      preface: 'These verses were not written at a desk. They were spoken — on walks, between tasks, late at night — and caught before they could slip away.\n\nRead them slowly. Some echo voices thousands of years old; a few are entirely their author’s own.',
      chapters,
      closing: 'The book is unfinished, as long as its author keeps thinking.',
    };
  }
  return input;
}

/* ── fake Claude (intercepts fetch to api.anthropic.com) ── */
const realFetch = globalThis.fetch;
let forceFallbackOnce = process.env.TEST_TOOL_FALLBACK === '1';
globalThis.fetch = async (url, init) => {
  if (!String(url).startsWith('https://api.anthropic.com')) return realFetch(url, init);
  const body = JSON.parse(init.body);
  if (forceFallbackOnce && body.tool_choice?.type === 'tool') {
    forceFallbackOnce = false;
    return new Response(JSON.stringify({ type: 'error', error: { type: 'invalid_request_error', message: 'tool_choice forced is not supported with thinking' } }), { status: 400 });
  }
  if (body.tool_choice?.type === 'auto') stats.toolChoiceFallbacks++;
  const tool = body.tools[0].name;
  const input = await mockTool(tool, body.messages[0].content);
  return new Response(JSON.stringify({ content: [{ type: 'tool_use', id: 'toolu_mock', name: tool, input }] }), { status: 200, headers: { 'content-type': 'application/json' } });
};

/* ── run Pages Functions ── */
const env = { AI, ...(process.env.THINK_BUDGET_MS ? { THINK_BUDGET_MS: process.env.THINK_BUDGET_MS } : {}), ...(process.env.NO_CLAUDE ? {} : { ANTHROPIC_API_KEY: 'mock-key' }), CLAUDE_MODEL: 'mock', ...(process.env.ACCESS_CODE ? { ACCESS_CODE: process.env.ACCESS_CODE } : {}) };
const middleware = await import(pathToFileURL(join(ROOT, 'functions/api/_middleware.js')));

async function runFunction(req, url, bodyBuf) {
  const name = url.pathname.replace(/^\/api\//, '').replace(/\/$/, '');
  if (!/^[a-z]+$/.test(name)) return new Response('Not found', { status: 404 });
  let mod;
  try { mod = await import(pathToFileURL(join(ROOT, 'functions/api', `${name}.js`))); } catch { return new Response('Not found', { status: 404 }); }
  const request = new Request(url, { method: req.method, headers: req.headers, body: ['GET', 'HEAD'].includes(req.method) ? undefined : bodyBuf });
  const handler = req.method === 'GET' ? mod.onRequestGet : mod.onRequestPost;
  return middleware.onRequest({ request, env, next: async () => (handler ? handler({ request, env }) : new Response('Method not allowed', { status: 405 })) });
}

const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.png': 'image/png', '.svg': 'image/svg+xml', '.woff2': 'font/woff2' };

http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  try {
    if (url.pathname.startsWith('/api/')) {
      const chunks = [];
      for await (const c of req) chunks.push(c);
      const out = await runFunction(req, url, Buffer.concat(chunks));
      res.writeHead(out.status, Object.fromEntries(out.headers));
      res.end(Buffer.from(await out.arrayBuffer()));
      return;
    }
    if (url.pathname === '/__stats') { res.writeHead(200, { 'content-type': 'application/json' }); res.end(JSON.stringify(stats)); return; }
    let path = join(PUBLIC, decodeURIComponent(url.pathname));
    if (!path.startsWith(PUBLIC)) throw new Error('bad path');
    if ((await stat(path).catch(() => null))?.isDirectory()) path = join(path, 'index.html');
    const data = await readFile(path).catch(() => null);
    if (!data) { res.writeHead(404); res.end('Not found'); return; }
    res.writeHead(200, { 'content-type': TYPES[extname(path)] || 'application/octet-stream', 'cache-control': 'no-store' });
    res.end(data);
  } catch (e) {
    console.error(e);
    res.writeHead(500); res.end(String(e));
  }
}).listen(PORT, () => console.log(`Vichaar mock server → http://localhost:${PORT}`));
