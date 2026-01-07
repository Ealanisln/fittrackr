import { useState, useRef } from 'react';
import { FileUp, CheckCircle, XCircle, Upload as UploadIcon, FileText, Activity } from 'lucide-react';
import { Layout } from '../components/layout';
import { API_URL } from '../lib/api';

interface UploadResult {
  fileName: string;
  status: 'imported' | 'skipped' | 'error';
  workout?: any;
  reason?: string;
  error?: string;
}

export function Files() {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [results, setResults] = useState<UploadResult[]>([]);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      const validFiles = files.filter((file) => {
        const ext = file.name.toLowerCase();
        return ext.endsWith('.gpx') || ext.endsWith('.fit');
      });

      if (validFiles.length < files.length) {
        setMessage({
          type: 'error',
          text: 'Algunos archivos fueron omitidos. Solo se permiten archivos .gpx y .fit.',
        });
        setTimeout(() => setMessage(null), 5000);
      }

      setSelectedFiles(validFiles);
      setResults([]);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files) {
      const files = Array.from(e.dataTransfer.files);
      const validFiles = files.filter((file) => {
        const ext = file.name.toLowerCase();
        return ext.endsWith('.gpx') || ext.endsWith('.fit');
      });

      if (validFiles.length < files.length) {
        setMessage({
          type: 'error',
          text: 'Algunos archivos fueron omitidos. Solo se permiten archivos .gpx y .fit.',
        });
        setTimeout(() => setMessage(null), 5000);
      }

      setSelectedFiles(validFiles);
      setResults([]);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;

    setUploading(true);
    setMessage(null);
    setResults([]);

    try {
      if (selectedFiles.length === 1) {
        // Single file upload
        const formData = new FormData();
        formData.append('file', selectedFiles[0]);

        const response = await fetch(`${API_URL}/api/files/upload`, {
          method: 'POST',
          credentials: 'include',
          body: formData,
        });

        const result = await response.json();

        if (result.success) {
          setResults([
            {
              fileName: selectedFiles[0].name,
              status: 'imported',
              workout: result.data.workout,
            },
          ]);
          setMessage({ type: 'success', text: '¡Entrenamiento importado exitosamente!' });
        } else {
          setResults([
            {
              fileName: selectedFiles[0].name,
              status: 'error',
              error: result.error,
            },
          ]);
          setMessage({ type: 'error', text: result.error });
        }
      } else {
        // Multiple file upload
        const formData = new FormData();
        selectedFiles.forEach((file) => {
          formData.append('files', file);
        });

        const response = await fetch(`${API_URL}/api/files/upload-multiple`, {
          method: 'POST',
          credentials: 'include',
          body: formData,
        });

        const result = await response.json();

        if (result.success) {
          setResults(result.data.details);
          setMessage({
            type: 'success',
            text: `${selectedFiles.length} archivos procesados: ${result.data.imported} importados, ${result.data.skipped} omitidos, ${result.data.errors} errores`,
          });
        } else {
          setMessage({ type: 'error', text: result.error });
        }
      }

      // Clear selected files
      setSelectedFiles([]);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Upload error:', error);
      setMessage({ type: 'error', text: 'Error al subir archivos' });
    } finally {
      setUploading(false);
    }
  };

  const clearFiles = () => {
    setSelectedFiles([]);
    setResults([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <Layout>
      <div className="p-4 md:p-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center gap-3 mb-6 md:mb-8">
            <FileUp className="text-purple-400" size={32} />
            <div>
              <h1 className="text-2xl md:text-4xl font-bold text-white">Subir Archivos</h1>
              <p className="text-sm md:text-base text-slate-400">Importar entrenamientos desde archivos GPX o FIT</p>
            </div>
          </div>

          {/* Status Message */}
          {message && (
            <div
              className={`mb-4 md:mb-6 p-3 md:p-4 rounded-lg text-sm md:text-base ${
                message.type === 'success'
                  ? 'bg-green-500/10 border border-green-500/20 text-green-400'
                  : 'bg-red-500/10 border border-red-500/20 text-red-400'
              }`}
            >
              {message.text}
            </div>
          )}

          {/* Upload Area */}
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl shadow-xl p-4 md:p-8 border border-slate-700 mb-4 md:mb-6">
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              className="border-2 border-dashed border-slate-600 rounded-xl p-6 md:p-12 text-center hover:border-purple-500 transition-colors cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              <FileUp className="mx-auto text-slate-400 mb-3 md:mb-4" size={40} />
              <p className="text-white text-base md:text-lg mb-2">Arrastra archivos aquí o haz clic para explorar</p>
              <p className="text-slate-400 text-xs md:text-sm">Soporta archivos .gpx y .fit (máx 10MB)</p>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".gpx,.fit"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>

            {/* Selected Files */}
            {selectedFiles.length > 0 && (
              <div className="mt-4 md:mt-6">
                <h3 className="text-white font-semibold text-sm md:text-base mb-2 md:mb-3">
                  Archivos Seleccionados ({selectedFiles.length})
                </h3>
                <div className="space-y-2 mb-3 md:mb-4">
                  {selectedFiles.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 bg-slate-700/50 p-2 md:p-3 rounded-lg"
                    >
                      <FileText className="text-purple-400 flex-shrink-0" size={18} />
                      <span className="text-white flex-1 text-sm md:text-base truncate">{file.name}</span>
                      <span className="text-slate-400 text-xs md:text-sm flex-shrink-0">
                        {(file.size / 1024).toFixed(1)} KB
                      </span>
                    </div>
                  ))}
                </div>

                <div className="flex flex-col md:flex-row gap-2 md:gap-3">
                  <button
                    onClick={handleUpload}
                    disabled={uploading}
                    className="flex-1 px-4 md:px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm md:text-base"
                  >
                    <UploadIcon size={18} />
                    {uploading ? 'Subiendo...' : `Subir ${selectedFiles.length} Archivo${selectedFiles.length > 1 ? 's' : ''}`}
                  </button>
                  <button
                    onClick={clearFiles}
                    disabled={uploading}
                    className="px-4 md:px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm md:text-base"
                  >
                    Limpiar
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Results */}
          {results.length > 0 && (
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl shadow-xl p-4 md:p-8 border border-slate-700 mb-4 md:mb-6">
              <h3 className="text-white font-semibold text-sm md:text-base mb-3 md:mb-4 flex items-center gap-2">
                <Activity size={20} />
                Resultados de Subida
              </h3>
              <div className="space-y-2 md:space-y-3">
                {results.map((result, index) => (
                  <div
                    key={index}
                    className={`p-3 md:p-4 rounded-lg border ${
                      result.status === 'imported'
                        ? 'bg-green-500/10 border-green-500/20'
                        : result.status === 'skipped'
                        ? 'bg-yellow-500/10 border-yellow-500/20'
                        : 'bg-red-500/10 border-red-500/20'
                    }`}
                  >
                    <div className="flex items-start gap-2 md:gap-3">
                      {result.status === 'imported' ? (
                        <CheckCircle className="text-green-400 flex-shrink-0" size={18} />
                      ) : (
                        <XCircle
                          className={`flex-shrink-0 ${
                            result.status === 'skipped' ? 'text-yellow-400' : 'text-red-400'
                          }`}
                          size={18}
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <p
                          className={`font-medium text-sm md:text-base truncate ${
                            result.status === 'imported'
                              ? 'text-green-400'
                              : result.status === 'skipped'
                              ? 'text-yellow-400'
                              : 'text-red-400'
                          }`}
                        >
                          {result.fileName}
                        </p>
                        {result.status === 'imported' && result.workout && (
                          <p className="text-slate-300 text-xs md:text-sm mt-1">
                            {result.workout.type} - {result.workout.distance?.toFixed(2)} km
                          </p>
                        )}
                        {result.status === 'skipped' && (
                          <p className="text-slate-300 text-xs md:text-sm mt-1">
                            Omitido: {result.reason || 'duplicado'}
                          </p>
                        )}
                        {result.status === 'error' && (
                          <p className="text-slate-300 text-xs md:text-sm mt-1">Error: {result.error}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Supported Formats */}
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl shadow-xl p-4 md:p-8 border border-slate-700">
            <h3 className="text-white font-semibold text-sm md:text-base mb-3 md:mb-4">Formatos Soportados</h3>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 md:w-16 md:h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-bold text-xs md:text-sm">.gpx</span>
                </div>
                <div className="min-w-0">
                  <h4 className="text-white font-semibold text-sm md:text-base">Formato GPS Exchange</h4>
                  <p className="text-slate-400 text-xs md:text-sm mt-1">
                    Archivos GPX de Garmin, Strava y otros dispositivos GPS.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 md:w-16 md:h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-bold text-xs md:text-sm">.fit</span>
                </div>
                <div className="min-w-0">
                  <h4 className="text-white font-semibold text-sm md:text-base">Protocolo FIT</h4>
                  <p className="text-slate-400 text-xs md:text-sm mt-1">
                    Archivos FIT de relojes Garmin y computadoras de bicicleta.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
