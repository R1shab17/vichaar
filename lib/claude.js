import { HttpError } from './http.js';

const API_URL = 'https://api.anthropic.com/v1/messages';
// Used when no ANTHROPIC_API_KEY is set – runs free on the same Workers AI binding as speech-to-text.
// Gemma 4 won a side-by-side test on Hinglish thoughts (cleaner sutras, right parallels, ~26–110 neurons per call).
const WORKERS_MODEL = '@cf/google/gemma-4-26b-a4b-it';
const WORKERS_FALLBACK = '@cf/meta/llama-3.3-70b-instruct-fp8-fast';

export const usingClaude = (env) => Boolean(env.ANTHROPIC_API_KEY);

/**
 * Returns structured JSON matching `tool.input_schema`.
 * Claude (forced tool call) when ANTHROPIC_API_KEY is set, otherwise Workers AI JSON mode.
 */
export async function callClaudeTool(env, opts) {
  if (usingClaude(env)) return callClaude(env, opts);
  if (env.AI) return callWorkersAI(env, opts);
  throw new HttpError(500, 'No AI configured: add the Workers AI binding "AI" (or an ANTHROPIC_API_KEY secret) to this Pages project.');
}

async function callClaude(env, { system, user, tool, maxTokens = 2000 }) {
  const model = env.CLAUDE_MODEL || 'claude-sonnet-5-5';

  const send = (toolChoice, extraSystem = '') =>
    fetch(API_URL, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model,
        max_tokens: maxTokens,
        system: system + extraSystem,
        tools: [tool],
        tool_choice: toolChoice,
        messages: [{ role: 'user', content: user }],
      }),
    });

  let res = await send({ type: 'tool', name: tool.name });
  if (res.status === 400) {
    const detail = await res.text();
    if (/tool_choice|thinking/i.test(detail)) {
      res = await send({ type: 'auto' }, `\n\nAlways respond by calling the ${tool.name} tool exactly once.`);
    } else {
      throw new HttpError(502, `Claude API error 400: ${detail.slice(0, 300)}`);
    }
  }
  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    const status = res.status === 429 || res.status === 529 ? 503 : 502;
    throw new HttpError(status, `Claude API error ${res.status}: ${detail.slice(0, 300)}`);
  }

  const data = await res.json();
  const block = (data.content || []).find((b) => b.type === 'tool_use' && b.name === tool.name);
  if (block?.input) return block.input;
  const parsed = parseJson((data.content || []).filter((b) => b.type === 'text').map((b) => b.text).join('\n'));
  if (parsed) return parsed;
  throw new HttpError(502, 'Claude did not return a structured answer. Please try again.');
}

// Cloudflare drops requests that take longer than 100 s (HTTP 524), so every answer must land well inside that.
const DEADLINE_MS = 80_000;
const withTimeout = (promise, ms) => Promise.race([
  promise,
  new Promise((_, reject) => setTimeout(() => reject(new Error(`timed out after ${Math.round(ms / 1000)}s`)), ms)),
]);

async function callWorkersAI(env, { system, user, tool, maxTokens = 2000, think = false }) {
  const started = Date.now();
  const messages = [
    { role: 'system', content: `${system}\n\nReply with a single JSON object that matches this schema exactly. No prose, no markdown.\n${JSON.stringify(tool.input_schema)}` },
    { role: 'user', content: user },
  ];
  const format = { response_format: { type: 'json_schema', json_schema: tool.input_schema } };
  const model = env.WORKERS_AI_MODEL || WORKERS_MODEL;
  const gemma = /gemma/i.test(model);
  const thinkBudget = Number(env.THINK_BUDGET_MS) || 40_000;
  const quickBudget = Number(env.QUICK_BUDGET_MS) || 30_000;

  const attempts = [
    // 1. Gemma thinking first (best answers) – or straight to quick mode for search
    {
      budget: gemma && think ? thinkBudget : quickBudget,
      run: () => env.AI.run(model, {
        messages, ...format, temperature: 0.5,
        max_tokens: think ? 6000 : Math.min(maxTokens, 4096),
        ...(gemma && !think ? { chat_template_kwargs: { enable_thinking: false } } : {}),
      }),
    },
    // 2. Same model without thinking (when thinking is slow or runs out of room)
    ...(gemma && think ? [{ budget: quickBudget, run: () => env.AI.run(model, { messages, ...format, temperature: 0.5, max_tokens: 4096, chat_template_kwargs: { enable_thinking: false } }) }] : []),
    // 3. Llama 3.3 as a last resort
    { budget: quickBudget, run: () => env.AI.run(WORKERS_FALLBACK, { messages, ...format, temperature: 0.4, max_tokens: Math.min(maxTokens, 4096) }) },
  ];

  const need = tool.input_schema.required || [];
  let lastError = null;
  for (const attempt of attempts) {
    const remaining = DEADLINE_MS - (Date.now() - started);
    if (remaining < 6_000) break;
    try {
      const parsed = extract(await withTimeout(attempt.run(), Math.min(attempt.budget, remaining)));
      // Accept only answers that actually look like the schema (truncated or chatty replies fall through)
      if (parsed && need.filter((k) => k in parsed).length >= Math.ceil(need.length * 0.7)) return parsed;
    } catch (e) {
      lastError = e;
    }
  }
  throw new HttpError(503, `The AI is busy right now – your thought is saved and will be retried.${lastError ? ` (${String(lastError.message || lastError).slice(0, 120)})` : ''}`);
}

function extract(res) {
  const out = res?.choices?.[0]?.message?.content ?? res?.response ?? res?.result?.response ?? res;
  if (out && typeof out === 'object' && !Array.isArray(out) && !out.choices) return out;
  return parseJson(typeof out === 'string' ? out : '');
}

function parseJson(text) {
  const match = String(text || '').match(/\{[\s\S]*\}/);
  if (!match) return null;
  try { return JSON.parse(match[0]); } catch { return null; }
}
