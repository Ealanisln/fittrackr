import { useState, useEffect } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { Activity, TrendingUp, Heart, Flame, Mountain, Trash2 } from 'lucide-react';
import { Layout } from '../components/layout';
import { StatCard } from '../components/dashboard/StatCard';
import { UploadWorkout } from '../components/UploadWorkout';
import { API_URL } from '../lib/api';
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
        const response = await fetch(`${API_URL}/api/workouts`, {
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
      const response = await fetch(`${API_URL}/api/workouts/${workoutId}`, {
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
      <Layout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <p className="text-white text-xl">Cargando...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-4 md:p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-6 md:mb-8">
            <h1 className="text-2xl md:text-4xl font-bold text-white mb-1 md:mb-2">Dashboard de Entrenamientos</h1>
            <p className="text-sm md:text-base text-slate-400">Analisis detallado de tu progreso</p>
          </div>

          {/* Navigation Tabs */}
          <div className="flex gap-2 mb-4 md:mb-6 overflow-x-auto pb-2 -mx-4 px-4 md:mx-0 md:px-0">
            {['overview', 'progress', 'details', 'upload'].map((tab) => (
              <button
                key={tab}
                onClick={() => setView(tab)}
                className={`px-4 md:px-6 py-2 rounded-lg font-medium transition-all whitespace-nowrap text-sm md:text-base ${
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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6 md:mb-8">
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
              <div className="bg-slate-800 rounded-xl p-4 md:p-6 mb-6 md:mb-8 shadow-xl">
                <h2 className="text-lg md:text-2xl font-bold text-white mb-3 md:mb-4 flex items-center gap-2">
                  <Flame className="text-orange-500" size={20} />
                  Calorias Quemadas por Entrenamiento
                </h2>
                <ResponsiveContainer width="100%" height={250}>
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
                <div className="mt-3 md:mt-4 p-3 md:p-4 bg-slate-700/50 rounded-lg">
                  <p className="text-slate-300 text-xs md:text-sm">
                    <span className="font-bold text-orange-400">Destacado:</span> Tu entrenamiento del 7 de octubre alcanzo 423 kcal activas,
                    superando tu objetivo actual en un 5.8%.
                  </p>
                </div>
              </div>

              {/* Performance Radar */}
              <div className="bg-slate-800 rounded-xl p-4 md:p-6 shadow-xl">
                <h2 className="text-lg md:text-2xl font-bold text-white mb-3 md:mb-4">Analisis de Performance</h2>
                <ResponsiveContainer width="100%" height={250}>
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
              <div className="bg-slate-800 rounded-xl p-4 md:p-6 mb-6 md:mb-8 shadow-xl">
                <h2 className="text-lg md:text-2xl font-bold text-white mb-3 md:mb-4">Tendencia de Calorias y Distancia</h2>
                <ResponsiveContainer width="100%" height={280}>
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                <div className="bg-slate-800 rounded-xl p-4 md:p-6 shadow-xl">
                  <h3 className="text-base md:text-xl font-bold text-white mb-3 md:mb-4 flex items-center gap-2">
                    <Heart className="text-pink-500" size={18} />
                    Frecuencia Cardiaca
                  </h3>
                  <ResponsiveContainer width="100%" height={200}>
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

                <div className="bg-slate-800 rounded-xl p-4 md:p-6 shadow-xl">
                  <h3 className="text-base md:text-xl font-bold text-white mb-3 md:mb-4 flex items-center gap-2">
                    <Mountain className="text-green-500" size={18} />
                    Elevacion Ganada
                  </h3>
                  <ResponsiveContainer width="100%" height={200}>
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
            <div className="bg-slate-800 rounded-xl p-4 md:p-6 shadow-xl">
              <h2 className="text-lg md:text-2xl font-bold text-white mb-4 md:mb-6">Detalle de Entrenamientos</h2>
              <div className="space-y-3 md:space-y-4">
                {workouts.map((workout) => (
                  <div key={workout.id} className="bg-slate-700/50 rounded-lg p-3 md:p-5 hover:bg-slate-700 transition-colors">
                    <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-2 md:gap-0 mb-3">
                      <div>
                        <p className="text-white font-bold text-sm md:text-lg">
                          {new Date(workout.date).toLocaleDateString('es-ES', {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </p>
                        <p className="text-slate-400 text-xs md:text-sm">{workout.workoutTime}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 md:px-3 py-1 rounded-full text-xs md:text-sm font-medium ${
                          workout.effortDescription === 'Hard'
                            ? 'bg-red-500/20 text-red-400'
                            : 'bg-yellow-500/20 text-yellow-400'
                        }`}>
                          {workout.effortDescription}
                        </span>
                        <button
                          onClick={() => handleDelete(workout.id)}
                          disabled={deleting === workout.id}
                          className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed touch-target"
                          title="Eliminar entrenamiento"
                        >
                          <Trash2 size={16} className={deleting === workout.id ? 'animate-pulse' : ''} />
                        </button>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                      <div>
                        <p className="text-slate-400 text-xs">Calorias</p>
                        <p className="text-orange-400 font-bold text-base md:text-xl">{workout.activeKcal}</p>
                      </div>
                      <div>
                        <p className="text-slate-400 text-xs">Distancia</p>
                        <p className="text-blue-400 font-bold text-base md:text-xl">{workout.distanceKm} km</p>
                      </div>
                      <div>
                        <p className="text-slate-400 text-xs">Ritmo</p>
                        <p className="text-cyan-400 font-bold text-base md:text-xl">{workout.avgPace}</p>
                      </div>
                      <div>
                        <p className="text-slate-400 text-xs">FC Prom</p>
                        <p className="text-pink-400 font-bold text-base md:text-xl">{workout.avgHeartRateBpm}</p>
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
                window.location.reload();
              }}
            />
          )}

          {/* Recomendaciones */}
          {view !== 'upload' && (
            <div className="mt-6 md:mt-8 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-xl p-4 md:p-6 shadow-xl">
              <h3 className="text-lg md:text-2xl font-bold text-white mb-2 md:mb-3">Recomendaciones para 500 kcal</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4 text-white">
                <div className="bg-white/10 rounded-lg p-3 md:p-4">
                  <p className="font-bold text-sm md:text-base mb-1 md:mb-2">Extender Sesiones</p>
                  <p className="text-xs md:text-sm text-white/90">40 min a 50-55 min te darian 500 kcal</p>
                </div>
                <div className="bg-white/10 rounded-lg p-3 md:p-4">
                  <p className="font-bold text-sm md:text-base mb-1 md:mb-2">Mas Intensidad</p>
                  <p className="text-xs md:text-sm text-white/90">Manten ritmo alto desde el inicio</p>
                </div>
                <div className="bg-white/10 rounded-lg p-3 md:p-4">
                  <p className="font-bold text-sm md:text-base mb-1 md:mb-2">Sesion Larga</p>
                  <p className="text-xs md:text-sm text-white/90">Una sesion de 90 min te da 500+ kcal</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
