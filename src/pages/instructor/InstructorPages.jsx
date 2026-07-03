import { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { instructorAPI } from '../../api';
import { Modal, Field, Spinner, EmptyState, PageLoader } from '../../components/ui';
import { CalendarDays, Dumbbell, History, User, LogOut, Plus, ChevronRight, ChevronLeft, Menu, X, Edit2, Trash2, Save } from 'lucide-react';
import toast from 'react-hot-toast';

// ============================================================
// LAYOUT INSTRUCTOR
// ============================================================
export function InstructorLayout({ children }) {
  const { user, gym, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const primaryColor = gym?.primaryColor || '#E85D04';
  const navItems = [
    { to: '/instructor', icon: CalendarDays, label: 'Clases del Día' },
    { to: '/instructor/wod', icon: Dumbbell, label: 'WOD del Día' },
    { to: '/instructor/routines', icon: Dumbbell, label: 'Rutinas y WODs' },
    { to: '/instructor/attendance', icon: History, label: 'Historial Asistencias' },
    { to: '/instructor/profile', icon: User, label: 'Mi Perfil' },
  ];

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: '#0a0a0a' }}>
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/60 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <aside className={`w-48 flex-shrink-0 flex flex-col fixed lg:relative h-full z-50 transition-transform duration-300
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
        style={{ background: '#111', borderRight: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="p-4 border-b flex items-center justify-between" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-black text-sm overflow-hidden flex-shrink-0"
              style={{ backgroundColor: primaryColor }}>
              {gym?.logoUrl
                ? <img src={gym.logoUrl} alt="" className="w-full h-full object-contain" />
                : gym?.name?.charAt(0)?.toUpperCase() || 'G'}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold truncate" style={{ color: primaryColor }}>{gym?.name}</p>
              <p className="text-xs opacity-30">Panel de Coach</p>
            </div>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden opacity-50 hover:opacity-100">
            <X size={18} />
          </button>
        </div>

        <nav className="flex-1 p-2 flex flex-col gap-0.5 overflow-y-auto">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink key={to} to={to} end={to === '/instructor'}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}
              style={({ isActive }) => isActive ? { backgroundColor: primaryColor } : {}}>
              <Icon size={15} /><span className="text-xs">{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="p-3 border-t" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold"
              style={{ backgroundColor: primaryColor }}>
              {user?.name?.charAt(0)?.toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-white truncate">{user?.name}</p>
              <p className="text-xs opacity-40">Instructor</p>
            </div>
          </div>
          <button onClick={logout} className="flex items-center gap-2 w-full px-2 py-1.5 rounded-lg text-xs opacity-40 hover:opacity-80 hover:bg-white/5 transition-all">
            <LogOut size={13} /> Cerrar sesión
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto" style={{ background: '#111' }}>
        <div className="lg:hidden sticky top-0 z-30 flex items-center gap-3 p-4 border-b"
          style={{ background: '#111', borderColor: 'rgba(255,255,255,0.06)' }}>
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
        <div className="p-4 lg:p-6 min-h-full">{children}</div>
      </main>
    </div>
  );
}

// ============================================================
// CLASES DEL DÍA
// ============================================================
export function InstructorTodayPage() {
  const { gym } = useAuth();
  const primaryColor = gym?.primaryColor || '#E85D04';
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    instructorAPI.getTodayClasses()
      .then(r => setData(r.data))
      .catch(() => toast.error('Error al cargar'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <PageLoader />;

  return (
    <div className="fade-in">
      {/* Banner */}
      <div className="rounded-2xl p-6 mb-5 relative overflow-hidden" style={{ background: '#1a1a1a' }}>
        <div className="absolute right-4 top-4 opacity-5 text-8xl">💪</div>
        <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: primaryColor }}>¡Bienvenido coach!</p>
        <h1 className="text-2xl font-black">Hola, {data?.gym?.name ? 'Instructor' : 'Coach'}!</h1>
        <p className="text-sm opacity-50 mt-1">
          {data?.classes?.length === 0
            ? `No tienes clases asignadas hoy en ${gym?.name}.`
            : `Tienes ${data?.classes?.length} clase(s) programadas hoy en ${gym?.name}.`}
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        <div className="rounded-xl p-4" style={{ background: '#1a1a1a' }}>
          <p className="text-xs opacity-40 mb-1">Tus clases de hoy</p>
          <p className="text-2xl font-black">{data?.kpis?.classes_today || 0}</p>
        </div>
        <div className="rounded-xl p-4" style={{ background: '#1a1a1a' }}>
          <p className="text-xs opacity-40 mb-1">Capacidad Total Estimada</p>
          <p className="text-2xl font-black">{data?.kpis?.total_capacity || 0}</p>
        </div>
        <div className="rounded-xl p-4" style={{ background: '#1a1a1a' }}>
          <p className="text-xs opacity-40 mb-1">Gimnasio</p>
          <p className="text-lg font-black truncate">{gym?.name}</p>
        </div>
      </div>

      {/* Clases */}
      <div className="mb-4 flex items-center justify-between">
        <p className="font-bold">Tus Clases Programadas</p>
        <span className="text-xs opacity-30">Hoy</span>
      </div>

      {data?.classes?.length === 0 ? (
        <div className="rounded-xl p-8 text-center" style={{ background: '#1a1a1a' }}>
          <CalendarDays size={32} className="mx-auto mb-3 opacity-20" />
          <p className="font-semibold opacity-50">No tienes clases asignadas hoy</p>
          <p className="text-xs opacity-30 mt-1">Revisa el cronograma general con administración.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {data.classes.map(cls => (
            <div key={cls.id} className="rounded-xl p-4" style={{ background: '#1a1a1a' }}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold">{cls.session_name}</p>
                  <p className="text-xs opacity-50">🕐 {cls.start_time?.slice(0,5)} - {cls.end_time?.slice(0,5)}</p>
                  <p className="text-xs opacity-50">👥 {cls.booked_count}/{cls.max_capacity} inscritos</p>
                </div>
                <span className={cls.status === 'completed' ? 'badge-active' : 'badge-info'}>{cls.status}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Acciones rápidas */}
      <div className="mt-5">
        <p className="font-bold mb-3 flex items-center gap-2">📋 Acciones Rápidas</p>
        <div className="grid grid-cols-1 gap-3">
          {[
            { label: 'Sesiones Grupales', desc: 'Crea o edita la agenda de clases grupales de tu gimnasio.', status: 'Próximamente (Fase 2)' },
            { label: 'Asignación de Rutinas', desc: 'Define WODs o planes de entrenamiento para tus alumnos.', status: 'Próximamente (Fase 3)' },
          ].map(a => (
            <div key={a.label} className="rounded-xl p-4" style={{ background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.06)' }}>
              <p className="font-semibold text-sm">{a.label}</p>
              <p className="text-xs opacity-40 mt-0.5">{a.desc}</p>
              <p className="text-xs mt-1" style={{ color: primaryColor }}>{a.status}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// RUTINAS Y WODs
// ============================================================
export function InstructorRoutinesPage() {
  const { gym } = useAuth();
  const primaryColor = gym?.primaryColor || '#E85D04';
  const [data, setData] = useState({ plans: [], assignments: [] });
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', content: '' });
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState('plans');

  const load = async () => {
    setLoading(true);
    try { const r = await instructorAPI.getRoutines(); setData(r.data); }
    catch { toast.error('Error al cargar'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async () => {
    if (!form.name) return toast.error('Nombre requerido');
    setSaving(true);
    try {
      await instructorAPI.createRoutine(form);
      toast.success('Rutina creada'); setShowCreate(false); load();
    } catch (err) { toast.error(err.response?.data?.error || 'Error al crear'); }
    finally { setSaving(false); }
  };

  return (
    <div className="fade-in">
      {/* Banner */}
      <div className="rounded-2xl p-5 mb-5 relative overflow-hidden" style={{ background: '#1a1a1a' }}>
        <div className="absolute right-4 top-4 opacity-5 text-7xl">💪</div>
        <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: primaryColor }}>MÓDULO DE ENTRENAMIENTO</p>
        <h1 className="text-xl font-black">Rutinas y WODs</h1>
        <p className="text-sm opacity-40 mt-1">Crea, edita y programa rutinas grupales o individuales, y asígnalas a los alumnos.</p>
      </div>

      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-1">
          {[['plans', `Planes de Entrenamiento (${data.plans.length})`], ['assignments', `Alumnos Asignados (${data.assignments.length})`]].map(([v, l]) => (
            <button key={v} onClick={() => setTab(v)}
              className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
              style={tab === v ? { backgroundColor: '#1f2937', borderBottom: `2px solid ${primaryColor}` } : { opacity: 0.4 }}>
              {l}
            </button>
          ))}
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-primary flex items-center gap-2 text-sm" style={{ backgroundColor: primaryColor }}>
          <Plus size={14} /> Crear Rutina
        </button>
      </div>

      {loading ? <div className="flex justify-center py-16"><Spinner size={28} className="opacity-30" /></div>
        : tab === 'plans' && data.plans.length === 0
          ? (
            <div className="rounded-xl p-12 text-center" style={{ background: '#1a1a1a' }}>
              <Dumbbell size={36} className="mx-auto mb-4 opacity-20" />
              <p className="font-semibold opacity-50">No hay rutinas creadas en el gimnasio</p>
              <p className="text-xs opacity-30 mt-1">Comienza diseñando la primera sesión para tus alumnos.</p>
              <button onClick={() => setShowCreate(true)} className="mt-4 px-4 py-2 rounded-lg text-sm font-semibold text-white" style={{ backgroundColor: primaryColor }}>
                Crear rutina ahora
              </button>
            </div>
          )
          : tab === 'plans'
            ? data.plans.map(p => (
              <div key={p.id} className="rounded-xl p-4 mb-2" style={{ background: '#1a1a1a' }}>
                <p className="font-bold">{p.name}</p>
                <p className="text-xs opacity-40 mt-0.5">{p.description}</p>
              </div>
            ))
            : data.assignments.length === 0
              ? <EmptyState icon={User} title="Sin alumnos asignados" />
              : data.assignments.map(a => (
                <div key={a.id} className="rounded-xl p-4 mb-2 flex items-center justify-between" style={{ background: '#1a1a1a' }}>
                  <div>
                    <p className="font-semibold text-sm">{a.student_name}</p>
                    <p className="text-xs opacity-40">{a.plan_name}</p>
                  </div>
                  <ChevronRight size={16} className="opacity-30" />
                </div>
              ))}

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Crear Rutina">
        <div className="flex flex-col gap-4">
          <Field label="Nombre" required><input className="input-field" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></Field>
          <Field label="Descripción"><textarea className="input-field" rows={3} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></Field>
          <div className="flex gap-3">
            <button onClick={() => setShowCreate(false)} className="btn-secondary flex-1 text-sm">Cancelar</button>
            <button onClick={handleCreate} disabled={saving} className="btn-primary flex-1 text-sm flex items-center justify-center gap-2" style={{ backgroundColor: primaryColor }}>
              {saving && <Spinner size={14} className="text-white" />} Crear
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

// ============================================================
// HISTORIAL ASISTENCIAS INSTRUCTOR
// ============================================================
export function InstructorAttendancePage() {
  const { gym } = useAuth();
  const primaryColor = gym?.primaryColor || '#E85D04';
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  const load = async (d) => {
    setLoading(true);
    try { const r = await instructorAPI.getAttendance({ date: d }); setData(r.data); }
    catch { toast.error('Error al cargar'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(date); }, [date]);

  const quickDate = (offset) => {
    const d = new Date(); d.setDate(d.getDate() + offset);
    setDate(d.toISOString().split('T')[0]);
  };

  return (
    <div className="fade-in">
      {/* Banner */}
      <div className="rounded-2xl p-5 mb-5" style={{ background: '#1a1a1a' }}>
        <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: primaryColor }}>HISTORIAL DE CLASES</p>
        <h1 className="text-xl font-black">Registro de Asistencias</h1>
        <p className="text-sm opacity-40 mt-1">Consulta el listado de alumnos y confirma quién asistió a tus clases dictadas en cualquier fecha del pasado.</p>
      </div>

      {/* Selector fecha */}
      <div className="rounded-xl p-4 mb-5" style={{ background: '#1a1a1a' }}>
        <p className="text-xs font-bold uppercase opacity-40 mb-3 flex items-center gap-2">📅 SELECCIONA UNA FECHA A CONSULTAR</p>
        <div className="flex gap-2 items-center flex-wrap">
          {[['Hoy', 0], ['Ayer', -1], ['Antier', -2]].map(([l, offset]) => (
            <button key={l} onClick={() => quickDate(offset)}
              className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
              style={{ background: 'rgba(255,255,255,0.08)' }}>{l}</button>
          ))}
          <input type="date" className="input-field text-sm ml-auto" style={{ maxWidth: '160px' }}
            value={date} onChange={e => setDate(e.target.value)} />
        </div>
      </div>

      {/* Clases del día */}
      <div className="flex items-center justify-between mb-3">
        <p className="font-semibold opacity-60">{new Date(date + 'T00:00:00').toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
        <span className="text-xs opacity-30">{data?.classes?.length || 0} clases dictadas</span>
      </div>

      {loading ? <div className="flex justify-center py-16"><Spinner size={28} className="opacity-30" /></div>
        : !data || data.classes?.length === 0
          ? (
            <div className="rounded-xl p-8 text-center" style={{ background: '#1a1a1a' }}>
              <div className="text-4xl mb-3 opacity-30">⚠</div>
              <p className="font-semibold opacity-40">No dictaste clases programadas esta fecha</p>
              <p className="text-xs opacity-20 mt-1">Selecciona otra fecha en el panel superior o revisa tu calendario semanal.</p>
            </div>
          )
          : data.classes.map(cls => (
            <div key={cls.id} className="rounded-xl p-4 mb-3" style={{ background: '#1a1a1a' }}>
              <div className="flex items-center justify-between mb-3">
                <p className="font-bold">{cls.session_name}</p>
                <p className="text-xs opacity-40">{cls.start_time?.slice(0,5)} - {cls.end_time?.slice(0,5)}</p>
              </div>
              {cls.students?.length === 0
                ? <p className="text-xs opacity-30 text-center py-4">No hay alumnos registrados</p>
                : cls.students.map((s, i) => (
                  <div key={i} className="flex items-center justify-between p-2 rounded-lg mb-1"
                    style={{ background: 'rgba(255,255,255,0.04)' }}>
                    <p className="text-sm font-medium">{s.name}</p>
                    <p className="text-xs opacity-40">{s.cedula}</p>
                  </div>
                ))
              }
            </div>
          ))}
    </div>
  );
}

// ============================================================
// PERFIL INSTRUCTOR
// ============================================================
export function InstructorProfilePage() {
  const { gym } = useAuth();
  const primaryColor = gym?.primaryColor || '#E85D04';
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '', specialization: '', bio: '' });
  const [passForm, setPassForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });

  useEffect(() => {
    instructorAPI.getProfile()
      .then(r => { setProfile(r.data); if (r.data) setForm({ name: r.data.name, phone: r.data.phone || '', specialization: r.data.specialization || '', bio: r.data.bio || '' }); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const save = async () => {
    setSaving(true);
    try { await instructorAPI.updateProfile(form); toast.success('Perfil actualizado'); }
    catch { toast.error('Error al guardar'); }
    finally { setSaving(false); }
  };

  if (loading) return <PageLoader />;

  return (
    <div className="fade-in max-w-xl mx-auto">
      {/* Header */}
      <div className="rounded-2xl p-6 mb-5 text-center" style={{ background: '#1a1a1a' }}>
        <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center text-3xl mx-auto mb-3">
          {profile?.photo_url ? <img src={profile.photo_url} className="w-full h-full object-cover rounded-full" /> : '👤'}
        </div>
        <p className="font-bold text-lg">{profile ? 'Cargando...' : 'Perfil'}</p>
        <p className="text-xs opacity-40 uppercase tracking-wider" style={{ color: primaryColor }}>ENTRENADOR DE CROSSFIT</p>
        {profile?.cedula && <p className="text-xs opacity-30 mt-0.5">Cédula de acceso: {profile.cedula}</p>}
      </div>

      {/* Form */}
      <div className="rounded-2xl p-6 mb-4" style={{ background: '#1a1a1a' }}>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <Field label="Nombre" required><input className="input-field" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Tu nombre completo" /></Field>
          <Field label="Teléfono"><input className="input-field" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="Ej: 0991234567" /></Field>
        </div>
        <Field label="Especialización">
          <input className="input-field mb-4" value={form.specialization} onChange={e => setForm({ ...form, specialization: e.target.value })} placeholder="Ej: CrossFit Level 2, Olympic Lifting Coach" />
        </Field>
        <Field label="Biografía">
          <textarea className="input-field mb-4" rows={3} value={form.bio} onChange={e => setForm({ ...form, bio: e.target.value })} placeholder="Cuéntanos un poco sobre tu trayectoria y experiencia..." />
        </Field>

        <div className="border-t border-white/10 pt-4">
          <p className="text-xs font-bold uppercase opacity-40 mb-3 flex items-center gap-2">🔒 Seguridad y Acceso</p>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Nueva Contraseña"><input className="input-field" type="password" placeholder="Mínimo 6 caracteres" value={passForm.newPassword} onChange={e => setPassForm({ ...passForm, newPassword: e.target.value })} /></Field>
            <Field label="Confirmar Contraseña"><input className="input-field" type="password" placeholder="Repite la contraseña" value={passForm.confirmPassword} onChange={e => setPassForm({ ...passForm, confirmPassword: e.target.value })} /></Field>
          </div>
        </div>

        <div className="flex justify-end mt-4">
          <button onClick={save} disabled={saving} className="px-6 py-2.5 rounded-xl font-bold text-white text-sm flex items-center gap-2 transition-all" style={{ backgroundColor: primaryColor }}>
            {saving && <Spinner size={14} className="text-white" />} 💾 Guardar Cambios
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// WOD DEL DÍA — INSTRUCTOR (head coach edita, otros solo ven)
// ============================================================
export function InstructorWodPage() {
  const { gym } = useAuth();
  const primaryColor = gym?.primaryColor || '#E85D04';
  const today = new Date();

  const [isHeadCoach, setIsHeadCoach] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [wods, setWods] = useState([]);
  const [selectedDate, setSelectedDate] = useState(today.toISOString().split('T')[0]);
  const [selectedWod, setSelectedWod] = useState(null);
  const [form, setForm] = useState({ title: '', description: '', warmup: '', workout: '', cooldown: '', notes: '' });
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);

  const DAYS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  const MONTHS = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

  useEffect(() => {
    instructorAPI.getProfile().then(r => setIsHeadCoach(r.data?.is_head_coach || false)).catch(() => {});
  }, []);

  const load = async () => {
    setLoading(true);
    try {
      const r = await instructorAPI.getWods({ month: currentMonth + 1, year: currentYear });
      setWods(r.data);
    } catch { toast.error('Error al cargar WODs'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [currentMonth, currentYear]);
  useEffect(() => { selectDate(today.toISOString().split('T')[0]); }, []);

  const selectDate = async (date) => {
    setSelectedDate(date);
    setEditing(false);
    try {
      const r = await instructorAPI.getWod(date);
      setSelectedWod(r.data);
      if (r.data) setForm({
        title: r.data.title || '', description: r.data.description || '',
        warmup: r.data.warmup || '', workout: r.data.workout || '',
        cooldown: r.data.cooldown || '', notes: r.data.notes || ''
      });
      else setForm({ title: '', description: '', warmup: '', workout: '', cooldown: '', notes: '' });
    } catch { }
  };

  const handleSave = async () => {
    if (!form.description && !form.workout) return toast.error('Agrega al menos una descripción o workout');
    setSaving(true);
    try {
      await instructorAPI.saveWod({ date: selectedDate, ...form });
      toast.success('WOD guardado');
      setEditing(false);
      load();
      const r = await instructorAPI.getWod(selectedDate);
      setSelectedWod(r.data);
    } catch { toast.error('Error al guardar WOD'); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!window.confirm('¿Eliminar el WOD de este día?')) return;
    try {
      await instructorAPI.deleteWod(selectedDate);
      toast.success('WOD eliminado');
      setSelectedWod(null);
      setForm({ title: '', description: '', warmup: '', workout: '', cooldown: '', notes: '' });
      load();
    } catch { toast.error('Error al eliminar'); }
  };

  const getDaysInMonth = () => {
    const firstDay = new Date(currentYear, currentMonth, 1).getDay();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const days = [];
    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(i);
    return days;
  };
  const getDateStr = (day) => day ? `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}` : null;
  const hasWod = (day) => wods.some(w => w.wod_date?.split('T')[0] === getDateStr(day));
  const isToday = (day) => getDateStr(day) === today.toISOString().split('T')[0];
  const isSelected = (day) => getDateStr(day) === selectedDate;

  return (
    <div className="fade-in">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-bold">WOD del Día</h1>
          {isHeadCoach 
            ? <p className="text-xs" style={{ color: primaryColor }}>👑 Head Coach — puedes crear y editar</p>
            : <p className="text-xs opacity-40">Solo lectura</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        {/* Calendario */}
        <div className="rounded-xl p-5" style={{ background: '#1a1a1a' }}>
          <div className="flex items-center justify-between mb-4">
            <button onClick={() => { if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear(y => y - 1); } else setCurrentMonth(m => m - 1); }}
              className="p-1.5 rounded-lg opacity-50 hover:opacity-100 hover:bg-white/10 transition-all"><ChevronLeft size={16} /></button>
            <p className="font-bold">{MONTHS[currentMonth]} {currentYear}</p>
            <button onClick={() => { if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear(y => y + 1); } else setCurrentMonth(m => m + 1); }}
              className="p-1.5 rounded-lg opacity-50 hover:opacity-100 hover:bg-white/10 transition-all"><ChevronRight size={16} /></button>
          </div>
          <div className="grid grid-cols-7 mb-2">
            {DAYS.map(d => <p key={d} className="text-center text-xs opacity-40 font-medium py-1">{d}</p>)}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {getDaysInMonth().map((day, i) => (
              <button key={i} onClick={() => day && selectDate(getDateStr(day))} disabled={!day}
                className={`relative aspect-square rounded-lg text-sm font-medium transition-all flex items-center justify-center
                  ${!day ? 'invisible' : ''} ${isSelected(day) ? 'text-white' : isToday(day) ? 'font-black' : 'opacity-60 hover:opacity-100 hover:bg-white/10'}`}
                style={isSelected(day) ? { backgroundColor: primaryColor } : {}}>
                {day}
                {hasWod(day) && !isSelected(day) && <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full" style={{ backgroundColor: primaryColor }} />}
              </button>
            ))}
          </div>
        </div>

        {/* WOD del día */}
        <div className="rounded-xl p-5" style={{ background: '#1a1a1a' }}>
          <div className="flex items-center justify-between mb-4">
            <p className="font-bold">{new Date(selectedDate + 'T00:00:00').toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
            {isHeadCoach && (
              <div className="flex gap-2">
                {selectedWod && !editing && (
                  <>
                    <button onClick={() => setEditing(true)} className="p-1.5 rounded-lg opacity-50 hover:opacity-100 hover:bg-white/10 transition-all"><Edit2 size={14} /></button>
                    <button onClick={handleDelete} className="p-1.5 rounded-lg opacity-50 hover:opacity-100 hover:bg-red-500/20 hover:text-red-400 transition-all"><Trash2 size={14} /></button>
                  </>
                )}
                {!selectedWod && !editing && (
                  <button onClick={() => setEditing(true)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white" style={{ backgroundColor: primaryColor }}>
                    <Plus size={13} /> Crear WOD
                  </button>
                )}
              </div>
            )}
          </div>

          {!editing && !selectedWod && (
            <div className="flex flex-col items-center justify-center py-12 opacity-30">
              <p className="text-4xl mb-3">💪</p>
              <p className="text-sm">No hay WOD para este día</p>
            </div>
          )}

          {!editing && selectedWod && (
            <div className="flex flex-col gap-3">
              {selectedWod.title && <p className="font-bold text-lg">{selectedWod.title}</p>}
              {selectedWod.description && <div><p className="text-xs font-bold opacity-40 uppercase mb-1">Descripción</p><p className="text-sm opacity-80 whitespace-pre-wrap">{selectedWod.description}</p></div>}
              {selectedWod.warmup && <div><p className="text-xs font-bold opacity-40 uppercase mb-1">🔥 Calentamiento</p><p className="text-sm opacity-80 whitespace-pre-wrap">{selectedWod.warmup}</p></div>}
              {selectedWod.workout && <div><p className="text-xs font-bold opacity-40 uppercase mb-1">⚡ Workout</p><p className="text-sm opacity-80 whitespace-pre-wrap">{selectedWod.workout}</p></div>}
              {selectedWod.cooldown && <div><p className="text-xs font-bold opacity-40 uppercase mb-1">❄️ Enfriamiento</p><p className="text-sm opacity-80 whitespace-pre-wrap">{selectedWod.cooldown}</p></div>}
              {selectedWod.notes && <div><p className="text-xs font-bold opacity-40 uppercase mb-1">📝 Notas</p><p className="text-sm opacity-60 whitespace-pre-wrap">{selectedWod.notes}</p></div>}
            </div>
          )}

          {editing && (
            <div className="flex flex-col gap-3">
              <div><p className="text-xs opacity-50 mb-1">Título (opcional)</p><input className="input-field" placeholder="Ej: Cindy, Fran..." value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} /></div>
              <div><p className="text-xs opacity-50 mb-1">Descripción</p><textarea className="input-field" rows={2} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
              <div><p className="text-xs opacity-50 mb-1">🔥 Calentamiento</p><textarea className="input-field" rows={2} value={form.warmup} onChange={e => setForm({ ...form, warmup: e.target.value })} /></div>
              <div><p className="text-xs opacity-50 mb-1">⚡ Workout</p><textarea className="input-field" rows={3} value={form.workout} onChange={e => setForm({ ...form, workout: e.target.value })} /></div>
              <div><p className="text-xs opacity-50 mb-1">❄️ Enfriamiento</p><textarea className="input-field" rows={2} value={form.cooldown} onChange={e => setForm({ ...form, cooldown: e.target.value })} /></div>
              <div><p className="text-xs opacity-50 mb-1">📝 Notas del coach</p><textarea className="input-field" rows={2} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} /></div>
              <div className="flex gap-3 mt-2">
                <button onClick={() => { setEditing(false); if (selectedWod) selectDate(selectedDate); }} className="btn-secondary flex-1 text-sm">Cancelar</button>
                <button onClick={handleSave} disabled={saving} className="btn-primary flex-1 text-sm flex items-center justify-center gap-2" style={{ backgroundColor: primaryColor }}>
                  {saving ? <Spinner size={14} className="text-white" /> : <Save size={14} />} Guardar
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
