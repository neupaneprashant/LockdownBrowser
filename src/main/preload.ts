import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  openExamWindow: (examId: string, examData: ExamData) =>
    ipcRenderer.invoke('open-exam-window', examId, examData),
  closeExamWindow: (examId: string) => ipcRenderer.invoke('close-exam-window', examId),
  logEvent: (event: LogEvent) => ipcRenderer.invoke('log-event', event),
  getExamWindowId: (examId: string) => ipcRenderer.invoke('get-exam-window-id', examId),
  onExamFocusLost: (callback: () => void) => {
    ipcRenderer.on('exam-focus-lost', callback);
  },
  onExamFocusGained: (callback: () => void) => {
    ipcRenderer.on('exam-focus-gained', callback);
  },
  removeExamFocusListeners: () => {
    ipcRenderer.removeAllListeners('exam-focus-lost');
    ipcRenderer.removeAllListeners('exam-focus-gained');
  },
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

