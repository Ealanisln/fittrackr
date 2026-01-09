import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { parseWorkoutWithGemini, processWorkoutScreenshot } from '../ocr.service';

describe('OCR Service', () => {
  const originalEnv = process.env;
  const mockFetch = vi.fn();

  beforeEach(() => {
    process.env = { ...originalEnv, GEMINI_API_KEY: 'test-api-key' };
    vi.stubGlobal('fetch', mockFetch);
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  describe('parseWorkoutWithGemini', () => {
    it('should extract workout data from Gemini response', async () => {
      const mockWorkoutData = {
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
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          candidates: [{
            content: {
              parts: [{
                text: JSON.stringify(mockWorkoutData),
              }],
            },
          }],
        }),
      });

      const imageBuffer = Buffer.from('fake-image-data');
      const result = await parseWorkoutWithGemini(imageBuffer);

      expect(result).toMatchObject(mockWorkoutData);
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('should throw error when GEMINI_API_KEY is not set', async () => {
      delete process.env.GEMINI_API_KEY;

      const imageBuffer = Buffer.from('fake-image-data');
      await expect(parseWorkoutWithGemini(imageBuffer))
        .rejects.toThrow('GEMINI_API_KEY no está configurado');
    });

    it('should handle Gemini API errors gracefully', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        text: () => Promise.resolve('API rate limit exceeded'),
      });

      const imageBuffer = Buffer.from('fake-image-data');
      await expect(parseWorkoutWithGemini(imageBuffer))
        .rejects.toThrow('Error de Gemini API');
    });

    it('should throw error when no candidates in response', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          candidates: [],
        }),
      });

      const imageBuffer = Buffer.from('fake-image-data');
      await expect(parseWorkoutWithGemini(imageBuffer))
        .rejects.toThrow('No hay candidatos en la respuesta de Gemini');
    });

    it('should throw error when no text in candidate', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          candidates: [{
            content: {
              parts: [],
            },
            finishReason: 'SAFETY',
          }],
        }),
      });

      const imageBuffer = Buffer.from('fake-image-data');
      await expect(parseWorkoutWithGemini(imageBuffer))
        .rejects.toThrow('Sin respuesta de Gemini');
    });

    it('should extract JSON from markdown code blocks', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          candidates: [{
            content: {
              parts: [{
                text: '```json\n{"date": "2025-01-15", "distanceKm": 5, "activeKcal": 300}\n```',
              }],
            },
          }],
        }),
      });

      const imageBuffer = Buffer.from('fake-image-data');
      const result = await parseWorkoutWithGemini(imageBuffer);

      expect(result.date).toBe('2025-01-15');
      expect(result.distanceKm).toBe(5);
      expect(result.activeKcal).toBe(300);
    });

    it('should handle trailing commas in JSON', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          candidates: [{
            content: {
              parts: [{
                text: '{"date": "2025-01-15", "distanceKm": 5, "activeKcal": 300,}',
              }],
            },
          }],
        }),
      });

      const imageBuffer = Buffer.from('fake-image-data');
      const result = await parseWorkoutWithGemini(imageBuffer);

      expect(result.distanceKm).toBe(5);
    });

    it('should throw error when JSON cannot be extracted', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          candidates: [{
            content: {
              parts: [{
                text: 'This is just plain text with no JSON',
              }],
            },
          }],
        }),
      });

      const imageBuffer = Buffer.from('fake-image-data');
      await expect(parseWorkoutWithGemini(imageBuffer))
        .rejects.toThrow('No se pudo extraer JSON');
    });

    it('should throw error for invalid JSON', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          candidates: [{
            content: {
              parts: [{
                text: 'Here is the data: {"date": "2025-01-15", "invalid json without closing',
              }],
            },
          }],
        }),
      });

      const imageBuffer = Buffer.from('fake-image-data');
      await expect(parseWorkoutWithGemini(imageBuffer))
        .rejects.toThrow(); // Either JSON extraction or parsing error
    });

    it('should handle workout with splits', async () => {
      const mockWorkoutWithSplits = {
        date: '2025-01-15',
        workoutType: 'Run',
        distanceKm: 5.0,
        activeKcal: 350,
        splits: [
          { splitNumber: 1, time: '5:30', pace: "5'30\"", heartRateBpm: 155 },
          { splitNumber: 2, time: '5:25', pace: "5'25\"", heartRateBpm: 160 },
        ],
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          candidates: [{
            content: {
              parts: [{
                text: JSON.stringify(mockWorkoutWithSplits),
              }],
            },
          }],
        }),
      });

      const imageBuffer = Buffer.from('fake-image-data');
      const result = await parseWorkoutWithGemini(imageBuffer);

      expect(result.splits).toHaveLength(2);
      expect(result.splits[0].splitNumber).toBe(1);
      expect(result.splits[1].heartRateBpm).toBe(160);
    });

    it('should send correct API request format', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          candidates: [{
            content: {
              parts: [{
                text: '{"date": "2025-01-15"}',
              }],
            },
          }],
        }),
      });

      const imageBuffer = Buffer.from('test-image');
      await parseWorkoutWithGemini(imageBuffer);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('generativelanguage.googleapis.com'),
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        })
      );

      const requestBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(requestBody.contents[0].parts).toHaveLength(2);
      expect(requestBody.contents[0].parts[1].inline_data.mime_type).toBe('image/jpeg');
      expect(requestBody.contents[0].parts[1].inline_data.data).toBe(imageBuffer.toString('base64'));
    });

    it('should include timeout signal in request', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          candidates: [{
            content: {
              parts: [{
                text: '{"date": "2025-01-15"}',
              }],
            },
          }],
        }),
      });

      const imageBuffer = Buffer.from('test-image');
      await parseWorkoutWithGemini(imageBuffer);

      expect(mockFetch.mock.calls[0][1].signal).toBeDefined();
    });

    it('should handle response with alternative content.text format', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          candidates: [{
            content: {
              text: '{"date": "2025-01-15", "distanceKm": 5}',
            },
          }],
        }),
      });

      const imageBuffer = Buffer.from('fake-image-data');
      const result = await parseWorkoutWithGemini(imageBuffer);

      expect(result.date).toBe('2025-01-15');
    });
  });

  describe('processWorkoutScreenshot', () => {
    it('should require image buffer', async () => {
      await expect(processWorkoutScreenshot('/fake/path.jpg'))
        .rejects.toThrow('Se requiere el buffer de la imagen');
    });

    it('should return structured result with source SCREENSHOT', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          candidates: [{
            content: {
              parts: [{
                text: '{"date": "2025-01-15", "distanceKm": 3}',
              }],
            },
          }],
        }),
      });

      const imageBuffer = Buffer.from('fake-image');
      const result = await processWorkoutScreenshot('/fake/path.jpg', imageBuffer);

      expect(result.source).toBe('SCREENSHOT');
      expect(result.ocrResult.confidence).toBe(100);
      expect(result.ocrResult.text).toBe('');
      expect(result.workoutData).toBeDefined();
      expect(result.workoutData.date).toBe('2025-01-15');
    });

    it('should include workout data from Gemini', async () => {
      const workoutData = {
        date: '2025-01-15',
        workoutType: 'Run',
        distanceKm: 5.0,
        activeKcal: 350,
        avgPace: "6'00\"/km",
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          candidates: [{
            content: {
              parts: [{
                text: JSON.stringify(workoutData),
              }],
            },
          }],
        }),
      });

      const imageBuffer = Buffer.from('fake-image');
      const result = await processWorkoutScreenshot('/fake/path.jpg', imageBuffer);

      expect(result.workoutData).toMatchObject(workoutData);
    });

    it('should propagate Gemini errors', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        text: () => Promise.resolve('API Error'),
      });

      const imageBuffer = Buffer.from('fake-image');
      await expect(processWorkoutScreenshot('/fake/path.jpg', imageBuffer))
        .rejects.toThrow('Error de Gemini API');
    });
  });
});
