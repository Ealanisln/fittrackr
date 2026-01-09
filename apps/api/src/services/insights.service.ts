import { prisma, Prisma } from '@fittrack/database';

type Workout = Prisma.WorkoutGetPayload<{}>;
type WorkoutInsight = Prisma.WorkoutInsightGetPayload<{}>;

interface GeminiResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string;
      }>;
    };
  }>;
}

interface InsightGenerationContext {
  userId: string;
  recentWorkouts: Workout[];
  newWorkout?: Workout;
  stats: {
    totalWorkouts: number;
    avgCalories: number;
    maxCalories: number;
    totalDistance: number;
    avgHeartRate: number;
    avgDurationMinutes: number;
  };
}

interface GeneratedInsight {
  title: string;
  content: string;
}

/**
 * Get cached insights for a user
 */
export async function getCachedInsights(userId: string): Promise<{
  highlight: WorkoutInsight | null;
  recommendations: WorkoutInsight[];
}> {
  const [highlight, recommendations] = await Promise.all([
    prisma.workoutInsight.findFirst({
      where: { userId, type: 'HIGHLIGHT' },
      orderBy: { generatedAt: 'desc' },
    }),
    prisma.workoutInsight.findMany({
      where: { userId, type: 'RECOMMENDATION' },
      orderBy: { generatedAt: 'desc' },
      take: 3,
    }),
  ]);

  return { highlight, recommendations };
}

/**
 * Build context for insight generation
 */
async function buildInsightContext(
  userId: string,
  newWorkout?: Workout
): Promise<InsightGenerationContext> {
  const recentWorkouts = await prisma.workout.findMany({
    where: { userId },
    orderBy: { date: 'desc' },
    take: 20,
  });

  const totalWorkouts = recentWorkouts.length;

  if (totalWorkouts === 0) {
    return {
      userId,
      recentWorkouts: [],
      newWorkout,
      stats: {
        totalWorkouts: 0,
        avgCalories: 0,
        maxCalories: 0,
        totalDistance: 0,
        avgHeartRate: 0,
        avgDurationMinutes: 0,
      },
    };
  }

  const avgCalories = Math.round(
    recentWorkouts.reduce((sum, w) => sum + w.activeKcal, 0) / totalWorkouts
  );
  const maxCalories = Math.max(...recentWorkouts.map((w) => w.activeKcal));
  const totalDistance = recentWorkouts.reduce((sum, w) => sum + w.distanceKm, 0);
  const avgHeartRate = Math.round(
    recentWorkouts.reduce((sum, w) => sum + w.avgHeartRateBpm, 0) / totalWorkouts
  );

  // Parse workout time to minutes (format: "H:MM:SS" or "HH:MM:SS")
  const totalMinutes = recentWorkouts.reduce((sum, w) => {
    const parts = w.workoutTime.split(':');
    const hours = parseInt(parts[0], 10) || 0;
    const minutes = parseInt(parts[1], 10) || 0;
    const seconds = parseInt(parts[2], 10) || 0;
    return sum + hours * 60 + minutes + seconds / 60;
  }, 0);
  const avgDurationMinutes = Math.round(totalMinutes / totalWorkouts);

  return {
    userId,
    recentWorkouts,
    newWorkout,
    stats: {
      totalWorkouts,
      avgCalories,
      maxCalories,
      totalDistance: Math.round(totalDistance * 10) / 10,
      avgHeartRate,
      avgDurationMinutes,
    },
  };
}

/**
 * Generate highlight using Gemini AI
 */
async function generateHighlightWithGemini(
  context: InsightGenerationContext
): Promise<GeneratedInsight> {
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

  if (!GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY not configured');
  }

  const latestWorkout = context.newWorkout || context.recentWorkouts[0];

  if (!latestWorkout) {
    throw new Error('No workout available for highlight');
  }

  const prompt = `
Eres un coach de fitness motivacional. Genera un highlight corto y motivador en español sobre el entrenamiento más reciente del usuario.

Estadísticas del usuario:
- Promedio de calorías: ${context.stats.avgCalories} kcal
- Máximo de calorías: ${context.stats.maxCalories} kcal
- Total de entrenamientos: ${context.stats.totalWorkouts}
- Distancia total acumulada: ${context.stats.totalDistance} km

Entrenamiento más reciente:
- Fecha: ${new Date(latestWorkout.date).toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })}
- Tipo: ${latestWorkout.workoutType || 'Entrenamiento'}
- Calorías activas: ${latestWorkout.activeKcal} kcal
- Distancia: ${latestWorkout.distanceKm} km
- Ritmo cardíaco promedio: ${latestWorkout.avgHeartRateBpm} bpm
- Duración: ${latestWorkout.workoutTime}
- Nivel de esfuerzo: ${latestWorkout.effortLevel}/10

Genera un highlight que:
1. Sea específico y use números reales del entrenamiento
2. Compare con el promedio si es destacable (superó promedio, nuevo récord, etc.)
3. Sea motivador y positivo (1-2 oraciones máximo)
4. Use datos concretos, no genéricos

Responde SOLO con un JSON así:
{
  "title": "título corto (2-3 palabras, ej: 'Nuevo récord!', 'Gran sesión', 'Superaste tu meta')",
  "content": "mensaje motivador con datos específicos"
}
`;

  // Add timeout to prevent Gateway Timeout (30 seconds)
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 8192,
          },
        }),
        signal: controller.signal,
      }
    );

    clearTimeout(timeoutId);

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Gemini API error: ${error}`);
    }

    const data = (await response.json()) as GeminiResponse;
    console.log('📋 Insights Gemini Response:', JSON.stringify(data, null, 2));

    const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!generatedText) {
      console.error('❌ No text in response. Full data:', JSON.stringify(data));
      throw new Error('No response text from Gemini');
    }

    const jsonMatch = generatedText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Could not extract JSON from Gemini response');
    }

    return JSON.parse(jsonMatch[0]) as GeneratedInsight;
  } catch (error) {
    console.error('Error generating highlight with Gemini:', error);
    throw error;
  }
}

/**
 * Generate recommendations using Gemini AI
 */
async function generateRecommendationsWithGemini(
  context: InsightGenerationContext
): Promise<GeneratedInsight[]> {
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

  if (!GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY not configured');
  }

  // Calculate workout frequency (workouts per week in last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const recentCount = context.recentWorkouts.filter(
    (w) => new Date(w.date) >= thirtyDaysAgo
  ).length;
  const weeklyFrequency = Math.round((recentCount / 30) * 7 * 10) / 10;

  const prompt = `
Eres un coach de fitness experto. Genera 3 recomendaciones personalizadas en español basadas en los datos reales del usuario.

Patrones del usuario (últimos ${context.stats.totalWorkouts} entrenamientos):
- Calorías promedio por sesión: ${context.stats.avgCalories} kcal
- Duración promedio: ${context.stats.avgDurationMinutes} minutos
- Frecuencia semanal: ${weeklyFrequency} entrenamientos/semana
- Ritmo cardíaco promedio: ${context.stats.avgHeartRate} bpm
- Distancia total acumulada: ${context.stats.totalDistance} km

Genera exactamente 3 recomendaciones que:
1. Sean específicas y basadas en los datos reales del usuario
2. Sean accionables y prácticas
3. Incluyan números o metas concretas basadas en su historial
4. Cubran diferentes aspectos: intensidad, duración, frecuencia, o variedad

Responde SOLO con un JSON array así:
[
  {"title": "título corto (2-4 palabras)", "content": "recomendación específica con datos"},
  {"title": "título corto", "content": "recomendación específica"},
  {"title": "título corto", "content": "recomendación específica"}
]
`;

  // Add timeout to prevent Gateway Timeout (30 seconds)
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 8192,
          },
        }),
        signal: controller.signal,
      }
    );

    clearTimeout(timeoutId);

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Gemini API error: ${error}`);
    }

    const data = (await response.json()) as GeminiResponse;
    console.log('📋 Recommendations Gemini Response:', JSON.stringify(data, null, 2));

    const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!generatedText) {
      console.error('❌ No text in recommendations response. Full data:', JSON.stringify(data));
      throw new Error('No response text from Gemini');
    }

    const jsonMatch = generatedText.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new Error('Could not extract JSON array from Gemini response');
    }

    return JSON.parse(jsonMatch[0]) as GeneratedInsight[];
  } catch (error) {
    console.error('Error generating recommendations with Gemini:', error);
    throw error;
  }
}

/**
 * Fallback insights when Gemini fails
 */
function generateFallbackHighlight(context: InsightGenerationContext): GeneratedInsight {
  const latestWorkout = context.newWorkout || context.recentWorkouts[0];

  if (!latestWorkout) {
    return {
      title: 'Bienvenido',
      content: 'Sube tu primer entrenamiento para empezar a recibir análisis personalizados.',
    };
  }

  return {
    title: 'Buen trabajo',
    content: `Tu último entrenamiento quemó ${latestWorkout.activeKcal} kcal. ¡Sigue así!`,
  };
}

function generateFallbackRecommendations(): GeneratedInsight[] {
  return [
    {
      title: 'Consistencia',
      content: 'Mantener una rutina regular es clave para el progreso a largo plazo.',
    },
    {
      title: 'Variedad',
      content: 'Intenta variar tus entrenamientos para mejores resultados.',
    },
    {
      title: 'Recuperación',
      content: 'Recuerda incluir días de descanso entre entrenamientos intensos.',
    },
  ];
}

/**
 * Save insights to database
 */
async function saveInsights(
  userId: string,
  highlight: GeneratedInsight,
  recommendations: GeneratedInsight[],
  workoutCount: number,
  workoutId?: string
): Promise<void> {
  // Delete old insights for this user
  await prisma.workoutInsight.deleteMany({
    where: { userId },
  });

  // Create new highlight
  await prisma.workoutInsight.create({
    data: {
      userId,
      type: 'HIGHLIGHT',
      title: highlight.title,
      content: highlight.content,
      workoutId: workoutId || null,
      workoutCount,
    },
  });

  // Create new recommendations
  await prisma.workoutInsight.createMany({
    data: recommendations.map((rec) => ({
      userId,
      type: 'RECOMMENDATION' as const,
      title: rec.title,
      content: rec.content,
      workoutCount,
    })),
  });
}

/**
 * Main entry point - Generate insights for a user
 */
export async function generateInsightsForUser(
  userId: string,
  newWorkout?: Workout
): Promise<void> {
  console.log(`🧠 Generating insights for user ${userId}...`);

  try {
    const context = await buildInsightContext(userId, newWorkout);

    if (context.stats.totalWorkouts === 0) {
      console.log('⚠️ No workouts found, skipping insight generation');
      return;
    }

    let highlight: GeneratedInsight;
    let recommendations: GeneratedInsight[];

    try {
      // Try to generate with Gemini
      [highlight, recommendations] = await Promise.all([
        generateHighlightWithGemini(context),
        generateRecommendationsWithGemini(context),
      ]);
      console.log('✅ Insights generated with Gemini AI');
    } catch (error) {
      // Fallback to static insights
      console.warn('⚠️ Gemini failed, using fallback insights:', error);
      highlight = generateFallbackHighlight(context);
      recommendations = generateFallbackRecommendations();
    }

    // Save to database
    await saveInsights(
      userId,
      highlight,
      recommendations,
      context.stats.totalWorkouts,
      newWorkout?.id
    );

    console.log('✅ Insights saved to database');
  } catch (error) {
    console.error('❌ Error generating insights:', error);
    throw error;
  }
}
