# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 核心规则 — 必须遵守

**开发新功能/流程/程序，代码写完后必须验证能跑通，再提交给用户。**

- 语法检查不算验证。`node --check` 通过 ≠ 程序能跑。
- 验证方式取决于项目类型：前端页面用浏览器打开测试，脚本用命令行跑一遍，有 test suite 就跑 test suite。
- 关键路径必须走到（页面加载不报错、按钮点击有反应、核心流程端到端跑通）。
- 不要假设依赖存在——引用了某个函数/变量，先确认它确实被定义了。
- 如果无法自行验证（比如需要特定硬件、需要登录的外部服务），明确告诉用户哪些路径未验证，不要装作验证过了。

## Project Overview

This repo contains multiple projects:

- **Root** — Tomato Pomodoro, a desktop Pomodoro timer app using NW.js (Node-Webkit)
- **`cuckoo-slides/`** — Python scripts to generate a PPTX presentation about cuckoo birds
- **`renderer/`** — An earlier/simpler copy of the Pomodoro timer (no Wake Lock, no notification permission handling)
- **`New CC/`** — Unrelated PowerPoint file, not part of the codebase

## Main App: Tomato Pomodoro

### Commands

```bash
npm start          # Launch the NW.js app
npx nw .           # Same as above (if npm start doesn't work)
```

There are no tests, linters, or build steps.

### Architecture

**Stack:** Vanilla JS, single HTML file, single CSS file, wrapped in NW.js (v0.93.0-sdk) as a native desktop window (420×580, non-resizable).

**State machine:** The timer has two orthogonal dimensions of state:

| | idle | running | paused |
|---|---|---|---|
| **focus** (25 min) | Default | Timer counting down | Timer paused |
| **break** (5 min) | Auto-starts after focus ends | Timer counting down | Timer paused |

State variables are global `var`s at the top of [script.js](script.js): `mode`, `state`, `totalSeconds`, `remainingSeconds`, `sessionCount`, `startTimestamp`, `pausedRemaining`, `tickInterval`.

**Timer accuracy:** Uses a wall-clock approach — records `startTimestamp = Date.now()` on start, then each tick computes `elapsed = floor((now - startTimestamp) / 1000)`. This avoids drift from `setInterval` inaccuracy. Ticks run at 200ms intervals for smooth UI updates.

**Auto-cycle:** When a focus session completes, it auto-starts a break session, and vice versa. `sessionCount` increments only on focus completion.

**Tomato face:** Pure CSS art (`#tomato-face`) with 4 states mapped to CSS classes — `idle` (bouncing), `focus` (pulsing), `break` (swaying), `paused` (neutral). Each applies different keyframe animations and facial feature adjustments (eye pupils, mouth shape, shadow color).

**Features layered via monkey-patching:** Wake Lock and audio resume are added by wrapping the core timer functions (`startTimer`, `pauseTimer`, `resetTimer`, `completeCycle`) rather than editing them inline. This is intentional to keep the core logic clean.

**NW.js entry point:** `package.json` sets `"main": "renderer/index.html"`, so the app actually loads [renderer/index.html](renderer/index.html) — not the root [index.html](index.html). The root files appear to be the latest version with extra features (notification permission handling, Wake Lock), while `renderer/` has the simpler version that actually launches.

### Notifications & Audio

- Notifications require user gesture permission (browsers/NW.js). Permission is requested on load and re-requested on any click if still `"default"`.
- Cycle-completion sound uses Web Audio API (3 rising sine tones: 660→880→1100 Hz).
- Audio context must be resumed on user gesture — `resumeAudio()` is called on Start click.

## cuckoo-slides/

Python scripts for generating a 7-slide documentary-style PPTX about cuckoo birds.

```bash
cd cuckoo-slides
python download_images.py   # Download CC-licensed images from Pixabay/Wikimedia
python generate-pptx.py     # Generate output.pptx (16:9, dark cinematic theme)
```

Dependencies: `python-pptx`, `Pillow` (both already available per project comments).

## vocab-tool/ — 单词快快记 Vocab Flash

单文件 PWA 应用（`vocab-tool/index.html`，~490KB），所有 JS/CSS 内联。部署于 GitHub Pages：https://ppelaine.github.io/vocab-quick-memorize/

### 架构

**Stack:** 纯 HTML/CSS/JS 单文件。`app.js` 为源码文件（编辑用），`index.html` 为内联后的部署文件（`app.js` 内容内嵌于 `<script>` 标签）。

**修改流程：**
1. 编辑 `app.js`（或直接改 `index.html`）
2. 如果改了 `app.js`，用脚本将其重新内联到 `index.html`
3. 桌面 Chrome 打开 `index.html` 验证功能
4. `git commit && git push` → GitHub Pages 自动部署

**重新内联方式：**
```bash
cd vocab-tool && node -e "
var fs=require('fs');
var html=fs.readFileSync('index.html','utf8');
var appJs=fs.readFileSync('app.js','utf8');
var s=html.indexOf('<script>');
var e=html.indexOf('</script></body>');
html=html.substring(0,s+8)+'\r\n'+appJs+'\r\n'+html.substring(e);
fs.writeFileSync('index.html',html,'utf8');
"
```

### 功能模块

| 模块 | 说明 |
|------|------|
| 词库 | 用户导入/添加的词汇，基于艾宾浩斯遗忘曲线管理复习周期 |
| OCR 上传 | Tesseract.js 拍照/图片识别单词，支持 TOC 教材目录检测 |
| 教材 | Cambridge Think 2 等教材词汇库（Unit 1/2），可在线检索 |
| 游戏 | 三种模式 — 看英文选中文 / 看释义选单词 / 补全元音字母 |
| 多用户 | 用户切换/添加/删除，数据按用户 ID 分隔存储 |
| PWA | manifest.json + sw.js 缓存，可添加到手机主屏幕 |

### 核心函数 (app.js)

- `DICTIONARY` — ~2200 词条（en/zh/def/phonetic/pos）
- `switchTab(tab)` — 4 tab 切换 (review/bank/game/profile)
- `getWordBank()` / `saveWordBank()` — 词库读写
- `getUsersMeta()` / `getActiveUserId()` — 多用户管理
- `getTextbooksData()` / `genTextbookDB()` — 教材数据库
- 游戏函数在 `useGame.js` 对应的 inlined 部分

### 已知问题

- **Android Chrome:** 外部 JS 文件加载（`<script src>`、`eval`、`textContent`）均失败，原因未查明。**解决方案：将 app.js 内联进 index.html 为单文件**，此方案已验证可行。
- **GitHub Pages 推送:** 443 端口间歇被墙，多试几次。

### 不应做的事

- ❌ 不要拆分 index.html 为外部 JS 文件 — Android Chrome 会挂
- ❌ 不要用 `eval()` 或动态 `createElement('script')` 加载大段 JS — 同样会挂
- ❌ 不要删除 `app.js` — 它是源码编辑文件
