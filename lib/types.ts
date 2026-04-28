export interface Need {
  id: string;
  title: string;
  description: string;
  category: 'Medical' | 'Rescue' | 'Food' | 'Shelter' | 'Other';
  urgency: number; // 1-10 scale
  location: {
    latitude: number;
    longitude: number;
    address: string;
  };
  requiredSkills: string[];
  volunteersNeeded: number;
  status: 'open' | 'assigned' | 'completed' | 'closed';
  createdAt: string;
  deadline: string;
  assignedVolunteers: string[];
}

export interface Volunteer {
  id: string;
  name: string;
  email: string;
  phone: string;
  skills: string[];
  availability: 'available' | 'limited' | 'unavailable';
  location: {
    latitude: number;
    longitude: number;
    address: string;
  };
  hoursAvailable: number;
  assignedNeeds: string[];
  totalHours: number;
  createdAt: string;
}

export interface Match {
  needId: string;
  volunteerId: string;
  score: number;
  distanceKm: number;
  skillMatch: number;
  availabilityMatch: number;
  urgencyMatch: number;
}

export interface FieldReport {
  id: string;
  title: string;
  description: string;
  location: {
    latitude: number;
    longitude: number;
    address: string;
  };
  timestamp: string;
  extractedNeeds: string[];
  urgencyLevel: number;
  imageUrl?: string;
}

export interface InsightCluster {
  id: string;
  name: string;
  location: {
    latitude: number;
    longitude: number;
  };
  needCount: number;
  urgencyScore: number;
  assignmentRate: number;
  coordinatesLng: number[];
  coordinatesLat: number[];
}

export interface DashboardStats {
  totalNeeds: number;
  assignedNeeds: number;
  totalVolunteers: number;
  activeVolunteers: number;
  completedTasks: number;
  urgentCount: number;
  averageUrgency: number;
  assignmentRate: number;
}
