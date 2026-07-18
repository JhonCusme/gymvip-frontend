import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  Building2, BarChart3, Palette, Database,
  Settings, LogOut,CreditCard, Menu, X
} from 'lucide-react';

const navItems = [
  { to: '/super/gyms',      icon: Building2, label: 'Gimnasios' },
  { to: '/super/subscriptions', icon: CreditCard, label: 'Suscripciones' },
  { to: '/super/reports',   icon: BarChart3,  label: 'Reporte Global' },
  { to: '/super/themes',    icon: Palette,    label: 'Marketplace Temas' },
  { to: '/super/backup',    icon: Database,   label: 'Respaldo BD' },
  { to: '/super/settings',  icon: Settings,   label: 'Configuración' },
];

export default function SuperAdminLayout({ children }) {
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <div className="super-admin-layout flex h-screen overflow-hidden" style={{ background: '#f9fafb' }}>
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/40 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <aside className={`w-52 flex-shrink-0 flex flex-col border-r border-gray-200 bg-white fixed lg:relative h-full z-50 transition-transform duration-300
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <p className="text-xs font-bold text-red-600 uppercase tracking-widest">Super Admin</p>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-gray-400 hover:text-gray-700">
            <X size={18} />
          </button>
        </div>

        <nav className="flex-1 p-3 flex flex-col gap-0.5 overflow-y-auto">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink key={to} to={to}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}>
              <Icon size={16} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

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
          <button onClick={logout}
            className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition-colors">
            <LogOut size={14} />
            Cerrar sesión
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto">
        <div className="lg:hidden sticky top-0 z-30 flex items-center gap-3 p-4 border-b border-gray-200 bg-white">
          <button onClick={() => setSidebarOpen(true)} className="text-gray-600 hover:text-gray-900">
            <Menu size={22} />
          </button>
          <p className="text-sm font-bold text-red-600 uppercase tracking-widest">Super Admin</p>
        </div>
        <div className="p-4 lg:p-8 min-h-full" style={{ color: '#111827' }}>
          <div className="hidden lg:block text-right text-sm text-gray-400 mb-2">
            {new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </div>
          {children}
        </div>
      </main>
    </div>
  );
}