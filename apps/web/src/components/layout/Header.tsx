import { Link, useLocation } from 'react-router-dom';
import { Home, Upload, Link2, LogOut } from 'lucide-react';
import { useSession, signOut } from '../../lib/auth-client';

export function Header() {
  const location = useLocation();
  const { data: session } = useSession();

  const handleLogout = async () => {
    await signOut();
  };

  const navItems = [
    { icon: Home, label: 'Dashboard', path: '/' },
    { icon: Upload, label: 'Files', path: '/files' },
    { icon: Link2, label: 'Integrations', path: '/integrations' },
  ];

  return (
    <header className="hidden md:block bg-slate-900/80 backdrop-blur-lg border-b border-slate-700 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">FT</span>
            </div>
            <span className="text-white font-semibold text-lg">FitTrackr</span>
          </Link>

          {/* Navigation */}
          <nav className="flex items-center gap-1">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              const Icon = item.icon;

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-purple-600 text-white'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <Icon size={18} />
                  <span className="text-sm font-medium">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* User menu */}
          <div className="flex items-center gap-4">
            {session && (
              <>
                <span className="text-slate-400 text-sm">
                  {session.user.email}
                </span>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 px-3 py-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                >
                  <LogOut size={18} />
                  <span className="text-sm">Logout</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
