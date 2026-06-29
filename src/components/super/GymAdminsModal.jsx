import { useState, useEffect } from 'react';
import { superAPI } from '../../api';
import { Modal, Field, Spinner } from '../ui';
import { Plus, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

// ============================================================
// MODAL ADMINISTRADORES
// ============================================================
export function GymAdminsModal({ gym, onClose }) {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ cedula: '', name: '', password: '' });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    try {
      const res = await superAPI.getGymAdmins(gym.id);
      setAdmins(res.data);
    } catch { toast.error('Error al cargar administradores'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleAdd = async () => {
    if (!form.cedula) return toast.error('Cédula requerida');
    setSaving(true);
    try {
      await superAPI.addGymAdmin(gym.id, form);
      toast.success('Administrador agregado');
      setForm({ cedula: '', name: '', password: '' });
      setShowForm(false);
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al agregar administrador');
    } finally { setSaving(false); }
  };

  const handleRemove = async (userId) => {
    try {
      await superAPI.removeGymAdmin(gym.id, userId);
      toast.success('Administrador removido');
      load();
    } catch { toast.error('Error al remover administrador'); }
  };

  return (
    <Modal open onClose={onClose} title={`Administradores — ${gym.name}`} maxWidth="max-w-md">
      <div className="flex justify-end mb-4">
        <button onClick={() => setShowForm(!showForm)} className="btn-primary flex items-center gap-2 text-sm" style={{ backgroundColor: '#DC2626' }}>
          <Plus size={14} /> Agregar admin
        </button>
      </div>

      {showForm && (
        <div className="p-4 rounded-xl mb-4 border border-blue-200 bg-blue-50 flex flex-col gap-3">
          <p className="text-sm font-semibold text-blue-800">Agregar administrador</p>
          <p className="text-xs text-blue-600">Si la cédula ya existe en el sistema, solo se asigna el rol. Si no existe, se crea el usuario.</p>
          <Field label="Cédula" required>
            <input className="input-field" placeholder="Ej. 0912345678" value={form.cedula}
              onChange={(e) => setForm({ ...form, cedula: e.target.value })} />
          </Field>
          <Field label="Nombre (si es usuario nuevo)">
            <input className="input-field" placeholder="Nombre completo" value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </Field>
          <Field label="Contraseña (si es usuario nuevo)">
            <input className="input-field" type="password" placeholder="Mínimo 6 caracteres" value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })} />
          </Field>
          <div className="flex gap-2">
            <button onClick={() => setShowForm(false)} className="btn-secondary text-sm flex-1">Cancelar</button>
            <button onClick={handleAdd} disabled={saving} className="btn-primary text-sm flex-1 flex items-center justify-center gap-2"
              style={{ backgroundColor: '#DC2626' }}>
              {saving && <Spinner size={14} className="text-white" />}
              Confirmar
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-8"><Spinner size={24} className="text-gray-300" /></div>
      ) : admins.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-8">No hay administradores asignados</p>
      ) : (
        <div className="flex flex-col gap-2">
          {admins.map((admin) => (
            <div key={admin.id} className="flex items-center justify-between p-3 rounded-xl bg-gray-50">
              <div>
                <p className="text-sm font-semibold text-gray-900">{admin.name}</p>
                <p className="text-xs text-gray-400">Cédula: {admin.cedula}</p>
              </div>
              <button onClick={() => handleRemove(admin.id)} className="p-1.5 rounded-lg text-red-400 hover:bg-red-100 transition-colors">
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </Modal>
  );
}

// ============================================================
// MODAL PLANES DE MEMBRESÍA
// ============================================================
export function GymPlansModal({ gym, onClose }) {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    name: '', description: '', durationValue: 1, durationUnit: 'months',
    price: 0, sessionsPerWeek: '', isActive: true
  });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    try {
      const res = await superAPI.getGymPlans(gym.id);
      setPlans(res.data);
    } catch { toast.error('Error al cargar planes'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

 const handleCreate = async () => {
  if (!form.name) return toast.error('Nombre requerido');
  setSaving(true);
  try {
    await superAPI.createGymPlan(gym.id, {
      ...form,
      durationValue: parseInt(form.durationValue) || 1,
      price: parseFloat(form.price) || 0,
      sessionsPerWeek: form.sessionsPerWeek ? parseInt(form.sessionsPerWeek) : null,
      isActive: form.isActive
    });
    toast.success('Plan creado');
    setForm({ name: '', description: '', durationValue: 1, durationUnit: 'months', price: 0, sessionsPerWeek: '', isActive: true });
    setShowForm(false);
    load();
  } catch (err) {
    toast.error(err.response?.data?.error || 'Error al crear plan');
  } finally { setSaving(false); }
};

  const unitLabel = { days: 'días', weeks: 'semanas', months: 'mes(es)', years: 'año(s)' };

  return (
    <Modal open onClose={onClose} title={`Planes de membresía — ${gym.name}`} maxWidth="max-w-lg">
      <div className="flex justify-end mb-4">
        <button onClick={() => setShowForm(!showForm)} className="btn-primary flex items-center gap-2 text-sm" style={{ backgroundColor: '#DC2626' }}>
          <Plus size={14} /> Nuevo plan
        </button>
      </div>

      {showForm && (
        <div className="p-4 rounded-xl mb-4 border border-gray-200 bg-gray-50 flex flex-col gap-3">
          <Field label="Nombre" required>
            <input className="input-field" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Duración (Cantidad)">
              <input className="input-field" type="number" min={1} value={form.durationValue}
                onChange={(e) => setForm({ ...form, durationValue: parseInt(e.target.value) })} />
            </Field>
            <Field label="Unidad de Tiempo">
              <select className="input-field" value={form.durationUnit}
                onChange={(e) => setForm({ ...form, durationUnit: e.target.value })}>
                <option value="days">Días</option>
                <option value="weeks">Semanas</option>
                <option value="months">Meses</option>
                <option value="years">Años</option>
              </select>
            </Field>
            <Field label="Precio ($)">
              <input className="input-field" type="number" min={0} step={0.01} value={form.price}
                onChange={(e) => setForm({ ...form, price: parseFloat(e.target.value) })} />
            </Field>
            <Field label="Sesiones/semana (opcional)">
              <input className="input-field" type="number" min={0} value={form.sessionsPerWeek}
                onChange={(e) => setForm({ ...form, sessionsPerWeek: e.target.value })} />
            </Field>
          </div>
          <Field label="Descripción">
            <textarea className="input-field" rows={2} value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </Field>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input type="checkbox" checked={form.isActive}
              onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
              className="w-4 h-4 accent-red-600" />
            Activo
          </label>
          <div className="flex gap-2">
            <button onClick={() => setShowForm(false)} className="btn-secondary text-sm flex-1">Cancelar</button>
            <button onClick={handleCreate} disabled={saving} className="btn-primary text-sm flex-1 flex items-center justify-center gap-2"
              style={{ backgroundColor: '#DC2626' }}>
              {saving && <Spinner size={14} className="text-white" />}
              Crear
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-8"><Spinner size={24} className="text-gray-300" /></div>
      ) : plans.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-8">No hay planes creados</p>
      ) : (
        <div className="flex flex-col gap-2">
          {plans.map((plan) => (
            <div key={plan.id} className="p-3 rounded-xl bg-gray-50 border border-gray-100">
              <div className="flex items-center justify-between">
                <p className="text-sm font-bold text-gray-900">{plan.name}</p>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${plan.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-500'}`}>
                  {plan.is_active ? 'Activo' : 'Inactivo'}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">
                ${plan.price} · {plan.duration_value} {unitLabel[plan.duration_unit]}
                {plan.sessions_per_week ? ` · ${plan.sessions_per_week} ses/sem` : ''}
              </p>
              {plan.description && <p className="text-xs text-orange-600 mt-1">{plan.description}</p>}
            </div>
          ))}
        </div>
      )}
    </Modal>
  );
}

export default GymAdminsModal;
