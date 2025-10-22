import { useState, useRef } from 'react';
import { FileUp, CheckCircle, XCircle, Upload as UploadIcon, FileText, Activity } from 'lucide-react';

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
          text: 'Some files were skipped. Only .gpx and .fit files are supported.',
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
          text: 'Some files were skipped. Only .gpx and .fit files are supported.',
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

        const response = await fetch('http://localhost:3001/api/files/upload', {
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
          setMessage({ type: 'success', text: 'Workout imported successfully!' });
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

        const response = await fetch('http://localhost:3001/api/files/upload-multiple', {
          method: 'POST',
          credentials: 'include',
          body: formData,
        });

        const result = await response.json();

        if (result.success) {
          setResults(result.data.details);
          setMessage({
            type: 'success',
            text: `Processed ${selectedFiles.length} files: ${result.data.imported} imported, ${result.data.skipped} skipped, ${result.data.errors} errors`,
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
      setMessage({ type: 'error', text: 'Failed to upload files' });
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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <FileUp className="text-purple-400" size={40} />
          <div>
            <h1 className="text-4xl font-bold text-white">File Upload</h1>
            <p className="text-slate-400">Import workouts from GPX or FIT files</p>
          </div>
        </div>

        {/* Status Message */}
        {message && (
          <div
            className={`mb-6 p-4 rounded-lg ${
              message.type === 'success'
                ? 'bg-green-500/10 border border-green-500/20 text-green-400'
                : 'bg-red-500/10 border border-red-500/20 text-red-400'
            }`}
          >
            {message.text}
          </div>
        )}

        {/* Upload Area */}
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl shadow-xl p-8 border border-slate-700 mb-6">
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            className="border-2 border-dashed border-slate-600 rounded-xl p-12 text-center hover:border-purple-500 transition-colors cursor-pointer"
            onClick={() => fileInputRef.current?.click()}
          >
            <FileUp className="mx-auto text-slate-400 mb-4" size={48} />
            <p className="text-white text-lg mb-2">Drop files here or click to browse</p>
            <p className="text-slate-400 text-sm">Supports .gpx and .fit files (max 10MB each)</p>
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
            <div className="mt-6">
              <h3 className="text-white font-semibold mb-3">
                Selected Files ({selectedFiles.length})
              </h3>
              <div className="space-y-2 mb-4">
                {selectedFiles.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 bg-slate-700/50 p-3 rounded-lg"
                  >
                    <FileText className="text-purple-400" size={20} />
                    <span className="text-white flex-1">{file.name}</span>
                    <span className="text-slate-400 text-sm">
                      {(file.size / 1024).toFixed(1)} KB
                    </span>
                  </div>
                ))}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleUpload}
                  disabled={uploading}
                  className="flex-1 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <UploadIcon size={20} />
                  {uploading ? 'Uploading...' : `Upload ${selectedFiles.length} File${selectedFiles.length > 1 ? 's' : ''}`}
                </button>
                <button
                  onClick={clearFiles}
                  disabled={uploading}
                  className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Clear
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Results */}
        {results.length > 0 && (
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl shadow-xl p-8 border border-slate-700 mb-6">
            <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
              <Activity size={24} />
              Upload Results
            </h3>
            <div className="space-y-3">
              {results.map((result, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-lg border ${
                    result.status === 'imported'
                      ? 'bg-green-500/10 border-green-500/20'
                      : result.status === 'skipped'
                      ? 'bg-yellow-500/10 border-yellow-500/20'
                      : 'bg-red-500/10 border-red-500/20'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {result.status === 'imported' ? (
                      <CheckCircle className="text-green-400 flex-shrink-0" size={20} />
                    ) : (
                      <XCircle
                        className={`flex-shrink-0 ${
                          result.status === 'skipped' ? 'text-yellow-400' : 'text-red-400'
                        }`}
                        size={20}
                      />
                    )}
                    <div className="flex-1">
                      <p
                        className={`font-medium ${
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
                        <p className="text-slate-300 text-sm mt-1">
                          {result.workout.type} - {result.workout.distance?.toFixed(2)} km -{' '}
                          {Math.floor(result.workout.duration / 60)}:
                          {(result.workout.duration % 60).toString().padStart(2, '0')}
                        </p>
                      )}
                      {result.status === 'skipped' && (
                        <p className="text-slate-300 text-sm mt-1">
                          Skipped: {result.reason || 'duplicate'}
                        </p>
                      )}
                      {result.status === 'error' && (
                        <p className="text-slate-300 text-sm mt-1">Error: {result.error}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Supported Formats */}
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl shadow-xl p-8 border border-slate-700 mb-6">
          <h3 className="text-white font-semibold mb-4">Supported File Formats</h3>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-white font-bold">.gpx</span>
              </div>
              <div>
                <h4 className="text-white font-semibold">GPS Exchange Format</h4>
                <p className="text-slate-400 text-sm mt-1">
                  GPX files from Garmin, Strava, and other GPS devices. Contains track points,
                  elevation, and heart rate data.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-white font-bold">.fit</span>
              </div>
              <div>
                <h4 className="text-white font-semibold">Flexible and Interoperable Data Transfer</h4>
                <p className="text-slate-400 text-sm mt-1">
                  FIT files from Garmin watches and bike computers. Includes detailed metrics like
                  power, cadence, and advanced performance data.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Back Button */}
        <div className="mt-8">
          <a
            href="/"
            className="text-purple-400 hover:text-purple-300 transition-colors flex items-center gap-2"
          >
            ← Back to Dashboard
          </a>
        </div>
      </div>
    </div>
  );
}
