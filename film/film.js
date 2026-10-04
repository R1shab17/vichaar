/* Vichaar film engine — every frame is a pure function of time t.
   film.html?v=hero|reveal&lang=en|hi   →   window.render(t) */
(() => {
  const Q = new URLSearchParams(location.search);
  const V = Q.get('v') === 'reveal' ? 'reveal' : 'hero';
  const LANG = Q.get('lang') === 'hi' ? 'hi' : 'en';
  const HERO = V === 'hero';
  const W = HERO ? 1920 : 1080;
  const H = HERO ? 1080 : 1920;
  const DURATION = HERO ? 86 : 112;

  /* ───────── math ───────── */
  const clamp = (x, a = 0, b = 1) => (x < a ? a : x > b ? b : x);
  const P = (t, a, b) => clamp((t - a) / (b - a));
  const E = {
    out: (x) => 1 - Math.pow(1 - x, 3),
    inOut: (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2),
    sine: (x) => -(Math.cos(Math.PI * x) - 1) / 2,
    back: (x) => { const c1 = 1.4, c3 = c1 + 1; return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2); },
  };
  const win = (t, a, b, fi = 0.8, fo = 0.8) => Math.min(E.out(P(t, a, a + fi)), 1 - E.inOut(P(t, b - fo, b)));
  const mulberry32 = (a) => () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let x = Math.imul(a ^ (a >>> 15), 1 | a); x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x; return ((x ^ (x >>> 14)) >>> 0) / 4294967296; };
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const f3 = (x) => x.toFixed(3);

  /* ───────── words ───────── */
  const TXT = {
    en: {
      intro1: 'Every day, a thought arrives that feels like it could change everything.',
      intro2: 'By evening, it’s gone.',
      r_intro1: 'I kept having thoughts I was sure no one in history had ever had.',
      r_intro2: 'I’d say them once… and lose them.',
      r_intro3: 'So I built a place to keep them.',
      tag: 'Speak a thought. Keep it forever.',
      k1: '01 — Speak', h1: 'Speak in any language. Even two at once.', s1: 'Hindi, English, Hinglish — just talk. Vichaar listens, transcribes and translates.',
      rh1: 'Tap. Talk. Any language — even Hindi and English in the same breath.',
      speechLabel: 'You, speaking',
      speechTr: '“I feel a person’s real purpose isn’t what they become — it’s whom they become it for.”',
      k2: '02 — Distil', h2: 'Watch it become a sutra.', s2: 'Your thought, distilled into one line — signed with your name, dated forever.',
      rh2: 'It comes back as a sutra — signed, dated, yours.',
      k3: '03 — Parallel minds', h3: 'You’re not the first to reach it. You’re the latest.', s3: 'Great minds arrive at the same truths on their own. Vichaar shows who walked the path before you — and what is yours alone.',
      rh3: 'Meet the minds who reached the same truth — on their own, centuries apart.', rh3b: 'Getting there yourself still counts.',
      k4: '04 — Ask', h4: 'Ask your past self anything.', s4: 'Search everything you’ve ever said — by meaning, in any language.',
      rh4: 'Ask your past self anything. It remembers when you said it.',
      k5: '05 — Your book', h5: 'Verse by verse, your own book of wisdom.', s5: 'Chapters, numbered verses, a preface. Yours to print, share and keep.',
      rh5: 'Verse by verse, it becomes your own book of wisdom.',
      endTag: 'Every thought worth having is worth keeping.',
      credit: 'Built by Rishab Choudhary',
      you: 'You',
      query: 'Have I ever talked about the purpose of life?',
      answerLabel: '✦ You have spoken about this',
      answer: 'Yes. Today you said purpose is not what you become, but whom you become it for. In August you came close too — that knowing yourself frees you from explaining yourself.',
      names: { Laozi: 'Laozi', Aristotle: 'Aristotle', Seneca: 'Seneca', Kabir: 'Kabir', Vivekananda: 'Vivekananda', Frankl: 'Frankl' },
      bce: (y) => `${y} BCE`,
    },
    hi: {
      intro1: 'हर दिन एक ऐसा विचार आता है, जो लगता है सब कुछ बदल सकता है।',
      intro2: 'और शाम तक… वो कहीं खो जाता है।',
      r_intro1: 'मुझे बार-बार ऐसे विचार आते थे — जो लगता था, इतिहास में आज तक किसी ने नहीं सोचे।',
      r_intro2: 'मैं उन्हें एक बार बोलता… और भूल जाता।',
      r_intro3: 'तो मैंने उन्हें सहेजने की एक जगह बना ली।',
      tag: 'एक विचार बोलिए। हमेशा के लिए सहेजिए।',
      k1: '01 — बोलिए', h1: 'किसी भी भाषा में बोलिए। चाहे दो एक साथ।', s1: 'हिंदी, English, Hinglish — बस बोलिए। Vichaar सुनता है, लिखता है और अनुवाद करता है।',
      rh1: 'टैप कीजिए। बोलिए। किसी भी भाषा में — हिंदी और English एक ही साँस में भी।',
      speechLabel: 'आप, बोलते हुए',
      speechTr: '',
      k2: '02 — सार', h2: 'देखिए, वो एक सूत्र बन जाता है।', s2: 'आपका विचार, एक पंक्ति में — आपके नाम और तारीख़ के साथ, हमेशा के लिए।',
      rh2: 'वो एक सूत्र बनकर लौटता है — आपके नाम, आपकी तारीख़ के साथ।',
      k3: '03 — समानांतर मन', h3: 'आप वहाँ पहुँचने वाले पहले नहीं — सबसे नए हैं।', s3: 'महान मन एक ही सत्य तक अपने-अपने रास्ते से पहुँचते हैं। Vichaar दिखाता है कि आपसे पहले ये रास्ता किसने चला — और क्या सिर्फ़ आपका है।',
      rh3: 'मिलिए उन मनों से जो इसी सत्य तक पहुँचे — अपने आप, सदियों पहले।', rh3b: 'अपने दम पर वहाँ पहुँचना — यही असली खोज है।',
      k4: '04 — पूछिए', h4: 'अपने बीते कल से कुछ भी पूछिए।', s4: 'आपने जो कुछ भी कभी कहा — अर्थ से खोजिए, किसी भी भाषा में।',
      rh4: 'अपने बीते कल से कुछ भी पूछिए। उसे याद है, आपने कब क्या कहा।',
      k5: '05 — आपकी किताब', h5: 'सूत्र दर सूत्र — आपकी अपनी ज्ञान-पुस्तक।', s5: 'अध्याय, क्रमांकित सूत्र, प्रस्तावना। छापिए, बाँटिए, सहेजिए।',
      rh5: 'सूत्र दर सूत्र, ये बन जाती है आपकी अपनी ज्ञान-पुस्तक।',
      endTag: 'हर विचार जो आया, सहेजने लायक है।',
      credit: 'ऋषभ चौधरी द्वारा निर्मित',
      you: 'आप',
      query: 'क्या मैंने कभी जीवन के मकसद के बारे में बोला है?',
      answerLabel: '✦ आप इस बारे में बोल चुके हैं',
      answer: 'हाँ। आज आपने कहा कि मकसद ये नहीं कि आप क्या बनते हैं, बल्कि ये कि आप किसके लिए बनते हैं। अगस्त में भी आपने कुछ ऐसा ही कहा था — कि खुद को समझ लेने के बाद दुनिया को समझाने की ज़रूरत नहीं रहती।',
      names: { Laozi: 'लाओत्से', Aristotle: 'अरस्तू', Seneca: 'सेनेका', Kabir: 'कबीर', Vivekananda: 'विवेकानंद', Frankl: 'फ्रैंकल' },
      bce: (y) => `${y} ई.पू.`,
    },
  };
  const T = TXT[LANG];
  const SPEECH = 'तो मेरे को ना ऐसा लगता है कि इंसान का असली मकसद ये नहीं है कि वो क्या बनता है… बल्कि ये कि वो किसके लिए बनता है।';

  /* ───────── stage ───────── */
  const stage = $('#stage');
  stage.style.width = `${W}px`;
  stage.style.height = `${H}px`;
  stage.classList.add(`lang-${LANG}`);
  const sizes = HERO
    ? { intro: 70, kick: 17, head: 74, sub: 25, speech: 30, title: 190, deva: 46, tag: 44, cstName: 36, cstYear: 19 }
    : { intro: 68, kick: 22, head: 62, sub: 26, speech: 30, title: 170, deva: 46, tag: 42, cstName: 34, cstYear: 15 };
  Object.entries({ '--intro-size': sizes.intro, '--kick-size': sizes.kick, '--head-size': sizes.head, '--sub-size': sizes.sub, '--speech-size': sizes.speech, '--title-size': sizes.title, '--deva-size': sizes.deva, '--tag-size': sizes.tag, '--cst-name': sizes.cstName, '--cst-year': sizes.cstYear })
    .forEach(([k, v]) => stage.style.setProperty(k, `${v}px`));

  const mk = (html, parent = stage) => {
    const d = document.createElement('div');
    d.innerHTML = html.trim();
    const n = d.firstElementChild;
    parent.appendChild(n);
    return n;
  };
  const splitWords = (node) => {
    const text = node.textContent;
    node.textContent = '';
    const spans = [];
    text.split(/(\s+)/).forEach((w) => {
      if (!w) return;
      if (/^\s+$/.test(w)) node.appendChild(document.createTextNode(w));
      else { const s = document.createElement('span'); s.className = 'w'; s.textContent = w; node.appendChild(s); spans.push(s); }
    });
    return spans;
  };
  const illuminate = (spans, t, t0, dw = 0.12, dur = 1.1, glow = 1) => {
    spans.forEach((s, i) => {
      const p = P(t, t0 + i * dw, t0 + i * dw + dur);
      const e = E.out(p);
      const g = glow * Math.max(0, 1 - Math.abs(p - 0.36) / 0.64);
      s.style.opacity = p <= 0 ? '0' : f3(Math.min(1, p * 2.4));
      s.style.filter = e < 0.999 ? `blur(${((1 - e) * 12).toFixed(2)}px)` : 'none';
      s.style.transform = `translateY(${((1 - e) * 14).toFixed(2)}px)`;
      s.style.textShadow = g > 0.01 ? `0 0 ${(26 * g).toFixed(1)}px rgba(255,214,140,${(0.9 * g).toFixed(2)})` : 'none';
    });
  };
  const dissolve = (spans, t, t0, dw = 0.05, dur = 1) => {
    spans.forEach((s, i) => {
      const p = E.inOut(P(t, t0 + i * dw, t0 + i * dw + dur));
      if (p <= 0) return;
      s.style.opacity = f3(1 - p);
      s.style.filter = `blur(${(p * 10).toFixed(1)}px)`;
      s.style.transform = `translateY(${(-p * 36).toFixed(1)}px)`;
    });
  };
  const show = (node, o, { x = 0, y = 0, s = 1, blur = 0 } = {}) => {
    node.style.opacity = f3(clamp(o));
    node.style.visibility = o <= 0.001 ? 'hidden' : 'visible';
    node.style.transform = `translate(${x.toFixed(2)}px, ${y.toFixed(2)}px) scale(${s.toFixed(4)})`;
    node.style.filter = blur > 0.05 ? `blur(${blur.toFixed(2)}px)` : 'none';
  };

  /* ───────── background canvas ───────── */
  const bg = $('#bg');
  bg.width = W; bg.height = H;
  const g = bg.getContext('2d');
  const RNG = mulberry32(5);
  const motes = Array.from({ length: HERO ? 120 : 150 }, () => ({ x: RNG(), y: RNG(), r: 0.6 + RNG() * 2.2, v: 10 + RNG() * 26, sway: 8 + RNG() * 34, ph: RNG() * 6.283, tw: 0.4 + RNG() * 1.4 }));
  const rayW = Array.from({ length: 64 }, () => 0.01 + RNG() * 0.02);
  const radial = (x, y, r, color, a) => {
    const gr = g.createRadialGradient(x, y, 0, x, y, r);
    gr.addColorStop(0, `rgba(${color},${a})`);
    gr.addColorStop(1, `rgba(${color},0)`);
    g.fillStyle = gr;
    g.fillRect(x - r, y - r, r * 2, r * 2);
  };
  function drawBg(t, st) {
    g.globalCompositeOperation = 'source-over';
    g.globalAlpha = 1;
    const grd = g.createLinearGradient(0, 0, 0, H);
    grd.addColorStop(0, '#07050c'); grd.addColorStop(0.6, '#0d0915'); grd.addColorStop(1, '#130c17');
    g.fillStyle = grd;
    g.fillRect(0, 0, W, H);
    radial(W * 0.15, H * 0.02, Math.max(W, H) * 0.62, '92,61,140', 0.3 * st.nebula);
    radial(W * 0.96, H * 0.55, Math.max(W, H) * 0.45, '232,140,62', 0.1 * st.nebula);
    g.save(); g.translate(W / 2, H * 1.06); g.scale(1.7, 1);
    radial(0, 0, H * (HERO ? 0.62 : 0.4), '255,190,110', 0.24 * st.warm);
    g.restore();
    g.globalCompositeOperation = 'lighter';
    if (st.rays > 0.002) {
      const L = Math.hypot(W, H) * 0.8;
      const gr = g.createRadialGradient(0, 0, 0, 0, 0, L);
      gr.addColorStop(0, 'rgba(255,230,180,1)'); gr.addColorStop(0.3, 'rgba(255,200,130,.45)'); gr.addColorStop(1, 'rgba(255,200,130,0)');
      g.save(); g.translate(st.rx, st.ry); g.rotate(t * 0.03);
      g.fillStyle = gr;
      for (let i = 0; i < 64; i++) {
        const a = (i / 64) * Math.PI * 2;
        g.globalAlpha = st.rays * (0.05 + 0.07 * (0.5 + 0.5 * Math.sin(i * 2.7 + t * 0.5)));
        g.beginPath(); g.moveTo(0, 0); g.arc(0, 0, L, a - rayW[i], a + rayW[i]); g.closePath(); g.fill();
      }
      g.restore();
      g.globalAlpha = 1;
    }
    for (const b of st.blooms) {
      const p = t - b.t0;
      if (p < 0 || p > 4.2) continue;
      const rad = Math.max(1, (HERO ? 1500 : 1800) * E.out(clamp(p / 2.6)) * b.k);
      const a = (p < 0.3 ? p / 0.3 : Math.max(0, 1 - (p - 0.3) / 3.6)) * (b.a ?? 1);
      const gr = g.createRadialGradient(b.x, b.y, 0, b.x, b.y, rad);
      gr.addColorStop(0, `rgba(255,246,222,${0.95 * a})`);
      gr.addColorStop(0.14, `rgba(255,214,150,${0.5 * a})`);
      gr.addColorStop(0.4, `rgba(240,150,70,${0.15 * a})`);
      gr.addColorStop(1, 'rgba(240,150,70,0)');
      g.fillStyle = gr;
      g.fillRect(0, 0, W, H);
    }
    for (const m of motes) {
      const span = H + 80;
      const y = ((m.y * span - m.v * t) % span + span) % span - 40;
      const x = m.x * W + Math.sin(t * 0.3 + m.ph) * m.sway;
      const tw = 0.5 + 0.5 * Math.sin(t * m.tw + m.ph);
      const a = (0.1 + tw * 0.34) * (0.5 + 0.5 * (y / H)) * st.motes * (1 + st.boost * 0.9);
      if (a < 0.01) continue;
      g.globalAlpha = Math.min(1, a * 0.22);
      g.fillStyle = 'rgb(255,214,150)';
      g.beginPath(); g.arc(x, y, m.r * 4.5, 0, 6.283); g.fill();
      g.globalAlpha = Math.min(1, a);
      g.fillStyle = 'rgb(255,244,222)';
      g.beginPath(); g.arc(x, y, m.r, 0, 6.283); g.fill();
    }
    g.globalAlpha = 1;
    g.globalCompositeOperation = 'source-over';
  }

  /* ───────── shared SVG / markup ───────── */
  const mandalaSVG = (cls) => {
    const pet = (i, a, d) => `<path d="${d}" transform="rotate(${i * 22.5 + a} 150 150)"/>`;
    const p1 = Array.from({ length: 16 }, (_, i) => pet(i, 0, 'M150 22C163 46 163 72 150 96C137 72 137 46 150 22Z')).join('');
    const p2 = Array.from({ length: 16 }, (_, i) => pet(i, 11.25, 'M150 40C158 56 158 72 150 88C142 72 142 56 150 40Z')).join('');
    return `<svg class="${cls}" viewBox="0 0 300 300">
      <g class="m-outer" fill="none" stroke="currentColor"><circle cx="150" cy="150" r="147" stroke-width=".9" stroke-dasharray="1 5" opacity=".55"/><circle cx="150" cy="150" r="139" stroke-width=".5" opacity=".3"/></g>
      <g class="m-petals" fill="none" stroke="currentColor" stroke-width=".7" opacity=".5">${p1}</g>
      <g class="m-petals2" fill="none" stroke="currentColor" stroke-width=".6" opacity=".35">${p2}</g>
    </svg>`;
  };
  const MIC = '<svg class="orb-icon mic" viewBox="0 0 24 24" width="34" height="34" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/></svg>';
  const STOP = '<svg class="orb-icon stop" viewBox="0 0 24 24" width="30" height="30"><rect x="6.5" y="6.5" width="11" height="11" rx="3" fill="currentColor"/></svg>';
  const GEAR = '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33 1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82 1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>';
  const TOPBAR = `<header class="topbar"><div class="brand"><img src="/public/icons/icon.svg" alt="" width="28" height="28"><span>Vichaar</span></div><div class="topbar-right"><span class="icon-btn">${GEAR}</span></div></header>`;
  const TABS = [
    ['Speak', '<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/>'],
    ['Journal', '<path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5z"/><path d="M4 20.5A2.5 2.5 0 0 0 6.5 23H20v-5M9 8h7M9 11.5h5"/>'],
    ['Search', '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>'],
    ['Book', '<path d="M12 6.5C10 4.8 7.3 4 3 4v14c4.3 0 7 .8 9 2.5 2-1.7 4.7-2.5 9-2.5V4c-4.3 0-7 .8-9 2.5z"/><path d="M12 6.5v14"/>'],
  ];
  const MINDS = '<span class="minds-stack"><i style="z-index:9">VF</i><i style="z-index:8">SV</i><i style="z-index:7">A</i><i class="you"></i></span>';
  const doneCard = (sutra, title, tags, meta, minds = MINDS) => `<article class="card"><div class="card-top"><span>${meta}</span><span class="spacer"></span>${minds}</div><p class="card-sutra">${sutra}</p><div class="card-title">${title}</div><div class="card-tags">${tags.map((x) => `<span class="tag">#${x}</span>`).join('')}</div></article>`;

  function constellationSVG(now) {
    const pts = [['Viktor Frankl', 1946], ['Swami Vivekananda', 1896], ['Aristotle', -340]].map(([n, y]) => ({ name: n.split(' ').pop(), y }));
    const L = 18, R = 300, AX = 104;
    const X = (yr) => L + (R - L) * (1 - Math.sqrt(Math.max(0, now - yr) / (now + 650)));
    pts.forEach((p) => { p.x = X(p.y); p.w = p.name.length * 7.2 + 4; });
    pts.sort((a, b) => a.x - b.x);
    const levels = [76, 52, 28], right = [-1e9, -1e9, -1e9];
    pts.forEach((p) => {
      p.anchor = p.x - p.w / 2 < 4 ? 'start' : p.x + p.w / 2 > R + 4 ? 'end' : 'middle';
      p.left = p.anchor === 'start' ? p.x : p.anchor === 'end' ? p.x - p.w : p.x - p.w / 2;
      let lv = levels.findIndex((_, i) => p.left > right[i] + 6);
      if (lv === -1) lv = 0;
      right[lv] = p.left + p.w; p.ly = levels[lv];
    });
    const fy = (y) => (y < 0 ? `${-y} BCE` : String(y));
    const ticks = [[-500, '500 BCE'], [1000, '1000'], [1600, '1600'], [1900, '1900']].map(([y, l]) => ({ x: X(y), l }));
    return `<div class="constellation"><svg viewBox="0 0 340 158">
      <defs><linearGradient id="threadGrad" x1="0" x2="1"><stop offset="0" stop-color="#f6d491" stop-opacity=".25"/><stop offset="1" stop-color="#f0883e" stop-opacity=".95"/></linearGradient>
      <radialGradient id="youGrad" cx=".38" cy=".34"><stop offset="0" stop-color="#fff3d1"/><stop offset=".55" stop-color="#eba653"/><stop offset="1" stop-color="#8a3b17"/></radialGradient></defs>
      <line class="axis" x1="${L - 8}" y1="${AX}" x2="${R}" y2="${AX}"/>
      ${pts.map((p) => `<path class="thread" d="M${p.x.toFixed(1)} ${AX} Q ${((p.x + R) / 2).toFixed(1)} ${(AX + 12 + (R - p.x) * 0.15).toFixed(1)} ${R} ${AX}"/>`).join('')}
      ${ticks.map((tk) => `<text class="tick" x="${tk.x.toFixed(1)}" y="152" text-anchor="middle">${tk.l}</text>`).join('')}<text class="tick" x="${R}" y="152" text-anchor="middle">NOW</text>
      ${pts.map((p) => `<g class="cst-star"><line x1="${p.x.toFixed(1)}" y1="${p.ly + 14}" x2="${p.x.toFixed(1)}" y2="${AX - 6}" stroke="rgba(246,212,145,.28)" stroke-dasharray="1 3"/><circle class="star-glow" cx="${p.x.toFixed(1)}" cy="${AX}" r="7"/><circle class="star" cx="${p.x.toFixed(1)}" cy="${AX}" r="3.2"/><text class="name" x="${p.x.toFixed(1)}" y="${p.ly}" text-anchor="${p.anchor}">${p.name}</text><text class="yr" x="${p.x.toFixed(1)}" y="${p.ly + 11}" text-anchor="${p.anchor}">${fy(p.y)}</text></g>`).join('')}
      <circle class="you-glow" cx="${R}" cy="${AX}" r="12"/><circle class="you-dot" cx="${R}" cy="${AX}" r="7"/>
      <text class="name" x="${R + 12}" y="${AX - 1}" style="fill:#f6d491">You</text><text class="yr" x="${R + 12}" y="${AX + 11}">${now}</text>
    </svg></div>`;
  }

  /* ───────── phone ───────── */
  const s = HERO ? 1.08 : 1.5;
  const phone = mk(`<div class="phone" style="--s:${s}">
    <div class="phone-screen">
      <div class="app-root" style="transform:scale(${s})">
        <div class="ph-bg"></div>
        <canvas class="ph-motes" id="phMotes" width="786" height="1704"></canvas>
        <div class="statusbar"><span>9:41</span><span class="icons">
          <svg width="18" height="12" viewBox="0 0 18 12" fill="#fff"><rect x="0" y="8" width="3" height="4" rx="1"/><rect x="5" y="5.5" width="3" height="6.5" rx="1"/><rect x="10" y="3" width="3" height="9" rx="1"/><rect x="15" y="0" width="3" height="12" rx="1"/></svg>
          <svg width="16" height="12" viewBox="0 0 16 12" fill="#fff"><path d="M8 2.5c2.3 0 4.4.9 6 2.4l1.1-1.2A10 10 0 0 0 8 1 10 10 0 0 0 .9 3.7L2 4.9a8.5 8.5 0 0 1 6-2.4zm0 3.3c1.4 0 2.7.5 3.7 1.4l1.1-1.2A7 7 0 0 0 8 4.3 7 7 0 0 0 3.2 6l1.1 1.2c1-.9 2.3-1.4 3.7-1.4zM8 9a2 2 0 0 0-1.4.6L8 11.2l1.4-1.6A2 2 0 0 0 8 9z"/></svg>
          <svg width="27" height="13" viewBox="0 0 27 13"><rect x=".5" y=".5" width="23" height="12" rx="3.5" fill="none" stroke="#fff" opacity=".5"/><rect x="2" y="2" width="18" height="9" rx="2" fill="#fff"/><rect x="24.5" y="4.5" width="1.5" height="4" rx=".7" fill="#fff" opacity=".5"/></svg>
        </span></div>

        <div class="scr" id="scrSpeak">${TOPBAR}
          <main class="ph-main"><section class="view-speak">
            <div class="speak-hero"><p class="greet">Good evening, Rishab</p><h1 class="prompt" id="phPrompt">What’s on your mind?</h1></div>
            <div class="orb-stage" id="phStage">
              <div class="halo"><div class="rays" id="phRays"></div>${mandalaSVG('mandala')}</div>
              <canvas class="wave" id="phWave" width="600" height="600"></canvas>
              <div class="orb-ring" id="phRing"></div>
              <div class="orb" id="phOrb"><span class="orb-body" id="phOrbBody"></span>${MIC}${STOP}</div>
            </div>
            <div class="rec-status"><span id="phLabel">Tap and speak — in any language</span><span class="rec-time" id="phTime">0:00</span></div>
            <div class="rec-actions stack" style="justify-items:center"><span class="ghost-btn" id="phWrite"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/></svg>Write instead</span><span class="ghost-btn" id="phDiscard">Discard</span></div>
            <div class="latest-wrap"><div class="section-label">Latest thought</div>
              <div class="stack">
                <div id="cardOld">${doneCard('Fear lives in the future; the present only has room for action.', 'Fear Lives Ahead', ['fear', 'action', 'presence'], 'Yesterday · 0:14', '<span class="minds-stack"><i style="z-index:9">S</i><i style="z-index:8">BG</i><i style="z-index:7">JK</i><i class="you"></i></span>')}</div>
                <div id="cardPending"><article class="card pending"><div class="card-top"><span>9:41 PM</span><span>· 0:08</span></div><p class="card-sutra">Voice note</p><div class="status-line"><span class="spinner" id="phSpin"></span><span class="shimmer" id="phStatus">Listening back…</span></div></article></div>
                <div id="cardNew">${doneCard('Purpose is not what you become, but whom you become it for.', 'Purpose Is a “For Whom”', ['purpose', 'service', 'identity'], '9:41 PM · 0:08')}</div>
              </div>
            </div>
          </section></main>
        </div>

        <div class="scr" id="scrSearch">${TOPBAR}
          <main class="ph-main">
            <div class="view-head"><h2>Ask your past self</h2></div>
            <div class="search-box"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg><span class="sb-input"><span id="sbText"></span><span class="caret" id="sbCaret"></span></span><span class="ask-btn" id="sbAsk">Ask</span></div>
            <div class="answer" id="sbAnswer"><div class="answer-label">${T.answerLabel}</div><p class="answer-text" id="sbAnswerText">${T.answer}</p></div>
            <div class="results-label" id="sbLabel">Where you said it</div>
            <div id="sbCard">${doneCard('Purpose is not what you become, but whom you become it for.', 'Purpose Is a “For Whom”', ['purpose', 'service', 'identity'], 'Today · 0:08')}</div>
          </main>
        </div>

        <div class="scr" id="scrBook">${TOPBAR}
          <main class="ph-main" id="bookScroll">
            <div class="view-head"><h2>Your book</h2><span class="view-sub">compiled today</span></div>
            <div class="cover" id="bookCover"><div class="cover-mark"></div><h2 class="cover-title">The Sutras of Rishab</h2><p class="cover-sub">Thoughts spoken aloud, kept for good</p><div class="cover-orn"></div><div class="cover-author">Rishab Choudhary</div><div class="cover-stats">48 verses · 9 chapters · 2026</div></div>
            <div class="book-actions"><span class="ghost-btn">Save as PDF</span><span class="ghost-btn">Download</span><span class="ghost-btn">Recompile</span></div>
            <div class="pages" style="margin-top:18px"><article class="page">
              <div class="page-kicker">Chapter III</div><h3>Of Purpose</h3><p class="ch-sub">What we are for, and for whom</p><div class="orn"></div>
              <p class="ch-intro">Before ambition, a question: who is it for?</p>
              <div class="verses">
                <div class="verse"><div class="verse-num">3.1</div><p class="verse-orig">मकसद ये नहीं कि तुम क्या बनते हो, मकसद ये है कि तुम किसके लिए बनते हो।</p><p class="verse-text">Purpose is not what you become, but whom you become it for.</p><div class="verse-meta">— Rishab Choudhary, 3 October 2026</div></div>
                <div class="verse"><div class="verse-num">3.2</div><p class="verse-orig">काम पूजा नहीं है, काम को दिया ध्यान पूजा है।</p><p class="verse-text">Work is not the worship; the attention you give it is.</p><div class="verse-meta">— Rishab Choudhary, 27 September 2026</div></div>
                <div class="verse"><div class="verse-num">3.3</div><p class="verse-orig">जो खुद को समझ गया, उसे दुनिया को समझाने की ज़रूरत नहीं।</p><p class="verse-text">Whoever understands himself stops needing to explain himself.</p><div class="verse-meta">— Rishab Choudhary, 23 August 2026</div></div>
              </div>
            </article></div>
          </main>
        </div>

        <nav class="tabbar" id="phTabs"><span class="tab-ind" id="phInd"></span>${TABS.map(([n, svg]) => `<span class="tab" data-tab="${n}"><svg viewBox="0 0 24 24" width="23" height="23" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${svg}</svg><span>${n}</span></span>`).join('')}</nav>

        <div class="rv" id="scrReveal"><canvas id="rvCanvas" width="786" height="1704"></canvas>
          <div class="reveal-inner">
            <div class="reveal-kicker" id="rvKicker">A thought, distilled</div>
            <p class="reveal-sutra" id="rvSutra">Purpose is not what you become, but whom you become it for.</p>
            <p class="reveal-orig" id="rvOrig">मकसद ये नहीं कि तुम क्या बनते हो, मकसद ये है कि तुम किसके लिए बनते हो।</p>
            <p class="reveal-sign" id="rvSign">— <b>Rishab Choudhary</b>, 3 October 2026</p>
            <div class="reveal-minds" id="rvMinds"><span class="mind-chip you"><i></i>You · 2026</span><span class="mind-vline"></span><div class="mind-row"><span class="mind-chip"><i>VF</i>Frankl <small>1946</small></span><span class="mind-chip"><i>SV</i>Vivekananda <small>1896</small></span><span class="mind-chip"><i>A</i>Aristotle <small>340 BCE</small></span></div></div>
            <p class="reveal-head" id="rvHead">You reached, on your own, the place Viktor Frankl reached in 1946.</p>
            <div class="reveal-actions" id="rvActions"><span class="primary-btn" id="rvMindsBtn">Meet your parallel minds</span><span class="ghost-btn">Keep it</span></div>
          </div>
        </div>

        <section class="sheet show" id="scrSheet"><div class="sheet-grab"></div><span class="icon-btn sheet-x"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg></span>
          <div class="sheet-body"><div id="shScroll">
            <section class="d-sec" style="margin-top:6px"><h4>Parallel minds</h4>
              <p class="pm-head">You reached, on your own, the place Viktor Frankl reached in 1946.</p>
              ${constellationSVG(2026)}
              <div class="pm-list">
                <div class="pm"><div class="pm-pair"><div class="pm-col you"><div class="pm-who">You · 2026</div><p>Purpose lies in whom you become it for.</p></div><div class="pm-seam"><span>≈</span></div><div class="pm-col them"><div class="pm-who">Viktor Frankl · 1946</div><p>Meaning is found by turning outward — toward a task to fulfil or a person to love — rather than by seeking happiness directly.</p></div></div><div class="pm-foot"><span class="kin close">Same summit</span><span>80 years apart</span><span>· Logotherapy</span></div><p class="pm-diff">Frankl speaks of meaning in suffering; you frame it as the direction of ordinary ambition.</p></div>
                <div class="pm"><div class="pm-pair"><div class="pm-col you"><div class="pm-who">You · 2026</div><p>Any goal is tested by who it serves.</p></div><div class="pm-seam"><span>∼</span></div><div class="pm-col them"><div class="pm-who">Swami Vivekananda · 1896</div><p>Service to others is itself the highest worship and the surest path to self-realisation.</p></div></div><div class="pm-foot"><span class="kin partial">Neighbouring path</span><span>130 years apart</span><span>· Vedanta</span></div></div>
                <div class="pm"><div class="pm-pair"><div class="pm-col you"><div class="pm-who">You · 2026</div><p>Your growth is for specific people, not for virtue in the abstract.</p></div><div class="pm-seam"><span>∼</span></div><div class="pm-col them"><div class="pm-who">Aristotle · 340 BCE</div><p>A flourishing life is lived among others; excellence of character only exists in a community.</p></div></div><div class="pm-foot"><span class="kin partial">Neighbouring path</span><span>2,366 years apart</span><span>· Greek philosophy</span></div></div>
              </div>
              <div class="yours"><div class="yours-label">✦ Yours alone</div><p>The question “for whom?” is yours — it turns purpose from a title into a relationship you can test any goal against.</p></div>
              <p class="pm-note">Reaching a truth on your own is a discovery — even if someone reached it before you. These are fellow travellers, not prior owners.</p>
            </section>
          </div></div>
        </section>

        <div class="tap" id="phTap"></div>
      </div>
    </div>
    <div class="island"></div>
  </div>`);
  const PW = 393 * s + 26 * s, PH = 852 * s + 26 * s;
  const phoneX = HERO ? 1386 - PW / 2 : 540 - PW / 2;
  const phoneY = HERO ? (H - PH) / 2 : 568;
  phone.style.left = `${phoneX}px`;
  phone.style.top = `${phoneY}px`;
  const appRoot = $('.app-root', phone);
  const rvSutraW = splitWords($('#rvSutra'));
  const answerW = splitWords($('#sbAnswerText'));
  const phMotes = $('#phMotes').getContext('2d');
  const rv = $('#rvCanvas').getContext('2d');
  const wave = $('#phWave').getContext('2d');
  const phRNG = mulberry32(21);
  const pMotes = Array.from({ length: 46 }, () => ({ x: phRNG(), y: phRNG(), r: 0.5 + phRNG() * 1.6, v: 6 + phRNG() * 14, sway: 6 + phRNG() * 20, ph: phRNG() * 6.283, tw: 0.5 + phRNG() * 1.5 }));
  const sparks = Array.from({ length: 34 }, () => ({ x: phRNG(), d: 5 + phRNG() * 8, o: phRNG() * 8, dx: (phRNG() - 0.5) * 80, r: 1 + phRNG() * 1.6 }));

  /* ───────── captions & big elements ───────── */
  const intro = HERO ? [T.intro1, T.intro2] : [T.r_intro1, T.r_intro2, T.r_intro3];
  const introEls = intro.map((txt) => {
    const n = mk(`<div class="abs t-intro center" style="width:${HERO ? 1300 : 900}px">${txt}</div>`);
    n.style.top = `${HERO ? 470 : 820}px`;
    return { n, w: splitWords(n) };
  });
  const bigWrap = mk('<div class="abs" style="left:0;top:0;width:0;height:0"></div>');
  const bigMandala = mk(mandalaSVG('bigmandala'), bigWrap);
  const bigOrb = mk('<div class="bigorb"><span class="orb-body" style="position:absolute;inset:0;border-radius:50%"></span></div>', bigWrap);
  const titleDeva = mk('<div class="abs title-deva center">विचार</div>');
  const titleMain = mk('<div class="abs title-main center">Vichaar</div>');
  const titleTag = mk(`<div class="abs title-tag center" style="width:${HERO ? 1200 : 900}px">${T.tag}</div>`);
  const credit = mk(`<div class="abs credit center">${T.credit}</div>`);
  const endTag = mk(`<div class="abs title-tag center" style="width:${HERO ? 1300 : 900}px">${T.endTag}</div>`);
  const tagW = splitWords(titleTag);
  const endW = splitWords(endTag);

  const capLeft = HERO ? 170 : 60;
  const capWidth = HERO ? 860 : 960;
  const mkCap = (k, h, sTxt) => {
    const box = mk(`<div class="abs" style="left:${capLeft}px;width:${capWidth}px;${HERO ? '' : 'text-align:center'}"></div>`);
    const kick = mk(`<div class="kicker">${k}</div>`, box);
    const head = mk(`<div class="head" style="margin-top:${HERO ? 26 : 22}px">${h}</div>`, box);
    const sub = sTxt ? mk(`<div class="sub" style="margin-top:22px;max-width:${HERO ? 760 : 960}px">${sTxt}</div>`, box) : null;
    return { box, kick, head, hw: splitWords(head), sub };
  };
  const caps = HERO
    ? [mkCap(T.k1, T.h1, T.s1), mkCap(T.k2, T.h2, T.s2), mkCap(T.k4, T.h4, T.s4), mkCap(T.k5, T.h5, T.s5)]
    : [mkCap(T.k1, T.rh1), mkCap(T.k2, T.rh2), mkCap(T.k3, T.rh3), mkCap(T.k4, T.rh4), mkCap(T.k5, T.rh5)];
  let capB = null;
  if (!HERO) {
    capB = mk(`<div class="abs head center" style="width:960px;color:var(--gold-2);font-style:italic">${T.rh3b}</div>`);
    capB.w = splitWords(capB);
  }
  const speech = mk(`<div class="abs" style="${HERO ? `left:${capLeft}px;width:${capWidth - 60}px` : 'left:70px;width:940px;padding:26px 30px;border-radius:26px;background:rgba(8,6,12,.78);border:1px solid rgba(246,212,145,.18);text-align:center'}">
      <div class="speech-label" style="${HERO ? '' : 'justify-content:center'}"><span class="live"></span>${T.speechLabel}</div>
      <div class="speech" style="margin-top:14px">“${SPEECH}”</div>
      ${T.speechTr ? `<div class="speech-tr" style="margin-top:12px">${T.speechTr}</div>` : ''}
    </div>`);
  const speechW = splitWords($('.speech', speech));
  const speechTr = $('.speech-tr', speech);

  /* Hero: full-stage constellation of parallel minds */
  let cst = null;
  if (HERO) {
    const now = 2026, L = 220, R = 1640, AX = 640;
    const X = (yr) => L + (R - L) * (1 - Math.sqrt(Math.max(0, now - yr) / (now + 650)));
    const people = [['Laozi', -500], ['Aristotle', -340], ['Seneca', 65], ['Kabir', 1450], ['Vivekananda', 1896], ['Frankl', 1946]]
      .map(([n, y]) => ({ n: T.names[n], y, x: X(y) }));
    const levels = [560, 470, 380];
    const right = [-1e9, -1e9, -1e9];
    people.forEach((p) => {
      const w = p.n.length * (LANG === 'hi' ? 20 : 18) + 20;
      p.left = p.x - w / 2;
      let lv = levels.findIndex((_, i) => p.left > right[i] + 30);
      if (lv === -1) lv = 0;
      right[lv] = p.left + w; p.ly = levels[lv];
    });
    const yr = (y) => (y < 0 ? T.bce(-y) : String(y));
    const ticks = [[-500, LANG === 'hi' ? '500 ई.पू.' : '500 BCE'], [1, LANG === 'hi' ? '1 ई.' : '1 CE'], [1000, '1000'], [1500, '1500'], [1800, '1800']];
    const svg = `<svg id="cst" class="abs" style="left:0;top:0" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
      <defs>
        <linearGradient id="cThread" x1="0" x2="1"><stop offset="0" stop-color="#f6d491" stop-opacity=".2"/><stop offset="1" stop-color="#f0883e" stop-opacity="1"/></linearGradient>
        <radialGradient id="cYou" cx=".38" cy=".34"><stop offset="0" stop-color="#fff3d1"/><stop offset=".55" stop-color="#eba653"/><stop offset="1" stop-color="#8a3b17"/></radialGradient>
        <filter id="glow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="4" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
      </defs>
      <line id="cAxis" x1="${L - 40}" y1="${AX}" x2="${R}" y2="${AX}" stroke="rgba(255,255,255,.16)" stroke-width="1.2"/>
      ${ticks.map(([y, l]) => `<text class="cst-tick ctick" x="${X(y).toFixed(1)}" y="${AX + 40}" text-anchor="middle">${l}</text>`).join('')}
      <text class="cst-tick ctick" x="${R}" y="${AX + 40}" text-anchor="middle">${LANG === 'hi' ? 'आज' : 'NOW'}</text>
      ${people.map((p, i) => `<path class="cthread" data-i="${i}" filter="url(#glow)" d="M${p.x.toFixed(1)} ${AX} Q ${((p.x + R) / 2).toFixed(1)} ${(AX + 40 + (R - p.x) * 0.16).toFixed(1)} ${R} ${AX}" fill="none" stroke="url(#cThread)" stroke-width="2.2"/>`).join('')}
      ${people.map((p, i) => `<g class="cstar" data-i="${i}">
        <line x1="${p.x.toFixed(1)}" y1="${p.ly + 30}" x2="${p.x.toFixed(1)}" y2="${AX - 14}" stroke="rgba(246,212,145,.35)" stroke-dasharray="2 6" stroke-width="1.4"/>
        <circle cx="${p.x.toFixed(1)}" cy="${AX}" r="18" fill="rgba(246,212,145,.18)"/><circle cx="${p.x.toFixed(1)}" cy="${AX}" r="7" fill="#f6d491" filter="url(#glow)"/>
        <text class="cst-name" x="${p.x.toFixed(1)}" y="${p.ly}" text-anchor="middle">${p.n}</text>
        <text class="cst-year" x="${p.x.toFixed(1)}" y="${p.ly + 24}" text-anchor="middle">${yr(p.y)}</text></g>`).join('')}
      <g id="cYouG"><circle cx="${R}" cy="${AX}" r="44" fill="rgba(240,150,70,.25)"/><circle cx="${R}" cy="${AX}" r="22" fill="url(#cYou)" filter="url(#glow)"/>
        <text class="cst-you" x="${R + 40}" y="${AX - 6}">${T.you}</text><text class="cst-year" x="${R + 40}" y="${AX + 22}" style="fill:#f6d491">2026</text></g>
    </svg>`;
    cst = mk(svg);
    cst.people = people;
    cst.threads = $$('.cthread', cst);
    cst.threads.forEach((p) => { p.len = p.getTotalLength(); p.style.strokeDasharray = `${p.len}`; });
    cst.stars = $$('.cstar', cst);
    cst.youG = $('#cYouG', cst);
    cst.axis = $('#cAxis', cst);
    cst.ticks = $$('.ctick', cst);
    cst.head = mk(`<div class="abs head center" style="top:150px;width:1500px">${T.h3}</div>`);
    cst.headW = splitWords(cst.head);
    cst.kick = mk(`<div class="abs kicker center" style="top:100px;width:1200px">${T.k3}</div>`);
    cst.sub = mk(`<div class="abs sub center" style="top:${LANG === 'hi' ? 820 : 830}px;width:1180px">${T.s3}</div>`);
  }

  /* ───────── timelines ───────── */
  const TL = HERO ? {
    intro: [[0.8, 7.6, 1.2], [7.8, 12.6, 8.1, 11.5]],
    orbAppear: 0.3, orbGrow: [12.3, 15.0], titleBloom: 13.0,
    title: [14.0, 21.0], phoneIn: [20.4, 22.4],
    caps: [[22.0, 35.6], [35.9, 47.4], [60.8, 69.6], [69.8, 77.6]],
    speech: [24.9, 33.6],
    phoneOut: [47.0, 48.2], phoneBack: [60.0, 61.4], phoneEnd: [77.2, 78.4],
    parallel: [47.8, 60.6],
    end: [77.8, 86.0],
  } : {
    intro: [[0.6, 7.4, 1.0], [7.6, 12.6, 7.9, 11.6], [12.8, 18.0, 13.1, 17.0]],
    orbAppear: 0.3, orbGrow: [16.4, 19.0], titleBloom: 16.8,
    title: [17.6, 23.2], phoneIn: [22.6, 24.6],
    caps: [[24.2, 39.4], [39.6, 53.8], [53.8, 63.4], [72.6, 86.4], [86.6, 100.4]],
    capB: [63.4, 72.4],
    speech: [25.9, 34.6],
    phoneEnd: [100.2, 101.4],
    end: [100.6, 112.0],
  };
  const PHT = HERO ? {
    screens: { speak: [-1, 61.0], search: [60.8, 69.9], book: [69.6, 999] },
    taps: [24.6, 32.4], rec: [24.8, 32.4], pending: 32.6, status2: 34.3, done: 47.4,
    reveal: [35.8, 47.4], revealTap: null, sheet: null,
    typing: [61.8, 64.6], answer: 65.2, result: 67.6,
    bookIn: 69.8, bookScroll: [73.4, 75.6, 520],
    tabs: [[0, 0], [60.9, 2], [69.7, 3]],
  } : {
    screens: { speak: [-1, 73.0], search: [72.8, 86.6], book: [86.4, 999] },
    taps: [25.6, 33.6, 52.4], rec: [25.8, 33.6], pending: 33.8, status2: 36.6, done: 54.0,
    reveal: [39.6, 54.0], revealTap: 52.4, sheet: [53.6, 72.4], sheetScroll: [[59.0, 62.6, 330], [65.6, 69.6, 690]],
    typing: [74.0, 77.4], answer: 78.2, result: 81.4,
    bookIn: 86.8, bookScroll: [91.4, 93.8, 520],
    tabs: [[0, 0], [72.9, 2], [86.5, 3]],
  };
  /* layout of title/orb */
  const ORB = HERO ? { x: 960, y: 290, size: 200 } : { x: 540, y: 560, size: 260 };
  const BLOOMS = HERO
    ? [{ t0: 13.0, x: ORB.x, y: ORB.y, k: 1 }, { t0: 35.9, x: phoneX + PW / 2, y: phoneY + PH * 0.38, k: 0.7, a: 0.8 }, { t0: 48.6, x: 1640, y: 640, k: 0.8, a: 0.7 }, { t0: 78.2, x: ORB.x, y: ORB.y, k: 1 }]
    : [{ t0: 16.8, x: ORB.x, y: ORB.y, k: 1 }, { t0: 39.7, x: 540, y: phoneY + PH * 0.36, k: 0.75, a: 0.85 }, { t0: 101.0, x: ORB.x, y: ORB.y, k: 1 }];
  titleDeva.style.top = `${HERO ? 500 : 850}px`;
  titleMain.style.top = `${HERO ? 548 : 905}px`;
  titleTag.style.top = `${HERO ? 784 : 1110}px`;
  endTag.style.top = `${HERO ? 784 : 1110}px`;
  credit.style.top = `${HERO ? 905 : 1265}px`;

  /* caption placement */
  caps.forEach((c) => { c.box.style.top = `${HERO ? 300 : 140}px`; });
  speech.style.top = `${HERO ? 700 : 1500}px`;

  let tapPt = null;
  function measure() {
    const keep = phone.style.transform;
    phone.style.transform = 'none';
    $('#phOrb').style.transform = 'none';
    const r = $('#phOrb').getBoundingClientRect();
    const a = appRoot.getBoundingClientRect();
    const k = a.width / 393;
    tapPt = { x: (r.left + r.width / 2 - a.left) / k, y: (r.top + r.height / 2 - a.top) / k };
    const b = $('#rvMindsBtn').getBoundingClientRect();
    tapPt.btn = { x: (b.left + b.width / 2 - a.left) / k, y: (b.top + b.height / 2 - a.top) / k };
    phone.style.transform = keep;
  }

  /* ───────── phone renderer ───────── */
  const recLevel = (t) => {
    const syll = Math.abs(Math.sin(t * 7.3) * Math.sin(t * 2.3 + 1.1));
    const phrase = 0.55 + 0.45 * Math.sin(t * 0.9 + 0.4);
    const pause = (Math.sin(t * 1.7) > 0.82) ? 0.25 : 1;
    return clamp((0.18 + 0.7 * syll * phrase) * pause, 0, 1);
  };

  function renderPhone(t) {
    const pt = PHT;
    // screens
    const sv = (k) => win(t, pt.screens[k][0], pt.screens[k][1], 0.5, 0.5);
    show($('#scrSpeak'), sv('speak'));
    show($('#scrSearch'), sv('search'), { y: (1 - E.out(P(t, pt.screens.search[0], pt.screens.search[0] + 0.6))) * 14 });
    show($('#scrBook'), sv('book'), { y: (1 - E.out(P(t, pt.screens.book[0], pt.screens.book[0] + 0.6))) * 14 });

    // tabs
    let tabIdx = 0, prevIdx = 0, tStart = 0;
    pt.tabs.forEach(([t0, i], k) => { if (t >= t0) { prevIdx = k ? pt.tabs[k - 1][1] : i; tabIdx = i; tStart = t0; } });
    const tabW = (393 - 24 - 12) / 4;
    const mv = E.back(P(t, tStart, tStart + 0.5));
    $('#phInd').style.width = `${tabW}px`;
    $('#phInd').style.transform = `translateX(${((prevIdx + (tabIdx - prevIdx) * mv) * tabW).toFixed(1)}px)`;
    $$('.tab', appRoot).forEach((el, i) => el.classList.toggle('active', i === tabIdx));

    // motes inside phone
    phMotes.clearRect(0, 0, 786, 1704);
    phMotes.globalCompositeOperation = 'lighter';
    const recOn = t >= pt.rec[0] && t <= pt.rec[1];
    for (const m of pMotes) {
      const span = 852 + 40;
      const y = (((m.y * span - m.v * t) % span) + span) % span - 20;
      const x = m.x * 393 + Math.sin(t * 0.35 + m.ph) * m.sway;
      const tw = 0.5 + 0.5 * Math.sin(t * m.tw + m.ph);
      const a = (0.1 + tw * 0.32) * (0.55 + 0.45 * (y / 852)) * (recOn ? 1.6 : 1);
      phMotes.globalAlpha = Math.min(1, a * 0.22); phMotes.fillStyle = 'rgb(255,214,150)';
      phMotes.beginPath(); phMotes.arc(x * 2, y * 2, m.r * 9, 0, 6.283); phMotes.fill();
      phMotes.globalAlpha = Math.min(1, a); phMotes.fillStyle = 'rgb(255,244,220)';
      phMotes.beginPath(); phMotes.arc(x * 2, y * 2, m.r * 2, 0, 6.283); phMotes.fill();
    }
    phMotes.globalAlpha = 1;

    // speak screen
    const lvl = recOn ? recLevel(t) : 0;
    const stg = $('#phStage');
    stg.style.setProperty('--level', f3(lvl));
    $('.m-outer', stg).style.transform = `rotate(${(t * 3).toFixed(2)}deg)`;
    $('.m-petals', stg).style.transform = `rotate(${(-t * 2).toFixed(2)}deg)`;
    $('.m-petals2', stg).style.transform = `rotate(${(t * 1.5).toFixed(2)}deg)`;
    const recBlend = Math.min(E.out(P(t, pt.rec[0], pt.rec[0] + 0.4)), 1 - E.out(P(t, pt.rec[1], pt.rec[1] + 0.4)));
    $('.mandala', stg).style.opacity = f3(1 - 0.55 * recBlend);
    $('.mandala', stg).style.transform = `scale(${(1 + lvl * 0.08).toFixed(3)})`;
    $('#phRays').style.transform = `rotate(${(t * (2.6 + recBlend * 6)).toFixed(2)}deg)`;
    $('#phRays').style.opacity = f3(0.45 + 0.55 * lvl);
    $('#phRing').style.transform = `rotate(${(t * (25 + recBlend * 95)).toFixed(1)}deg)`;
    const breathe = 1 + 0.035 * (0.5 - 0.5 * Math.cos((t * 2 * Math.PI) / 5.5)) * (1 - recBlend);
    const absorbP = P(t, pt.rec[1], pt.rec[1] + 0.7);
    const absorb = absorbP > 0 && absorbP < 1 ? 1 - 0.18 * Math.sin(absorbP * Math.PI) : 1;
    $('#phOrb').style.transform = `scale(${((breathe + lvl * 0.22) * absorb).toFixed(4)})`;
    $('#phOrbBody').style.background = recBlend > 0.5 ? 'radial-gradient(circle at 36% 30%, #fff1d6 0%, #f9c87f 18%, #f08a3e 48%, #d4512f 76%, #6a1f12 100%)' : '';
    $('.orb-icon.mic', stg).style.opacity = f3(1 - recBlend);
    $('.orb-icon.stop', stg).style.opacity = f3(recBlend);
    $('.orb-icon.stop', stg).style.transform = `scale(${(0.5 + 0.5 * recBlend).toFixed(3)})`;
    $('#phPrompt').textContent = recBlend > 0.5 ? 'Listening…' : 'What’s on your mind?';
    $('#phLabel').textContent = recBlend > 0.5 ? 'Tap the orb when you’re done' : 'Tap and speak — in any language';
    $('#phTime').style.display = recBlend > 0.5 ? '' : 'none';
    $('#phTime').textContent = `0:${String(Math.floor(clamp(t - pt.rec[0], 0, 59))).padStart(2, '0')}`;
    show($('#phDiscard'), recBlend);
    show($('#phWrite'), 1 - recBlend);
    // waveform ring
    wave.clearRect(0, 0, 600, 600);
    if (recBlend > 0.01) {
      wave.save(); wave.scale(2, 2); wave.lineCap = 'round';
      const N = 84, cx = 150, cy = 150, base = 112.5;
      for (let i = 0; i < N; i++) {
        const a = (i / N) * Math.PI * 2 - Math.PI / 2;
        const half = i <= N / 2 ? i : N - i;
        const fq = half / (N / 2);
        const v = clamp(lvl * (0.35 + 0.65 * (0.5 + 0.5 * Math.sin(fq * 9 + t * 11 + Math.sin(t * 3) * 2))) * (1.1 - fq * 0.7) + 0.06);
        const len = 3 + v * v * 64;
        wave.strokeStyle = `rgba(246,${Math.round(214 - v * 90)},${Math.round(150 - v * 100)},${(0.25 + v * 0.75) * recBlend})`;
        wave.lineWidth = 2.6;
        wave.beginPath(); wave.moveTo(cx + Math.cos(a) * base, cy + Math.sin(a) * base); wave.lineTo(cx + Math.cos(a) * (base + len), cy + Math.sin(a) * (base + len)); wave.stroke();
      }
      wave.restore();
    }
    // latest card states
    const pIn = E.out(P(t, pt.pending, pt.pending + 0.6));
    const dIn = E.out(P(t, pt.done, pt.done + 0.8));
    show($('#cardOld'), 1 - pIn);
    show($('#cardPending'), pIn * (1 - dIn), { y: (1 - pIn) * 10 });
    show($('#cardNew'), dIn, { y: (1 - dIn) * 10 });
    const glowP = P(t, pt.done, pt.done + 1.6);
    $('#cardNew .card').style.boxShadow = glowP > 0 && glowP < 1 ? `0 0 ${(46 * Math.sin(glowP * Math.PI)).toFixed(1)}px rgba(232,180,90,${(0.3 * Math.sin(glowP * Math.PI)).toFixed(2)})` : 'none';
    $('#cardNew .card').style.borderColor = glowP > 0 && glowP < 1 ? `rgba(232,180,90,${(0.7 * (1 - glowP)).toFixed(2)})` : '';
    $('#phSpin').style.transform = `rotate(${(t * 400) % 360}deg)`;
    $('#phStatus').textContent = t < pt.status2 ? 'Listening back…' : 'Finding echoes across time…';
    $('#phStatus').style.backgroundPosition = `${(120 - ((t * 0.55) % 1) * 240).toFixed(1)}% 0`;

    // tap ripples
    const tap = $('#phTap');
    let tapO = 0;
    pt.taps.forEach((tt, i) => {
      const p = P(t, tt - 0.15, tt + 0.55);
      if (p > 0 && p < 1) {
        const pos = pt.revealTap && Math.abs(tt - pt.revealTap) < 0.01 ? tapPt.btn : tapPt;
        tap.style.left = `${pos.x}px`; tap.style.top = `${pos.y}px`;
        tapO = Math.sin(p * Math.PI);
        tap.style.transform = `scale(${(0.6 + p * 0.9).toFixed(3)})`;
      }
    });
    tap.style.opacity = f3(tapO * 0.9);

    // revelation overlay
    const [r0, r1] = pt.reveal;
    const rvO = win(t, r0, r1, 0.7, 0.55);
    const rvEl = $('#scrReveal');
    rvEl.style.opacity = f3(rvO);
    rvEl.style.visibility = rvO > 0.001 ? 'visible' : 'hidden';
    if (rvO > 0.001) {
      const lt = t - r0;
      rv.clearRect(0, 0, 786, 1704);
      rv.globalCompositeOperation = 'lighter';
      // rays
      const raysA = E.out(P(lt, 0.5, 2.9));
      const cx = 393, cy = 1704 * 0.4, L = 1900;
      const grd = rv.createRadialGradient(0, 0, 0, 0, 0, L);
      grd.addColorStop(0, 'rgba(255,230,180,1)'); grd.addColorStop(0.25, 'rgba(255,214,150,.5)'); grd.addColorStop(0.55, 'rgba(255,214,150,0)');
      rv.save(); rv.translate(cx, cy); rv.rotate(lt * 0.07); rv.fillStyle = grd;
      for (let i = 0; i < 48; i++) {
        const a = (i / 48) * Math.PI * 2;
        rv.globalAlpha = raysA * (0.12 + 0.1 * Math.sin(i * 2.3));
        rv.beginPath(); rv.moveTo(0, 0); rv.arc(0, 0, L, a - 0.018, a + 0.018); rv.closePath(); rv.fill();
      }
      rv.restore();
      // bloom
      const bp = lt - 0.15;
      if (bp > 0) {
        const rad = Math.max(1, 1500 * E.out(clamp(bp / 2.6)));
        const a = bp < 0.3 ? bp / 0.3 : Math.max(0.22, 1 - (bp - 0.3) / 2.4);
        const gb = rv.createRadialGradient(cx, cy, 0, cx, cy, rad);
        gb.addColorStop(0, `rgba(255,246,222,${0.95 * a})`); gb.addColorStop(0.12, `rgba(255,214,150,${0.55 * a})`); gb.addColorStop(0.32, `rgba(240,150,70,${0.18 * a})`); gb.addColorStop(0.6, 'rgba(240,150,70,0)');
        rv.globalAlpha = 1; rv.fillStyle = gb; rv.fillRect(0, 0, 786, 1704);
      }
      // sparks
      for (const sp of sparks) {
        const p = ((lt - sp.o) / sp.d);
        if (p < 0) continue;
        const pp = p % 1;
        const y = 1704 + 20 - pp * 1800;
        const x = sp.x * 786 + sp.dx * pp * 2;
        const o = pp < 0.12 ? pp / 0.12 : 1 - (pp - 0.12) / 0.88;
        rv.globalAlpha = o * 0.9;
        rv.fillStyle = 'rgba(255,200,120,.35)'; rv.beginPath(); rv.arc(x, y, sp.r * 8, 0, 6.283); rv.fill();
        rv.fillStyle = '#fff1cf'; rv.beginPath(); rv.arc(x, y, sp.r * 2.4, 0, 6.283); rv.fill();
      }
      rv.globalAlpha = 1;
      rv.globalCompositeOperation = 'source-over';
      // text sequence (mirrors the app's timing)
      const n = rvSutraW.length;
      const d2 = 1.3 + n * 0.13 + 0.5, d3 = d2 + 0.8, d4 = d3 + 0.9, d5 = d4 + 0.5 + 3 * 0.22, d6 = d5 + 0.8;
      const fade = (node, at, dur = 1.1) => { const p = E.out(P(lt, at, at + dur)); show(node, p, { y: (1 - p) * 12, blur: (1 - p) * 4 }); };
      fade($('#rvKicker'), 0.9, 0.9);
      illuminate(rvSutraW, lt, 1.3, 0.13, 1.3);
      fade($('#rvOrig'), d2, 1.2);
      fade($('#rvSign'), d3, 1.2);
      fade($('#rvMinds'), d4, 1.0);
      fade($('#rvHead'), d5, 1.2);
      fade($('#rvActions'), d6, 1.0);
      if (pt.revealTap) {
        const bp2 = P(t, pt.revealTap - 0.1, pt.revealTap + 0.3);
        $('#rvMindsBtn').style.transform = `scale(${(1 - 0.04 * Math.sin(bp2 * Math.PI)).toFixed(3)})`;
      }
    }

    // detail sheet with Parallel minds
    const sh = $('#scrSheet');
    if (pt.sheet) {
      const [s0, s1] = pt.sheet;
      const open = E.out(P(t, s0, s0 + 0.8)) * (1 - E.inOut(P(t, s1 - 0.7, s1)));
      sh.style.transform = `translate(-50%, ${((1 - open) * 830).toFixed(1)}px)`;
      sh.style.visibility = open > 0.001 ? 'visible' : 'hidden';
      let scroll = 0;
      (pt.sheetScroll || []).forEach(([a, b, to], i, arr) => { const from = i ? arr[i - 1][2] : 0; const p = E.inOut(P(t, a, b)); if (t >= a) scroll = from + (to - from) * p; });
      $('#shScroll').style.transform = `translateY(${(-scroll).toFixed(1)}px)`;
      $$('.constellation .thread', sh).forEach((th, i) => { th.style.strokeDashoffset = (420 * (1 - E.out(P(t, s0 + 1.0 + i * 0.35, s0 + 2.6 + i * 0.35)))).toFixed(1); });
      $$('.constellation .cst-star', sh).forEach((st2, i) => { st2.style.opacity = f3(E.out(P(t, s0 + 0.9 + i * 0.3, s0 + 1.5 + i * 0.3))); });
      $$('.pm', sh).forEach((pm, i) => { const p = E.out(P(t, s0 + 1.4 + i * 0.25, s0 + 2.4 + i * 0.25)); show(pm, p, { y: (1 - p) * 16 }); });
    } else {
      sh.style.visibility = 'hidden';
    }
    $('#scrSheet').style.zIndex = 150;
    // scrim under sheet: dim speak screen
    if (pt.sheet) {
      const open = E.out(P(t, pt.sheet[0], pt.sheet[0] + 0.8)) * (1 - E.inOut(P(t, pt.sheet[1] - 0.7, pt.sheet[1])));
      $('#scrSpeak').style.filter = open > 0.01 ? `brightness(${(1 - 0.5 * open).toFixed(3)}) blur(${(open * 2).toFixed(2)}px)` : 'none';
    }

    // search
    const [ty0, ty1] = pt.typing;
    const q = T.query;
    const chars = [...q];
    const nChars = Math.round(chars.length * P(t, ty0, ty1));
    $('#sbText').textContent = chars.slice(0, nChars).join('');
    $('#sbText').parentElement.classList.toggle('short', $('#sbText').offsetWidth < $('#sbText').parentElement.clientWidth - 6);
    $('#sbCaret').style.opacity = t < pt.answer - 0.4 && Math.floor(t * 2.2) % 2 === 0 ? '1' : t >= ty0 && t <= ty1 ? '1' : '0';
    const askP = P(t, pt.answer - 0.5, pt.answer - 0.2);
    $('#sbAsk').style.transform = `scale(${(1 - 0.06 * Math.sin(askP * Math.PI)).toFixed(3)})`;
    const aIn = E.out(P(t, pt.answer, pt.answer + 0.8));
    show($('#sbAnswer'), aIn, { y: (1 - aIn) * 18 });
    illuminate(answerW, t, pt.answer + 0.3, LANG === 'hi' ? 0.05 : 0.055, 0.9, 0.5);
    const rIn = E.out(P(t, pt.result, pt.result + 0.8));
    show($('#sbLabel'), rIn);
    show($('#sbCard'), rIn, { y: (1 - rIn) * 18 });

    // book
    const bIn = E.out(P(t, pt.bookIn, pt.bookIn + 1.4));
    $('#bookCover').style.transform = `perspective(900px) rotateY(${(-20 * (1 - bIn)).toFixed(2)}deg) translateY(${((1 - bIn) * 12).toFixed(1)}px)`;
    $('#bookCover').style.opacity = f3(bIn);
    const [b0, b1, bd] = pt.bookScroll;
    $('#bookScroll').style.transform = `translateY(${(-bd * E.inOut(P(t, b0, b1))).toFixed(1)}px)`;
  }

  /* ───────── master render ───────── */
  function render(t) {
    const tl = TL;
    const endIn = E.out(P(t, tl.end[0], tl.end[0] + 1.6));
    const fadeAll = 1 - E.inOut(P(t, DURATION - 1.4, DURATION));

    // background state
    const raysA = Math.max(win(t, tl.orbGrow[0], tl.title[1], 1.5, 1.2), HERO ? win(t, tl.parallel[0], tl.parallel[1], 1.2, 1.2) * 0.8 : 0, win(t, tl.end[0], DURATION, 1.6, 1.4));
    const rxy = HERO && t > tl.parallel[0] - 1 && t < tl.parallel[1] + 1 ? { rx: 1640, ry: 640 } : { rx: ORB.x, ry: ORB.y };
    drawBg(t, { nebula: 0.6 + 0.4 * E.out(P(t, 0, 6)), warm: 0.4 + 0.6 * E.out(P(t, 12, 18)), rays: raysA * fadeAll, ...rxy, blooms: BLOOMS, motes: E.out(P(t, 0.2, 3)) * fadeAll, boost: 0 });

    // intro lines
    introEls.forEach((it, i) => {
      const [a, b, w0, d0] = tl.intro[i];
      const o = win(t, a, b, 0.3, 0.6);
      it.n.style.opacity = f3(o);
      it.n.style.visibility = o > 0.001 ? 'visible' : 'hidden';
      illuminate(it.w, t, w0, i === 0 ? 0.11 : 0.15, 1.2);
      if (d0) dissolve(it.w, t, d0, 0.06, 1.1);
    });

    // big orb: bindu → orb (intro) and again for the end card
    const growP = E.inOut(P(t, tl.orbGrow[0], tl.orbGrow[1]));
    const introVis = win(t, tl.orbAppear, tl.title[1], 1.2, 0.9);
    const endVis = endIn * fadeAll;
    const orbVis = Math.max(introVis, endVis);
    const baseSize = t > tl.end[0] - 0.5 ? ORB.size * (0.6 + 0.4 * E.out(P(t, tl.end[0], tl.end[0] + 2))) : 14 + (ORB.size - 14) * growP;
    const breathe = 1 + 0.03 * Math.sin((t * 2 * Math.PI) / 5.5);
    const orbY = t > tl.end[0] - 0.5 ? ORB.y : (HERO ? ORB.y - 30 * (1 - growP) : ORB.y - 30 * (1 - growP));
    const sz = baseSize * breathe;
    bigOrb.style.width = bigOrb.style.height = `${sz.toFixed(2)}px`;
    bigOrb.style.left = `${(ORB.x - sz / 2).toFixed(2)}px`;
    bigOrb.style.top = `${(orbY - sz / 2).toFixed(2)}px`;
    bigOrb.style.opacity = f3(orbVis);
    const glowK = 0.5 + 0.5 * growP;
    bigOrb.firstElementChild.style.boxShadow = `0 0 ${(40 + 120 * glowK).toFixed(0)}px ${(6 + 30 * glowK).toFixed(0)}px rgba(240,150,70,${(0.35 + 0.25 * glowK).toFixed(2)}), inset -12px -18px 40px rgba(90,30,10,.55), inset 10px 12px 30px rgba(255,245,220,.35)`;
    const mSize = sz * 1.9;
    bigMandala.style.width = bigMandala.style.height = `${mSize.toFixed(1)}px`;
    bigMandala.style.left = `${(ORB.x - mSize / 2).toFixed(1)}px`;
    bigMandala.style.top = `${(orbY - mSize / 2).toFixed(1)}px`;
    const mDraw = t > tl.end[0] - 0.5 ? E.out(P(t, tl.end[0] + 0.3, tl.end[0] + 2.6)) : E.out(P(t, tl.orbGrow[0] + 0.8, tl.orbGrow[1] + 1.6));
    bigMandala.style.opacity = f3(orbVis * mDraw);
    $('.m-outer', bigMandala).style.transform = `rotate(${(t * 3).toFixed(2)}deg)`;
    $('.m-petals', bigMandala).style.transform = `rotate(${(-t * 2).toFixed(2)}deg)`;
    $('.m-petals2', bigMandala).style.transform = `rotate(${(t * 1.5).toFixed(2)}deg)`;
    $$('path', bigMandala).forEach((p) => { p.style.strokeDasharray = '180'; p.style.strokeDashoffset = (180 * (1 - mDraw)).toFixed(1); });

    // title
    const [ta, tb] = tl.title;
    const endPhase = t > tl.end[0] - 0.5;
    const tOut = endPhase ? 0 : E.inOut(P(t, tb - 0.9, tb));
    const tDeva = E.out(P(t, ta + 0.2, ta + 1.4));
    const tMain = E.out(P(t, ta + 0.5, ta + 2.0));
    if (endPhase) {
      const eD = E.out(P(t, tl.end[0] + 0.6, tl.end[0] + 1.8));
      const eM = E.out(P(t, tl.end[0] + 0.9, tl.end[0] + 2.4));
      show(titleDeva, eD * fadeAll, { y: (1 - eD) * 10 });
      show(titleMain, eM * fadeAll, { y: (1 - eM) * 24, s: 0.94 + 0.06 * eM, blur: (1 - eM) * 14 });
    } else {
      show(titleDeva, tDeva * (1 - tOut), { y: (1 - tDeva) * 10 - tOut * 30, blur: tOut * 8 });
      show(titleMain, tMain * (1 - tOut), { y: (1 - tMain) * 24 - tOut * 30, s: 0.94 + 0.06 * tMain, blur: (1 - tMain) * 14 + tOut * 8 });
    }
    titleMain.style.textShadow = `0 0 ${(60 * (1 - Math.abs(tMain - 0.5) * 2) + 18).toFixed(0)}px rgba(255,214,140,.35)`;
    const tagVis = win(t, ta + 2.2, tb, 0.5, 0.9);
    titleTag.style.opacity = f3(tagVis);
    titleTag.style.visibility = tagVis > 0.001 ? 'visible' : 'hidden';
    illuminate(tagW, t, ta + 2.3, 0.1, 1.1, 0.8);

    // end card
    const eTag = win(t, tl.end[0] + 2.2, DURATION, 0.5, 1.4);
    endTag.style.opacity = f3(eTag);
    endTag.style.visibility = eTag > 0.001 ? 'visible' : 'hidden';
    illuminate(endW, t, tl.end[0] + 2.3, 0.12, 1.2, 0.8);
    show(credit, E.out(P(t, tl.end[0] + 4.2, tl.end[0] + 5.6)) * fadeAll);

    // phone
    let phO = E.out(P(t, tl.phoneIn[0], tl.phoneIn[1]));
    let phY = (1 - phO) * 160;
    let phX = 0;
    if (HERO) {
      const out = E.inOut(P(t, tl.phoneOut[0], tl.phoneOut[1]));
      const back = E.out(P(t, tl.phoneBack[0], tl.phoneBack[1]));
      const away = out * (1 - back);
      phO *= 1 - away;
      phX += away * 140;
    }
    const pe = E.inOut(P(t, tl.phoneEnd[0], tl.phoneEnd[1]));
    phO *= 1 - pe;
    phY += pe * 60;
    const floatY = Math.sin(t * 0.55) * 6;
    phone.style.opacity = f3(phO);
    phone.style.visibility = phO > 0.001 ? 'visible' : 'hidden';
    phone.style.transform = `translate(${phX.toFixed(1)}px, ${(phY + floatY).toFixed(1)}px)${HERO ? ` perspective(2400px) rotateY(${(-7 + 4 * Math.sin(t * 0.2)).toFixed(2)}deg) rotateX(${(2 + Math.sin(t * 0.27)).toFixed(2)}deg)` : ''}`;
    if (phO > 0.001) renderPhone(t);

    // captions
    caps.forEach((c, i) => {
      const [a, b] = tl.caps[i];
      const o = win(t, a, b, 0.6, 0.7);
      c.box.style.opacity = f3(o);
      c.box.style.visibility = o > 0.001 ? 'visible' : 'hidden';
      const k = E.out(P(t, a, a + 0.8));
      show(c.kick, k, { y: (1 - k) * 10 });
      illuminate(c.hw, t, a + 0.3, 0.09, 1.0, 0.7);
      if (c.sub) { const sp = E.out(P(t, a + 1.6, a + 2.6)); show(c.sub, sp, { y: (1 - sp) * 12, blur: (1 - sp) * 5 }); }
    });
    if (capB) {
      const o = win(t, tl.capB[0], tl.capB[1], 0.5, 0.7);
      capB.style.opacity = f3(o); capB.style.visibility = o > 0.001 ? 'visible' : 'hidden';
      capB.style.top = '200px';
      illuminate(capB.w, t, tl.capB[0] + 0.2, 0.11, 1.1, 1);
    }
    // keep caption 3 from overlapping its follow-up line in the reveal film
    if (!HERO) caps[2].box.style.opacity = f3(win(t, tl.caps[2][0], tl.caps[2][1], 0.6, 0.5));

    // speaking subtitle
    const [sp0, sp1] = tl.speech;
    const spO = win(t, sp0 - 0.4, sp1 + 1.6, 0.5, 0.7);
    speech.style.opacity = f3(spO);
    speech.style.visibility = spO > 0.001 ? 'visible' : 'hidden';
    const dw = (sp1 - sp0 - 1.2) / speechW.length;
    speechW.forEach((s2, i) => {
      const p = E.out(P(t, sp0 + i * dw, sp0 + i * dw + 0.45));
      s2.style.opacity = f3(0.12 + 0.88 * p);
      s2.style.textShadow = p > 0 && p < 1 ? `0 0 ${(16 * (1 - p)).toFixed(1)}px rgba(255,214,140,.8)` : 'none';
    });
    if (speechTr) { const tp = E.out(P(t, sp1 - 0.6, sp1 + 0.6)); show(speechTr, tp, { y: (1 - tp) * 10, blur: (1 - tp) * 4 }); }

    // hero constellation
    if (cst) {
      const [c0, c1] = tl.parallel;
      const o = win(t, c0, c1, 1.0, 1.0);
      cst.style.opacity = f3(o);
      cst.style.visibility = o > 0.001 ? 'visible' : 'hidden';
      const ax = E.out(P(t, c0 + 0.2, c0 + 1.6));
      cst.axis.style.strokeDasharray = '1600'; cst.axis.style.strokeDashoffset = (1600 * (1 - ax)).toFixed(0);
      cst.ticks.forEach((tk) => { tk.style.opacity = f3(ax * 0.9); });
      const you = E.back(P(t, c0 + 0.6, c0 + 1.6));
      cst.youG.style.opacity = f3(clamp(you));
      cst.youG.style.transformOrigin = '1640px 640px';
      cst.youG.style.transform = `scale(${(0.6 + 0.4 * you + 0.04 * Math.sin(t * 2.2)).toFixed(3)})`;
      cst.stars.forEach((st2, i) => {
        const at = c0 + 1.6 + i * 0.85;
        const p = E.back(P(t, at, at + 0.7));
        st2.style.opacity = f3(clamp(P(t, at, at + 0.5)));
        st2.style.transformOrigin = `${cst.people[i].x}px 640px`;
        st2.style.transform = `scale(${(0.7 + 0.3 * p).toFixed(3)})`;
        const th = cst.threads[i];
        const tp = E.inOut(P(t, at + 0.3, at + 1.9));
        th.style.strokeDashoffset = (th.len * (1 - tp)).toFixed(1);
        th.style.opacity = f3(clamp(tp * 3) * 0.95);
      });
      const hO = win(t, c0 + 0.4, c1, 0.6, 1.0);
      cst.head.style.opacity = f3(hO); cst.head.style.visibility = hO > 0.001 ? 'visible' : 'hidden';
      illuminate(cst.headW, t, c0 + 0.6, 0.1, 1.1, 0.8);
      show(cst.kick, win(t, c0 + 0.3, c1, 0.6, 1.0));
      const sbo = win(t, c0 + 7.4, c1, 1.0, 1.0);
      show(cst.sub, sbo, { y: (1 - E.out(P(t, c0 + 7.4, c0 + 8.6))) * 12 });
    }

    // global fade
    stage.style.opacity = '1';
  }

  /* ───────── boot ───────── */
  window.render = render;
  window.FILM = { W, H, DURATION, FPS: 30, V, LANG, BLOOMS: BLOOMS.map((b) => b.t0) };
  Promise.all([
    document.fonts.load('500 70px Cormorant'), document.fonts.load('italic 500 190px Cormorant'), document.fonts.load('italic 400 30px Cormorant'), document.fonts.load('600 30px Cormorant'),
    document.fonts.load('400 40px Tiro', 'अ'), document.fonts.load('italic 400 40px Tiro', 'अ'),
    document.fonts.load('400 20px Inter'), document.fonts.load('500 20px Inter'), document.fonts.load('600 20px Inter'),
  ]).catch(() => {}).then(() => document.fonts.ready).then(() => {
    render(0);
    measure();
    render(0);
    window.FILM_READY = true;
  });
})();
