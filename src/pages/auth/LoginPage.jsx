import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { authAPI } from '../../api';
import { Spinner } from '../../components/ui';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const [searchParams] = useSearchParams();
  const gymSlug = searchParams.get('gym');
  const navigate = useNavigate();
  const { login } = useAuth();

  const [gymInfo, setGymInfo] = useState(null);
  const [loadingGym, setLoadingGym] = useState(false);
  const [form, setForm] = useState({ cedula: '', password: '' });
  const [loading, setLoading] = useState(false);
const [errorMsg, setErrorMsg] = useState('');
const [multiRoleData, setMultiRoleData] = useState(null);

  // Cargar info del gym si viene en la URL
  useEffect(() => {
    if (gymSlug) {
      setLoadingGym(true);
      authAPI.getGymInfo(gymSlug)
        .then((res) => {
          setGymInfo(res.data);
          // Aplicar colores del gym
          const root = document.documentElement;
          if (res.data.primary_color) root.style.setProperty('--color-primary', res.data.primary_color);
        })
        .catch(() => toast.error('Gimnasio no encontrado'))
        .finally(() => setLoadingGym(false));
    }
  }, [gymSlug]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.cedula || !form.password) return toast.error('Completa todos los campos');

    setLoading(true);
    try {
      const data = await login(form.cedula, form.password, gymSlug || undefined);

      // Multi-rol — mostrar pantalla de selección
      if (data.multiRole) {
        setMultiRoleData(data);
        return;
      }

      const role = data.role || data.user?.role;

      if (data.user.isSuperAdmin && !gymSlug) {
        navigate('/super/gyms');
      } else if (role === 'admin') {
        navigate('/dashboard');
      } else if (role === 'recepcionista') {
        navigate('/recepcion');
      } else if (role === 'instructor') {
        navigate('/instructor');
      } else {
        navigate('/usuario/home');
      }
    } catch (err) {
      const msg = err.response?.data?.error || 'Cédula o contraseña incorrectos';
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  // Colores del gym o defaults
  const primaryColor = gymInfo?.primary_color || '#DC2626';
  const isSuperLogin = !gymSlug;

  const handleSelectRole = async (selectedRole) => {
    try {
      // Hacer login de nuevo con el rol seleccionado
      const res = await authAPI.loginWithRole({
        cedula: form.cedula,
        password: form.password,
        gym: gymSlug,
        role: selectedRole
      });
      await login(form.cedula, form.password, gymSlug, selectedRole);
      const redirectMap = {
        admin: '/dashboard',
        recepcionista: '/recepcion',
        instructor: '/instructor',
        user: '/usuario/home'
      };
      navigate(redirectMap[selectedRole] || '/usuario/home');
    } catch (err) {
      setErrorMsg('Error al seleccionar rol');
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{
        background: isSuperLogin
          ? 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)'
          : `linear-gradient(135deg, #0a0a0a 0%, #111 100%)`
      }}
    >
      <div className="w-full max-w-sm">
        {/* Logo / Info del gym */}
        <div className="text-center mb-8">
          {loadingGym ? (
            <Spinner size={32} className="mx-auto opacity-40 text-white" />
          ) : gymInfo ? (
            <>
              {gymInfo.logo_url ? (
                <img src={gymInfo.logo_url} alt={gymInfo.name} className="w-20 h-20 object-contain mx-auto mb-3 rounded-xl" />
              ) : (
                <div
                  className="w-20 h-20 rounded-xl mx-auto mb-3 flex items-center justify-center text-white text-3xl font-black"
                  style={{ backgroundColor: primaryColor }}
                >
                  {gymInfo.name?.charAt(0).toUpperCase()}
                </div>
              )}
              <h1 className="text-2xl font-black text-white">{gymInfo.name}</h1>
              <p className="text-sm mt-1" style={{ color: primaryColor }}>Panel de acceso</p>
            </>
          ) : (
            <>
              <div className="w-20 h-20 rounded-xl mx-auto mb-3 flex items-center justify-center bg-red-600 text-white text-3xl font-black">
                G
              </div>
              <h1 className="text-2xl font-black text-white">GymVIP</h1>
              <p className="text-sm text-gray-400 mt-1">Super Administrador</p>
            </>
          )}
        </div>
        
        {/* Form */}
        {/* Pantalla de selección de rol */}
        {multiRoleData && (
          <div className="rounded-2xl p-6 shadow-2xl"
            style={{ background: 'rgba(255,255,255,0.06)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <p className="text-center text-white font-bold text-lg mb-1">¡Bienvenido, {multiRoleData.user?.name}!</p>
            <p className="text-center text-sm opacity-50 mb-5">¿Con qué rol deseas ingresar?</p>
            <div className="flex flex-col gap-3">
              {multiRoleData.roles.map(role => {
                const roleLabels = {
                  admin: { label: 'Administrador', icon: '🏢', desc: 'Gestionar el gimnasio' },
                  recepcionista: { label: 'Recepcionista', icon: '👥', desc: 'Atender clientes' },
                  instructor: { label: 'Instructor', icon: '💪', desc: 'Ver mis clases' },
                  user: { label: 'Cliente', icon: '🏃', desc: 'Ver mi membresía' }
                };
                const r = roleLabels[role] || { label: role, icon: '👤', desc: '' };
                return (
                  <button key={role} onClick={() => handleSelectRole(role)}
                    className="flex items-center gap-4 p-4 rounded-xl text-left transition-all hover:opacity-80"
                    style={{ backgroundColor: primaryColor }}>
                    <span className="text-2xl">{r.icon}</span>
                    <div>
                      <p className="font-bold text-white">{r.label}</p>
                      <p className="text-xs text-white opacity-70">{r.desc}</p>
                    </div>
                  </button>
                );
              })}
            </div>
            <button onClick={() => setMultiRoleData(null)}
              className="w-full mt-3 py-2 text-xs opacity-40 hover:opacity-70 transition-opacity text-white">
              ← Volver al login
            </button>
          </div>
        )}

        {/* Formulario normal — ocultar si hay multiRole */}
        {!multiRoleData && (
        <form
          onSubmit={handleSubmit}
          className="rounded-2xl p-6 shadow-2xl"
          style={{ background: 'rgba(255,255,255,0.06)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.08)' }}
        >
          <div className="flex flex-col gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">
                {isSuperLogin ? 'Usuario' : 'Cédula'}
              </label>
              <input
                type="text"
                value={form.cedula}
                onChange={(e) => setForm({ ...form, cedula: e.target.value })}
                placeholder={isSuperLogin ? 'Número de cédula' : 'Ingresa tu cédula'}
                className="w-full px-4 py-3 rounded-xl text-sm text-white outline-none transition-all"
                style={{
                  background: 'rgba(255,255,255,0.08)',
                  border: '1px solid rgba(255,255,255,0.1)',
                }}
                onFocus={(e) => e.target.style.borderColor = primaryColor}
                onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">
                Contraseña
              </label>
              <input
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="••••••••"
                className="w-full px-4 py-3 rounded-xl text-sm text-white outline-none transition-all"
                style={{
                  background: 'rgba(255,255,255,0.08)',
                  border: '1px solid rgba(255,255,255,0.1)',
                }}
                onFocus={(e) => e.target.style.borderColor = primaryColor}
                onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl font-bold text-white transition-all hover:opacity-90 active:scale-95 mt-2 flex items-center justify-center gap-2"
              style={{ backgroundColor: primaryColor }}
            >
              {loading ? <Spinner size={18} className="text-white" /> : null}
              {loading ? 'Ingresando...' : 'Ingresar'}
            </button>
            {errorMsg && (
              <div className="mt-2 p-3 rounded-xl text-sm text-center font-medium"
                style={{ background: 'rgba(220,38,38,0.15)', border: '1px solid rgba(220,38,38,0.3)', color: '#f87171' }}>
                ⚠ {errorMsg}
              </div>
            )}
          </div>
        </form>
        )}

        {/* Info gym */}
        {gymInfo && (
          <p className="text-center text-xs text-gray-500 mt-4">
            {gymInfo.address || gymInfo.phone || ''}
          </p>
        )}
      </div>
    </div>
  );
}