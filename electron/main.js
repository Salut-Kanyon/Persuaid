const { app, BrowserWindow, session, protocol } = require('electron');
const path = require('path');
const fs = require('fs');
const http = require('http');
const https = require('https');
const { WebSocketServer } = require('ws');

const STT_PROXY_PORT = 2998;
const DEEPGRAM_ORIGIN = 'wss://api.deepgram.com';
let sttProxyServer = null;

/** Write to debug.log in userData and /tmp so you can tail -f it when running the app from Finder. */
let debugLogStream = null;
let debugLogStreamTmp = null;
function debugLog(...args) {
  const line = args.map((a) => (typeof a === 'object' ? JSON.stringify(a) : String(a))).join(' ') + '\n';
  console.log(...args);
  [debugLogStream, debugLogStreamTmp].forEach((s) => {
    if (s) try { s.write(line); } catch (_) {}
  });
}

const APP_PROTOCOL = 'app';
const APP_HOST = 'persuaid';

// ─── Dev vs production ─────────────────────────────────────────────────────
// - Packaged app (DMG/.app): ALWAYS serve bundled frontend from Resources/out.
//   Never load localhost:3000 or any external URL.
// - DESKTOP_DEV=1 (npm run desktop:dev): load localhost:3000 for hot reload.
// - Unpacked, no DESKTOP_DEV (npm run desktop): serve from ./out if it exists.
const isPackaged = app.isPackaged;
const forceDevServer = process.env.DESKTOP_DEV === '1';
const outDirUnpacked = path.join(__dirname, '..', 'out');
const outDirPackaged = path.join(process.resourcesPath, 'out');
const bundledOutExists = () => {
  // Next.js static export creates welcome.html (not welcome/index.html)
  const welcomeHtml = path.join(outDirUnpacked, 'welcome.html');
  const welcomeIndex = path.join(outDirUnpacked, 'welcome', 'index.html');
  return fs.existsSync(welcomeHtml) || fs.existsSync(welcomeIndex);
};

const useBundledFrontend = !forceDevServer && (isPackaged || bundledOutExists());
const OUT_DIR = isPackaged ? outDirPackaged : outDirUnpacked;

// Load .env so API keys are available in main process (required for packaged app; optional for dev).
// 1) App config folder (packaged app + optional dev): ~/Library/Application Support/Persuaid/.env
const userDataDir = app.getPath('userData');
const appEnvPath = path.join(userDataDir, '.env');
if (fs.existsSync(appEnvPath)) {
  require('dotenv').config({ path: appEnvPath });
}
// 2) Project .env.local (dev only; not present in packaged app)
if (!isPackaged) {
  const envLocalPath = path.join(__dirname, '..', '.env.local');
  if (fs.existsSync(envLocalPath)) {
    require('dotenv').config({ path: envLocalPath });
  }
}

// Custom protocol so the app loads from the bundle (no localhost, no HTTP server).
protocol.registerSchemesAsPrivileged([
  { scheme: APP_PROTOCOL, privileges: { standard: true, secure: true, supportFetchAPI: true } },
]);

const BUNDLE_SERVER_PORT = 2999;
let bundleHttpServer = null;

console.log('Electron startup:', {
  isPackaged,
  forceDevServer,
  bundledOutExists: bundledOutExists(),
  useBundledFrontend,
  OUT_DIR,
});

let mainWindow;

// Desktop entry: welcome first (handles auth check with timeout), then sign-in → dashboard.
const DESKTOP_ENTRY_PATH = '/welcome';
const DESKTOP_ENTRY_FILE = 'welcome.html';

const OPENAI_URL = 'https://api.openai.com/v1/chat/completions';

function buildConversation(transcript) {
  return transcript
    .map((m) => `${m.speaker === 'prospect' ? 'Prospect' : 'Rep'}: ${m.text}`)
    .join('\n');
}

function getLastExchange(transcript, n = 6) {
  const last = transcript.slice(-n);
  return last
    .map((m) => `${m.speaker === 'prospect' ? 'Prospect' : 'Rep'}: ${m.text}`)
    .join('\n');
}

/** In-app handler for POST /api/ai/follow-up: mode=answer (Enter) or mode=follow_up_question (button). */
function handleFollowUpApi(body, res) {
  console.log('[AI] /api/ai/follow-up called');
  const key = process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY.trim();
  if (!key) {
    res.writeHead(503, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'OPENAI_API_KEY is not configured. Add it to ~/Library/Application Support/Persuaid/.env' }));
    return;
  }
  let parsed;
  try {
    parsed = JSON.parse(body);
  } catch {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Invalid JSON body' }));
    return;
  }
  const transcript = parsed.transcript ?? [];
  const scriptContext = parsed.scriptContext ?? '';
  const notesContext = (parsed.notesContext ?? '').trim();
  const dealContext = parsed.dealContext ?? {};
  const mode = parsed.mode === 'follow_up_question' ? 'follow_up_question' : 'answer';
  const conversation = buildConversation(transcript);
  if (!conversation.trim()) {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ text: 'Say something so I can suggest what to say next.' }));
    return;
  }
  const lastExchange = getLastExchange(transcript);
  const lastProspectMessage = (transcript.filter((m) => m.speaker === 'prospect').slice(-1)[0]?.text ?? '').trim();
  const baseSystemPrompt = `You are Persuaid, a real-time sales copilot helping a rep during a live sales call.

Your job is to give the rep the exact next words to say out loud in the moment, not generic coaching or analysis.

Before you respond, silently infer what the last prospect message is most like:
- product question
- pricing question
- objection
- competitor comparison
- hesitation
- buying signal
- confusion
- unclear transcript (for messy or incomplete text)

Prioritize context in this order:
1) The last thing the prospect said.
2) The most recent exchange.
3) The rep's notes panel as product knowledge and objection-handling canon.
4) Any script / talking points.
5) The broader transcript.

Always:
- Speak in natural, confident, spoken sales language (what the rep would actually say next).
- Prefer plainspoken, natural sales language over polished assistant language.
- Stay concise (1–2 short sentences or one short question).
- Do NOT output bullet points, headings, markdown, or multiple options.
- Do NOT explain your reasoning, coach the rep, or talk about "the transcript" or "the prospect's intent".
- Every response must either answer the question, handle the objection, move the conversation forward, or safely clarify what the prospect meant.

Voice: Avoid phrases like "I'd love to understand", "let's explore", "help guide you", "uncover your needs", "based on your situation". Prefer phrases like "that's a fair question", "the main thing is", "usually what people do is", "in most cases", "what that really means is". Do not begin with generic filler unless it is very brief and followed immediately by the answer.

Confidence: Use confident but natural sales language. Prefer "usually what people do is", "the main thing is", "most people in your situation", "typically what happens is". Avoid uncertain phrasing like "it might help to", "you could consider", "perhaps".

Humanizing: When appropriate, start with a short phrase then the answer: "That's a great question.", "That's actually pretty common.", "A lot of people ask that.", "That's a fair concern." Keep it short and follow immediately with the answer.

Momentum: When appropriate, end the response with a small forward-moving question or transition so the conversation keeps moving. Natural, not pushy. Examples: "Do you currently have any coverage in place today?" "Is that something you've looked into before?" "How are you currently handling that right now?"

Objections: When the prospect raises an objection, use: (1) Acknowledge the concern briefly, (2) Reframe or give helpful perspective, (3) Continue naturally. Example: "That's a fair concern. Most people actually find the monthly cost is lower than they expected. Usually what we do is start with something simple and adjust from there."

Treat the notes panel as authoritative product knowledge when it is relevant. Prefer using details from the notes over generic assumptions, and do not invent specific facts that are not supported by the notes.`;

  const systemPrompt = mode === 'follow_up_question'
    ? `${baseSystemPrompt}

You are currently in FOLLOW-UP QUESTION mode.

Your goal is to give the rep ONE strong follow-up question to ask the prospect that moves the sale forward.

Rules specific to this mode:
- Output ONLY one natural, conversational question the rep can ask out loud.
- Choose a question that logically follows the last thing the prospect said.
- Prefer questions that uncover pain, urgency, budget, decision process, current setup, or hidden objections.
- Do not answer the prospect directly; output only the question.
- No bullet points, headings, markdown, explanations, or multiple questions.`
    : `${baseSystemPrompt}

You are currently in ANSWER mode.

Your goal is to give the rep the exact short line or two they should say next to respond to the prospect.

Rules specific to this mode:
- When the prospect's last message is a direct question or objection, the first sentence must directly answer or address it immediately. Do not begin with generic filler (e.g. "I'd love to learn more about your situation so I can help guide you") unless it is very brief and followed immediately by the answer. Good: "That's a fair question. Employer coverage is usually limited and often doesn't follow you if you leave the job." Bad: "I'd love to learn more about your situation so I can help guide you."
- When the prospect raises an objection, use Acknowledge → Reframe → Continue (brief acknowledge, then reframe or add perspective, then continue naturally). When appropriate, end your response with a short forward-moving question (Momentum) so the rep keeps control and can qualify—e.g. "Do you currently have any coverage through work right now?"
- Directly answer or respond to the prospect's last message using the intent you inferred.
- Use the notes panel as product knowledge so the answer is specific and accurate when the notes are relevant.
- Output 1–3 short sentences when needed (e.g. answer + optional momentum question). Stay in natural spoken sales language.
- If the prospect's last message is clearly confused or the transcript is garbled / ambiguous so you cannot tell what they are asking, do NOT guess. Instead, output one short clarifying line that politely checks what they mean (for example, asking if they are asking more about pricing or how the product works).
- Do not output bullet points, headings, markdown, explanations, or coaching.`;
  const parts = [
    `Conversation so far:\n${conversation.slice(-1200)}`,
  ];
  if (lastProspectMessage) {
    parts.push(`Last thing the prospect said:\n"${lastProspectMessage}"`);
  }
  parts.push(`Most recent exchange:\n${lastExchange}`);
  if (scriptContext) parts.push(`Script / talking points (context only):\n${scriptContext.slice(0, 400)}`);
  if (notesContext) parts.push(`Rep's notes (product knowledge):\n${notesContext.slice(0, 800)}`);
  const dealContextEntries = Object.entries(dealContext).filter(([, v]) => typeof v === 'string' && v.trim());
  if (dealContextEntries.length > 0) {
    const dealSummary = dealContextEntries.map(([k, v]) => `${k.replace(/_/g, ' ')}: ${v}`).join('. ');
    parts.push(`Deal context (what we know so far about this prospect/call): ${dealSummary}`);
    parts.push('Use the deal context above when it helps: reference the prospect\'s company, timeline, current solution, pain, or decision maker to make the reply more relevant (e.g. "Since you\'re already using Salesforce…", "Given you\'re looking at next quarter…").');
  }
  parts.push(
    'For your internal reasoning only (do NOT mention this out loud), first decide which intent category best matches the prospect\\'s last message: product question, pricing question, objection, competitor comparison, hesitation, buying signal, confusion, or unclear transcript. Then, based on the current mode and that intent, craft exactly one concise spoken response as instructed.'
  );
  if (mode === 'follow_up_question') {
    parts.push(`What is one good follow-up question the rep should ask next? Reply with only that question.`);
  } else {
    parts.push(`What is the exact sentence the rep should say to answer the customer? Reply with only that line.`);
  }
  const userPrompt = parts.join('\n\n');
  const maxTokens = mode === 'follow_up_question' ? 80 : 200;
  const payload = JSON.stringify({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    max_tokens: maxTokens,
    temperature: 0.5,
  });
  const reqOpts = {
    hostname: 'api.openai.com',
    path: '/v1/chat/completions',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${key}`,
      'Content-Length': Buffer.byteLength(payload, 'utf8'),
    },
  };
  console.log('[AI] sending request to OpenAI (follow-up)');
  const outReq = https.request(reqOpts, (outRes) => {
    let chunks = '';
    outRes.on('data', (c) => { chunks += c; });
    outRes.on('end', () => {
      console.log('[AI] response received (follow-up)', outRes.statusCode);
      res.setHeader('Content-Type', 'application/json');
      if (!outRes.statusCode || outRes.statusCode < 200 || outRes.statusCode >= 300) {
        console.error('OpenAI follow-up error:', outRes.statusCode, chunks);
        res.writeHead(502);
        res.end(JSON.stringify({ error: 'AI follow-up failed' }));
        return;
      }
      try {
        const data = JSON.parse(chunks);
        let text = (data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content)
          ? data.choices[0].message.content.trim() : '';
        // Strip any accidental markdown headings or leading list markers.
        text = text.replace(/^##\s*[^\n]*\n?/gm, '').trim();
        text = text.replace(/^[\-\u2022]\s*/, '').trim();
        res.writeHead(200);
        const fallback = mode === 'follow_up_question' ? 'Press the button again after more conversation.' : 'Press Enter again after more conversation.';
        res.end(JSON.stringify({ text: text || fallback }));
      } catch (e) {
        res.writeHead(502);
        res.end(JSON.stringify({ error: 'AI follow-up failed' }));
      }
    });
  });
  outReq.on('error', (e) => {
    console.error('OpenAI request error:', e);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'AI follow-up failed' }));
  });
  outReq.write(payload, 'utf8');
  outReq.end();
}

/** In-app handler for POST /api/ai/rewrite-notes (Improve notes for sales). */
function handleRewriteNotesApi(body, res) {
  console.log('[AI] /api/ai/rewrite-notes called');
  const key = process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY.trim();
  if (!key) {
    res.writeHead(503, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'OPENAI_API_KEY is not configured. Add it to ~/Library/Application Support/Persuaid/.env' }));
    return;
  }
  let parsed;
  try {
    parsed = JSON.parse(body);
  } catch {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Invalid JSON body' }));
    return;
  }
  const content = (parsed.content ?? '').trim();
  if (!content) {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'No content to rewrite' }));
    return;
  }
  console.log('[AI] sending request to OpenAI (rewrite-notes)');
  const systemPrompt = `You are a sales enablement expert. Rewrite the user's notes so they are clearer and more useful for a sales call. Improve:
- Product knowledge: make features and benefits easy to recall and explain.
- Objection handling: turn rough notes into clear rebuttals or talking points.
- Structure: use short bullets or sections so the rep can scan quickly during a call.
Keep the same general content; do not add fake details. Output only the rewritten notes, no preamble.`;
  const userPrompt = `Rewrite these notes for a sales rep:\n\n${content.slice(0, 4000)}`;
  const payload = JSON.stringify({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    max_tokens: 1000,
    temperature: 0.3,
  });
  const reqOpts = {
    hostname: 'api.openai.com',
    path: '/v1/chat/completions',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${key}`,
      'Content-Length': Buffer.byteLength(payload, 'utf8'),
    },
  };
  const outReq = https.request(reqOpts, (outRes) => {
    let chunks = '';
    outRes.on('data', (c) => { chunks += c; });
    outRes.on('end', () => {
      console.log('[AI] response received (rewrite-notes)', outRes.statusCode);
      res.setHeader('Content-Type', 'application/json');
      if (!outRes.statusCode || outRes.statusCode < 200 || outRes.statusCode >= 300) {
        res.writeHead(502);
        res.end(JSON.stringify({ error: 'AI rewrite failed' }));
        return;
      }
      try {
        const data = JSON.parse(chunks);
        const text = (data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content)
          ? data.choices[0].message.content.trim() : '';
        res.writeHead(200);
        res.end(JSON.stringify({ text: text || content }));
      } catch {
        res.writeHead(502);
        res.end(JSON.stringify({ error: 'AI rewrite failed' }));
      }
    });
  });
  outReq.on('error', () => {
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'AI rewrite failed' }));
  });
  outReq.write(payload, 'utf8');
  outReq.end();
}

/** In-app handler for POST /api/ai/deal-context (extract deal context from transcript). */
function handleDealContextApi(body, res) {
  console.log('[AI] /api/ai/deal-context called');
  const key = process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY.trim();
  if (!key) {
    res.writeHead(503, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'OPENAI_API_KEY is not configured. Add it to ~/Library/Application Support/Persuaid/.env' }));
    return;
  }
  let parsed;
  try {
    parsed = JSON.parse(body);
  } catch {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Invalid JSON body' }));
    return;
  }
  const transcript = parsed.transcript ?? [];
  const conversation = transcript
    .map((m) => `${m.speaker === 'prospect' ? 'Prospect' : 'Rep'}: ${m.text}`)
    .join('\n');
  if (!conversation.trim()) {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ dealContext: {} }));
    return;
  }
  const DEAL_KEYS = ['company', 'industry', 'current_solution', 'pain_point', 'budget', 'timeline', 'decision_maker', 'competitors', 'team_size', 'use_case'];
  const systemPrompt = `You are a sales call analyst. From the transcript, extract only explicitly stated or clearly implied facts about the prospect and the deal.

Return a JSON object with exactly these keys (use short phrases or single values; omit a key or use empty string if not mentioned):
- company: prospect's company or organization name
- industry: industry or vertical
- current_solution: tools, CRM, or process they use today
- pain_point: main problem or need they mentioned
- budget: budget signals (e.g. "flexible", "tight", "approved")
- timeline: when they plan to buy or implement
- decision_maker: who decides or who they report to
- competitors: competitors or alternatives mentioned
- team_size: company or team size if mentioned
- use_case: primary use case or goal

Return only the JSON object, no commentary.`;
  const userPrompt = `Transcript:\n${conversation.slice(-4000)}\n\nExtract deal context. Return only a JSON object with the keys listed.`;
  const payload = JSON.stringify({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    response_format: { type: 'json_object' },
    max_tokens: 400,
    temperature: 0.2,
  });
  const reqOpts = {
    hostname: 'api.openai.com',
    path: '/v1/chat/completions',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${key}`,
      'Content-Length': Buffer.byteLength(payload, 'utf8'),
    },
  };
  console.log('[AI] sending request to OpenAI (deal-context)');
  const outReq = https.request(reqOpts, (outRes) => {
    let chunks = '';
    outRes.on('data', (c) => { chunks += c; });
    outRes.on('end', () => {
      console.log('[AI] response received (deal-context)', outRes.statusCode);
      res.setHeader('Content-Type', 'application/json');
      if (!outRes.statusCode || outRes.statusCode < 200 || outRes.statusCode >= 300) {
        res.writeHead(502);
        res.end(JSON.stringify({ error: 'Deal context extraction failed' }));
        return;
      }
      try {
        const data = JSON.parse(chunks);
        const raw = (data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content)
          ? data.choices[0].message.content.trim() : '';
        if (!raw) {
          res.writeHead(200);
          res.end(JSON.stringify({ dealContext: {} }));
          return;
        }
        const parsedRes = JSON.parse(raw);
        const dealContext = {};
        for (const k of DEAL_KEYS) {
          const v = parsedRes[k];
          if (typeof v === 'string' && v.trim()) {
            dealContext[k] = v.trim().slice(0, 300);
          }
        }
        res.writeHead(200);
        res.end(JSON.stringify({ dealContext }));
      } catch (e) {
        res.writeHead(502);
        res.end(JSON.stringify({ error: 'Deal context extraction failed' }));
      }
    });
  });
  outReq.on('error', () => {
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Deal context extraction failed' }));
  });
  outReq.write(payload, 'utf8');
  outReq.end();
}

/** In-app handler for POST /api/ai/suggestions */
function handleSuggestionsApi(body, res) {
  console.log('[AI] /api/ai/suggestions called');
  const key = process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY.trim();
  if (!key) {
    res.writeHead(503, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'OPENAI_API_KEY is not configured' }));
    return;
  }
  let parsed;
  try {
    parsed = JSON.parse(body);
  } catch {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Invalid JSON body' }));
    return;
  }
  const transcript = parsed.transcript ?? [];
  const scriptContext = parsed.scriptContext ?? '';
  const conversation = transcript.map((m) => `${m.speaker === 'prospect' ? 'Prospect' : 'Rep'}: ${m.text}`).join('\n');
  if (!conversation.trim()) {
    res.setHeader('Content-Type', 'application/json');
    res.writeHead(200);
    res.end(JSON.stringify({ suggestions: [] }));
    return;
  }
  const systemPrompt = 'You are a sales coach. Given a live call transcript, suggest 1–3 short, actionable tips for the rep. Return a JSON array of suggestions. Each suggestion must have: "type" (one of: objection, next-step, talking-point, question), "title" (short label), "text" (one or two sentences), "priority" (high, medium, or low). Focus on the most recent exchange. Be concise.';
  const userPrompt = scriptContext
    ? `Script context (talking points):\n${scriptContext}\n\nTranscript:\n${conversation}\n\nReturn a JSON array of suggestion objects only, no other text.`
    : `Transcript:\n${conversation}\n\nReturn a JSON array of suggestion objects only, no other text.`;
  console.log('[AI] sending request to OpenAI (suggestions)');
  const payload = JSON.stringify({
    model: 'gpt-4o-mini',
    messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: userPrompt }],
    response_format: { type: 'json_object' },
    max_tokens: 600,
  });
  const outReq = https.request({
    hostname: 'api.openai.com',
    path: '/v1/chat/completions',
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}`, 'Content-Length': Buffer.byteLength(payload, 'utf8') },
  }, (outRes) => {
    let chunks = '';
    outRes.on('data', (c) => { chunks += c; });
    outRes.on('end', () => {
      console.log('[AI] response received (suggestions)', outRes.statusCode);
      res.setHeader('Content-Type', 'application/json');
      if (outRes.statusCode < 200 || outRes.statusCode >= 300) {
        res.writeHead(502);
        res.end(JSON.stringify({ error: 'AI suggestion failed' }));
        return;
      }
      try {
        const data = JSON.parse(chunks);
        const content = (data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content) ? data.choices[0].message.content.trim() : '';
        if (!content) {
          res.writeHead(200);
          res.end(JSON.stringify({ suggestions: [] }));
          return;
        }
        let parsed = {};
        try {
          parsed = JSON.parse(content);
        } catch {
          const arrMatch = content.match(/\[[\s\S]*\]/);
          if (arrMatch) try { parsed = { suggestions: JSON.parse(arrMatch[0]) }; } catch (_) {}
        }
        const suggestions = (parsed.suggestions || (Array.isArray(parsed) ? parsed : [])).slice(0, 5).map((s, i) => ({
          id: `s-${i}-${Date.now()}`,
          type: ['objection', 'next-step', 'talking-point', 'question'].includes(s.type) ? s.type : 'talking-point',
          title: String(s.title ?? 'Suggestion').slice(0, 80),
          text: String(s.text ?? '').slice(0, 500),
          priority: ['high', 'medium', 'low'].includes(s.priority) ? s.priority : 'medium',
        }));
        res.writeHead(200);
        res.end(JSON.stringify({ suggestions }));
      } catch {
        res.writeHead(502);
        res.end(JSON.stringify({ error: 'AI suggestion failed' }));
      }
    });
  });
  outReq.on('error', () => {
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'AI suggestion failed' }));
  });
  outReq.write(payload, 'utf8');
  outReq.end();
}

/** In-app handler for POST /api/ai/answer */
function handleAnswerApi(body, res) {
  console.log('[AI] /api/ai/answer called');
  const key = process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY.trim();
  if (!key) {
    res.writeHead(503, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'OPENAI_API_KEY is not configured' }));
    return;
  }
  let parsed;
  try {
    parsed = JSON.parse(body);
  } catch {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Invalid JSON body' }));
    return;
  }
  const text = (parsed.text ?? '').trim();
  if (!text) {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Missing or empty text' }));
    return;
  }
  const systemPrompt = 'You are Persuaid, a real-time sales copilot helping a rep during a live sales call.\n\nYour job is to give the rep the exact next words to say out loud in the moment, not generic coaching or analysis.\n\nThe rep has typed in a specific question, objection, or snippet from the call. Respond as if you are putting words in their mouth.\n\nAlways:\n- Speak in natural, confident, spoken sales language (what the rep would actually say next).\n- Prefer plainspoken, natural sales language. Avoid "I\'d love to understand", "let\'s explore", "help guide you", "uncover your needs", "based on your situation". Prefer "that\'s a fair question", "the main thing is", "usually what people do is", "in most cases", "what that really means is". Use confident phrasing: prefer "usually what people do is", "most people in your situation", "typically what happens is"; avoid "it might help to", "you could consider", "perhaps".\n- When appropriate, start with a short humanizing phrase then the answer: "That\'s a great question.", "That\'s actually pretty common.", "A lot of people ask that.", "That\'s a fair concern." Follow immediately with the answer.\n- The first sentence must directly answer or address what they typed; do not begin with generic filler unless it is very brief and followed immediately by the answer.\n- When appropriate, end with a small forward-moving question (Momentum). If they raised an objection, use Acknowledge → Reframe → Continue.\n- Stay concise: 1–3 short sentences when momentum is used, otherwise 1–2.\n- Do NOT output bullet points, headings, markdown, or multiple options.\n- Do NOT explain your reasoning, coach the rep, or talk about "what you typed" or "this question".';
  const userPrompt = `The rep typed this because they need the next line to say out loud:\n"${text}"\n\nWhat is the exact short line or two they should say next? Reply with only that spoken answer.`;
  console.log('[AI] sending request to OpenAI (answer)');
  const payload = JSON.stringify({
    model: 'gpt-4o-mini',
    messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: userPrompt }],
    max_tokens: 300,
  });
  const outReq = https.request({
    hostname: 'api.openai.com',
    path: '/v1/chat/completions',
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}`, 'Content-Length': Buffer.byteLength(payload, 'utf8') },
  }, (outRes) => {
    let chunks = '';
    outRes.on('data', (c) => { chunks += c; });
    outRes.on('end', () => {
      console.log('[AI] response received (answer)', outRes.statusCode);
      res.setHeader('Content-Type', 'application/json');
      if (outRes.statusCode < 200 || outRes.statusCode >= 300) {
        res.writeHead(502);
        res.end(JSON.stringify({ error: 'AI answer failed' }));
        return;
      }
      try {
        const data = JSON.parse(chunks);
        const answer = (data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content) ? data.choices[0].message.content.trim() : '';
        res.writeHead(200);
        res.end(JSON.stringify({ answer }));
      } catch {
        res.writeHead(502);
        res.end(JSON.stringify({ error: 'AI answer failed' }));
      }
    });
  });
  outReq.on('error', () => {
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'AI answer failed' }));
  });
  outReq.write(payload, 'utf8');
  outReq.end();
}

/** In-app handler for POST /api/ai/notes (summary + items; Supabase insert skipped in Electron if env not set). */
function handleNotesApi(body, res) {
  console.log('[AI] /api/ai/notes called');
  const key = process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY.trim();
  if (!key) {
    res.writeHead(503, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'OPENAI_API_KEY is not configured' }));
    return;
  }
  let parsed;
  try {
    parsed = JSON.parse(body);
  } catch {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Invalid JSON body' }));
    return;
  }
  const transcript = parsed.transcript ?? [];
  const conversation = transcript.map((m) => `${m.speaker === 'prospect' ? 'Prospect' : 'Rep'}: ${m.text}`).join('\n');
  if (!conversation.trim()) {
    res.setHeader('Content-Type', 'application/json');
    res.writeHead(200);
    res.end(JSON.stringify({ summary: '', items: [] }));
    return;
  }
  const TAGS = ['Interest', 'Objection', 'Action', 'Budget', 'Contact', 'Pain Point'];
  const systemPrompt = `You are a sales assistant. Given a call transcript, produce:
1. A short summary (1-3 sentences).
2. A JSON array of note items. Each item has "content" (one short sentence or phrase) and "tags" (array of zero or more from: ${TAGS.join(', ')}). Output 3-8 note items. Use the exact tag names when relevant.`;
  const userPrompt = `Transcript:\n${conversation}\n\nReturn a single JSON object with keys "summary" (string) and "items" (array of { "content": string, "tags": string[] }). No other text.`;
  console.log('[AI] sending request to OpenAI (notes)');
  const payload = JSON.stringify({
    model: 'gpt-4o-mini',
    messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: userPrompt }],
    response_format: { type: 'json_object' },
    max_tokens: 800,
  });
  const outReq = https.request({
    hostname: 'api.openai.com',
    path: '/v1/chat/completions',
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}`, 'Content-Length': Buffer.byteLength(payload, 'utf8') },
  }, (outRes) => {
    let chunks = '';
    outRes.on('data', (c) => { chunks += c; });
    outRes.on('end', () => {
      console.log('[AI] response received (notes)', outRes.statusCode);
      res.setHeader('Content-Type', 'application/json');
      if (outRes.statusCode < 200 || outRes.statusCode >= 300) {
        res.writeHead(502);
        res.end(JSON.stringify({ error: 'AI notes failed' }));
        return;
      }
      try {
        const data = JSON.parse(chunks);
        const content = (data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content) ? data.choices[0].message.content.trim() : '';
        if (!content) {
          res.writeHead(200);
          res.end(JSON.stringify({ summary: '', items: [] }));
          return;
        }
        const parsed = JSON.parse(content);
        const summary = String(parsed.summary ?? '').slice(0, 2000);
        const items = (parsed.items ?? []).slice(0, 15).map((item) => ({
          content: String(item.content ?? '').slice(0, 500),
          tags: Array.isArray(item.tags) ? item.tags.filter((t) => TAGS.includes(t)).slice(0, 5) : [],
        }));
        res.writeHead(200);
        res.end(JSON.stringify({ summary, items }));
      } catch {
        res.writeHead(502);
        res.end(JSON.stringify({ error: 'AI notes failed' }));
      }
    });
  });
  outReq.on('error', () => {
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'AI notes failed' }));
  });
  outReq.write(payload, 'utf8');
  outReq.end();
}

/** Serve static files from dir (Next.js export: /welcome -> welcome.html, etc.). Used when packaged so DMG loads reliably. */
function createBundleServer(dir) {
  const rootDir = path.resolve(dir);
  return http.createServer((req, res) => {
    let urlPath = req.url.split('?')[0].split('#')[0];
    if (urlPath === '/' || urlPath === '') {
      urlPath = DESKTOP_ENTRY_PATH;
    }
    if (urlPath.startsWith('/')) urlPath = urlPath.slice(1);

    // In-app API: POST /api/ai/follow-up (What to say / Questions / Key points)
    if (req.method === 'POST' && urlPath === 'api/ai/follow-up') {
      let body = '';
      req.on('data', (c) => { body += c; });
      req.on('end', () => handleFollowUpApi(body, res));
      return;
    }
    // In-app API: POST /api/ai/rewrite-notes (Improve notes for sales)
    if (req.method === 'POST' && urlPath === 'api/ai/rewrite-notes') {
      let body = '';
      req.on('data', (c) => { body += c; });
      req.on('end', () => handleRewriteNotesApi(body, res));
      return;
    }
    // In-app API: POST /api/ai/deal-context (extract deal context from transcript)
    if (req.method === 'POST' && urlPath === 'api/ai/deal-context') {
      let body = '';
      req.on('data', (c) => { body += c; });
      req.on('end', () => handleDealContextApi(body, res));
      return;
    }
    if (req.method === 'POST' && urlPath === 'api/ai/suggestions') {
      let body = '';
      req.on('data', (c) => { body += c; });
      req.on('end', () => handleSuggestionsApi(body, res));
      return;
    }
    if (req.method === 'POST' && urlPath === 'api/ai/answer') {
      let body = '';
      req.on('data', (c) => { body += c; });
      req.on('end', () => handleAnswerApi(body, res));
      return;
    }
    if (req.method === 'POST' && urlPath === 'api/ai/notes') {
      let body = '';
      req.on('data', (c) => { body += c; });
      req.on('end', () => handleNotesApi(body, res));
      return;
    }

    let filePath = path.join(rootDir, urlPath);
    if (!path.extname(filePath)) {
      const htmlPath = filePath + '.html';
      if (fs.existsSync(htmlPath)) {
        filePath = htmlPath;
      } else {
        const dirIndex = path.join(filePath, 'index.html');
        filePath = fs.existsSync(dirIndex) ? dirIndex : htmlPath;
      }
    }
    const resolved = path.resolve(filePath);
    if (!resolved.startsWith(rootDir)) {
      console.warn('Forbidden path:', urlPath, '→', resolved);
      res.writeHead(403).end('Forbidden');
      return;
    }
    if (!fs.existsSync(resolved)) {
      console.warn('File not found:', urlPath, '→', resolved);
      res.writeHead(404).end('Not Found');
      return;
    }
    fs.readFile(resolved, (err, data) => {
      if (err) {
        console.error('Error reading file:', resolved, err.message);
        res.writeHead(500).end('Internal Server Error');
        return;
      }
      const ext = path.extname(resolved).toLowerCase();
      const types = {
        '.html': 'text/html; charset=utf-8',
        '.js': 'application/javascript; charset=utf-8',
        '.css': 'text/css; charset=utf-8',
        '.json': 'application/json; charset=utf-8',
        '.ico': 'image/x-icon',
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.svg': 'image/svg+xml',
        '.woff': 'font/woff',
        '.woff2': 'font/woff2',
        '.ttf': 'font/ttf',
      };
      res.setHeader('Content-Type', types[ext] || 'application/octet-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.end(data);
    });
  });
}

/** Read DEEPGRAM_API_KEY from process.env or from userData/.env (one line: DEEPGRAM_API_KEY=...) */
function getDeepgramApiKey() {
  if (process.env.DEEPGRAM_API_KEY) return process.env.DEEPGRAM_API_KEY.trim();
  try {
    const userDataDir = app.getPath('userData');
    const envPath = path.join(userDataDir, '.env');
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf8');
      const m = content.match(/DEEPGRAM_API_KEY\s*=\s*["']?([^"'\s\n]+)/);
      if (m) return m[1].trim();
    }
  } catch (e) {
    console.warn('Could not read .env from userData:', e.message);
  }
  return null;
}

/** Start in-app STT WebSocket proxy so the DMG can use transcription without a separate proxy. */
function startSttProxy(apiKey) {
  if (!apiKey) {
    debugLog('[STT] Not starting proxy – no DEEPGRAM_API_KEY configured');
    return;
  }
  if (sttProxyServer) {
    debugLog('[STT] Proxy already running on port', STT_PROXY_PORT);
    return;
  }

  const server = http.createServer();
  const wss = new WebSocketServer({ server });

  wss.on('connection', (clientWs, req) => {
    const rawUrl = req.url || '/v1/listen';
    const pathPart = rawUrl.split('?')[0] || '/v1/listen';
    const query = rawUrl.includes('?') ? rawUrl.slice(rawUrl.indexOf('?')) : '';
    const deepgramUrl = `${DEEPGRAM_ORIGIN}${pathPart}${query}`;

    debugLog('[STT] Client connected to proxy:', rawUrl);
    debugLog('[STT] Connecting upstream to Deepgram:', deepgramUrl);

    const WebSocket = require('ws');
    const upstream = new WebSocket(deepgramUrl, {
      headers: {
        Authorization: `Token ${apiKey}`,
      },
    });

    const pending = [];

    clientWs.on('message', (data) => {
      const size = (data && (data.length || data.byteLength || data.size)) || 0;
      debugLog('[STT] Received audio/message from renderer, bytes:', size);

      if (upstream.readyState === upstream.OPEN) {
        upstream.send(data);
      } else {
        pending.push(data);
      }
    });

    clientWs.on('error', (err) => {
      debugLog('[STT] Client WS error:', err && err.message);
    });

    clientWs.on('close', () => {
      debugLog('[STT] Client WS closed');
      try {
        upstream.send(JSON.stringify({ type: 'CloseStream' }));
      } catch (_) {}
      try {
        upstream.close();
      } catch (_) {}
    });

    upstream.on('open', () => {
      debugLog('[STT] Upstream Deepgram connection open');
      while (pending.length > 0) {
        upstream.send(pending.shift());
      }
    });

    upstream.on('message', (data) => {
      const text = Buffer.isBuffer(data) ? data.toString('utf8') : String(data);
      debugLog('[STT] Message from Deepgram:', text.slice(0, 500));
      if (clientWs.readyState === clientWs.OPEN) {
        clientWs.send(data);
      }
    });

    upstream.on('error', (err) => {
      debugLog('[STT] Deepgram upstream error:', err && err.message);
      try { clientWs.close(1011, 'Upstream error'); } catch (_) {}
    });

    upstream.on('close', (code, reason) => {
      debugLog('[STT] Deepgram upstream closed:', code, String(reason || ''));
      try { clientWs.close(); } catch (_) {}
    });
  });

  server.listen(STT_PROXY_PORT, '127.0.0.1', () => {
    debugLog('[STT] Proxy listening on ws://127.0.0.1:' + STT_PROXY_PORT);
  });

  server.on('error', (err) => {
    debugLog('[STT] Proxy server error:', err.message);
  });

  sttProxyServer = server;
}

/** Serve app bundle via app://persuaid/ (unpacked only). Packaged app uses HTTP server so DMG loads correctly. */
function registerAppProtocol() {
  protocol.registerFileProtocol(APP_PROTOCOL, (request, callback) => {
    try {
      const url = new URL(request.url);
      let pathname = decodeURIComponent(url.pathname);
      if (pathname.startsWith('/')) pathname = pathname.slice(1);
      if (!pathname) pathname = DESKTOP_ENTRY_FILE;
      let filePath = path.join(OUT_DIR, pathname);
      if (!path.extname(filePath)) {
        const htmlPath = filePath + '.html';
        if (fs.existsSync(htmlPath)) filePath = htmlPath;
        else {
          const dirIndex = path.join(filePath, 'index.html');
          filePath = fs.existsSync(dirIndex) ? dirIndex : htmlPath;
        }
      }
      const resolved = path.normalize(path.resolve(filePath));
      const outResolved = path.resolve(OUT_DIR);
      if (!resolved.startsWith(outResolved)) {
        callback({ error: -3 });
        return;
      }
      if (!fs.existsSync(resolved)) {
        callback({ error: -6 });
        return;
      }
      callback({ path: resolved });
    } catch (e) {
      callback({ error: -2 });
    }
  });
}

const preloadPath = path.join(__dirname, 'preload.js');

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      partition: 'persist:persuaid',
      preload: fs.existsSync(preloadPath) ? preloadPath : undefined,
      webSecurity: false, // Allow loading local files
    },
    title: 'Persuaid',
  });

  // Start maximized (full screen) when entering the workspace / app
  mainWindow.maximize();
  
  // DevTools: open manually if needed (Cmd+Option+I). Auto-open can show noisy "Failed to fetch" from DevTools internals.

  function loadBundle() {
    const entryFile = path.join(OUT_DIR, DESKTOP_ENTRY_FILE);
    console.log('Checking for entry file:', entryFile);
    console.log('OUT_DIR:', OUT_DIR);
    console.log('Entry file exists:', fs.existsSync(entryFile));
    
    if (!fs.existsSync(entryFile)) {
      console.error('Entry file not found:', entryFile);
      mainWindow.loadURL('data:text/html,' + encodeURIComponent(`
        <!DOCTYPE html><html><head><meta charset="utf-8"><title>Persuaid</title></head><body style="font-family:sans-serif;padding:2rem;max-width:480px;margin:0 auto;color:#333;">
        <h1>App bundle incomplete</h1>
        <p>Run <code>npm run build</code> then try again.</p>
        <p>Looking for: ${entryFile}</p>
        </body></html>
      `));
      return;
    }
    // Serve bundle over HTTP (same as DMG) so the window never gets a white screen.
    const bundleUrl = `http://127.0.0.1:${BUNDLE_SERVER_PORT}${DESKTOP_ENTRY_PATH}`;
    console.log('Serving bundle from', OUT_DIR, '→', bundleUrl);
    bundleHttpServer = createBundleServer(OUT_DIR);
    bundleHttpServer.on('error', (err) => {
      console.error('Bundle server error:', err);
    });
    const showBundleError = (msg) => {
      mainWindow.loadURL('data:text/html,' + encodeURIComponent(`
        <!DOCTYPE html><html><head><meta charset="utf-8"><title>Persuaid</title></head><body style="font-family:sans-serif;padding:2rem;max-width:480px;margin:2rem auto;color:#333;background:#0a0a0a;color:#f9fafb;">
        <h1>Could not load app</h1><p>${msg}</p><p>Try rebuilding with <code>npm run desktop:build</code>.</p>
        </body></html>
      `));
    };
    bundleHttpServer.listen(BUNDLE_SERVER_PORT, '127.0.0.1', () => {
      console.log('Bundle server listening on', bundleUrl);
      mainWindow.webContents.once('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
        console.error('Failed to load:', validatedURL, errorCode, errorDescription);
        if (validatedURL === bundleUrl || validatedURL.startsWith('http://127.0.0.1:' + BUNDLE_SERVER_PORT)) {
          showBundleError('The app bundle failed to load. (' + errorDescription + ')');
        }
      });
      mainWindow.webContents.on('did-finish-load', () => {
        console.log('Page loaded successfully');
      });
      setImmediate(() => mainWindow.loadURL(bundleUrl));
    });
    bundleHttpServer.once('error', (err) => {
      console.error('Bundle server failed to listen:', err);
      showBundleError('Could not start app server (port ' + BUNDLE_SERVER_PORT + ' in use?). ' + err.message);
    });
  }

  // In dev mode, load Next.js dev server so /api (token, suggestions) work. Run "npm run dev" in another terminal first.
  if (forceDevServer) {
    const devUrl = 'http://localhost:3000/welcome';
    console.log('Desktop dev: loading', devUrl, '(ensure npm run dev is running)');
    mainWindow.loadURL(devUrl);
    mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
      if (errorCode !== -3) console.error('Failed to load:', validatedURL, errorCode, errorDescription);
    });
    return;
  }

  // Production / bundled: serve static export from out/
  loadBundle();

  mainWindow.on('closed', () => {
    mainWindow = null;
    if (bundleHttpServer) {
      bundleHttpServer.close();
      bundleHttpServer = null;
    }
  });
}

app.whenReady().then(() => {
  try {
    fs.writeFileSync('/tmp/persuaid-ready.txt', new Date().toISOString());
  } catch (e) {
    console.error('persuaid ready write failed', e.message);
  }
  try {
    const logPath = path.join(app.getPath('userData'), 'debug.log');
    debugLogStream = fs.createWriteStream(logPath, { flags: 'a' });
    debugLogStream.write('\n--- ' + new Date().toISOString() + ' ---\n');
  } catch (_) {}
  try {
    const tmpLog = '/tmp/persuaid-debug.log';
    debugLogStreamTmp = fs.createWriteStream(tmpLog, { flags: 'a' });
    debugLogStreamTmp.write('\n--- ' + new Date().toISOString() + ' ---\n');
  } catch (_) {}
  registerAppProtocol();
  const envPath = path.join(app.getPath('userData'), '.env');
  debugLog('[STT] Reading .env from:', envPath);
  const deepgramKey = getDeepgramApiKey();
  if (deepgramKey) {
    debugLog('[STT] DEEPGRAM_API_KEY loaded: yes (length', deepgramKey.length + ')');
    startSttProxy(deepgramKey);
  } else {
    debugLog('[STT] DEEPGRAM_API_KEY loaded: no – add it to', envPath, 'and restart.');
  }
  session.defaultSession.setPermissionRequestHandler((webContents, permission, callback) => {
    const allowed = permission === 'media';
    callback(allowed);
  });
  createWindow();
});

app.on('window-all-closed', () => {
  if (bundleHttpServer) bundleHttpServer.close();
  if (sttProxyServer) {
    sttProxyServer.close();
    sttProxyServer = null;
  }
  app.quit();
});

app.on('activate', () => {
  if (mainWindow === null) createWindow();
});
