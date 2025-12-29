# Project File Structure

```
Lockdown Browser/
├── .eslintrc.json              # ESLint configuration
├── .gitignore                  # Git ignore rules
├── .prettierrc                 # Prettier configuration
├── electron-builder.yml       # Electron Builder config (alternative)
├── package.json                # Project dependencies and scripts
├── README.md                   # Main documentation
├── tsconfig.json               # TypeScript config for renderer
├── tsconfig.main.json          # TypeScript config for main process
├── vite.config.ts              # Vite configuration
│
├── src/
│   ├── main/                   # Electron main process
│   │   ├── index.ts            # Main entry point, window creation, IPC handlers
│   │   ├── examWindowManager.ts # Exam window controls, domain allowlist, restrictions
│   │   ├── eventLogger.ts      # Event logging to file and backend
│   │   └── preload.ts          # Preload script (exposes Electron API to renderer)
│   │
│   ├── renderer/               # React renderer process
│   │   ├── index.html          # HTML entry point
│   │   ├── main.tsx            # React entry point
│   │   ├── index.css           # Global styles
│   │   ├── App.tsx              # Main app component with routing
│   │   │
│   │   ├── pages/              # React pages
│   │   │   ├── Login.tsx       # Login page component
│   │   │   ├── Login.css       # Login styles
│   │   │   ├── Dashboard.tsx   # Dashboard (exam list) component
│   │   │   ├── Dashboard.css   # Dashboard styles
│   │   │   ├── Exam.tsx        # Exam page component (webview + timer)
│   │   │   └── Exam.css        # Exam page styles
│   │   │
│   │   ├── api/                # API client
│   │   │   └── client.ts       # API functions (login, getExams, getExamDetails)
│   │   │
│   │   ├── hooks/              # React hooks
│   │   │   └── useAuth.ts      # Authentication hook (token management)
│   │   │
│   │   └── types/              # TypeScript type definitions
│   │       └── electron.d.ts   # Electron API type definitions
│   │
│   └── backend/                # Mock backend server
│       └── server.ts           # Express server with mock endpoints
│
├── dist/                       # Build output (generated)
│   ├── main/                   # Compiled main process
│   │   ├── index.js
│   │   ├── examWindowManager.js
│   │   ├── eventLogger.js
│   │   └── preload.js
│   └── renderer/               # Built renderer (React app)
│       ├── index.html
│       └── assets/
│
└── release/                    # Packaged applications (generated)
    └── [platform-specific packages]
```

## Key Files Explained

### Main Process (`src/main/`)

- **index.ts**: Entry point for Electron. Creates main window, sets up IPC handlers, manages app lifecycle.
- **examWindowManager.ts**: Core exam window logic:
  - Creates fullscreen/kiosk exam windows
  - Enforces domain allowlist via `session.webRequest`
  - Blocks shortcuts, copy/paste, printing
  - Handles focus loss/gain
- **eventLogger.ts**: Logs events to local JSON file and optionally to backend API.
- **preload.ts**: Bridge between main and renderer processes. Exposes safe Electron API to renderer.

### Renderer Process (`src/renderer/`)

- **App.tsx**: React Router setup with protected routes.
- **pages/Login.tsx**: Authentication UI.
- **pages/Dashboard.tsx**: Lists available exams, "Start Exam" buttons.
- **pages/Exam.tsx**: Exam interface with:
  - Status bar (exam name, timer, submit button)
  - Webview for exam content
  - Focus overlay
- **api/client.ts**: API client functions for backend communication.
- **hooks/useAuth.ts**: Manages JWT token in localStorage.

### Backend (`src/backend/`)

- **server.ts**: Express server with mock endpoints:
  - `POST /auth/login` - Authentication
  - `GET /exam/list` - List exams
  - `GET /exam/:id` - Get exam details
  - `POST /exam/:id/events` - Log events

## Build Output

After running `npm run build`:
- Main process TypeScript → `dist/main/*.js`
- Renderer React app → `dist/renderer/` (HTML + bundled JS/CSS)

After running `npm run package`:
- Platform-specific installers → `release/`

