import { useState, useEffect } from 'react';
import { adminAPI } from '../../api';
import { PageHeader, PageLoader, KPICard, EmptyState, Spinner } from '../../components/ui';
import { Wallet, TrendingUp, Users, Clock, RefreshCw, QrCode } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import QRScanner from '../../components/ui/QRScanner';

// ============================================================
// PAGOS
// ============================================================
export function AdminPaymentsPage() {
  const { gym } = useAuth();
  const primaryColor = gym?.primaryColor || '#E85D04';
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ dateFrom: '', dateTo: '', method: 'todos', status: 'pagado' });

  const load = async () => {
    setLoading(true);
    try {
      const res = await adminAPI.getPayments(filters);
      setPayments(res.data.payments);
    } catch { toast.error('Error al cargar pagos'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [filters]);

  const methodBadge = (m) => {
    const colors = { efectivo: 'bg-green-500/20 text-green-400', transferencia: 'bg-blue-500/20 text-blue-400', tarjeta: 'bg-purple-500/20 text-purple-400', payphone: 'bg-yellow-500/20 text-yellow-400' };
    return <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${colors[m] || 'bg-white/10 text-white/50'}`}>{m}</span>;
  };

  return (
    <div className="fade-in">
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-xl font-bold">Registro de Pagos</h1>
        <button className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm opacity-50 hover:opacity-100 transition-all" style={{ background: '#1a1a1a' }}>
          ⬇ Exportar
        </button>
      </div>

      {/* Filtros */}
      <div className="p-4 rounded-xl mb-4 flex flex-wrap gap-3 items-end" style={{ background: '#1a1a1a' }}>
        <div>
          <p className="text-xs opacity-50 mb-1">Desde</p>
          <input type="date" className="input-field text-xs" value={filters.dateFrom}
            onChange={e => setFilters({ ...filters, dateFrom: e.target.value })} />
        </div>
        <div>
          <p className="text-xs opacity-50 mb-1">Hasta</p>
          <input type="date" className="input-field text-xs" value={filters.dateTo}
            onChange={e => setFilters({ ...filters, dateTo: e.target.value })} />
        </div>
        <div>
          <p className="text-xs opacity-50 mb-1">Método de Pago</p>
          <select className="input-field text-xs" value={filters.method}
            onChange={e => setFilters({ ...filters, method: e.target.value })}>
            {['todos', 'efectivo', 'transferencia', 'tarjeta', 'payphone'].map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
        <div>
          <p className="text-xs opacity-50 mb-1">Estado</p>
          <select className="input-field text-xs" value={filters.status}
            onChange={e => setFilters({ ...filters, status: e.target.value })}>
            {['todos', 'pagado', 'pendiente', 'fallido'].map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <button onClick={() => setFilters({ dateFrom: '', dateTo: '', method: 'todos', status: 'pagado' })}
          className="px-3 py-2.5 rounded-lg text-xs opacity-50 hover:opacity-100 transition-all border border-white/10">
          Limpiar
        </button>
      </div>

      <div className="rounded-xl overflow-hidden" style={{ background: '#1a1a1a' }}>
        {loading ? <div className="flex justify-center py-16"><Spinner size={28} className="opacity-30" /></div>
          : payments.length === 0 ? <EmptyState icon={Wallet} title="No hay pagos" subtitle="No se encontraron pagos con los filtros seleccionados" />
          : (
            <table className="data-table">
              <thead><tr><th>Fecha</th><th>Cliente</th><th>Membresía</th><th>Monto</th><th>Método</th><th>Recibido por</th><th>Estado</th><th>Notas</th></tr></thead>
              <tbody>
                {payments.map(p => (
                  <tr key={p.id} className="hover:bg-white/3 transition-colors">
                    <td className="text-xs opacity-60">{new Date(p.created_at).toLocaleDateString('es-EC')}</td>
                    <td>
                      <p className="font-semibold text-sm">{p.client_name}</p>
                      <p className="text-xs opacity-40">{p.client_cedula}</p>
                    </td>
                    <td className="text-xs opacity-60">{p.membership_name || '—'}</td>
                    <td className="font-bold text-green-400">${parseFloat(p.amount).toFixed(2)}</td>
                    <td>{methodBadge(p.method)}</td>
                    <td className="text-xs opacity-50">{p.registered_by_name || '—'}</td>
                    <td><span className={p.status === 'pagado' ? 'badge-active' : p.status === 'pendiente' ? 'badge-warning' : 'badge-inactive'}>{p.status}</span></td>
                    <td className="text-xs opacity-40">{p.notes || '—'}</td>
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
// REPORTES
// ============================================================
export function AdminReportsPage() {
  const { gym } = useAuth();
  const primaryColor = gym?.primaryColor || '#E85D04';
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('month');
  const PIE_COLORS = ['#E85D04', '#3b82f6', '#8b5cf6', '#16a34a', '#f59e0b'];

  const load = async () => {
    setLoading(true);
    try { const res = await adminAPI.getReports({ period }); setData(res.data); }
    catch { toast.error('Error al cargar reportes'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [period]);

  if (loading) return <PageLoader />;
  if (!data) return null;

  const rev = data.revenue;

  return (
    <div className="fade-in">
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-xl font-bold">Reportes</h1>
        <div className="flex gap-2">
          {['month', 'year'].map(p => (
            <button key={p} onClick={() => setPeriod(p)}
              className="px-3 py-1.5 rounded-lg text-sm font-medium transition-all"
              style={period === p ? { backgroundColor: primaryColor, color: '#fff' } : { background: '#1a1a1a', opacity: 0.5 }}>
              {p === 'month' ? 'Este Mes' : 'Este Año'}
            </button>
          ))}
        </div>
      </div>

      {/* Revenue KPIs */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 mb-5">
        <div className="rounded-xl p-4 border-l-4" style={{ background: '#1a1a1a', borderColor: '#16a34a' }}>
          <p className="text-xs opacity-50">Total</p>
          <p className="text-2xl font-black text-green-400">${parseFloat(rev.total || 0).toFixed(2)}</p>
        </div>
        <div className="rounded-xl p-4 border-l-4" style={{ background: '#1a1a1a', borderColor: '#22c55e' }}>
          <p className="text-xs opacity-50">Efectivo</p>
          <p className="text-2xl font-black">${parseFloat(rev.efectivo || 0).toFixed(2)}</p>
        </div>
        <div className="rounded-xl p-4 border-l-4" style={{ background: '#1a1a1a', borderColor: '#3b82f6' }}>
          <p className="text-xs opacity-50">Tarjeta/Transfer.</p>
          <p className="text-2xl font-black">${parseFloat(rev.tarjeta_transfer || 0).toFixed(2)}</p>
        </div>
        <div className="rounded-xl p-4 border-l-4" style={{ background: '#1a1a1a', borderColor: '#f59e0b' }}>
          <p className="text-xs opacity-50">PayPhone</p>
          <p className="text-2xl font-black">${parseFloat(rev.payphone || 0).toFixed(2)}</p>
        </div>
      </div>

      {/* Gráfico barras diario */}
      <div className="rounded-xl p-5 mb-5" style={{ background: '#1a1a1a' }}>
        <p className="font-bold mb-4">Ingresos por día</p>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={data.dailyRevenue}>
            <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#666' }} tickFormatter={v => v?.slice(5)} />
            <YAxis tick={{ fontSize: 10, fill: '#666' }} />
            <Tooltip contentStyle={{ background: '#222', border: 'none', borderRadius: '8px', fontSize: '12px' }}
              formatter={v => [`$${parseFloat(v).toFixed(2)}`, 'Ingresos']} />
            <Bar dataKey="total" fill={primaryColor} radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        {/* Membresías por tipo */}
        <div className="rounded-xl p-5" style={{ background: '#1a1a1a' }}>
          <p className="font-bold mb-4">Membresías por Tipo</p>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={data.membershipsByType} dataKey="count" nameKey="name" cx="50%" cy="50%" outerRadius={70} label={({ name, count }) => `${count}`}>
                {data.membershipsByType.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Membresías por vencer */}
        <div className="rounded-xl p-5" style={{ background: '#1a1a1a' }}>
          <p className="font-bold mb-4">Membresías por Vencer</p>
          {data.expiringSoon?.length === 0 ? (
            <p className="text-xs opacity-30 text-center py-8">No hay membresías próximas a vencer</p>
          ) : (
            <div className="flex flex-col gap-2">
              {data.expiringSoon?.map((m, i) => (
                <div key={i} className="flex items-center justify-between p-2.5 rounded-lg" style={{ background: 'rgba(255,255,255,0.04)' }}>
                  <div>
                    <p className="text-sm font-semibold">{m.name}</p>
                    <p className="text-xs opacity-40">{m.cedula}</p>
                  </div>
                  <div className="text-right">
                    <span className={`text-xs font-bold ${m.days_remaining <= 1 ? 'text-red-400' : 'text-yellow-400'}`}>
                      {m.days_remaining} días
                    </span>
                    <p className="text-xs opacity-40">{m.phone}</p>
                  </div>
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
// VALIDAR INGRESO (QR Scanner)
// ============================================================
export function AdminValidateEntryPage() {
  const { gym } = useAuth();
  const primaryColor = gym?.primaryColor || '#E85D04';
  const [code, setCode] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(false);

  const validate = async (val) => {
    const c = val || code;
    if (!c) return toast.error('Ingresa un código o cédula');
    setLoading(true);
    setResult(null);
    try {
      const res = await adminAPI.validateEntry({ code: c });
      setResult(res.data);
      if (res.data.valid) toast.success(`✅ Acceso concedido — ${res.data.user?.name}`);
      else toast.error(`❌ Acceso denegado — ${res.data.error}`);
    } catch { toast.error('Error al validar ingreso'); }
    finally { setLoading(false); }
  };

  return (
    <div className="fade-in max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <QrCode size={22} style={{ color: primaryColor }} />
        <h1 className="text-xl font-bold">Validar Ingreso</h1>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        {/* Área QR */}
          <div className="rounded-xl p-5 mb-4" style={{ background: '#1a1a1a' }}>
            <p className="font-semibold mb-3">Escanear Código QR</p>
            <QRScanner
              onScan={(code) => { setCode(code); validate(code); }}
              onError={(err) => console.error('QR error:', err)}
            />
          </div>

        {/* Manual + resultado */}
        <div className="flex flex-col gap-4">
          <div className="rounded-xl p-5" style={{ background: '#1a1a1a' }}>
            <p className="font-semibold mb-3">Validación Manual</p>
            <div className="flex gap-2">
              <input className="input-field flex-1" placeholder="Ingresar cédula o código..."
                value={code} onChange={e => setCode(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && validate()} />
              <button onClick={() => validate()} disabled={loading}
                className="px-4 py-2.5 rounded-lg font-semibold text-white text-sm flex items-center gap-2 transition-all"
                style={{ backgroundColor: primaryColor }}>
                {loading ? <Spinner size={14} className="text-white" /> : null}
                Validar
              </button>
            </div>
          </div>

          {/* Resultado */}
          {result && (
            <div className={`rounded-xl p-5 ${result.valid ? 'border border-green-500/30' : 'border border-red-500/30'}`}
              style={{ background: result.valid ? 'rgba(22,163,74,0.1)' : 'rgba(220,38,38,0.1)' }}>
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${result.valid ? 'bg-green-600' : 'bg-red-600'}`}>
                  {result.valid ? '✓' : '✕'}
                </div>
                <div>
                  <p className={`font-bold ${result.valid ? 'text-green-400' : 'text-red-400'}`}>
                    {result.valid ? 'Acceso Concedido' : 'Acceso Denegado'}
                  </p>
                  {result.user && <p className="text-sm font-semibold">{result.user.name}</p>}
                </div>
              </div>
              {result.valid && result.membership && (
                <div className="text-xs opacity-60">
                  <p>Membresía: {result.membership.typeName}</p>
                  <p>Vence: {new Date(result.membership.endDate).toLocaleDateString('es-EC')}</p>
                </div>
              )}
              {!result.valid && <p className="text-xs text-red-400">{result.error}</p>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// HISTORIAL INGRESOS
// ============================================================
export function AdminAttendancePage() {
  const { gym } = useAuth();
  const primaryColor = gym?.primaryColor || '#E85D04';
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dateFrom, setDateFrom] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() - 6);
    return d.toISOString().split('T')[0];
  });
  const [dateTo, setDateTo] = useState(new Date().toISOString().split('T')[0]);

  const load = async () => {
    setLoading(true);
    try { const res = await adminAPI.getAttendance({ dateFrom, dateTo }); setData(res.data); }
    catch { toast.error('Error al cargar historial'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [dateFrom, dateTo]);

  const quickFilter = (days) => {
    const to = new Date(); const from = new Date();
    from.setDate(from.getDate() - days);
    setDateTo(to.toISOString().split('T')[0]);
    setDateFrom(from.toISOString().split('T')[0]);
  };

  if (loading) return <PageLoader />;

  return (
    <div className="fade-in">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-bold">Historial de Ingresos</h1>
          <p className="text-xs opacity-40 mt-0.5">Análisis de asistencias por periodo</p>
        </div>
        <button onClick={load} className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm opacity-50 hover:opacity-100 transition-all" style={{ background: '#1a1a1a' }}>
          <RefreshCw size={14} /> Actualizar
        </button>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-3 items-center mb-5 p-4 rounded-xl" style={{ background: '#1a1a1a' }}>
        <div className="flex gap-2 items-center">
          <input type="date" className="input-field text-xs" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
          <span className="text-xs opacity-30">—</span>
          <input type="date" className="input-field text-xs" value={dateTo} onChange={e => setDateTo(e.target.value)} />
        </div>
        {['Hoy', 'Ayer', 'Últimos 7 días', 'Últimos 30 días'].map((label, i) => (
          <button key={label} onClick={() => quickFilter([0, 1, 6, 29][i])}
            className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
            style={{ background: 'rgba(255,255,255,0.08)' }}>
            {label}
          </button>
        ))}
      </div>

      {/* KPIs */}
      {data && (
        <>
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 mb-5">
            <KPICard title="Total Ingresos" value={data.kpis?.total_ingresos || 0} icon={TrendingUp} iconBg="bg-red-600" />
            <KPICard title="Usuarios Únicos" value={data.kpis?.unique_users || 0} icon={Users} iconBg="bg-blue-600" />
            <KPICard title="Membresías Válidas" value={data.kpis?.with_membership || 0} icon={Wallet} iconBg="bg-green-600" />
            <KPICard title="Hora Pico" value={data.kpis?.hora_pico || '--:--'} icon={Clock} iconBg="bg-purple-600" />
          </div>

          {/* Gráfico por día */}
          <div className="rounded-xl p-5 mb-5" style={{ background: '#1a1a1a' }}>
            <p className="font-bold mb-4">Ingresos por Día</p>
            <ResponsiveContainer width="100%" height={160}>
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
            <HeatMap data={data.heatmap} primaryColor={primaryColor} />
          </div>
        </>
      )}
    </div>
  );
}

function HeatMap({ data, primaryColor }) {
  const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  const hours = Array.from({ length: 24 }, (_, i) => i);
  const max = Math.max(...(data?.map(d => d.count) || [1]));
  const getCell = (dow, hour) => data?.find(d => d.day_of_week === dow && d.hour === hour)?.count || 0;

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

// ============================================================
// AUDITORÍA RECEPCIÓN
// ============================================================
export function AdminAuditPage() {
  const { gym } = useAuth();
  const primaryColor = gym?.primaryColor || '#E85D04';
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ dateFrom: '', dateTo: '', receptionistId: '', action: 'todas' });

  const load = async () => {
    setLoading(true);
    try { const res = await adminAPI.getReceptionAudit(filters); setRecords(res.data.records); }
    catch { toast.error('Error al cargar auditoría'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [filters]);

  return (
    <div className="fade-in">
      <h1 className="text-xl font-bold mb-2">Auditoría Recepción</h1>
      <p className="text-xs opacity-40 mb-5">Registro de movimientos manuales realizados por recepción.</p>

      {/* Filtros */}
      <div className="flex flex-wrap gap-3 items-end mb-4 p-4 rounded-xl" style={{ background: '#1a1a1a' }}>
        <div>
          <p className="text-xs opacity-50 mb-1">Desde</p>
          <input type="date" className="input-field text-xs" value={filters.dateFrom}
            onChange={e => setFilters({ ...filters, dateFrom: e.target.value })} />
        </div>
        <div>
          <p className="text-xs opacity-50 mb-1">Hasta</p>
          <input type="date" className="input-field text-xs" value={filters.dateTo}
            onChange={e => setFilters({ ...filters, dateTo: e.target.value })} />
        </div>
        <div>
          <p className="text-xs opacity-50 mb-1">Acción</p>
          <select className="input-field text-xs" value={filters.action}
            onChange={e => setFilters({ ...filters, action: e.target.value })}>
            {['todas', 'Reserva creada', 'Membresía creada', 'Pago registrado', 'Cliente creado'].map(a => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>
        <button onClick={() => setFilters({ dateFrom: '', dateTo: '', receptionistId: '', action: 'todas' })}
          className="px-3 py-2.5 rounded-lg text-xs opacity-50 hover:opacity-100 border border-white/10">Limpiar</button>
        <button onClick={load} className="px-3 py-2.5 rounded-lg text-xs font-semibold text-white" style={{ backgroundColor: primaryColor }}>Aplicar</button>
        <button className="ml-auto px-3 py-2.5 rounded-lg text-xs opacity-50 hover:opacity-100 border border-white/10">Exportar CSV</button>
      </div>

      <div className="rounded-xl overflow-hidden" style={{ background: '#1a1a1a' }}>
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
          <p className="text-sm font-semibold opacity-60">Movimientos</p>
          <span className="text-xs opacity-30">Total: {records.length}</span>
        </div>
        {loading ? <div className="flex justify-center py-16"><Spinner size={28} className="opacity-30" /></div>
          : records.length === 0 ? <EmptyState icon={Clock} title="No hay registros" subtitle="No se encontraron movimientos con los filtros seleccionados" />
          : (
            <table className="data-table">
              <thead><tr><th>Fecha</th><th>Recepcionista</th><th>Acción</th><th>Cliente</th><th>Clase</th></tr></thead>
              <tbody>
                {records.map(r => (
                  <tr key={r.id} className="hover:bg-white/3 transition-colors">
                    <td className="text-xs opacity-50">{new Date(r.created_at).toLocaleString('es-EC')}</td>
                    <td className="font-semibold text-sm">{r.receptionist_name}</td>
                    <td><span className="badge-info">{r.action}</span></td>
                    <td className="text-sm">{r.client_name ? `${r.client_name} (${r.client_cedula})` : '—'}</td>
                    <td className="text-xs opacity-50">{r.class_name ? `${r.class_name} ${r.start_time?.slice(0,5)}-${r.end_time?.slice(0,5)}` : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
      </div>
    </div>
  );
}
