import express from 'express';
import jwt from 'jsonwebtoken';

const app = express();
const PORT = 3001;
const JWT_SECRET = 'your-secret-key-change-in-production';

app.use(express.json());

// Mock user database
const mockUsers = [
  { id: '1', email: 'student@example.com', password: 'password123' },
  { id: '2', email: 'test@example.com', password: 'test123' },
];

// Mock exams database
const mockExams = [
  {
    id: 'exam-1',
    name: 'Mathematics Final Exam',
    durationSeconds: 3600, // 1 hour
  },
  {
    id: 'exam-2',
    name: 'Science Quiz',
    durationSeconds: 1800, // 30 minutes
  },
  {
    id: 'exam-3',
    name: 'History Test',
    durationSeconds: 2700, // 45 minutes
  },
];

// Mock exam details
const mockExamDetails: Record<string, {
  examName: string;
  startUrl: string;
  allowedDomains: string[];
  durationSeconds: number;
}> = {
  'exam-1': {
    examName: 'Mathematics Final Exam',
    startUrl: 'https://lms.example.edu/exam/math-final',
    allowedDomains: ['lms.example.edu', 'cdn.example.edu'],
    durationSeconds: 3600,
  },
  'exam-2': {
    examName: 'Science Quiz',
    startUrl: 'https://exam.example.com/science-quiz',
    allowedDomains: ['exam.example.com', 'lms.example.edu'],
    durationSeconds: 1800,
  },
  'exam-3': {
    examName: 'History Test',
    startUrl: 'https://lms.example.edu/exam/history',
    allowedDomains: ['lms.example.edu'],
    durationSeconds: 2700,
  },
};

// Middleware to verify JWT
const verifyToken = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const token = authHeader.substring(7);
  try {
    jwt.verify(token, JWT_SECRET);
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

// POST /auth/login
app.post('/auth/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const user = mockUsers.find((u) => u.email === email && u.password === password);

  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, {
    expiresIn: '24h',
  });

  res.json({
    token,
    user: {
      id: user.id,
      email: user.email,
    },
  });
});

// GET /exam/list
app.get('/exam/list', verifyToken, (req, res) => {
  res.json(mockExams);
});

// GET /exam/:id
app.get('/exam/:id', verifyToken, (req, res) => {
  const { id } = req.params;
  const examDetails = mockExamDetails[id];

  if (!examDetails) {
    return res.status(404).json({ error: 'Exam not found' });
  }

  res.json(examDetails);
});

// POST /exam/:id/events
app.post('/exam/:id/events', verifyToken, (req, res) => {
  const { id } = req.params;
  const event = req.body;

  // In a real implementation, you would save this to a database
  console.log(`[Event Log] Exam ${id}:`, event);

  res.json({ success: true, message: 'Event logged' });
});

app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
  console.log('Mock credentials:');
  console.log('  Email: student@example.com, Password: password123');
  console.log('  Email: test@example.com, Password: test123');
});

