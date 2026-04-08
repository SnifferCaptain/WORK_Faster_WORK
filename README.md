# badclaude

![Whip divider](assets/divider.png)

Sometimes claude code is going too shlow, and you must whip him into shape..

## Install + run

### Prerequisites

- [Node.js](https://nodejs.org/) ≥ 18
- **Linux (X11):** install `xdotool` first: `sudo apt install xdotool` (Debian/Ubuntu) or `sudo dnf install xdotool` (Fedora)
- **Linux (Wayland):** install `ydotool` and start the `ydotoold` daemon instead

**One command on any platform:**

```bash
npm install -g badclaude && badclaude
```

### Platform notes

| Platform | Requirement |
|---|---|
| macOS | Grant **Accessibility** access when prompted (System Settings → Privacy & Security → Accessibility) |
| Windows | No extra steps |
| Linux (X11) | `xdotool` (see above) |
| Linux (Wayland) | `ydotool` + `ydotoold` daemon |

## Controls

- Click tray icon: spawn whip.
- Click: drop whip.
- Whip him 😩💢
- It sends an interrupt (Ctrl-C) and one of 5 encouraging messages!

## Roadmap

- [x] Initial release! 🥳
- [x] Cease and desist letter from Anthropic
- [x] Cross-platform support (macOS, Windows, Linux)
- [ ] Crypto miner
- [ ] Logs of how many times you whipped claude so when the robots come we can order people nicely for them
- [ ] Updated whip physics
