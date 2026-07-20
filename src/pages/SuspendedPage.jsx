import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function SuspendedPage() {
  const navigate = useNavigate();
  const [gymName, setGymName] = useState('');
  const [role, setRole] = useState('');

  useEffect(() => {
    setGymName(sessionStorage.getItem('suspended_gym') || '');
    setRole(localStorage.getItem('gymvip_role') || '');
  }, []);

  const isOwner = role === 'admin' || role === 'super_admin';

  const handleLogout = () => {
    const slug = localStorage.getItem('gymvip_slug');
    localStorage.removeItem('gymvip_token');
    localStorage.removeItem('gymvip_user');
    localStorage.removeItem('gymvip_gym');
    localStorage.removeItem('gymvip_role');
    sessionStorage.removeItem('suspended_gym');
    window.location.href = slug ? `/login?gym=${slug}` : '/login';
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ background: '#0f0f0f' }}>
      <div className="max-w-md w-full text-center">
        <div className="text-6xl mb-6">🔒</div>

        <h1 className="text-2xl font-black text-white mb-3">
          Servicio Suspendido
        </h1>

        {gymName && (
          <p className="text-sm text-white/40 mb-6">{gymName}</p>
        )}

        {isOwner ? (
          <div className="rounded-2xl p-6 mb-6" style={{ background: '#1a1a1a' }}>
            <p className="text-white/80 text-sm leading-relaxed mb-4">
              El servicio de tu gimnasio está <strong>suspendido por falta de pago</strong>.
            </p>
            <p className="text-white/60 text-sm leading-relaxed">
              Para reactivarlo, ponte en contacto con soporte y regulariza tu suscripción.
              Tus datos están seguros y se restaurarán al reactivar el servicio.
            </p>
          </div>
        ) : (
          <div className="rounded-2xl p-6 mb-6" style={{ background: '#1a1a1a' }}>
            <p className="text-white/80 text-sm leading-relaxed">
              El servicio no está disponible temporalmente.
            </p>
            <p className="text-white/60 text-sm leading-relaxed mt-3">
              Por favor comunícate directamente con tu gimnasio para más información.
            </p>
          </div>
        )}

        <button onClick={handleLogout}
          className="w-full py-3 rounded-xl font-semibold text-white/70 hover:text-white transition-colors"
          style={{ background: 'rgba(255,255,255,0.06)' }}>
          Cerrar sesión
        </button>
      </div>
    </div>
  );
}