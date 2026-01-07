/**
 * OCR Service - Uses Gemini Vision directly (no Tesseract)
 * Optimized for faster processing
 */

interface WorkoutData {
  date?: string;
  workoutType?: string;
  workoutTime?: string;
  elapsedTime?: string;
  distanceKm?: number;
  activeKcal?: number;
  totalKcal?: number;
  elevationGainM?: number;
  avgPace?: string;
  avgHeartRateBpm?: number;
  effortLevel?: number;
  effortDescription?: string;
  splits?: Array<{
    splitNumber: number;
    time: string;
    pace: string;
    heartRateBpm?: number;
  }>;
}

/**
 * Parse workout data directly from image using Gemini Vision
 * No OCR step needed - Gemini can read images directly
 */
export async function parseWorkoutWithGemini(imageBuffer: Buffer): Promise<WorkoutData> {
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

  if (!GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY no está configurado');
  }

  const currentYear = new Date().getFullYear();
  const prompt = `Analiza esta captura de pantalla de un entrenamiento y extrae la información en formato JSON.

IMPORTANTE: La fecha de hoy es ${new Date().toISOString().split('T')[0]}. Si la captura solo muestra "Tue 21 Oct" sin año, asume que es del año actual ${currentYear}.

Extrae y devuelve un objeto JSON con esta estructura exacta:
{
  "date": "YYYY-MM-DD",
  "workoutType": "string (ej: 'Caminata', 'Carrera', 'Ciclismo')",
  "workoutTime": "H:MM:SS",
  "elapsedTime": "H:MM:SS (opcional)",
  "distanceKm": number,
  "activeKcal": number,
  "totalKcal": number,
  "elevationGainM": number,
  "avgPace": "string (ej: '8'49\"/km')",
  "avgHeartRateBpm": number,
  "effortLevel": number (1-10),
  "effortDescription": "string (Fácil/Moderado/Intenso)",
  "splits": [
    {
      "splitNumber": number,
      "time": "string (MM:SS)",
      "pace": "string (MM'SS\\")",
      "heartRateBpm": number
    }
  ]
}

Reglas:
1. Extrae TODOS los datos disponibles de la captura
2. Si un campo no se encuentra, omítelo del JSON
3. Los números deben ser números, no strings
4. Devuelve SOLO el JSON, sin texto adicional
5. Si hay datos de "splits" o "laps", inclúyelos todos

Devuelve el JSON ahora:`;

  // Create abort controller for timeout (60 seconds)
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 60000);

  try {
    console.log('🤖 Enviando imagen a Gemini Vision...');
    const startTime = Date.now();

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [
              { text: prompt },
              {
                inline_data: {
                  mime_type: 'image/jpeg',
                  data: imageBuffer.toString('base64')
                }
              }
            ]
          }],
          generationConfig: {
            temperature: 0.1,
            topK: 1,
            topP: 1,
            maxOutputTokens: 8192,
          }
        }),
        signal: controller.signal
      }
    );

    clearTimeout(timeoutId);
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`⏱️ Gemini respondió en ${elapsed}s`);

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Error de Gemini API: ${error}`);
    }

    const data = await response.json();

    // Check if we have candidates
    if (!data.candidates || data.candidates.length === 0) {
      console.error('❌ No hay candidatos en la respuesta:', data);
      throw new Error(`No hay candidatos en la respuesta de Gemini`);
    }

    // Extract text from response
    const candidate = data.candidates[0];
    let generatedText = candidate?.content?.parts?.[0]?.text;

    if (!generatedText && candidate?.content?.text) {
      generatedText = candidate.content.text;
    }

    if (!generatedText) {
      console.error('❌ No hay texto en el candidato:', candidate);
      throw new Error(`Sin respuesta de Gemini. Razón: ${candidate?.finishReason}`);
    }

    // Extract JSON from response (Gemini sometimes adds markdown code blocks)
    const jsonMatch = generatedText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No se pudo extraer JSON de la respuesta de Gemini');
    }

    let jsonString = jsonMatch[0];

    // Clean up common JSON issues
    jsonString = jsonString.replace(/,(\s*[}\]])/g, '$1');

    try {
      const workoutData = JSON.parse(jsonString);
      console.log('✅ Datos del entrenamiento extraídos correctamente');
      return workoutData;
    } catch (parseError) {
      console.error('❌ Error parseando JSON:', jsonString);
      throw new Error('Error al parsear los datos del entrenamiento');
    }
  } catch (error) {
    clearTimeout(timeoutId);

    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Timeout: Gemini tardó más de 60 segundos en responder');
    }

    console.error('Error en Gemini:', error);
    throw error;
  }
}

/**
 * Process workout screenshot - simplified workflow without Tesseract
 */
export async function processWorkoutScreenshot(imagePath: string, imageBuffer?: Buffer) {
  if (!imageBuffer) {
    throw new Error('Se requiere el buffer de la imagen');
  }

  console.log('📸 Procesando captura de entrenamiento...');
  const startTime = Date.now();

  // Parse directly with Gemini Vision (no OCR step needed)
  const workoutData = await parseWorkoutWithGemini(imageBuffer);

  const totalTime = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log(`✅ Procesamiento completado en ${totalTime}s`);

  return {
    ocrResult: {
      text: '', // No longer used but kept for compatibility
      confidence: 100 // Gemini Vision is very accurate
    },
    workoutData,
    source: 'SCREENSHOT' as const
  };
}
