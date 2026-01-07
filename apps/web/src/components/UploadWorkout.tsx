import { useState, useRef } from 'react';
import { Upload, Loader2, CheckCircle2, XCircle, Image as ImageIcon, AlertTriangle } from 'lucide-react';
import { API_URL } from '../lib/api';

interface DuplicateInfo {
  existingWorkout: {
    id: string;
    date: string;
    workoutType: string | null;
    distanceKm: number;
    activeKcal: number;
    workoutTime: string;
  };
  parsedWorkout: {
    date: string;
    workoutType: string | null;
    distanceKm: number;
    activeKcal: number;
    workoutTime: string;
  };
}

interface UploadWorkoutProps {
  onUploadComplete?: () => void;
}

export function UploadWorkout({ onUploadComplete }: UploadWorkoutProps) {
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [duplicateInfo, setDuplicateInfo] = useState<DuplicateInfo | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadFile = async (file: File, force: boolean = false) => {
    setUploading(true);
    setError(null);
    setSuccess(false);
    setDuplicateInfo(null);

    // Create abort controller for timeout (90 seconds)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 90000);

    try {
      const formData = new FormData();
      formData.append('screenshot', file);
      if (force) {
        formData.append('force', 'true');
      }

      console.log('📤 Uploading screenshot to:', `${API_URL}/api/upload`);

      const response = await fetch(`${API_URL}/api/upload`, {
        method: 'POST',
        credentials: 'include',
        body: formData,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      console.log('📥 Response status:', response.status);

      const result = await response.json();
      console.log('📥 Response data:', result);

      // Handle duplicate detection (409 Conflict)
      if (response.status === 409 && result.isDuplicate) {
        setDuplicateInfo({
          existingWorkout: result.existingWorkout,
          parsedWorkout: result.parsedWorkout,
        });
        setPendingFile(file);
        setUploading(false);
        return;
      }

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Error al subir');
      }

      console.log('Upload successful:', result.data);
      setSuccess(true);
      setPreview(null);
      setPendingFile(null);

      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      if (onUploadComplete) {
        setTimeout(() => {
          onUploadComplete();
          setSuccess(false);
        }, 2000);
      }

    } catch (err) {
      clearTimeout(timeoutId);
      console.error('Upload error:', err);

      if (err instanceof Error && err.name === 'AbortError') {
        setError('Tiempo de espera agotado. Intenta de nuevo.');
      } else {
        setError(err instanceof Error ? err.message : 'Error al subir la captura');
      }
    } finally {
      setUploading(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    await uploadFile(file);
  };

  const handleForceUpload = async () => {
    if (pendingFile) {
      await uploadFile(pendingFile, true);
    }
  };

  const handleCancelDuplicate = () => {
    setDuplicateInfo(null);
    setPendingFile(null);
    setPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="bg-slate-800 rounded-xl p-4 md:p-6 shadow-xl">
      <h2 className="text-lg md:text-2xl font-bold text-white mb-3 md:mb-4 flex items-center gap-2">
        <Upload className="text-blue-500" size={20} />
        Subir Captura de Entrenamiento
      </h2>

      <div className="space-y-3 md:space-y-4">
        {/* Upload Area */}
        <div
          onClick={handleClick}
          className={`
            border-2 border-dashed rounded-lg p-6 md:p-8 text-center cursor-pointer
            transition-all
            ${uploading ? 'border-blue-500 bg-blue-500/10' : 'border-slate-600 hover:border-blue-500 hover:bg-slate-700/50'}
          `}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png"
            onChange={handleFileChange}
            className="hidden"
            disabled={uploading}
          />

          {preview && !uploading && !success && (
            <div className="mb-3 md:mb-4">
              <img
                src={preview}
                alt="Preview"
                className="max-w-full max-h-48 md:max-h-64 mx-auto rounded-lg"
              />
            </div>
          )}

          {uploading ? (
            <div className="flex flex-col items-center gap-2 md:gap-3">
              <Loader2 className="w-10 h-10 md:w-12 md:h-12 text-blue-500 animate-spin" />
              <p className="text-white font-medium text-sm md:text-base">Procesando captura...</p>
              <p className="text-slate-400 text-xs md:text-sm">
                Extrayendo datos con IA
              </p>
            </div>
          ) : duplicateInfo ? (
            <div className="flex flex-col items-center gap-3 md:gap-4 text-left w-full">
              <AlertTriangle className="w-10 h-10 md:w-12 md:h-12 text-amber-500" />
              <p className="text-white font-medium text-sm md:text-base">Posible duplicado detectado</p>

              <div className="w-full bg-slate-700/50 rounded-lg p-3 text-xs md:text-sm">
                <p className="text-slate-300 mb-2 font-medium">Entrenamiento existente:</p>
                <div className="text-slate-400 space-y-1">
                  <p>Fecha: {new Date(duplicateInfo.existingWorkout.date).toLocaleDateString('es-ES')}</p>
                  <p>Distancia: {duplicateInfo.existingWorkout.distanceKm} km</p>
                  <p>Calorías: {duplicateInfo.existingWorkout.activeKcal} kcal</p>
                  <p>Duración: {duplicateInfo.existingWorkout.workoutTime}</p>
                </div>
              </div>

              <p className="text-slate-400 text-xs md:text-sm text-center">
                ¿Deseas subir este entrenamiento de todas formas?
              </p>

              <div className="flex gap-3 w-full">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCancelDuplicate();
                  }}
                  className="flex-1 px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors text-sm"
                >
                  Cancelar
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleForceUpload();
                  }}
                  className="flex-1 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-500 transition-colors text-sm font-medium"
                >
                  Subir de todos modos
                </button>
              </div>
            </div>
          ) : success ? (
            <div className="flex flex-col items-center gap-2 md:gap-3">
              <CheckCircle2 className="w-10 h-10 md:w-12 md:h-12 text-green-500" />
              <p className="text-white font-medium text-sm md:text-base">¡Entrenamiento agregado!</p>
              <p className="text-slate-400 text-xs md:text-sm">
                Revisa tu dashboard
              </p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center gap-2 md:gap-3">
              <XCircle className="w-10 h-10 md:w-12 md:h-12 text-red-500" />
              <p className="text-white font-medium text-sm md:text-base">Error al subir</p>
              <p className="text-red-400 text-xs md:text-sm">{error}</p>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setError(null);
                  setPreview(null);
                }}
                className="mt-2 px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors text-sm"
              >
                Intentar de nuevo
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 md:gap-3">
              <ImageIcon className="w-10 h-10 md:w-12 md:h-12 text-slate-500" />
              <p className="text-white font-medium text-sm md:text-base">
                {preview ? 'Clic para cambiar imagen' : 'Clic para subir captura'}
              </p>
              <p className="text-slate-400 text-xs md:text-sm">
                Soporta: JPG, PNG (máx 5MB)
              </p>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 md:p-4">
          <p className="text-blue-400 text-xs md:text-sm">
            <span className="font-bold">Tip:</span> Sube una captura clara del resumen de tu entrenamiento. ¡La IA extraerá todos los datos!
          </p>
        </div>
      </div>
    </div>
  );
}
