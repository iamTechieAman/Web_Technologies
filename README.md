# ⚡ CodeVisualizer v4.0 — The Next-Gen Algorithm IDE

> **Visualize. Debug. Master DSA.**
> A high-performance, professional-grade platform for algorithmic excellence.

---

## 🌟 About the Project

**CodeVisualizer** is not just another online compiler; it is a full-featured, integrated development environment (IDE) designed specifically for deep algorithmic learning and structural analysis. Built with passion for software engineers, by software engineers, it bridge the gap between abstract code and concrete understanding.

Whether you are a student mastering Data Structures and Algorithms (DSA), a professional preparing for technical interviews, or a researcher exploring complex data relations, CodeVisualizer provides the high-fidelity tools you need to see exactly what your code is doing in real-time.

---

## 🚀 Key Features

### 💻 Professional Monaco Editor
A pixel-perfect integration of the **Monaco Editor** (the engine behind VS Code). Enjoy IntelliSense, syntax highlighting for 15+ languages, bracket matching, and a responsive experience that feels native to your browser.

### 🐚 Real-Time Interactive Terminal
A true **VS Code-like terminal** experience. Unlike basic online compilers that use batch processing, our interactive terminal uses **xterm.js** and a dedicated **WebSocket backend** to support real-time `stdin`/`stdout` streams. You can type into your program while it's running!

### 🔮 5-Tab Algorithm Visualizer
Watch your code's state evolve step-by-step across five specialized views:
- **Memory Map**: A live table of all variables, types, and values with delta-highlighting.
- **Array View**: Interactive animations for lists and multi-dimensional arrays.
- **Tree View**: Automated detection of tree-like structures rendered via `react-force-graph`.
- **Recursion Tree**: A dynamic call-tree visualization for recursive logic.
- **Flowchart**: Real-time generation of Control-Flow Graphs (CFG) using `ReactFlow`.

### 🧠 AI CodeBuddy (Multi-Provider)
Your super-friendly coding mentor is always available. Powered by a robust fallback pipeline of **Groq**, **Google Gemini**, and **OpenRouter**, CodeBuddy explains complex concepts, optimizes your code, and offers proactive hints when your program needs input.

### 🗺️ Structural Code Map
Instantly generate an architectural blueprint of your project. Using AI structural analysis and **Graphviz (DOT)**, CodeVisualizer maps out functions, classes, and dependencies in a zoomable, interactive SVG map.

### 📚 Integrated LeetCode Library
A comprehensive library of **~3000 algorithmic challenges** scraped directly from LeetCode. Each problem includes full descriptions, examples, constraints, and hints, all integrated directly into the IDE workspace.

### 📂 Pro Workspace Management
- **File System**: A virtual IndexedDB-backed file explorer with folder support.
- **Git Import**: Import any public GitHub repository directly into your workspace.
- **Download ZIP**: Export your entire virtual project as a `.zip` file with one click.
- **Command Palette**: Quick access to every feature via `Ctrl+Shift+P`.

---

## 🛠️ Tech Stack

| Layer | Technology | Justification |
| :--- | :--- | :--- |
| **Frontend** | Next.js 14 (App Router) | For SEO-friendly landing pages and high-performance routing. |
| **Styling** | Tailwind CSS | For a sleek, high-contrast, and fully responsive design system. |
| **Editor** | Monaco Editor | The industry standard for browser-based code editing. |
| **Visuals** | ReactFlow, ForceGraph | For hardware-accelerated graph and flowchart rendering. |
| **Terminal** | xterm.js + node-pty | To provide a true interactive shell experience. |
| **Backend** | Node.js + WebSockets | For real-time data streaming between the compiler and UI. |
| **Storage** | IndexedDB (LocalForage) | To keep your workspace persistent across browser sessions. |
| **AI** | Vercel AI SDK + Groq/Gemini | For low-latency, streaming AI mentorship. |

---

## 📐 Architecture & Data Flow

```ascii
[ User Browser ] <---(WebSocket)---> [ Terminal Server (node-pty) ]
       |                                      |
       |---(HTTP)---[ Piston API (Batch) ]    |---(Spawn)--[ Local Runtime ]
       |
       |---(HTTP)---[ AI Providers (Groq/Gemini) ]
```

---

## 📦 Setup & Installation

### 1. Clone the Repository
```bash
git clone https://github.com/iamTechieAman/Web_Technologies.git
cd Web_Technologies
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment Variables
Create a `.env.local` file in the root directory:
```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

GROQ_API_KEY=gsk_...
GOOGLE_API_KEY=AIza...
OPENROUTER_API_KEY=sk-or-...

NEXT_PUBLIC_WS_SERVER_URL=ws://localhost:5001
```

### 4. Run the Development Suite
Start both the Next.js frontend and the Execution Server:
```bash
npm run dev:full
```

The IDE will be available at `http://localhost:3000`.

---

## 📖 Usage Guide

1.  **Open the IDE**: Click "Open IDE" from the landing page.
2.  **Choose a Problem**: Use the "Challenges" tab in the sidebar to load a LeetCode problem.
3.  **Code & Run**: Write your solution. Press `Ctrl+Enter` to run.
4.  **Interact**: Use the terminal to provide `stdin` if your program requests it.
5.  **Visualize**: Switch to the "Visualizer" tab in the right panel to step through your logic.
6.  **AI Help**: Select any code snippet and click "Ask AI" for a best-friend-style explanation.

---

## 📜 The Making of CodeVisualizer

This project began with a simple goal: to stop "guessing" what happens in memory during a recursion. What started as a simple Python visualizer evolved into a multi-language, professional-grade IDE.

### Challenges Faced
- **Real-Time Input**: Bridging the gap between a stateless web app and a stateful OS process required a robust WebSocket implementation with `node-pty`.
- **Theme Consistency**: Ensuring zero visibility issues in light mode while maintaining a "cool" aesthetic required a custom-built design system with meticulous token management.

### Breakthroughs
- **AI Mentorship**: Implementing a provider-fallback system ensured that even if one AI engine is busy, the user always gets a response.
- **DOT Notation Mapping**: Using AI to "see" code architecture and outputting it as Graphviz DOT strings allowed for automated structural mapping that works on any language.

---

## 🚢 Deployment

### Frontend (Netlify/Vercel)
The frontend is optimized for Next.js 14 and can be deployed with one click.
1. Connect your GitHub repo.
2. Set the build command to `npm run build`.
3. Set the publish directory to `.next`.
4. Add your `.env.local` keys to the environment variables section.

### Backend (Railway/Render)
The terminal server (`server/exec-server.js`) should be deployed as a background worker.
1. Run `npm run exec-server`.
2. Ensure the port (5001) is exposed and reachable via `wss://`.

---

## 🤝 Contributing & License

Contributions are welcome! Please open an issue or submit a pull request.
Licensed under the **MIT License**.

---

**Built with ❤️ for the next generation of software engineers.**
*Happy Coding!*
