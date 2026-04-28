import type { Need, Volunteer, Match, FieldReport, DashboardStats, InsightCluster } from './types';

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '';

// Helper function for API calls
async function apiCall<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  const token =
    typeof window !== 'undefined' ? window.localStorage.getItem('volunteeriq_token') : null;
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options?.headers,
    },
    ...options,
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }

  return response.json();
}

// Dashboard endpoints
export async function getDashboardStats(): Promise<DashboardStats> {
  return apiCall<DashboardStats>('/api/stats');
}

// Needs endpoints
export async function getNeeds(filters?: {
  category?: string;
  minUrgency?: number;
  status?: string;
}): Promise<Need[]> {
  const params = new URLSearchParams();
  if (filters?.category) params.append('category', filters.category);
  if (filters?.minUrgency) params.append('min_urgency', filters.minUrgency.toString());
  if (filters?.status) params.append('status', filters.status);

  const queryString = params.toString();
  const endpoint = queryString ? `/api/needs?${queryString}` : '/api/needs';
  return apiCall<Need[]>(endpoint);
}

export async function getNeed(id: string): Promise<Need> {
  return apiCall<Need>(`/api/needs/${id}`);
}

export async function createNeed(need: Omit<Need, 'id' | 'createdAt' | 'assignedVolunteers'>): Promise<Need> {
  return apiCall<Need>('/api/needs', {
    method: 'POST',
    body: JSON.stringify(need),
  });
}

export async function updateNeed(id: string, updates: Partial<Need>): Promise<Need> {
  return apiCall<Need>(`/api/needs/${id}`, {
    method: 'PUT',
    body: JSON.stringify(updates),
  });
}

// Volunteers endpoints
export async function getVolunteers(filters?: {
  availability?: string;
  skills?: string[];
}): Promise<Volunteer[]> {
  const params = new URLSearchParams();
  if (filters?.availability) params.append('status', filters.availability);
  if (filters?.skills?.[0]) params.append('skill', filters.skills[0]);

  const queryString = params.toString();
  const endpoint = queryString ? `/api/volunteers?${queryString}` : '/api/volunteers';
  const data = await apiCall<Volunteer[] | { volunteers: Volunteer[] }>(endpoint);
  if (Array.isArray(data)) return data;

  return data.volunteers.map((volunteer: any) => ({
    id: volunteer.id,
    name: volunteer.name,
    email: volunteer.email || '',
    phone: volunteer.phone || '',
    skills: volunteer.skills || [],
    availability:
      volunteer.status === 'available'
        ? 'available'
        : volunteer.status === 'busy'
          ? 'limited'
          : 'unavailable',
    location: {
      latitude: Number(volunteer.lat || 0),
      longitude: Number(volunteer.lng || 0),
      address: volunteer.zoneId || 'Field location',
    },
    hoursAvailable: volunteer.hoursAvailable || (volunteer.status === 'available' ? 8 : 2),
    assignedNeeds: volunteer.assignedNeeds || [],
    totalHours: volunteer.totalHours || Number(volunteer.tasksCompleted || 0) * 4,
    createdAt: volunteer.createdAt,
  }));
}

export async function getVolunteer(id: string): Promise<Volunteer> {
  return apiCall<Volunteer>(`/api/volunteers/${id}`);
}

// Matching endpoints
export async function getMatches(needId: string): Promise<Match[]> {
  return apiCall<Match[]>(`/api/matches?need_id=${needId}`);
}

export async function createAssignment(needId: string, volunteerId: string): Promise<{
  success: boolean;
  message: string;
}> {
  return apiCall<{ success: boolean; message: string }>('/api/assignments', {
    method: 'POST',
    body: JSON.stringify({ need_id: needId, volunteer_id: volunteerId }),
  });
}

// Field report endpoints
export async function uploadFieldReport(report: Omit<FieldReport, 'id' | 'extractedNeeds' | 'urgencyLevel'>): Promise<FieldReport> {
  return apiCall<FieldReport>('/api/field-reports', {
    method: 'POST',
    body: JSON.stringify(report),
  });
}

// Insights endpoints
export async function getInsightsClusters(): Promise<InsightCluster[]> {
  return apiCall<InsightCluster[]>('/api/insights/clusters');
}

export async function getLeaderboard(): Promise<Array<{
  volunteerId: string;
  name: string;
  hoursServed: number;
  tasksCompleted: number;
}>> {
  return apiCall('/api/insights/leaderboard');
}
