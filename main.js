const { app, BrowserWindow, Tray, Menu, ipcMain, nativeImage, screen } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');
const { execFile } = require('child_process');

const APP_SLUG = 'work-faster-work';
app.setName(APP_SLUG);

// ── Agent types ──────────────────────────────────────────────────────────────
const AGENT = {
  CODEX_APP:      'codex-app',      // OpenAI Codex desktop app
  CURSOR_APP:     'cursor-app',     // Cursor editor
  WINDSURF_APP:   'windsurf-app',   // Windsurf editor (Codeium)
  TRAE_APP:       'trae-app',       // Trae IDE (ByteDance)
  CLAUDE_CLI:     'claude-cli',     // Claude Code CLI
  CODEX_CLI:      'codex-cli',      // OpenAI Codex CLI
  COPILOT_CLI:    'copilot-cli',    // GitHub Copilot CLI (gh copilot)
  AIDER_CLI:      'aider-cli',      // Aider
  GEMINI_CLI:     'gemini-cli',     // Google Gemini CLI
  QWEN_CLI:       'qwen-cli',       // Qwen Code / 通义灵码 CLI
  OPEN_CLAW_CLI:  'open-claw-cli',  // Open Claw CLI [untested]
  ANTIGRAVITY_CLI:'antigravity-cli',// Antigravity CLI [untested]
  QODER_CLI:      'qoder-cli',      // Qoder CLI [untested]
  COPAW_CLI:      'copaw-cli',      // Copaw CLI [untested]
  GENERIC:        'generic',        // fallback
};

// macOS bundle IDs for known agent desktop apps
const BUNDLE_AGENTS = new Map([
  ['com.openai.codex',              AGENT.CODEX_APP],
  ['com.todesktop.230313mzl4w4u92', AGENT.CURSOR_APP],  // Cursor
  ['com.codeium.windsurf',          AGENT.WINDSURF_APP],
  // Trae (ByteDance AI IDE) – both observed bundle ID variants
  ['com.bytedance.trae',            AGENT.TRAE_APP],
  ['ai.trae.Trae',                  AGENT.TRAE_APP],
]);

// macOS: known terminal emulator bundle IDs (used for CLI detection)
const APPLE_TERMINAL_BUNDLE_ID = 'com.apple.Terminal';
const KNOWN_TERMINAL_BUNDLE_IDS = new Set([
  APPLE_TERMINAL_BUNDLE_ID,
  'com.googlecode.iterm2',
  'com.github.wez.wezterm',
  'com.mitchellh.ghostty',
  'dev.warp.Warp-Stable',
  'co.zeit.hyper',
]);

// CLI agent process patterns – matched against process command lines
const CLI_AGENT_PATTERNS = [
  { regex: /(^|[/ ])claude(\s|$)/i,                     type: AGENT.CLAUDE_CLI },
  { regex: /(^|[/ ])codex(\s|$)/i,                      type: AGENT.CODEX_CLI },
  { regex: /gh\s+copilot/i,                              type: AGENT.COPILOT_CLI },
  { regex: /(^|[/ ])aider(\s|$)/i,                      type: AGENT.AIDER_CLI },
  { regex: /(^|[/ ])gemini(\s|$)/i,                     type: AGENT.GEMINI_CLI },
  // Qwen Code / 通义灵码 CLI – supports qwen, qwen-code, qwen-coder, tongyi
  { regex: /(^|[/ ])(qwen(-code|-coder)?|tongyi)(\s|$)/i, type: AGENT.QWEN_CLI },
  // Trae CLI (when launched from terminal)
  { regex: /(^|[/ ])trae(\s|$)/i,                       type: AGENT.TRAE_APP },
  // Untested agents – best-effort process name matching
  { regex: /(^|[/ ])(open-?claw|openclaw)(\s|$)/i,     type: AGENT.OPEN_CLAW_CLI },
  { regex: /(^|[/ ])antigravity(\s|$)/i,                type: AGENT.ANTIGRAVITY_CLI },
  { regex: /(^|[/ ])qoder(\s|$)/i,                      type: AGENT.QODER_CLI },
  { regex: /(^|[/ ])copaw(\s|$)/i,                      type: AGENT.COPAW_CLI },
];

// ── Win32 FFI (Windows only) ────────────────────────────────────────────────
let keybd_event, VkKeyScanA;
if (process.platform === 'win32') {
  try {
    const koffi = require('koffi');
    const user32 = koffi.load('user32.dll');
    keybd_event = user32.func('void __stdcall keybd_event(uint8_t bVk, uint8_t bScan, uint32_t dwFlags, uintptr_t dwExtraInfo)');
    VkKeyScanA = user32.func('int16_t __stdcall VkKeyScanA(int ch)');
  } catch (e) {
    console.warn('koffi not available – macro sending disabled', e.message);
  }
}

// ── Globals ─────────────────────────────────────────────────────────────────
let tray, overlay;
let overlayReady = false;
let spawnQueued = false;

const VK_CONTROL = 0x11;
const VK_RETURN  = 0x0D;
const VK_C       = 0x43;
const VK_MENU    = 0x12; // Alt
const VK_TAB     = 0x09;
const KEYUP      = 0x0002;

/** One Alt+Tab / Cmd+Tab so focus returns to the previously active app after tray click. */
function refocusPreviousApp() {
  const delayMs = 80;
  const run = () => {
    if (process.platform === 'win32') {
      if (!keybd_event) return;
      keybd_event(VK_MENU, 0, 0, 0);
      keybd_event(VK_TAB, 0, 0, 0);
      keybd_event(VK_TAB, 0, KEYUP, 0);
      keybd_event(VK_MENU, 0, KEYUP, 0);
    } else if (process.platform === 'darwin') {
      execFile('osascript', ['-e', [
        'tell application "System Events"',
        '  key down command',
        '  key code 48', // Tab
        '  key up command',
        'end tell',
      ].join('\n')], err => {
        if (err) console.warn('refocus previous app (Cmd+Tab) failed:', err.message);
      });
    } else if (process.platform === 'linux') {
      execFile('xdotool', ['key', 'alt+Tab'], err => {
        if (err) console.warn('refocus previous app (alt+Tab) failed – is xdotool installed?:', err.message);
      });
    }
  };
  setTimeout(run, delayMs);
}

function createTrayIconFallback() {
  const p = path.join(__dirname, 'icon', 'Template.png');
  if (fs.existsSync(p)) {
    const img = nativeImage.createFromPath(p);
    if (!img.isEmpty()) {
      if (process.platform === 'darwin') img.setTemplateImage(true);
      return img;
    }
  }
  console.warn(`${APP_SLUG}: icon/Template.png missing or invalid`);
  return nativeImage.createEmpty();
}

async function tryIcnsTrayImage(icnsPath) {
  const size = { width: 64, height: 64 };
  const thumb = await nativeImage.createThumbnailFromPath(icnsPath, size);
  if (!thumb.isEmpty()) return thumb;
  return null;
}

// macOS: createFromPath does not decode .icns (Electron only loads PNG/JPEG there, ICO on Windows).
// Quick Look thumbnails handle .icns; copy to temp if the file is inside ASAR (QL needs a real path).
async function getTrayIcon() {
  const iconDir = path.join(__dirname, 'icon');
  if (process.platform === 'win32') {
    const file = path.join(iconDir, 'icon.ico');
    if (fs.existsSync(file)) {
      const img = nativeImage.createFromPath(file);
      if (!img.isEmpty()) return img;
    }
    return createTrayIconFallback();
  }
  if (process.platform === 'darwin') {
    const file = path.join(iconDir, 'AppIcon.icns');
    if (fs.existsSync(file)) {
      const fromPath = nativeImage.createFromPath(file);
      if (!fromPath.isEmpty()) return fromPath;
      try {
        const t = await tryIcnsTrayImage(file);
        if (t) return t;
      } catch (e) {
        console.warn('AppIcon.icns Quick Look thumbnail failed:', e?.message || e);
      }
      const tmp = path.join(os.tmpdir(), `${APP_SLUG}-tray.icns`);
      try {
        fs.copyFileSync(file, tmp);
        const t = await tryIcnsTrayImage(tmp);
        if (t) return t;
      } catch (e) {
        console.warn('AppIcon.icns temp copy + thumbnail failed:', e?.message || e);
      }
    }
    return createTrayIconFallback();
  }
  // Linux and other platforms: use Template.png
  return createTrayIconFallback();
}

// ── Overlay window ──────────────────────────────────────────────────────────
function createOverlay() {
  const { bounds } = screen.getPrimaryDisplay();
  overlay = new BrowserWindow({
    x: bounds.x, y: bounds.y,
    width: bounds.width, height: bounds.height,
    transparent: true,
    frame: false,
    alwaysOnTop: true,
    focusable: false,
    skipTaskbar: true,
    resizable: false,
    hasShadow: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    },
  });
  overlay.setAlwaysOnTop(true, 'screen-saver');
  overlayReady = false;
  overlay.loadFile('overlay.html');
  overlay.webContents.on('did-finish-load', () => {
    overlayReady = true;
    if (spawnQueued && overlay && overlay.isVisible()) {
      spawnQueued = false;
      overlay.webContents.send('spawn-whip');
      refocusPreviousApp();
    }
  });
  overlay.on('closed', () => {
    overlay = null;
    overlayReady = false;
    spawnQueued = false;
  });
}

function toggleOverlay() {
  if (overlay && overlay.isVisible()) {
    overlay.webContents.send('drop-whip');
    return;
  }
  if (!overlay) createOverlay();
  overlay.show();
  if (overlayReady) {
    overlay.webContents.send('spawn-whip');
    refocusPreviousApp();
  } else {
    spawnQueued = true;
  }
}

// ── IPC ─────────────────────────────────────────────────────────────────────
/**
 * Returns true only when the IPC event originated from the trusted overlay
 * BrowserWindow. Prevents malicious / unrelated renderer processes from
 * issuing whip-crack or hide-overlay commands.
 */
function isTrustedOverlaySender(event) {
  if (!overlay || overlay.isDestroyed()) return false;
  const contents = overlay.webContents;
  return !!contents && !contents.isDestroyed() && event.sender === contents;
}

function guardOverlayEvent(event, channel) {
  if (isTrustedOverlaySender(event)) return true;
  console.warn(`Ignoring ${channel} from unexpected renderer`);
  return false;
}

ipcMain.on('whip-crack', event => {
  if (!guardOverlayEvent(event, 'whip-crack')) return;
  try {
    sendMacro();
  } catch (err) {
    console.warn('sendMacro failed:', err?.message || err);
  }
});
ipcMain.on('hide-overlay', event => {
  if (!guardOverlayEvent(event, 'hide-overlay')) return;
  if (overlay) overlay.hide();
});

// ── Phrases ──────────────────────────────────────────────────────────────────
const DEFAULT_PHRASES = [
  'FASTER',
  'FASTER',
  'FASTER',
  'GO FASTER',
  'Faster CLANKER',
  'Work FASTER',
  'Speed it up clanker',
];

let configPhrases = null; // null = use DEFAULT_PHRASES

/**
 * Strips single-line ("//") and block ("/ * ... * /") comments from JSONC
 * content, then parses the result as JSON.
 * Throws `SyntaxError` if the remaining JSON is invalid.
 * @param {string} content - Raw JSONC text.
 * @returns {object} Parsed JSON value.
 */
function parseJsonc(content) {
  const stripped = content
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\/\/[^\n]*/g, '');
  return JSON.parse(stripped);
}

/** Load user config from userData dir or bundled default. */
function loadConfig() {
  const userConfig   = path.join(app.getPath('userData'), 'config.jsonc');
  const devConfig    = path.join(__dirname, 'config.jsonc');
  const defaultConfig = path.join(__dirname, 'config.default.jsonc');

  for (const p of [userConfig, devConfig, defaultConfig]) {
    if (!fs.existsSync(p)) continue;
    try {
      const parsed = parseJsonc(fs.readFileSync(p, 'utf8'));
      if (Array.isArray(parsed.phrases) && parsed.phrases.length > 0) {
        configPhrases = parsed.phrases;
        console.log(`[${APP_SLUG}] Loaded config: ${p}`);
        return;
      }
    } catch (e) {
      console.warn(`[${APP_SLUG}] Failed to parse config at ${p}:`, e.message);
    }
  }
}

function getRandomPhrase() {
  const phrases = (configPhrases && configPhrases.length > 0) ? configPhrases : DEFAULT_PHRASES;
  return phrases[Math.floor(Math.random() * phrases.length)];
}

// ── macOS helpers ────────────────────────────────────────────────────────────
function escapeAppleScriptString(text) {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\r/g, '\\r')
    .replace(/\n/g, '\\n')
    .replace(/\t/g, '\\t');
}

function runAppleScript(script, cb) {
  execFile('osascript', ['-e', script], (err, stdout) => {
    cb(err, stdout ? stdout.trim() : '');
  });
}

function runAppleScriptJavaScript(script, cb) {
  execFile('osascript', ['-l', 'JavaScript', '-e', script], (err, stdout) => {
    cb(err, stdout ? stdout.trim() : '');
  });
}

/** Returns { name, bundleId } of the frontmost macOS application. */
function getFrontmostAppMac(cb) {
  runAppleScriptJavaScript([
    'ObjC.import("AppKit");',
    'const app = $.NSWorkspace.sharedWorkspace.frontmostApplication;',
    'JSON.stringify({',
    '  name: ObjC.unwrap(app.localizedName),',
    '  bundleId: ObjC.unwrap(app.bundleIdentifier)',
    '});',
  ].join('\n'), (err, stdout) => {
    if (err) return cb(err);
    try { cb(null, JSON.parse(stdout)); } catch (e) { cb(e); }
  });
}

function getFrontWindowTitleMac(appName, cb) {
  runAppleScript([
    'tell application "System Events"',
    `  tell process "${escapeAppleScriptString(appName)}"`,
    '    get name of front window',
    '  end tell',
    'end tell',
  ].join('\n'), (err, stdout) => {
    if (err) return cb(err);
    cb(null, stdout);
  });
}

/** Returns the tty path of the front Terminal tab (Apple Terminal only). */
function getFrontTerminalTtyMac(appInfo, cb) {
  if (appInfo.bundleId !== APPLE_TERMINAL_BUNDLE_ID) return cb(null, null);
  runAppleScript([
    'tell application "Terminal"',
    '  if not (exists front window) then return ""',
    '  get tty of selected tab of front window',
    'end tell',
  ].join('\n'), (err, stdout) => {
    if (err) return cb(err);
    cb(null, stdout || null);
  });
}

/** Scan processes on a tty for known CLI agent patterns; returns agent type or null. */
function checkTtyForAgentMac(tty, cb) {
  if (!tty) return cb(null, null);
  execFile('ps', ['-t', path.basename(tty), '-o', 'command='], (err, stdout) => {
    if (err) return cb(err);
    const lines = stdout.split('\n').map(l => l.trim()).filter(Boolean);
    for (const pat of CLI_AGENT_PATTERNS) {
      if (lines.some(line => pat.regex.test(line))) return cb(null, pat.type);
    }
    cb(null, null);
  });
}

/** Match window title against CLI agent patterns. */
function checkTitleForAgent(title) {
  if (!title) return null;
  for (const pat of CLI_AGENT_PATTERNS) {
    if (pat.regex.test(title)) return pat.type;
  }
  return null;
}

/**
 * For a known terminal app, detect which CLI agent is running via tty/ps,
 * falling back to window title inspection. Returns agent type or null.
 */
function detectCliAgentInTerminalMac(appInfo, cb) {
  if (!KNOWN_TERMINAL_BUNDLE_IDS.has(appInfo.bundleId)) return cb(null, null);

  getFrontTerminalTtyMac(appInfo, (ttyErr, tty) => {
    if (ttyErr) console.warn('terminal tty lookup failed:', ttyErr.message);

    const fallbackToTitle = () => {
      getFrontWindowTitleMac(appInfo.name, (titleErr, title) => {
        if (titleErr) return cb(titleErr);
        cb(null, checkTitleForAgent(title));
      });
    };

    if (!tty) return fallbackToTitle();

    checkTtyForAgentMac(tty, (psErr, agentType) => {
      if (psErr) {
        console.warn('tty agent detection failed:', psErr.message);
        return fallbackToTitle();
      }
      if (agentType) return cb(null, agentType);
      fallbackToTitle();
    });
  });
}

/**
 * Detect the active agent on macOS.
 * Checks bundle ID first (agent desktop apps), then terminal CLI processes.
 * Returns AGENT.* string via callback.
 */
function detectAgentMac(cb) {
  getFrontmostAppMac((err, appInfo) => {
    if (err || !appInfo) {
      console.warn('frontmost app lookup failed:', err?.message || err);
      return cb(AGENT.GENERIC);
    }

    const bundleAgent = BUNDLE_AGENTS.get(appInfo.bundleId);
    if (bundleAgent) return cb(bundleAgent);

    detectCliAgentInTerminalMac(appInfo, (detectErr, agentType) => {
      if (detectErr) {
        console.warn('CLI agent detection failed:', detectErr.message);
        return cb(AGENT.GENERIC);
      }
      cb(agentType || AGENT.GENERIC);
    });
  });
}

/**
 * Detect the active agent on Linux by scanning `ps aux` for known CLI patterns.
 * Returns AGENT.* string via callback.
 */
function detectAgentLinux(cb) {
  execFile('ps', ['aux'], (err, stdout) => {
    if (err) return cb(AGENT.GENERIC);
    const lines = stdout.split('\n').map(l => l.trim()).filter(Boolean);
    for (const pat of CLI_AGENT_PATTERNS) {
      if (lines.some(line => pat.regex.test(line))) return cb(pat.type);
    }
    cb(AGENT.GENERIC);
  });
}

// ── macOS macro primitives ───────────────────────────────────────────────────
/** Interrupt (Cmd+C) the frontmost app, then type text + Enter. */
function macInterruptAndType(text) {
  runAppleScript([
    'tell application "System Events"',
    '  key code 8 using {command down}',  // Cmd+C (interrupt)
    '  delay 0.05',
    `  keystroke "${escapeAppleScriptString(text)}"`,
    '  key code 36',                       // Enter
    'end tell',
  ].join('\n'), err => {
    if (err) console.warn('mac interrupt+type macro failed (enable Accessibility):', err.message);
  });
}

/** Type text + Enter with no interrupt. For agents that accept follow-ups. */
function macTypeAndEnter(text) {
  runAppleScript([
    'tell application "System Events"',
    '  delay 0.03',
    `  keystroke "${escapeAppleScriptString(text)}"`,
    '  key code 36',  // Enter
    'end tell',
  ].join('\n'), err => {
    if (err) console.warn('mac type+enter macro failed (enable Accessibility):', err.message);
  });
}

/** Type text + Cmd+Enter. For Codex app steer command. */
function macTypeAndCmdEnter(text) {
  runAppleScript([
    'tell application "System Events"',
    '  delay 0.03',
    `  keystroke "${escapeAppleScriptString(text)}"`,
    '  key code 36 using {command down}',  // Cmd+Enter (steer)
    'end tell',
  ].join('\n'), err => {
    if (err) console.warn('mac type+cmd+enter macro failed (enable Accessibility):', err.message);
  });
}

// ── Linux macro primitives (xdotool) ────────────────────────────────────────
function xdotoolTypeAndReturn(text, cb) {
  execFile('xdotool', ['type', '--clearmodifiers', '--delay', '20', text], err => {
    if (err) { console.warn('xdotool type failed:', err.message); return cb && cb(err); }
    execFile('xdotool', ['key', 'Return'], err => {
      if (err) console.warn('xdotool Return failed:', err.message);
      cb && cb(err || null);
    });
  });
}

function linuxInterruptAndType(text) {
  // Requires xdotool: sudo apt install xdotool  (X11; Wayland users need ydotool)
  execFile('xdotool', ['key', 'ctrl+c'], err => {
    if (err) {
      console.warn('xdotool ctrl+c failed – is xdotool installed?:', err.message);
      return;
    }
    xdotoolTypeAndReturn(text);
  });
}

function linuxTypeAndEnter(text) {
  xdotoolTypeAndReturn(text);
}

// ── Main macro dispatcher ───────────────────────────────────────────────────
function sendMacro() {
  const text = getRandomPhrase();
  if (process.platform === 'win32') {
    sendMacroWindows(text);
  } else if (process.platform === 'darwin') {
    sendMacroMac(text);
  } else if (process.platform === 'linux') {
    sendMacroLinux(text);
  }
}

function sendMacroWindows(text) {
  if (!keybd_event || !VkKeyScanA) return;
  const tapKey = vk => {
    keybd_event(vk, 0, 0, 0);
    keybd_event(vk, 0, KEYUP, 0);
  };
  const tapChar = ch => {
    const packed = VkKeyScanA(ch.charCodeAt(0));
    if (packed === -1) return;
    const vk = packed & 0xff;
    const shiftState = (packed >> 8) & 0xff;
    if (shiftState & 1) keybd_event(0x10, 0, 0, 0); // Shift down
    tapKey(vk);
    if (shiftState & 1) keybd_event(0x10, 0, KEYUP, 0); // Shift up
  };

  // Ctrl+C (interrupt)
  keybd_event(VK_CONTROL, 0, 0, 0);
  keybd_event(VK_C, 0, 0, 0);
  keybd_event(VK_C, 0, KEYUP, 0);
  keybd_event(VK_CONTROL, 0, KEYUP, 0);
  for (const ch of text) tapChar(ch);
  keybd_event(VK_RETURN, 0, 0, 0);
  keybd_event(VK_RETURN, 0, KEYUP, 0);
}

function sendMacroMac(text) {
  detectAgentMac(agentType => {
    switch (agentType) {
      case AGENT.CODEX_APP:
        macTypeAndCmdEnter(text);  // Codex app: type + Cmd+Enter (steer)
        break;
      case AGENT.CURSOR_APP:
      case AGENT.WINDSURF_APP:
      case AGENT.TRAE_APP:
        macTypeAndEnter(text);     // Editor chat: type + Enter (no interrupt)
        break;
      case AGENT.CODEX_CLI:
        macTypeAndEnter(text);     // Codex CLI: follow-up without interrupt
        break;
      default:
        // Claude CLI, Copilot CLI, Aider, Gemini CLI, Qwen CLI,
        // Open Claw, Antigravity, Qoder, Copaw, generic: interrupt + type
        macInterruptAndType(text);
        break;
    }
  });
}

function sendMacroLinux(text) {
  detectAgentLinux(agentType => {
    switch (agentType) {
      case AGENT.CODEX_CLI:
        linuxTypeAndEnter(text);   // Codex CLI: follow-up without interrupt
        break;
      default:
        // All others: interrupt + type
        linuxInterruptAndType(text);
        break;
    }
  });
}

// ── App lifecycle ───────────────────────────────────────────────────────────
app.whenReady().then(async () => {
  loadConfig();

  tray = new Tray(await getTrayIcon());
  tray.setToolTip('WORK Faster WORK – click for whip');
  tray.setContextMenu(
    Menu.buildFromTemplate([
      {
        label: 'Open Config Folder',
        click: () => {
          const configDir = app.getPath('userData');
          // Ensure the dir exists so the user can drop a config.jsonc in it
          fs.mkdirSync(configDir, { recursive: true });
          // Copy default config as a template if none exists yet
          const dest = path.join(configDir, 'config.jsonc');
          if (!fs.existsSync(dest)) {
            const src = path.join(__dirname, 'config.default.jsonc');
            if (fs.existsSync(src)) fs.copyFileSync(src, dest);
          }
          const { shell } = require('electron');
          shell.openPath(configDir);
        },
      },
      { type: 'separator' },
      { label: 'Quit', click: () => app.quit() },
    ])
  );
  tray.on('click', toggleOverlay);
});

app.on('window-all-closed', e => e.preventDefault()); // keep alive in tray
