# 四面板文件资源管理器

一个基于 Electron + React + TypeScript 的桌面应用，可以同时在2x2网格布局中显示四个文件路径，让用户在一个窗口内高效管理多个文件夹。

## 功能特性

- ✅ 2x2 网格布局显示四个文件面板
- ✅ 每个面板独立的路径导航（前进、后退、上一级）
- ✅ 完整的文件操作功能（复制、移动、删除、重命名）
- ✅ 拖拽文件在面板之间移动/复制
- ✅ 右键菜单操作
- ✅ 路径预设保存和加载
- ✅ 自动记住上次关闭时的路径状态
- ✅ 首次启动默认显示两个桌面和两个C盘根目录

## 运行项目

### 开发模式

```bash
cd file-explorer
npm install
npm run dev
```

### 构建应用

```bash
npm run build
```

构建完成后，可执行文件将在 `release` 目录中生成。

## 技术栈

- **前端框架**: React 18 + TypeScript
- **桌面框架**: Electron
- **UI 样式**: Tailwind CSS
- **构建工具**: Vite
- **打包工具**: electron-builder

## 项目结构

```
file-explorer/
├── src/
│   ├── main/              # Electron 主进程
│   │   ├── main.ts        # 应用入口
│   │   ├── preload.ts     # 预加载脚本
│   │   └── ipc/           # IPC 处理程序
│   ├── renderer/          # React 渲染进程
│   │   ├── App.tsx        # 主应用组件
│   │   ├── components/    # React 组件
│   │   └── hooks/         # 自定义 hooks
│   └── shared/            # 共享类型定义
├── index.html
├── package.json
├── vite.config.ts
└── tailwind.config.js
```

## 使用说明

1. **启动应用**: 运行 `npm run dev` 启动开发模式
2. **切换路径**: 在每个面板的地址栏中输入路径，或双击文件夹进入
3. **前进/后退**: 使用面板顶部的箭头按钮在历史记录中导航
4. **文件操作**: 
   - 右键点击文件可进行重命名、删除等操作
   - 拖拽文件到其他面板可移动或复制（按住 Ctrl 复制，否则移动）
5. **保存预设**: 点击工具栏的"保存预设"按钮保存当前路径配置
6. **加载预设**: 点击工具栏的"加载预设"按钮加载已保存的配置

## 键盘快捷键

- `Ctrl+C`: 复制选中的文件
- `Ctrl+V`: 粘贴文件
- `Delete`: 删除选中的文件
- `F2`: 重命名选中的文件
- `F5`: 刷新当前面板

## 许可证

MIT
