const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export async function fetchWorkouts() {
  const response = await fetch(`${API_URL}/api/workouts`);
  if (!response.ok) {
    throw new Error('Failed to fetch workouts');
  }
  return response.json();
}

export async function fetchWorkout(id: string) {
  const response = await fetch(`${API_URL}/api/workouts/${id}`);
  if (!response.ok) {
    throw new Error('Failed to fetch workout');
  }
  return response.json();
}
