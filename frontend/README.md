# ForeTrace 📊

> **Structured Equity Intelligence from SEC Filings**

ForeTrace is a premium, high-fidelity investment research dashboard that surfaces structural health patterns, revenue concentration risks, and historical analogs directly from SEC corporate filings (Form 10-K, 10-Q). 

Built for investors who read the filings, it replaces surface-level summaries with structured data extraction powered by FastAPI, Groq API, and React.

---

## ✨ Core Features

*   **Live Analysis Workspace**: Streams real-time parsing phases using **WebSockets** with automatic **HTTP REST fallback** mechanisms if socket connections are unavailable.
*   **Company Explorer**: Entity lookup workspace showcasing featured tickers, search historical structures, and quick-access profiles.
*   **Side-by-Side Comparator**: Evaluates structural metrics, momentum shifts, and risk profiles between two companies concurrently.
*   **Client-Side Trie Search**: Fast auto-complete search bar powered by an in-memory **Trie data structure** indexing company names and tickers.
*   **Command Palette (`Cmd + K`)**: Keyboard-friendly navigation hub to traverse pages, search entities, and toggle dark/light theme contexts instantly.
*   **Premium Interactive Design**: Glassmorphic UI featuring custom 3D card tilt effects, confidence score rings, SVG sparklines, and theme transitions.

---

## 🛠️ Technology Stack

*   **Core**: React, Vite, ES Modules.
*   **Animations**: Framer Motion (for smooth component collapses, list enters, and layout transitions).
*   **Styling**: Vanilla CSS with custom theme variables.
*   **State / Context**: Single source of truth context provider for theme configuration (`useTheme`) and breakpoints (`useWindowWidth`).
*   **Backend Interface**: FastAPI connection via WebSocket and HTTP endpoints.

---

## 📂 Project Structure

The project follows a clean, decoupled component architecture:

```text
src/
├── components/
│   ├── layout/       # Global shells (Nav, Footer, ScrollProgress, CommandPalette)
│   ├── ui/           # Reusable UI Primitives, Cards, and SearchBar
│   └── company/      # Company-specific views (CompanyProfile, StructuralHealthCard, AnalogCard)
├── hooks/            # Custom hooks (useTheme, useWindowWidth)
├── layouts/          # Root page shells (MainLayout)
├── pages/            # Page routers (HomePage, AnalysisPage, ComparePage, WatchlistPage, UpgradePage)
├── styles/           # CSS animation assets, theme tokens, and data models
├── App.jsx           # Router declarations
└── main.jsx          # Entrypoint
```

---

## 🚀 Getting Started

### Prerequisites

*   Node.js (v18 or higher)
*   npm or yarn

### Installation

1.  **Clone the repository** and navigate to the frontend directory:
    ```bash
    cd frontend
    ```

2.  **Install dependencies**:
    ```bash
    npm install
    ```

3.  **Configure environment variables**:
    Create a `.env` file in the root directory:
    ```env
    VITE_API_URL=http://localhost:8000
    ```

4.  **Start the development server**:
    ```bash
    npm run dev
    ```

5.  **Build for production**:
    ```bash
    npm run build
    ```

---

## 💡 Portability & Server Configuration

To prevent build issues when deploying on Linux-based container platforms (Netlify, Vercel, AWS Amplify, Docker), the project enforces **Strict PascalCase file naming conventions** matching all ES imports.
