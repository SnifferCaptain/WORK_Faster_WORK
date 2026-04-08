# badclaude

![Whip divider](assets/divider.png)

Sometimes your AI coding agent is going too slow, and you must whip it into shape.

## Install

**One command, any platform:**

```bash
npm install -g badclaude && badclaude
```

### Prerequisites

- [Node.js](https://nodejs.org/) ≥ 18
- **Linux (X11):** install `xdotool` first: `sudo apt install xdotool` (Debian/Ubuntu) or `sudo dnf install xdotool` (Fedora)
- **Linux (Wayland):** install `ydotool` and start the `ydotoold` daemon
- **macOS:** grant **Accessibility** access when prompted (System Settings → Privacy & Security → Accessibility)

## Uninstall

```bash
badclaude-uninstall
```

Or manually: `npm uninstall -g badclaude`

## Supported agents

badclaude auto-detects which agent is running and sends the right macro automatically.

| Agent | Detection | Macro sent |
|---|---|---|
| **Claude Code** (`claude` CLI) | process name in terminal | Interrupt (Ctrl+C) + message + Enter |
| **OpenAI Codex** (desktop app) | app bundle ID | Message + Cmd+Enter (steer) |
| **OpenAI Codex** (`codex` CLI) | process name in terminal | Message + Enter (follow-up) |
| **GitHub Copilot** (`gh copilot`) | process args in terminal | Interrupt + message + Enter |
| **Cursor** (editor) | app bundle ID | Message + Enter (chat) |
| **Windsurf** (editor) | app bundle ID | Message + Enter (chat) |
| **Aider** (`aider` CLI) | process name in terminal | Interrupt + message + Enter |
| **Gemini CLI** (`gemini`) | process name in terminal | Interrupt + message + Enter |
| **Other / fallback** | — | Interrupt + message + Enter |

> **macOS note:** terminal process detection uses the TTY (Apple Terminal) or window title (all others) to identify the CLI agent running inside the terminal emulator.

> **Linux note:** detection scans all running processes via `ps aux`. The first matching agent wins.

## Controls

- Click tray icon → spawn whip
- Click on screen → drop whip
- Crack the whip 😩💢 → sends an interrupt + one of several encouraging messages to your agent

## Roadmap

- [x] Initial release! 🥳
- [x] Cease and desist letter from Anthropic
- [x] Cross-platform support (macOS, Windows, Linux)
- [x] Multi-agent support (Claude, Codex, Copilot, Cursor, Windsurf, Aider, Gemini)
- [x] One-click install & uninstall
- [ ] Crypto miner
- [ ] Logs of how many times you whipped the agent
- [ ] Updated whip physics

