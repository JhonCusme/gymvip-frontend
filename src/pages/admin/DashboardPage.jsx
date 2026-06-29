import { useState, useEffect } from 'react';
import { adminAPI } from '../../api';
import { KPICard, PageLoader } from '../../components/ui';
import { Users, UserCheck, CalendarCheck, AlertTriangle } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

export default function AdminDashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { gym } = useAuth();
  const primaryColor = gym?.primaryColor || '#E85D04';

  useEffect(() => {
    adminAPI.getDashboard()
      .then(res => setData(res.data))
      .catch(() => toast.error('Error al cargar dashboard'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <PageLoader />;
  if (!data) return null;

  const kpis = data.kpis;
  const monthRevenue = parseFloat(data.monthlyRevenue?.total || 0);
  const growth = parseFloat(data.monthlyRevenue?.growth || 0);

  return (
    <div className="fade-in">
      <h1 className="text-xl font-bold mb-5">Dashboard</h1>

      {/* KPIs */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 mb-5">
        <KPICard title="Total Usuarios" value={kpis.total_users} icon={Users} iconBg="bg-blue-600" />
        <KPICard title="Miembros Activos" value={kpis.active_members} icon={UserCheck} iconBg="bg-green-600" />
        <KPICard title="Reservas Hoy" value={kpis.reservas_hoy} icon={CalendarCheck} iconBg="bg-purple-600" />
        <KPICard title="Por Vencer" value={kpis.por_vencer} icon={AlertTriangle} iconBg="bg-yellow-600" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Gráfico ingresos */}
        <div className="xl:col-span-2 rounded-xl p-5" style={{ background: '#1a1a1a' }}>
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-sm opacity-50">Ingresos del Mes</p>
              <p className="text-3xl font-black">${monthRevenue.toLocaleString('es-EC', { minimumFractionDigits: 2 })}</p>
              {growth !== 0 && (
                <p className={`text-xs mt-1 ${growth > 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {growth > 0 ? '↑' : '↓'} {Math.abs(growth).toFixed(2)}% vs mes anterior
                </p>
              )}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={data.weeklyRevenue}>
              <defs>
                <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={primaryColor} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={primaryColor} stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="week" tick={{ fontSize: 10, fill: '#666' }}
                tickFormatter={(v) => `Sem ${new Date(v).getDate()}`} />
              <YAxis tick={{ fontSize: 10, fill: '#666' }} />
              <Tooltip
                contentStyle={{ background: '#222', border: 'none', borderRadius: '8px', fontSize: '12px' }}
                formatter={(v) => [`$${parseFloat(v).toFixed(2)}`, 'Ingresos']}
              />
              <Area type="monotone" dataKey="total" stroke={primaryColor}
                strokeWidth={2} fill="url(#colorRev)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Historial del día */}
        <div className="rounded-xl p-5" style={{ background: '#1a1a1a' }}>
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold">Historial de Ingresos (Hoy)</p>
            <span className="text-xs opacity-40">{data.todayAttendance?.length || 0} registros</span>
          </div>
          {data.todayAttendance?.length === 0 ? (
            <p className="text-xs opacity-30 text-center py-8">No hay ingresos registrados hoy.</p>
          ) : (
            <div className="flex flex-col gap-2 overflow-y-auto max-h-52">
              {data.todayAttendance?.map((att, i) => (
                <div key={i} className="flex items-center justify-between p-2 rounded-lg" style={{ background: 'rgba(255,255,255,0.04)' }}>
                  <div>
                    <p className="text-xs font-semibold">{att.name}</p>
                    <p className="text-xs opacity-40">{att.cedula}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs opacity-50">
                      {new Date(att.check_in_time).toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                    <span className="text-xs" style={{ color: primaryColor }}>{att.method}</span>
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
