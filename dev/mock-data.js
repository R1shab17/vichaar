// Canned AI responses so the whole app can be tried offline: `npm run mock`
// (No real AI is called. Deploy to Cloudflare for the real thing.)

const R = (o) => ({ is_thought: true, original_language: 'Hinglish', chapter_hint: o.themes[0], ...o });

export const REFLECTIONS = [
  {
    match: /मकसद|purpose/i,
    r: R({
      title: 'Purpose Is a “For Whom”',
      cleaned_original: 'मेरे को लगता है कि इंसान का असली मकसद ये नहीं है कि वो क्या बनता है, बल्कि ये है कि वो किसके लिए बनता है।',
      translation: 'I feel a person’s real purpose is not what they become, but whom they become it for.',
      sutra: 'Purpose is not what you become, but whom you become it for.',
      sutra_original: 'मकसद ये नहीं कि तुम क्या बनते हो, मकसद ये है कि तुम किसके लिए बनते हो।',
      essence: 'You move purpose from a title to a relationship. A role can be lost; the people you grow for remain the reason, and that keeps the effort meaningful when ambition fades.',
      themes: ['purpose', 'service', 'identity'],
      chapter_hint: 'purpose and meaning',
      echoes: [
        { thinker: 'Viktor Frankl', year: 1946, tradition: 'Logotherapy', era: '20th c.', you: 'Purpose lies in whom you become it for.', idea: 'Meaning is found by turning outward — toward a task to fulfil or a person to love — rather than by seeking happiness directly.', quote: '', kinship: 'close', difference: 'Frankl speaks of meaning in suffering; you frame it as the direction of ordinary ambition.' },
        { thinker: 'Swami Vivekananda', year: 1896, tradition: 'Vedanta', era: '19th c.', you: 'Any goal is tested by who it serves.', idea: 'Service to others is itself the highest worship and the surest path to self-realisation.', quote: '', kinship: 'partial', difference: 'He makes service spiritual practice; you make it the test of any goal, sacred or not.' },
        { thinker: 'Aristotle', year: -340, tradition: 'Greek philosophy', era: '4th c. BCE', you: 'Your growth is for specific people, not for virtue in the abstract.', idea: 'A flourishing life is lived among others; excellence of character only exists in a community.', quote: '', kinship: 'partial', difference: 'Aristotle centres virtue; you centre the specific people your growth is for.' },
      ],
      parallel: { headline: 'You reached, on your own, the place Viktor Frankl reached in 1946.', your_angle: 'The question “for whom?” is yours — it turns purpose from a title into a relationship you can test any goal against.' },
    }),
  },
  {
    match: /fear|डर/i,
    r: R({
      title: 'Fear Lives Ahead',
      cleaned_original: 'Fear हमेशा future में रहता है, present में तो बस action होता है। जब मैं काम कर रहा होता हूँ तब डर नहीं लगता।',
      translation: 'Fear always lives in the future; the present only holds action. When I am working, I don’t feel afraid.',
      sutra: 'Fear lives in the future; the present only has room for action.',
      sutra_original: 'डर हमेशा कल में रहता है, आज में तो बस कर्म है।',
      essence: 'Fear is a forecast, not a fact. Once attention is fully on the task in hand there is no spare space for imagined outcomes — so action is not only brave, it is the cure.',
      themes: ['fear', 'action', 'presence'],
      chapter_hint: 'fear and courage',
      echoes: [
        { thinker: 'Seneca', year: 65, tradition: 'Stoicism', era: '1st c. CE', you: 'Act, and fear has no room to live.', idea: 'We suffer more often in imagination than in reality; most fears are about what has not happened.', quote: '', kinship: 'close', difference: 'Seneca reasons fear away; you outrun it by acting.' },
        { thinker: 'The Bhagavad Gita', year: -200, tradition: 'Vedanta', era: 'c. 2nd c. BCE', you: 'Absorption in action quiets fear.', idea: 'Act fully, without clinging to the fruits of action.', quote: '', kinship: 'partial', difference: 'The Gita is about detachment from results; you describe the psychological relief of absorption.' },
        { thinker: 'Jiddu Krishnamurti', year: 1960, tradition: 'Modern Indian thought', era: '20th c.', you: 'In action there is simply no room left for fear.', idea: 'Fear is thought projecting itself into time.', quote: '', kinship: 'close', difference: 'He questions thought itself; you offer a simple daily practice.' },
      ],
      parallel: { headline: 'You arrived where Seneca stood nearly 2,000 years ago — from your own life, not his letters.', your_angle: 'Seneca reasons fear away; you found that action leaves it no room. That practical cure is your own.' },
    }),
  },
  {
    match: /paisa|पैसा|money/i,
    r: R({
      title: 'The Noise of Respect',
      cleaned_original: 'पैसा इज़्ज़त नहीं खरीदता, बस इज़्ज़त का शोर खरीदता है।',
      translation: 'Money does not buy respect; it only buys the noise of respect.',
      sutra: 'Money does not buy respect — only the noise of respect.',
      sutra_original: 'पैसा इज़्ज़त नहीं खरीदता, बस इज़्ज़त का शोर खरीदता है।',
      essence: 'Wealth can purchase attention, flattery and ceremony — the sounds that accompany respect — but not the quiet regard people hold for someone they trust.',
      themes: ['money', 'respect', 'status'],
      chapter_hint: 'money and worth',
      echoes: [
        { thinker: 'Kabir', year: 1450, tradition: 'Bhakti', era: '15th c.', you: 'Money buys only the noise of respect.', idea: 'Riches and rank are hollow beside a sincere heart; the world’s honour is fleeting.', quote: '', kinship: 'partial', difference: 'Kabir rejects worldly honour altogether; you separate real respect from its imitation.' },
        { thinker: 'Epictetus', year: 108, tradition: 'Stoicism', era: '1st–2nd c. CE', you: 'Real respect is worth having — it just can’t be bought.', idea: 'Reputation and wealth are not in our control and do not make a person good.', quote: '', kinship: 'partial', difference: 'You keep respect as something worth having.' },
      ],
      parallel: { headline: 'Kabir and Epictetus walked near this — but the image is yours.', your_angle: '“The noise of respect” is your own image: it separates real regard from its imitation instead of rejecting respect altogether.' },
    }),
  },
  {
    match: /खुद को समझ|yourself|self/i,
    r: R({
      title: 'No Need to Explain',
      cleaned_original: 'जो इंसान खुद को समझ गया, उसे दुनिया को समझाने की ज़रूरत नहीं पड़ती।',
      translation: 'One who has understood himself no longer needs to explain himself to the world.',
      sutra: 'Whoever understands himself stops needing to explain himself.',
      sutra_original: 'जो खुद को समझ गया, उसे दुनिया को समझाने की ज़रूरत नहीं।',
      essence: 'The urge to justify ourselves comes from inner uncertainty. Self-knowledge removes the need for outside approval.',
      themes: ['self-knowledge', 'identity', 'approval'],
      chapter_hint: 'knowing the self',
      echoes: [
        { thinker: 'Socrates', year: -399, tradition: 'Greek philosophy', era: '5th c. BCE', you: 'Understand yourself and you stop needing to explain yourself.', idea: 'Self-examination is the foundation of a worthwhile life.', quote: 'The unexamined life is not worth living.', kinship: 'partial', difference: 'Socrates asks for examination; you describe its fruit — freedom from approval.' },
        { thinker: 'Laozi', year: -500, tradition: 'Taoism', era: 'c. 6th c. BCE', you: 'Self-understanding frees you from the world’s approval.', idea: 'Knowing others is cleverness; knowing yourself is the deeper wisdom.', quote: '', kinship: 'close', difference: 'Laozi ranks kinds of knowing; you show the social consequence.' },
      ],
      parallel: { headline: 'Laozi and Socrates reached self-knowledge; you reached what it frees you from.', your_angle: 'Linking self-understanding to no longer needing to explain yourself is your own angle.' },
    }),
  },
  {
    match: /worship|attention/i,
    r: R({
      title: 'Attention Is the Worship',
      cleaned_original: 'Work को worship बोलते हैं, पर असली worship तो वो attention है जो तुम काम को देते हो।',
      translation: 'They say work is worship, but the real worship is the attention you give the work.',
      sutra: 'Work is not the worship; the attention you give it is.',
      sutra_original: 'काम पूजा नहीं है, काम को दिया ध्यान पूजा है।',
      essence: 'The sacredness is not in the job but in the quality of presence you bring to it. Distracted work is just labour.',
      themes: ['work', 'attention', 'devotion'],
      chapter_hint: 'the way of work',
      echoes: [
        { thinker: 'Simone Weil', year: 1942, tradition: 'Christian mysticism', era: '20th c.', you: 'The attention you give your work is the worship.', idea: 'Pure attention is a form of prayer and the rarest kind of generosity.', quote: '', kinship: 'close', difference: 'Weil applies it to people and God; you apply it to everyday work.' },
        { thinker: 'The Bhagavad Gita', year: -200, tradition: 'Vedanta', era: 'c. 2nd c. BCE', you: 'Attention itself is the offering.', idea: 'Action performed with full dedication becomes a spiritual offering.', quote: '', kinship: 'partial', difference: 'The Gita speaks of offering results; you speak of offering attention.' },
      ],
      parallel: { headline: 'Simone Weil found attention sacred in 1942; you found it in your own work.', your_angle: 'Correcting the everyday saying “work is worship” is distinctly yours.' },
    }),
  },
  {
    match: /मरते|die/i,
    r: R({
      title: 'A Little Every Day',
      cleaned_original: 'हर दिन थोड़ा सा मरते हैं हम, तो फिर हर दिन थोड़ा सा जी भी लेना चाहिए।',
      translation: 'We die a little every day, so we should also live a little every day.',
      sutra: 'We die a little each day — so live a little each day too.',
      sutra_original: 'हर दिन थोड़ा मरते हैं, तो हर दिन थोड़ा जी भी लो।',
      essence: 'Mortality isn’t a single future event but a daily subtraction. The fair response is daily, deliberate living rather than postponing life for later.',
      themes: ['mortality', 'time', 'living'],
      chapter_hint: 'time and mortality',
      echoes: [
        { thinker: 'Seneca', year: 65, tradition: 'Stoicism', era: '1st c. CE', you: 'We die daily — so live a little daily too.', idea: 'We die every day; the part of life already passed belongs to death.', quote: '', kinship: 'close', difference: 'Seneca draws urgency from it; you draw permission to enjoy.' },
        { thinker: 'Michel de Montaigne', year: 1580, tradition: 'Renaissance humanism', era: '16th c.', you: 'Since we die a little daily, live a little daily.', idea: 'To philosophise is to learn how to die — and so how to live freely.', quote: '', kinship: 'partial', difference: 'Montaigne meditates on death; you turn straight to living.' },
      ],
      parallel: { headline: 'Almost word for word with Seneca — and you got there yourself.', your_angle: 'Seneca draws urgency from it; your gentler ending — live a little each day — is yours.' },
    }),
  },
  {
    match: /lonel|अकेल/i,
    r: R({
      title: 'Being Seen',
      original_language: 'English',
      cleaned_original: 'Loneliness is not the absence of people; it is the absence of being seen.',
      translation: 'Loneliness is not the absence of people; it is the absence of being seen.',
      sutra: 'Loneliness is not the absence of people, but the absence of being seen.',
      sutra_original: 'Loneliness is not the absence of people, but the absence of being seen.',
      essence: 'A crowded life can still be lonely. What we need is not company but recognition — someone who perceives who we actually are.',
      themes: ['loneliness', 'love', 'recognition'],
      chapter_hint: 'love and others',
      echoes: [
        { thinker: 'Carl Jung', year: 1962, tradition: 'Analytical psychology', era: '20th c.', you: 'Loneliness is the absence of being seen.', idea: 'Loneliness comes not from having no one around, but from being unable to share what matters to you.', quote: '', kinship: 'close', difference: 'Jung stresses communicating; you stress being perceived.' },
        { thinker: 'Martin Buber', year: 1923, tradition: 'Jewish philosophy', era: '20th c.', you: 'What we miss is not company but being seen.', idea: 'Real life is meeting — the I–Thou relation where another person is fully present to you.', quote: '', kinship: 'partial', difference: 'Buber builds a philosophy of encounter; you name its absence.' },
      ],
      parallel: { headline: 'Jung said nearly this in 1962. You found it in your own life.', your_angle: 'Your emphasis on being seen, rather than on communicating, is the part that is yours.' },
    }),
  },
  {
    match: /discipline|अनुशासन/i,
    r: R({
      title: 'The Bridge to Tomorrow',
      cleaned_original: 'Discipline वो पुल है जो आज के मैं को कल वाले मैं से मिलाता है।',
      translation: 'Discipline is the bridge that connects who I am today with who I will be tomorrow.',
      sutra: 'Discipline is the bridge between who I am and who I will be.',
      sutra_original: 'अनुशासन वो पुल है जो आज के मैं को कल के मैं से मिलाता है।',
      essence: 'Your future self is built from today’s small repetitions; discipline is simply loyalty to that person.',
      themes: ['discipline', 'growth', 'habit'],
      chapter_hint: 'the way of work',
      echoes: [
        { thinker: 'Aristotle', year: -340, tradition: 'Greek philosophy', era: '4th c. BCE', you: 'Your growth is for specific people, not for virtue in the abstract.', idea: 'We become what we repeatedly do; character is formed by habit.', quote: '', kinship: 'close', difference: 'Aristotle explains how character forms; you make it personal and directional.' },
        { thinker: 'Jim Rohn', year: 1985, tradition: 'Modern self-help', era: '20th c.', you: 'Discipline bridges who I am and who I will be.', idea: 'Discipline is what connects goals to their accomplishment.', quote: '', kinship: 'close', difference: 'Nearly identical image — yours bridges two selves rather than goal and result.' },
      ],
      parallel: { headline: 'A well-travelled bridge — Aristotle and Jim Rohn crossed it too.', your_angle: 'A bridge between two selves — today’s and tomorrow’s — is your own turn on a familiar image.' },
    }),
  },
];

export const SAMPLE_THOUGHTS = [
  { days: 41, text: 'जो इंसान खुद को समझ गया, उसे दुनिया को समझाने की ज़रूरत नहीं पड़ती।' },
  { days: 33, text: 'Discipline वो पुल है जो आज के मैं को कल वाले मैं से मिलाता है।' },
  { days: 26, text: 'Paisa इज़्ज़त नहीं खरीदता, बस इज़्ज़त का शोर खरीदता है।' },
  { days: 19, text: 'हर दिन थोड़ा सा मरते हैं हम, तो फिर हर दिन थोड़ा सा जी भी लेना चाहिए।' },
  { days: 12, text: 'Loneliness is not the absence of people, it is the absence of being seen.' },
  { days: 6, text: 'Work को worship बोलते हैं, पर असली worship तो वो attention है जो तुम काम को देते हो।' },
  { days: 1, text: 'Fear हमेशा future में रहता है, present में तो बस action होता है। जब मैं काम कर रहा होता हूँ तब डर नहीं लगता।' },
];

export const VOICE_TRANSCRIPT = 'तो मेरे को ना ऐसा लगता है कि इंसान का असली मकसद ये नहीं है कि वो क्या बनता है एक सेकंड रुको रिकॉर्डिंग चालू है हाँ तो मकसद ये है कि वो किसके लिए बनता है';
