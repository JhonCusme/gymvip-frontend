// ============================================================
// REPORTE GLOBAL
// ============================================================
import { useState, useEffect } from 'react';
import api, { superAPI } from '../../api';
import { KPICard, PageHeader, PageLoader, Spinner } from '../../components/ui';
import { Building2, Users, CreditCard, DollarSign, RefreshCw } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import toast from 'react-hot-toast';

export function SuperReportsPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const res = await superAPI.getGlobalReport();
      setData(res.data);
    } catch { toast.error('Error al cargar reporte'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  if (loading) return <PageLoader />;
  if (!data) return null;

  const PIE_COLORS = ['#16a34a', '#2563eb', '#0891b2', '#d97706'];
  const methodLabels = { efectivo: 'Efectivo', transferencia: 'Transferencia', tarjeta: 'Tarjeta', payphone: 'PayPhone' };

  return (
    <div className="fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Reporte Global del Sistema</h1>
          <p className="text-sm opacity-50 mt-1">Métricas consolidadas de rendimiento, suscripciones y actividad de todos los gimnasios.</p>
        </div>
        <button onClick={load} className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm text-green-600 border border-green-200 hover:bg-green-50 transition-colors">
          <RefreshCw size={14} /> Datos en tiempo real
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <KPICard title="Gimnasios" value={data.kpis.active_gyms} subtitle={`${data.kpis.active_gyms} activos`} icon={Building2} iconBg="bg-blue-500" />
        <KPICard title="Total Alumnos" value={data.kpis.total_users} subtitle="Registrados globales" icon={Users} iconBg="bg-green-500" />
        <KPICard title="Activas" value={data.kpis.active_memberships} subtitle="Suscripciones vigentes" icon={CreditCard} iconBg="bg-purple-500" />
        <KPICard title="Facturación Consolidada" value={`$${parseFloat(data.kpis.monthly_revenue || 0).toFixed(2)}`} subtitle="Recaudación global" icon={DollarSign} iconBg="bg-yellow-500" />
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 mb-6">
        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <h3 className="font-bold mb-4">Nuevas Suscripciones (Últimos 30 días)</h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={data.subscriptions}>
              <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={(v) => v?.slice(5)} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <Line type="monotone" dataKey="count" stroke="#DC2626" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <h3 className="font-bold mb-4">Recaudación Diaria ($ USD)</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={data.dailyRevenue}>
              <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={(v) => v?.slice(5)} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <Bar dataKey="total" fill="#16a34a" radius={[3,3,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Tabla desempeño + Distribución pagos */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <div className="xl:col-span-2 bg-white rounded-2xl border border-gray-200 p-5">
          <h3 className="font-bold mb-4">Desempeño Detallado por Gimnasio</h3>
          <table className="data-table">
            <thead>
              <tr>
                <th>Gimnasio</th><th>Estado</th><th>Alumnos</th>
                <th>Susc. Activas</th><th>Asistencias (30d)</th><th>Facturación</th>
              </tr>
            </thead>
            <tbody>
              {data.gymPerformance.map((gym) => (
                <tr key={gym.id}>
                  <td className="font-semibold">{gym.name}</td>
                  <td><span className={gym.is_active ? 'text-green-600 text-xs font-medium' : 'text-red-500 text-xs'}>{gym.is_active ? 'Activo' : 'Inactivo'}</span></td>
                  <td>{gym.total_users}</td>
                  <td><span className={parseInt(gym.active_memberships) > 0 ? 'text-green-600 font-medium' : 'text-gray-400'}>{gym.active_memberships}</span></td>
                  <td>{gym.attendance_30d}</td>
                  <td className="font-semibold">${parseFloat(gym.monthly_revenue).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <h3 className="font-bold mb-4">Distribución de Pagos</h3>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={data.paymentDistribution} dataKey="total" nameKey="method" cx="50%" cy="50%" innerRadius={50} outerRadius={80}>
                {data.paymentDistribution.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
              </Pie>
              <Tooltip formatter={(v) => `$${parseFloat(v).toFixed(2)}`} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-col gap-1.5 mt-2">
            {data.paymentDistribution.map((item, i) => (
              <div key={item.method} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                  <span className="text-gray-600">{methodLabels[item.method] || item.method} ({item.count} transacciones)</span>
                </div>
                <span className="font-semibold">${parseFloat(item.total).toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// MARKETPLACE TEMAS
// ============================================================
export function SuperThemesPage() {
  const [themes, setThemes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    superAPI.getThemes()
      .then((res) => setThemes(res.data))
      .catch(() => toast.error('Error al cargar temas'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <PageLoader />;

  return (
    <div className="fade-in">
      <div className="mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">🎨 Marketplace de Diseños</h1>
        <p className="text-sm opacity-50 mt-1">Elige entre plantillas de maquetación y asigna estilos visuales exclusivos a cada box.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {themes.map((theme) => (
          <div key={theme.slug} className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            {/* Preview */}
            <div className="p-4" style={{ background: theme.background_color || '#111' }}>
              <div className="text-xs font-bold mb-2" style={{ color: theme.primary_color }}>LIVE PREVIEW</div>
              <div className="bg-white/10 rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-white font-medium">Juan Pérez</span>
                  <span className="px-2 py-0.5 rounded-full text-xs font-bold" style={{ backgroundColor: theme.primary_color, color: '#fff' }}>Activo</span>
                </div>
                <div className="text-xs text-white/60 mb-1.5">WOD de Hoy</div>
                <div className="h-1.5 rounded-full" style={{ background: theme.primary_color, width: '70%' }} />
                <div className="text-right text-xs mt-1" style={{ color: theme.primary_color }}>14/15 cupos</div>
              </div>
            </div>
            {/* Info */}
            <div className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-4 h-4 rounded-full" style={{ backgroundColor: theme.primary_color }} />
                <div className="w-4 h-4 rounded-full" style={{ backgroundColor: theme.surface_color || '#1a1a1a' }} />
              </div>
              <h3 className="font-bold text-gray-900">{theme.name}</h3>
              <p className="text-xs text-gray-500 mt-1">{theme.description}</p>
              <div className="flex gap-2 mt-4">
                <button className="flex-1 py-2 rounded-lg text-xs font-medium text-gray-600 border border-gray-200 hover:bg-gray-50 transition-colors">
                  👁 Previsualizar
                </button>
                <button className="flex-1 py-2 rounded-lg text-xs font-medium text-white transition-colors" style={{ backgroundColor: theme.primary_color }}>
                  ✓ Aplicar plantilla
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================
// BACKUP BD
// ============================================================
export function SuperBackupPage() {
  const [uploading, setUploading] = useState(false);

  return (
    <div className="fade-in max-w-2xl">
      <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">🗄️ Respaldo de Base de Datos</h1>

      <div className="flex flex-col gap-5">
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <h3 className="font-bold text-gray-900 mb-1">⬇ Descargar Backup</h3>
          <p className="text-sm text-gray-500 mb-4">Descarga un respaldo completo en formato .sql. Guárdalo en un lugar seguro.</p>
          <a
            href={`${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/super/backup/download`}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-white text-sm"
            style={{ backgroundColor: '#1e293b' }}
          >
            ⬇ Descargar Backup (.sql)
          </a>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <h3 className="font-bold text-gray-900 mb-1">⬆ Importar / Restaurar Backup</h3>
          <div className="p-3 rounded-xl bg-yellow-50 border border-yellow-200 mb-4">
            <p className="text-xs text-yellow-700 font-semibold">⚠ Advertencia: Restaurar un backup sobrescribirá los datos actuales de la base de datos. Esta acción no se puede deshacer.</p>
          </div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Archivo .sql</label>
          <input type="file" accept=".sql" className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200" />
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <h3 className="font-bold text-gray-900 mb-3">¿Cómo restaurar manualmente?</h3>
          <ol className="list-decimal list-inside space-y-2 text-sm text-gray-600">
            <li>Instala PostgreSQL en el equipo destino si no está instalado.</li>
            <li>Crea una base de datos vacía: <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs font-mono">createdb crossfit_db</code></li>
            <li>Restaura con: <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs font-mono">psql -U postgres -d crossfit_db &lt; backup.sql</code></li>
          </ol>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// CONFIGURACIÓN SUPER ADMIN
// ============================================================
export function SuperSettingsPage() {
  const [tab, setTab] = useState('perfil');
  const [form, setForm] = useState({ name: 'Super Administrador', cedula: '9999999999', email: '', phone: '' });
  const [passForm, setPassForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [savingPass, setSavingPass] = useState(false);

  const handleChangePassword = async () => {
    if (!passForm.currentPassword || !passForm.newPassword) return toast.error('Completa todos los campos');
    if (passForm.newPassword !== passForm.confirmPassword) return toast.error('Las contraseñas no coinciden');
    if (passForm.newPassword.length < 6) return toast.error('Mínimo 6 caracteres');
    setSavingPass(true);
    try {
      await api.post('/auth/change-password', {
        currentPassword: passForm.currentPassword,
        newPassword: passForm.newPassword
      });
      toast.success('Contraseña actualizada exitosamente');
      setPassForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al cambiar contraseña');
    } finally {
      setSavingPass(false);
    }
  };

  return (
    <div className="fade-in max-w-3xl">
      <h1 className="text-2xl font-bold mb-6">Configuración</h1>
      <div className="grid grid-cols-4 gap-6">
        {/* Sidebar */}
        <div className="col-span-1">
          <nav className="flex flex-col gap-1">
            {['perfil','seguridad','notificaciones','pasarelas'].map((t) => (
              <button key={t} onClick={() => setTab(t)}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-all text-left capitalize ${tab === t ? 'bg-red-50 text-red-600' : 'text-gray-500 hover:bg-gray-100'}`}>
                {t === 'perfil' ? '👤' : t === 'seguridad' ? '🔒' : t === 'notificaciones' ? '🔔' : '💳'} {t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="col-span-3 bg-white rounded-2xl border border-gray-200 p-6">
          {tab === 'perfil' && (
            <div>
              <h3 className="font-bold text-gray-900 mb-5">Información del Perfil</h3>
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 rounded-full bg-red-600 flex items-center justify-center text-white text-2xl font-black">S</div>
                <div>
                  <p className="font-bold text-gray-900">Super Administrador</p>
                  <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-700 text-xs font-medium">super_admin</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="text-xs text-gray-500 font-semibold block mb-1">Nombre</label><input className="input-field" value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} /></div>
                <div><label className="text-xs text-gray-500 font-semibold block mb-1">Cédula</label><input className="input-field" value={form.cedula} disabled /></div>
                <div><label className="text-xs text-gray-500 font-semibold block mb-1">Email</label><input className="input-field" type="email" value={form.email} onChange={(e) => setForm({...form, email: e.target.value})} /></div>
                <div><label className="text-xs text-gray-500 font-semibold block mb-1">Teléfono</label><input className="input-field" value={form.phone} onChange={(e) => setForm({...form, phone: e.target.value})} placeholder="Agregar teléfono" /></div>
              </div>
              <div className="flex justify-end mt-4">
                <button className="btn-primary text-sm px-6" style={{ backgroundColor: '#DC2626' }}>Guardar Cambios</button>
              </div>
            </div>
          )}

          {tab === 'seguridad' && (
            <div>
              <h3 className="font-bold text-gray-900 mb-5">Cambiar Contraseña</h3>
              <div className="flex flex-col gap-4">
                <div><label className="text-xs text-gray-500 font-semibold block mb-1">Contraseña Actual</label>
                  <input className="input-field" type="password" value={passForm.currentPassword}
                    onChange={e => setPassForm({ ...passForm, currentPassword: e.target.value })} /></div>
                <div><label className="text-xs text-gray-500 font-semibold block mb-1">Nueva Contraseña</label>
                  <input className="input-field" type="password" value={passForm.newPassword}
                    onChange={e => setPassForm({ ...passForm, newPassword: e.target.value })} /></div>
                <div><label className="text-xs text-gray-500 font-semibold block mb-1">Confirmar Nueva Contraseña</label>
                  <input className="input-field" type="password" value={passForm.confirmPassword}
                    onChange={e => setPassForm({ ...passForm, confirmPassword: e.target.value })} /></div>
                <button onClick={handleChangePassword} disabled={savingPass}
                  className="btn-primary text-sm self-start px-6 flex items-center gap-2" style={{ backgroundColor: '#DC2626' }}>
                  {savingPass && <Spinner size={14} className="text-white" />}
                  Cambiar Contraseña
                </button>
              </div>
            </div>
          )}

          {tab === 'notificaciones' && (
            <div>
              <h3 className="font-bold text-gray-900 mb-5">Preferencias de Notificaciones</h3>
              <div className="flex flex-col gap-3">
                {['Notificar nuevos pagos', 'Notificar membresías por vencer', 'Resumen diario por email', 'Alertas de sistema'].map((item, i) => (
                  <label key={item} className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" defaultChecked={i !== 2} className="w-4 h-4 accent-red-600" />
                    <span className="text-sm text-gray-700">{item}</span>
                  </label>
                ))}
              </div>
              <button className="btn-primary text-sm mt-5 px-6" style={{ backgroundColor: '#DC2626' }}>Guardar Preferencias</button>
            </div>
          )}

          {tab === 'pasarelas' && (
            <div>
              <h3 className="font-bold text-gray-900 mb-2">Pasarelas de Pago</h3>
              <p className="text-sm text-gray-500">Solo administradores del gimnasio pueden gestionar credenciales.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
