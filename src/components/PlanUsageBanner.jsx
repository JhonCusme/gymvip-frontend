import { useState, useEffect } from 'react';

export default function PlanUsageBanner({ fetchUsage }) {
  const [usage, setUsage] = useState(null);

  useEffect(() => {
    fetchUsage()
      .then(r => setUsage(r.data))
      .catch(() => {});
  }, []);

  if (!usage || usage.unlimited) return null;
  if (usage.status === 'ok') return null; // No mostrar si está bien

  const styles = {
    warning: { bg: 'bg-yellow-50', border: 'border-yellow-300', text: 'text-yellow-800', icon: '⚠️' },
    over: { bg: 'bg-orange-50', border: 'border-orange-300', text: 'text-orange-800', icon: '⚠️' },
    blocked: { bg: 'bg-red-50', border: 'border-red-300', text: 'text-red-800', icon: '🔒' },
  };
  const s = styles[usage.status] || styles.warning;

  let message;
  if (usage.status === 'warning') {
    message = `Estás cerca del límite de tu plan (${usage.current}/${usage.maxUsers} alumnos). Considera ampliar tu plan pronto.`;
  } else if (usage.status === 'over') {
    message = `Alcanzaste el límite de tu plan (${usage.current}/${usage.maxUsers}). Tienes ${usage.graceLeft} cupo(s) de cortesía antes del bloqueo. Amplía tu plan para seguir creciendo.`;
  } else if (usage.status === 'blocked') {
    message = `Límite alcanzado (${usage.current}/${usage.maxUsers}). No puedes agregar más alumnos hasta ampliar tu plan. Contacta a soporte.`;
  }

  return (
    <div className={`rounded-xl p-4 mb-4 border ${s.bg} ${s.border} ${s.text}`}>
      <div className="flex items-start gap-3">
        <span className="text-lg">{s.icon}</span>
        <div className="flex-1">
          <p className="text-sm font-medium">{message}</p>
        </div>
      </div>
    </div>
  );
}