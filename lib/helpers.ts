export function getCategoryColor(category: string): string {
  switch (category.toLowerCase()) {
    case 'medical':
      return 'bg-[oklch(0.60_0.25_15)]';
    case 'rescue':
      return 'bg-[oklch(0.58_0.24_35)]';
    case 'food':
      return 'bg-[oklch(0.65_0.23_60)]';
    case 'shelter':
      return 'bg-[oklch(0.50_0.25_195)]';
    default:
      return 'bg-slate-600';
  }
}

export function getCategoryTextColor(category: string): string {
  switch (category.toLowerCase()) {
    case 'medical':
      return 'text-[oklch(0.60_0.25_15)]';
    case 'rescue':
      return 'text-[oklch(0.58_0.24_35)]';
    case 'food':
      return 'text-[oklch(0.65_0.23_60)]';
    case 'shelter':
      return 'text-[oklch(0.50_0.25_195)]';
    default:
      return 'text-slate-400';
  }
}

export function getUrgencyColor(urgency: number): string {
  if (urgency >= 7) return 'bg-[oklch(0.60_0.25_15)]'; // red for urgent
  if (urgency >= 4) return 'bg-[oklch(0.65_0.23_60)]'; // amber for moderate
  return 'bg-[oklch(0.65_0.20_120)]'; // green for low
}

export function getUrgencyTextColor(urgency: number): string {
  if (urgency >= 7) return 'text-[oklch(0.60_0.25_15)]';
  if (urgency >= 4) return 'text-[oklch(0.65_0.23_60)]';
  return 'text-[oklch(0.65_0.20_120)]';
}

export function getStatusBadgeColor(status: string): string {
  switch (status) {
    case 'completed':
      return 'bg-green-900/30 text-green-300 border-green-700/50';
    case 'assigned':
      return 'bg-blue-900/30 text-blue-300 border-blue-700/50';
    case 'open':
      return 'bg-amber-900/30 text-amber-300 border-amber-700/50';
    case 'closed':
      return 'bg-gray-900/30 text-gray-400 border-gray-700/50';
    default:
      return 'bg-gray-900/30 text-gray-400 border-gray-700/50';
  }
}

export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatTime(dateString: string): string {
  return new Date(dateString).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase();
}
