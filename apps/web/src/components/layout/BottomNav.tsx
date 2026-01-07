import { useLocation, Link } from 'react-router-dom';
import { Home, Upload, Link2, User } from 'lucide-react';
import { useSession, signOut } from '../../lib/auth-client';

interface NavItem {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
  path: string;
  action?: () => void;
}

export function BottomNav() {
  const location = useLocation();
  const { data: session } = useSession();

  const handleLogout = async () => {
    await signOut();
  };

  const navItems: NavItem[] = [
    { icon: Home, label: 'Inicio', path: '/' },
    { icon: Upload, label: 'Archivos', path: '/files' },
    { icon: Link2, label: 'Conectar', path: '/integrations' },
    { icon: User, label: 'Perfil', path: '#logout', action: handleLogout },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-slate-900/95 backdrop-blur-lg border-t border-slate-700 md:hidden z-50">
      <div className="flex items-center justify-around pb-safe-bottom">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;

          if (item.action) {
            return (
              <button
                key={item.label}
                onClick={item.action}
                className="flex flex-col items-center py-3 px-4 min-w-[64px] transition-colors"
              >
                <Icon
                  size={24}
                  className={isActive ? 'text-purple-400' : 'text-slate-400'}
                />
                <span
                  className={`text-xs mt-1 ${
                    isActive ? 'text-purple-400 font-medium' : 'text-slate-400'
                  }`}
                >
                  {session ? 'Salir' : item.label}
                </span>
              </button>
            );
          }

          return (
            <Link
              key={item.path}
              to={item.path}
              className="flex flex-col items-center py-3 px-4 min-w-[64px] transition-colors"
            >
              <Icon
                size={24}
                className={isActive ? 'text-purple-400' : 'text-slate-400'}
              />
              <span
                className={`text-xs mt-1 ${
                  isActive ? 'text-purple-400 font-medium' : 'text-slate-400'
                }`}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
