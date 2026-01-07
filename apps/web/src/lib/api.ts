export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export async function fetchWorkouts() {
  const response = await fetch(`${API_URL}/api/workouts`, {
    credentials: 'include',
  });
  if (!response.ok) {
    throw new Error('Failed to fetch workouts');
  }
  return response.json();
}

export async function fetchWorkout(id: string) {
  const response = await fetch(`${API_URL}/api/workouts/${id}`, {
    credentials: 'include',
  });
  if (!response.ok) {
    throw new Error('Failed to fetch workout');
  }
  return response.json();
}

export async function fetchInsights() {
  const response = await fetch(`${API_URL}/api/insights`, {
    credentials: 'include',
  });
  if (!response.ok) {
    throw new Error('Failed to fetch insights');
  }
  const result = await response.json();
  return result.data;
}
