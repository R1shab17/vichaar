import { json } from '../../lib/http.js';

export function onRequestGet({ env }) {
  return json({
    ok: true,
    speech: Boolean(env.AI),
    claude: Boolean(env.ANTHROPIC_API_KEY),
    brain: env.ANTHROPIC_API_KEY ? 'claude' : env.AI ? 'workers-ai' : null,
    locked: Boolean(env.ACCESS_CODE),
  });
}
