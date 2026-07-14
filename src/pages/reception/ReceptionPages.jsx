import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { receptionAPI, adminAPI } from '../../api';
import { KPICard, PageHeader, SearchInput, Modal, Field, Spinner, EmptyState, Tabs } from '../../components/ui';
import { Users, CreditCard, CalendarCheck, DollarSign, QrCode, Plus, ChevronRight, RefreshCw, Check, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import QRScanner from '../../components/ui/QRScanner';

// ============================================================
// DASHBOARD RECEPCIÓN
// ============================================================
export function ReceptionDashboardPage() {
  const { gym } = useAuth();
  const primaryColor = gym?.primaryColor || '#E85D04';
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    receptionAPI.getDashboard()
      .then(r => setData(r.data))
      .catch(() => toast.error('Error al cargar'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center py-20"><Spinner size={28} className="opacity-30" /></div>;
  if (!data) return null;

  const today = new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <div className="fade-in">
      <div className="mb-5">
        <h1 className="text-xl font-bold">Dashboard</h1>
        <p className="text-xs opacity-40 capitalize">{today}</p>
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 mb-5">
        <KPICard title="Clientes Totales" value={data.kpis.total_clients} icon={Users} iconBg="bg-blue-600" />
        <KPICard title="Asistencias Hoy" value={data.kpis.asistencias_hoy} icon={CalendarCheck} iconBg="bg-green-600" />
        <KPICard title="Clases Hoy" value={data.kpis.clases_hoy} icon={CreditCard} iconBg="bg-purple-600" />
        <KPICard title="Pagos del Día" value={`$${parseFloat(data.kpis.pagos_dia || 0).toFixed(2)}`} icon={DollarSign} iconBg="bg-yellow-600" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {/* Clases de hoy */}
        <div className="rounded-xl p-4" style={{ background: '#1a1a1a' }}>
          <p className="font-semibold mb-3">Clases de Hoy</p>
          {data.todayClasses.length === 0 ? (
            <p className="text-xs opacity-30 text-center py-8">No hay clases programadas hoy</p>
          ) : (
            <div className="flex flex-col gap-2">
              {data.todayClasses.map(cls => {
                const booked = parseInt(cls.booked_count);
                const pct = Math.round((booked / cls.max_capacity) * 100);
                return (
                  <div key={cls.id} className="p-3 rounded-xl flex items-center justify-between"
                    style={{ background: 'rgba(255,255,255,0.04)' }}>
                    <div>
                      <p className="text-sm font-semibold">{cls.session_name}</p>
                      <p className="text-xs opacity-40">{cls.start_time?.slice(0, 5)} - {cls.end_time?.slice(0, 5)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-bold" style={{ color: pct >= 90 ? '#ef4444' : pct >= 60 ? '#f59e0b' : '#22c55e' }}>
                        {booked}/{cls.max_capacity}
                      </p>
                      <p className="text-xs opacity-30">lugares</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Últimos ingresos */}
        <div className="rounded-xl p-4" style={{ background: '#1a1a1a' }}>
          <div className="flex items-center justify-between mb-3">
            <p className="font-semibold">Últimos Ingresos</p>
            <span className="text-xs opacity-30">{data.recentAttendance.length} hoy</span>
          </div>
          {data.recentAttendance.length === 0 ? (
            <p className="text-xs opacity-30 text-center py-8">No hay ingresos registrados hoy.</p>
          ) : (
            <div className="flex flex-col gap-1.5">
              {data.recentAttendance.map((a, i) => (
                <div key={i} className="flex items-center justify-between p-2 rounded-lg"
                  style={{ background: 'rgba(255,255,255,0.04)' }}>
                  <p className="text-sm font-medium">{a.name}</p>
                  <p className="text-xs opacity-40">
                    {new Date(a.check_in_time).toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// CLIENTES RECEPCIÓN
// ============================================================
export function ReceptionClientsPage() {
  const { gym } = useAuth();
  const primaryColor = gym?.primaryColor || '#E85D04';
  const navigate = useNavigate();
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ cedula: '', name: '', email: '', phone: '', password: '', confirmPassword: '', birthDate: '', emergencyContactName: '', emergencyContactPhone: '' });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try { const r = await receptionAPI.getClients({ search }); setClients(r.data); }
    catch { toast.error('Error al cargar clientes'); }
    finally { setLoading(false); }
  }, [search]);

  useEffect(() => { load(); }, [load]);

 const handleCreate = async () => {
    if (!form.cedula || !form.name || !form.password) return toast.error('Cédula, nombre y contraseña requeridos');
    if (form.password !== form.confirmPassword) return toast.error('Las contraseñas no coinciden');
    if (form.password.length < 6) return toast.error('La contraseña debe tener al menos 6 caracteres');
    setSaving(true);
    try {
      await receptionAPI.createClient(form);
      toast.success('Cliente creado');
      setShowCreate(false);
      setForm({ cedula: '', name: '', email: '', phone: '', password: '', confirmPassword: '', birthDate: '', emergencyContactName: '', emergencyContactPhone: '' });
      load();
    } catch (err) { toast.error(err.response?.data?.error || 'Error al crear'); }
    finally { setSaving(false); }
  };

  return (
    <div className="fade-in">
      <PageHeader title="Clientes"
        action={<button onClick={() => setShowCreate(true)} className="btn-primary flex items-center gap-2 text-sm" style={{ backgroundColor: primaryColor }}><Plus size={15} /> Nuevo Cliente</button>} />

      <SearchInput value={search} onChange={(v) => setSearch(v)} placeholder="Buscar por nombre o cédula..." />

      <div className="flex flex-col gap-1.5 mt-4">
        {loading ? <div className="flex justify-center py-16"><Spinner size={28} className="opacity-30" /></div>
          : clients.length === 0 ? <EmptyState icon={Users} title="No hay clientes" />
          : clients.map(c => (
            <div key={c.id} onClick={() => navigate(`/recepcion/clients/${c.id}`)}
              className="flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all hover:bg-white/5"
              style={{ background: '#1a1a1a' }}>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm"
                  style={{ backgroundColor: primaryColor }}>
                  {c.name?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-semibold text-sm">{c.name}</p>
                  <p className="text-xs opacity-40">C.I.: {c.cedula}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                  c.membership_status === 'active' ? 'bg-green-500/20 text-green-400' : 'bg-white/10 text-white/40'
                }`}>
                  {c.membership_status === 'active' ? 'Activo' : 'Sin membresía'}
                </span>
                <ChevronRight size={16} className="opacity-30" />
              </div>
            </div>
          ))}
      </div>

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Nuevo Cliente" maxWidth="max-w-lg">
        <div className="flex flex-col gap-4">
          <p className="text-xs font-bold opacity-50 uppercase tracking-wider">Información Básica</p>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Cédula" required>
              <input className="input-field" placeholder="0000000000" value={form.cedula}
                onChange={e => setForm({ ...form, cedula: e.target.value })} />
            </Field>
            <Field label="Nombre Completo" required>
              <input className="input-field" placeholder="Juan Pérez" value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })} />
            </Field>
            <Field label="Email">
              <input className="input-field" type="email" placeholder="juan@email.com" value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })} />
            </Field>
            <Field label="Teléfono">
              <input className="input-field" placeholder="0999999999" value={form.phone}
                onChange={e => setForm({ ...form, phone: e.target.value })} />
            </Field>
            <Field label="Fecha de Nacimiento">
              <input className="input-field" type="date" value={form.birthDate}
                onChange={e => setForm({ ...form, birthDate: e.target.value })} />
            </Field>
          </div>

          <p className="text-xs font-bold opacity-50 uppercase tracking-wider">Contacto de Emergencia</p>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Nombre del Contacto">
              <input className="input-field" placeholder="María Pérez" value={form.emergencyContactName}
                onChange={e => setForm({ ...form, emergencyContactName: e.target.value })} />
            </Field>
            <Field label="Teléfono de Emergencia">
              <input className="input-field" placeholder="0999999999" value={form.emergencyContactPhone}
                onChange={e => setForm({ ...form, emergencyContactPhone: e.target.value })} />
            </Field>
          </div>

          <p className="text-xs font-bold opacity-50 uppercase tracking-wider">Credenciales</p>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Contraseña" required>
              <input className="input-field" type="password" placeholder="········" value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })} />
            </Field>
            <Field label="Confirmar Contraseña" required>
              <input className="input-field" type="password" placeholder="········" value={form.confirmPassword}
                onChange={e => setForm({ ...form, confirmPassword: e.target.value })} />
            </Field>
          </div>

          <div className="flex gap-3 mt-2">
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
// DETALLE CLIENTE RECEPCIÓN
// ============================================================
export function ReceptionClientDetailPage() {
  const { clientId } = useParams();
  const { gym } = useAuth();
  const primaryColor = gym?.primaryColor || '#E85D04';
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [memTypes, setMemTypes] = useState([]);
  const [showMem, setShowMem] = useState(false);
 const [memForm, setMemForm] = useState({ membershipTypeId: '', method: 'efectivo', startDate: '' });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    try {
      const [r, adminTypes] = await Promise.all([
        receptionAPI.getClient(clientId),
        receptionAPI.getMembershipTypes()
      ]);
      setData(r.data);
      setMemTypes(adminTypes.data);
    } catch { toast.error('Error al cargar cliente'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [clientId]);

  const handleMembership = async () => {
    if (!memForm.membershipTypeId) return toast.error('Selecciona un tipo de membresía');
    setSaving(true);
    try {
      await receptionAPI.createMembership(clientId, memForm);
      toast.success('Membresía creada'); setShowMem(false); load();
    } catch (err) { toast.error(err.response?.data?.error || 'Error'); }
    finally { setSaving(false); }
  };

  if (loading) return <div className="flex justify-center py-20"><Spinner size={28} className="opacity-30" /></div>;
  if (!data) return null;

  const { client, membership, payments } = data;
  const hasActiveMem = membership && new Date(membership.end_date) >= new Date();

  return (
    <div className="fade-in">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-xs opacity-40 hover:opacity-80 transition-opacity mb-5">
        ← Volver
      </button>

      {/* Header cliente */}
      <div className="p-5 rounded-xl mb-4 flex items-center justify-between" style={{ background: '#1a1a1a' }}>
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full flex items-center justify-center text-white font-black text-2xl"
            style={{ backgroundColor: primaryColor }}>
            {client.name?.charAt(0).toUpperCase()}
          </div>
          <div>
            <h2 className="text-xl font-bold">{client.name}</h2>
            <p className="text-xs opacity-50">C.I.: {client.cedula}</p>
            {client.email && <p className="text-xs opacity-50">✉ {client.email}</p>}
            {client.phone && <p className="text-xs opacity-50">📱 {client.phone}</p>}
            {client.birth_date && <p className="text-xs opacity-50">🎂 {new Date(client.birth_date.split('T')[0] + 'T00:00:00').toLocaleDateString('es-EC')}</p>}
            {client.emergency_contact_name && (
              <p className="text-xs opacity-50">🚨 {client.emergency_contact_name}{client.emergency_contact_phone ? ` — ${client.emergency_contact_phone}` : ''}</p>
            )}
          </div>
        </div>
        <div className="text-right">
          <span className={`px-3 py-1 rounded-full text-sm font-bold ${hasActiveMem ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
            {hasActiveMem ? 'Membresía Activa' : 'Sin Membresía'}
          </span>
          {hasActiveMem && <p className="text-xs opacity-40 mt-1">Vence: {new Date(membership.end_date.split('T')[0] + 'T00:00:00').toLocaleDateString('es-EC')}</p>}
        </div>
      </div>

      {/* Acciones */}
      <div className="mb-5">
        <button onClick={() => setShowMem(true)} className="w-full p-3 rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-all hover:opacity-80"
          style={{ background: '#1a1a1a', border: `1px solid rgba(255,255,255,0.08)` }}>
          <CreditCard size={16} /> Nueva Membresía
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {/* Membresías */}
        <div className="rounded-xl p-4" style={{ background: '#1a1a1a' }}>
          <p className="font-semibold mb-3">Membresías</p>
          {!membership ? (
            <p className="text-xs opacity-30 text-center py-6">Sin membresías activas</p>
          ) : (
            <div className="p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)' }}>
              <div className="flex items-center justify-between">
                <p className="font-semibold text-sm">{membership.type_name}</p>
                <span className="badge-active">Activa</span>
              </div>
              <p className="text-xs opacity-40 mt-1">
                {new Date(membership.start_date.split('T')[0] + 'T00:00:00').toLocaleDateString('es-EC')} — {new Date(membership.end_date.split('T')[0] + 'T00:00:00').toLocaleDateString('es-EC')}
              </p>
            </div>
          )}
        </div>

        {/* Pagos */}
        <div className="rounded-xl p-4" style={{ background: '#1a1a1a' }}>
          <p className="font-semibold mb-3">Pagos</p>
          {payments.length === 0 ? (
            <p className="text-xs opacity-30 text-center py-6">Sin pagos registrados</p>
          ) : (
            <div className="flex flex-col gap-1.5 max-h-48 overflow-y-auto">
              {payments.map(p => (
                <div key={p.id} className="flex items-center justify-between p-2 rounded-lg"
                  style={{ background: 'rgba(255,255,255,0.04)' }}>
                  <div>
                    <p className="text-sm font-bold text-green-400">${parseFloat(p.amount).toFixed(2)}</p>
                    <p className="text-xs opacity-40">{new Date(p.created_at).toLocaleDateString('es-EC')}</p>
                  </div>
                  <span className="text-xs opacity-50 px-2 py-0.5 rounded-full" style={{ background: 'rgba(255,255,255,0.08)' }}>{p.method}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal membresía */}
      <Modal open={showMem} onClose={() => setShowMem(false)} title="Nueva Membresía">
        <div className="flex flex-col gap-4">
          <Field label="Tipo de Membresía" required>
            <select className="input-field" value={memForm.membershipTypeId}
              onChange={e => setMemForm({ ...memForm, membershipTypeId: e.target.value })}>
              <option value="">Seleccionar tipo</option>
              {memTypes.filter(t => t.is_active).map(t => (
                <option key={t.id} value={t.id}>{t.name} - ${t.price}</option>
              ))}
            </select>
          </Field>
          <Field label="Fecha de Inicio">
            <input type="date" className="input-field" value={memForm.startDate}
              onChange={e => setMemForm({ ...memForm, startDate: e.target.value })} />
            <p className="text-xs opacity-40 mt-1">Si lo dejas vacío, inicia hoy</p>
          </Field>
          <Field label="Método de Pago" required>
            <select className="input-field" value={memForm.method}
              onChange={e => setMemForm({ ...memForm, method: e.target.value })}>
              <option value="efectivo">Efectivo</option>
              <option value="transferencia">Transferencia</option>
              <option value="tarjeta">Tarjeta</option>
              <option value="cortesia">Cortesía</option>
              <option value="beca">Beca</option>
            </select>
          </Field>
          <div className="flex gap-3">
            <button onClick={() => setShowMem(false)} className="btn-secondary flex-1 text-sm">Cancelar</button>
            <button onClick={handleMembership} disabled={saving}
              className="btn-primary flex-1 text-sm flex items-center justify-center gap-2"
              style={{ backgroundColor: primaryColor }}>
              {saving && <Spinner size={14} className="text-white" />} Crear Membresía
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

// ============================================================
// MEMBRESÍAS RECEPCIÓN
// ============================================================
export function ReceptionMembershipsPage() {
  const [memberships, setMemberships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    setLoading(true);
    receptionAPI.getMemberships({ filter })
      .then(r => setMemberships(r.data))
      .catch(() => toast.error('Error al cargar'))
      .finally(() => setLoading(false));
  }, [filter]);

  // Días restantes y color según vencimiento
  const getDaysInfo = (endDate) => {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const end = new Date(endDate.split('T')[0] + 'T00:00:00');
    const diffDays = Math.ceil((end - today) / (1000 * 60 * 60 * 24));
    if (diffDays < 0) return { label: 'Vencida', color: 'text-gray-400', bg: 'bg-gray-500/20', days: diffDays };
    if (diffDays <= 2) return { label: `${diffDays}d`, color: 'text-red-400', bg: 'bg-red-500/20', days: diffDays };
    if (diffDays <= 5) return { label: `${diffDays}d`, color: 'text-yellow-400', bg: 'bg-yellow-500/20', days: diffDays };
    return { label: `${diffDays}d`, color: 'text-green-400', bg: 'bg-green-500/20', days: diffDays };
  };

  const filtered = memberships.filter(m => 
    !search || m.client_name?.toLowerCase().includes(search.toLowerCase()) || m.client_cedula?.includes(search)
  );

  return (
    <div className="fade-in">
      <h1 className="text-xl font-bold mb-5">Membresías</h1>
      
      <input
        type="text"
        placeholder="🔍 Buscar por nombre o cédula..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        className="w-full mb-4 px-4 py-2.5 rounded-xl text-sm outline-none"
        style={{ background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.08)', color: '#fff' }}
      />

      <div className="flex gap-2 mb-4 flex-wrap">
        {[['all', 'Todas'], ['active', 'Activas'], ['expiring', '⚠ Por vencer'], ['expired', 'Vencidas']].map(([v, l]) => (
          <button key={v} onClick={() => setFilter(v)}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
            style={filter === v ? { backgroundColor: '#E85D04', color: '#fff' } : { background: '#1a1a1a', opacity: 0.5 }}>
            {l}
          </button>
        ))}
      </div>

      <div className="rounded-xl overflow-hidden" style={{ background: '#1a1a1a' }}>
        {loading ? <div className="flex justify-center py-16"><Spinner size={28} className="opacity-30" /></div>
          : filtered.length === 0 ? <EmptyState icon={CreditCard} title="No hay membresías" />
          : (
            <table className="data-table">
              <thead><tr><th>Cliente</th><th>Tipo</th><th>Vencimiento</th><th>Restante</th><th>Estado</th></tr></thead>
              <tbody>
                {filtered.map(m => {
                  const info = getDaysInfo(m.end_date);
                  return (
                    <tr key={m.id} className="hover:bg-white/3 transition-colors">
                      <td>
                        <p className="font-semibold text-sm">{m.client_name}</p>
                        <p className="text-xs opacity-40">{m.client_cedula}</p>
                      </td>
                      <td className="text-sm">{m.type_name}</td>
                      <td className="text-xs opacity-60">{new Date(m.end_date.split('T')[0] + 'T00:00:00').toLocaleDateString('es-EC')}</td>
                      <td>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${info.color} ${info.bg}`}>
                          {info.label}
                        </span>
                      </td>
                      <td>
                        <span className={m.status === 'active' && info.days >= 0 ? 'badge-active' : 'badge-inactive'}>
                          {m.status === 'active' && info.days >= 0 ? 'Activa' : 'Vencida'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
      </div>
    </div>
  );
}

// ============================================================
// PAGOS RECEPCIÓN
// ============================================================
export function ReceptionPaymentsPage() {
  const { gym } = useAuth();
  const primaryColor = gym?.primaryColor || '#E85D04';
  const [payments, setPayments] = useState([]);
  const [totals, setTotals] = useState({ total_dia: 0, promedio: 0 });
  const [loading, setLoading] = useState(true);
  const [method, setMethod] = useState('todos');
  const [status, setStatus] = useState('todos');
  const [period, setPeriod] = useState('day');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  const load = async () => {
    setLoading(true);
    try {
      const r = await receptionAPI.getPayments({ method, status, period, date });
      setPayments(r.data.payments); setTotals(r.data.totals);
    } catch { toast.error('Error al cargar pagos'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [method, status, period, date]);

  const methodColors = { efectivo: 'bg-green-500/20 text-green-400', tarjeta: 'bg-purple-500/20 text-purple-400', transferencia: 'bg-blue-500/20 text-blue-400', payphone: 'bg-yellow-500/20 text-yellow-400' };

  return (
    <div className="fade-in">
      <div className="flex items-start justify-between mb-5">
        <h1 className="text-xl font-bold">Pagos</h1>
        <div className="flex gap-2">
          <div className="text-right px-3 py-1.5 rounded-lg" style={{ background: '#1a1a1a' }}>
            <p className="text-xs opacity-40">Total del día</p>
            <p className="font-bold text-green-400">${parseFloat(totals.total_dia || 0).toFixed(2)}</p>
          </div>
          <div className="text-right px-3 py-1.5 rounded-lg" style={{ background: '#1a1a1a' }}>
            <p className="text-xs opacity-40">Promedio diario</p>
            <p className="font-bold text-blue-400">${parseFloat(totals.promedio || 0).toFixed(2)}</p>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="p-4 rounded-xl mb-4 flex flex-wrap gap-2" style={{ background: '#1a1a1a' }}>
        <div className="flex gap-1">
          {['todos', 'efectivo', 'tarjeta', 'transferencia', 'payphone'].map(m => (
            <button key={m} onClick={() => setMethod(m)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all"
              style={method === m ? { backgroundColor: primaryColor, color: '#fff' } : { background: 'rgba(255,255,255,0.08)', opacity: 0.6 }}>
              {m}
            </button>
          ))}
        </div>
        <div className="flex gap-1">
          {['todos', 'pendiente', 'pagado', 'fallido'].map(s => (
            <button key={s} onClick={() => setStatus(s)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all"
              style={status === s ? { backgroundColor: '#374151', color: '#fff' } : { background: 'rgba(255,255,255,0.08)', opacity: 0.6 }}>
              {s}
            </button>
          ))}
        </div>
        <div className="flex gap-1">
          {[['day', 'Día'], ['month', 'Mes'], ['year', 'Año']].map(([v, l]) => (
            <button key={v} onClick={() => setPeriod(v)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
              style={period === v ? { backgroundColor: primaryColor, color: '#fff' } : { background: 'rgba(255,255,255,0.08)', opacity: 0.6 }}>
              {l}
            </button>
          ))}
        </div>
        {period === 'day' && (
          <input type="date" className="input-field text-xs" value={date} onChange={e => setDate(e.target.value)} style={{ maxWidth: '150px' }} />
        )}
      </div>

      <div className="rounded-xl overflow-hidden" style={{ background: '#1a1a1a' }}>
        {loading ? <div className="flex justify-center py-16"><Spinner size={28} className="opacity-30" /></div>
          : payments.length === 0
            ? <div className="flex flex-col items-center justify-center py-16 opacity-30">
                <DollarSign size={32} className="mb-3" />
                <p>No hay pagos registrados</p>
              </div>
            : (
              <table className="data-table">
                <thead><tr><th>Fecha</th><th>Cliente</th><th>Membresía</th><th>Monto</th><th>Método</th><th>Estado</th></tr></thead>
                <tbody>
                  {payments.map(p => (
                    <tr key={p.id} className="hover:bg-white/3 transition-colors">
                      <td className="text-xs opacity-50">{new Date(p.created_at).toLocaleDateString('es-EC')}</td>
                      <td><p className="font-semibold text-sm">{p.client_name}</p><p className="text-xs opacity-40">{p.client_cedula}</p></td>
                      <td className="text-xs opacity-60">{p.membership_name || '—'}</td>
                      <td className="font-bold text-green-400">${parseFloat(p.amount).toFixed(2)}</td>
                      <td><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${methodColors[p.method] || 'bg-white/10 text-white/50'}`}>{p.method}</span></td>
                      <td><span className={p.status === 'pagado' ? 'badge-active' : p.status === 'pendiente' ? 'badge-warning' : 'badge-inactive'}>{p.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
      </div>
    </div>
  );
}

// ============================================================
// ESCÁNER QR RECEPCIÓN
// ============================================================
export function ReceptionScannerPage() {
  const { gym } = useAuth();
  const primaryColor = gym?.primaryColor || '#E85D04';
  const [code, setCode] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const validate = async (directCode) => {
    const codeToValidate = directCode || code;
    if (!codeToValidate) return toast.error('Ingresa un código o cédula');
    setLoading(true); setResult(null);
    try {
      const r = await receptionAPI.validateEntry({ code: codeToValidate });
      setResult(r.data);
      setCode('');
    } catch { toast.error('Error al validar'); }
    finally { setLoading(false); }
  };

  return (
    <div className="fade-in flex flex-col items-center max-w-lg mx-auto">
      <h1 className="text-xl font-bold mb-6 self-start">Validar Ingreso</h1>

      {/* Área QR */}
      <div className="w-full rounded-xl p-5 mb-4" style={{ background: '#1a1a1a' }}>
        <p className="font-semibold mb-3">Escanear Código QR</p>
        <QRScanner
          onScan={(scannedCode) => { setCode(scannedCode); validate(scannedCode); }}
          onError={(err) => console.error('QR error:', err)}
        />
      </div>

      {/* Manual */}
      <div className="w-full rounded-xl p-5 mb-4" style={{ background: '#1a1a1a' }}>
        <p className="font-semibold mb-3">Validación Manual</p>
        <div className="flex gap-2">
          <input className="input-field flex-1" placeholder="Ingresa el código QR o cédula..."
            value={code} onChange={e => setCode(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && validate()} />
          <button onClick={() => validate()} disabled={loading}
            className="px-4 py-2.5 rounded-lg font-semibold text-white text-sm flex items-center gap-2"
            style={{ backgroundColor: primaryColor }}>
            {loading ? <Spinner size={14} className="text-white" /> : null}
            Validar
          </button>
        </div>
      </div>

      {/* Resultado */}
      {result && (
        <div className={`w-full rounded-xl p-5 ${result.valid ? 'border border-green-500/30' : 'border border-red-500/30'}`}
          style={{ background: result.valid ? 'rgba(22,163,74,0.1)' : 'rgba(220,38,38,0.1)' }}>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-xl font-bold ${result.valid ? 'bg-green-600' : 'bg-red-600'}`}>
              {result.valid ? <Check size={20} /> : <X size={20} />}
            </div>
            <div>
              <p className={`font-bold ${result.valid ? 'text-green-400' : 'text-red-400'}`}>
                {result.valid ? 'Acceso Concedido' : 'Acceso Denegado'}
              </p>
              {result.user && <p className="text-sm font-semibold">{result.user.name} — {result.user.cedula}</p>}
              {result.valid && result.membership && (
                <p className="text-xs opacity-50">
                  {result.membership.typeName} · Vence: {new Date(result.membership.endDate).toLocaleDateString('es-EC')}
                </p>
              )}
              {!result.valid && <p className="text-xs text-red-400 mt-0.5">{result.error}</p>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================
// HORARIOS RECEPCIÓN (con inscribir y ver inscritos)
// ============================================================
export function ReceptionSchedulesPage() {
  const { gym } = useAuth();
  const primaryColor = gym?.primaryColor || '#E85D04';
  const DAYS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  const today = new Date();
  const [selectedDay, setSelectedDay] = useState(today.getDay());
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showBook, setShowBook] = useState(null);
  const [showEnrolled, setShowEnrolled] = useState(null);
  const [enrolled, setEnrolled] = useState([]);
  const [clients, setClients] = useState([]);
  const [clientSearch, setClientSearch] = useState('');
  const [selectedClient, setSelectedClient] = useState(null);
  const [saving, setSaving] = useState(false);

  const getDateForDay = (dow) => {
    const d = new Date();
    const diff = dow - d.getDay();
    d.setDate(d.getDate() + diff);
    // Construir fecha en formato local YYYY-MM-DD sin conversión UTC
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const load = async (dow) => {
    setLoading(true);
    try {
      const date = getDateForDay(dow);
      const r = await receptionAPI.getSchedules({ date });
      setClasses(r.data);
    } catch { toast.error('Error al cargar horarios'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(selectedDay); }, [selectedDay]);

  const loadEnrolled = async (cls) => {
    setShowEnrolled(cls);
    try { const r = await receptionAPI.getEnrolled(cls.id); setEnrolled(r.data); }
    catch { toast.error('Error al cargar inscritos'); }
  };

  const loadClientsSearch = async (search) => {
    try { const r = await receptionAPI.getClients({ search }); setClients(r.data); }
    catch {}
  };

  useEffect(() => {
    if (showBook) { loadClientsSearch(''); setClientSearch(''); setSelectedClient(null); }
  }, [showBook]);

  useEffect(() => {
    if (showBook) loadClientsSearch(clientSearch);
  }, [clientSearch]);

  const handleBook = async () => {
    if (!selectedClient) return toast.error('Selecciona un cliente');
    setSaving(true);
    try {
      await receptionAPI.bookClient(showBook.id, { userId: selectedClient.id });
      toast.success('Cliente inscrito exitosamente');
      setShowBook(null); load(selectedDay);
    } catch (err) { toast.error(err.response?.data?.error || 'Error al inscribir'); }
    finally { setSaving(false); }
  };

  return (
    <div className="fade-in">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold">Horarios</h1>
        <p className="text-xs opacity-40">Fecha de operación: {getDateForDay(selectedDay)}</p>
      </div>

      {/* Tabs días */}
      <div className="flex gap-1 mb-5 overflow-x-auto pb-1">
        {DAYS.map((day, idx) => (
          <button key={idx} onClick={() => setSelectedDay(idx)}
            className="px-4 py-2 rounded-lg text-sm font-medium flex-shrink-0 transition-all"
            style={selectedDay === idx ? { backgroundColor: primaryColor, color: '#fff' } : { background: '#1a1a1a', opacity: 0.5 }}>
            {day}
          </button>
        ))}
      </div>

      {loading ? <div className="flex justify-center py-16"><Spinner size={28} className="opacity-30" /></div>
        : classes.length === 0 ? <EmptyState icon={CalendarCheck} title="Sin horarios" subtitle="No hay clases programadas para este día" />
        : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {classes.map(cls => {
              const booked = parseInt(cls.booked_count);
              const pct = Math.round((booked / cls.max_capacity) * 100);
              return (
                <div key={cls.id} className="rounded-xl p-4" style={{ background: '#1a1a1a' }}>
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-bold">{cls.session_name}</p>
                      <p className="text-xs opacity-50">{cls.instructor_name || 'Sin instructor'}</p>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-white/10">
                      {cls.duration_minutes} min
                    </span>
                  </div>
                  <p className="text-xs opacity-50 flex items-center gap-1 mb-1">🕐 {cls.start_time?.slice(0,5)} - {cls.end_time?.slice(0,5)}</p>
                  <p className="text-xs opacity-50 flex items-center gap-1 mb-3">👥 {booked} / {cls.max_capacity} inscritos</p>
                  {/* Barra disponibilidad */}
                  <div className="mb-3">
                    <div className="flex justify-between text-xs opacity-40 mb-1">
                      <span>Disponibilidad</span>
                      <span>{cls.max_capacity - booked} libres</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-white/10">
                      <div className="h-full rounded-full transition-all"
                        style={{ width: `${pct}%`, backgroundColor: pct >= 90 ? '#ef4444' : pct >= 60 ? '#f59e0b' : primaryColor }} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <button onClick={() => setShowBook(cls)}
                      className="py-2 rounded-lg text-xs font-semibold text-white transition-all"
                      style={{ backgroundColor: primaryColor }}>
                      Inscribir cliente
                    </button>
                    <button onClick={() => loadEnrolled(cls)}
                      className="py-2 rounded-lg text-xs font-semibold transition-all"
                      style={{ background: 'rgba(255,255,255,0.08)' }}>
                      Ver inscritos
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

      {/* Modal Inscribir */}
      <Modal open={!!showBook} onClose={() => setShowBook(null)} title="Inscribir cliente a clase">
        {showBook && (
          <div className="flex flex-col gap-4">
            <p className="text-xs opacity-50">{showBook.session_name} | {showBook.start_time?.slice(0,5)}-{showBook.end_time?.slice(0,5)} | {getDateForDay(selectedDay)}</p>
            <input className="input-field" placeholder="Buscar por nombre o cédula"
              value={clientSearch} onChange={e => setClientSearch(e.target.value)} />
            <div className="max-h-48 overflow-y-auto flex flex-col gap-1">
              {clients.map(c => (
                <button key={c.id} onClick={() => setSelectedClient(c)}
                  className={`text-left p-2.5 rounded-lg text-sm transition-all ${selectedClient?.id === c.id ? 'border' : 'hover:bg-white/5'}`}
                  style={selectedClient?.id === c.id ? { backgroundColor: `${primaryColor}20`, borderColor: primaryColor } : { background: 'rgba(255,255,255,0.04)' }}>
                  <p className="font-semibold">{c.name}</p>
                  <p className="text-xs opacity-40">{c.cedula}</p>
                </button>
              ))}
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowBook(null)} className="btn-secondary flex-1 text-sm">Cancelar</button>
              <button onClick={handleBook} disabled={saving || !selectedClient}
                className="btn-primary flex-1 text-sm flex items-center justify-center gap-2"
                style={{ backgroundColor: primaryColor }}>
                {saving && <Spinner size={14} className="text-white" />} Confirmar inscripción
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal Ver Inscritos */}
      <Modal open={!!showEnrolled} onClose={() => setShowEnrolled(null)} title="Clientes inscritos">
        {showEnrolled && (
          <div>
            <p className="text-xs opacity-50 mb-4">{showEnrolled.session_name} | {showEnrolled.start_time?.slice(0,5)}-{showEnrolled.end_time?.slice(0,5)} | {getDateForDay(selectedDay)}</p>
            {enrolled.length === 0
              ? <p className="text-sm opacity-30 text-center py-8">No hay clientes inscritos en esta clase.</p>
              : enrolled.map(e => (
                <div key={e.id} className="flex items-center justify-between p-2.5 rounded-lg mb-1.5"
                  style={{ background: 'rgba(255,255,255,0.04)' }}>
                  <p className="font-semibold text-sm">{e.name}</p>
                  <p className="text-xs opacity-40">{e.cedula}</p>
                </div>
              ))
            }
          </div>
        )}
      </Modal>
    </div>
  );
}

// ============================================================
// HISTORIAL INGRESOS RECEPCIÓN
// ============================================================
export function ReceptionAttendancePage() {
  const { gym } = useAuth();
  const primaryColor = gym?.primaryColor || '#E85D04';
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dateFrom, setDateFrom] = useState(() => { const d = new Date(); d.setDate(d.getDate() - 6); return d.toISOString().split('T')[0]; });
  const [dateTo, setDateTo] = useState(new Date().toISOString().split('T')[0]);

  const load = async () => {
    setLoading(true);
    try { const r = await receptionAPI.getAttendance({ dateFrom, dateTo }); setData(r.data); }
    catch { toast.error('Error al cargar'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [dateFrom, dateTo]);

  const quickFilter = (days) => {
    const to = new Date(); const from = new Date();
    from.setDate(from.getDate() - days);
    setDateTo(to.toISOString().split('T')[0]);
    setDateFrom(from.toISOString().split('T')[0]);
  };

  return (
    <div className="fade-in">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-bold">Historial de Ingresos</h1>
          <p className="text-xs opacity-40 mt-0.5">Análisis de asistencias por periodo</p>
        </div>
        <button onClick={load} className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm opacity-50 hover:opacity-100" style={{ background: '#1a1a1a' }}>
          <RefreshCw size={14} /> Actualizar
        </button>
      </div>

      <div className="flex flex-wrap gap-2 items-center mb-5 p-4 rounded-xl" style={{ background: '#1a1a1a' }}>
        <input type="date" className="input-field text-xs" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
        <input type="date" className="input-field text-xs" value={dateTo} onChange={e => setDateTo(e.target.value)} />
        {[['Hoy', 0], ['Ayer', 1], ['Últimos 7 días', 6], ['Últimos 30 días', 29]].map(([l, d]) => (
          <button key={l} onClick={() => quickFilter(d)}
            className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
            style={{ background: 'rgba(255,255,255,0.08)' }}>{l}</button>
        ))}
      </div>

      {data && (
        <>
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 mb-5">
            {[
              { label: 'Total Ingresos', value: data.kpis?.total, color: 'bg-red-600' },
              { label: 'Usuarios Únicos', value: data.kpis?.unique_users, color: 'bg-blue-600' },
              { label: 'Membresías Válidas', value: data.kpis?.with_membership, color: 'bg-green-600' },
              { label: 'Hora Pico', value: data.kpis?.hora_pico || '--:--', color: 'bg-purple-600' },
            ].map((k, i) => (
              <div key={i} className="rounded-xl p-4 flex items-center gap-3" style={{ background: '#1a1a1a' }}>
                <div className={`${k.color} p-2 rounded-lg`}>
                  <Users size={16} className="text-white" />
                </div>
                <div>
                  <p className="text-xl font-black">{k.value || 0}</p>
                  <p className="text-xs opacity-50">{k.label}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="rounded-xl p-5 mb-4" style={{ background: '#1a1a1a' }}>
            <p className="font-bold mb-4">Ingresos por Día</p>
            <ResponsiveContainer width="100%" height={150}>
              <BarChart data={data.byDay}>
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#666' }} tickFormatter={v => v?.slice(5)} />
                <YAxis tick={{ fontSize: 10, fill: '#666' }} />
                <Tooltip contentStyle={{ background: '#222', border: 'none', borderRadius: '8px', fontSize: '12px' }} />
                <Bar dataKey="count" fill={primaryColor} radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Mapa de calor */}
          <div className="rounded-xl p-5" style={{ background: '#1a1a1a' }}>
            <p className="font-bold mb-4">Mapa de Calor — Horas más Concurridas</p>
            <p className="text-xs opacity-40 mb-3">Intensidad de ingresos por día de semana y hora</p>
            {data.heatmap?.length > 0 ? (
              <ReceptionHeatMap data={data.heatmap} primaryColor={primaryColor} />
            ) : <p className="text-xs opacity-30 text-center py-6">Sin datos suficientes</p>}
          </div>
        </>
      )}
    </div>
  );
}
function ReceptionHeatMap({ data, primaryColor }) {
  const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  const hours = Array.from({ length: 24 }, (_, i) => i);
  const max = Math.max(...(data?.map(d => d.count) || [1]));
  const getCell = (dow, hour) => data?.find(d => d.dow === dow && d.hour === hour)?.count || 0;

  return (
    <div className="overflow-x-auto">
      <div className="min-w-max">
        <div className="flex gap-1 mb-1 ml-8">
          {hours.map(h => <span key={h} className="w-6 text-center text-xs opacity-30">{h.toString().padStart(2, '0')}</span>)}
        </div>
        {days.map((day, dow) => (
          <div key={dow} className="flex items-center gap-1 mb-1">
            <span className="w-7 text-xs opacity-40 text-right">{day}</span>
            {hours.map(h => {
              const count = getCell(dow, h);
              const opacity = count === 0 ? 0.08 : Math.max(0.2, count / max);
              return (
                <div key={h} title={`${count} ingresos`}
                  className="w-6 h-5 rounded-sm"
                  style={{ backgroundColor: primaryColor, opacity }} />
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
