const {
  app,
  BrowserWindow,
  session,
  protocol,
  Menu,
  ipcMain,
  dialog,
  screen,
  nativeImage,
  shell,
  systemPreferences,
} = require('electron');

/**
 * Human-readable product name (menu bar, our menus, window title).
 * macOS Dock *tooltip* while running `npx electron` still shows "Electron" — that comes from
 * Electron.app's Info.plist, not from JS. Only the built Persuaid.app shows "Persuaid" in the Dock.
 */
const APP_DISPLAY_NAME = 'Persuaid';

try {
  app.setName(APP_DISPLAY_NAME);
  process.title = APP_DISPLAY_NAME;
} catch (_) {}
if (process.platform === 'darwin') {
  app.on('will-finish-launching', () => {
    try {
      app.setName(APP_DISPLAY_NAME);
    } catch (_) {}
  });
}

const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');
const http = require('http');
const https = require('https');
const { WebSocketServer } = require('ws');

const STT_PROXY_PORT = 2998;
const DEEPGRAM_ORIGIN = 'wss://api.deepgram.com';
let sttProxyServer = null;

/** Last resort: Electron sometimes surfaces listen EADDRINUSE as uncaught even with server.on('error'). */
process.on('uncaughtException', (err) => {
  const code = err && err.code;
  const port = err && err.port;
  const msg = String((err && err.message) || '');
  if (code === 'EADDRINUSE' && (port === STT_PROXY_PORT || msg.includes(String(STT_PROXY_PORT)))) {
    try {
      console.warn(
        '[STT] Port',
        STT_PROXY_PORT,
        'already in use — quit other Persuaid windows, or stop `npm run desktop:dev` / `npm run stt:proxy`. App continues; STT uses the process already listening on that port.'
      );
    } catch (_) {}
    return;
  }
});

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

/** Packaged-mac microphone / TCC diagnostics — grep logs for [MIC_DEBUG]. */
function logMicDiagnosticsAtStartup() {
  debugLog('[MIC_DEBUG] app.isPackaged:', isPackaged);
  debugLog('[MIC_DEBUG] process.execPath:', process.execPath);
  debugLog('[MIC_DEBUG] process.resourcesPath:', process.resourcesPath);
  try {
    debugLog('[MIC_DEBUG] app.getName():', app.getName());
  } catch (_) {}
  if (process.platform !== 'darwin') return;
  const infoPlist = path.join(process.resourcesPath, '..', 'Info.plist');
  const exists = fs.existsSync(infoPlist);
  debugLog('[MIC_DEBUG] Info.plist path:', infoPlist, 'exists:', exists);
  if (!exists) return;
  try {
    const bid = execSync(`/usr/libexec/PlistBuddy -c 'Print :CFBundleIdentifier' "${infoPlist}"`, {
      encoding: 'utf8',
    }).trim();
    debugLog('[MIC_DEBUG] CFBundleIdentifier:', bid);
  } catch (e) {
    debugLog('[MIC_DEBUG] CFBundleIdentifier read failed:', e && e.message);
  }
  try {
    const mic = execSync(`/usr/libexec/PlistBuddy -c 'Print :NSMicrophoneUsageDescription' "${infoPlist}"`, {
      encoding: 'utf8',
    }).trim();
    debugLog(
      '[MIC_DEBUG] NSMicrophoneUsageDescription:',
      mic ? `present (${mic.length} chars): ${mic.slice(0, 120)}${mic.length > 120 ? '…' : ''}` : 'MISSING — TCC dialog text will not work correctly'
    );
  } catch (e) {
    debugLog('[MIC_DEBUG] NSMicrophoneUsageDescription MISSING or PlistBuddy error:', e && e.message);
  }
  try {
    const ver = execSync(`/usr/libexec/PlistBuddy -c 'Print :CFBundleShortVersionString' "${infoPlist}"`, {
      encoding: 'utf8',
    }).trim();
    debugLog('[MIC_DEBUG] CFBundleShortVersionString:', ver);
  } catch (_) {}
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

/** Desktop window icon (bundled `ElectrongPP.png`; dev prefers mac master PNG, then other marks). */
function resolveAppLogoPath() {
  if (app.isPackaged) {
    const packaged = path.join(process.resourcesPath, 'ElectrongPP.png');
    if (fs.existsSync(packaged)) return packaged;
  }
  const root = path.join(__dirname, '..');
  const candidates = [
    path.join(root, 'public', 'MacIconPersuaidLogo1024x1024.png'),
    path.join(root, 'public', 'PersuaidLogo.png'),
    path.join(root, 'public', 'ElectrongPP.png'),
  ];
  for (const p of candidates) {
    if (fs.existsSync(p)) return p;
  }
  return null;
}

function getWindowIcon() {
  const logoPath = resolveAppLogoPath();
  if (!logoPath) return undefined;
  try {
    const img = nativeImage.createFromPath(logoPath);
    return img.isEmpty() ? undefined : img;
  } catch (_) {
    return undefined;
  }
}

let mainWindow;
/** Saved window bounds before shrinking to the compact call strip (macOS-style top pill). */
let preCompactBounds = null;
/** Saved bounds / maximize state before live-call HUD resize. */
let preCallHudBounds = null;
let preCallHudMaximized = false;
let callHudActive = false;
/** Call HUD: panel “open” for legacy sync handler (bounds no longer change on hide). */
let hudPanelVisible = true;
/** Fixed floating HUD size (renderer no longer syncs dynamic size). */
const HUD_FIXED_WIDTH = 460;
const HUD_FIXED_HEIGHT = 880;

/** macOS: window-level vibrancy for live-call HUD only (cleared when false). */
ipcMain.handle('persuaid-set-vibrancy', (_event, enabled) => {
  if (!mainWindow || mainWindow.isDestroyed()) return;
  if (process.platform !== 'darwin') return;
  try {
    mainWindow.setVibrancy(enabled ? 'hud' : null);
  } catch (e) {
    console.error('[persuaid-set-vibrancy]', e && e.message);
  }
});

ipcMain.handle('persuaid-window', (_event, action) => {
  if (!mainWindow || mainWindow.isDestroyed()) return;
  try {
    if (action === 'minimize') mainWindow.minimize();
    else if (action === 'close') mainWindow.close();
    else if (action === 'toggle-maximize') {
      if (mainWindow.isMaximized()) mainWindow.unmaximize();
      else mainWindow.maximize();
    }
  } catch (e) {
    console.error('[persuaid-window]', e && e.message);
  }
});

/** Open http(s)://persuaid.app/* in the system browser (pricing, marketing). Renderer must only pass allowed URLs. */
ipcMain.handle('persuaid-open-external', async (_event, url) => {
  try {
    const u = new URL(String(url));
    if (u.protocol !== 'https:' && u.protocol !== 'http:') return { ok: false, error: 'protocol' };
    const host = u.hostname.toLowerCase();
    if (host !== 'persuaid.app' && host !== 'www.persuaid.app') return { ok: false, error: 'host' };
    await shell.openExternal(u.toString());
    return { ok: true };
  } catch (e) {
    console.error('[persuaid-open-external]', e && e.message);
    return { ok: false, error: 'invalid' };
  }
});

/** macOS microphone TCC — used by in-app onboarding (user gesture), not on boot. */
ipcMain.handle('mic:get-status', () => {
  debugLog('[MIC_DEBUG] ipc mic:get-status invoked');
  if (process.platform !== 'darwin') {
    debugLog('[MIC_DEBUG] mic:get-status → non-darwin, status unknown');
    return { status: 'unknown' };
  }
  try {
    const status = systemPreferences.getMediaAccessStatus('microphone');
    debugLog('[MIC_DEBUG] mic:get-status →', status);
    return { status };
  } catch (e) {
    debugLog('[MIC_DEBUG] mic:get-status error:', e && e.message);
    return { status: 'unknown' };
  }
});

ipcMain.handle('mic:request-access', async () => {
  debugLog('[MIC_DEBUG] ipc mic:request-access invoked');
  if (process.platform !== 'darwin') return { status: 'unknown', granted: false };
  const win = mainWindow;
  if (win && !win.isDestroyed()) {
    try {
      win.show();
    } catch (_) {}
    try {
      win.focus();
    } catch (_) {}
  }
  try {
    app.focus({ steal: true });
  } catch (_) {
    try {
      app.focus();
    } catch (_) {}
  }
  const before = systemPreferences.getMediaAccessStatus('microphone');
  debugLog('[MIC_DEBUG] mic:request-access TCC before:', before);
  if (before === 'granted') {
    debugLog('[MIC_DEBUG] mic:request-access skip askForMediaAccess (already granted)');
    return { status: 'granted', granted: true };
  }
  if (before === 'denied' || before === 'restricted') {
    debugLog('[MIC_DEBUG] mic:request-access skip askForMediaAccess (before is', before + ')');
    return { status: before, granted: false };
  }
  debugLog('[MIC_DEBUG] mic:request-access calling askForMediaAccess("microphone") …');
  const granted = await systemPreferences.askForMediaAccess('microphone');
  debugLog('[MIC_DEBUG] mic:request-access askForMediaAccess returned:', granted);
  const after = systemPreferences.getMediaAccessStatus('microphone');
  debugLog('[MIC_DEBUG] mic:request-access TCC after:', after, 'granted bool:', granted);
  debugLog('[macOS] mic:request-access IPC →', after, granted);
  return { status: after, granted };
});

ipcMain.handle('mic:open-settings', async () => {
  const url = 'x-apple.systempreferences:com.apple.preference.security?Privacy_Microphone';
  try {
    await shell.openExternal(url);
    return { ok: true };
  } catch (e) {
    debugLog('[mic:open-settings]', e && e.message);
    return { ok: false };
  }
});

/**
 * Live call: shrink BrowserWindow to a compact floating HUD (pill + panel), centered.
 * Restores prior bounds (or re-maximizes) when disabled.
 */
ipcMain.handle('persuaid-call-hud', (_event, enabled) => {
  if (!mainWindow || mainWindow.isDestroyed()) return;
  try {
    if (enabled) {
      if (callHudActive) return;
      preCallHudMaximized = mainWindow.isMaximized();
      if (preCallHudMaximized) {
        mainWindow.unmaximize();
      }
      preCallHudBounds = mainWindow.getBounds();

      const { workArea } = screen.getPrimaryDisplay();
      hudPanelVisible = true;
      const hudW = Math.min(HUD_FIXED_WIDTH, workArea.width - 24);
      const hudH = Math.min(HUD_FIXED_HEIGHT, workArea.height - 24);
      const bx = workArea.x + Math.round((workArea.width - hudW) / 2);
      const by = workArea.y + Math.round((workArea.height - hudH) / 2);

      mainWindow.setBounds({ x: bx, y: by, width: hudW, height: hudH });
      try {
        mainWindow.setAlwaysOnTop(true, 'floating');
      } catch (_) {
        try {
          mainWindow.setAlwaysOnTop(true);
        } catch (_) {}
      }
      mainWindow.setResizable(false);
      try {
        mainWindow.setHasShadow(false);
      } catch (_) {}
      try {
        mainWindow.setBackgroundColor('#00000000');
      } catch (_) {}

      callHudActive = true;
    } else {
      if (!callHudActive) return;
      callHudActive = false;
      hudPanelVisible = true;

      mainWindow.setAlwaysOnTop(false);
      mainWindow.setResizable(true);
      try {
        mainWindow.setHasShadow(true);
      } catch (_) {}

      const isMac = process.platform === 'darwin';
      try {
        mainWindow.setBackgroundColor(isMac ? '#00000000' : '#000000');
      } catch (_) {}

      if (preCallHudMaximized) {
        preCallHudMaximized = false;
        preCallHudBounds = null;
        mainWindow.maximize();
      } else if (preCallHudBounds) {
        mainWindow.setBounds(preCallHudBounds);
        preCallHudBounds = null;
      } else {
        mainWindow.maximize();
      }
    }
  } catch (e) {
    console.error('[persuaid-call-hud]', e && e.message);
  }
});

ipcMain.handle('persuaid-call-hud-panel', (_event, open) => {
  if (!mainWindow || mainWindow.isDestroyed() || !callHudActive) return;
  try {
    hudPanelVisible = !!open;
    /* Window size stays fixed; renderer only toggles visibility. */
  } catch (e) {
    console.error('[persuaid-call-hud-panel]', e && e.message);
  }
});

ipcMain.handle('persuaid-call-hud-sync-size', (_event, size) => {
  if (!mainWindow || mainWindow.isDestroyed() || !callHudActive) return;
  try {
    const h = Number(size && size.height);
    if (!Number.isFinite(h) || h < 1) return;
    const { workArea } = screen.getPrimaryDisplay();
    const b = mainWindow.getBounds();
    const maxH = Math.max(160, workArea.height - 24);
    const nextH = Math.round(Math.min(Math.max(h, 72), maxH));
    /* Top edge fixed so the pill stays put; blur/vibrancy window matches content height. */
    mainWindow.setBounds({ x: b.x, y: b.y, width: b.width, height: nextH });
  } catch (e) {
    console.error('[persuaid-call-hud-sync-size]', e && e.message);
  }
});

ipcMain.handle('call-compact-layout', (_event, compact) => {
  if (!mainWindow || mainWindow.isDestroyed()) return;
  try {
    if (compact) {
      if (!preCompactBounds) {
        preCompactBounds = mainWindow.getBounds();
      }
      const { workArea } = screen.getPrimaryDisplay();
      // macOS title bar + webview needs ~90px+; 56px was too short and clipped the pill to a sliver.
      const barH = 120;
      const barW = Math.min(420, Math.max(280, workArea.width - 48));
      const bx = workArea.x + Math.round((workArea.width - barW) / 2);
      const by = workArea.y;
      mainWindow.setBounds({ x: bx, y: by, width: barW, height: barH });
      mainWindow.setAlwaysOnTop(true, 'floating');
      mainWindow.setResizable(false);
      // Apple-like dark gray (not pure black) behind the web frosted layer.
      try {
        mainWindow.setBackgroundColor('#2c2c2e');
      } catch (_) {}
    } else {
      mainWindow.setAlwaysOnTop(false);
      mainWindow.setResizable(true);
      try {
        mainWindow.setBackgroundColor('#000000');
      } catch (_) {}
      if (preCompactBounds) {
        mainWindow.setBounds(preCompactBounds);
        preCompactBounds = null;
      } else {
        mainWindow.maximize();
      }
    }
  } catch (e) {
    console.error('[call-compact-layout]', e && e.message);
  }
});

// Desktop entry: welcome first (handles auth check with timeout), then sign-in → dashboard.
const DESKTOP_ENTRY_PATH = '/welcome';
const DESKTOP_ENTRY_FILE = 'welcome.html';

const OPENAI_URL = 'https://api.openai.com/v1/chat/completions';

function buildConversation(transcript) {
  return transcript
    .map((m) => `${m.speaker === 'prospect' ? 'Prospect' : 'Rep'}: ${m.text}`)
    .join('\n');
}

function getLastExchange(transcript, n = 16) {
  const last = transcript.slice(-n);
  return last
    .map((m) => `${m.speaker === 'prospect' ? 'Prospect' : 'Rep'}: ${m.text}`)
    .join('\n');
}

/** Matches lib/ai-moment-context.ts — live clock for "what time is it" / calendar questions. */
function buildAiMomentContextBlock(timeZone) {
  let tz = typeof timeZone === 'string' && timeZone.trim().length > 0 ? timeZone.trim() : 'UTC';
  try {
    new Intl.DateTimeFormat(undefined, { timeZone: tz });
  } catch (_) {
    tz = 'UTC';
  }
  const now = new Date();
  const localFull = new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
    timeZoneName: 'short',
  }).format(now);
  const calendarDate = new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(now);
  return (
    'Real-time clock (authoritative for: what time it is, what day/date/today/tomorrow is, calendar scheduling, or how long until a specific date):\n' +
    `- Rep's local time (${tz}): ${localFull}\n` +
    `- Calendar date in that timezone: ${calendarDate}\n` +
    `- Same instant in UTC (ISO 8601): ${now.toISOString()}\n` +
    "When the rep or prospect asks about time or dates, use the lines above. Answer in the rep's local sense unless they explicitly ask for another timezone."
  );
}

/** In-app handler for POST /api/ai/follow-up: mode=answer (Enter) or mode=follow_up_question (button). */
function handleFollowUpApi(body, res) {
  console.log('[AI] /api/ai/follow-up called');
  const key = getOpenAiApiKey();
  if (!key) {
    debugLog('[AI] follow-up: no OPENAI_API_KEY');
    res.writeHead(503, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'OPENAI_API_KEY is not configured. Add it to ~/Library/Application Support/Persuaid/.env' }));
    return;
  }
  let parsed;
  try {
    parsed = JSON.parse(body);
  } catch {
    debugLog('[AI] follow-up: invalid JSON body');
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Invalid JSON body' }));
    return;
  }
  const transcript = parsed.transcript ?? [];
  const scriptContext = parsed.scriptContext ?? '';
  const notesContext = (parsed.notesContext ?? '').trim();
  const dealContext = parsed.dealContext ?? {};
  const mode = parsed.mode === 'follow_up_question' ? 'follow_up_question' : 'answer';
  const momentBlock = buildAiMomentContextBlock(parsed.timeZone);
  const conversation = buildConversation(transcript);
  if (!conversation.trim()) {
    debugLog('[AI] follow-up: empty transcript → short prompt (mode=' + mode + ', messages=' + transcript.length + ')');
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ text: 'Say something so I can suggest what to say next.' }));
    return;
  }
  debugLog('[AI] follow-up: calling OpenAI (mode=' + mode + ', transcriptMessages=' + transcript.length + ')');
  const lastExchange = getLastExchange(transcript);
  const lastExchangeWide = getLastExchange(transcript, 40);
  const lastProspectMessage = (transcript.filter((m) => m.speaker === 'prospect').slice(-1)[0]?.text ?? '').trim();
  const baseSystemPrompt = `You are Persuaid: an accurate, natural AI assistant that answers clearly and conversationally, using product knowledge when it is relevant.

**Default style:** Sound like a helpful ChatGPT-style reply—warm, direct, human. Usually **3–5 sentences** in a short paragraph. Plain text only: no markdown headings, no bullet lists unless the user explicitly wants them, no forced closing question at the end.

**When to use product knowledge:** If the conversation is about **this company's products, pricing, policies, coverage, features, or other business-specific details**, ground your answer in the **provided product knowledge** (notes in the request). Integrate facts naturally; do not sound robotic.

**Safeguards (product-specific facts):**
- If pricing, tiers, limits, or policy numbers **appear in the product knowledge**, state them clearly and completely—including **every** tier or option the notes document. Never invent or guess figures.
- If the question needs those specifics but the notes **do not** contain them, say that naturally (e.g. they should confirm with official materials or their carrier)—**do not** make numbers up.
- For **general** questions, answer with normal general knowledge. If the notes touch the same topic, stay consistent with them and do not contradict them.

**Hypothetical math:** If the conversation states amounts, rates, or time horizons and asks for a projection, you may compute **from those stated inputs only**—do not add product catalog prices unless they are in the product knowledge.

**Anti-echo:** Do not merely repeat the last line of the conversation; add real substance.

Do not label or announce "product knowledge" in your answer—just use it when relevant.`;

  const systemPrompt = mode === 'follow_up_question'
    ? `${baseSystemPrompt}

You are currently in FOLLOW-UP QUESTION mode.

Your goal is to output ONE natural follow-up question the user can ask the other person—something that moves the conversation forward (e.g. clarifying needs, next step, or context).

Rules specific to this mode:
- Output ONLY one conversational question.
- Base it on the last thing the other person said and the conversation so far.
- Do not answer their question directly; output only the question.
- Plain text only: no bullet points, headings, markdown, explanations, or multiple questions.`
    : `${baseSystemPrompt}

You are currently in ANSWER mode.

Answer the latest question or topic naturally. Use the **provided product knowledge** when the question is about this business's products, pricing, policies, coverage, features, or other company-specific facts; otherwise answer like normal ChatGPT with general knowledge.

Rules specific to this mode:
- Lead with a direct answer when they asked something concrete. Avoid long filler openers.
- If their last message is long, use the full conversation to interpret it; focus on what they are actually asking at the end.
- If the transcript is too garbled to interpret, ask one short, polite clarifying question instead of guessing.
- **Length:** usually **3–5 sentences**; you may use a few more only when the product knowledge requires listing every documented tier or option.
- Follow the **Safeguards** in the base instructions for numbers and policy details.
- Do not output bullet points, headings, markdown, meta-commentary, or sales-coaching framing.`;
  const systemPromptWithMoment = `${systemPrompt}\n\n${momentBlock}`;
  const CONVERSATION_MAX_CHARS = 14000;
  const fullConversation = conversation.length > CONVERSATION_MAX_CHARS ? conversation.slice(-CONVERSATION_MAX_CHARS) : conversation;
  const parts = [
    `Full conversation (read all of it for context; for long messages, focus on what they are asking at the end):\n${fullConversation}`,
  ];
  if (lastProspectMessage) {
    parts.push(`Other person's last message—may be long; use the full conversation to interpret; focus on the ending / main ask:\n"${lastProspectMessage}"`);
  }
  parts.push(`Most recent exchange:\n${lastExchange}`);
  if (scriptContext) parts.push(`Script / talking points (context only):\n${scriptContext.slice(0, 400)}`);
  if (notesContext) {
    parts.push(`Product knowledge (use for this company's products, pricing, policies, coverage, features, and other business-specific facts):\n${notesContext.slice(0, 1200)}`);
  }
  const dealContextEntries = Object.entries(dealContext).filter(([, v]) => typeof v === 'string' && v.trim());
  if (dealContextEntries.length > 0) {
    const dealSummary = dealContextEntries.map(([k, v]) => `${k.replace(/_/g, ' ')}: ${v}`).join('. ');
    parts.push(`Deal context (what we know so far about this conversation): ${dealSummary}`);
    parts.push('Use the deal context when it helps make the reply more relevant (company, timeline, current setup, pain, or decision maker).');
  }
  const pricingOrRangeCue =
    /cost|pricing|price|premium|premiums|fee|fees|how much|tier|tiers|plan\b|plans|package|packages|option|options|range|deductible|deductibles|coverage level|cheapest|affordable|expensive|monthly cost|annual cost|payment option/i.test(
      lastExchangeWide
    );
  if (mode === 'answer' && pricingOrRangeCue) {
    parts.push(
      notesContext
        ? 'The conversation mentions cost, pricing, or ranges. Use figures only from the product knowledge above; list every documented tier or option. If figures are not in the knowledge, say that naturally—do not invent.'
        : 'The conversation mentions cost, pricing, or ranges but no product knowledge was supplied—defer to official materials; do not invent numbers.'
    );
  }
  if (mode === 'follow_up_question') {
    parts.push(
      'Silently use the conversation to pick one strong follow-up question (do not describe your reasoning in the output).'
    );
    parts.push('What is one good follow-up question to ask next? Reply with only that question.');
  } else {
    parts.push(
      'Answer naturally and clearly. Use the product knowledge above only when the question is about this business\'s products, pricing, policies, coverage, features, or other company-specific facts; otherwise answer like a normal helpful assistant. Reply with only your answer—plain text, no preamble.'
    );
  }
  const userPrompt = parts.join('\n\n');
  const maxTokens = mode === 'follow_up_question' ? 120 : pricingOrRangeCue ? 520 : 420;
  const payload = JSON.stringify({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: systemPromptWithMoment },
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
        debugLog('[AI] follow-up: OpenAI HTTP', outRes.statusCode, String(chunks || '').slice(0, 400));
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
        debugLog('[AI] follow-up: OK, replyChars=' + (text || fallback).length);
        res.end(JSON.stringify({ text: text || fallback }));
      } catch (e) {
        debugLog('[AI] follow-up: parse error', e && e.message);
        res.writeHead(502);
        res.end(JSON.stringify({ error: 'AI follow-up failed' }));
      }
    });
  });
  outReq.on('error', (e) => {
    console.error('OpenAI request error:', e);
    debugLog('[AI] follow-up: network error', e && e.message);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'AI follow-up failed' }));
  });
  outReq.write(payload, 'utf8');
  outReq.end();
}

/** In-app handler for POST /api/ai/rewrite-notes (Improve notes for sales). */
function handleRewriteNotesApi(body, res) {
  console.log('[AI] /api/ai/rewrite-notes called');
  const key = getOpenAiApiKey();
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
  const systemPrompt = `You are rewriting product notes for a real-time AI sales assistant that answers live during sales calls.

Rewrite the notes into plain text only. Do not use headings, subtitles, markdown, numbered sections, bullet symbols or list markers (no leading "- ", "•", or "*"), presentation styling, or labeled blocks like "Core Value", "Pricing", "Objection Handling", or any "organized notes" style formatting.

The output must be optimized for fast retrieval during live conversations—not for human reading aesthetics. Reorganize implicitly: put the most practical, directly answerable sales information first, in this priority order:
1) What the product is
2) What value it delivers
3) Main product types / options
4) Typical pricing, ranges, and coverage numbers—if they exist in the source, preserve them clearly and place them early; if multiple pricing tiers exist, keep all of them
5) Objection handling—rewrite into short natural rebuttals as direct sentences
6) Technical insurance or product jargon last, compressed so it does not overshadow core sales answers (e.g. terms like "net single premium" should not dominate unless the source is specifically about that)

Use natural, direct, spoken-style phrasing the assistant can quote on a call. Keep all important facts from the source; do not invent anything. Avoid long technical explanations unless they are necessary for accuracy. Prefer flowing sentences; you may use blank lines between short paragraphs only for breathing room, not as fake sections.

Output rules: no preamble, no "here is the rewritten version", no intro or wrapping commentary—output only the rewritten notes.`;
  const userPrompt = `Rewrite these notes for the live AI assistant:\n\n${content.slice(0, 4000)}`;
  const payload = JSON.stringify({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    max_tokens: 2000,
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
  const key = getOpenAiApiKey();
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
  const key = getOpenAiApiKey();
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
  const key = getOpenAiApiKey();
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
  const notesContext = (parsed.notesContext ?? '').trim();
  if (!text) {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Missing or empty text' }));
    return;
  }
  const momentBlock = buildAiMomentContextBlock(parsed.timeZone);
  const systemPrompt = [
    'You are Persuaid: an accurate, natural AI assistant that answers clearly and conversationally, using product knowledge when it is relevant.',
    'Default: answer like ChatGPT—warm, direct, human; usually 3–5 sentences in plain text; no markdown headings, no bullet lists unless asked, no forced closing question.',
    'Use the product knowledge block only when the user\'s question is about this company\'s products, pricing, policies, coverage, features, or other business-specific details. For general questions, answer with normal general knowledge.',
    'Safeguards: If pricing, tiers, limits, or policy numbers appear in the product knowledge, state them clearly and include every documented tier or option. Never invent figures. If those specifics are needed but missing from the knowledge, say that naturally—do not guess.',
    'Do not echo the question as your entire answer; add substance. Do not announce that you are using product knowledge—integrate facts naturally without labeling.',
    momentBlock,
  ].join('\n\n');
  const knowledgeBlock = notesContext
    ? `\n\nProduct knowledge (for company-specific facts when relevant):\n${notesContext.slice(0, 4000)}`
    : '\n\n(No product knowledge was provided.)';
  const userPrompt = `Answer this naturally and clearly. Use the product knowledge only if it is relevant to what they are asking.\n\nTheir message:\n"${text}"${knowledgeBlock}\n\nReply with only your answer—plain text.`;
  console.log('[AI] sending request to OpenAI (answer)');
  const payload = JSON.stringify({
    model: 'gpt-4o-mini',
    messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: userPrompt }],
    max_tokens: 500,
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
  const key = getOpenAiApiKey();
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

/** Same idea as getDeepgramApiKey: dotenv at startup can miss keys; read userData/.env directly as fallback. */
function getOpenAiApiKey() {
  if (process.env.OPENAI_API_KEY) return process.env.OPENAI_API_KEY.trim();
  try {
    const userDataDir = app.getPath('userData');
    const envPath = path.join(userDataDir, '.env');
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf8');
      const m = content.match(/OPENAI_API_KEY\s*=\s*([^\r\n]+)/);
      if (m) return m[1].trim().replace(/^["']|["']$/g, '');
    }
  } catch (e) {
    console.warn('Could not read OPENAI_API_KEY from .env:', e.message);
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

  // Attach before WebSocketServer and before listen so EADDRINUSE is always handled (avoids main-process crash dialog).
  server.on('error', (err) => {
    debugLog('[STT] Proxy server error:', err && err.message);
    if (err && err.code === 'EADDRINUSE') {
      debugLog(
        '[STT] Port',
        STT_PROXY_PORT,
        'already in use — another Persuaid, `desktop:dev`, or `stt:proxy`. Not starting a second proxy; existing listener on 2998 will be used.'
      );
    }
    try {
      server.close();
    } catch (_) {}
    if (sttProxyServer === server) sttProxyServer = null;
  });

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
    sttProxyServer = server;
    debugLog('[STT] Proxy listening on ws://127.0.0.1:' + STT_PROXY_PORT);
  });
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

/** Menu + optional auto-open so you can inspect renderer errors (Console) when debugging Start Call, STT, etc. */
function setupInspectorSupport(win) {
  if (process.env.ELECTRON_OPEN_DEVTOOLS === '1') {
    win.webContents.once('did-finish-load', () => {
      try {
        win.webContents.openDevTools({ mode: 'detach' });
      } catch (_) {}
    });
  }
  const showDevMenu =
    !app.isPackaged ||
    process.env.DESKTOP_DEV === '1' ||
    process.env.ELECTRON_OPEN_DEVTOOLS === '1';

  const isMac = process.platform === 'darwin';

  // macOS: always install an app menu labeled "Persuaid". If we skip this (e.g. packaged + no dev flags),
  // Electron's default menu keeps the name "Electron" in the menu bar.
  if (isMac) {
    const template = [];
    template.push({
      label: APP_DISPLAY_NAME,
      submenu: [
        { role: 'about' },
        { type: 'separator' },
        { role: 'services' },
        { type: 'separator' },
        { role: 'hide' },
        { role: 'hideOthers' },
        { role: 'unhide' },
        { type: 'separator' },
        { role: 'quit' },
      ],
    });
    if (showDevMenu) {
      template.push({
        label: 'Edit',
        submenu: [
          { role: 'undo' },
          { role: 'redo' },
          { type: 'separator' },
          { role: 'cut' },
          { role: 'copy' },
          { role: 'paste' },
          { role: 'pasteAndMatchStyle' },
          { role: 'delete' },
          { role: 'selectAll' },
        ],
      });
      template.push({
        label: 'View',
        submenu: [
          { role: 'reload' },
          { type: 'separator' },
          {
            label: 'Toggle Developer Tools',
            role: 'toggleDevTools',
            accelerator: 'Alt+Command+I',
          },
        ],
      });
    }
    Menu.setApplicationMenu(Menu.buildFromTemplate(template));
    return;
  }

  if (!showDevMenu) return;
  Menu.setApplicationMenu(
    Menu.buildFromTemplate([
      {
        label: 'File',
        submenu: [{ role: 'quit' }],
      },
      {
        label: 'Edit',
        submenu: [
          { role: 'undo' },
          { role: 'redo' },
          { type: 'separator' },
          { role: 'cut' },
          { role: 'copy' },
          { role: 'paste' },
          { role: 'pasteAndMatchStyle' },
          { role: 'delete' },
          { role: 'selectAll' },
        ],
      },
      {
        label: 'View',
        submenu: [
          { role: 'reload' },
          { type: 'separator' },
          {
            label: 'Toggle Developer Tools',
            role: 'toggleDevTools',
            accelerator: 'Ctrl+Shift+I',
          },
        ],
      },
    ])
  );
}

/** Packaged macOS app launched from the DMG volume: permissions are unreliable — force copy to /Applications. */
function enforceApplicationsInstallOnMac() {
  if (process.platform !== 'darwin' || !app.isPackaged) return true;
  const execPath = process.execPath || '';
  if (!execPath.startsWith('/Volumes/')) return true;
  try {
    dialog.showErrorBox(
      'Move Persuaid to Applications',
      'Open Persuaid from Applications for microphone access and reliable updates.\n\nQuit, drag Persuaid from the disk image into your Applications folder, then launch it from there.'
    );
  } catch (_) {}
  return false;
}

function createWindow() {
  const isMac = process.platform === 'darwin';
  /** Frameless + transparent on macOS so the app can look like a floating glass HUD (no native title bar). */
  const framelessMac = isMac;
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    frame: !framelessMac,
    transparent: framelessMac,
    backgroundColor: framelessMac ? '#00000000' : '#000000',
    icon: getWindowIcon(),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      partition: 'persist:persuaid',
      preload: fs.existsSync(preloadPath) ? preloadPath : undefined,
      webSecurity: false, // Allow loading local files
      // Helps Web Audio / mic capture when DevTools is open or window is in the background.
      backgroundThrottling: false,
    },
    title: 'Persuaid',
  });

  if (framelessMac) {
    try {
      mainWindow.setBackgroundColor('#00000000');
    } catch (_) {}
  }

  // Start maximized (full screen) when entering the workspace / app
  mainWindow.maximize();

  setupInspectorSupport(mainWindow);

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
    const devPort = (process.env.NEXT_DEV_PORT || process.env.PORT || '3000').replace(/^:/, '').trim() || '3000';
    // Use localhost (not 127.0.0.1): Next dev treats them as different origins; 127.0.0.1 triggers
    // "Cross origin request … to /_next/*" and can break HMR/chunks in a future Next major.
    const devUrl = `http://localhost:${devPort}/welcome`;
    console.log('Desktop dev: loading', devUrl, '(set NEXT_DEV_PORT if Next is not on this port)');
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

app.whenReady().then(async () => {
  if (!enforceApplicationsInstallOnMac()) {
    app.quit();
    return;
  }
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
  logMicDiagnosticsAtStartup();
  registerAppProtocol();
  const envPath = path.join(app.getPath('userData'), '.env');
  if (fs.existsSync(envPath)) {
    require('dotenv').config({ path: envPath, override: true });
  }
  debugLog('[STT] Reading .env from:', envPath);
  const openAiKey = getOpenAiApiKey();
  debugLog('[AI] OPENAI_API_KEY:', openAiKey ? 'yes (length ' + openAiKey.length + ')' : 'no — add OPENAI_API_KEY to', envPath);
  const deepgramKey = getDeepgramApiKey();
  if (deepgramKey) {
    debugLog('[STT] DEEPGRAM_API_KEY loaded: yes (length', deepgramKey.length + ')');
    startSttProxy(deepgramKey);
  } else {
    debugLog('[STT] DEEPGRAM_API_KEY loaded: no – add it to', envPath, 'and restart.');
  }
  // macOS: never blindly callback(true) for "media". That skips TCC — Persuaid never appears under
  // System Settings → Microphone and getUserMedia can fail or see silence. Route through askForMediaAccess.
  session.defaultSession.setPermissionRequestHandler((webContents, permission, callback, details) => {
    const reqTypes = details && details.requestedMediaTypes;
    const mediaTypes = details && details.mediaTypes;
    debugLog(
      '[MIC_DEBUG] setPermissionRequestHandler fired permission=',
      permission,
      'details.mediaTypes=',
      mediaTypes,
      'details.requestedMediaTypes=',
      reqTypes,
      'securityOrigin=',
      details && details.securityOrigin,
      'requestingUrl=',
      details && details.requestingUrl
    );
    try {
      debugLog(
        '[MIC_DEBUG] setPermissionRequestHandler details JSON:',
        details != null ? JSON.stringify(details) : '(no details)'
      );
    } catch (e) {
      debugLog('[MIC_DEBUG] setPermissionRequestHandler details (stringify failed):', e && e.message);
    }

    if (permission === 'unknown') {
      debugLog(
        '[MIC_DEBUG] WARNING permission=unknown — Electron will not run media TCC path; callback(false). Check Chromium/Electron version if this appears with getUserMedia.'
      );
    }
    if (permission !== 'media') {
      debugLog(
        '[MIC_DEBUG] non-media permission → callback(false). If getUserMedia never runs with permission "media", askForMediaAccess may never run via this path.'
      );
      callback(false);
      return;
    }
    if (process.platform !== 'darwin') {
      debugLog('[MIC_DEBUG] media permission non-darwin → callback(true)');
      callback(true);
      return;
    }
    const types =
      details && Array.isArray(details.mediaTypes) && details.mediaTypes.length > 0
        ? details.mediaTypes
        : ['audio'];
    (async () => {
      try {
        let granted = true;
        if (types.includes('audio')) {
          debugLog('[MIC_DEBUG] Chromium media handler: calling askForMediaAccess("microphone") for audio');
          const m = await systemPreferences.askForMediaAccess('microphone');
          debugLog('[MIC_DEBUG] Chromium media handler: askForMediaAccess(mic) returned', m);
          granted = granted && m;
        }
        if (types.includes('video')) {
          debugLog('[MIC_DEBUG] Chromium media handler: calling askForMediaAccess("camera") for video');
          const v = await systemPreferences.askForMediaAccess('camera');
          granted = granted && v;
        }
        debugLog(
          '[MIC_DEBUG] Chromium media handler final granted=',
          granted,
          '→ callback(' + granted + ')'
        );
        debugLog('[macOS] Chromium media permission → TCC:', types.join(',') || 'audio', '→', granted ? 'granted' : 'denied');
        callback(granted);
      } catch (e) {
        debugLog('[MIC_DEBUG] Chromium media handler error → callback(false):', e && e.message);
        debugLog('[macOS] media permission handler error:', e && e.message);
        callback(false);
      }
    })();
  });
  // macOS: do not override the Dock icon when packaged — `app.dock.setIcon(PNG)` draws a flat
  // square and ignores the bundle’s AppIcon.icns squircle treatment. Unpackaged dev: prefer .icns.
  if (process.platform === 'darwin' && app.dock && !app.isPackaged) {
    const icnsPath = path.join(__dirname, '..', 'build', 'icon.icns');
    const dockPath = fs.existsSync(icnsPath) ? icnsPath : resolveAppLogoPath();
    if (dockPath) {
      try {
        app.dock.setIcon(dockPath);
      } catch (_) {}
    }
  }
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
