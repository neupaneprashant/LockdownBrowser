import { BrowserWindow, session, WebContents } from 'electron';
import * as path from 'path';
import { EventLogger } from './eventLogger';
import { ExamData } from './index';

export class ExamWindowManager {
  private examWindows: Map<string, BrowserWindow> = new Map();
  private examDataMap: Map<string, ExamData> = new Map();
  private blockedSessions: Map<string, Electron.Session> = new Map();

  constructor(private eventLogger: EventLogger) {}

  openExamWindow(examId: string, examData: ExamData): string {
    // Close existing window for this exam if any
    this.closeExamWindow(examId);

    // Create a new session for this exam to enforce domain allowlist
    const examSession = session.fromPartition(`persist:exam-${examId}`);

    // Set up domain allowlist enforcement
    this.setupDomainAllowlist(examSession, examId, examData.allowedDomains);

    // Create the exam window
    const examWindow = new BrowserWindow({
      fullscreen: true,
      kiosk: true,
      frame: false,
      alwaysOnTop: true,
      webPreferences: {
        preload: path.join(__dirname, 'preload.js'),
        nodeIntegration: false,
        contextIsolation: true,
        session: examSession,
        webviewTag: true,
      },
    });

    // Disable menu bar
    examWindow.setMenuBarVisibility(false);

    // Prevent DevTools
    examWindow.webContents.on('devtools-opened', () => {
      examWindow.webContents.closeDevTools();
    });

    // Block common shortcuts
    this.blockShortcuts(examWindow);

    // Block copy/paste and other restrictions
    this.setupContentRestrictions(examWindow);

    // Block new windows and popups
    examWindow.webContents.setWindowOpenHandler(() => {
      this.eventLogger.logEvent({
        type: 'popup_blocked',
        examId,
        timestamp: Date.now(),
      });
      return { action: 'deny' };
    });

    // Handle focus loss
    examWindow.on('blur', () => {
      this.handleFocusLoss(examId);
    });

    examWindow.on('focus', () => {
      this.handleFocusGain(examId);
    });

    // Load the exam route
    const isDev = process.env.NODE_ENV === 'development';
    const examUrl = isDev
      ? `http://localhost:3000/exam/${examId}`
      : `file://${path.join(__dirname, '../renderer/index.html')}#/exam/${examId}`;

    examWindow.loadURL(examUrl);

    // Store references
    this.examWindows.set(examId, examWindow);
    this.examDataMap.set(examId, examData);
    this.blockedSessions.set(examId, examSession);

    // Log exam start
    this.eventLogger.logEvent({
      type: 'exam_started',
      examId,
      timestamp: Date.now(),
      data: { examName: examData.examName },
    });

    examWindow.on('closed', () => {
      this.examWindows.delete(examId);
      this.examDataMap.delete(examId);
      this.blockedSessions.delete(examId);
    });

    return examWindow.id.toString();
  }

  closeExamWindow(examId: string): void {
    const window = this.examWindows.get(examId);
    if (window) {
      window.close();
      this.examWindows.delete(examId);
      this.examDataMap.delete(examId);
      this.blockedSessions.delete(examId);
    }
  }

  getWindowId(examId: string): number | null {
    const window = this.examWindows.get(examId);
    return window ? window.id : null;
  }

  getExamData(examId: string): ExamData | undefined {
    return this.examDataMap.get(examId);
  }

  private setupDomainAllowlist(
    examSession: Electron.Session,
    examId: string,
    allowedDomains: string[]
  ): void {
    examSession.webRequest.onBeforeRequest(
      { urls: ['<all_urls>'] },
      (details, callback) => {
        const url = new URL(details.url);
        const hostname = url.hostname;

        // Check if the hostname is in the allowlist
        const isAllowed = allowedDomains.some((domain) => {
          // Support exact match and subdomain matching
          return hostname === domain || hostname.endsWith(`.${domain}`);
        });

        if (!isAllowed) {
          // Block the request
          this.eventLogger.logEvent({
            type: 'blocked_url_attempt',
            examId,
            timestamp: Date.now(),
            data: { url: details.url, hostname },
          });

          // Redirect to blocked page
          callback({
            redirectURL: `data:text/html;charset=utf-8,${encodeURIComponent(
              this.getBlockedPageHtml(details.url)
            )}`,
          });
        } else {
          callback({});
        }
      }
    );
  }

  private getBlockedPageHtml(blockedUrl: string): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Access Blocked</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100vh;
      margin: 0;
      background: #f5f5f5;
    }
    .container {
      text-align: center;
      padding: 40px;
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
      max-width: 600px;
    }
    h1 { color: #d32f2f; }
    .url { 
      word-break: break-all; 
      color: #666; 
      margin: 20px 0;
      padding: 10px;
      background: #f5f5f5;
      border-radius: 4px;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>Access Blocked</h1>
    <p>This URL is not allowed during the exam.</p>
    <div class="url">${blockedUrl}</div>
    <p>Please return to the exam content.</p>
  </div>
</body>
</html>
    `;
  }

  private blockShortcuts(window: BrowserWindow): void {
    window.webContents.on('before-input-event', (event, input) => {
      const isMac = process.platform === 'darwin';
      const ctrlOrCmd = isMac ? input.meta : input.control;
      const shift = input.shift;
      const key = input.key.toLowerCase();

      // Block shortcuts
      const blocked = 
        // DevTools
        (ctrlOrCmd && shift && (key === 'i' || key === 'c')) ||
        (key === 'f12') ||
        // Navigation
        (ctrlOrCmd && key === 'l') ||
        (ctrlOrCmd && key === 't') ||
        (ctrlOrCmd && key === 'n') ||
        // Print/Save
        (ctrlOrCmd && key === 'p') ||
        (ctrlOrCmd && key === 's') ||
        // View source
        (ctrlOrCmd && key === 'u') ||
        // Window management
        (ctrlOrCmd && key === 'w') ||
        (ctrlOrCmd && key === 'q') ||
        // Refresh (optional - can be commented out if needed)
        (ctrlOrCmd && key === 'r') ||
        (ctrlOrCmd && shift && key === 'r');

      if (blocked) {
        event.preventDefault();
        this.eventLogger.logEvent({
          type: 'shortcut_blocked',
          timestamp: Date.now(),
          data: { 
            shortcut: `${ctrlOrCmd ? (isMac ? 'Cmd' : 'Ctrl') : ''}${shift ? '+Shift' : ''}+${input.key}`,
            key: input.key,
            code: input.code,
          },
        });
      }
    });
  }

  private handleFocusLoss(examId: string): void {
    this.eventLogger.logEvent({
      type: 'focus_lost',
      examId,
      timestamp: Date.now(),
    });

    const window = this.examWindows.get(examId);
    if (window) {
      // Send IPC message to renderer to show overlay
      window.webContents.send('exam-focus-lost');
    }
  }

  private handleFocusGain(examId: string): void {
    this.eventLogger.logEvent({
      type: 'focus_gained',
      examId,
      timestamp: Date.now(),
    });

    const window = this.examWindows.get(examId);
    if (window) {
      window.webContents.send('exam-focus-gained');
    }
  }

  private setupContentRestrictions(window: BrowserWindow): void {
    // Inject restrictions when DOM is ready
    window.webContents.on('dom-ready', () => {
      window.webContents.executeJavaScript(`
        // Block right-click context menu
        document.addEventListener('contextmenu', (e) => {
          e.preventDefault();
          return false;
        }, true);

        // Block copy
        document.addEventListener('copy', (e) => {
          e.preventDefault();
          return false;
        }, true);

        // Block cut
        document.addEventListener('cut', (e) => {
          e.preventDefault();
          return false;
        }, true);

        // Block paste
        document.addEventListener('paste', (e) => {
          e.preventDefault();
          return false;
        }, true);

        // Block print
        window.addEventListener('beforeprint', (e) => {
          e.preventDefault();
          return false;
        });

        // Block print dialog shortcut
        document.addEventListener('keydown', (e) => {
          if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
            e.preventDefault();
            return false;
          }
        }, true);

        // Block save page
        document.addEventListener('keydown', (e) => {
          if ((e.ctrlKey || e.metaKey) && e.key === 's') {
            e.preventDefault();
            return false;
          }
        }, true);

        // Block text selection (optional - can be commented out if needed)
        // document.addEventListener('selectstart', (e) => {
        //   e.preventDefault();
        //   return false;
        // }, true);
      `);
    });
  }
}

