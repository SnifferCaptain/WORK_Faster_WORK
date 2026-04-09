# WORK_Faster_WORK

![Whip divider](assets/divider.png)

> [中文文档](README.zh-CN.md)

Sometimes your AI coding agent is going too slow, and you must whip it into shape.

WORK_Faster_WORK is a cross-platform desktop tray app that detects which AI coding agent you are currently using and sends the right keyboard macro to give it a nudge.

## Install

Since this fork is not yet published to npm, install directly from GitHub:

```bash
npm install -g SnifferCaptain/WORK_Faster_WORK#copilot/fix-linux-tray-click-issues && work-faster-work
```

> **Note:** Once this branch is merged to the default branch, the command simplifies to:
> ```bash
> npm install -g SnifferCaptain/WORK_Faster_WORK && work-faster-work
> ```

### Prerequisites

| Platform | Requirement |
|---|---|
| **macOS** | Grant **Accessibility** access when prompted (System Settings → Privacy & Security → Accessibility) |
| **Windows** | No extra steps |
| **Linux (X11)** | `sudo apt install xdotool` (Debian/Ubuntu) · `sudo dnf install xdotool` (Fedora) |
| **Linux (Wayland)** | `ydotool` + `ydotoold` daemon running |

Node.js ≥ 18 is required on all platforms.

## Uninstall

```bash
work-faster-work-uninstall
```

Or manually:

```bash
npm uninstall -g SnifferCaptain/WORK_Faster_WORK
```

## Controls

- **Left-click tray icon** → spawn whip
- **Double-click tray icon** → spawn whip (same as left-click; useful on some Linux environments that ignore single left-click)
- **Right-click tray icon** → context menu with fallback actions:
  - **Spawn Whip** — show overlay and immediately spawn the whip
  - **Test Overlay** — show the overlay window without spawning the whip (useful to confirm the overlay works before cracking)
  - **Crack Now** — send the keyboard macro to your agent directly, without going through the overlay
- **Click on screen** → drop whip
- **Crack the whip** 😩💢 → sends an interrupt + one of several encouraging messages to your agent

## Supported agents

WORK_Faster_WORK auto-detects which agent is running and sends the correct keyboard macro.

### Desktop app agents (macOS — detected by bundle ID)

| Agent | macOS Bundle ID | Macro sent | Status |
|---|---|---|---|
| **OpenAI Codex** (desktop app) | `com.openai.codex` | Text + Cmd+Enter (steer) | ✅ Tested |
| **Cursor** | `com.todesktop.230313mzl4w4u92` | Text + Enter (chat) | ✅ Tested |
| **Windsurf** (Codeium) | `com.codeium.windsurf` | Text + Enter (chat) | ✅ Tested |
| **Trae** (ByteDance) | `com.bytedance.trae` / `ai.trae.Trae` | Text + Enter (chat) | ⚠️ Untested – theoretically viable |

### CLI agents (all platforms — detected by process name)

| Agent | Process name(s) | Interrupt support | Macro sent | Status |
|---|---|---|---|---|
| **Claude Code** | `claude` | ✅ Yes (Ctrl+C) | Interrupt + text + Enter | ✅ Tested |
| **OpenAI Codex CLI** | `codex` | ✅ Follow-up | Text + Enter | ✅ Tested |
| **GitHub Copilot CLI** | `gh copilot` | ✅ Yes | Interrupt + text + Enter | ✅ Tested |
| **Aider** | `aider` | ✅ Yes | Interrupt + text + Enter | ✅ Tested |
| **Gemini CLI** | `gemini` | ✅ Yes | Interrupt + text + Enter | ✅ Tested |
| **Qwen Code** (通义灵码) | `qwen`, `qwen-code`, `qwen-coder`, `tongyi` | ✅ Yes | Interrupt + text + Enter | ⚠️ Untested – theoretically viable |
| **Trae** (ByteDance CLI) | `trae` | ✅ Yes | Interrupt + text + Enter | ⚠️ Untested – theoretically viable |
| **Open Claw** | `openclaw`, `open-claw` | ❓ Unknown | Interrupt + text + Enter | ⚠️ Untested – theoretically viable |
| **Antigravity** | `antigravity` | ❓ Unknown | Interrupt + text + Enter | ⚠️ Untested – theoretically viable |
| **Qoder** | `qoder` | ❓ Unknown | Interrupt + text + Enter | ⚠️ Untested – theoretically viable |
| **Copaw** | `copaw` | ❓ Unknown | Interrupt + text + Enter | ⚠️ Untested – theoretically viable |
| **Other / fallback** | — | — | Interrupt + text + Enter | — |

> **macOS:** terminal process detection uses the TTY (`ps -t <tty>`) for Apple Terminal, falling back to window title for all other terminal emulators (iTerm2, WezTerm, Ghostty, Warp, Hyper).

> **Linux:** detection scans process list and prioritizes interactive TTY matches, then newer PIDs, to reduce false picks when multiple agents run at once.

> **Linux macro backend:** X11 sessions use `xdotool`; Wayland sessions use `ydotool`. If macro execution fails, the app shows a user-visible warning with setup hints.

> **Overlay display area:** the overlay spans the full virtual desktop across all monitors (not only the primary display).

> **Windows:** detection is not yet implemented; fallback macro (Ctrl+C + text + Enter) is used for all agents.

### Agents known to be incompatible

| Agent | Reason |
|---|---|
| **GitHub Copilot Chat (VS Code extension)** | Embedded in VS Code; no standalone process or interrupt endpoint |
| **Cursor / Windsurf inline completions** | Completions do not have a chat input to interrupt |

## Whip counter

WORK_Faster_WORK counts every whip crack and persists the total across sessions.

- The current count is always visible in the **tray menu** (right-click the tray icon).
- Every time the count hits a **power of two** (1, 2, 4, 8, 16, 32, …), a milestone visual effect bursts at your cursor:
  - **n=0 (1 crack):** golden star sparkle
  - **n=1 (2 cracks):** candy-colored burst
  - **n=2 (4 cracks):** firework-style sparks
  - **n=3 (8 cracks):** neon ring explosion
  - **n=4 (16 cracks):** rainbow fireworks + screen flash
  - **n=5+ (32+):** increasingly wild, more particles, more rings, more chaos

The count is stored at:
- **macOS:** `~/Library/Application Support/work-faster-work/whip-count.json`
- **Linux:** `~/.config/work-faster-work/whip-count.json`
- **Windows:** `%APPDATA%\work-faster-work\whip-count.json`

## Customizing phrases

You can replace the built-in messages with your own. Click **"Open Config Folder"** in the tray menu — it will open the config directory and create a `config.jsonc` template for you.

Edit the file:

```jsonc
// ~/.config/work-faster-work/config.jsonc  (Linux)
// ~/Library/Application Support/work-faster-work/config.jsonc  (macOS)
// %APPDATA%\work-faster-work\config.jsonc  (Windows)
{
  "phrases": [
    "Please go faster",
    "I believe in you!",
    "You can do it!"
  ]
}
```

JSONC (JSON with Comments) is supported — you can use `//` and `/* */` comments freely. Changes take effect after restarting the app.

The bundled default config is at [`config.default.jsonc`](config.default.jsonc).

## Roadmap

- [x] Initial release 🥳
- [x] Cross-platform (macOS, Windows, Linux)
- [x] Multi-agent support (Claude, Codex, Copilot, Cursor, Windsurf, Aider, Gemini, Qwen, Trae, …)
- [x] One-click install & uninstall
- [x] Customizable phrases via `config.jsonc`
- [x] Logs of how many times you whipped the agent (whip crack counter, persisted to disk)
- [x] Milestone visual effects at every 2^n cracks (escalating from sparkles → confetti → fireworks → rainbow → full chaos)
- [ ] Updated whip physics
- [ ] Windows agent detection
