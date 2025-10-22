import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Activity, CheckCircle, XCircle, RefreshCw, Link as LinkIcon, Unlink } from 'lucide-react';

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
      setMessage({ type: 'success', text: 'Strava connected successfully!' });
      // Clear message after 5 seconds
      setTimeout(() => setMessage(null), 5000);
    } else if (stravaStatus === 'error') {
      setMessage({ type: 'error', text: 'Failed to connect Strava. Please try again.' });
      setTimeout(() => setMessage(null), 5000);
    }
  }, [searchParams]);

  const fetchIntegrations = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/integrations', {
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
      const response = await fetch('http://localhost:3001/api/integrations/strava/auth', {
        credentials: 'include',
      });
      const result = await response.json();

      if (result.success) {
        // Redirect to Strava authorization
        window.location.href = result.data.authUrl;
      } else {
        setMessage({ type: 'error', text: 'Failed to generate Strava auth URL' });
      }
    } catch (error) {
      console.error('Error connecting Strava:', error);
      setMessage({ type: 'error', text: 'Failed to connect to Strava' });
    }
  };

  const disconnectStrava = async () => {
    if (!confirm('Are you sure you want to disconnect Strava? Your imported workouts will remain.')) {
      return;
    }

    try {
      const response = await fetch('http://localhost:3001/api/integrations/strava', {
        method: 'DELETE',
        credentials: 'include',
      });
      const result = await response.json();

      if (result.success) {
        setMessage({ type: 'success', text: 'Strava disconnected successfully' });
        fetchIntegrations();
      } else {
        setMessage({ type: 'error', text: 'Failed to disconnect Strava' });
      }
    } catch (error) {
      console.error('Error disconnecting Strava:', error);
      setMessage({ type: 'error', text: 'Failed to disconnect Strava' });
    }
  };

  const syncStrava = async () => {
    setSyncing(true);
    setMessage(null);

    try {
      const response = await fetch('http://localhost:3001/api/integrations/strava/sync', {
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
          text: `Sync complete! Imported ${result.data.imported} activities, skipped ${result.data.skipped} duplicates`,
        });
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to sync activities' });
      }
    } catch (error) {
      console.error('Error syncing Strava:', error);
      setMessage({ type: 'error', text: 'Failed to sync Strava activities' });
    } finally {
      setSyncing(false);
    }
  };

  const stravaIntegration = integrations.find((i) => i.type === 'STRAVA');
  const isStravaConnected = stravaIntegration && stravaIntegration.isActive;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <Activity className="text-purple-400" size={40} />
          <div>
            <h1 className="text-4xl font-bold text-white">Integrations</h1>
            <p className="text-slate-400">Connect your fitness apps to import workouts</p>
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

        {/* Strava Integration Card */}
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl shadow-xl p-8 border border-slate-700 mb-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center">
                <svg className="w-10 h-10 text-white" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066m-7.008-5.599l2.836 5.598h4.172L10.463 0l-7.008 13.828h4.172" />
                </svg>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                  Strava
                  {isStravaConnected && (
                    <CheckCircle className="text-green-400" size={24} />
                  )}
                </h2>
                <p className="text-slate-400 mt-1">
                  {isStravaConnected
                    ? `Connected as ${stravaIntegration.metadata?.firstname} ${stravaIntegration.metadata?.lastname}`
                    : 'Connect your Strava account to import activities'}
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              {isStravaConnected ? (
                <>
                  <button
                    onClick={syncStrava}
                    disabled={syncing}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    <RefreshCw className={syncing ? 'animate-spin' : ''} size={18} />
                    {syncing ? 'Syncing...' : 'Sync Now'}
                  </button>
                  <button
                    onClick={disconnectStrava}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors flex items-center gap-2"
                  >
                    <Unlink size={18} />
                    Disconnect
                  </button>
                </>
              ) : (
                <button
                  onClick={connectStrava}
                  className="px-6 py-2 bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 text-white rounded-lg transition-all flex items-center gap-2"
                >
                  <LinkIcon size={18} />
                  Connect Strava
                </button>
              )}
            </div>
          </div>

          {isStravaConnected && (
            <div className="mt-6 pt-6 border-t border-slate-700">
              <h3 className="text-white font-semibold mb-3">What gets imported:</h3>
              <ul className="space-y-2 text-slate-300">
                <li className="flex items-center gap-2">
                  <CheckCircle className="text-green-400" size={16} />
                  All activities (runs, walks, cycling, etc.)
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="text-green-400" size={16} />
                  Distance, pace, elevation, and heart rate
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="text-green-400" size={16} />
                  Activity timestamps and duration
                </li>
              </ul>
            </div>
          )}
        </div>

        {/* Garmin Integration Card (Coming Soon) */}
        <div className="bg-slate-800/30 backdrop-blur-sm rounded-2xl shadow-xl p-8 border border-slate-700/50 opacity-60">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                <svg className="w-10 h-10 text-white" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12.753.753L12 0l-.753.753-10.5 10.5-.753.753.753.753 10.5 10.5.753.753.753-.753 10.5-10.5.753-.753-.753-.753-10.5-10.5zM12 3.319l8.685 8.685L12 20.689l-8.685-8.685L12 3.319z" />
                </svg>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                  Garmin Connect
                  <span className="text-xs bg-purple-600/30 text-purple-300 px-2 py-1 rounded">
                    Coming Soon
                  </span>
                </h2>
                <p className="text-slate-400 mt-1">
                  Garmin Connect integration will be available in a future release
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
