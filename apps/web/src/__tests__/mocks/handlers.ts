import { http, HttpResponse } from 'msw';

const API_URL = 'http://localhost:3001';

export const handlers = [
  // Workouts API
  http.get(`${API_URL}/api/workouts`, () => {
    return HttpResponse.json({
      success: true,
      data: [
        {
          id: '1',
          date: '2025-01-15',
          workoutType: 'Run',
          workoutTime: '0:45:00',
          distanceKm: 5.0,
          activeKcal: 350,
          totalKcal: 400,
          elevationGainM: 50,
          avgPace: "9'00\"/km",
          avgHeartRateBpm: 145,
          effortLevel: 7,
          effortDescription: 'Hard',
          source: 'MANUAL',
          splits: [],
        },
        {
          id: '2',
          date: '2025-01-14',
          workoutType: 'Walk',
          workoutTime: '0:30:00',
          distanceKm: 3.0,
          activeKcal: 200,
          totalKcal: 230,
          elevationGainM: 20,
          avgPace: "10'00\"/km",
          avgHeartRateBpm: 120,
          effortLevel: 4,
          effortDescription: 'Easy',
          source: 'SCREENSHOT',
          splits: [],
        },
      ],
    });
  }),

  http.get(`${API_URL}/api/workouts/:id`, ({ params }) => {
    return HttpResponse.json({
      success: true,
      data: {
        id: params.id,
        date: '2025-01-15',
        workoutType: 'Run',
        workoutTime: '0:45:00',
        distanceKm: 5.0,
        activeKcal: 350,
        totalKcal: 400,
        elevationGainM: 50,
        avgPace: "9'00\"/km",
        avgHeartRateBpm: 145,
        effortLevel: 7,
        effortDescription: 'Hard',
        source: 'MANUAL',
        splits: [],
      },
    });
  }),

  http.post(`${API_URL}/api/workouts`, async ({ request }) => {
    const body = await request.json() as Record<string, unknown>;
    return HttpResponse.json({
      success: true,
      data: {
        id: 'new-workout-id',
        ...body,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    }, { status: 201 });
  }),

  http.put(`${API_URL}/api/workouts/:id`, async ({ params, request }) => {
    const body = await request.json() as Record<string, unknown>;
    return HttpResponse.json({
      success: true,
      data: {
        id: params.id,
        ...body,
        updatedAt: new Date().toISOString(),
      },
    });
  }),

  http.delete(`${API_URL}/api/workouts/:id`, () => {
    return HttpResponse.json({ success: true });
  }),

  // Upload API
  http.post(`${API_URL}/api/upload`, async ({ request }) => {
    const formData = await request.formData();
    const file = formData.get('screenshot');

    if (!file) {
      return HttpResponse.json({
        success: false,
        error: 'No file uploaded',
      }, { status: 400 });
    }

    return HttpResponse.json({
      success: true,
      data: {
        workout: {
          id: 'new-workout-from-screenshot',
          date: '2025-01-15',
          workoutType: 'Run',
          distanceKm: 4.5,
          activeKcal: 280,
          workoutTime: '0:40:00',
        },
        ocrConfidence: 95,
      },
    }, { status: 201 });
  }),

  // Files API
  http.post(`${API_URL}/api/files/upload`, async ({ request }) => {
    const formData = await request.formData();
    const file = formData.get('file');

    if (!file) {
      return HttpResponse.json({
        success: false,
        error: 'No file uploaded',
      }, { status: 400 });
    }

    return HttpResponse.json({
      success: true,
      data: {
        workout: {
          id: 'new-workout-from-file',
          date: '2025-01-15',
          workoutType: 'Run',
          distanceKm: 5.0,
          activeKcal: 350,
        },
      },
    }, { status: 201 });
  }),

  http.post(`${API_URL}/api/files/upload-multiple`, async ({ request }) => {
    const formData = await request.formData();
    const files = formData.getAll('files');

    return HttpResponse.json({
      success: true,
      data: {
        imported: files.length,
        skipped: 0,
        errors: [],
        details: files.map((_, index) => ({
          fileName: `file-${index + 1}.gpx`,
          status: 'imported',
          workoutId: `workout-${index + 1}`,
        })),
      },
    }, { status: 201 });
  }),

  // Insights API
  http.get(`${API_URL}/api/insights`, () => {
    return HttpResponse.json({
      success: true,
      data: {
        highlight: {
          id: '1',
          type: 'HIGHLIGHT',
          title: 'Gran semana de entrenamiento',
          content: 'Has superado tu promedio de calorias esta semana. Sigue asi!',
        },
        recommendations: [
          {
            id: '2',
            type: 'RECOMMENDATION',
            title: 'Mantén la consistencia',
            content: 'Intenta mantener al menos 3 entrenamientos por semana.',
          },
          {
            id: '3',
            type: 'RECOMMENDATION',
            title: 'Variedad',
            content: 'Considera agregar entrenamientos de diferentes intensidades.',
          },
        ],
      },
    });
  }),

  // Integrations API
  http.get(`${API_URL}/api/integrations`, () => {
    return HttpResponse.json({
      success: true,
      data: [],
    });
  }),

  http.get(`${API_URL}/api/integrations/strava/auth`, () => {
    return HttpResponse.json({
      success: true,
      authUrl: 'https://www.strava.com/oauth/authorize?client_id=test&scope=activity:read_all',
    });
  }),

  http.post(`${API_URL}/api/integrations/strava/sync`, () => {
    return HttpResponse.json({
      success: true,
      data: {
        imported: 5,
        skipped: 2,
      },
    });
  }),

  http.delete(`${API_URL}/api/integrations/strava`, () => {
    return HttpResponse.json({ success: true });
  }),

  // Health check
  http.get(`${API_URL}/health`, () => {
    return HttpResponse.json({ status: 'ok' });
  }),
];

// Export utility to add custom handlers in specific tests
export function addMockHandler(...customHandlers: Parameters<typeof http.get>[]) {
  return customHandlers;
}
