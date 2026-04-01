# 🚀 CodeVisualizer

> **Master Data Structures & Algorithms through high-fidelity visual execution and AI-powered mentorship.**

![Next.js](https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=for-the-badge&logo=typescript)
![TailwindCSS](https://img.shields.io/badge/Tailwind-CSS-38B2AC?style=for-the-badge&logo=tailwind-css)
![Vercel](https://img.shields.io/badge/Vercel-Deployed-white?style=for-the-badge&logo=vercel)

## 📖 About CodeVisualizer
CodeVisualizer is a production-grade educational platform designed to bridge the gap between writing code and understanding its internal state. Built for the next generation of software engineers, it provides a high-performance IDE environment where algorithms aren't just written—they are animated in real-time.

## ✨ Core Features

*   **⚡ Multi-Language Execution**: Run code in 15+ languages including Java, Python, C++, Rust, and Go using our hardened Piston-backed engine.
*   **📊 5-Dimension Visualization**:
    *   **Memory Map**: Real-time variable tracking and pointer analysis.
    *   **Array/Matrix View**: Interactive grid visualization for linear and 2D data structures.
    *   **Tree & Graph View**: Dynamic topology mapping using D3-force simulations.
    *   **Recursion Tree**: Animated call-stack analysis with frame-by-frame tracing.
    *   **Logic Flowchart**: Automatic control-flow mapping from source code.
*   **🤖 AI Mentor**: An integrated assistant powered by Gemini 2.0 via OpenRouter. Get line-by-line explanations, Big-O complexity analysis, and code optimization hints.
*   **📚 LeetCode Problem Bank**: Access a library of 3,000+ problems scraped directly from LeetCode with full description support.
*   **📥 Git & Local Import**: Import projects directly from GitHub or upload local ZIP workspaces.
*   **🎨 Premium UI/UX**: Neon-accented glassmorphism theme with support for both Dark and Light modes.

## 🛠️ Tech Stack
- **Framework**: Next.js 14 (App Router)
- **State Management**: React Hooks + Context API
- **Visuals**: Framer Motion, React Flow, React Force Graph
- **Editor**: Monaco Editor (@monaco-editor/react)
- **AI Backend**: OpenRouter (Gemini 2.0 Flash)
- **Styling**: TailwindCSS + Lucide Icons

## 📁 Project Structure
```text
src/
├── app/               # Next.js App Router (Pages & API)
│   ├── api/           # Backend execution & AI routes
│   └── problems/      # Dynamic problem detail pages
├── components/        # UI & Visualizer panels
│   ├── IDE.tsx        # Central controller
│   ├── MemoryMap.tsx  # State tracker
│   └── AIAssistant.tsx# AI Mentor interface
├── hooks/             # Custom FS, Tabs, and Execution hooks
├── lib/               # Step Executor, Flowchart Gen, Preprocessor
└── types/             # Global TS definitions
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or pnpm

### Installation
1. Clone the repository:
   ```bash
   git clone https://github.com/iamTechieAman/Web_Technologies.git
   cd Web_Technologies
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up environment variables:
   ```bash
   cp .env.local.example .env.local
   # Add your OpenRouter API Key to .env.local
   ```

### Running Locally
```bash
npm run dev
```

## 🧪 Scraping LeetCode Problems
To refresh the problem library:
```bash
npm run scrape
```
This executes the `scripts/fetch-all-problems.ts` pipeline to sync with the latest LeetCode bank.

## 🌐 Deployment

### Vercel (Recommended)
1. Push your code to GitHub.
2. Import the project in Vercel.
3. Add `OPENROUTER_API_KEY` to the **Environment Variables** in project settings.
4. Deployment will be automatic on every push.

## 🔒 Security Note
This project uses `.env.local` for sensitive API keys. Never commit your `.env.local` file to version control. The `.gitignore` is pre-configured to keep your credentials safe.

## 📄 License
This project is licensed under the MIT License - see the LICENSE file for details.
