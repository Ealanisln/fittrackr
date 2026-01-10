import { useState, useEffect, useCallback } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ComposedChart, Area, ReferenceLine, Cell } from 'recharts';
import { Activity, TrendingUp, Heart, Flame, Mountain, Trash2, Pencil } from 'lucide-react';
import { Layout } from '../components/layout';
import { StatCard } from '../components/dashboard/StatCard';
import { UploadWorkout } from '../components/UploadWorkout';
import { API_URL, fetchInsights } from '../lib/api';
import { EditWorkoutModal } from '../components/EditWorkoutModal';
import type { Workout, InsightsResponse } from '../types/workout';

export function Dashboard() {
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [view, setView] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [insights, setInsights] = useState<InsightsResponse | null>(null);
  const [insightsLoading, setInsightsLoading] = useState(true);
  const [editingWorkout, setEditingWorkout] = useState<Workout | null>(null);

  // Función para recargar los workouts desde la API
  const fetchWorkouts = useCallback(async () => {
    try {
      console.log('🔍 Fetching workouts from API...');
      const response = await fetch(`${API_URL}/api/workouts`, {
        credentials: 'include',
      });
      console.log('📡 Response status:', response.status);
      const result = await response.json();
      console.log('📦 API Result:', result);

      if (result.success) {
        console.log('✅ Setting workouts:', result.data.length, 'workouts');
        setWorkouts(result.data);
        return result.data;
      } else {
        console.warn('⚠️ API returned success=false');
        return [];
      }
    } catch (error) {
      console.error('❌ Error fetching workouts:', error);
      return [];
    }
  }, []);

  // Función para recargar insights
  const refreshInsights = useCallback(async () => {
    setInsightsLoading(true);
    try {
      const data = await fetchInsights();
      setInsights(data);
    } catch (error) {
      console.error('Error fetching insights:', error);
    } finally {
      setInsightsLoading(false);
    }
  }, []);

  // Función para refrescar todos los datos después de un upload
  const handleUploadComplete = useCallback(async () => {
    console.log('🔄 Refreshing data after upload...');
    const newWorkouts = await fetchWorkouts();
    if (newWorkouts.length > 0) {
      await refreshInsights();
    }
    setView('overview');
  }, [fetchWorkouts, refreshInsights]);

  useEffect(() => {
    // Fetch inicial de workouts
    const fetchData = async () => {
      await fetchWorkouts();
      setLoading(false);
    };

    fetchData();
  }, [fetchWorkouts]);

  // Fetch insights when workouts are loaded
  useEffect(() => {
    const loadInsights = async () => {
      if (loading || workouts.length === 0) {
        setInsightsLoading(false);
        return;
      }
      try {
        const data = await fetchInsights();
        setInsights(data);
      } catch (error) {
        console.error('Error fetching insights:', error);
      } finally {
        setInsightsLoading(false);
      }
    };

    loadInsights();
  }, [loading, workouts.length]);

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

  // Handler para actualizar workout después de edición
  const handleWorkoutUpdate = (updatedWorkout: Workout) => {
    setWorkouts(workouts.map(w =>
      w.id === updatedWorkout.id ? updatedWorkout : w
    ));
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

  // Datos mejorados para la gráfica de calorías con comparación
  const caloriesChartData = workouts.map(w => {
    const cals = w.activeKcal;
    const diffFromAvg = avgCalories > 0 ? ((cals - avgCalories) / avgCalories * 100) : 0;
    return {
      date: new Date(w.date).toLocaleDateString('es-ES', { month: 'short', day: 'numeric' }),
      fullDate: new Date(w.date).toLocaleDateString('es-ES', { weekday: 'long', month: 'long', day: 'numeric' }),
      calories: cals,
      average: avgCalories,
      isAboveAvg: cals >= avgCalories,
      diffPercent: diffFromAvg,
      distanceKm: w.distanceKm,
      workoutTime: w.workoutTime,
    };
  }).reverse();

  // Calcular tendencia (media móvil de 3)
  const caloriesWithTrend = caloriesChartData.map((item, index, arr) => {
    if (index < 2) return { ...item, trend: item.calories };
    const avg3 = Math.round((arr[index].calories + arr[index-1].calories + arr[index-2].calories) / 3);
    return { ...item, trend: avg3 };
  });

  // Calcular métricas reales de performance
  const calculatePerformanceMetrics = () => {
    if (totalWorkouts === 0) {
      return [
        { metric: 'Intensidad', value: 0, fullMark: 10, description: 'Sin datos' },
        { metric: 'Consistencia', value: 0, fullMark: 10, description: 'Sin datos' },
        { metric: 'Progresión', value: 0, fullMark: 10, description: 'Sin datos' },
        { metric: 'Volumen', value: 0, fullMark: 10, description: 'Sin datos' },
      ];
    }

    // Intensidad: promedio de effort level
    const avgIntensity = workouts.reduce((sum, w) => sum + w.effortLevel, 0) / totalWorkouts;

    // Consistencia: entrenamientos por semana (últimos 30 días)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentWorkouts = workouts.filter(w => new Date(w.date) >= thirtyDaysAgo);
    const workoutsPerWeek = (recentWorkouts.length / 30) * 7;
    // Escala: 0 workouts = 0, 3+ workouts/week = 10
    const consistencyScore = Math.min(10, (workoutsPerWeek / 3) * 10);

    // Progresión: comparar últimos 3 workouts vs anteriores 3
    let progressionScore = 5; // neutral
    if (totalWorkouts >= 4) {
      const sortedByDate = [...workouts].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      const recent3 = sortedByDate.slice(0, 3);
      const older3 = sortedByDate.slice(3, 6);
      if (older3.length > 0) {
        const recentAvgCal = recent3.reduce((s, w) => s + w.activeKcal, 0) / recent3.length;
        const olderAvgCal = older3.reduce((s, w) => s + w.activeKcal, 0) / older3.length;
        const improvement = ((recentAvgCal - olderAvgCal) / olderAvgCal) * 100;
        // -20% o menos = 2, 0% = 5, +20% o más = 10
        progressionScore = Math.max(2, Math.min(10, 5 + (improvement / 4)));
      }
    }

    // Volumen: calorías promedio vs objetivo (300 kcal = 10)
    const volumeScore = Math.min(10, (avgCalories / 300) * 10);

    return [
      {
        metric: 'Intensidad',
        value: Number(avgIntensity.toFixed(1)),
        fullMark: 10,
        description: `Esfuerzo promedio: ${avgIntensity.toFixed(1)}/10`
      },
      {
        metric: 'Consistencia',
        value: Number(consistencyScore.toFixed(1)),
        fullMark: 10,
        description: `${workoutsPerWeek.toFixed(1)} entrenamientos/semana`
      },
      {
        metric: 'Progresión',
        value: Number(progressionScore.toFixed(1)),
        fullMark: 10,
        description: progressionScore >= 5 ? 'Mejorando' : 'Necesita impulso'
      },
      {
        metric: 'Volumen',
        value: Number(volumeScore.toFixed(1)),
        fullMark: 10,
        description: `${avgCalories} kcal promedio`
      },
    ];
  };

  const performanceData = calculatePerformanceMetrics();
  const overallScore = totalWorkouts > 0
    ? (performanceData.reduce((sum, d) => sum + d.value, 0) / performanceData.length).toFixed(1)
    : '0';

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

              {/* Calorías por Entrenamiento - Mejorado */}
              <div className="bg-slate-800 rounded-xl p-4 md:p-6 mb-6 md:mb-8 shadow-xl">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-3 md:mb-4">
                  <h2 className="text-lg md:text-2xl font-bold text-white flex items-center gap-2">
                    <Flame className="text-orange-500" size={20} />
                    Calorías Quemadas por Entrenamiento
                  </h2>
                  <div className="flex items-center gap-4 mt-2 md:mt-0 text-xs md:text-sm">
                    <div className="flex items-center gap-1.5">
                      <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                      <span className="text-slate-400">Sobre promedio</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                      <span className="text-slate-400">Bajo promedio</span>
                    </div>
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={280}>
                  <ComposedChart data={caloriesWithTrend}>
                    <defs>
                      <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                    <XAxis
                      dataKey="date"
                      stroke="#9CA3AF"
                      tick={{ fontSize: 12 }}
                      axisLine={{ stroke: '#374151' }}
                    />
                    <YAxis
                      stroke="#9CA3AF"
                      tick={{ fontSize: 12 }}
                      axisLine={{ stroke: '#374151' }}
                      domain={[0, 'dataMax + 50']}
                    />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          const diffSign = data.diffPercent >= 0 ? '+' : '';
                          return (
                            <div className="bg-slate-900 border border-slate-700 rounded-lg p-3 shadow-xl">
                              <p className="text-white font-medium text-sm mb-2">{data.fullDate}</p>
                              <div className="space-y-1">
                                <p className="text-orange-400 font-bold text-lg">{data.calories} kcal</p>
                                <p className={`text-sm font-medium ${data.isAboveAvg ? 'text-emerald-400' : 'text-orange-400'}`}>
                                  {diffSign}{data.diffPercent.toFixed(0)}% vs promedio ({avgCalories} kcal)
                                </p>
                                <hr className="border-slate-700 my-2" />
                                <p className="text-slate-400 text-xs">{data.distanceKm} km • {data.workoutTime}</p>
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    {/* Área de tendencia */}
                    <Area
                      type="monotone"
                      dataKey="trend"
                      stroke="#3B82F6"
                      strokeWidth={2}
                      fill="url(#trendGradient)"
                      name="Tendencia"
                    />
                    {/* Línea de promedio */}
                    <ReferenceLine
                      y={avgCalories}
                      stroke="#94A3B8"
                      strokeDasharray="5 5"
                      strokeWidth={2}
                      label={{
                        value: `Promedio: ${avgCalories}`,
                        position: 'right',
                        fill: '#94A3B8',
                        fontSize: 11
                      }}
                    />
                    {/* Barras con colores dinámicos */}
                    <Bar dataKey="calories" radius={[6, 6, 0, 0]} name="Calorías">
                      {caloriesWithTrend.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={entry.isAboveAvg ? '#10B981' : '#F97316'}
                        />
                      ))}
                    </Bar>
                  </ComposedChart>
                </ResponsiveContainer>

                {/* Stats rápidas debajo de la gráfica */}
                <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-slate-700">
                  <div className="text-center">
                    <p className="text-slate-400 text-xs mb-1">Mejor sesión</p>
                    <p className="text-emerald-400 font-bold text-lg">{maxCalories} kcal</p>
                  </div>
                  <div className="text-center">
                    <p className="text-slate-400 text-xs mb-1">Promedio</p>
                    <p className="text-white font-bold text-lg">{avgCalories} kcal</p>
                  </div>
                  <div className="text-center">
                    <p className="text-slate-400 text-xs mb-1">Sobre promedio</p>
                    <p className="text-blue-400 font-bold text-lg">{caloriesWithTrend.filter(d => d.isAboveAvg).length}/{totalWorkouts}</p>
                  </div>
                </div>

                <div className="mt-3 md:mt-4 p-3 md:p-4 bg-slate-700/50 rounded-lg">
                  {workouts.length === 0 ? (
                    <p className="text-slate-400 text-xs md:text-sm">
                      <span className="font-bold text-orange-400">Comenzar:</span> Sube tu primer entrenamiento para ver estadisticas personalizadas y recomendaciones de AI.
                    </p>
                  ) : insightsLoading ? (
                    <p className="text-slate-400 text-xs md:text-sm animate-pulse">Analizando tus entrenamientos...</p>
                  ) : insights?.highlight ? (
                    <p className="text-slate-300 text-xs md:text-sm">
                      <span className="font-bold text-orange-400">{insights.highlight.title}:</span> {insights.highlight.content}
                    </p>
                  ) : (
                    <p className="text-slate-400 text-xs md:text-sm">
                      <span className="font-bold text-orange-400">Tip:</span> Sigue subiendo entrenamientos para obtener analisis mas precisos.
                    </p>
                  )}
                </div>
              </div>

              {/* Performance Radar - Mejorado */}
              <div className="bg-slate-800 rounded-xl p-4 md:p-6 shadow-xl">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-3 md:mb-4">
                  <h2 className="text-lg md:text-2xl font-bold text-white">Análisis de Performance</h2>
                  <div className="flex items-center gap-2 mt-2 md:mt-0">
                    <span className="text-slate-400 text-sm">Score general:</span>
                    <span className={`text-xl font-bold ${
                      Number(overallScore) >= 7 ? 'text-emerald-400' :
                      Number(overallScore) >= 5 ? 'text-yellow-400' : 'text-orange-400'
                    }`}>
                      {overallScore}/10
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                  {/* Radar Chart */}
                  <ResponsiveContainer width="100%" height={280}>
                    <RadarChart data={performanceData} margin={{ top: 40, right: 40, bottom: 40, left: 40 }}>
                      <PolarGrid stroke="#374151" />
                      <PolarAngleAxis
                        dataKey="metric"
                        stroke="#9CA3AF"
                        tick={{ fontSize: 12, fill: '#9CA3AF', dy: 4 }}
                        tickLine={false}
                      />
                      <PolarRadiusAxis
                        angle={90}
                        domain={[0, 10]}
                        stroke="#374151"
                        tick={false}
                        axisLine={false}
                        tickCount={6}
                      />
                      <Tooltip
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload;
                            return (
                              <div className="bg-slate-900 border border-slate-700 rounded-lg p-3 shadow-xl">
                                <p className="text-white font-medium">{data.metric}</p>
                                <p className="text-blue-400 font-bold text-lg">{data.value}/10</p>
                                <p className="text-slate-400 text-xs mt-1">{data.description}</p>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Radar
                        name="Performance"
                        dataKey="value"
                        stroke="#3B82F6"
                        strokeWidth={2}
                        fill="#3B82F6"
                        fillOpacity={0.4}
                        dot={{ r: 4, fill: '#3B82F6' }}
                      />
                    </RadarChart>
                  </ResponsiveContainer>

                  {/* Métricas detalladas */}
                  <div className="space-y-3">
                    {performanceData.map((item) => (
                      <div key={item.metric} className="bg-slate-700/30 rounded-lg p-3">
                        <div className="flex justify-between items-center mb-1.5">
                          <span className="text-slate-300 text-sm font-medium">{item.metric}</span>
                          <span className={`font-bold ${
                            item.value >= 7 ? 'text-emerald-400' :
                            item.value >= 5 ? 'text-yellow-400' : 'text-orange-400'
                          }`}>
                            {item.value}
                          </span>
                        </div>
                        <div className="w-full bg-slate-700 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full transition-all ${
                              item.value >= 7 ? 'bg-emerald-500' :
                              item.value >= 5 ? 'bg-yellow-500' : 'bg-orange-500'
                            }`}
                            style={{ width: `${(item.value / 10) * 100}%` }}
                          />
                        </div>
                        <p className="text-slate-500 text-xs mt-1">{item.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
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
                          onClick={() => setEditingWorkout(workout)}
                          className="p-2 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 transition-colors touch-target"
                          title="Editar fecha"
                        >
                          <Pencil size={16} />
                        </button>
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
              onUploadComplete={handleUploadComplete}
            />
          )}

          {/* Recomendaciones */}
          {view !== 'upload' && (
            <div className="mt-6 md:mt-8 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-xl p-4 md:p-6 shadow-xl">
              {workouts.length === 0 ? (
                <>
                  <h3 className="text-lg md:text-2xl font-bold text-white mb-2 md:mb-3">Empieza Tu Viaje</h3>
                  <div className="bg-white/10 rounded-lg p-3 md:p-4">
                    <p className="text-white/90 text-xs md:text-sm">
                      Sube tu primer entrenamiento para recibir recomendaciones personalizadas basadas en tu rendimiento.
                    </p>
                  </div>
                </>
              ) : insightsLoading ? (
                <>
                  <h3 className="text-lg md:text-2xl font-bold text-white mb-2 md:mb-3">Analizando...</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="bg-white/10 rounded-lg p-3 md:p-4 animate-pulse">
                        <div className="h-4 bg-white/20 rounded mb-2 w-3/4"></div>
                        <div className="h-3 bg-white/10 rounded w-full"></div>
                      </div>
                    ))}
                  </div>
                </>
              ) : insights?.recommendations && insights.recommendations.length > 0 ? (
                <>
                  <h3 className="text-lg md:text-2xl font-bold text-white mb-2 md:mb-3">Recomendaciones para Ti</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4 text-white">
                    {insights.recommendations.slice(0, 3).map((rec, index) => (
                      <div key={rec.id || index} className="bg-white/10 rounded-lg p-3 md:p-4">
                        <p className="font-bold text-sm md:text-base mb-1 md:mb-2">{rec.title}</p>
                        <p className="text-xs md:text-sm text-white/90">{rec.content}</p>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <>
                  <h3 className="text-lg md:text-2xl font-bold text-white mb-2 md:mb-3">Consejos Generales</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4 text-white">
                    <div className="bg-white/10 rounded-lg p-3 md:p-4">
                      <p className="font-bold text-sm md:text-base mb-1 md:mb-2">Consistencia</p>
                      <p className="text-xs md:text-sm text-white/90">Mantener una rutina regular es clave para el progreso</p>
                    </div>
                    <div className="bg-white/10 rounded-lg p-3 md:p-4">
                      <p className="font-bold text-sm md:text-base mb-1 md:mb-2">Variedad</p>
                      <p className="text-xs md:text-sm text-white/90">Varia tus entrenamientos para mejores resultados</p>
                    </div>
                    <div className="bg-white/10 rounded-lg p-3 md:p-4">
                      <p className="font-bold text-sm md:text-base mb-1 md:mb-2">Recuperacion</p>
                      <p className="text-xs md:text-sm text-white/90">Incluye dias de descanso entre entrenamientos intensos</p>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modal de edición de workout */}
      {editingWorkout && (
        <EditWorkoutModal
          workout={editingWorkout}
          isOpen={!!editingWorkout}
          onClose={() => setEditingWorkout(null)}
          onSave={handleWorkoutUpdate}
        />
      )}
    </Layout>
  );
}
