import { useState } from 'react';
import { X, Calendar, Save, Loader2 } from 'lucide-react';
import { API_URL } from '../lib/api';
import type { Workout } from '../types/workout';

interface EditWorkoutModalProps {
  workout: Workout;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedWorkout: Workout) => void;
}

export function EditWorkoutModal({ workout, isOpen, onClose, onSave }: EditWorkoutModalProps) {
  const formatDateForInput = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toISOString().split('T')[0];
  };

  const [date, setDate] = useState(formatDateForInput(workout.date));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSave = async () => {
    setSaving(true);
    setError(null);

    try {
      const response = await fetch(`${API_URL}/api/workouts/${workout.id}`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          date: `${date}T12:00:00`,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Error al actualizar');
      }

      onSave(result.data);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-slate-800 rounded-xl w-full max-w-md shadow-2xl border border-slate-700 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-700">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Calendar className="text-blue-500" size={20} />
            Editar Entrenamiento
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Info del workout */}
          <div className="bg-slate-700/50 rounded-lg p-3 text-sm">
            <p className="text-slate-300">
              <span className="text-slate-400">Tipo:</span> {workout.workoutType || 'Entrenamiento'}
            </p>
            <p className="text-slate-300">
              <span className="text-slate-400">Distancia:</span> {workout.distanceKm} km
            </p>
            <p className="text-slate-300">
              <span className="text-slate-400">Calorias:</span> {workout.activeKcal} kcal
            </p>
          </div>

          {/* Campo de fecha */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Fecha del entrenamiento
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              max={new Date().toISOString().split('T')[0]}
              className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white
                         focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                         appearance-none text-center
                         [&::-webkit-calendar-picker-indicator]:filter [&::-webkit-calendar-picker-indicator]:invert
                         [&::-webkit-date-and-time-value]:text-white"
            />
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-4 border-t border-slate-700">
          <button
            onClick={onClose}
            disabled={saving}
            className="flex-1 px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600
                       transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500
                       transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Guardando...
              </>
            ) : (
              <>
                <Save size={16} />
                Guardar
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
