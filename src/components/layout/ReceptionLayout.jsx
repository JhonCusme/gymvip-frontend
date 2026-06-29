import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LayoutDashboard, Users, CreditCard, Wallet, QrCode, Clock, ClipboardList, LogOut } from 'lucide-react';

const navItems = [
  { to: '/recepcion', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/recepcion/clients', icon: Users, label: 'Clientes' },
  { to: '/recepcion/memberships', icon: CreditCard, label: 'Membresías' },
  { to: '/recepcion/payments', icon: Wallet, label: 'Pagos' },
  { to: '/recepcion/scanner', icon: QrCode, label: 'Escáner QR' },
  { to: '/recepcion/schedules', icon: Clock, label: 'Horarios' },
  { to: '/recepcion/attendance', icon: ClipboardList, label: 'Historial Ingresos' },
];

export default function ReceptionLayout({ children }) {
  const { user, gym, logout } = useAuth();
  const primaryColor = gym?.primaryColor || '#E85D04';

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: '#0a0a0a' }}>
      {/* SIDEBAR */}
      <aside className="w-48 flex-shrink-0 flex flex-col" style={{ background: '#111', borderRight: '1px solid rgba(255,255,255,0.06)' }}>
        {/* Gym header */}
        <div className="p-4 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-black text-sm"
              style={{ backgroundColor: primaryColor }}>
              {gym?.logoUrl
                ? <img src={gym.logoUrl} alt="" className="w-full h-full object-contain rounded-lg" />
                : gym?.name?.charAt(0)?.toUpperCase() || 'G'}
            </div>
            <p className="text-xs font-bold truncate" style={{ color: primaryColor }}>{gym?.name || 'GymVIP'}</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-2 flex flex-col gap-0.5 overflow-y-auto">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink key={to} to={to} end={to === '/recepcion'}
              className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}
              style={({ isActive }) => isActive ? { backgroundColor: primaryColor } : {}}>
              <Icon size={15} />
              <span className="text-xs">{label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className="p-3 border-t" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold"
              style={{ backgroundColor: primaryColor }}>
              {user?.name?.charAt(0)?.toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-white truncate">{user?.name}</p>
              <p className="text-xs opacity-40">Recepcionista</p>
            </div>
          </div>
          <button onClick={logout} className="flex items-center gap-2 w-full px-2 py-1.5 rounded-lg text-xs opacity-40 hover:opacity-80 hover:bg-white/5 transition-all">
            <LogOut size={13} /> Cerrar sesión
          </button>
        </div>
      </aside>

      {/* CONTENT */}
      <main className="flex-1 overflow-y-auto" style={{ background: '#111' }}>
        <div className="p-6 min-h-full">{children}</div>
      </main>
    </div>
  );
}
