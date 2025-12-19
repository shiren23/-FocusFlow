# FocusFlow 🌊

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![React](https://img.shields.io/badge/React-19.0-61DAFB.svg?logo=react)
![Tailwind](https://img.shields.io/badge/Tailwind-CSS-38B2AC.svg?logo=tailwind-css)
![Gemini](https://img.shields.io/badge/AI-Google%20Gemini-8E75B2.svg?logo=google)

> **Advanced Personal Productivity OS**  
> 一个注重隐私、极简美学与深度专注的个人效能操作系统。

FocusFlow 是一个基于 React 构建的单页应用（SPA），专为追求高效与内心平静的用户设计。它采用**莫兰迪色系**（Morandi Palette）打造高雅的视觉体验，结合**艾森豪威尔矩阵**（Eisenhower Matrix）与**Google Gemini AI**，将杂乱的事务转化为井井有条的行动指南。

---

## ✨ 核心特性 (Key Features)

### 🎨 沉浸式 UI/UX
- **莫兰迪美学**: 默认 Sage Green（鼠尾草绿）主题，低饱和度配色，减少视觉疲劳。
- **双模式视图**: 
  - **极简模式**: 仅展示任务标题，最大化专注度。
  - **详情模式**: 展示进度条、截止倒计时、标签与子任务。

### 🧠 AI 智能辅助 (Powered by Gemini)
- **语音转任务 (NLP)**: 点击麦克风，说出你的想法。AI 会自动分析语义，提取**标题**、**分类**、**优先级**（重要/紧急）和**截止日期**。
- **智能解析**: 自动将自然语言（如 "明天下午3点要把报告发给老板"）转换为结构化的 JSON 数据。

### ⚡️ 深度专注工具
- **四象限看板**: 经典的艾森豪威尔矩阵，支持拖拽管理优先级。
- **5分钟拖延杀手 (Procrastination Killer)**: 点击任务旁的 "5m" 图标，启动全屏沉浸式倒计时。利用心理学技巧帮助你迈出最困难的第一步。
- **Brain Clock**: 针对逾期未完成的任务，提供非侵入式的周期性提醒。

### 🔒 隐私优先 (Privacy First)
- **无后端架构**: 所有数据（任务、设置、笔记）仅存储在浏览器的 `LocalStorage` 或 `IndexedDB` 中。
- **数据主权**: 支持完整的 JSON 格式导出与导入，数据完全由用户掌控。

---

## 🛠 技术栈 (Tech Stack)

- **Framework**: React 19 (Hooks, Functional Components)
- **Styling**: Tailwind CSS (Responsive, Modern)
- **Icons**: Lucide React
- **AI Engine**: Google Gemini API (`gemini-2.5-flash-latest`)
- **Language**: TypeScript
- **Build Tool**: Vite (Recommended) / ES Modules

---

## 🚀 快速开始 (Getting Started)

### 前置要求
你需要一个 [Google Gemini API Key](https://aistudio.google.com/app/apikey) 来使用语音智能解析功能。

### 安装与运行

1. **克隆仓库**
   ```bash
   git clone https://github.com/yourusername/focusflow.git
   cd focusflow
   ```

2. **安装依赖**
   ```bash
   npm install
   ```

3. **启动开发服务器**
   ```bash
   npm run dev
   ```

4. **配置 AI**
   - 启动应用后，点击侧边栏的 **Settings**。
   - 在 "AI Integration" 部分输入你的 Google Gemini API Key。

---

## 📖 使用指南 (User Guide)

1. **创建任务**: 
   - 点击右上角 "New Task" 或使用麦克风图标进行语音输入。
   - 语音示例: *"周五要把 React 项目文档写完，这个很重要，归类到工作"*。

2. **管理优先级**:
   - 在 Dashboard 视图中，将卡片在四个象限之间拖拽以改变优先级。
   
3. **专注模式**:
   - 鼠标悬停在任务卡片上，点击出现的 **"5m"** 按钮进入全屏专注计时。

4. **数据备份**:
   - 定期前往 Settings -> Data Management 导出 JSON 备份文件。

---

## 🤝 贡献 (Contributing)

欢迎提交 Issue 或 Pull Request！我们尤其关注以下方向的改进：
- 更多的莫兰迪主题配色方案。
- 集成更多的 AI 模型支持。
- PWA (Progressive Web App) 离线支持优化。

---

## 📄 许可证 (License)

本项目采用 [MIT License](LICENSE) 开源。

---

<p align="center">Made with ❤️ by FocusFlow Team</p>
