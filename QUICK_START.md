# Quick Start Guide

## First Time Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start development:**
   ```bash
   npm run dev
   ```
   
   This will start:
   - Electron main process (watch mode)
   - Vite dev server for React (port 3000)
   - Mock backend server (port 3001)

3. **Login:**
   - Email: `student@example.com`
   - Password: `password123`

4. **Start an exam:**
   - Click "Start Exam" on any exam from the dashboard
   - Exam window opens in fullscreen/kiosk mode
   - Webview loads the exam URL
   - Timer counts down
   - Click "Submit Exam" when done

## Testing Features

### Domain Allowlist
- Try navigating to a non-allowed domain in the webview
- You should see "Access Blocked" page
- Check `{userData}/exam-events.json` for logged events

### Restrictions
- Try right-clicking → Context menu blocked
- Try Ctrl+C / Cmd+C → Copy blocked
- Try Ctrl+P / Cmd+P → Print blocked
- Try F12 or Ctrl+Shift+I → DevTools blocked

### Focus Protection
- Click outside the exam window (if possible)
- Overlay should appear: "Return to the exam"
- Event logged in `exam-events.json`

### Event Logging
- Check event logs: `{userData}/exam-events.json`
- Location: 
  - macOS: `~/Library/Application Support/exam-browser/exam-events.json`
  - Windows: `%APPDATA%/exam-browser/exam-events.json`
  - Linux: `~/.config/exam-browser/exam-events.json`

## Building for Production

```bash
# Build the application
npm run build

# Package for your platform
npm run package
```

## Common Issues

**Backend not starting:**
- Check if port 3001 is available
- Verify `tsx` is installed: `npm install -g tsx` (or use npx)

**Exam window doesn't open:**
- Check Electron console for errors
- Verify `window.electronAPI` is available
- Check that exam data loaded correctly

**Domain allowlist not working:**
- Verify exam session is created
- Check main process console for webRequest logs
- Ensure domain matching logic (exact or subdomain)

**Webview not loading:**
- Verify `webviewTag: true` in webPreferences
- Check that startUrl is accessible
- For local testing, use `http://localhost` URLs

## Development Tips

- Main process logs: Check Electron DevTools console
- Renderer logs: Check browser DevTools (enabled in dev mode)
- Backend logs: Check terminal running `npm run dev:backend`
- Event logs: Check `exam-events.json` file

## Next Steps

- Replace mock backend with real API
- Add more exam types/configurations
- Customize UI/UX
- Add additional security features as needed
- Configure Electron Builder for distribution

