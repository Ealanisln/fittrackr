import { createWorker } from 'tesseract.js';

interface OCRResult {
  text: string;
  confidence: number;
}

/**
 * Extract text from image using Tesseract.js
 */
export async function extractTextFromImage(imagePath: string): Promise<OCRResult> {
  const worker = await createWorker('eng');

  try {
    const { data: { text, confidence } } = await worker.recognize(imagePath);

    return {
      text: text.trim(),
      confidence: Math.round(confidence)
    };
  } finally {
    await worker.terminate();
  }
}

/**
 * Parse workout data from OCR text using Gemini AI
 */
export async function parseWorkoutWithGemini(ocrText: string, imageBuffer?: Buffer): Promise<any> {
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

  if (!GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY not configured');
  }

  // Use Gemini API to parse the workout data
  const currentYear = new Date().getFullYear();
  const prompt = `
You are a fitness tracking assistant. Analyze this screenshot of a workout and extract the following information in JSON format.

IMPORTANT: Today's date is ${new Date().toISOString().split('T')[0]}. If the screenshot only shows "Tue 21 Oct" without a year, assume it's from the current year ${currentYear}, NOT from past years.

Text extracted from image:
${ocrText}

Please extract and return a JSON object with this exact structure:
{
  "date": "YYYY-MM-DD",
  "workoutType": "string (e.g., 'Outdoor Walk', 'Run', 'Cycling')",
  "workoutTime": "H:MM:SS",
  "elapsedTime": "H:MM:SS (optional)",
  "distanceKm": number,
  "activeKcal": number,
  "totalKcal": number,
  "elevationGainM": number,
  "avgPace": "string (e.g., '8'49\"/km')",
  "avgHeartRateBpm": number,
  "effortLevel": number (1-10),
  "effortDescription": "string (Easy/Moderate/Hard)",
  "splits": [
    {
      "splitNumber": number,
      "time": "string (MM:SS)",
      "pace": "string (MM'SS\\")",
      "heartRateBpm": number
    }
  ]
}

Important rules:
1. Extract ALL available data from the screenshot
2. If a field is not found, omit it from the JSON
3. Ensure all numbers are actual numbers, not strings
4. Pace format must be exact: "MM'SS\\"" or "MM'SS\\"/km"
5. Return ONLY the JSON object, no additional text
6. If you see "splits" or "laps" data, include them all

Return the JSON now:
`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: imageBuffer
              ? [
                  { text: prompt },
                  {
                    inline_data: {
                      mime_type: 'image/jpeg',
                      data: imageBuffer.toString('base64')
                    }
                  }
                ]
              : [{ text: prompt }]
          }],
          generationConfig: {
            temperature: 0.1,
            topK: 1,
            topP: 1,
            maxOutputTokens: 8192,
          }
        })
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Gemini API error: ${error}`);
    }

    const data = await response.json();
    console.log('📋 Gemini API Response:', JSON.stringify(data, null, 2));

    // Check if we have candidates
    if (!data.candidates || data.candidates.length === 0) {
      console.error('❌ No candidates in response:', data);
      throw new Error(`No candidates in Gemini response. Full response: ${JSON.stringify(data)}`);
    }

    // Extract text from response - handle different response formats
    const candidate = data.candidates[0];
    let generatedText = candidate?.content?.parts?.[0]?.text;

    // If no parts, try to get text from alternative locations
    if (!generatedText && candidate?.content?.text) {
      generatedText = candidate.content.text;
    }

    if (!generatedText) {
      console.error('❌ No text in candidate:', candidate);
      console.error('❌ Finish reason:', candidate?.finishReason);
      throw new Error(`No response text from Gemini. Finish reason: ${candidate?.finishReason}`);
    }

    // Extract JSON from response (sometimes Gemini adds markdown code blocks)
    const jsonMatch = generatedText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Could not extract JSON from Gemini response');
    }

    const workoutData = JSON.parse(jsonMatch[0]);

    return workoutData;
  } catch (error) {
    console.error('Error parsing with Gemini:', error);
    throw error;
  }
}

/**
 * Complete OCR + AI parsing workflow
 */
export async function processWorkoutScreenshot(imagePath: string, imageBuffer?: Buffer) {
  console.log('📸 Starting OCR extraction...');

  // Step 1: Extract text with Tesseract
  const ocrResult = await extractTextFromImage(imagePath);
  console.log(`✅ OCR completed with ${ocrResult.confidence}% confidence`);
  console.log(`📝 Extracted text:\n${ocrResult.text.substring(0, 200)}...`);

  // Step 2: Parse with Gemini AI
  console.log('🤖 Parsing data with Gemini AI...');
  const workoutData = await parseWorkoutWithGemini(ocrResult.text, imageBuffer);
  console.log('✅ Workout data parsed successfully');

  return {
    ocrResult,
    workoutData,
    source: 'SCREENSHOT' as const
  };
}
