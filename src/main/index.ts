import { app, BrowserWindow, ipcMain, session } from 'electron';
import * as path from 'path';
import { EventLogger } from './eventLogger';
import { ExamWindowManager } from './examWindowManager';

let mainWindow: BrowserWindow | null = null;
let examWindows: Map<string, BrowserWindow> = new Map();
const eventLogger = new EventLogger();
const examWindowManager = new ExamWindowManager(eventLogger);

function createMainWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  const isDev = process.env.NODE_ENV === 'development';
  if (isDev) {
    mainWindow.loadURL('http://localhost:3000');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  createMainWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// IPC Handlers
ipcMain.handle('open-exam-window', async (_, examId: string, examData: ExamData) => {
  return examWindowManager.openExamWindow(examId, examData);
});

ipcMain.handle('close-exam-window', async (_, examId: string) => {
  return examWindowManager.closeExamWindow(examId);
});

ipcMain.handle('log-event', async (_, event: LogEvent) => {
  eventLogger.logEvent(event);
});

ipcMain.handle('get-exam-window-id', async (_, examId: string) => {
  return examWindowManager.getWindowId(examId);
});

export interface ExamData {
  examName: string;
  startUrl: string;
  allowedDomains: string[];
  durationSeconds: number;
}

export interface LogEvent {
  type: string;
  examId?: string;
  timestamp: number;
  data?: Record<string, unknown>;
}

