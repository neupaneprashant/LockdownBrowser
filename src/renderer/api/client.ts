const API_BASE_URL = 'http://localhost:3001';

export interface LoginResponse {
  token: string;
  user: {
    id: string;
    email: string;
  };
}

export interface Exam {
  id: string;
  name: string;
  durationSeconds: number;
}

export interface ExamDetails {
  examName: string;
  startUrl: string;
  allowedDomains: string[];
  durationSeconds: number;
}

export async function login(email: string, password: string): Promise<LoginResponse> {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    throw new Error('Login failed');
  }

  return response.json();
}

export async function getExams(token: string): Promise<Exam[]> {
  const response = await fetch(`${API_BASE_URL}/exam/list`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch exams');
  }

  return response.json();
}

export async function getExamDetails(examId: string, token: string): Promise<ExamDetails> {
  const response = await fetch(`${API_BASE_URL}/exam/${examId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch exam details');
  }

  return response.json();
}

