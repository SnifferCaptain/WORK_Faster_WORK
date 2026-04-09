# WORK_Faster_WORK

![鞭子分割线](assets/divider.png)

> [English](README.md)

有时候你的 AI 编程助手太慢了，你需要抽它一鞭子。

WORK_Faster_WORK 是一款跨平台桌面托盘应用，能够自动检测你当前正在使用的 AI 编程助手，并发送正确的键盘宏来推动它加速。

## 安装

本项目是 fork，尚未发布到 npm，请直接从 GitHub 安装：

```bash
npm install -g SnifferCaptain/WORK_Faster_WORK#copilot/make-it-cross-platform && work-faster-work
```

> **提示：** 待该分支合并至默认分支后，命令可简化为：
> ```bash
> npm install -g SnifferCaptain/WORK_Faster_WORK && work-faster-work
> ```

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
npm uninstall -g SnifferCaptain/WORK_Faster_WORK
```

## 操作方式

- **点击托盘图标** → 召唤鞭子
- **右键托盘图标** → 备用入口：**Spawn Whip / Test Overlay / Crack Now**
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

> **Linux：** 会扫描进程列表，并优先选择带交互式 TTY 的匹配项，其次选择较新的 PID，以降低多 Agent 并存时的误判概率。

> **Linux 宏后端：** X11 会使用 `xdotool`；Wayland 会使用 `ydotool`。宏发送失败时，应用会弹出用户可见告警并给出修复提示。

> **Overlay 覆盖范围：** overlay 会覆盖所有显示器组成的虚拟桌面，而不只主屏幕。

> **Windows：** 暂未实现进程检测，所有 Agent 均使用兜底宏（Ctrl+C + 文本 + Enter）。

### 已知不兼容的 Agent

| Agent | 原因 |
|---|---|
| **GitHub Copilot Chat（VS Code 扩展）** | 嵌入在 VS Code 中，无独立进程或中断入口 |
| **Cursor / Windsurf 行内补全** | 行内补全无聊天输入框，无法中断 |

## 鞭子计数器

WORK_Faster_WORK 会记录每一次鞭子挥动，并持久化保存。

- 当前次数始终显示在**托盘菜单**中（右键点击托盘图标）。
- 每当次数达到 **2 的幂次**（1、2、4、8、16、32、…），都会在鼠标位置触发里程碑特效：
  - **n=0（第 1 次）：** 金色星星闪耀
  - **n=1（第 2 次）：** 糖果色粒子爆发
  - **n=2（第 4 次）：** 烟花风格火花
  - **n=3（第 8 次）：** 霓虹光环爆炸
  - **n=4（第 16 次）：** 彩虹烟花 + 屏幕闪光
  - **n=5+（第 32 次+）：** 越来越狂野的粒子盛宴

计数文件存储位置：
- **macOS：** `~/Library/Application Support/work-faster-work/whip-count.json`
- **Linux：** `~/.config/work-faster-work/whip-count.json`
- **Windows：** `%APPDATA%\work-faster-work\whip-count.json`

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
- [x] 记录你抽了多少次鞭子（持久化到磁盘，托盘菜单实时显示）
- [x] 每累计到 2^n 次时触发里程碑特效（随 n 增大特效越来越华丽：金色星星 → 彩色粒子 → 烟花 → 彩虹爆炸 → 全屏狂欢）
- [ ] 更新鞭子物理效果
- [ ] Windows Agent 检测
