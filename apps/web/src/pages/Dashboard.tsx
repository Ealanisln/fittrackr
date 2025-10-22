import { useState, useEffect } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { Activity, TrendingUp, Heart, Flame, Mountain, Trash2, Link as LinkIcon, FileUp } from 'lucide-react';
import { StatCard } from '../components/dashboard/StatCard';
import { UploadWorkout } from '../components/UploadWorkout';
import type { Workout } from '../types/workout';

export function Dashboard() {
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [view, setView] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    // Fetch workouts from API
    const fetchData = async () => {
      try {
        console.log('🔍 Fetching workouts from API...');
        const response = await fetch('http://localhost:3001/api/workouts', {
          credentials: 'include', // Send cookies for authentication
        });
        console.log('📡 Response status:', response.status);
        const result = await response.json();
        console.log('📦 API Result:', result);

        if (result.success) {
          console.log('✅ Setting workouts:', result.data.length, 'workouts');
          setWorkouts(result.data);
        } else {
          console.warn('⚠️ API returned success=false');
        }
      } catch (error) {
        console.error('❌ Error fetching workouts:', error);
        // Fallback to mock data
        const mockWorkouts: Workout[] = [
      {
        id: '1',
        date: "2025-10-13",
        workoutType: "Outdoor Walk",
        workoutTime: "0:37:44",
        distanceKm: 4.28,
        activeKcal: 260,
        totalKcal: 311,
        elevationGainM: 102,
        avgPace: "8'49\"",
        avgHeartRateBpm: 150,
        effortLevel: 7,
        effortDescription: "Hard",
        source: "SCREENSHOT"
      },
      {
        id: '2',
        date: "2025-10-10",
        workoutType: "Outdoor Walk",
        workoutTime: "0:39:06",
        distanceKm: 4.25,
        activeKcal: 254,
        totalKcal: 306,
        elevationGainM: 104,
        avgPace: "9'11\"",
        avgHeartRateBpm: 150,
        effortLevel: 8,
        effortDescription: "Hard",
        source: "SCREENSHOT"
      },
      {
        id: '3',
        date: "2025-10-07",
        workoutType: "Outdoor Walk",
        workoutTime: "1:21:48",
        distanceKm: 6.87,
        activeKcal: 423,
        totalKcal: 533,
        elevationGainM: 88,
        avgPace: "11'54\"",
        avgHeartRateBpm: 140,
        effortLevel: 7,
        effortDescription: "Hard",
        source: "SCREENSHOT"
      },
      {
        id: '4',
        date: "2025-10-02",
        workoutType: "Outdoor Walk",
        workoutTime: "0:43:13",
        distanceKm: 4.07,
        activeKcal: 240,
        totalKcal: 299,
        elevationGainM: 102,
        avgPace: "10'36\"",
        avgHeartRateBpm: 132,
        effortLevel: 5,
        effortDescription: "Moderate",
        source: "SCREENSHOT"
      },
      {
        id: '5',
        date: "2025-09-30",
        workoutType: "Outdoor Walk",
        workoutTime: "0:44:55",
        distanceKm: 4.22,
        activeKcal: 253,
        totalKcal: 313,
        elevationGainM: 102,
        avgPace: "10'38\"",
        avgHeartRateBpm: 139,
        effortLevel: 7,
        effortDescription: "Hard",
        source: "SCREENSHOT"
      },
      {
        id: '6',
        date: "2025-09-29",
        workoutType: "Outdoor Walk",
        workoutTime: "0:47:30",
        distanceKm: 4.44,
        activeKcal: 260,
        totalKcal: 323,
        elevationGainM: 110,
        avgPace: "10'41\"",
        avgHeartRateBpm: 132,
        effortLevel: 7,
        effortDescription: "Hard",
        source: "SCREENSHOT"
      },
      {
        id: '7',
        date: "2025-09-25",
        workoutType: "Outdoor Walk",
        workoutTime: "0:43:36",
        distanceKm: 2.52,
        activeKcal: 140,
        totalKcal: 199,
        elevationGainM: 42,
        avgPace: "17'15\"",
        avgHeartRateBpm: 121,
        effortLevel: 6,
        effortDescription: "Moderate",
        source: "SCREENSHOT"
      }
        ];
        setWorkouts(mockWorkouts);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Delete workout handler
  const handleDelete = async (workoutId: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este entrenamiento?')) {
      return;
    }

    setDeleting(workoutId);
    try {
      const response = await fetch(`http://localhost:3001/api/workouts/${workoutId}`, {
        method: 'DELETE',
        credentials: 'include', // Send cookies for authentication
      });

      const result = await response.json();

      if (result.success) {
        // Remove workout from state
        setWorkouts(workouts.filter(w => w.id !== workoutId));
        console.log('✅ Workout deleted successfully');
      } else {
        console.error('❌ Failed to delete workout:', result.error);
        alert('Error al eliminar el entrenamiento');
      }
    } catch (error) {
      console.error('❌ Error deleting workout:', error);
      alert('Error al eliminar el entrenamiento');
    } finally {
      setDeleting(null);
    }
  };

  // Cálculos de estadísticas
  const totalWorkouts = workouts.length;
  const avgCalories = totalWorkouts > 0 ? Math.round(workouts.reduce((sum, w) => sum + w.activeKcal, 0) / totalWorkouts) : 0;
  const totalDistance = workouts.reduce((sum, w) => sum + w.distanceKm, 0).toFixed(2);
  const avgHeartRate = totalWorkouts > 0 ? Math.round(workouts.reduce((sum, w) => sum + w.avgHeartRateBpm, 0) / totalWorkouts) : 0;
  const maxCalories = workouts.length > 0 ? Math.max(...workouts.map(w => w.activeKcal)) : 0;
  const workoutsOver400 = workouts.filter(w => w.activeKcal >= 400).length;

  // Preparar datos para gráficos
  const chartData = workouts.map(w => ({
    date: new Date(w.date).toLocaleDateString('es-ES', { month: 'short', day: 'numeric' }),
    'Calorías Activas': w.activeKcal,
    'Distancia (km)': w.distanceKm,
    'FC Promedio': w.avgHeartRateBpm,
    'Elevación (m)': w.elevationGainM
  })).reverse();

  const effortData = [
    {
      effort: 'Intensidad',
      value: totalWorkouts > 0 ? (workouts.reduce((sum, w) => sum + w.effortLevel, 0) / totalWorkouts).toFixed(1) : 0
    },
    {
      effort: 'Consistencia',
      value: 9.2
    },
    {
      effort: 'Progresión',
      value: 8.5
    },
    {
      effort: 'Variedad',
      value: 8.8
    }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <p className="text-white text-xl">Cargando...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">Dashboard de Entrenamientos</h1>
            <p className="text-slate-400">Análisis detallado de tu progreso - Septiembre a Octubre 2025</p>
          </div>
          <div className="flex gap-2">
            <a
              href="/files"
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors flex items-center gap-2"
            >
              <FileUp size={18} />
              Files
            </a>
            <a
              href="/integrations"
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors flex items-center gap-2"
            >
              <LinkIcon size={18} />
              Integrations
            </a>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex gap-2 mb-6 overflow-x-auto">
          {['overview', 'progress', 'details', 'upload'].map((tab) => (
            <button
              key={tab}
              onClick={() => setView(tab)}
              className={`px-6 py-2 rounded-lg font-medium transition-all ${
                view === tab
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
              }`}
            >
              {tab === 'overview' ? 'Resumen' : tab === 'progress' ? 'Progreso' : tab === 'details' ? 'Detalles' : 'Upload'}
            </button>
          ))}
        </div>

        {view === 'overview' && (
          <>
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <StatCard
                icon={Flame}
                title="Calorías Promedio"
                value={avgCalories}
                subtitle={`Máximo: ${maxCalories} kcal`}
                color="from-orange-600 to-red-600"
              />
              <StatCard
                icon={Activity}
                title="Distancia Total"
                value={`${totalDistance} km`}
                subtitle={`${totalWorkouts} entrenamientos`}
                color="from-blue-600 to-cyan-600"
              />
              <StatCard
                icon={Heart}
                title="FC Promedio"
                value={`${avgHeartRate} bpm`}
                subtitle="Zona aeróbica"
                color="from-pink-600 to-rose-600"
              />
              <StatCard
                icon={TrendingUp}
                title="Sobre Objetivo"
                value={`${workoutsOver400}/${totalWorkouts}`}
                subtitle=">400 kcal logrados"
                color="from-green-600 to-emerald-600"
              />
            </div>

            {/* Calorías por Entrenamiento */}
            <div className="bg-slate-800 rounded-xl p-6 mb-8 shadow-xl">
              <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                <Flame className="text-orange-500" />
                Calorías Quemadas por Entrenamiento
              </h2>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="date" stroke="#9CA3AF" />
                  <YAxis stroke="#9CA3AF" />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '8px' }}
                    labelStyle={{ color: '#F3F4F6' }}
                  />
                  <Bar dataKey="Calorías Activas" fill="#F97316" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
              <div className="mt-4 p-4 bg-slate-700/50 rounded-lg">
                <p className="text-slate-300 text-sm">
                  <span className="font-bold text-orange-400">Destacado:</span> Tu entrenamiento del 7 de octubre alcanzó 423 kcal activas,
                  superando tu objetivo actual en un 5.8%. Las sesiones más cortas e intensas (13 y 10 de octubre) mantienen un excelente
                  promedio de ~255 kcal en menos de 40 minutos.
                </p>
              </div>
            </div>

            {/* Performance Radar */}
            <div className="bg-slate-800 rounded-xl p-6 shadow-xl">
              <h2 className="text-2xl font-bold text-white mb-4">Análisis de Performance</h2>
              <ResponsiveContainer width="100%" height={300}>
                <RadarChart data={effortData}>
                  <PolarGrid stroke="#374151" />
                  <PolarAngleAxis dataKey="effort" stroke="#9CA3AF" />
                  <PolarRadiusAxis angle={90} domain={[0, 10]} stroke="#9CA3AF" />
                  <Radar name="Tu Performance" dataKey="value" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.6} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </>
        )}

        {view === 'progress' && (
          <>
            {/* Tendencias */}
            <div className="bg-slate-800 rounded-xl p-6 mb-8 shadow-xl">
              <h2 className="text-2xl font-bold text-white mb-4">Tendencia de Calorías y Distancia</h2>
              <ResponsiveContainer width="100%" height={350}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="date" stroke="#9CA3AF" />
                  <YAxis yAxisId="left" stroke="#9CA3AF" />
                  <YAxis yAxisId="right" orientation="right" stroke="#9CA3AF" />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '8px' }}
                    labelStyle={{ color: '#F3F4F6' }}
                  />
                  <Legend />
                  <Line yAxisId="left" type="monotone" dataKey="Calorías Activas" stroke="#F97316" strokeWidth={3} dot={{ r: 6 }} />
                  <Line yAxisId="right" type="monotone" dataKey="Distancia (km)" stroke="#3B82F6" strokeWidth={3} dot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Frecuencia Cardíaca y Elevación */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-slate-800 rounded-xl p-6 shadow-xl">
                <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <Heart className="text-pink-500" />
                  Frecuencia Cardíaca
                </h3>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="date" stroke="#9CA3AF" />
                    <YAxis stroke="#9CA3AF" domain={[110, 160]} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '8px' }}
                    />
                    <Line type="monotone" dataKey="FC Promedio" stroke="#EC4899" strokeWidth={3} dot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-slate-800 rounded-xl p-6 shadow-xl">
                <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <Mountain className="text-green-500" />
                  Elevación Ganada
                </h3>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="date" stroke="#9CA3AF" />
                    <YAxis stroke="#9CA3AF" />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '8px' }}
                    />
                    <Bar dataKey="Elevación (m)" fill="#10B981" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </>
        )}

        {view === 'details' && (
          <div className="bg-slate-800 rounded-xl p-6 shadow-xl">
            <h2 className="text-2xl font-bold text-white mb-6">Detalle de Entrenamientos</h2>
            <div className="space-y-4">
              {workouts.map((workout) => (
                <div key={workout.id} className="bg-slate-700/50 rounded-lg p-5 hover:bg-slate-700 transition-colors">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <p className="text-white font-bold text-lg">
                        {new Date(workout.date).toLocaleDateString('es-ES', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                      <p className="text-slate-400 text-sm">{workout.workoutTime}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        workout.effortDescription === 'Hard'
                          ? 'bg-red-500/20 text-red-400'
                          : 'bg-yellow-500/20 text-yellow-400'
                      }`}>
                        {workout.effortDescription}
                      </span>
                      <button
                        onClick={() => handleDelete(workout.id)}
                        disabled={deleting === workout.id}
                        className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Eliminar entrenamiento"
                      >
                        <Trash2 size={18} className={deleting === workout.id ? 'animate-pulse' : ''} />
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-slate-400 text-xs">Calorías Activas</p>
                      <p className="text-orange-400 font-bold text-xl">{workout.activeKcal}</p>
                    </div>
                    <div>
                      <p className="text-slate-400 text-xs">Distancia</p>
                      <p className="text-blue-400 font-bold text-xl">{workout.distanceKm} km</p>
                    </div>
                    <div>
                      <p className="text-slate-400 text-xs">Ritmo Promedio</p>
                      <p className="text-cyan-400 font-bold text-xl">{workout.avgPace}</p>
                    </div>
                    <div>
                      <p className="text-slate-400 text-xs">FC Promedio</p>
                      <p className="text-pink-400 font-bold text-xl">{workout.avgHeartRateBpm} bpm</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {view === 'upload' && (
          <UploadWorkout
            onUploadComplete={() => {
              // Refresh workouts after upload
              window.location.reload();
            }}
          />
        )}

        {/* Recomendaciones */}
        {view !== 'upload' && (
          <div className="mt-8 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-xl p-6 shadow-xl">
            <h3 className="text-2xl font-bold text-white mb-3">💡 Recomendaciones para 500 kcal</h3>
            <div className="grid md:grid-cols-3 gap-4 text-white">
              <div className="bg-white/10 rounded-lg p-4">
                <p className="font-bold mb-2">Opción 1: Extender Sesiones</p>
                <p className="text-sm text-white/90">Tus entrenamientos de 40 min → 50-55 min te darían las 500 kcal fácilmente</p>
              </div>
              <div className="bg-white/10 rounded-lg p-4">
                <p className="font-bold mb-2">Opción 2: Más Intensidad</p>
                <p className="text-sm text-white/90">Mantén tu ritmo de 8'49"/km más tiempo en lugar de empezar lento</p>
              </div>
              <div className="bg-white/10 rounded-lg p-4">
                <p className="font-bold mb-2">Opción 3: Sesión Larga</p>
                <p className="text-sm text-white/90">Una sesión semanal de 90 min como la del 7 oct te da 500+ kcal</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
