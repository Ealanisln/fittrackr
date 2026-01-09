/**
 * Mock Gemini API responses for testing
 */

export const mockGeminiWorkoutResponse = {
  candidates: [{
    content: {
      parts: [{
        text: JSON.stringify({
          date: '2025-01-15',
          workoutType: 'Caminata',
          workoutTime: '0:45:00',
          distanceKm: 4.5,
          activeKcal: 280,
          totalKcal: 340,
          elevationGainM: 85,
          avgPace: "10'00\"/km",
          avgHeartRateBpm: 135,
          effortLevel: 6,
          effortDescription: 'Moderado',
        }),
      }],
    },
  }],
};

export const mockGeminiRunResponse = {
  candidates: [{
    content: {
      parts: [{
        text: JSON.stringify({
          date: '2025-01-15',
          workoutType: 'Run',
          workoutTime: '0:30:00',
          distanceKm: 5.0,
          activeKcal: 350,
          totalKcal: 400,
          elevationGainM: 50,
          avgPace: "6'00\"/km",
          avgHeartRateBpm: 155,
          effortLevel: 8,
          effortDescription: 'Hard',
        }),
      }],
    },
  }],
};

export const mockGeminiErrorResponse = {
  error: {
    code: 429,
    message: 'Rate limit exceeded',
  },
};

export const mockGeminiMarkdownResponse = {
  candidates: [{
    content: {
      parts: [{
        text: '```json\n{"date": "2025-01-15", "distanceKm": 5, "activeKcal": 300}\n```',
      }],
    },
  }],
};

export const mockGeminiTrailingCommaResponse = {
  candidates: [{
    content: {
      parts: [{
        text: '{"date": "2025-01-15", "distanceKm": 5, "activeKcal": 300,}',
      }],
    },
  }],
};

export function createMockFetch(response: any, ok = true) {
  return vi.fn().mockResolvedValue({
    ok,
    json: () => Promise.resolve(response),
    text: () => Promise.resolve(JSON.stringify(response)),
  });
}
