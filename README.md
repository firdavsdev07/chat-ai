# AI Chat Application (Production Ready)

This is a modern AI chat application built with **Next.js 16**, **Vercel AI SDK**, and **Bun SQLite**.
It features a ChatGPT-like interface with thread management, message persistence, and advanced Excel integration tools.

## Features

- 💬 **AI Chat**: Powered by Google Gemini 2.5 Flash using Vercel AI SDK v5.
- 🧵 **Thread Management**: Create, switch, and manage multiple chat threads.
- 💾 **Persistence**: All messages and threads are saved locally using SQLite (`data/chat.sqlite`).
- 📊 **Excel Integration**:
  - **Read/Write**: Full read/write capabilities for Excel files.
  - **Formula Explanation**: AI can read and explain Excel formulas.
  - **Mention System**: Reference cells directly in chat using `@Sheet!A1` syntax.
  - **Visual Table Modal**: Interactive grid for selecting ranges and viewing data.
- 🛡️ **Safety & Reliability**: 
  - Dangerous actions (delete/update) require explicit user confirmation via UI.
  - Robust error handling, timeouts, and retry mechanisms.
- 🎨 **Modern UX**: 
  - Clean UI with internal state management.
  - Real-time streaming responses with typing indicators.
  - Lucide React icons (no emojis).

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Runtime**: Bun 1.1+
- **Database**: SQLite (via `bun:sqlite`)
- **AI SDK**: Vercel AI SDK (`useChat`, `streamText`)
- **Styling**: Tailwind CSS
- **Icons**: lucide-react
- **Excel**: SheetJS (xlsx)

## Getting Started

### Prerequisites

- [Bun](https://bun.sh) installed.
- Google AI API Key.

### Installation

1. **Clone the repository** (if applicable):
   ```bash
   git clone <repository-url>
   cd ai-chat-test2
   ```

2. **Install dependencies**:
   ```bash
   bun install
   ```

3. **Environment Setup**:
   Create a `.env.local` file in the root directory:
   ```env
   GOOGLE_GENERATIVE_AI_API_KEY=your_api_key_here
   ```

4. **Data Setup**:
   Ensure `data/example.xlsx` exists in the project root. This file is used for all Excel operations.

### Running the App

Start the development server:

```bash
bun dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
src/
├── app/
│   ├── api/             # API Routes (Chat, Threads, Excel)
│   └── page.tsx         # Main Layout
├── components/          
│   ├── ChatArea.tsx     # Main chat logic & UI
│   ├── MentionInput.tsx # Input with @mention support
│   ├── TableModal.tsx   # Excel Grid Modal
│   ├── ExcelGrid.tsx    # Excel Table Implementation
│   └── tools/           # Generative UI Components
├── hooks/               # Custom Hooks (useMention, etc.)
├── lib/
│   ├── db.ts            # SQLite Database Connection
│   ├── excel.ts         # Excel Utility Functions
│   ├── actions.ts       # Server Actions
│   └── tools.ts         # Tool Definitions (Zod Schemas)
```

## AI Tools & Capabilities

The AI agent has access to the following tools:

- **`confirmAction`**: Requests user permission before critical operations.
- **`listSheets` / `getRange`**: Tools to explore and read Excel data.
- **`updateExcelCell`**: Modifies Excel data (requires confirmation).
- **`showTable`**: Displays data in a visual modal instead of raw text.

## Development Notes

- The project uses **Bun's built-in SQLite**, so no external DB setup is required.
- All core logic is strictly typed with **TypeScript**.
- UX is optimized for reliability: network errors and timeouts are handled gracefully.

---
Built with ❤️ using Vercel AI SDK and Next.js.
