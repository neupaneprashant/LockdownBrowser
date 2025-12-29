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

export interface ElectronAPI {
  openExamWindow: (examId: string, examData: ExamData) => Promise<string>;
  closeExamWindow: (examId: string) => Promise<void>;
  logEvent: (event: LogEvent) => Promise<void>;
  getExamWindowId: (examId: string) => Promise<number | null>;
  onExamFocusLost: (callback: () => void) => void;
  onExamFocusGained: (callback: () => void) => void;
  removeExamFocusListeners: () => void;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}

