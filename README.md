# Vichaar — your book of thoughts

**Live:** https://vichaar.rishabchoudhary.com

Speak a thought in any language (Hindi, English, Hinglish…). Vichaar:

1. **Records** it (works offline — nothing is ever lost, it processes when you're back online)
2. **Transcribes + translates** it (Whisper on Cloudflare Workers AI, then an LLM cleans it up)
3. **Distils a quotable sutra**, signed and dated: *"— Rishab Choudhary, 3 October 2026"*
4. **The Revelation** — when a thought is distilled, the screen blooms with light and your sutra writes itself in, word by word (with a soft singing-bowl chime)
5. **Parallel Minds** — the thinkers who reached a similar truth (Frankl, Seneca, the Gita, Laozi…), shown side by side with your version on a timeline across centuries. Independent discovery gets full credit: they're fellow travellers, not prior owners. It still tells you plainly who got there first, and names what is **yours alone**
6. **Lets you ask your past self** — "क्या मैंने कभी जीवन के मकसद के बारे में बोला है?" — searched by meaning, across languages
7. **Compiles your own scripture-style book** — chapters, numbered verses (2.14), preface, commentary; save as PDF or download
8. **Makes shareable quote images** for Instagram/WhatsApp

It installs to the iPhone/Android home screen and runs full-screen like a native app.

---

## Deploy

**Every push to `main` deploys automatically** — the Cloudflare Pages project `vichaar` is connected to this repo.

| Pages build setting | Value |
|---|---|
| Framework preset | None |
| Build command | *(empty)* |
| Build output directory | `public` |
| Root directory | `/` |

`functions/` is compiled by Pages on every build, and the Workers AI binding (`AI`) comes from `wrangler.toml`.

**Which AI does the thinking**
- **Default — free:** Google **Gemma 4** (`@cf/google/gemma-4-26b-a4b-it`) on Workers AI, inside the free 10,000 neurons/day. Thoughts and the book use Gemma's thinking mode with a 40 s budget, then fall back to its fast mode, then Llama 3.3 — so every answer lands inside Cloudflare's 100 s request limit. Quotes are not shown in this mode (open models misattribute them).
- **Optional — Claude:** add an `ANTHROPIC_API_KEY` secret (Settings → Variables and secrets), then push any commit. Vichaar switches to Claude automatically and shows real quotes. Model: `CLAUDE_MODEL` in `wrangler.toml`.
- Override the free model with a `WORKERS_AI_MODEL` variable.

Optional: an `ACCESS_CODE` secret locks the API to people who know the code.

**Check it:** open the site → ⚙ Settings → a green **Connected · thinking with …** line.

### Install on iPhone
Open the site in Safari → Share (on newer iOS: ••• → Share) → **Add to Home Screen** → Add. The app shows these steps itself on first launch.

---

## Try it locally

**No keys needed (fake AI responses, real app + real server code):**
```bash
npm run mock        # → http://localhost:8788
```

**With real AI** (uses your Cloudflare account's Workers AI):
```bash
npx wrangler login
npx wrangler pages dev
```

---

## Costs

On the default setup: **£0**. Everything runs inside Workers AI's free 10,000 neurons per day.

| Step | Model | Neurons (approx.) | Free per day |
|---|---|---|---|
| Speech-to-text | Whisper large-v3-turbo | tiny | hundreds of minutes |
| Reflection + parallel minds | Gemma 4 (thinking) | ~110 | ~90 thoughts |
| Search answer | Gemma 4 (fast) | ~26 | ~380 questions |
| Search vectors | bge-m3 | negligible | — |

With Claude instead: roughly 0.5p (Haiku 4.5) to 1.5p (Sonnet 5.5) per thought.

---

## Things to know

- **Data lives on each device** (IndexedDB) — private, no accounts, works offline. It does **not** sync between phone and laptop. Use ⚙ → Export backup / Import backup to move it. Installing to the Home Screen also protects it from Safari's storage clean-up.
- **If you share it widely**, everyone shares your free daily Workers AI allowance (and your credits, if Claude is on). Set `ACCESS_CODE`, or add Cloudflare rate limiting, if that becomes a problem.
- Recordings are capped at 5 minutes. On the Workers **Free** plan very long recordings may hit the per-request CPU limit; Workers Paid ($5/mo) removes that.
- Quotes: only shown when Claude is on, and Claude is told to quote only when certain. Treat them as "check before publishing".
- After a deploy, phones pick up the new version on the next launch or two. Bump `VERSION` in `public/sw.js` (and `app.js`) with each release. The service worker always revalidates with the server, so the domain's browser-cache TTL can't pin people to old files.

---

## Files

```
public/            the app (static, no build step)
  index.html       shell + all screens
  styles.css       design, motion, print styles
  app.js           recording, offline queue, journal, search, book, quote cards
  sw.js            offline + instant start
  manifest.webmanifest, icons/, splash/, fonts/ (self-hosted)
functions/api/     Cloudflare Pages Functions (the server)
  transcribe.js    audio → text (Whisper)
  reflect.js       text → sutra, translation, parallel minds  ← prompts live here
  embed.js         meaning vectors for search (bge-m3, multilingual)
  ask.js           "have I ever said…" answers
  book.js          chapters, preface, ordering
  _middleware.js   access code + error handling
lib/               shared server helpers (claude.js: Claude ↔ Gemma 4 ↔ Llama routing + time budget)
dev/               local mock server + sample data
film/              the hero + reveal films (frame-by-frame HTML, original score, renderer)
```

## Re-rendering the films

The films are HTML pages that use the app's real stylesheet, rendered frame by frame:

```bash
python3 -m http.server 8790            # from the project root
python3 film/audio.py hero hero.wav    # or: reveal reveal.wav
python3 film/render.py hero en hero.wav Vichaar-Hero-English.mp4   # v = hero|reveal, lang = en|hi
```
Preview any moment in a browser: `http://127.0.0.1:8790/film/film.html?v=reveal&lang=hi`, then `render(42)` in the console. All captions live in the `TXT` block at the top of `film/film.js`.

---

Fonts: Cormorant Garamond, Inter and Tiro Devanagari Hindi, self-hosted under the SIL Open Font License.
