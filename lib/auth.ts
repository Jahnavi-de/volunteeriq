import { API_BASE_URL } from './api';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt?: string;
}

export interface AuthResponse {
  token: string;
  user: AuthUser;
}

async function authRequest(endpoint: string, body: Record<string, unknown>): Promise<AuthResponse> {
  const response = await fetch(`${API_BASE_URL}/api/auth/${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || `Auth error: ${response.status}`);
  }

  return data;
}

export async function login(email: string, password: string): Promise<AuthResponse> {
  return authRequest('login', { email, password });
}

export async function register(
  name: string,
  email: string,
  password: string,
  role = 'coordinator'
): Promise<AuthResponse> {
  return authRequest('register', { name, email, password, role });
}

export function saveSession(session: AuthResponse) {
  window.localStorage.setItem('volunteeriq_token', session.token);
  window.localStorage.setItem('volunteeriq_user', JSON.stringify(session.user));
  window.dispatchEvent(new Event('volunteeriq_session_changed'));
}

export function getSessionUser(): AuthUser | null {
  if (typeof window === 'undefined') return null;
  const rawUser = window.localStorage.getItem('volunteeriq_user');
  if (!rawUser) return null;

  try {
    return JSON.parse(rawUser) as AuthUser;
  } catch {
    return null;
  }
}

export function clearSession() {
  window.localStorage.removeItem('volunteeriq_token');
  window.localStorage.removeItem('volunteeriq_user');
  window.dispatchEvent(new Event('volunteeriq_session_changed'));
}
