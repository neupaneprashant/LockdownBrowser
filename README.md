# Exam Browser

A desktop application built with Electron + React + TypeScript for secure exam-taking environments. This application provides controlled browser functionality with domain allowlisting, focus protection, and event logging.

## ⚠️ Important Security Notes

This application implements **app-level controls only**. It does NOT:
- Record webcam/microphone
- Perform keylogging outside the app
- Install OS-level monitoring
- Access files outside the application scope
- Perform any hidden or non-consent-based monitoring

All restrictions are transparent and apply only within the exam window. The application logs events locally and optionally to a backend API.

## Project Structure

```
├── src/
│   ├── main/              # Electron main process
│   │   ├── index.ts       # Main entry point
│   │   ├── examWindowManager.ts  # Exam window controls
│   │   ├── eventLogger.ts        # Event logging
│   │   └── preload.ts            # Preload script
│   ├── renderer/          # React renderer process
│   │   ├── pages/         # React pages (Login, Dashboard, Exam)
│   │   ├── api/           # API client
│   │   ├── hooks/         # React hooks
│   │   └── types/         # TypeScript types
│   └── backend/           # Mock backend server
│       └── server.ts      # Express API server
├── dist/                  # Build output
└── release/               # Packaged applications
```

## Prerequisites

- Node.js 18+ and npm
- macOS or Windows (for packaging)

## Installation

1. Install dependencies:
```bash
npm install
```

## Development

Run the application in development mode:

```bash
npm run dev
```

This command will:
- Start the Electron main process in watch mode
- Start the Vite dev server for the renderer (React)
- Start the mock backend server on port 3001

The application will open automatically. Use these mock credentials:
- Email: `student@example.com`, Password: `password123`
- Email: `test@example.com`, Password: `test123`

## Building

Build the application for production:

```bash
npm run build
```

This compiles:
- Main process TypeScript → `dist/main/`
- Renderer React app → `dist/renderer/`

## Packaging

Package the application for distribution:

```bash
# Package for current platform
npm run package

# Package for macOS
npm run package:mac

# Package for Windows
npm run package:win
```

Packaged applications will be in the `release/` directory.

## Features

### 1. Authentication & Routing
- Login page with JWT authentication
- Dashboard listing available exams
- Protected routes requiring authentication

### 2. Exam Window Controls
- **Fullscreen & Kiosk Mode**: Exam windows open in fullscreen with kiosk mode
- **Always on Top**: Exam window stays on top
- **No Menu Bar**: Menu bar is hidden
- **DevTools Blocked**: Developer tools cannot be opened

### 3. Domain Allowlist
- Per-exam domain allowlist enforcement
- Blocks navigation to non-allowed domains
- Shows "Access Blocked" page for blocked URLs
- Works even with redirects

### 4. In-App Restrictions
- **Copy/Cut/Paste**: Disabled via event prevention
- **Right-Click**: Context menu disabled
- **Printing**: Print dialog blocked
- **Saving**: Save page blocked
- **Shortcuts Blocked**: Ctrl+L, Ctrl+T, Ctrl+N, Ctrl+P, Ctrl+Shift+I, F12, etc.

### 5. Focus Loss Protection
- Detects when exam window loses focus
- Shows overlay: "Return to the exam"
- Logs focus loss/gain events

### 6. Event Logging
Events are logged locally to `{userData}/exam-events.json`:
- `exam_started`
- `exam_submitted`
- `focus_lost` / `focus_gained`
- `blocked_url_attempt`
- `shortcut_blocked`
- `popup_blocked`

Events are also sent to backend endpoint: `POST /exam/:id/events`

### 7. Webview Controls
- Embedded webview loads exam start URL
- Status bar with exam name, timer, and submit button
- New windows/popups from webview are blocked
- Domain allowlist enforced at session level

## Backend API

The mock backend provides these endpoints:

- `POST /auth/login` - Authenticate user
- `GET /exam/list` - List available exams (requires auth)
- `GET /exam/:id` - Get exam details (requires auth)
- `POST /exam/:id/events` - Log exam event (requires auth)

### Mock Data

**Exams:**
- Mathematics Final Exam (1 hour)
- Science Quiz (30 minutes)
- History Test (45 minutes)

**Allowed Domains (examples):**
- `lms.example.edu`
- `exam.example.com`
- `cdn.example.edu`

## Configuration

### Environment Variables

- `NODE_ENV=development` - Development mode (enables DevTools in main window)

### Electron Builder

Configuration is in `package.json` under the `build` key. Modify as needed for:
- App ID
- Product name
- Icons
- Platform-specific settings

## Security Limitations

This application provides **app-level security only**. It cannot:

1. **Prevent OS-level actions**: Users can still:
   - Use other applications (Alt+Tab, Cmd+Tab)
   - Take screenshots (OS-level)
   - Use virtual machines
   - Use browser extensions (if allowed by OS)

2. **Network-level restrictions**: The app cannot:
   - Block network traffic at the OS level
   - Prevent VPN usage
   - Control router/firewall settings

3. **Hardware restrictions**: The app cannot:
   - Disable USB devices
   - Block external monitors
   - Control camera/microphone at OS level

**For production use**, consider:
- OS-level policies (Group Policy, MDM)
- Network-level restrictions
- Physical exam environment controls
- Proctoring software (with proper consent)

## Development Notes

### TypeScript Configuration
- Strict mode enabled
- Separate configs for main and renderer
- Type definitions for Electron API

### Code Quality
- ESLint for linting
- Prettier for formatting
- Run `npm run lint` to check code
- Run `npm run format` to format code

### Debugging
- Main process: Check Electron DevTools console
- Renderer: Use browser DevTools (enabled in dev mode)
- Backend: Check terminal output

## Troubleshooting

**Issue**: Exam window doesn't open
- Check that Electron API is available: `window.electronAPI`
- Verify exam data is loaded correctly
- Check main process console for errors

**Issue**: Domain allowlist not working
- Verify exam session is created correctly
- Check `webRequest.onBeforeRequest` logs
- Ensure domains match exactly (including subdomains)

**Issue**: Events not logging
- Check `{userData}/exam-events.json` file
- Verify file permissions
- Check backend connection if using remote logging

## License

MIT

## Support

For issues or questions, please refer to the project documentation or contact the development team.

