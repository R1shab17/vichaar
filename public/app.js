/* Vichaar — speak a thought, keep it forever.
   Single-file app logic. No build step, no dependencies. */

const VERSION = '1.2.2';
const MAX_SECONDS = 300; // 5 minutes per thought

/* ───────────── helpers ───────────── */
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const uid = () => (crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const clip = (s, n) => { s = String(s || ''); return s.length > n ? s.slice(0, n - 1).trimEnd() + '…' : s; };
const norm = (s) => String(s || '').toLowerCase().replace(/[^\p{L}\p{M}\p{N}]+/gu, ' ').trim();
const hasDeva = (s) => /[ऀ-ॿ]/.test(s || '');
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const sameDay = (a, b) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
const roman = (n) => [['M', 1000], ['CM', 900], ['D', 500], ['CD', 400], ['C', 100], ['XC', 90], ['L', 50], ['XL', 40], ['X', 10], ['IX', 9], ['V', 5], ['IV', 4], ['I', 1]].reduce((acc, [r, v]) => { while (n >= v) { acc += r; n -= v; } return acc; }, '');

const mulberry32 = (a) => () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const fmtYear = (y) => (y == null ? '' : y < 0 ? `${-y} BCE` : y < 1000 ? `${y} CE` : String(y));
const yearOf = (t) => new Date(t.createdAt).getFullYear();
const shortName = (n) => { const w = String(n || '').trim().split(/\s+/); return w.length > 1 ? w[w.length - 1] : w[0] || ''; };
const gapText = (n) => (n <= 5 ? 'Your own era' : `${n.toLocaleString()} years apart`);
function echoYear(e) {
  if (Number.isFinite(e?.year)) return e.year;
  const era = String(e?.era || '');
  const bce = /BCE|BC\b|ईसा पूर्व/i.test(era);
  let m = era.match(/(\d{3,4})s?\b/);
  if (m) return bce ? -Number(m[1]) : Number(m[1]);
  m = era.match(/(\d{1,2})(st|nd|rd|th)/i);
  if (m) { const y = (Number(m[1]) - 1) * 100 + 50; return bce ? -y : y; }
  return null;
}

const fmt = {
  long: (d) => new Date(d).toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }),
  date: (d) => new Date(d).toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' }),
  medium: (d) => new Date(d).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }),
  time: (d) => new Date(d).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' }),
  dayKey: (d) => { const x = new Date(d); return `${x.getFullYear()}-${x.getMonth()}-${x.getDate()}`; },
  dayLabel: (d) => {
    const x = new Date(d), today = new Date(), yest = new Date();
    yest.setDate(today.getDate() - 1);
    if (sameDay(x, today)) return 'Today';
    if (sameDay(x, yest)) return 'Yesterday';
    return x.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short', ...(x.getFullYear() !== today.getFullYear() ? { year: 'numeric' } : {}) });
  },
  dur: (s) => `${Math.floor((s || 0) / 60)}:${String(Math.floor((s || 0) % 60)).padStart(2, '0')}`,
  ago: (d) => {
    const days = Math.round((Date.now() - new Date(d)) / 864e5);
    if (days < 1) return 'today';
    if (days === 1) return 'yesterday';
    if (days < 14) return `${days} days ago`;
    if (days < 60) return `${Math.round(days / 7)} weeks ago`;
    if (days < 730) return `${Math.round(days / 30)} months ago`;
    return `${Math.round(days / 365)} years ago`;
  },
};

const SPEAK_LANGS = [
  ['auto', 'Auto-detect'], ['hi-en', 'Hinglish — Hindi + English'], ['en', 'English'], ['hi', 'Hindi'],
  ['pa-en', 'Punjabi + English'], ['ur-en', 'Urdu + English'], ['bn', 'Bengali'], ['mr', 'Marathi'], ['gu', 'Gujarati'],
  ['ta', 'Tamil'], ['te', 'Telugu'], ['es', 'Spanish'], ['fr', 'French'], ['de', 'German'], ['pt', 'Portuguese'],
  ['ar', 'Arabic'], ['zh', 'Chinese'], ['ja', 'Japanese'],
];
const TARGET_LANGS = ['English', 'Hindi', 'Hinglish (Roman script)', 'Punjabi', 'Urdu', 'Bengali', 'Marathi', 'Gujarati', 'Tamil', 'Telugu', 'Spanish', 'French', 'German', 'Portuguese', 'Arabic', 'Chinese', 'Japanese'];

const PROMPTS = ['What’s on your mind?', 'What did today teach you?', 'आज दिमाग़ में क्या है?', 'Say it before it slips away.', 'What do you know now that you didn’t?'];
const SEARCH_SUGGESTIONS = ['Have I talked about the purpose of life?', 'What do I believe about fear?', 'क्या मैंने कभी पैसों के बारे में बोला है?', 'How have my views on work changed?', 'What have I said about love?'];
const STOP = new Set('a an the i me my mine we our you your he she it they them is am are was were be been being have has had do does did ever never about of on in at to for from with what which who whom when where why how that this these those and or but if then so than as any some all can could would should will shall may might must said say says talk talked speak spoke think thought thoughts kya ka ki ke ko mein main maine hai hain tha thi the kabhi bare baare bola boli baat se aur ya bhi kuch'.split(' '));

/* ───────────── storage (IndexedDB) ───────────── */
const DB = (() => {
  let dbp;
  const open = () => dbp || (dbp = new Promise((resolve, reject) => {
    const req = indexedDB.open('vichaar', 1);
    req.onupgradeneeded = () => {
      const d = req.result;
      d.createObjectStore('thoughts', { keyPath: 'id' });
      d.createObjectStore('audio', { keyPath: 'id' });
      d.createObjectStore('kv', { keyPath: 'key' });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  }));
  const run = async (store, mode, fn) => {
    const d = await open();
    return new Promise((resolve, reject) => {
      const tx = d.transaction(store, mode);
      const req = fn(tx.objectStore(store));
      tx.oncomplete = () => resolve(req?.result);
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
  };
  return {
    get: (s, k) => run(s, 'readonly', (o) => o.get(k)),
    all: (s) => run(s, 'readonly', (o) => o.getAll()),
    put: (s, v) => run(s, 'readwrite', (o) => o.put(v)),
    del: (s, k) => run(s, 'readwrite', (o) => o.delete(k)),
    clear: (s) => run(s, 'readwrite', (o) => o.clear()),
  };
})();

/* ───────────── state ───────────── */
const DEFAULT_SETTINGS = { author: '', bookTitle: '', speakLang: 'auto', targetLang: 'English', accessCode: '', chime: true, onboarded: false, installHintShown: false };
const S = {
  settings: { ...DEFAULT_SETTINGS },
  thoughts: [],
  book: null,
  view: 'speak',
  scroll: {},
  server: null,
  processing: false,
  deferredInstall: null,
  journalFilter: 'all',
  detailId: null,
  searchSeq: 0,
  compiling: false,
  fresh: new Set(), // thoughts captured in this session → get the Revelation moment
};

const authorName = () => S.settings.author?.trim() || 'You';
const firstName = () => authorName().split(/\s+/)[0];
const doneThoughts = () => S.thoughts.filter((t) => t.status === 'done' && t.reflection);
const byNewest = (a, b) => new Date(b.createdAt) - new Date(a.createdAt);
const findThought = (id) => S.thoughts.find((t) => t.id === id);

async function saveSettings() {
  await DB.put('kv', { key: 'settings', value: S.settings });
}

async function saveThought(t) {
  await DB.put('thoughts', t);
  const i = S.thoughts.findIndex((x) => x.id === t.id);
  if (i === -1) S.thoughts.unshift(t); else S.thoughts[i] = t;
  S.thoughts.sort(byNewest);
  refreshThought(t);
}

/* ───────────── server API ───────────── */
async function api(path, body, { timeout = 90_000 } = {}) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeout);
  try {
    const headers = { 'content-type': 'application/json' };
    if (S.settings.accessCode) headers['x-access-code'] = S.settings.accessCode;
    const res = await fetch(`./api/${path}`, {
      method: body ? 'POST' : 'GET',
      headers,
      body: body ? JSON.stringify(body) : undefined,
      signal: ctrl.signal,
    });
    let data = {};
    try { data = await res.json(); } catch { /* non-JSON */ }
    if (!res.ok) {
      const err = new Error(data.error || (res.status === 404 ? 'Vichaar server not found on this site.' : `Server error (${res.status})`));
      err.status = res.status;
      err.code = data.code;
      throw err;
    }
    return data;
  } catch (e) {
    if (e.name === 'AbortError') { const err = new Error('The server took too long to answer.'); err.network = true; throw err; }
    if (e instanceof TypeError) { e.network = true; }
    throw e;
  } finally {
    clearTimeout(timer);
  }
}

async function checkServer() {
  try {
    S.server = await api('health');
  } catch (e) {
    S.server = { ok: false, error: e.message, network: !!e.network };
  }
  renderServerStatus();
  return S.server;
}

/* ───────────── audio ───────────── */
const Rec = {
  state: 'idle',
  async start() {
    if (!window.isSecureContext) throw Object.assign(new Error('Recording needs a secure (https) connection.'), { name: 'Insecure' });
    if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) throw Object.assign(new Error('Recording isn’t supported in this browser.'), { name: 'Unsupported' });
    this.state = 'starting';
    // Create the audio context synchronously inside the tap (iOS requires a user gesture)
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AC();
      this.ctx.resume?.();
    } catch { this.ctx = null; }
    this.stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true, channelCount: 1 } });
    const types = ['audio/webm;codecs=opus', 'audio/mp4', 'audio/webm', 'audio/ogg;codecs=opus', 'audio/aac'];
    const mime = types.find((t) => MediaRecorder.isTypeSupported?.(t)) || '';
    this.mr = new MediaRecorder(this.stream, mime ? { mimeType: mime, audioBitsPerSecond: 64000 } : undefined);
    this.mime = this.mr.mimeType || mime || 'audio/webm';
    this.chunks = [];
    this.mr.ondataavailable = (e) => { if (e.data?.size) this.chunks.push(e.data); };
    this.mr.start(1000);
    try {
      if (!this.ctx) throw new Error('no audio context');
      const src = this.ctx.createMediaStreamSource(this.stream);
      this.analyser = this.ctx.createAnalyser();
      this.analyser.fftSize = 256;
      this.analyser.smoothingTimeConstant = 0.78;
      src.connect(this.analyser);
      this.freq = new Uint8Array(this.analyser.frequencyBinCount);
      this.wave = new Uint8Array(this.analyser.fftSize);
      if (this.ctx.state === 'suspended') await this.ctx.resume();
    } catch { this.analyser = null; }
    this.startAt = performance.now();
    this.state = 'recording';
  },
  elapsed() { return this.startAt ? (performance.now() - this.startAt) / 1000 : 0; },
  level() {
    if (!this.analyser) return 0.18 + Math.sin(performance.now() / 260) * 0.06;
    this.analyser.getByteTimeDomainData(this.wave);
    let sum = 0;
    for (let i = 0; i < this.wave.length; i++) { const x = (this.wave[i] - 128) / 128; sum += x * x; }
    return Math.min(1, Math.sqrt(sum / this.wave.length) * 3.4);
  },
  spectrum() {
    if (!this.analyser) return null;
    this.analyser.getByteFrequencyData(this.freq);
    return this.freq;
  },
  stop() {
    return new Promise((resolve) => {
      const mr = this.mr;
      const duration = this.elapsed();
      if (!mr || mr.state === 'inactive') { this.cleanup(); resolve(null); return; }
      mr.onstop = () => {
        const blob = new Blob(this.chunks, { type: this.mime });
        this.cleanup();
        resolve({ blob, mime: this.mime, duration });
      };
      this.state = 'stopping';
      try { mr.requestData(); } catch { /* not supported */ }
      mr.stop();
    });
  },
  cancel() {
    try { if (this.mr && this.mr.state !== 'inactive') { this.mr.onstop = null; this.mr.stop(); } } catch { /* ignore */ }
    this.cleanup();
  },
  cleanup() {
    this.stream?.getTracks().forEach((t) => t.stop());
    try { this.ctx?.close(); } catch { /* ignore */ }
    Object.assign(this, { stream: null, ctx: null, analyser: null, mr: null, startAt: 0, state: 'idle' });
  },
};

function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => resolve(String(fr.result).split(',')[1] || '');
    fr.onerror = () => reject(fr.error);
    fr.readAsDataURL(blob);
  });
}

// Convert any recording into 16 kHz mono WAV – the format Whisper is happiest with
async function toWav16k(blob) {
  const AC = window.AudioContext || window.webkitAudioContext;
  const OAC = window.OfflineAudioContext || window.webkitOfflineAudioContext;
  const ctx = new AC();
  let decoded;
  try {
    const ab = await blob.arrayBuffer();
    decoded = await new Promise((res, rej) => {
      const p = ctx.decodeAudioData(ab, res, rej);
      if (p?.then) p.then(res, rej);
    });
  } finally {
    try { ctx.close(); } catch { /* ignore */ }
  }
  const rate = 16000;
  const off = new OAC(1, Math.max(1, Math.ceil(decoded.duration * rate)), rate);
  const src = off.createBufferSource();
  src.buffer = decoded;
  src.connect(off.destination);
  src.start();
  const rendered = await new Promise((res, rej) => {
    off.oncomplete = (e) => res(e.renderedBuffer);
    const p = off.startRendering();
    if (p?.then) p.then(res, rej);
  });
  const data = rendered.getChannelData(0);
  let peak = 0;
  for (let i = 0; i < data.length; i++) peak = Math.max(peak, Math.abs(data[i]));
  const gain = peak > 0.01 && peak < 0.6 ? 0.9 / peak : 1;

  const view = new DataView(new ArrayBuffer(44 + data.length * 2));
  const w = (o, s) => { for (let i = 0; i < s.length; i++) view.setUint8(o + i, s.charCodeAt(i)); };
  w(0, 'RIFF'); view.setUint32(4, 36 + data.length * 2, true); w(8, 'WAVE'); w(12, 'fmt ');
  view.setUint32(16, 16, true); view.setUint16(20, 1, true); view.setUint16(22, 1, true);
  view.setUint32(24, rate, true); view.setUint32(28, rate * 2, true); view.setUint16(32, 2, true); view.setUint16(34, 16, true);
  w(36, 'data'); view.setUint32(40, data.length * 2, true);
  for (let i = 0, o = 44; i < data.length; i++, o += 2) {
    const s = Math.max(-1, Math.min(1, data[i] * gain));
    view.setInt16(o, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }
  return new Blob([view], { type: 'audio/wav' });
}

async function prepareAudio(record) {
  const blob = new Blob([record.buf], { type: record.mime });
  try {
    return await blobToBase64(await toWav16k(blob));
  } catch (e) {
    console.warn('WAV conversion failed, sending original audio', e);
    return blobToBase64(blob);
  }
}

/* ───────────── processing pipeline ───────────── */
const STATUS_TEXT = {
  queued: () => (navigator.onLine ? 'Waiting its turn…' : 'Saved · will process when you’re online'),
  transcribing: () => 'Listening back…',
  reflecting: () => 'Finding echoes across time…',
  indexing: () => 'Filing it in your journal…',
};

const embedText = (t) => {
  const r = t.reflection || {};
  return clip([r.title, r.sutra, r.translation, r.cleaned_original, (r.themes || []).join(', ')].filter(Boolean).join('. '), 3500);
};

async function processQueue() {
  if (S.processing) return;
  S.processing = true;
  try {
    while (navigator.onLine) {
      const next = S.thoughts
        .filter((t) => t.status === 'queued' || t.status === 'transcribing' || t.status === 'reflecting' || t.status === 'indexing')
        .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))[0];
      if (!next) break;
      const ok = await processOne(next);
      if (!ok) break;
    }
    if (navigator.onLine) await backfillEmbeddings();
  } finally {
    S.processing = false;
  }
}

async function setStatus(t, status) {
  t.status = status;
  await saveThought(t);
}

async function processOne(t) {
  try {
    if (t.source === 'voice' && !t.transcript) {
      await setStatus(t, 'transcribing');
      const rec = await DB.get('audio', t.audioId);
      if (!rec) throw new Error('The recording for this thought is missing.');
      const audio = await prepareAudio(rec);
      const r = await api('transcribe', { audio, language: S.settings.speakLang }, { timeout: 150_000 });
      t.transcript = (r.text || '').trim();
      t.detectedLang = r.language || null;
      if (t.transcript.replace(/[^\p{L}]/gu, '').length < 3) {
        t.status = 'empty';
        t.error = 'Couldn’t hear any words in this recording.';
        await saveThought(t);
        return true;
      }
      await saveThought(t);
    }
    if (!t.reflection) {
      await setStatus(t, 'reflecting');
      const r = await api('reflect', {
        text: t.transcript,
        author: S.settings.author,
        targetLanguage: S.settings.targetLang,
        date: fmt.long(t.createdAt),
      }, { timeout: 150_000 });
      t.reflection = r.reflection;
      t.targetLang = S.settings.targetLang;
    }
    if (!t.embedding) {
      await setStatus(t, 'indexing');
      try {
        const r = await api('embed', { texts: [embedText(t)] });
        t.embedding = new Float32Array(r.vectors[0]);
      } catch (e) {
        console.warn('Embedding failed, will retry later', e);
      }
    }
    t.status = 'done';
    t.error = null;
    t.attempts = 0;
    await saveThought(t);
    onThoughtDone(t);
    return true;
  } catch (e) {
    console.error(e);
    t.attempts = (t.attempts || 0) + 1;
    const transient = [502, 503, 504, 520, 522, 524].includes(e.status);
    if ((e.network && t.attempts < 8) || (transient && t.attempts < 4)) {
      t.status = 'queued';
      t.error = null;
      await saveThought(t);
      if (transient) { await sleep(4000 * t.attempts); return true; } // try again shortly
      return false; // offline: stop the loop, retry when back online
    }
    if (e.code === 'ACCESS') {
      t.status = 'queued';
      t.error = 'Waiting for the access code (Settings)';
      t.attempts = 0;
      await saveThought(t);
      toast('This server needs an access code. Add it in Settings.', 'err', 5000);
      return false;
    }
    t.status = 'error';
    t.error = e.message || 'Something went wrong.';
    await saveThought(t);
    return e.status !== 404 && e.status !== 500; // don't hammer a misconfigured server // don't hammer a misconfigured server
  }
}

async function backfillEmbeddings() {
  const missing = doneThoughts().filter((t) => !t.embedding).slice(0, 20);
  if (!missing.length) return;
  try {
    const r = await api('embed', { texts: missing.map(embedText) });
    for (let i = 0; i < missing.length; i++) {
      missing[i].embedding = new Float32Array(r.vectors[i]);
      await DB.put('thoughts', missing[i]);
    }
  } catch (e) { console.warn('Backfill failed', e); }
}

function onThoughtDone(t) {
  if (S.view !== 'journal') $('#journal-badge').hidden = false;
  if (S.view === 'book') renderBook();
  const isFresh = S.fresh.delete(t.id);
  if (isFresh && !document.hidden && !openSheetId && Rec.state === 'idle' && t.reflection?.is_thought !== false && $('#reveal').hidden) {
    showReveal(t);
  } else {
    glowCard(t.id);
  }
}

function glowCard(id) {
  const el = $(`#latest-wrap [data-id="${id}"]`);
  if (el) { el.style.animation = ''; el.classList.remove('glow-in'); void el.offsetWidth; el.classList.add('glow-in'); }
}

/* ───────────── the Revelation ───────────── */
let revealId = null;

function showReveal(t) {
  const r = t.reflection;
  const el = $('#reveal');
  let n = 0;
  $('#reveal-sutra').innerHTML = esc(r.sutra).split(/(\s+)/).map((w) => (w.trim() ? `<span class="w" style="--i:${n++}">${w}</span>` : w)).join('');
  const showOrig = r.sutra_original && norm(r.sutra_original) !== norm(r.sutra);
  $('#reveal-orig').textContent = showOrig ? r.sutra_original : '';
  $('#reveal-orig').hidden = !showOrig;
  $('#reveal-sign').innerHTML = `— <b>${esc(authorName())}</b>, ${esc(fmt.date(t.createdAt))}`;
  const echoes = (r.echoes || []).slice(0, 3);
  $('#reveal-minds').innerHTML = `<span class="mind-chip you" style="--i:0"><i></i>You · ${yearOf(t)}</span>
    <span class="mind-vline" style="--i:1"></span>
    <div class="mind-row" style="--i:2">${echoes.map((e) => `<span class="mind-chip"><i>${esc(initials(e.thinker))}</i>${esc(shortName(e.thinker))} <small>${esc(fmtYear(echoYear(e)) || e.era)}</small></span>`).join('')}</div>`;
  $('#reveal-minds').hidden = !echoes.length;
  $('#reveal-head').textContent = r.parallel?.headline || '';
  const d2 = 1.3 + n * 0.13 + 0.5;
  const d3 = d2 + (showOrig ? 0.8 : 0);
  const d4 = d3 + 0.9;
  const d5 = d4 + 0.5 + echoes.length * 0.22;
  const d6 = d5 + 0.8;
  [['--d2', d2], ['--d3', d3], ['--d4', d4], ['--d5', d5], ['--d6', d6]].forEach(([k, v]) => el.style.setProperty(k, `${v.toFixed(2)}s`));
  const R = mulberry32(Date.now());
  $('#reveal-sparks').innerHTML = Array.from({ length: 28 }, () => {
    const size = 2 + R() * 3;
    return `<i style="left:${(R() * 100).toFixed(1)}%;width:${size.toFixed(1)}px;height:${size.toFixed(1)}px;animation-duration:${(6 + R() * 8).toFixed(1)}s;animation-delay:${(R() * 5).toFixed(1)}s;--dx:${((R() - 0.5) * 90).toFixed(0)}px"></i>`;
  }).join('');
  revealId = t.id;
  el.classList.remove('leave');
  el.hidden = false;
  el.scrollTop = 0;
  document.body.classList.add('locked');
  Motes.boost = 1;
  chime(1);
  setTimeout(() => { if (revealId === t.id) chime(0.45, 1.5); }, d3 * 1000);
  if (navigator.vibrate) navigator.vibrate([8, 60, 14]);
}

function closeReveal(then) {
  const el = $('#reveal');
  if (el.hidden) return;
  const id = revealId;
  revealId = null;
  el.classList.add('leave');
  Motes.boost = 0;
  setTimeout(() => {
    el.hidden = true;
    el.classList.remove('leave');
    if (!openSheetId) document.body.classList.remove('locked');
    if (then) then(id); else glowCard(id);
  }, 540);
}

/* Soft singing-bowl chime (Web Audio, no files) */
let audioCtx = null;
function unlockAudio() {
  try {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === 'suspended') audioCtx.resume();
  } catch { /* no audio */ }
}
function chime(level = 1, pitch = 1) {
  if (S.settings.chime === false || !audioCtx) return;
  try {
    const ctx = audioCtx;
    if (ctx.state === 'suspended') ctx.resume();
    const now = ctx.currentTime + 0.03;
    const out = ctx.createGain();
    out.gain.value = 0.14 * level;
    out.connect(ctx.destination);
    const f0 = 196 * pitch;
    [[1, 1, 6], [2.01, 0.3, 4], [2.76, 0.42, 4.6], [5.4, 0.14, 2.6], [8.93, 0.06, 1.6]].forEach(([ratio, amp, dur], i) => {
      const o = ctx.createOscillator();
      o.frequency.value = f0 * ratio * (1 + (i ? 0.0015 : 0));
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, now);
      g.gain.exponentialRampToValueAtTime(amp, now + 0.012);
      g.gain.exponentialRampToValueAtTime(0.0001, now + dur);
      o.connect(g).connect(out);
      o.start(now);
      o.stop(now + dur + 0.1);
    });
  } catch { /* ignore */ }
}

/* Floating light motes behind everything */
const Motes = {
  boost: 0,
  level: 0,
  init() {
    this.c = $('#motes');
    if (!this.c) return;
    this.g = this.c.getContext('2d');
    this.resize();
    addEventListener('resize', () => this.resize());
    const R = mulberry32(11);
    this.p = Array.from({ length: 56 }, () => ({ x: R(), y: R(), r: 0.5 + R() * 1.7, v: 5 + R() * 15, sway: 6 + R() * 26, ph: R() * 6.283, tw: 0.5 + R() * 1.6 }));
    this.last = performance.now();
    if (reducedMotion) this.draw(0, 0); else this.loop();
  },
  resize() {
    const dpr = Math.min(devicePixelRatio || 1, 2);
    this.w = innerWidth; this.h = innerHeight;
    this.c.width = Math.round(this.w * dpr); this.c.height = Math.round(this.h * dpr);
    this.g.setTransform(dpr, 0, 0, dpr, 0, 0);
  },
  loop() {
    requestAnimationFrame(() => this.loop());
    const now = performance.now();
    if (document.hidden || now - this.last < 30) return;
    const dt = Math.min(0.1, (now - this.last) / 1000);
    this.last = now;
    this.draw(now / 1000, dt);
  },
  draw(t, dt) {
    const { g, w, h } = this;
    const target = Math.max(this.boost, Rec.state === 'recording' ? 0.6 : 0);
    this.level += (target - this.level) * 0.05;
    const b = this.level;
    g.clearRect(0, 0, w, h);
    for (const p of this.p) {
      p.y -= (p.v * (1 + b * 2.5) * dt) / h;
      if (p.y < -0.03) { p.y = 1.03; }
      const x = p.x * w + Math.sin(t * 0.35 + p.ph) * p.sway;
      const y = p.y * h;
      const tw = 0.5 + 0.5 * Math.sin(t * p.tw + p.ph);
      const a = (0.1 + tw * 0.32) * (0.55 + 0.45 * p.y) * (1 + b * 0.9);
      g.fillStyle = `rgba(255, 214, 150, ${(a * 0.22).toFixed(3)})`;
      g.beginPath(); g.arc(x, y, p.r * 4.5, 0, 6.283); g.fill();
      g.fillStyle = `rgba(255, 244, 220, ${Math.min(1, a).toFixed(3)})`;
      g.beginPath(); g.arc(x, y, p.r, 0, 6.283); g.fill();
    }
  },
};

function retryThought(id) {
  const t = findThought(id);
  if (!t) return;
  t.status = 'queued';
  t.error = null;
  t.attempts = 0;
  saveThought(t).then(processQueue);
}

/* ───────────── recording UI ───────────── */
let smoothLevel = 0;
let rafId = 0;
let promptTimer = 0;
let promptIdx = 0;

function setPrompt(text) {
  const el = $('#prompt');
  if (el.textContent === text) return;
  el.textContent = text;
  el.classList.remove('swap');
  void el.offsetWidth;
  el.classList.add('swap');
}

function startPromptRotation() {
  clearInterval(promptTimer);
  promptTimer = setInterval(() => {
    if (Rec.state !== 'idle' || S.view !== 'speak' || document.hidden) return;
    promptIdx = (promptIdx + 1) % PROMPTS.length;
    setPrompt(PROMPTS[promptIdx]);
  }, 9000);
}

function drawWave() {
  const c = $('#wave');
  if (!c) return;
  const dpr = Math.min(devicePixelRatio || 1, 2);
  const W = c.clientWidth, H = c.clientHeight;
  if (!W) return;
  if (c.width !== Math.round(W * dpr)) { c.width = Math.round(W * dpr); c.height = Math.round(H * dpr); }
  const g = c.getContext('2d');
  g.setTransform(dpr, 0, 0, dpr, 0, 0);
  g.clearRect(0, 0, W, H);
  const cx = W / 2, cy = H / 2, base = Math.min(W, H) * 0.375, N = 84;
  if (Rec.state !== 'recording') return;
  const spec = Rec.spectrum();
  const t = performance.now() / 1000;
  g.lineCap = 'round';
  for (let i = 0; i < N; i++) {
    const a = (i / N) * Math.PI * 2 - Math.PI / 2;
    if (Rec.state === 'recording') {
      let v = 0.12;
      if (spec) {
        const half = i <= N / 2 ? i : N - i;
        const idx = Math.floor((half / (N / 2)) * spec.length * 0.62) + 1;
        v = Math.max(0.06, spec[idx] / 255);
      } else {
        v = 0.15 + 0.12 * Math.sin(t * 6 + i * 0.5);
      }
      const len = 3 + v * v * 64;
      g.strokeStyle = `rgba(246, ${Math.round(214 - v * 90)}, ${Math.round(150 - v * 100)}, ${0.25 + v * 0.75})`;
      g.lineWidth = 2.6;
      g.beginPath();
      g.moveTo(cx + Math.cos(a) * base, cy + Math.sin(a) * base);
      g.lineTo(cx + Math.cos(a) * (base + len), cy + Math.sin(a) * (base + len));
      g.stroke();
    } else {
      const shimmer = 0.5 + 0.5 * Math.sin(t * 1.3 + i * 0.35);
      g.fillStyle = `rgba(246, 212, 145, ${0.08 + shimmer * 0.22})`;
      g.beginPath();
      g.arc(cx + Math.cos(a + t * 0.05) * (base + 6), cy + Math.sin(a + t * 0.05) * (base + 6), 1.3 + shimmer * 0.7, 0, Math.PI * 2);
      g.fill();
    }
  }
}

function frame() {
  rafId = requestAnimationFrame(frame);
  const recording = Rec.state === 'recording';
  const target = recording ? Rec.level() : 0;
  smoothLevel += (target - smoothLevel) * (target > smoothLevel ? 0.45 : 0.12);
  $('#orb-stage').style.setProperty('--level', smoothLevel.toFixed(3));
  drawWave();
  if (recording) {
    const el = Rec.elapsed();
    $('#rec-time').textContent = fmt.dur(el);
    if (el >= MAX_SECONDS) finishRecording();
  }
}

function startLoop() { if (!rafId && !reducedMotion) frame(); else if (reducedMotion) drawWave(); }
function stopLoop() { cancelAnimationFrame(rafId); rafId = 0; }

async function toggleRecord() {
  unlockAudio();
  if (Rec.state === 'recording') return finishRecording();
  if (Rec.state !== 'idle') return;
  try {
    await Rec.start();
  } catch (e) {
    Rec.cleanup();
    const msg = e.name === 'NotAllowedError' || e.name === 'SecurityError'
      ? 'Microphone access is blocked. Allow it for this site in your browser (on iPhone: Settings → Apps → Safari → Microphone).'
      : e.name === 'NotFoundError' ? 'No microphone found on this device.' : e.message;
    toast(msg, 'err', 6000);
    return;
  }
  document.body.classList.add('recording');
  setPrompt('Listening…');
  $('#rec-label').textContent = 'Tap the orb when you’re done';
  $('#rec-time').hidden = false;
  $('#rec-time').textContent = '0:00';
  $('#btn-discard').hidden = false;
  $('#btn-write').hidden = true;
  $('#orb').setAttribute('aria-label', 'Stop recording');
  if (navigator.vibrate) navigator.vibrate(12);
  startLoop();
}

function resetRecordUI() {
  document.body.classList.remove('recording');
  setPrompt(PROMPTS[promptIdx]);
  $('#rec-label').textContent = 'Tap and speak — in any language';
  $('#rec-time').hidden = true;
  $('#btn-discard').hidden = true;
  $('#btn-write').hidden = false;
  $('#orb').setAttribute('aria-label', 'Start recording');
}

async function finishRecording() {
  if (Rec.state !== 'recording') return;
  const res = await Rec.stop();
  resetRecordUI();
  if (!res || res.duration < 1.2 || res.blob.size < 800) {
    toast('That was too short — hold the thought a little longer.');
    return;
  }
  const orb = $('#orb');
  orb.classList.remove('absorb'); void orb.offsetWidth; orb.classList.add('absorb');
  flyToJournal();
  if (navigator.vibrate) navigator.vibrate([10, 40, 10]);

  const audioId = uid();
  await DB.put('audio', { id: audioId, buf: await res.blob.arrayBuffer(), mime: res.mime });
  const t = {
    id: uid(), createdAt: new Date().toISOString(), source: 'voice', audioId,
    duration: res.duration, status: 'queued', transcript: '', reflection: null,
    embedding: null, favorite: false, attempts: 0,
  };
  S.fresh.add(t.id);
  await saveThought(t);
  renderLatest(true);
  processQueue();
}

function discardRecording() {
  Rec.cancel();
  resetRecordUI();
  toast('Discarded.');
}

async function saveWrittenThought(text) {
  const t = {
    id: uid(), createdAt: new Date().toISOString(), source: 'text', transcript: text.trim(),
    status: 'queued', reflection: null, embedding: null, favorite: false, attempts: 0,
  };
  S.fresh.add(t.id);
  await saveThought(t);
  renderLatest(true);
  flyToJournal();
  processQueue();
}

function flyToJournal() {
  const tab = $('.tab[data-tab="journal"]');
  if (reducedMotion) { pulse(tab); return; }
  const a = $('#orb').getBoundingClientRect();
  const b = tab.getBoundingClientRect();
  const x0 = a.left + a.width / 2 - 9, y0 = a.top + a.height / 2 - 9;
  const x1 = b.left + b.width / 2 - 9, y1 = b.top + b.height / 2 - 16;
  const dot = document.createElement('div');
  dot.className = 'fly-dot';
  dot.style.left = '0'; dot.style.top = '0';
  document.body.appendChild(dot);
  dot.animate([
    { transform: `translate(${x0}px, ${y0}px) scale(2.2)`, opacity: 0.2 },
    { transform: `translate(${x0}px, ${y0}px) scale(1.6)`, opacity: 1, offset: 0.15 },
    { transform: `translate(${(x0 + x1) / 2 + 80}px, ${(y0 + y1) / 2 - 10}px) scale(1.1)`, opacity: 1, offset: 0.55 },
    { transform: `translate(${x1}px, ${y1}px) scale(0.4)`, opacity: 0.3 },
  ], { duration: 950, easing: 'cubic-bezier(.45,0,.25,1)' }).onfinish = () => { dot.remove(); pulse(tab); };
}

function pulse(el) {
  el.classList.remove('pulse'); void el.offsetWidth; el.classList.add('pulse');
}

/* ───────────── cards ───────────── */
const mindsStack = (r) => {
  const e = (r.echoes || []).slice(0, 3);
  return e.length ? `<span class="minds-stack" title="Parallel minds">${e.map((x, i) => `<i style="z-index:${9 - i}">${esc(initials(x.thinker))}</i>`).join('')}<i class="you"></i></span>` : '';
};

function cardHTML(t, i = 0, marks = null) {
  const r = t.reflection;
  const meta = `<span>${fmt.time(t.createdAt)}</span><span>· ${t.source === 'voice' ? fmt.dur(t.duration) : 'written'}</span>`;
  const H = (s) => (marks ? highlight(s, marks) : esc(s));
  if (t.status !== 'done' || !r) {
    const failed = t.status === 'error' || t.status === 'empty';
    const status = failed
      ? `<div class="err-text">${esc(t.error || 'Something went wrong.')}</div><button class="mini-btn" data-retry="${t.id}">Try again</button>`
      : `<div class="status-line"><span class="spinner"></span><span class="shimmer">${esc(t.status === 'queued' && t.error ? t.error : (STATUS_TEXT[t.status] || STATUS_TEXT.queued)())}</span></div>`;
    return `<article class="card pending ${failed ? 'error' : ''}" data-id="${t.id}" role="button" tabindex="0" style="--i:${i}">
      <div class="card-top">${meta}</div>
      <p class="card-sutra">${t.transcript ? H(clip(t.transcript, 180)) : t.source === 'voice' ? 'Voice note' : ''}</p>
      ${status}
    </article>`;
  }
  return `<article class="card" data-id="${t.id}" role="button" tabindex="0" style="--i:${i}">
    <div class="card-top">${meta}<span class="spacer"></span>${t.favorite ? '<span class="fav-dot" aria-label="Saved">★</span>' : ''}${mindsStack(r)}</div>
    <p class="card-sutra">${H(r.sutra)}</p>
    <div class="card-title">${H(r.title)}</div>
    ${r.themes?.length ? `<div class="card-tags">${r.themes.slice(0, 4).map((x) => `<span class="tag">#${esc(x)}</span>`).join('')}</div>` : ''}
  </article>`;
}

function refreshThought(t) {
  $$(`.card[data-id="${t.id}"]`).forEach((el) => {
    if (el.closest('.related')) return;
    const tmp = document.createElement('div');
    tmp.innerHTML = cardHTML(t, 0, el.closest('#search-results') ? lastMarks : null).trim();
    const fresh = tmp.firstElementChild;
    fresh.style.animation = 'none';
    el.replaceWith(fresh);
  });
  if (S.detailId === t.id && !$('#sheet-detail').hidden) renderDetail(t, { keepScroll: true });
  if (S.view === 'journal' && t.status === 'done') updateJournalMeta();
}

/* ───────────── SPEAK view ───────────── */
function renderGreeting() {
  const h = new Date().getHours();
  const part = h < 5 ? 'Still up' : h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
  $('#greet').textContent = S.settings.author ? `${part}, ${firstName()}` : part;
}

function renderLatest(animate = false) {
  const wrap = $('#latest-wrap');
  const t = S.thoughts[0];
  if (!t) {
    wrap.innerHTML = `<p class="fine" style="text-align:center;margin-top:6px">Your first thought becomes verse 1.1 of your book.</p>`;
    $('#resurface').innerHTML = '';
    return;
  }
  wrap.innerHTML = `<div class="section-label">Latest thought</div><div class="${animate ? 'stagger' : ''}">${cardHTML(t)}</div>`;
  renderResurface();
}

function renderResurface() {
  const el = $('#resurface');
  const pool = doneThoughts().slice(1);
  if (pool.length < 2) { el.innerHTML = ''; return; }
  const day = Math.floor(Date.now() / 864e5);
  const t = pool[(day * 7919) % pool.length];
  el.innerHTML = `<div class="section-label">From your journal</div>
    <div class="resurface-card" data-id="${t.id}" role="button" tabindex="0">
      <p class="q">${esc(t.reflection.sutra)}</p>
      <div class="by">— you, ${fmt.ago(t.createdAt)} · ${fmt.medium(t.createdAt)}</div>
    </div>`;
}

/* ───────────── JOURNAL view ───────────── */
function updateJournalMeta() {
  const n = S.thoughts.length;
  $('#journal-count').textContent = n ? `${n} thought${n === 1 ? '' : 's'}` : '';
}

function renderJournal(stagger = false) {
  updateJournalMeta();
  const counts = new Map();
  doneThoughts().forEach((t) => (t.reflection.themes || []).forEach((th) => counts.set(th, (counts.get(th) || 0) + 1)));
  const themes = [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10).map(([k]) => k);
  if (S.journalFilter !== 'all' && S.journalFilter !== 'saved' && !themes.includes(S.journalFilter)) S.journalFilter = 'all';
  const chips = [['all', 'All'], ['saved', '★ Saved'], ...themes.map((t) => [t, `#${t}`])];
  $('#journal-chips').innerHTML = S.thoughts.length
    ? chips.map(([k, label]) => `<button class="chip ${S.journalFilter === k ? 'active' : ''}" data-filter="${esc(k)}">${esc(label)}</button>`).join('')
    : '';

  const list = $('#journal-list');
  let items = S.thoughts;
  if (S.journalFilter === 'saved') items = items.filter((t) => t.favorite);
  else if (S.journalFilter !== 'all') items = items.filter((t) => t.reflection?.themes?.includes(S.journalFilter));

  if (!S.thoughts.length) {
    list.innerHTML = emptyHTML('Your journal is waiting', 'Tap Speak and say whatever is on your mind. It will appear here, dated and kept forever.');
    return;
  }
  if (!items.length) {
    list.innerHTML = emptyHTML('Nothing here yet', S.journalFilter === 'saved' ? 'Tap ☆ Save on a thought to keep it here.' : 'No thoughts with this theme.');
    return;
  }
  let html = '', lastDay = '', i = 0;
  for (const t of items) {
    const key = fmt.dayKey(t.createdAt);
    if (key !== lastDay) { html += `<div class="day-head" style="--i:${i}">${esc(fmt.dayLabel(t.createdAt))}</div>`; lastDay = key; }
    html += cardHTML(t, i++);
  }
  list.innerHTML = html;
  animateList(list, stagger);
}

function animateList(list, stagger) {
  list.classList.toggle('stagger', stagger && !reducedMotion);
  if (stagger) setTimeout(() => list.classList.remove('stagger'), 1400);
}

function emptyHTML(title, text, extra = '') {
  return `<div class="empty"><div class="em-orb"></div><h3>${esc(title)}</h3><p>${esc(text)}</p>${extra}</div>`;
}

/* ───────────── DETAIL sheet ───────────── */
let player = null;

const KINSHIP = { close: ['≈', 'Same summit'], partial: ['∼', 'Neighbouring path'], contrast: ['↔', 'Counterpoint'] };

function constellationSVG(echoes, now) {
  const pts = echoes.map((e) => ({ e, y: echoYear(e) })).filter((p) => p.y != null && p.y <= now);
  if (!pts.length) return '';
  const L = 18, R = 300, AX = 104;
  const X = (yr) => L + (R - L) * (1 - Math.sqrt(Math.max(0, now - yr) / (now + 650)));
  pts.forEach((p) => { p.x = X(p.y); p.name = shortName(p.e.thinker); p.w = p.name.length * 7.2 + 4; });
  pts.sort((a, b) => a.x - b.x);
  const levels = [76, 52, 28];
  const right = [-1e9, -1e9, -1e9];
  pts.forEach((p) => {
    p.anchor = p.x - p.w / 2 < 4 ? 'start' : p.x + p.w / 2 > R + 4 ? 'end' : 'middle';
    p.left = p.anchor === 'start' ? p.x : p.anchor === 'end' ? p.x - p.w : p.x - p.w / 2;
    let lv = levels.findIndex((_, i) => p.left > right[i] + 6);
    if (lv === -1) lv = right.indexOf(Math.min(...right));
    right[lv] = p.left + p.w;
    p.ly = levels[lv];
  });
  const ticks = [[-500, '500 BCE'], [1, '1 CE'], [1000, '1000'], [1600, '1600'], [1900, '1900']].map(([y, l]) => ({ x: X(y), l })).filter((tk, i, arr) => i === 0 || tk.x - arr[i - 1].x > 36);
  const threads = pts.map((p, i) => {
    const depth = 12 + (R - p.x) * 0.15;
    return `<path class="thread" style="--i:${i}" d="M${p.x.toFixed(1)} ${AX} Q ${((p.x + R) / 2).toFixed(1)} ${(AX + depth).toFixed(1)} ${R} ${AX}"/>`;
  }).join('');
  const stars = pts.map((p) => `
    <line x1="${p.x.toFixed(1)}" y1="${p.ly + 14}" x2="${p.x.toFixed(1)}" y2="${AX - 6}" stroke="rgba(246,212,145,.28)" stroke-dasharray="1 3"/>
    <circle class="star-glow" cx="${p.x.toFixed(1)}" cy="${AX}" r="7"/><circle class="star" cx="${p.x.toFixed(1)}" cy="${AX}" r="3.2"/>
    <text class="name" x="${p.x.toFixed(1)}" y="${p.ly}" text-anchor="${p.anchor}">${esc(p.name)}</text>
    <text class="yr" x="${p.x.toFixed(1)}" y="${p.ly + 11}" text-anchor="${p.anchor}">${esc(fmtYear(p.y))}</text>`).join('');
  return `<div class="constellation"><svg viewBox="0 0 340 158" role="img" aria-label="Parallel minds across time">
    <defs>
      <linearGradient id="threadGrad" x1="0" x2="1"><stop offset="0" stop-color="#f6d491" stop-opacity=".25"/><stop offset="1" stop-color="#f0883e" stop-opacity=".95"/></linearGradient>
      <radialGradient id="youGrad" cx=".38" cy=".34"><stop offset="0" stop-color="#fff3d1"/><stop offset=".55" stop-color="#eba653"/><stop offset="1" stop-color="#8a3b17"/></radialGradient>
    </defs>
    <line class="axis" x1="${L - 8}" y1="${AX}" x2="${R}" y2="${AX}"/>
    ${threads}
    ${ticks.map((tk) => `<text class="tick" x="${tk.x.toFixed(1)}" y="152" text-anchor="middle">${tk.l}</text>`).join('')}
    <text class="tick" x="${R}" y="152" text-anchor="middle">NOW</text>
    ${stars}
    <circle class="you-glow" cx="${R}" cy="${AX}" r="12"/><circle class="you-dot" cx="${R}" cy="${AX}" r="7"/>
    <text class="name" x="${R + 12}" y="${AX - 1}" style="fill:#f6d491">You</text>
    <text class="yr" x="${R + 12}" y="${AX + 11}">${now}</text>
  </svg></div>`;
}

function parallelHTML(t, stagger) {
  const r = t.reflection;
  const echoes = r.echoes || [];
  const now = yearOf(t);
  const head = r.parallel?.headline || '';
  const angle = r.parallel?.your_angle || r.originality?.verdict || '';
  if (!echoes.length && !angle) return '';
  const pairs = echoes.map((e, i) => {
    const y = echoYear(e);
    const [sym, label] = KINSHIP[e.kinship] || KINSHIP.partial;
    return `<div class="pm" style="--i:${i}">
      <div class="pm-pair">
        <div class="pm-col you"><div class="pm-who">You · ${now}</div><p>${esc(e.you || r.sutra)}</p></div>
        <div class="pm-seam"><span>${sym}</span></div>
        <div class="pm-col them"><div class="pm-who">${esc(e.thinker)} · ${esc(y != null ? fmtYear(y) : e.era)}</div><p>${esc(e.idea)}</p>${e.quote ? `<blockquote>“${esc(e.quote)}”</blockquote>` : ''}</div>
      </div>
      <div class="pm-foot"><span class="kin ${e.kinship}">${label}</span>${y != null ? `<span>${esc(gapText(now - y))}</span>` : ''}${e.tradition ? `<span>· ${esc(e.tradition)}</span>` : ''}</div>
      ${e.difference ? `<p class="pm-diff">${esc(e.difference)}</p>` : ''}
    </div>`;
  }).join('');
  return `<section class="d-sec" id="parallel-sec"><h4>Parallel minds</h4>
    ${head ? `<p class="pm-head">${esc(head)}</p>` : ''}
    ${constellationSVG(echoes, now)}
    <div class="pm-list ${stagger ? 'stagger' : ''}">${pairs}</div>
    ${angle ? `<div class="yours"><div class="yours-label">✦ Yours alone</div><p>${esc(angle)}</p></div>` : ''}
    <p class="pm-note">Reaching a truth on your own is a discovery — even if someone reached it before you. These are fellow travellers, not prior owners.</p>
  </section>`;
}

function relatedThoughts(t, k = 3, min = 0.6) {
  if (!t.embedding) return [];
  return doneThoughts()
    .filter((x) => x.id !== t.id && x.embedding)
    .map((x) => ({ t: x, s: cosine(t.embedding, x.embedding) }))
    .filter((x) => x.s >= min)
    .sort((a, b) => b.s - a.s)
    .slice(0, k)
    .map((x) => x.t);
}

function renderDetail(t, { keepScroll = false } = {}) {
  const body = $('#detail-body');
  const scroll = body.scrollTop;
  const r = t.reflection;
  const author = authorName();
  const meta = `<div class="d-meta">${esc(fmt.long(t.createdAt))} · ${esc(fmt.time(t.createdAt))}${t.source === 'voice' ? ` · ${fmt.dur(t.duration)}` : ''}</div>`;
  const playerHTML = t.source === 'voice'
    ? `<div class="player" id="player"><button aria-label="Play recording" data-play><svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M8 5.5v13l11-6.5z"/></svg></button><div class="bar"><i></i></div><span class="t">${fmt.dur(t.duration)}</span></div>`
    : '';

  if (t.status !== 'done' || !r) {
    const failed = t.status === 'error' || t.status === 'empty';
    body.innerHTML = `${meta}
      <p class="d-sutra" style="font-size:24px">${t.transcript ? esc(t.transcript) : 'Your voice note is being processed.'}</p>
      ${playerHTML}
      <div class="d-actions">
        ${failed ? `<button class="ghost-btn" data-retry="${t.id}">Try again</button>` : `<span class="status-line"><span class="spinner"></span><span class="shimmer">${esc((STATUS_TEXT[t.status] || STATUS_TEXT.queued)())}</span></span>`}
        <button class="ghost-btn" data-act="delete">Delete</button>
      </div>
      ${failed ? `<p class="err-text">${esc(t.error || '')}</p>` : ''}`;
    if (keepScroll) body.scrollTop = scroll;
    return;
  }

  const showOrig = r.sutra_original && norm(r.sutra_original) !== norm(r.sutra);
  const showTranslation = r.translation && norm(r.translation) !== norm(r.cleaned_original);
  const related = relatedThoughts(t);
  body.innerHTML = `${meta}
    <p class="d-sutra">${esc(r.sutra)}</p>
    ${showOrig ? `<p class="d-sutra-orig">${esc(r.sutra_original)}</p>` : ''}
    <p class="d-sign">— <b>${esc(author)}</b>, ${esc(fmt.date(t.createdAt))}</p>
    ${playerHTML}
    <div class="d-actions">
      <button class="ghost-btn" data-act="share"><svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v12M7 8l5-5 5 5M5 14v5a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-5"/></svg>Share</button>
      <button class="ghost-btn" data-act="card"><svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="3"/><path d="m3 16 5-5 4 4 3-3 6 6"/></svg>Quote card</button>
      <button class="ghost-btn ${t.favorite ? 'on' : ''}" data-act="fav">${t.favorite ? '★ Saved' : '☆ Save'}</button>
      <button class="ghost-btn" data-act="copy">Copy</button>
    </div>

    <section class="d-sec"><h4>In your words${r.original_language ? ` · ${esc(r.original_language)}` : ''}</h4>
      <p class="d-text ${hasDeva(r.cleaned_original) ? 'orig' : ''}">${esc(r.cleaned_original)}</p>
      ${t.source === 'voice' ? `<details class="d-raw"><summary>Raw transcript</summary><p>${esc(t.transcript)}</p></details>` : ''}
    </section>
    ${showTranslation ? `<section class="d-sec"><h4>Translation · ${esc(t.targetLang || S.settings.targetLang)}</h4><p class="d-text">${esc(r.translation)}</p></section>` : ''}
    ${r.essence ? `<section class="d-sec"><h4>Commentary</h4><p class="d-text">${esc(r.essence)}</p></section>` : ''}
    ${parallelHTML(t, !keepScroll)}
    ${related.length ? `<section class="d-sec"><h4>You’ve said something close before</h4><div class="related">${related.map((x) => cardHTML(x)).join('')}</div></section>` : ''}
    <div class="d-actions" style="margin-top:28px">
      <button class="ghost-btn" data-act="redo">Re-analyse</button>
      <button class="ghost-btn" data-act="delete">Delete</button>
    </div>`;

  if (keepScroll) body.scrollTop = scroll;
}

function initials(name) {
  const parts = String(name || '?').replace(/[^\p{L}\s]/gu, '').trim().split(/\s+/).filter((w, i, arr) => !(i === 0 && arr.length > 1 && /^the$/i.test(w)));
  return ((parts[0]?.[0] || '?') + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase();
}

function openDetail(id) {
  const t = findThought(id);
  if (!t) return;
  S.detailId = id;
  stopPlayer();
  renderDetail(t);
  $('#detail-body').scrollTop = 0;
  openSheet('sheet-detail');
}

async function togglePlayer() {
  const t = findThought(S.detailId);
  if (!t?.audioId) return;
  const btn = $('#player [data-play]');
  if (player && !player.audio.paused) { player.audio.pause(); return; }
  if (!player) {
    const rec = await DB.get('audio', t.audioId);
    if (!rec) { toast('Recording not found on this device.', 'err'); return; }
    const url = URL.createObjectURL(new Blob([rec.buf], { type: rec.mime }));
    const audio = new Audio(url);
    player = { audio, url };
    const bar = $('#player .bar i'), time = $('#player .t');
    const play = '<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M8 5.5v13l11-6.5z"/></svg>';
    const pause = '<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><rect x="6.5" y="5" width="4" height="14" rx="1"/><rect x="13.5" y="5" width="4" height="14" rx="1"/></svg>';
    audio.addEventListener('timeupdate', () => {
      const d = isFinite(audio.duration) ? audio.duration : t.duration;
      if (bar) bar.style.width = `${Math.min(100, (audio.currentTime / d) * 100)}%`;
      if (time) time.textContent = fmt.dur(audio.currentTime);
    });
    audio.addEventListener('play', () => { btn.innerHTML = pause; });
    audio.addEventListener('pause', () => { btn.innerHTML = play; });
    audio.addEventListener('ended', () => { btn.innerHTML = play; if (bar) bar.style.width = '0'; if (time) time.textContent = fmt.dur(t.duration); });
  }
  try { await player.audio.play(); } catch (e) { toast('Couldn’t play this recording.', 'err'); }
}

function stopPlayer() {
  if (!player) return;
  player.audio.pause();
  URL.revokeObjectURL(player.url);
  player = null;
}

async function detailAction(act) {
  const t = findThought(S.detailId);
  if (!t) return;
  const r = t.reflection;
  const quoteText = r ? `“${r.sutra}”\n— ${authorName()}, ${fmt.date(t.createdAt)}` : t.transcript;
  if (act === 'fav') {
    t.favorite = !t.favorite;
    await saveThought(t);
    if (S.view === 'journal') renderJournal();
  } else if (act === 'copy') {
    try { await navigator.clipboard.writeText(quoteText); toast('Copied.'); } catch { toast('Couldn’t copy on this browser.', 'err'); }
  } else if (act === 'share') {
    if (navigator.share) {
      try { await navigator.share({ text: quoteText }); } catch { /* cancelled */ }
    } else {
      try { await navigator.clipboard.writeText(quoteText); toast('Copied — paste it anywhere.'); } catch { /* ignore */ }
    }
  } else if (act === 'card') {
    try {
      const blob = await makeQuoteCard(t);
      await shareOrDownload(blob, `${slug(r.title || 'thought')}.png`, r.sutra);
    } catch (e) { console.error(e); toast('Couldn’t make the image.', 'err'); }
  } else if (act === 'redo') {
    t.reflection = null; t.embedding = null;
    t.status = 'queued'; t.error = null; t.attempts = 0;
    await saveThought(t);
    processQueue();
  } else if (act === 'delete') {
    if (!confirm('Delete this thought for good?')) return;
    await DB.del('thoughts', t.id);
    if (t.audioId) await DB.del('audio', t.audioId);
    S.thoughts = S.thoughts.filter((x) => x.id !== t.id);
    closeSheet();
    renderAll();
    toast('Deleted.');
  }
}

const slug = (s) => norm(s).replace(/\s+/g, '-').slice(0, 50) || 'vichaar';

async function shareOrDownload(blob, filename, text = '') {
  const file = new File([blob], filename, { type: blob.type });
  if (navigator.canShare?.({ files: [file] })) {
    try { await navigator.share({ files: [file], text }); return; } catch (e) { if (e.name === 'AbortError') return; }
  }
  const url = URL.createObjectURL(blob);
  const a = Object.assign(document.createElement('a'), { href: url, download: filename });
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

/* Beautiful shareable quote image */
async function makeQuoteCard(t) {
  const r = t.reflection;
  try { await Promise.all([document.fonts.load('500 60px Cormorant'), document.fonts.load('italic 400 40px Cormorant'), document.fonts.load('400 40px Tiro', 'अ'), document.fonts.load('500 28px Inter')]); } catch { /* fall back */ }
  const W = 1080, H = 1350;
  const c = Object.assign(document.createElement('canvas'), { width: W, height: H });
  const g = c.getContext('2d');
  const bg = g.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, '#231835'); bg.addColorStop(0.6, '#120e1c'); bg.addColorStop(1, '#0b0912');
  g.fillStyle = bg; g.fillRect(0, 0, W, H);
  const glow = g.createRadialGradient(W / 2, 170, 10, W / 2, 170, 520);
  glow.addColorStop(0, 'rgba(240,150,70,.35)'); glow.addColorStop(1, 'rgba(240,150,70,0)');
  g.fillStyle = glow; g.fillRect(0, 0, W, H);
  const orb = g.createRadialGradient(W / 2 - 14, 150, 4, W / 2, 166, 46);
  orb.addColorStop(0, '#fff3d1'); orb.addColorStop(0.35, '#f6d491'); orb.addColorStop(0.7, '#e28c3e'); orb.addColorStop(1, '#7a3416');
  g.fillStyle = orb; g.beginPath(); g.arc(W / 2, 166, 42, 0, Math.PI * 2); g.fill();
  g.strokeStyle = 'rgba(246,212,145,.35)'; g.lineWidth = 2;
  g.strokeRect(54, 54, W - 108, H - 108);

  const maxW = W - 220;
  const wrap = (text, font) => {
    g.font = font;
    const words = String(text).split(/\s+/);
    const lines = [];
    let line = '';
    for (const w of words) {
      const test = line ? `${line} ${w}` : w;
      if (g.measureText(test).width > maxW && line) { lines.push(line); line = w; } else line = test;
    }
    if (line) lines.push(line);
    return lines;
  };
  let size = 64, lines;
  do { lines = wrap(r.sutra, `500 ${size}px Cormorant, Georgia, serif`); size -= 4; } while (lines.length > 9 && size > 34);
  size += 4;
  const lh = size * 1.28;
  const orig = r.sutra_original && norm(r.sutra_original) !== norm(r.sutra) ? r.sutra_original : '';
  let origLines = [];
  const origSize = 38;
  if (orig) origLines = wrap(orig, `400 ${origSize}px Tiro, Cormorant, serif`).slice(0, 5);
  const blockH = lines.length * lh + (origLines.length ? 40 + origLines.length * origSize * 1.55 : 0);
  let y = Math.max(300, (H - blockH) / 2 + 10);

  g.textAlign = 'center';
  g.fillStyle = 'rgba(232,180,90,.45)';
  g.font = '500 150px Cormorant, Georgia, serif';
  g.fillText('“', W / 2, y - 10);
  g.fillStyle = '#f6efe2';
  g.font = `500 ${size}px Cormorant, Georgia, serif`;
  for (const l of lines) { y += lh; g.fillText(l, W / 2, y - lh * 0.22); }
  if (origLines.length) {
    y += 40;
    g.fillStyle = '#f2c97e';
    g.font = `400 ${origSize}px Tiro, Cormorant, serif`;
    for (const l of origLines) { y += origSize * 1.55; g.fillText(l, W / 2, y - origSize * 0.4); }
  }
  g.fillStyle = '#e8d9bd';
  g.font = 'italic 400 44px Cormorant, Georgia, serif';
  g.fillText(`— ${authorName()}`, W / 2, H - 210);
  g.fillStyle = 'rgba(232,217,189,.6)';
  g.font = '500 26px Inter, sans-serif';
  g.fillText(fmt.date(t.createdAt).toUpperCase(), W / 2, H - 160);
  g.fillStyle = 'rgba(246,212,145,.55)';
  g.font = 'italic 500 30px Cormorant, Georgia, serif';
  g.fillText('Vichaar', W / 2, H - 90);
  return new Promise((res) => c.toBlob(res, 'image/png'));
}

/* ───────────── SEARCH view ───────────── */
let lastMarks = null;

function tokenize(q) {
  return norm(q).split(' ').filter((w) => w && !STOP.has(w) && (w.length > 1 || hasDeva(w)));
}

function haystack(t) {
  const r = t.reflection || {};
  return norm([r.title, r.sutra, r.sutra_original, r.translation, r.cleaned_original, t.transcript, (r.themes || []).join(' '), r.chapter_hint].join(' '));
}

function keywordSearch(q) {
  const tokens = tokenize(q);
  if (!tokens.length) return [];
  const phrase = norm(q);
  return S.thoughts
    .map((t) => {
      const h = haystack(t);
      let s = 0;
      for (const tok of tokens) {
        if (h.includes(tok)) s += 1 + Math.min(tok.length, 8) / 8;
        else if (tok.length > 4 && h.includes(tok.slice(0, -2))) s += 0.6; // crude stemming: purposes → purpose
      }
      if (phrase.length > 4 && h.includes(phrase)) s += 3;
      return { t, s };
    })
    .filter((x) => x.s > 0)
    .sort((a, b) => b.s - a.s)
    .map((x) => x.t);
}

function highlight(text, tokens) {
  let html = esc(text);
  if (!tokens?.length) return html;
  const re = new RegExp(`(${tokens.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`, 'giu');
  return html.replace(re, '<mark>$1</mark>');
}

function cosine(a, b) {
  let dot = 0, na = 0, nb = 0;
  const n = Math.min(a.length, b.length);
  for (let i = 0; i < n; i++) { dot += a[i] * b[i]; na += a[i] * a[i]; nb += b[i] * b[i]; }
  return dot / (Math.sqrt(na * nb) || 1);
}

function renderSearchIdle() {
  $('#search-suggest').innerHTML = SEARCH_SUGGESTIONS.map((s) => `<button class="chip" data-suggest="${esc(s)}">${esc(s)}</button>`).join('');
  $('#search-suggest').hidden = false;
  const n = doneThoughts().length;
  $('#search-hint').textContent = n > 1 ? `Searches all ${n} of your thoughts by meaning — ask in any language.` : n === 1 ? 'Searches your thoughts by meaning — ask in any language.' : 'Your thoughts will be searchable here, by meaning, in any language.';
  $('#search-hint').hidden = false;
}

function showKeywordResults(q) {
  const res = $('#search-results');
  $('#search-answer').innerHTML = '';
  if (!q.trim()) { res.innerHTML = ''; renderSearchIdle(); return; }
  $('#search-suggest').hidden = true;
  $('#search-hint').hidden = true;
  const hits = keywordSearch(q);
  lastMarks = tokenize(q);
  res.innerHTML = hits.length
    ? `<div class="results-label">${hits.length} match${hits.length === 1 ? '' : 'es'} · press Ask for a deeper search</div>${hits.slice(0, 30).map((t, i) => cardHTML(t, i, lastMarks)).join('')}`
    : `<div class="results-label">No exact words match · press Ask to search by meaning</div>`;
}

async function runAsk(q) {
  q = q.trim();
  if (!q) return;
  const seq = ++S.searchSeq;
  $('#search-input').blur();
  $('#search-suggest').hidden = true;
  $('#search-hint').hidden = true;
  const done = doneThoughts();
  const ans = $('#search-answer');
  const res = $('#search-results');
  if (!done.length) {
    ans.innerHTML = `<div class="answer"><div class="answer-label">Your past self</div><p class="answer-text">Nothing to search yet. Record a few thoughts and ask again.</p></div>`;
    res.innerHTML = '';
    return;
  }
  ans.innerHTML = `<div class="answer thinking"><div class="answer-label"><span class="spinner"></span> Reading your journal</div><p class="answer-text shimmer">Looking through ${done.length} thought${done.length === 1 ? '' : 's'}…</p></div>`;
  res.innerHTML = '';

  // Rank by meaning (embeddings) + words
  let semantic = [];
  const haveVectors = done.some((t) => t.embedding);
  if (haveVectors) {
    try {
      const { vectors } = await api('embed', { texts: [q] });
      const qv = vectors[0];
      semantic = done.filter((t) => t.embedding).map((t) => ({ t, s: cosine(qv, t.embedding) })).sort((a, b) => b.s - a.s);
    } catch (e) { console.warn('semantic search unavailable', e); }
  }
  if (seq !== S.searchSeq) return;
  const keyword = keywordSearch(q).filter((t) => t.status === 'done');
  let candidates;
  if (done.length <= 60) candidates = done;
  else {
    const ids = new Set();
    candidates = [];
    for (const x of [...semantic.slice(0, 24).map((x) => x.t), ...keyword.slice(0, 12)]) if (!ids.has(x.id)) { ids.add(x.id); candidates.push(x); }
    if (!candidates.length) candidates = done.slice(0, 40);
  }
  const shortIds = new Map(candidates.map((t, i) => [`e${i + 1}`, t]));
  try {
    const r = await api('ask', {
      question: q,
      author: S.settings.author,
      entries: [...shortIds.entries()].map(([id, t]) => ({ id, date: fmt.medium(t.createdAt), title: t.reflection.title, sutra: t.reflection.sutra, text: t.reflection.translation || t.reflection.cleaned_original })),
    }, { timeout: 90_000 });
    if (seq !== S.searchSeq) return;
    const matched = r.matches.map((m) => ({ t: shortIds.get(m.id), rel: m.relevance })).filter((m) => m.t);
    const words = esc(r.answer || '').split(/(\s+)/).map((w, i) => (w.trim() ? `<span class="w" style="--i:${i}">${w}</span>` : w)).join('');
    ans.innerHTML = `<div class="answer"><div class="answer-label">✦ ${r.has_spoken ? 'You have spoken about this' : 'Not yet in your journal'}</div><p class="answer-text">${words}</p>
      ${!r.has_spoken ? `<button class="mini-btn" data-speak-about="${esc(q)}">Speak about it now</button>` : ''}</div>`;
    const ids = new Set(matched.map((m) => m.t.id));
    const more = semantic.filter((x) => x.s > 0.55 && !ids.has(x.t.id)).slice(0, 4).map((x) => x.t);
    lastMarks = tokenize(q);
    res.innerHTML = (matched.length ? `<div class="results-label">Where you said it</div>${matched.map((m, i) => cardHTML(m.t, i, lastMarks)).join('')}` : '')
      + (more.length ? `<div class="results-label" style="margin-top:14px">Related by meaning</div>${more.map((t, i) => cardHTML(t, i + matched.length, lastMarks)).join('')}` : '');
    animateList(res, true);
  } catch (e) {
    if (seq !== S.searchSeq) return;
    const fallback = semantic.length ? semantic.filter((x) => x.s > 0.45).slice(0, 10).map((x) => x.t) : keyword.slice(0, 20);
    ans.innerHTML = `<div class="answer"><div class="answer-label">Offline search</div><p class="answer-text" style="font-size:16px">${esc(e.network ? 'Can’t reach the server right now — here are the closest matches on this device.' : e.message)}</p></div>`;
    lastMarks = tokenize(q);
    res.innerHTML = fallback.map((t, i) => cardHTML(t, i, lastMarks)).join('') || emptyHTML('No matches', 'Try different words.');
  }
}

/* ───────────── BOOK view ───────────── */
const bookTitle = () => S.settings.bookTitle?.trim() || S.book?.title || `The Sutras of ${firstName()}`;

function bookStats() {
  const ids = new Set(S.book?.ids || []);
  const done = doneThoughts();
  return { done, newCount: done.filter((t) => !ids.has(t.id)).length };
}

function coverHTML(verseCount, chapterCount) {
  const done = doneThoughts();
  const years = done.length ? [...new Set(done.map((t) => new Date(t.createdAt).getFullYear()))].sort() : [new Date().getFullYear()];
  const span = years.length > 1 ? `${years[0]}–${years[years.length - 1]}` : years[0];
  return `<div class="cover">
    <div class="cover-mark"></div>
    <h2 class="cover-title">${esc(bookTitle())}</h2>
    <p class="cover-sub">${esc(S.book?.subtitle || 'Thoughts spoken aloud, kept for good')}</p>
    <div class="cover-orn"></div>
    <div class="cover-author">${esc(authorName())}</div>
    <div class="cover-stats">${verseCount} verses${chapterCount ? ` · ${chapterCount} chapters` : ''} · ${span}</div>
  </div>`;
}

function bookChapters() {
  const byId = new Map(S.thoughts.map((t) => [t.id, t]));
  return (S.book?.chapters || [])
    .map((ch) => ({ ...ch, verses: ch.ids.map((id) => byId.get(id)).filter((t) => t?.reflection) }))
    .filter((ch) => ch.verses.length);
}

function verseHTML(t, num, printing) {
  const r = t.reflection;
  const showOrig = r.sutra_original && norm(r.sutra_original) !== norm(r.sutra);
  return `<div class="verse" data-verse="${t.id}">
    <div class="verse-num">${num}</div>
    ${showOrig ? `<p class="verse-orig">${esc(r.sutra_original)}</p>` : ''}
    <p class="verse-text">${esc(r.sutra)}</p>
    <div class="verse-meta">— ${esc(authorName())}, ${esc(fmt.date(t.createdAt))}</div>
    ${r.essence ? `<details class="verse-comm" ${printing ? 'open' : ''}><summary>Commentary</summary><p>${esc(r.essence)}</p></details>` : ''}
  </div>`;
}

function pagesHTML(printing = false) {
  const chapters = bookChapters();
  const paras = (s) => String(s || '').split(/\n+/).filter(Boolean).map((p) => `<p class="prose">${esc(p)}</p>`).join('');
  let html = S.book.preface ? `<article class="page preface" id="pg-preface"><div class="page-kicker">Preface</div><div class="orn"></div>${paras(S.book.preface)}</article>` : '';
  chapters.forEach((ch, ci) => {
    html += `<article class="page" id="pg-ch${ci + 1}">
      <div class="page-kicker">Chapter ${roman(ci + 1)}</div>
      <h3>${esc(ch.name)}</h3>
      ${ch.subtitle ? `<p class="ch-sub">${esc(ch.subtitle)}</p>` : ''}
      <div class="orn"></div>
      ${ch.intro ? `<p class="ch-intro">${esc(ch.intro)}</p>` : ''}
      <div class="verses">${ch.verses.map((t, vi) => verseHTML(t, `${ci + 1}.${vi + 1}`, printing)).join('')}</div>
    </article>`;
  });
  if (S.book.closing) html += `<article class="page"><div class="orn"></div><p class="closing">${esc(S.book.closing)}</p><div class="orn"></div></article>`;
  return html;
}

function renderBook(compiling = S.compiling) {
  const root = $('#book-root');
  const { done, newCount } = bookStats();
  if (done.length < 3) {
    const pct = Math.round((done.length / 3) * 100);
    root.innerHTML = `<div class="view-head"><h2>Your book</h2></div>
      <div class="empty book-empty"><div class="em-orb"></div><h3>Your book begins with three thoughts</h3>
      <p>Every thought you keep becomes a verse. Once you have three, Vichaar arranges them into chapters — your own book of wisdom.</p>
      <div class="progress"><i style="width:${pct}%"></i></div><p style="margin-top:10px;font-size:13px;color:var(--faint)">${done.length} of 3</p></div>`;
    return;
  }
  if (compiling) {
    root.innerHTML = `<div class="view-head"><h2>Your book</h2></div>${coverHTML(done.length, 0)}
      <div class="answer thinking" style="margin-top:22px;text-align:center"><div class="answer-label" style="justify-content:center"><span class="spinner"></span> Composing</div>
      <p class="answer-text shimmer">Arranging ${done.length} verses into chapters…</p></div>`;
    return;
  }
  if (!S.book) {
    root.innerHTML = `<div class="view-head"><h2>Your book</h2></div>${coverHTML(done.length, 0)}
      <div style="max-width:420px;margin:22px auto 0"><button class="primary-btn" data-book="compile">Compile my book</button>
      <p class="fine" style="text-align:center">Vichaar groups your ${done.length} thoughts into chapters, writes a preface, and numbers every verse.</p></div>`;
    return;
  }
  const chapters = bookChapters();
  const verseCount = chapters.reduce((n, c) => n + c.verses.length, 0);
  root.innerHTML = `<div class="view-head"><h2>Your book</h2><span class="view-sub">compiled ${esc(fmt.medium(S.book.compiledAt))}</span></div>
    ${coverHTML(verseCount, chapters.length)}
    <div class="book-actions">
      <button class="ghost-btn" data-book="pdf">Save as PDF</button>
      <button class="ghost-btn" data-book="download">Download</button>
      <button class="ghost-btn" data-book="compile">Recompile</button>
    </div>
    ${newCount ? `<div class="book-banner"><span>✦ ${newCount} new thought${newCount === 1 ? ' isn’t' : 's aren’t'} in your book yet.</span><button class="mini-btn" data-book="compile">Add them</button></div>` : ''}
    <ol class="toc stagger">
      ${S.book.preface ? `<li style="--i:0"><button data-goto="pg-preface"><span class="n">·</span><span class="nm">Preface</span></button></li>` : ''}
      ${chapters.map((c, i) => `<li style="--i:${i + 1}"><button data-goto="pg-ch${i + 1}"><span class="n">${roman(i + 1)}</span><span class="nm">${esc(c.name)}</span><span class="c">${c.verses.length}</span></button></li>`).join('')}
    </ol>
    <div class="pages">${pagesHTML()}</div>`;
}

async function compileBook() {
  const done = doneThoughts().slice().sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  if (done.length < 3 || S.compiling) return;
  S.compiling = true;
  renderBook();
  const idMap = new Map(done.map((t, i) => [`v${i + 1}`, t.id]));
  try {
    const r = await api('book', {
      author: authorName(),
      title: S.settings.bookTitle,
      language: S.settings.targetLang,
      verses: done.map((t, i) => ({ id: `v${i + 1}`, date: fmt.medium(t.createdAt), theme: t.reflection.chapter_hint || t.reflection.themes?.[0] || '', sutra: t.reflection.sutra })),
    }, { timeout: 200_000 });
    const used = new Set();
    const chapters = r.book.chapters.map((c) => ({
      name: c.name, subtitle: c.subtitle, intro: c.intro,
      ids: c.verse_ids.map((v) => idMap.get(v)).filter((id) => id && !used.has(id) && used.add(id)),
    })).filter((c) => c.ids.length);
    const leftover = done.filter((t) => !used.has(t.id)).map((t) => t.id);
    if (leftover.length) chapters.push({ name: 'Further Sayings', subtitle: '', intro: '', ids: leftover });
    S.book = {
      title: r.book.title, subtitle: r.book.subtitle, preface: r.book.preface, closing: r.book.closing,
      chapters, ids: done.map((t) => t.id), compiledAt: new Date().toISOString(),
    };
    await DB.put('kv', { key: 'book', value: S.book });
    S.compiling = false;
    if (S.view === 'book') renderBook();
    toast('Your book is ready.');
  } catch (e) {
    S.compiling = false;
    if (S.view === 'book') renderBook();
    toast(e.network ? 'You’re offline — compile again when you’re connected.' : e.message, 'err', 5000);
  }
}

function printBook() {
  if (!S.book) return;
  const root = $('#print-root');
  const chapters = bookChapters();
  root.innerHTML = coverHTML(chapters.reduce((n, c) => n + c.verses.length, 0), chapters.length) + pagesHTML(true);
  setTimeout(() => {
    window.print();
    setTimeout(() => { root.innerHTML = ''; }, 1000);
  }, 60);
}

async function downloadBook() {
  if (!S.book) return;
  const chapters = bookChapters();
  const css = await (await fetch('styles.css')).text().catch(() => '');
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(bookTitle())} — ${esc(authorName())}</title>
<link rel="preconnect" href="https://fonts.googleapis.com"><link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400&family=Inter:wght@400;600&family=Tiro+Devanagari+Hindi&display=swap" rel="stylesheet">
<style>${css.replace(/@font-face\s*{[^}]*}/g, '')}
:root{--serif:'Cormorant Garamond','Tiro Devanagari Hindi',Georgia,serif;--sans:'Inter',system-ui,sans-serif;--deva:'Tiro Devanagari Hindi',serif}
body{padding:24px 16px 60px}.wrap{max-width:640px;margin:0 auto}.pages{margin-top:34px}
.foot{text-align:center;color:#7a7287;font-size:12px;margin-top:30px}</style></head>
<body><div class="print-root" style="display:block"><div class="wrap">${coverHTML(chapters.reduce((n, c) => n + c.verses.length, 0), chapters.length)}<div class="pages">${pagesHTML(true)}</div>
<p class="foot">Made with Vichaar · ${esc(fmt.date(new Date()))}</p></div></div></body></html>`;
  await shareOrDownload(new Blob([html], { type: 'text/html' }), `${slug(bookTitle())}.html`);
}

/* ───────────── SETTINGS ───────────── */
function fillSelects() {
  $$('select[data-options="speak"]').forEach((sel) => { sel.innerHTML = SPEAK_LANGS.map(([v, l]) => `<option value="${v}">${esc(l)}</option>`).join(''); });
  $$('select[data-options="target"]').forEach((sel) => { sel.innerHTML = TARGET_LANGS.map((l) => `<option>${esc(l)}</option>`).join(''); });
}

function fillSettingsForm() {
  const f = $('#settings-form');
  for (const k of ['author', 'bookTitle', 'speakLang', 'targetLang', 'accessCode']) f.elements[k].value = S.settings[k] || '';
  f.elements.chime.checked = S.settings.chime !== false;
  $('#version-line').textContent = `Vichaar ${VERSION}`;
  $('#btn-install').hidden = isStandalone();
}

let settingsTimer = 0;
function onSettingsInput(e) {
  const f = $('#settings-form');
  for (const k of ['author', 'bookTitle', 'speakLang', 'targetLang', 'accessCode']) S.settings[k] = f.elements[k].value.trim();
  S.settings.chime = f.elements.chime.checked;
  if (e?.target?.name === 'chime' && S.settings.chime) { unlockAudio(); chime(0.7); }
  clearTimeout(settingsTimer);
  settingsTimer = setTimeout(async () => {
    await saveSettings();
    renderGreeting();
    if (S.view === 'book') renderBook();
    if (e?.target?.name === 'accessCode') { await checkServer(); processQueue(); }
  }, 350);
}

function renderServerStatus() {
  const el = $('#server-status');
  const s = S.server;
  if (!s) { el.innerHTML = '<span class="dot"></span> Checking server…'; return; }
  if (!s.ok) {
    el.innerHTML = `<span class="dot bad"></span> ${esc(s.network ? 'Can’t reach the server right now. Your thoughts are safe here and will be processed later.' : s.error || 'Server unavailable')}`;
    return;
  }
  if (!s.speech) {
    el.innerHTML = '<span class="dot bad"></span> Server reachable, but the Workers AI binding is missing.';
    return;
  }
  const brain = s.claude ? 'Claude' : 'Workers AI';
  el.innerHTML = `<span class="dot ok"></span> Connected · thinking with ${brain}${s.locked ? ' · protected by access code' : ''}`;
}

async function exportBackup() {
  const thoughts = S.thoughts.map((t) => ({ ...t, embedding: t.embedding ? Array.from(t.embedding) : null }));
  const { accessCode, ...settings } = S.settings;
  const data = { app: 'vichaar', version: VERSION, exportedAt: new Date().toISOString(), settings, book: S.book, thoughts };
  await shareOrDownload(new Blob([JSON.stringify(data)], { type: 'application/json' }), `vichaar-backup-${new Date().toISOString().slice(0, 10)}.json`);
  toast('Backup ready (voice recordings stay on this device).', '', 4500);
}

async function importBackup(file) {
  try {
    const data = JSON.parse(await file.text());
    if (data.app !== 'vichaar' || !Array.isArray(data.thoughts)) throw new Error('This isn’t a Vichaar backup.');
    let added = 0;
    for (const t of data.thoughts) {
      if (!t?.id || !t.createdAt) continue;
      if (!findThought(t.id)) added++;
      t.embedding = t.embedding ? new Float32Array(t.embedding) : null;
      if (t.status !== 'done') { t.status = t.source === 'voice' && !t.transcript ? 'error' : 'queued'; t.error = t.status === 'error' ? 'Recording not included in backup.' : null; }
      await DB.put('thoughts', t);
    }
    if (data.book && !S.book) { S.book = data.book; await DB.put('kv', { key: 'book', value: S.book }); }
    if (data.settings) {
      for (const k of ['author', 'bookTitle', 'speakLang', 'targetLang']) if (!S.settings[k] && data.settings[k]) S.settings[k] = data.settings[k];
      await saveSettings();
    }
    S.thoughts = (await DB.all('thoughts')).sort(byNewest);
    fillSettingsForm();
    renderAll();
    toast(`Imported ${added} new thought${added === 1 ? '' : 's'}.`);
    processQueue();
  } catch (e) {
    toast(e.message || 'Couldn’t read that file.', 'err');
  }
}

async function wipeAll() {
  if (!confirm('Delete every thought, recording and your book from this device? This can’t be undone.')) return;
  await Promise.all([DB.clear('thoughts'), DB.clear('audio'), DB.clear('kv')]);
  location.reload();
}

/* ───────────── INSTALL ───────────── */
const isIOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
const isStandalone = () => matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
const isMobile = () => isIOS() || /android/i.test(navigator.userAgent);
const SHARE_ICON = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v12M7 8l5-5 5 5M6 11H5v10h14V11h-1"/></svg>';

function openInstall() {
  const steps = $('#install-steps');
  const go = $('#install-go');
  if (isStandalone()) { toast('Vichaar is already installed on this device.'); return; }
  if (S.deferredInstall) {
    steps.innerHTML = '';
    go.hidden = false;
  } else if (isIOS()) {
    go.hidden = true;
    steps.innerHTML = `<li><span>Tap ${SHARE_ICON} <b>Share</b> in Safari (on newer iOS, tap <b>•••</b> first)</span></li>
      <li><span>Choose <b>Add to Home Screen</b></span></li>
      <li><span>Tap <b>Add</b> — Vichaar appears next to your apps</span></li>`;
  } else {
    go.hidden = true;
    steps.innerHTML = `<li><span>Open your browser menu (<b>⋮</b> or <b>•••</b>)</span></li>
      <li><span>Choose <b>Install app</b> or <b>Add to Home screen</b></span></li>`;
  }
  openSheet('sheet-install');
}

/* ───────────── sheets ───────────── */
let openSheetId = null;

function openSheet(id) {
  if (openSheetId && openSheetId !== id) closeSheet(true, true);
  const el = $(`#${id}`);
  const scrim = $('#scrim');
  el.hidden = false;
  scrim.hidden = false;
  el.style.transform = '';
  requestAnimationFrame(() => requestAnimationFrame(() => { el.classList.add('show'); scrim.classList.add('show'); }));
  document.body.classList.add('locked');
  if (openSheetId !== id) history.pushState({ sheet: id }, '');
  openSheetId = id;
}

function closeSheet(fromPop = false, instant = false) {
  if (!openSheetId) return;
  if (!fromPop && history.state?.sheet === openSheetId) { history.back(); return; }
  const el = $(`#${openSheetId}`);
  const scrim = $('#scrim');
  const id = openSheetId;
  openSheetId = null;
  el.classList.remove('show');
  el.style.transform = '';
  scrim.classList.remove('show');
  document.body.classList.remove('locked');
  if (id === 'sheet-detail') { stopPlayer(); S.detailId = null; }
  const hide = () => { if (openSheetId !== id) { el.hidden = true; if (!openSheetId) scrim.hidden = true; } };
  if (instant) hide(); else setTimeout(hide, 450);
}

function enableSheetDrag(sheet) {
  let startY = 0, dy = 0, dragging = false;
  $$('[data-drag]', sheet).forEach((h) => {
    h.addEventListener('pointerdown', (e) => {
      if (e.target.closest('button')) return;
      dragging = true; startY = e.clientY; dy = 0;
      sheet.classList.add('dragging');
      h.setPointerCapture(e.pointerId);
    });
    h.addEventListener('pointermove', (e) => {
      if (!dragging) return;
      dy = Math.max(0, e.clientY - startY);
      sheet.style.transform = `translate(-50%, ${dy}px)`;
    });
    const end = () => {
      if (!dragging) return;
      dragging = false;
      sheet.classList.remove('dragging');
      if (dy > 110) closeSheet(); else sheet.style.transform = '';
    };
    h.addEventListener('pointerup', end);
    h.addEventListener('pointercancel', end);
  });
}

/* ───────────── toasts ───────────── */
function toast(msg, kind = '', ms = 3200) {
  const el = document.createElement('div');
  el.className = `toast ${kind}`;
  el.textContent = msg;
  $('#toasts').appendChild(el);
  setTimeout(() => { el.classList.add('out'); setTimeout(() => el.remove(), 320); }, ms);
}

/* ───────────── navigation ───────────── */
function moveIndicator() {
  const tab = $(`.tab[data-tab="${S.view}"]`);
  const ind = $('#tab-ind');
  if (!tab) return;
  ind.style.width = `${tab.offsetWidth}px`;
  ind.style.transform = `translateX(${tab.offsetLeft - 6}px)`;
}

function switchView(v) {
  if (!['speak', 'journal', 'search', 'book'].includes(v)) v = 'speak';
  if (v === S.view) { window.scrollTo({ top: 0, behavior: reducedMotion ? 'auto' : 'smooth' }); return; }
  if (Rec.state === 'recording') { toast('Finish your recording first.'); return; }
  S.scroll[S.view] = window.scrollY;
  S.view = v;
  $$('.view').forEach((sec) => { sec.hidden = sec.dataset.view !== v; });
  $$('.tab').forEach((t) => t.classList.toggle('active', t.dataset.tab === v));
  moveIndicator();
  if (v === 'speak') { renderGreeting(); renderLatest(); startLoop(); } else stopLoop();
  if (v === 'journal') { $('#journal-badge').hidden = true; renderJournal(true); }
  if (v === 'search') { if (!$('#search-input').value) renderSearchIdle(); }
  if (v === 'book') renderBook();
  window.scrollTo(0, S.scroll[v] || 0);
}

function renderAll() {
  renderGreeting();
  renderLatest();
  if (S.view === 'journal') renderJournal();
  if (S.view === 'book') renderBook();
  updateJournalMeta();
}

/* ───────────── events ───────────── */
function bindEvents() {
  $('#orb').addEventListener('click', toggleRecord);
  $('#btn-discard').addEventListener('click', discardRecording);
  $('#btn-write').addEventListener('click', () => { openSheet('sheet-write'); setTimeout(() => $('#write-form textarea').focus(), 350); });
  $('#write-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    unlockAudio();
    const ta = e.target.elements.text;
    if (!ta.value.trim()) return;
    const text = ta.value;
    ta.value = '';
    closeSheet();
    if (S.view !== 'speak') switchView('speak');
    await saveWrittenThought(text);
  });

  $$('.tab').forEach((t) => t.addEventListener('click', () => switchView(t.dataset.tab)));
  $('#btn-settings').addEventListener('click', () => { fillSettingsForm(); renderServerStatus(); openSheet('sheet-settings'); checkServer(); });
  $('#scrim').addEventListener('click', () => closeSheet());
  $$('[data-close]').forEach((b) => b.addEventListener('click', () => closeSheet()));
  $$('.sheet').forEach(enableSheetDrag);
  window.addEventListener('popstate', () => { if (openSheetId) closeSheet(true); });
  window.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    if (!$('#reveal').hidden) closeReveal(); else if (openSheetId) closeSheet();
  });
  $('#reveal').addEventListener('click', (e) => {
    const b = e.target.closest('[data-reveal]');
    if (!b) return;
    if (b.dataset.reveal === 'close') closeReveal();
    else closeReveal((id) => { openDetail(id); setTimeout(() => $('#parallel-sec')?.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'start' }), 520); });
  });

  // Cards anywhere (delegated)
  document.addEventListener('click', (e) => {
    const retry = e.target.closest('[data-retry]');
    if (retry) { e.stopPropagation(); retryThought(retry.dataset.retry); return; }
    const card = e.target.closest('.card[data-id], .resurface-card[data-id]');
    if (card) { openDetail(card.dataset.id); return; }
    const filter = e.target.closest('[data-filter]');
    if (filter) { S.journalFilter = filter.dataset.filter; renderJournal(true); return; }
    const sug = e.target.closest('[data-suggest]');
    if (sug) { $('#search-input').value = sug.dataset.suggest; runAsk(sug.dataset.suggest); return; }
    const speakAbout = e.target.closest('[data-speak-about]');
    if (speakAbout) { switchView('speak'); setPrompt('Tell me what you think about it.'); return; }
    const bookBtn = e.target.closest('[data-book]');
    if (bookBtn) {
      const a = bookBtn.dataset.book;
      if (a === 'compile') compileBook();
      if (a === 'pdf') printBook();
      if (a === 'download') downloadBook();
      return;
    }
    const goto = e.target.closest('[data-goto]');
    if (goto) { document.getElementById(goto.dataset.goto)?.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'start' }); }
  });
  document.addEventListener('keydown', (e) => {
    if ((e.key === 'Enter' || e.key === ' ') && e.target.matches?.('.card[data-id], .resurface-card[data-id]')) { e.preventDefault(); openDetail(e.target.dataset.id); }
  });

  $('#detail-body').addEventListener('click', (e) => {
    const act = e.target.closest('[data-act]');
    if (act) { detailAction(act.dataset.act); return; }
    if (e.target.closest('[data-play]')) togglePlayer();
  });

  // Search
  let searchTimer = 0;
  $('#search-input').addEventListener('input', (e) => { clearTimeout(searchTimer); S.searchSeq++; searchTimer = setTimeout(() => showKeywordResults(e.target.value), 120); });
  $('#search-form').addEventListener('submit', (e) => { e.preventDefault(); runAsk($('#search-input').value); });

  // Settings
  $('#settings-form').addEventListener('input', onSettingsInput);
  $('#settings-form').addEventListener('change', onSettingsInput);
  $('#btn-install').addEventListener('click', openInstall);
  $('#btn-export').addEventListener('click', exportBackup);
  $('#import-file').addEventListener('change', (e) => { const f = e.target.files?.[0]; if (f) importBackup(f); e.target.value = ''; });
  $('#btn-wipe').addEventListener('click', wipeAll);
  $('#install-go').addEventListener('click', async () => {
    const p = S.deferredInstall;
    if (!p) return;
    S.deferredInstall = null;
    p.prompt();
    try { await p.userChoice; } catch { /* ignore */ }
    closeSheet();
  });
  window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); S.deferredInstall = e; });
  window.addEventListener('appinstalled', () => toast('Installed. Find Vichaar on your Home Screen.'));

  // Onboarding
  $('#ob-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const f = e.target;
    S.settings.author = f.elements.author.value.trim();
    S.settings.speakLang = f.elements.speakLang.value;
    if (S.settings.speakLang === 'hi' || S.settings.speakLang === 'hi-en') S.settings.targetLang = 'English';
    S.settings.onboarded = true;
    unlockAudio();
    await saveSettings();
    try { await navigator.storage?.persist?.(); } catch { /* ignore */ }
    const ob = $('#onboarding');
    ob.classList.add('leave');
    setTimeout(() => { ob.hidden = true; ob.classList.remove('leave'); }, 600);
    renderGreeting();
    if (isMobile() && !isStandalone() && !S.settings.installHintShown) {
      S.settings.installHintShown = true;
      saveSettings();
      setTimeout(openInstall, 900);
    }
  });

  // Network + lifecycle
  const net = () => { $('#net-pill').hidden = navigator.onLine; if (navigator.onLine) processQueue(); };
  window.addEventListener('online', net);
  window.addEventListener('offline', net);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      if (Rec.state === 'recording') finishRecording(); // never lose a thought when the app is backgrounded
      stopLoop();
    } else {
      if (S.view === 'speak') startLoop();
      renderGreeting();
      processQueue();
    }
  });
  window.addEventListener('resize', moveIndicator);
  setInterval(() => { if (navigator.onLine && S.thoughts.some((t) => t.status === 'queued')) processQueue(); }, 30_000);
}

/* ───────────── boot ───────────── */
async function boot() {
  fillSelects();
  try {
    const [settings, book, thoughts] = await Promise.all([DB.get('kv', 'settings'), DB.get('kv', 'book'), DB.all('thoughts')]);
    S.settings = { ...DEFAULT_SETTINGS, ...(settings?.value || {}) };
    S.book = book?.value || null;
    S.thoughts = (thoughts || []).sort(byNewest);
  } catch (e) {
    console.error(e);
    toast('Storage is unavailable in this browser mode — thoughts won’t be saved.', 'err', 6000);
  }
  // Anything interrupted mid-processing goes back in the queue
  for (const t of S.thoughts) if (['transcribing', 'reflecting', 'indexing'].includes(t.status)) t.status = 'queued';

  bindEvents();
  Motes.init();
  renderGreeting();
  renderLatest();
  updateJournalMeta();
  $('#net-pill').hidden = navigator.onLine;
  requestAnimationFrame(moveIndicator);
  setTimeout(moveIndicator, 400);
  startLoop();
  startPromptRotation();

  if (!S.settings.onboarded) {
    $('#onboarding').hidden = false;
    $('#ob-form').elements.speakLang.value = S.settings.speakLang;
    $('#ob-form').elements.author.value = S.settings.author || '';
  }

  const params = new URLSearchParams(location.search);
  if (params.get('view')) switchView(params.get('view'));
  if (params.get('action') === 'record') pulse($('#orb'));

  if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) {
    navigator.serviceWorker.register('sw.js').catch((e) => console.warn('SW registration failed', e));
  }
  checkServer().then(() => processQueue());
}

boot();
