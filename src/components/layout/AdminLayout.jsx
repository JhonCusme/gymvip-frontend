import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard, QrCode, ClipboardList, Users, CreditCard,
  CalendarDays, Dumbbell, Clock, UserCheck, Users2,
  Wallet, BarChart2, Shield, Settings, LogOut, Menu, X, CalendarCheck, Gift
} from 'lucide-react';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/dashboard/validate', icon: QrCode, label: 'Validar Ingreso' },
  { to: '/dashboard/attendance', icon: ClipboardList, label: 'Historial Ingresos' },
  { to: '/dashboard/users', icon: Users, label: 'Usuarios' },
  { to: '/dashboard/birthdays', icon: Gift, label: 'Cumpleañeros' },
  { to: '/dashboard/memberships', icon: CreditCard, label: 'Planes' },
  { to: '/dashboard/active-memberships', icon: CreditCard, label: 'Membresías' },
  { to: '/dashboard/sessions', icon: CalendarDays, label: 'Sesiones' },
  { to: '/dashboard/workouts', icon: Dumbbell, label: 'Entrenamientos' },
  { to: '/dashboard/schedules', icon: Clock, label: 'Horarios' },
  { to: '/dashboard/attendance-correction', icon: CalendarCheck, label: 'Corregir Asistencia' },
  { to: '/dashboard/instructors', icon: UserCheck, label: 'Instructores' },
  { to: '/dashboard/receptionists', icon: Users2, label: 'Recepcionistas' },
  { to: '/dashboard/payments', icon: Wallet, label: 'Pagos' },
  { to: '/dashboard/reports', icon: BarChart2, label: 'Reportes' },
  { to: '/dashboard/audit', icon: Shield, label: 'Auditoría Recepción' },
  { to: '/dashboard/settings', icon: Settings, label: 'Configuración' },
];

export default function AdminLayout({ children }) {
  const { user, gym, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const primaryColor = gym?.primaryColor || '#E85D04';

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: '#0a0a0a' }}>
      {/* Overlay móvil */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* SIDEBAR */}
      <aside
        className={`w-52 flex-shrink-0 flex flex-col overflow-hidden fixed lg:relative h-full z-50 transition-transform duration-300
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
        style={{ background: '#111111', borderRight: '1px solid rgba(255,255,255,0.06)' }}
      >
        {/* Gym header */}
        <div className="p-4 border-b flex items-center justify-between" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
          <div className="flex items-center gap-2 min-w-0">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-black text-sm flex-shrink-0 overflow-hidden"
              style={{ backgroundColor: primaryColor }}
            >
              {gym?.logoUrl
                ? <img src={gym.logoUrl} alt="" className="w-full h-full object-contain" />
                : gym?.name?.charAt(0)?.toUpperCase() || 'G'
              }
            </div>
            <p className="text-xs font-bold truncate" style={{ color: primaryColor }}>
              {gym?.name || 'GymVIP'}
            </p>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden opacity-50 hover:opacity-100">
            <X size={18} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-2 flex flex-col gap-0.5 overflow-y-auto">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/dashboard'}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}
              style={({ isActive }) => isActive ? { backgroundColor: primaryColor } : {}}
            >
              <Icon size={15} />
              <span className="text-xs">{label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className="p-3 border-t" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
          <div className="flex items-center gap-2 mb-2">
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold"
              style={{ backgroundColor: primaryColor }}
            >
              {user?.name?.charAt(0)?.toUpperCase() || 'A'}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-white truncate">{user?.name}</p>
              <p className="text-xs opacity-40">{user?.isSuperAdmin ? 'super_admin' : 'admin'}</p>
              <p className="text-xs opacity-30 truncate">{gym?.name}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="flex items-center gap-2 w-full px-2 py-1.5 rounded-lg text-xs opacity-40 hover:opacity-80 hover:bg-white/5 transition-all"
          >
            <LogOut size={13} /> Cerrar sesión
          </button>
        </div>
      </aside>

      {/* CONTENT */}
      <main className="flex-1 overflow-y-auto" style={{ background: '#111111' }}>
        {/* Header móvil con botón hamburguesa */}
        <div className="lg:hidden sticky top-0 z-30 flex items-center gap-3 p-4 border-b" 
          style={{ background: '#111111', borderColor: 'rgba(255,255,255,0.06)' }}>
          <button onClick={() => setSidebarOpen(true)} className="opacity-70 hover:opacity-100">
            <Menu size={22} />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center overflow-hidden" style={{ backgroundColor: primaryColor }}>
              {gym?.logoUrl ? <img src={gym.logoUrl} alt="" className="w-full h-full object-contain" /> : <span className="text-white text-xs font-bold">{gym?.name?.charAt(0)}</span>}
            </div>
            <p className="text-sm font-bold" style={{ color: primaryColor }}>{gym?.name}</p>
          </div>
        </div>

        <div className="p-4 lg:p-6 min-h-full">
          <div className="hidden lg:flex justify-between items-center mb-1 text-xs opacity-30">
            <span>GESTIONANDO <strong>{gym?.name}</strong></span>
            <span>{new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
          </div>
          {children}
        </div>
      </main>
    </div>
  );
}