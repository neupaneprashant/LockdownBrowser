import { app } from 'electron';
import * as fs from 'fs';
import * as path from 'path';
import { LogEvent } from './index';

export class EventLogger {
  private logFilePath: string;

  constructor() {
    const userDataPath = app.getPath('userData');
    this.logFilePath = path.join(userDataPath, 'exam-events.json');
    this.ensureLogFile();
  }

  private ensureLogFile(): void {
    if (!fs.existsSync(this.logFilePath)) {
      fs.writeFileSync(this.logFilePath, JSON.stringify([], null, 2));
    }
  }

  logEvent(event: LogEvent): void {
    try {
      const events = this.readEvents();
      events.push(event);
      fs.writeFileSync(this.logFilePath, JSON.stringify(events, null, 2));

      // Also attempt to send to backend (stub)
      this.sendToBackend(event).catch((err) => {
        console.error('Failed to send event to backend:', err);
      });
    } catch (error) {
      console.error('Failed to log event:', error);
    }
  }

  private readEvents(): LogEvent[] {
    try {
      const content = fs.readFileSync(this.logFilePath, 'utf-8');
      return JSON.parse(content);
    } catch {
      return [];
    }
  }

  private async sendToBackend(event: LogEvent): Promise<void> {
    // Stub: In production, this would POST to the backend
    if (event.examId) {
      const backendUrl = `http://localhost:3001/exam/${event.examId}/events`;
      try {
        await fetch(backendUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(event),
        });
      } catch (error) {
        // Backend might not be running, that's OK for mock
        console.log('Backend not available, event logged locally only');
      }
    }
  }
}

