export type Split = {
  splitNumber: number;
  time: string;
  pace: string;
  heartRateBpm: number;
}

export type Workout = {
  id: string;
  date: string;
  workoutType?: string;
  workoutTime: string;
  elapsedTime?: string;
  distanceKm: number;
  activeKcal: number;
  totalKcal: number;
  elevationGainM: number;
  avgPace: string;
  avgHeartRateBpm: number;
  effortLevel: number;
  effortDescription: string;
  splits?: Split[];
  source: string;
}
