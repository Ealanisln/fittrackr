import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Activity, CheckCircle, RefreshCw, Link as LinkIcon, Unlink } from 'lucide-react';
import { Layout } from '../components/layout';
import { API_URL } from '../lib/api';

interface Integration {
  id: string;
  type: 'STRAVA' | 'GARMIN' | 'APPLE_HEALTH';
  isActive: boolean;
  metadata: any;
  createdAt: string;
  updatedAt: string;
}

export function Integrations() {
  const [searchParams] = useSearchParams();
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    fetchIntegrations();

    // Check for OAuth callback messages
    const stravaStatus = searchParams.get('strava');
    if (stravaStatus === 'connected') {
      setMessage({ type: 'success', text: '¡Strava conectado exitosamente!' });
      // Clear message after 5 seconds
      setTimeout(() => setMessage(null), 5000);
    } else if (stravaStatus === 'error') {
      setMessage({ type: 'error', text: 'Error al conectar Strava. Por favor intenta de nuevo.' });
      setTimeout(() => setMessage(null), 5000);
    }
  }, [searchParams]);

  const fetchIntegrations = async () => {
    try {
      const response = await fetch(`${API_URL}/api/integrations`, {
        credentials: 'include',
      });
      const result = await response.json();

      if (result.success) {
        setIntegrations(result.data);
      }
    } catch (error) {
      console.error('Error fetching integrations:', error);
    } finally {
      setLoading(false);
    }
  };

  const connectStrava = async () => {
    try {
      const response = await fetch(`${API_URL}/api/integrations/strava/auth`, {
        credentials: 'include',
      });
      const result = await response.json();

      if (result.success) {
        // Redirect to Strava authorization
        window.location.href = result.data.authUrl;
      } else {
        setMessage({ type: 'error', text: 'Error al generar URL de autenticación de Strava' });
      }
    } catch (error) {
      console.error('Error connecting Strava:', error);
      setMessage({ type: 'error', text: 'Error al conectar con Strava' });
    }
  };

  const disconnectStrava = async () => {
    if (!confirm('¿Seguro que deseas desconectar Strava? Tus entrenamientos importados se mantendrán.')) {
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/integrations/strava`, {
        method: 'DELETE',
        credentials: 'include',
      });
      const result = await response.json();

      if (result.success) {
        setMessage({ type: 'success', text: 'Strava desconectado exitosamente' });
        fetchIntegrations();
      } else {
        setMessage({ type: 'error', text: 'Error al desconectar Strava' });
      }
    } catch (error) {
      console.error('Error disconnecting Strava:', error);
      setMessage({ type: 'error', text: 'Error al desconectar Strava' });
    }
  };

  const syncStrava = async () => {
    setSyncing(true);
    setMessage(null);

    try {
      const response = await fetch(`${API_URL}/api/integrations/strava/sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ limit: 50 }),
      });
      const result = await response.json();

      if (result.success) {
        setMessage({
          type: 'success',
          text: `¡Sincronización completa! ${result.data.imported} actividades importadas, ${result.data.skipped} duplicados omitidos`,
        });
      } else {
        setMessage({ type: 'error', text: result.error || 'Error al sincronizar actividades' });
      }
    } catch (error) {
      console.error('Error syncing Strava:', error);
      setMessage({ type: 'error', text: 'Error al sincronizar actividades de Strava' });
    } finally {
      setSyncing(false);
    }
  };

  const stravaIntegration = integrations.find((i) => i.type === 'STRAVA');
  const isStravaConnected = stravaIntegration && stravaIntegration.isActive;

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="text-white text-xl">Cargando...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-4 md:p-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center gap-3 mb-6 md:mb-8">
            <Activity className="text-purple-400" size={32} />
            <div>
              <h1 className="text-2xl md:text-4xl font-bold text-white">Integraciones</h1>
              <p className="text-sm md:text-base text-slate-400">Conecta tus apps de fitness</p>
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

          {/* Strava Integration Card */}
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl shadow-xl p-4 md:p-8 border border-slate-700 mb-4 md:mb-6">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
              <div className="flex items-center gap-3 md:gap-4">
                <div className="w-12 h-12 md:w-16 md:h-16 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center flex-shrink-0">
                  <svg className="w-7 h-7 md:w-10 md:h-10 text-white" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066m-7.008-5.599l2.836 5.598h4.172L10.463 0l-7.008 13.828h4.172" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-lg md:text-2xl font-bold text-white flex items-center gap-2">
                    Strava
                    {isStravaConnected && (
                      <CheckCircle className="text-green-400" size={20} />
                    )}
                  </h2>
                  <p className="text-slate-400 text-xs md:text-sm mt-1">
                    {isStravaConnected
                      ? `Conectado como ${stravaIntegration.metadata?.firstname}`
                      : 'Conecta tu cuenta de Strava'}
                  </p>
                </div>
              </div>

              <div className="flex flex-col md:flex-row gap-2">
                {isStravaConnected ? (
                  <>
                    <button
                      onClick={syncStrava}
                      disabled={syncing}
                      className="px-3 md:px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm md:text-base"
                    >
                      <RefreshCw className={syncing ? 'animate-spin' : ''} size={16} />
                      {syncing ? 'Sincronizando...' : 'Sincronizar'}
                    </button>
                    <button
                      onClick={disconnectStrava}
                      className="px-3 md:px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors flex items-center justify-center gap-2 text-sm md:text-base"
                    >
                      <Unlink size={16} />
                      Desconectar
                    </button>
                  </>
                ) : (
                  <button
                    onClick={connectStrava}
                    className="px-4 md:px-6 py-2 bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 text-white rounded-lg transition-all flex items-center justify-center gap-2 text-sm md:text-base"
                  >
                    <LinkIcon size={16} />
                    Conectar Strava
                  </button>
                )}
              </div>
            </div>

            {isStravaConnected && (
              <div className="mt-4 md:mt-6 pt-4 md:pt-6 border-t border-slate-700">
                <h3 className="text-white font-semibold text-sm md:text-base mb-2 md:mb-3">Qué se importa:</h3>
                <ul className="space-y-1 md:space-y-2 text-slate-300 text-xs md:text-sm">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="text-green-400 flex-shrink-0" size={14} />
                    Todas las actividades (carreras, caminatas, ciclismo)
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="text-green-400 flex-shrink-0" size={14} />
                    Distancia, ritmo, elevación, frecuencia cardíaca
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="text-green-400 flex-shrink-0" size={14} />
                    Fechas y duración de actividades
                  </li>
                </ul>
              </div>
            )}
          </div>

          {/* Garmin Integration Card (Coming Soon) */}
          <div className="bg-slate-800/30 backdrop-blur-sm rounded-2xl shadow-xl p-4 md:p-8 border border-slate-700/50 opacity-60">
            <div className="flex items-center gap-3 md:gap-4">
              <div className="w-12 h-12 md:w-16 md:h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">
                <svg className="w-7 h-7 md:w-10 md:h-10 text-white" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12.753.753L12 0l-.753.753-10.5 10.5-.753.753.753.753 10.5 10.5.753.753.753-.753 10.5-10.5.753-.753-.753-.753-10.5-10.5zM12 3.319l8.685 8.685L12 20.689l-8.685-8.685L12 3.319z" />
                </svg>
              </div>
              <div>
                <h2 className="text-lg md:text-2xl font-bold text-white flex flex-wrap items-center gap-2">
                  Garmin Connect
                  <span className="text-xs bg-purple-600/30 text-purple-300 px-2 py-1 rounded">
                    Próximamente
                  </span>
                </h2>
                <p className="text-slate-400 text-xs md:text-sm mt-1">
                  Integración con Garmin próximamente
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
