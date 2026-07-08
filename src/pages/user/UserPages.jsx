import { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { userAPI, wodAPI } from '../../api';
import { Spinner, Modal, Field } from '../../components/ui';
import { Home, Calendar, QrCode, User, ChevronRight, Dumbbell, Clock, CreditCard, Bell, Lock, HelpCircle, LogOut, ArrowLeft, X, Check } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import toast from 'react-hot-toast';

// ============================================================
// BOTTOM NAV - Mobile
// ============================================================
function BottomNav() {
  const { gym } = useAuth();
  const primaryColor = gym?.primaryColor || '#E85D04';
  const items = [
    { to: '/usuario/home', icon: Home, label: 'Inicio' },
    { to: '/usuario/schedule', icon: Calendar, label: 'Horarios' },
    { to: '/usuario/qr', icon: QrCode, label: 'Mi QR' },
    { to: '/usuario/profile', icon: User, label: 'Perfil' },
  ];
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 flex border-t"
      style={{ background: '#111', borderColor: 'rgba(255,255,255,0.08)' }}>
      {items.map(({ to, icon: Icon, label }) => (
        <NavLink key={to} to={to} end={to === '/usuario/home'}
          className={({ isActive }) => `flex-1 flex flex-col items-center py-2.5 transition-all ${isActive ? '' : 'opacity-40'}`}
          style={({ isActive }) => isActive ? { color: primaryColor } : {}}>
          <Icon size={20} />
          <span className="text-xs mt-0.5">{label}</span>
        </NavLink>
      ))}
    </nav>
  );
}

// Wrapper del layout usuario (mobile-first)
export function UserLayout({ children, title, showBack = false }) {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen pb-20" style={{ background: '#0d0d0d', maxWidth: '430px', margin: '0 auto' }}>
      {title && (
        <div className="flex items-center gap-3 px-4 py-4 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
          {showBack && (
            <button onClick={() => navigate(-1)} className="opacity-50 hover:opacity-100 transition-opacity">
              <ArrowLeft size={20} />
            </button>
          )}
          <h1 className="font-bold text-sm">{title}</h1>
        </div>
      )}
      <div className="px-4 pt-4">{children}</div>
      <BottomNav />
    </div>
  );
}

// ============================================================
// HOME USUARIO
// ============================================================
export function UserHomePage() {
  const { user, gym } = useAuth();
  const primaryColor = gym?.primaryColor || '#E85D04';
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showPlans, setShowPlans] = useState(false);
  const [plans, setPlans] = useState([]);

  useEffect(() => {
    userAPI.getHome()
      .then(r => setData(r.data))
      .catch(() => toast.error('Error al cargar'))
      .finally(() => setLoading(false));
  }, []);

  const openPlans = async () => {
    try { const r = await userAPI.getMembershipPlans(); setPlans(r.data); setShowPlans(true); }
    catch { toast.error('Error al cargar planes'); }
  };

  if (loading) return (
    <UserLayout title="Inicio">
      <div className="flex justify-center py-20"><Spinner size={28} className="opacity-30" /></div>
    </UserLayout>
  );

  const { membership } = data || {};
  const hasActiveMem = membership && new Date(membership.end_date) >= new Date();

  const quickActions = [
    { icon: Calendar, label: 'Agendar', to: '/usuario/schedule' },
    { icon: QrCode, label: 'Mi QR', to: '/usuario/qr' },
    { icon: Clock, label: 'Mis Clases', to: '/usuario/bookings' },
    { icon: Dumbbell, label: 'WOD Hoy', to: '/usuario/wod' },
    { icon: Dumbbell, label: 'Entrenamiento', to: '/usuario/training' },
  ];

  return (
    <UserLayout title="Inicio">
      {/* Saludo */}
      <h1 className="text-2xl font-black mb-1">¡Hola, {user?.name?.split(' ')[0]}!</h1>
      <p className="text-sm mb-4" style={{ color: primaryColor }}>Listo para entrenar hoy?</p>

      {/* Estado membresía */}
      <div className={`rounded-2xl p-4 mb-4 border ${hasActiveMem ? 'border-green-500/30' : 'border-red-500/30'}`}
        style={{ background: hasActiveMem ? 'rgba(22,163,74,0.08)' : 'rgba(220,38,38,0.08)' }}>
        {hasActiveMem ? (
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
                <Check size={14} className="text-white" />
              </div>
              <p className="font-bold text-green-400">Membresía Activa</p>
            </div>
            <p className="text-sm font-semibold">{membership.type_name}</p>
            <p className="text-xs opacity-50">
              Inicio: {new Date(membership.start_date?.split('T')[0] + 'T00:00:00').toLocaleDateString('es-EC')}
            </p>
            <p className="text-xs opacity-50">
              Válida hasta: {new Date(membership.end_date?.split('T')[0] + 'T00:00:00').toLocaleDateString('es-EC')}
            </p>
            {membership.auto_renew && (
              <>
                <div className="mt-2 flex items-center gap-1.5">
                  <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-500/20 text-green-400">↺ Renovación automática activa</span>
                </div>
                <button className="text-xs mt-1" style={{ color: primaryColor }}>↺ Cobro automático activo</button>
              </>
            )}
          </div>
        ) : (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 rounded-full bg-red-500 flex items-center justify-center">
                <X size={14} className="text-white" />
              </div>
              <p className="font-bold text-red-400">Membresía Vencida</p>
            </div>
            {membership?.recurring_failed_attempts > 0 && membership?.recurring_failed_attempts < 3 && (
              <p className="text-xs text-yellow-400 mb-2">
                ⚠ Tu cobro automático falló ({membership.recurring_failed_attempts}/3 intentos). Puedes pagar manualmente ahora.
              </p>
            )}
            {membership?.recurring_failed_attempts >= 3 && (
              <p className="text-xs text-red-400 mb-2">
                Tu cobro automático se desactivó tras 3 intentos fallidos. Realiza el pago manualmente para reactivar tu membresía.
              </p>
            )}
            {gym?.payphoneEnabled && (
              <button onClick={openPlans}
                className="w-full py-2.5 rounded-xl font-bold text-white text-sm mt-1"
                style={{ backgroundColor: primaryColor }}>
                Pagar ahora
              </button>
            )}
          </div>
        )}
        </div>

      {/* Tu gimnasio */}
      <div className="rounded-2xl p-4 mb-4 border" style={{ background: '#1a1a1a', borderColor: 'rgba(255,255,255,0.06)' }}>
        <p className="text-xs font-bold uppercase tracking-widest mb-2 flex items-center gap-1.5" style={{ color: primaryColor }}>
          ✦ TU GIMNASIO
        </p>
        <p className="font-black text-lg">{data?.gym?.name}</p>
        {data?.gym?.address && <p className="text-xs opacity-50 flex items-center gap-1 mt-1">📍 {data.gym.address}</p>}
        {data?.gym?.phone && <p className="text-xs opacity-50 flex items-center gap-1">📞 {data.gym.phone}</p>}
        {data?.gym?.email && <p className="text-xs opacity-50 flex items-center gap-1">✉ {data.gym.email}</p>}
      </div>

      {/* Acciones rápidas */}
      <p className="font-bold mb-3">Acciones Rápidas</p>
      <div className="grid grid-cols-2 gap-3 mb-5">
        {quickActions.map(({ icon: Icon, label, to }) => (
          <NavLink key={label} to={to}
            className="rounded-2xl p-4 flex flex-col items-center gap-2 border transition-all hover:opacity-80"
            style={{ background: '#1a1a1a', borderColor: 'rgba(255,255,255,0.06)' }}>
            <Icon size={24} style={{ color: primaryColor }} />
            <span className="text-xs font-medium">{label}</span>
          </NavLink>
        ))}
      </div>

      {/* Próximas clases */}
      <p className="font-bold mb-3">Tus Próximas Clases</p>
      {data?.upcomingClasses?.length === 0 ? (
        <div className="rounded-2xl p-4 text-center border" style={{ background: '#1a1a1a', borderColor: 'rgba(255,255,255,0.06)' }}>
          <p className="text-xs opacity-30">No tienes clases agendadas. ¡Reserva una ahora!</p>
        </div>
      ) : (
        data?.upcomingClasses?.map(cls => (
          <div key={cls.id} className="rounded-xl p-3 mb-2 flex items-center justify-between"
            style={{ background: '#1a1a1a' }}>
            <div>
              <p className="font-semibold text-sm">{cls.session_name}</p>
              <p className="text-xs opacity-40">
                {new Date(cls.class_date).toLocaleDateString('es-EC')} · {cls.start_time?.slice(0,5)}
              </p>
            </div>
            <span className="badge-active">confirmada</span>
          </div>
        ))
      )}

      {/* Modal planes PayPhone */}
      <Modal open={showPlans} onClose={() => setShowPlans(false)} title="Selecciona un plan">
        <p className="text-xs opacity-50 mb-4">Elige el plan de membresía que deseas adquirir</p>
        <div className="flex flex-col gap-2">
          {plans.filter(p => p.is_active).map(plan => (
            <button key={plan.id}
              onClick={() => { setShowPlans(false); navigate(`/usuario/payphone?plan=${plan.id}`); }}
              className="text-left p-4 rounded-xl border transition-all hover:opacity-80"
              style={{ background: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.08)' }}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold">{plan.name}</p>
                  <p className="text-xs opacity-50">{plan.duration_value} {plan.duration_unit === 'months' ? 'días' : plan.duration_unit}</p>
                  {plan.description && <p className="text-xs opacity-40">{plan.description}</p>}
                </div>
                <p className="text-xl font-black" style={{ color: primaryColor }}>
                  ${parseFloat(plan.price).toFixed(2)}
                </p>
              </div>
            </button>
          ))}
        </div>
        <button onClick={() => setShowPlans(false)} className="w-full mt-4 py-2.5 rounded-xl text-sm opacity-50 border border-white/10">
          Cancelar
        </button>
      </Modal>
    </UserLayout>
  );
}

// ============================================================
// HORARIOS USUARIO
// ============================================================
export function UserSchedulePage() {
  const { gym } = useAuth();
  const primaryColor = gym?.primaryColor || '#E85D04';
  const [classes, setClasses] = useState([]);
  const [hasMembership, setHasMembership] = useState(false);
  const [loading, setLoading] = useState(false);
  const [dates, setDates] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [booking, setBooking] = useState(null);

  // Generar próximos 7 días
  useEffect(() => {
    const d = [];
    for (let i = 0; i < 8; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);
      d.push({
        date: date.toISOString().split('T')[0],
        day: date.toLocaleDateString('es-ES', { weekday: 'short' }),
        num: date.getDate()
      });
    }
    setDates(d);
  }, []);

  const load = async (date) => {
    setLoading(true);
    try {
      const r = await userAPI.getSchedule({ date });
      setClasses(r.data.classes); setHasMembership(r.data.hasMembership);
    } catch { toast.error('Error al cargar horarios'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(selectedDate); }, [selectedDate]);

  const handleBook = async (classId) => {
    if (!hasMembership) return toast.error('Necesitas una membresía activa para reservar');
    setBooking(classId);
    try {
      await userAPI.bookClass(classId);
      toast.success('¡Clase reservada exitosamente!');
      load(selectedDate);
    } catch (err) { toast.error(err.response?.data?.error || 'Error al reservar'); }
    finally { setBooking(null); }
  };

  return (
    <UserLayout title="Horarios">
      {/* Selector de fecha */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-5 -mx-4 px-4">
        {dates.map(d => (
          <button key={d.date} onClick={() => setSelectedDate(d.date)}
            className="flex-shrink-0 flex flex-col items-center p-2.5 rounded-xl w-14 transition-all"
            style={selectedDate === d.date
              ? { backgroundColor: primaryColor, color: '#fff' }
              : { background: '#1a1a1a', opacity: 0.6 }}>
            <span className="text-xs font-medium">{d.day}</span>
            <span className="text-lg font-black">{d.num}</span>
            {selectedDate === d.date && <div className="w-1 h-1 rounded-full bg-white mt-0.5" />}
          </button>
        ))}
      </div>

      <p className="text-sm font-semibold opacity-60 mb-3">
        Clases disponibles — {new Date(selectedDate + 'T00:00:00').toLocaleDateString('es-ES', { weekday: 'long' })}
      </p>

      {loading ? <div className="flex justify-center py-16"><Spinner size={28} className="opacity-30" /></div>
        : classes.length === 0
          ? <p className="text-center text-sm opacity-30 py-12">No hay clases disponibles este día</p>
          : classes.map(cls => {
            const booked = parseInt(cls.booked_count);
            const free = cls.max_capacity - booked;
            return (
              <div key={cls.id} onClick={() => !cls.is_booked && free > 0 && hasMembership && handleBook(cls.id)}
                className="flex items-center justify-between p-4 rounded-xl mb-2 cursor-pointer transition-all hover:opacity-80"
                style={{ background: '#1a1a1a' }}>
                <div className="flex items-center gap-4">
                  <div className="text-right w-12">
                    <p className="text-lg font-black">{cls.start_time?.slice(0,5)}</p>
                  </div>
                  <div>
                    <p className="font-bold">{cls.session_name}</p>
                    {cls.instructor_name && <p className="text-xs opacity-40 flex items-center gap-1">👤 {cls.instructor_name}</p>}
                  </div>
                </div>
                <div className="text-right">
                  {cls.is_booked ? (
                    <span className="text-xs font-bold" style={{ color: primaryColor }}>✓ Reservada</span>
                  ) : (
                    <span className={`text-xs font-bold ${free === 0 ? 'text-red-400' : 'text-green-400'}`}>
                      {free === 0 ? 'Lleno' : `${booked}/${cls.max_capacity}`}
                    </span>
                  )}
                  <p className="text-xs opacity-30">{free === 0 ? '' : `${free} libres`}</p>
                  {booking === cls.id && <Spinner size={14} className="ml-auto" style={{ color: primaryColor }} />}
                </div>
              </div>
            );
          })}
    </UserLayout>
  );
}

// ============================================================
// MI QR USUARIO
// ============================================================
export function UserQRPage() {
  const { gym } = useAuth();
  const primaryColor = gym?.primaryColor || '#E85D04';
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    userAPI.getMyQR()
      .then(r => setData(r.data))
      .catch(() => toast.error('Error al cargar QR'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <UserLayout title="Mi QR"><div className="flex justify-center py-20"><Spinner size={28} className="opacity-30" /></div></UserLayout>;

  const hasActiveMem = data?.membership && new Date(data.membership.end_date) >= new Date();

  return (
    <UserLayout title="Mi QR">
      {/* Banner membresía vencida */}
      {!hasActiveMem && (
        <div className="flex items-center gap-3 p-3 rounded-xl mb-4 bg-red-500/20 border border-red-500/30">
          <X size={18} className="text-red-400 flex-shrink-0" />
          <p className="font-bold text-red-400 text-sm">Membresía Vencida</p>
        </div>
      )}

      {/* QR */}
      <div className="bg-white rounded-2xl p-6 mb-4 flex flex-col items-center">
        <p className="text-gray-900 font-bold text-lg mb-1">{data?.name}</p>
        <p className="text-gray-500 text-xs mb-4">Cédula: {data?.cedula}</p>
        {data?.qrCode ? (
          <QRCodeSVG value={data.qrCode} size={220} level="H" />
        ) : (
          <div className="w-52 h-52 bg-gray-100 rounded-xl flex items-center justify-center">
            <QrCode size={48} className="text-gray-400" />
          </div>
        )}
        <p className="text-gray-400 text-xs mt-4 text-center">Muestra este código al ingresar</p>
      </div>

      {/* Advertencia si vencida */}
      {!hasActiveMem && (
        <div className="p-4 rounded-xl flex items-start gap-3" style={{ background: 'rgba(217,119,6,0.15)', border: '1px solid rgba(217,119,6,0.3)' }}>
          <span className="text-yellow-400 text-lg">⚠</span>
          <p className="text-sm text-yellow-400">Tu membresía ha vencido. Renuévala para continuar accediendo al gimnasio.</p>
        </div>
      )}
    </UserLayout>
  );
}

// ============================================================
// PERFIL USUARIO
// ============================================================
export function UserProfilePage() {
  const { user, gym, logout } = useAuth();
  const primaryColor = gym?.primaryColor || '#E85D04';
  const navigate = useNavigate();

  const menuItems = [
    { icon: User, label: 'Editar Perfil', to: '/usuario/edit-profile' },
    { icon: Calendar, label: 'Mis Reservas', to: '/usuario/bookings' },
    { icon: Dumbbell, label: 'Mi Entrenamiento', to: '/usuario/training' },
    { icon: Clock, label: 'Historial de Entrenamientos', to: '/usuario/training-history' },
    { icon: CreditCard, label: 'Historial de Pagos', to: '/usuario/payment-history' },
    { icon: Bell, label: 'Notificaciones', to: '/usuario/notifications' },
    { icon: Lock, label: 'Cambiar Contraseña', to: '/usuario/change-password' },
    { icon: HelpCircle, label: 'Ayuda', to: '/usuario/help' },
  ];

  return (
    <UserLayout title="Perfil">
      {/* Avatar */}
      <div className="flex flex-col items-center py-6">
        <div className="w-20 h-20 rounded-full flex items-center justify-center text-white text-3xl font-black mb-3"
          style={{ backgroundColor: primaryColor }}>
          {user?.name?.charAt(0).toUpperCase()}
        </div>
        <p className="text-xl font-black">{user?.name}</p>
        <p className="text-xs opacity-40 mt-0.5">{user?.email || 'Sin email registrado'}</p>
      </div>

      {/* Info */}
      <div className="rounded-2xl p-4 mb-4 border" style={{ background: '#1a1a1a', borderColor: 'rgba(255,255,255,0.06)' }}>
        <div className="flex items-center gap-3 mb-2">
          <CreditCard size={14} style={{ color: primaryColor }} />
          <div>
            <p className="text-xs opacity-40">Cédula</p>
            <p className="text-sm font-semibold">{user?.cedula}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Bell size={14} style={{ color: primaryColor }} />
          <div>
            <p className="text-xs opacity-40">Teléfono</p>
            <p className="text-sm font-semibold">{user?.phone || 'No registrado'}</p>
          </div>
        </div>
      </div>

      {/* Menú */}
      <div className="rounded-2xl overflow-hidden border" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
        {menuItems.map(({ icon: Icon, label, to }, i) => (
          <button key={label} onClick={() => navigate(to)}
            className="flex items-center justify-between w-full p-4 text-left transition-all hover:bg-white/5 border-b"
            style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
            <div className="flex items-center gap-3">
              <Icon size={18} style={{ color: primaryColor }} />
              <span className="text-sm font-medium">{label}</span>
            </div>
            <ChevronRight size={16} className="opacity-30" />
          </button>
        ))}
      </div>

      <button onClick={logout} className="flex items-center gap-3 w-full p-4 mt-3 rounded-2xl text-left transition-all hover:bg-red-500/10"
        style={{ border: '1px solid rgba(220,38,38,0.2)' }}>
        <LogOut size={18} className="text-red-400" />
        <span className="text-sm font-medium text-red-400">Cerrar sesión</span>
      </button>
    </UserLayout>
  );
}

// ============================================================
// EDITAR PERFIL USUARIO
// ============================================================
export function UserEditProfilePage() {
  const { gym } = useAuth();
  const primaryColor = gym?.primaryColor || '#E85D04';
  const navigate = useNavigate();
  const [form, setForm] = useState({ cedula: '', name: '', email: '', phone: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    userAPI.getProfile()
      .then(r => { const u = r.data.user; setForm({ cedula: u.cedula, name: u.name, email: u.email || '', phone: u.phone || '' }); })
      .finally(() => setLoading(false));
  }, []);

  const save = async () => {
    setSaving(true);
    try { await userAPI.updateProfile({ name: form.name, email: form.email, phone: form.phone }); toast.success('Perfil actualizado'); navigate(-1); }
    catch { toast.error('Error al guardar'); }
    finally { setSaving(false); }
  };

  return (
    <UserLayout title="Editar Perfil" showBack>
      {loading ? <div className="flex justify-center py-16"><Spinner size={24} className="opacity-30" /></div> : (
        <div className="flex flex-col gap-4">
          <Field label="Cédula"><input className="input-field" value={form.cedula} disabled /></Field>
          <Field label="Nombre"><input className="input-field" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></Field>
          <Field label="Email"><input className="input-field" type="email" placeholder="correo@ejemplo.com" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></Field>
          <Field label="Teléfono"><input className="input-field" placeholder="0991234567" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} /></Field>
          <button onClick={save} disabled={saving}
            className="w-full py-3.5 rounded-xl font-bold text-white mt-2 flex items-center justify-center gap-2"
            style={{ backgroundColor: primaryColor }}>
            {saving && <Spinner size={16} className="text-white" />} Guardar Cambios
          </button>
        </div>
      )}
    </UserLayout>
  );
}

// ============================================================
// MIS RESERVAS
// ============================================================
export function UserBookingsPage() {
  const { gym } = useAuth();
  const primaryColor = gym?.primaryColor || '#E85D04';
  const [data, setData] = useState({ upcoming: [], past: [], cancelled: [] });
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('upcoming');

  useEffect(() => {
    userAPI.getMyBookings()
      .then(r => setData(r.data))
      .catch(() => toast.error('Error al cargar'))
      .finally(() => setLoading(false));
  }, []);

  const tabData = { upcoming: 'Clases por recibir', past: 'Clases ya recibidas', cancelled: 'Clases canceladas' };
  const current = data[tab] || [];

  return (
    <UserLayout title="Mis Reservas" showBack>
      <div className="relative mb-4">
        <input className="input-field pl-9" placeholder="Buscar por clase o instructor" />
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 opacity-30" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
      </div>

      {loading ? <div className="flex justify-center py-16"><Spinner size={24} className="opacity-30" /></div> : (
        Object.keys(tabData).map(key => (
          <div key={key} className="mb-4">
            <p className="font-bold text-sm mb-2">{tabData[key]}</p>
            {data[key]?.length === 0
              ? <p className="text-xs opacity-30 ml-1">No tienes {key === 'upcoming' ? 'reservas activas' : key === 'past' ? 'clases recibidas' : 'clases canceladas'}.</p>
              : data[key]?.map(b => (
                <div key={b.id} className="flex items-center justify-between p-3 rounded-xl mb-1.5" style={{ background: '#1a1a1a' }}>
                  <div>
                    <p className="font-semibold text-sm">{b.session_name}</p>
                    <p className="text-xs opacity-40">{new Date(b.class_date).toLocaleDateString('es-EC')} · {b.start_time?.slice(0,5)}</p>
                  </div>
                  <span className={b.status === 'confirmed' ? 'badge-active' : b.status === 'attended' ? 'badge-info' : 'badge-inactive'}>{b.status}</span>
                </div>
              ))
            }
          </div>
        ))
      )}
    </UserLayout>
  );
}

// ============================================================
// HISTORIAL DE PAGOS
// ============================================================
export function UserPaymentHistoryPage() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    userAPI.getPaymentHistory()
      .then(r => setPayments(r.data))
      .finally(() => setLoading(false));
  }, []);

  return (
    <UserLayout title="Historial de Pagos" showBack>
      {loading ? <div className="flex justify-center py-16"><Spinner size={24} className="opacity-30" /></div>
        : payments.length === 0
          ? <p className="text-center text-sm opacity-30 py-12">No tienes pagos registrados.</p>
          : payments.map(p => (
            <div key={p.id} className="flex items-center justify-between p-3 rounded-xl mb-2" style={{ background: '#1a1a1a' }}>
              <div>
                <p className="font-semibold text-sm">{p.membership_name || 'Pago'}</p>
                <p className="text-xs opacity-40">{new Date(p.created_at).toLocaleDateString('es-EC')} · {p.method}</p>
              </div>
              <div className="text-right">
                <p className="font-black text-green-400">${parseFloat(p.amount).toFixed(2)}</p>
                <span className={p.status === 'pagado' ? 'badge-active text-xs' : 'badge-inactive text-xs'}>{p.status}</span>
              </div>
            </div>
          ))
      }
    </UserLayout>
  );
}

// ============================================================
// NOTIFICACIONES
// ============================================================
export function UserNotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    userAPI.getNotifications()
      .then(r => setNotifications(r.data))
      .finally(() => setLoading(false));
  }, []);

  return (
    <UserLayout title="Notificaciones" showBack>
      {loading ? <div className="flex justify-center py-16"><Spinner size={24} className="opacity-30" /></div>
        : notifications.length === 0
          ? (
            <div className="flex flex-col items-center justify-center py-16 opacity-30">
              <Bell size={40} className="mb-4 opacity-40" />
              <p className="text-sm">No tienes notificaciones</p>
            </div>
          )
          : notifications.map(n => (
            <div key={n.id} className="p-3 rounded-xl mb-2" style={{ background: '#1a1a1a' }}>
              <p className="font-semibold text-sm">{n.title}</p>
              <p className="text-xs opacity-50 mt-0.5">{n.message}</p>
              <p className="text-xs opacity-30 mt-1">{new Date(n.created_at).toLocaleDateString('es-EC')}</p>
            </div>
          ))
      }
    </UserLayout>
  );
}

// ============================================================
// WOD DEL DÍA — USUARIO
// ============================================================
export function UserWodPage() {
  const { gym } = useAuth();
  const primaryColor = gym?.primaryColor || '#E85D04';
  const [wod, setWod] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    wodAPI.getUserWod()
      .then(r => setWod(r.data))
      .catch(() => toast.error('Error al cargar WOD'))
      .finally(() => setLoading(false));
  }, []);

  const today = new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <UserLayout title="WOD de Hoy" showBack>
      {loading ? (
        <div className="flex justify-center py-20"><Spinner size={24} className="opacity-30" /></div>
      ) : !wod ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="text-6xl mb-4">💪</div>
          <p className="font-bold text-lg opacity-50">Sin WOD programado</p>
          <p className="text-sm opacity-30 mt-1">No hay entrenamiento programado para hoy.</p>
          <p className="text-xs opacity-20 mt-1 capitalize">{today}</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {/* Header */}
          <div className="rounded-2xl p-5 relative overflow-hidden" style={{ background: '#1a1a1a' }}>
            <div className="absolute right-4 top-4 text-6xl opacity-5">💪</div>
            <p className="text-xs font-bold uppercase tracking-widest mb-1 capitalize" style={{ color: primaryColor }}>{today}</p>
            <h2 className="text-2xl font-black">{wod.title || 'WOD del Día'}</h2>
            {wod.description && <p className="text-sm opacity-60 mt-2">{wod.description}</p>}
          </div>

          {/* Calentamiento */}
          {wod.warmup && (
            <div className="rounded-2xl p-4" style={{ background: '#1a1a1a' }}>
              <p className="text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-2">
                🔥 <span style={{ color: primaryColor }}>Calentamiento</span>
              </p>
              <p className="text-sm opacity-80 whitespace-pre-wrap leading-relaxed">{wod.warmup}</p>
            </div>
          )}

          {/* Workout */}
          {wod.workout && (
            <div className="rounded-2xl p-4 border" style={{ background: '#1a1a1a', borderColor: `${primaryColor}40` }}>
              <p className="text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-2">
                ⚡ <span style={{ color: primaryColor }}>Workout</span>
              </p>
              <p className="text-sm opacity-80 whitespace-pre-wrap leading-relaxed font-mono">{wod.workout}</p>
            </div>
          )}

          {/* Enfriamiento */}
          {wod.cooldown && (
            <div className="rounded-2xl p-4" style={{ background: '#1a1a1a' }}>
              <p className="text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-2">
                ❄️ <span style={{ color: primaryColor }}>Enfriamiento</span>
              </p>
              <p className="text-sm opacity-80 whitespace-pre-wrap leading-relaxed">{wod.cooldown}</p>
            </div>
          )}

          {/* Notas del coach */}
          {wod.notes && (
            <div className="rounded-2xl p-4" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <p className="text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-2">
                📝 <span className="opacity-50">Notas del Coach</span>
              </p>
              <p className="text-sm opacity-60 whitespace-pre-wrap leading-relaxed">{wod.notes}</p>
            </div>
          )}
        </div>
      )}
    </UserLayout>
  );
}
