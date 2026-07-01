import { useState } from 'react';
import { adminAPI } from '../../api';
import { Modal, Field, Spinner, EmptyState } from '../../components/ui';
import { CreditCard, Plus, Edit2, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import api from '../../api';

// ============================================================
// MEMBRESÍAS DEL ADMIN
// ============================================================
export function AdminMembershipsPage() {
  const { gym } = useAuth();
  const primaryColor = gym?.primaryColor || '#E85D04';
  const [types, setTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editType, setEditType] = useState(null);
  const [form, setForm] = useState({ name: '', description: '', durationValue: 1, durationUnit: 'months', price: 0, sessionsPerWeek: '', isActive: true });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try { const r = await adminAPI.getMembershipTypes(); setTypes(r.data); }
    catch { toast.error('Error al cargar'); }
    finally { setLoading(false); }
  };

  useState(() => { load(); }, []);

  const handleSave = async () => {
    if (!form.name) return toast.error('Nombre requerido');
    setSaving(true);
    try {
      const data = {
        ...form,
        durationValue: parseInt(form.durationValue) || 1,
        price: parseFloat(form.price) || 0,
        sessionsPerWeek: form.sessionsPerWeek ? parseInt(form.sessionsPerWeek) : null
      };
      if (editType) await adminAPI.updateMembershipType(editType.id, data);
      else await adminAPI.createMembershipType(data);
      toast.success(editType ? 'Plan actualizado' : 'Plan creado');
      setShowModal(false); setEditType(null);
      setForm({ name: '', description: '', durationValue: 1, durationUnit: 'months', price: 0, sessionsPerWeek: '', isActive: true });
      load();
    } catch (err) { toast.error(err.response?.data?.error || 'Error al guardar'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    try { await adminAPI.deleteMembershipType(id); toast.success('Plan eliminado'); load(); }
    catch { toast.error('Error al eliminar'); }
  };

  const openEdit = (type) => {
    setEditType(type);
    setForm({ name: type.name, description: type.description || '', durationValue: type.duration_value, durationUnit: type.duration_unit, price: type.price, sessionsPerWeek: type.sessions_per_week || '', isActive: type.is_active });
    setShowModal(true);
  };

  const unitLabel = { days: 'días', weeks: 'semanas', months: 'mes(es)', years: 'año(s)' };

  return (
    <div className="fade-in">
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-xl font-bold">Tipos de Membresía</h1>
        <button onClick={() => { setEditType(null); setForm({ name: '', description: '', durationValue: 1, durationUnit: 'months', price: 0, sessionsPerWeek: '', isActive: true }); setShowModal(true); }}
          className="btn-primary flex items-center gap-2 text-sm" style={{ backgroundColor: primaryColor }}>
          <Plus size={15} /> Nueva Membresía
        </button>
      </div>

      {loading ? <div className="flex justify-center py-16"><Spinner size={28} className="opacity-30" /></div>
        : types.length === 0 ? <EmptyState icon={CreditCard} title="No hay tipos de membresía" />
        : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {types.map(t => (
              <div key={t.id} className="rounded-xl p-4" style={{ background: '#1a1a1a' }}>
                <div className="flex items-start justify-between mb-2">
                  <p className="font-bold">{t.name}</p>
                  <div className="flex gap-1">
                    <button onClick={() => openEdit(t)} className="p-1.5 rounded-lg opacity-40 hover:opacity-100 hover:bg-white/10 transition-all"><Edit2 size={13} /></button>
                    <button onClick={() => handleDelete(t.id)} className="p-1.5 rounded-lg opacity-40 hover:opacity-100 hover:bg-red-500/20 hover:text-red-400 transition-all"><Trash2 size={13} /></button>
                  </div>
                </div>
                <p className="text-sm font-bold text-green-400">${parseFloat(t.price).toFixed(2)}</p>
                <p className="text-xs opacity-50">Duración: {t.duration_value} {unitLabel[t.duration_unit]}</p>
                {t.sessions_per_week && <p className="text-xs opacity-50">{t.sessions_per_week} sesiones/semana</p>}
                {t.description && <p className="text-xs opacity-40 mt-1">{t.description}</p>}
                <div className="mt-2">
                  <span className={t.is_active ? 'badge-active' : 'badge-inactive'}>{t.is_active ? 'Activo' : 'Inactivo'}</span>
                </div>
              </div>
            ))}
          </div>
        )}

      <Modal open={showModal} onClose={() => { setShowModal(false); setEditType(null); }} title={editType ? 'Editar Plan' : 'Nueva Membresía'}>
        <div className="flex flex-col gap-4">
          <Field label="Nombre" required><input className="input-field" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></Field>
          <Field label="Descripción"><textarea className="input-field" rows={2} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Duración"><input className="input-field" type="number" min={1} value={form.durationValue} onChange={e => setForm({ ...form, durationValue: e.target.value })} /></Field>
            <Field label="Unidad">
              <select className="input-field" value={form.durationUnit} onChange={e => setForm({ ...form, durationUnit: e.target.value })}>
                <option value="days">Días</option>
                <option value="weeks">Semanas</option>
                <option value="months">Meses</option>
                <option value="years">Años</option>
              </select>
            </Field>
            <Field label="Precio ($)"><input className="input-field" type="number" min={0} step={0.01} value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} /></Field>
            <Field label="Sesiones/semana"><input className="input-field" type="number" min={0} value={form.sessionsPerWeek} onChange={e => setForm({ ...form, sessionsPerWeek: e.target.value })} /></Field>
          </div>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input type="checkbox" checked={form.isActive} onChange={e => setForm({ ...form, isActive: e.target.checked })} className="w-4 h-4" />
            Activo
          </label>
          <div className="flex gap-3">
            <button onClick={() => { setShowModal(false); setEditType(null); }} className="btn-secondary flex-1 text-sm">Cancelar</button>
            <button onClick={handleSave} disabled={saving} className="btn-primary flex-1 text-sm flex items-center justify-center gap-2" style={{ backgroundColor: primaryColor }}>
              {saving && <Spinner size={14} className="text-white" />}{editType ? 'Guardar' : 'Crear'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

// ============================================================
// CONFIGURACIÓN DEL ADMIN
// ============================================================
export function AdminSettingsPage() {
 const { user, gym, updateUser } = useAuth();
  const primaryColor = gym?.primaryColor || '#E85D04';
  const [tab, setTab] = useState('perfil');
  const [form, setForm] = useState({ name: user?.name || '', email: user?.email || '', phone: user?.phone || '' });
  const [passForm, setPassForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [payphoneForm, setPayphoneForm] = useState({ storeId: '', token: '' });
  const [saving, setSaving] = useState(false);

  const handleChangePassword = async () => {
    if (!passForm.currentPassword || !passForm.newPassword) return toast.error('Completa todos los campos');
    if (passForm.newPassword !== passForm.confirmPassword) return toast.error('Las contraseñas no coinciden');
    if (passForm.newPassword.length < 6) return toast.error('Mínimo 6 caracteres');
    setSaving(true);
    try {
      await api.post('/auth/change-password', { currentPassword: passForm.currentPassword, newPassword: passForm.newPassword });
      toast.success('Contraseña actualizada');
      setPassForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) { toast.error(err.response?.data?.error || 'Error al cambiar contraseña'); }
    finally { setSaving(false); }
  };

  const handleSavePayphone = async () => {
    if (!payphoneForm.storeId || !payphoneForm.token) return toast.error('StoreId y Token son requeridos');
    setSaving(true);
    try {
      await api.post('/admin/settings/payphone', payphoneForm);
      toast.success('Credenciales guardadas');
    } catch (err) { toast.error(err.response?.data?.error || 'Error al guardar'); }
    finally { setSaving(false); }
  };

  const tabs = [
    { id: 'perfil', label: '👤 Perfil' },
    { id: 'seguridad', label: '🔒 Seguridad' },
    { id: 'notificaciones', label: '🔔 Notificaciones' },
    { id: 'pasarelas', label: '💳 Pasarelas' },
  ];

  return (
    <div className="fade-in">
      <h1 className="text-xl font-bold mb-6">Configuración</h1>
      <div className="grid grid-cols-4 gap-5">
        <div className="col-span-1 flex flex-col gap-1">
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className="text-left px-3 py-2.5 rounded-lg text-sm font-medium transition-all"
              style={tab === t.id ? { backgroundColor: primaryColor, color: '#fff' } : { background: 'rgba(255,255,255,0.04)', opacity: 0.6 }}>
              {t.label}
            </button>
          ))}
        </div>

        <div className="col-span-3 rounded-xl p-5" style={{ background: '#1a1a1a' }}>
          {tab === 'perfil' && (
            <div>
              <h3 className="font-bold mb-4">Información del Perfil</h3>
              <div className="flex items-center gap-4 mb-5">
                <div className="w-14 h-14 rounded-full flex items-center justify-center text-white font-black text-xl" style={{ backgroundColor: primaryColor }}>
                  {user?.name?.charAt(0)?.toUpperCase()}
                </div>
                <div>
                  <p className="font-bold">{user?.name}</p>
                  <span className="px-2 py-0.5 rounded-full text-xs font-medium" style={{ backgroundColor: `${primaryColor}30`, color: primaryColor }}>admin</span>
                  <p className="text-xs opacity-40 mt-0.5">{gym?.name}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Nombre"><input className="input-field" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></Field>
                <Field label="Cédula"><input className="input-field" value={user?.cedula} disabled /></Field>
                <Field label="Email"><input className="input-field" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></Field>
                <Field label="Teléfono"><input className="input-field" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} /></Field>
              </div>
              <div className="flex justify-end mt-4">
                <button onClick={async () => {
                  try {
                    await api.put('/admin/profile', { name: form.name, email: form.email, phone: form.phone });
                    updateUser({ name: form.name, email: form.email, phone: form.phone });
                    toast.success('Perfil actualizado');
                  } catch { toast.error('Error al guardar'); }
                }} className="btn-primary text-sm px-6" style={{ backgroundColor: primaryColor }}>
                  Guardar Cambios
                </button>
              </div>
            </div>
          )}

          {tab === 'seguridad' && (
            <div>
              <h3 className="font-bold mb-4">Cambiar Contraseña</h3>
              <div className="flex flex-col gap-4">
                <Field label="Contraseña Actual"><input className="input-field" type="password" value={passForm.currentPassword} onChange={e => setPassForm({ ...passForm, currentPassword: e.target.value })} /></Field>
                <Field label="Nueva Contraseña"><input className="input-field" type="password" value={passForm.newPassword} onChange={e => setPassForm({ ...passForm, newPassword: e.target.value })} /></Field>
                <Field label="Confirmar Nueva Contraseña"><input className="input-field" type="password" value={passForm.confirmPassword} onChange={e => setPassForm({ ...passForm, confirmPassword: e.target.value })} /></Field>
                <button onClick={handleChangePassword} disabled={saving} className="btn-primary text-sm self-start px-6 flex items-center gap-2" style={{ backgroundColor: primaryColor }}>
                  {saving && <Spinner size={14} className="text-white" />} Cambiar Contraseña
                </button>
              </div>
            </div>
          )}

          {tab === 'notificaciones' && (
            <div>
              <h3 className="font-bold mb-4">Preferencias de Notificaciones</h3>
              <div className="flex flex-col gap-3">
                {['Notificar nuevos pagos', 'Notificar membresías por vencer', 'Resumen diario por email', 'Alertas de sistema'].map((item, i) => (
                  <label key={item} className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" defaultChecked={i !== 2} className="w-4 h-4" style={{ accentColor: primaryColor }} />
                    <span className="text-sm">{item}</span>
                  </label>
                ))}
              </div>
              <button className="btn-primary text-sm mt-5 px-6" style={{ backgroundColor: primaryColor }}>Guardar Preferencias</button>
            </div>
          )}

          {tab === 'pasarelas' && (
            <div>
              <h3 className="font-bold mb-1">PayPhone</h3>
              <p className="text-xs opacity-50 mb-4">Configura las credenciales para cobrar membresías desde la app de usuario.</p>
              {!gym?.payphoneEnabled && (
                <div className="p-3 rounded-xl mb-4 text-xs" style={{ background: 'rgba(234,179,8,0.1)', border: '1px solid rgba(234,179,8,0.3)', color: '#fbbf24' }}>
                  ⚠ PayPhone está deshabilitado. Solicita al super admin habilitarlo.
                </div>
              )}
              <div className="flex flex-col gap-4">
                <Field label="Store ID"><input className="input-field" placeholder="Tu Store ID de PayPhone" value={payphoneForm.storeId} onChange={e => setPayphoneForm({ ...payphoneForm, storeId: e.target.value })} /></Field>
                <Field label="Token"><input className="input-field" type="password" placeholder="Tu Token de PayPhone" value={payphoneForm.token} onChange={e => setPayphoneForm({ ...payphoneForm, token: e.target.value })} /></Field>
                <button onClick={handleSavePayphone} disabled={saving} className="btn-primary text-sm self-start px-6 flex items-center gap-2" style={{ backgroundColor: primaryColor }}>
                  {saving && <Spinner size={14} className="text-white" />} Guardar credenciales
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}