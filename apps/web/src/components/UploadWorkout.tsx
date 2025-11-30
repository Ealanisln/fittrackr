import { useState, useRef } from 'react';
import { Upload, Loader2, CheckCircle2, XCircle, Image as ImageIcon } from 'lucide-react';
import { API_URL } from '../lib/api';

interface UploadWorkoutProps {
  onUploadComplete?: () => void;
}

export function UploadWorkout({ onUploadComplete }: UploadWorkoutProps) {
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    if (!file) return;

    // Show preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Upload file
    setUploading(true);
    setError(null);
    setSuccess(false);

    try {
      const formData = new FormData();
      formData.append('screenshot', file);
      formData.append('userId', 'cmh1b2myi0000gplhnwmt5o4h'); // TODO: Get from auth

      const response = await fetch(`${API_URL}/api/upload`, {
        method: 'POST',
        credentials: 'include', // Send cookies for authentication
        body: formData,
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to upload');
      }

      console.log('✅ Upload successful:', result.data);
      setSuccess(true);
      setPreview(null);

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      // Notify parent
      if (onUploadComplete) {
        setTimeout(() => {
          onUploadComplete();
          setSuccess(false);
        }, 2000);
      }

    } catch (err) {
      console.error('Upload error:', err);
      setError(err instanceof Error ? err.message : 'Failed to upload screenshot');
    } finally {
      setUploading(false);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="bg-slate-800 rounded-xl p-4 md:p-6 shadow-xl">
      <h2 className="text-lg md:text-2xl font-bold text-white mb-3 md:mb-4 flex items-center gap-2">
        <Upload className="text-blue-500" size={20} />
        Upload Workout Screenshot
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
              <p className="text-white font-medium text-sm md:text-base">Processing screenshot...</p>
              <p className="text-slate-400 text-xs md:text-sm">
                Extracting workout data with AI
              </p>
            </div>
          ) : success ? (
            <div className="flex flex-col items-center gap-2 md:gap-3">
              <CheckCircle2 className="w-10 h-10 md:w-12 md:h-12 text-green-500" />
              <p className="text-white font-medium text-sm md:text-base">Workout added successfully!</p>
              <p className="text-slate-400 text-xs md:text-sm">
                Check your dashboard
              </p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center gap-2 md:gap-3">
              <XCircle className="w-10 h-10 md:w-12 md:h-12 text-red-500" />
              <p className="text-white font-medium text-sm md:text-base">Upload failed</p>
              <p className="text-red-400 text-xs md:text-sm">{error}</p>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setError(null);
                  setPreview(null);
                }}
                className="mt-2 px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors text-sm"
              >
                Try again
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 md:gap-3">
              <ImageIcon className="w-10 h-10 md:w-12 md:h-12 text-slate-500" />
              <p className="text-white font-medium text-sm md:text-base">
                {preview ? 'Click to change image' : 'Click to upload screenshot'}
              </p>
              <p className="text-slate-400 text-xs md:text-sm">
                Supports: JPG, PNG (max 5MB)
              </p>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 md:p-4">
          <p className="text-blue-400 text-xs md:text-sm">
            <span className="font-bold">Tip:</span> Upload a clear screenshot of your workout summary. AI will extract all the details!
          </p>
        </div>
      </div>
    </div>
  );
}
