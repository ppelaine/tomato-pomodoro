# 项目安装与使用指南

## 当前项目状态

✅ **已完成**：
- 项目结构创建
- 所有源代码编写（Electron 主进程、React 组件、IPC 通信等）
- npm 依赖安装（除 Electron 二进制文件外）
- 配置文件创建

⚠️ **待完成**：
- Electron 二进制文件安装（需要手动处理）

## 快速安装步骤

### 步骤 1：安装 Electron 二进制文件

由于网络限制，建议您使用以下方法之一安装 Electron：

#### 方法 1：使用国内镜像（推荐）

在项目目录中运行以下命令：

```bash
cd c:\Users\ppdyz\AI\file-explorer

# 设置镜像
set ELECTRON_MIRROR=https://npmmirror.com/mirrors/electron/
set ELECTRON_CACHE=.electron-cache

# 安装 Electron
node node_modules\electron\install.js
```

#### 方法 2：手动下载并放置

1. 从 https://github.com/electron/electron/releases 下载对应版本的 Electron
2. 解压到项目目录的 `.electron-cache` 文件夹中
3. 确保 `electron.exe` 文件在正确的位置

#### 方法 3：使用管理员权限的 PowerShell

```powershell
cd c:\Users\ppdyz\AI\file-explorer

$env:ELECTRON_MIRROR = "https://npmmirror.com/mirrors/electron/"
$env:ELECTRON_CACHE = "$PWD\.electron-cache"

node .\node_modules\electron\install.js
```

### 步骤 2：启动开发模式

Electron 安装完成后，运行：

```bash
cd c:\Users\ppdyz\AI\file-explorer
npm run dev
```

### 步骤 3：构建可执行文件

```bash
npm run build
```

构建完成后，可执行文件将生成在 `release` 目录中。

## 常见问题

### 问题 1：npm install 失败

**解决方案**：
```bash
npm install --ignore-scripts
```

这会跳过所有安装脚本，避免权限问题。

### 问题 2：Electron 下载超时

**解决方案**：
1. 使用国内镜像（如上所示）
2. 重试下载
3. 手动下载并放置二进制文件

### 问题 3：沙箱权限限制

**解决方案**：
如果您在受限环境中运行，请：
1. 以管理员身份运行终端
2. 或者手动下载 Electron 二进制文件

## 项目文件结构

```
file-explorer/
├── src/
│   ├── main/                    # Electron 主进程
│   │   ├── main.ts             # 应用入口
│   │   ├── preload.ts          # 预加载脚本
│   │   └── ipc/                # IPC 处理程序
│   │       ├── file.ts         # 文件操作
│   │       └── config.ts       # 配置管理
│   ├── renderer/               # React 渲染进程
│   │   ├── App.tsx            # 主应用组件
│   │   ├── main.tsx           # React 入口
│   │   ├── index.css           # 全局样式
│   │   └── components/        # React 组件
│   │       ├── FilePanel.tsx  # 文件面板
│   │       ├── FileList.tsx   # 文件列表
│   │       ├── PathBar.tsx    # 路径栏
│   │       └── Toolbar.tsx    # 工具栏
│   └── shared/                 # 共享类型
│       └── types.ts
├── package.json
├── vite.config.ts
├── tsconfig.json
├── tailwind.config.js
├── index.html
└── README.md
```

## 技术栈

- **Electron**: 28.0.0（桌面应用框架）
- **React**: 18.2.0（UI 框架）
- **TypeScript**: 5.3.3（类型系统）
- **Vite**: 5.0.8（构建工具）
- **Tailwind CSS**: 3.4.0（样式框架）
- **electron-builder**: 24.9.1（打包工具）

## 功能特性

✅ 2x2 网格布局显示四个文件面板
✅ 每个面板独立的路径导航
✅ 完整的文件操作（复制、移动、删除、重命名）
✅ 拖拽文件在面板间移动/复制
✅ 右键菜单操作
✅ 路径预设保存和加载
✅ 自动记住上次路径状态
✅ 首次启动默认显示两个桌面和两个C盘

## 联系方式

如果安装过程中遇到任何问题，请查看：
- [Electron 官方文档](https://www.electronjs.org/docs)
- [npm 官方文档](https://docs.npmjs.com/)
