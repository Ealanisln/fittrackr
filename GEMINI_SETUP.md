# 🤖 Configuración de Gemini AI para OCR

## ✨ ¿Qué hace?

El sistema de OCR con Gemini AI permite:

1. **Subir un screenshot** de cualquier app de fitness (Apple Watch, Garmin, Strava, etc.)
2. **Extracción automática** de todos los datos del workout
3. **Parseo inteligente** con Gemini AI para estructura JSON
4. **Guardado automático** en la base de datos

---

## 🔑 Configurar tu API Key de Gemini

### 1. Agrega tu API key al archivo `.env`

Edita el archivo `/apps/api/.env` y reemplaza:

```bash
GEMINI_API_KEY="your-gemini-api-key-here"
```

Con tu API key real de Gemini.

### 2. Reinicia el backend

```bash
# Detén el proceso actual (Ctrl+C)
# Luego reinicia con:
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/fittrack?schema=public" pnpm --filter @fittrack/api dev
```

---

## 📸 Cómo Usar el Upload

### Desde el Dashboard

1. Abre http://localhost:5173
2. Click en la pestaña **"Upload"**
3. Click en el área de upload
4. Selecciona un screenshot de tu workout
5. ¡Espera unos segundos y listo! 🎉

El sistema automáticamente:
- ✅ Extrae el texto con Tesseract OCR
- ✅ Analiza la imagen con Gemini Vision
- ✅ Parsea todos los datos (calorías, distancia, splits, etc.)
- ✅ Guarda el workout en la DB
- ✅ Actualiza el dashboard

---

## 🔍 Probar el Endpoint Directamente

### Usando curl:

\`\`\`bash
curl -X POST http://localhost:3001/api/upload \\
  -F "screenshot=@/ruta/a/tu/screenshot.jpg" \\
  -F "userId=cmh1b2myi0000gplhnwmt5o4h"
\`\`\`

### Usando Postman:

1. **Method**: POST
2. **URL**: `http://localhost:3001/api/upload`
3. **Body**:
   - Type: `form-data`
   - Key: `screenshot` (type: File)
   - Key: `userId` (type: Text) = `cmh1b2myi0000gplhnwmt5o4h`

---

## 🧪 Ejemplo de Respuesta

\`\`\`json
{
  "success": true,
  "data": {
    "workout": {
      "id": "abc123",
      "date": "2025-10-21T00:00:00.000Z",
      "workoutType": "Outdoor Walk",
      "distanceKm": 4.28,
      "activeKcal": 260,
      "avgPace": "8'49\"/km",
      "splits": [
        {
          "splitNumber": 1,
          "time": "10:00",
          "pace": "10'00\"",
          "heartRateBpm": 116
        }
        // ... más splits
      ]
    },
    "ocrConfidence": 95,
    "processedAt": "2025-10-21T01:30:00.000Z"
  }
}
\`\`\`

---

## 🎨 Lo Que Gemini Extrae Automáticamente

- ✅ Fecha del workout
- ✅ Tipo de actividad (Walk, Run, Cycling, etc.)
- ✅ Duración total
- ✅ Distancia en km
- ✅ Calorías activas y totales
- ✅ Elevación ganada
- ✅ Ritmo promedio
- ✅ Frecuencia cardíaca promedio
- ✅ Nivel de esfuerzo
- ✅ **Todos los splits** (tiempo, ritmo, FC por lap)

---

## 💡 Tips para Mejores Resultados

1. **Screenshots claros**: Asegúrate que el texto sea legible
2. **Formato completo**: Captura toda la pantalla de resumen
3. **Buena iluminación**: Evita reflejos o sombras
4. **Orientación correcta**: Vertical u horizontal según la app

---

## 🐛 Troubleshooting

### "GEMINI_API_KEY not configured"

Solución: Asegúrate de que tu API key esté en `/apps/api/.env` y reinicia el backend.

### "Failed to upload"

Solución:
1. Verifica que el backend esté corriendo en puerto 3001
2. Checa los logs del backend para ver el error específico
3. Asegúrate que la imagen sea JPG o PNG (max 5MB)

### "Could not extract JSON from Gemini response"

Solución:
1. Verifica que tu API key tenga permisos
2. Intenta con otro screenshot más claro
3. Checa los logs para ver la respuesta raw de Gemini

---

## 📊 Ver Logs en Tiempo Real

\`\`\`bash
# Logs del backend
tail -f apps/api/logs.txt

# O simplemente observa la terminal donde corre el backend
# Verás:
# 📸 Starting OCR extraction...
# ✅ OCR completed with 95% confidence
# 🤖 Parsing data with Gemini AI...
# ✅ Workout data parsed successfully
# ✅ Workout created: abc123
\`\`\`

---

## 🚀 Próximos Pasos

Ahora que tienes el OCR funcionando, puedes:

1. **Subir tus screenshots históricos** para poblar la DB
2. **Ajustar el prompt** de Gemini si necesitas extraer campos específicos
3. **Implementar batch upload** para procesar múltiples screenshots
4. **Agregar validación manual** para workouts con baja confianza OCR

---

¿Listo para probar? 🎉

1. Agrega tu `GEMINI_API_KEY` en `/apps/api/.env`
2. Reinicia el backend
3. Ve a http://localhost:5173
4. Click en "Upload"
5. ¡Sube un screenshot!
