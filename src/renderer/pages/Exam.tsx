import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getExamDetails } from '../api/client';
import { useAuth } from '../hooks/useAuth';
import type { ExamDetails } from '../api/client';
import type { ExamData, LogEvent } from '../types/electron';
import './Exam.css';

export function Exam() {
  const { examId } = useParams<{ examId: string }>();
  const navigate = useNavigate();
  const { getToken } = useAuth();
  const [examData, setExamData] = useState<ExamDetails | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [showFocusOverlay, setShowFocusOverlay] = useState(false);
  const webviewRef = useRef<HTMLWebViewElement>(null);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!examId) {
      navigate('/dashboard');
      return;
    }

    loadExamData();

    // Set up focus listeners if in Electron
    if (window.electronAPI) {
      window.electronAPI.onExamFocusLost(() => {
        setShowFocusOverlay(true);
      });

      window.electronAPI.onExamFocusGained(() => {
        setShowFocusOverlay(false);
      });
    }

    return () => {
      if (window.electronAPI) {
        window.electronAPI.removeExamFocusListeners();
      }
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, [examId, navigate]);

  useEffect(() => {
    if (examData && window.electronAPI) {
      // Open exam window in Electron
      // The exam window will be a separate BrowserWindow in fullscreen/kiosk mode
      window.electronAPI
        .openExamWindow(examId!, examData)
        .then(() => {
          // Exam window is now open in fullscreen
          // This renderer window can remain open as a control window if needed
          // or can be hidden/minimized
        })
        .catch((err) => {
          console.error('Failed to open exam window:', err);
        });
    }
  }, [examData, examId]);

  useEffect(() => {
    if (examData && examData.durationSeconds > 0) {
      setTimeRemaining(examData.durationSeconds);
      timerIntervalRef.current = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            handleTimeUp();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, [examData]);

  const loadExamData = async () => {
    try {
      const token = getToken();
      if (!token) {
        navigate('/login');
        return;
      }
      const details = await getExamDetails(examId!, token);
      setExamData(details);
    } catch (err) {
      console.error('Failed to load exam details:', err);
      navigate('/dashboard');
    }
  };

  const handleTimeUp = () => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
    }
    alert('Time is up! The exam will be submitted automatically.');
    handleSubmit();
  };

  const handleSubmit = async () => {
    if (window.electronAPI) {
      await window.electronAPI.logEvent({
        type: 'exam_submitted',
        examId,
        timestamp: Date.now(),
      });
    }

    if (window.electronAPI) {
      // Close exam window
      // Note: In a real implementation, you'd need IPC to close the window
    }

    navigate('/dashboard');
  };

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  if (!examData) {
    return <div className="exam-loading">Loading exam...</div>;
  }

  return (
    <div className="exam-container">
      <div className="exam-status-bar">
        <div className="exam-name">{examData.examName}</div>
        <div className="exam-timer">Time Remaining: {formatTime(timeRemaining)}</div>
        <button onClick={handleSubmit} className="submit-button">
          Submit Exam
        </button>
      </div>

      <div className="exam-content">
        {showFocusOverlay && (
          <div className="focus-overlay">
            <div className="focus-overlay-content">
              <h2>Return to the Exam</h2>
              <p>The exam window lost focus. Please return to continue.</p>
            </div>
          </div>
        )}

        <webview
          ref={webviewRef}
          src={examData.startUrl}
          className="exam-webview"
          allowpopups="false"
          webpreferences="contextIsolation=yes,nodeIntegration=no,disableDialogs=true"
          onNewWindow={(e) => {
            e.preventDefault();
            if (window.electronAPI) {
              window.electronAPI.logEvent({
                type: 'webview_popup_blocked',
                examId,
                timestamp: Date.now(),
                data: { url: e.url },
              });
            }
          }}
        />
      </div>

      {/* Restrict copy/paste and right-click */}
      <div
        className="exam-restrictions"
        onContextMenu={(e) => e.preventDefault()}
        onCopy={(e) => e.preventDefault()}
        onCut={(e) => e.preventDefault()}
        onPaste={(e) => e.preventDefault()}
      />
    </div>
  );
}

