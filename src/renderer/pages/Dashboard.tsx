import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getExams } from '../api/client';
import { useAuth } from '../hooks/useAuth';
import type { Exam } from '../api/client';
import './Dashboard.css';

export function Dashboard() {
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { getToken, removeToken } = useAuth();

  useEffect(() => {
    loadExams();
  }, []);

  const loadExams = async () => {
    try {
      const token = getToken();
      if (!token) {
        navigate('/login');
        return;
      }
      const examList = await getExams(token);
      setExams(examList);
    } catch (err) {
      setError('Failed to load exams');
    } finally {
      setLoading(false);
    }
  };

  const handleStartExam = (examId: string) => {
    // Open exam window via Electron
    if (window.electronAPI) {
      // We'll get exam details and open the window from the Exam component
      navigate(`/exam/${examId}`);
    } else {
      // Fallback for web testing
      navigate(`/exam/${examId}`);
    }
  };

  const handleLogout = () => {
    removeToken();
    navigate('/login');
  };

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>Available Exams</h1>
        <button onClick={handleLogout} className="logout-button">
          Logout
        </button>
      </div>

      {loading && <div className="loading">Loading exams...</div>}
      {error && <div className="error-message">{error}</div>}

      <div className="exams-grid">
        {exams.map((exam) => (
          <div key={exam.id} className="exam-card">
            <h3>{exam.name}</h3>
            <p className="exam-duration">Duration: {formatDuration(exam.durationSeconds)}</p>
            <button
              onClick={() => handleStartExam(exam.id)}
              className="start-exam-button"
            >
              Start Exam
            </button>
          </div>
        ))}
      </div>

      {!loading && exams.length === 0 && (
        <div className="no-exams">No exams available</div>
      )}
    </div>
  );
}

