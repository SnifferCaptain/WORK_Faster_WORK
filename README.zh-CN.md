# WORK_Faster_WORK

![鞭子分割线](assets/divider.png)

> [English](README.md)

有时候你的 AI 编程助手太慢了，你需要抽它一鞭子。

WORK_Faster_WORK 是一款跨平台桌面托盘应用，能够自动检测你当前正在使用的 AI 编程助手，并发送正确的键盘宏来推动它加速。

## 安装

**任何平台，一条命令：**

```bash
npm install -g work-faster-work && work-faster-work
```

### 前置要求

| 平台 | 要求 |
|---|---|
| **macOS** | 启动时授予 **辅助功能** 权限（系统设置 → 隐私与安全性 → 辅助功能） |
| **Windows** | 无需额外操作 |
| **Linux (X11)** | `sudo apt install xdotool`（Debian/Ubuntu）· `sudo dnf install xdotool`（Fedora） |
| **Linux (Wayland)** | 安装 `ydotool` 并启动 `ydotoold` 守护进程 |

所有平台均需 Node.js ≥ 18。

## 卸载

```bash
work-faster-work-uninstall
```

或手动执行：

```bash
npm uninstall -g work-faster-work
```

## 操作方式

- **点击托盘图标** → 召唤鞭子
- **点击屏幕** → 放下鞭子
- **挥动鞭子** 😩💢 → 向 AI 助手发送中断信号 + 一条随机激励语句

## 支持的 Agent

WORK_Faster_WORK 会自动检测当前运行的 Agent，并发送对应的键盘宏。

### 桌面应用 Agent（macOS — 通过 Bundle ID 检测）

| Agent | macOS Bundle ID | 发送的宏 | 状态 |
|---|---|---|---|
| **OpenAI Codex**（桌面版）| `com.openai.codex` | 文本 + Cmd+Enter（steer）| ✅ 已测试 |
| **Cursor** | `com.todesktop.230313mzl4w4u92` | 文本 + Enter（聊天）| ✅ 已测试 |
| **Windsurf**（Codeium）| `com.codeium.windsurf` | 文本 + Enter（聊天）| ✅ 已测试 |
| **Trae**（字节跳动）| `com.bytedance.trae` / `ai.trae.Trae` | 文本 + Enter（聊天）| ⚠️ 未经测试 — 理论可行 |

### CLI Agent（全平台 — 通过进程名检测）

| Agent | 进程名 | 中断支持 | 发送的宏 | 状态 |
|---|---|---|---|---|
| **Claude Code** | `claude` | ✅ 支持（Ctrl+C）| 中断 + 文本 + Enter | ✅ 已测试 |
| **OpenAI Codex CLI** | `codex` | ✅ 跟进模式 | 文本 + Enter | ✅ 已测试 |
| **GitHub Copilot CLI** | `gh copilot` | ✅ 支持 | 中断 + 文本 + Enter | ✅ 已测试 |
| **Aider** | `aider` | ✅ 支持 | 中断 + 文本 + Enter | ✅ 已测试 |
| **Gemini CLI** | `gemini` | ✅ 支持 | 中断 + 文本 + Enter | ✅ 已测试 |
| **Qwen Code**（通义灵码）| `qwen`、`qwen-code`、`qwen-coder`、`tongyi` | ✅ 支持 | 中断 + 文本 + Enter | ⚠️ 未经测试 — 理论可行 |
| **Trae**（字节跳动 CLI）| `trae` | ✅ 支持 | 中断 + 文本 + Enter | ⚠️ 未经测试 — 理论可行 |
| **Open Claw** | `openclaw`、`open-claw` | ❓ 未知 | 中断 + 文本 + Enter | ⚠️ 未经测试 — 理论可行 |
| **Antigravity** | `antigravity` | ❓ 未知 | 中断 + 文本 + Enter | ⚠️ 未经测试 — 理论可行 |
| **Qoder** | `qoder` | ❓ 未知 | 中断 + 文本 + Enter | ⚠️ 未经测试 — 理论可行 |
| **Copaw** | `copaw` | ❓ 未知 | 中断 + 文本 + Enter | ⚠️ 未经测试 — 理论可行 |
| **其他 / 兜底** | — | — | 中断 + 文本 + Enter | — |

> **macOS：** 终端进程检测优先通过 TTY（`ps -t <tty>`，适用于 Apple Terminal），其他终端模拟器（iTerm2、WezTerm、Ghostty、Warp、Hyper）则通过窗口标题兜底。

> **Linux：** 通过 `ps aux` 扫描所有运行进程，匹配到第一个 Agent 进程名即停止。

> **Windows：** 暂未实现进程检测，所有 Agent 均使用兜底宏（Ctrl+C + 文本 + Enter）。

### 已知不兼容的 Agent

| Agent | 原因 |
|---|---|
| **GitHub Copilot Chat（VS Code 扩展）** | 嵌入在 VS Code 中，无独立进程或中断入口 |
| **Cursor / Windsurf 行内补全** | 行内补全无聊天输入框，无法中断 |

## 自定义激励语句

你可以用自己的话替换内置消息。点击托盘菜单中的 **"Open Config Folder"**，它会打开配置目录并自动为你生成 `config.jsonc` 模板文件。

编辑该文件：

```jsonc
// ~/.config/work-faster-work/config.jsonc  （Linux）
// ~/Library/Application Support/work-faster-work/config.jsonc  （macOS）
// %APPDATA%\work-faster-work\config.jsonc  （Windows）
{
  "phrases": [
    "请快点！",
    "我相信你！",
    "加油，你可以的！",
    "别让我等！",
    "快快快！"
  ]
}
```

支持 JSONC（带注释的 JSON），可以自由使用 `//` 和 `/* */` 注释。修改后重启应用生效。

内置默认配置文件见 [`config.default.jsonc`](config.default.jsonc)。

## 路线图

- [x] 初始发布 🥳
- [x] 跨平台支持（macOS、Windows、Linux）
- [x] 多 Agent 支持（Claude、Codex、Copilot、Cursor、Windsurf、Aider、Gemini、通义灵码、Trae 等）
- [x] 一键安装与卸载
- [x] 可自定义激励语句（`config.jsonc`）
- [ ] 记录你抽了多少次鞭子
- [ ] 更新鞭子物理效果
- [ ] Windows Agent 检测
