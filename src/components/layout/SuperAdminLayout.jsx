import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  Building2, BarChart3, Palette, Database,
  Settings, LogOut, ChevronLeft
} from 'lucide-react';

const navItems = [
  { to: '/super/gyms',      icon: Building2, label: 'Gimnasios' },
  { to: '/super/reports',   icon: BarChart3,  label: 'Reporte Global' },
  { to: '/super/themes',    icon: Palette,    label: 'Marketplace Temas' },
  { to: '/super/backup',    icon: Database,   label: 'Respaldo BD' },
  { to: '/super/settings',  icon: Settings,   label: 'Configuración' },
];

export default function SuperAdminLayout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="super-admin-layout flex h-screen overflow-hidden" style={{ background: '#f9fafb' }}>
      {/* SIDEBAR */}
      <aside className="w-52 flex-shrink-0 flex flex-col border-r border-gray-200 bg-white">
        {/* Header */}
        <div className="p-4 border-b border-gray-100">
          <p className="text-xs font-bold text-red-600 uppercase tracking-widest mb-0.5">Super Admin</p>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 flex flex-col gap-0.5 overflow-y-auto">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `sidebar-item ${isActive ? 'active' : ''}`
              }
            >
              <Icon size={16} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Footer usuario */}
        <div className="p-3 border-t border-gray-100">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-full bg-red-600 flex items-center justify-center text-white text-sm font-bold">
              {user?.name?.charAt(0)?.toUpperCase() || 'S'}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-gray-900 truncate">{user?.name || 'Super Admin'}</p>
              <p className="text-xs text-gray-400">super_admin</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition-colors"
          >
            <LogOut size={14} />
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* CONTENT */}
      <main className="flex-1 overflow-y-auto">
        <div className="p-8 min-h-full" style={{ color: '#111827' }}>
          {/* Fecha */}
          <div className="text-right text-sm text-gray-400 mb-2">
            {new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </div>
          {children}
        </div>
      </main>
    </div>
  );
}
