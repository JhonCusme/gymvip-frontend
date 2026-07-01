import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminAPI } from '../../api';
import { PageHeader, SearchInput, Modal, Field, Spinner, EmptyState, ConfirmDialog } from '../../components/ui';
import { Plus, Eye, Edit2, Trash2, CreditCard, Key, Users } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';

const EMPTY_USER = { cedula: '', name: '', email: '', phone: '', birthDate: '',
  emergencyContactName: '', emergencyContactPhone: '', password: '', confirmPassword: '', role: 'user' };

const EMPTY_MEM = { membershipTypeId: '', method: 'efectivo', amount: '', notes: '', startDate: '' };

export default function AdminUsersPage() {
  const { gym } = useAuth();
  const primaryColor = gym?.primaryColor || '#E85D04';
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [showCreate, setShowCreate] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [showMem, setShowMem] = useState(null); // user
  const [memTypes, setMemTypes] = useState([]);
  const [form, setForm] = useState(EMPTY_USER);
  const [memForm, setMemForm] = useState(EMPTY_MEM);
  const [saving, setSaving] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showDetail, setShowDetail] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminAPI.getUsers({ search, page, limit: 50 });
      setUsers(res.data.users);
      setTotal(res.data.total);
    } catch { toast.error('Error al cargar usuarios'); }
    finally { setLoading(false); }
  }, [search, page]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    adminAPI.getMembershipTypes().then(res => setMemTypes(res.data)).catch(() => {});
  }, []);

  const handleCreate = async () => {
  if (!form.cedula || !form.name) return toast.error('Cédula y nombre son requeridos');
  if (!editUser && !form.password) return toast.error('Contraseña es requerida');
  if (form.password && form.password !== form.confirmPassword) return toast.error('Las contraseñas no coinciden');
  setSaving(true);
  try {
    if (editUser) {
      await adminAPI.updateUser(editUser.id, {
        name: form.name, email: form.email, phone: form.phone,
        birthDate: form.birthDate, emergencyContactName: form.emergencyContactName,
        emergencyContactPhone: form.emergencyContactPhone
      });
      toast.success('Usuario actualizado exitosamente');
    } else {
      await adminAPI.createUser(form);
      toast.success('Usuario creado exitosamente');
    }
    setShowCreate(false);
    setEditUser(null);
    setForm(EMPTY_USER);
    load();
  } catch (err) { toast.error(err.response?.data?.error || 'Error al guardar usuario'); }
  finally { setSaving(false); }
};

  const handleActivateMem = async () => {
    if (!memForm.membershipTypeId) return toast.error('Selecciona un tipo de membresía');
    setSaving(true);
    try {
      const type = memTypes.find(t => t.id === memForm.membershipTypeId);
      await adminAPI.activateMembership(showMem.id, {
        ...memForm,
        amount: memForm.amount || type?.price,
        startDate: memForm.startDate || null
      });
      toast.success('Membresía activada exitosamente');
      setShowMem(null);
      setMemForm(EMPTY_MEM);
      load();
    } catch (err) { toast.error(err.response?.data?.error || 'Error al activar membresía'); }
    finally { setSaving(false); }
  };

  const openDetail = async (user) => {
    try {
      const res = await adminAPI.getUser(user.id);
      setSelectedUser(res.data);
      setShowDetail(true);
    } catch { toast.error('Error al cargar usuario'); }
  };

  const membershipBadge = (status) => {
    if (status === 'active') return <span className="badge-active">Activo</span>;
    return <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-500/20 text-gray-400">Sin membresía</span>;
  };
 
  const handleDeleteUser = async (userId) => {
    if (!window.confirm('¿Eliminar este usuario?')) return;
    try {
      await adminAPI.updateUser(userId, { isActive: false });
      toast.success('Usuario desactivado');
      load();
    } catch { toast.error('Error al eliminar usuario'); }
  };

  return (
    <div className="fade-in">
      <PageHeader
        title="Usuarios"
        action={
          <button onClick={() => { setForm(EMPTY_USER); setShowCreate(true); }}
            className="btn-primary flex items-center gap-2 text-sm"
            style={{ backgroundColor: primaryColor }}>
            <Plus size={15} /> Nuevo Usuario
          </button>
        }
      />

      <SearchInput value={search} onChange={(v) => { setSearch(v); setPage(1); }}
        placeholder="Buscar por nombre, cédula o email..." />

      <div className="mt-4 rounded-xl overflow-hidden" style={{ background: '#1a1a1a' }}>
        {loading ? (
          <div className="flex justify-center py-16"><Spinner size={28} className="opacity-30" /></div>
        ) : users.length === 0 ? (
          <EmptyState icon={Users} title="No hay usuarios" subtitle="Crea el primer usuario del gimnasio" />
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Cédula</th><th>Nombre</th><th>Email</th>
                <th>Teléfono</th><th>Rol</th><th>Membresía</th>
                <th>Estado</th><th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-white/3 transition-colors">
                  <td className="font-mono text-xs opacity-70">{u.cedula}</td>
                  <td className="font-semibold">{u.name}</td>
                  <td className="text-xs opacity-60">{u.email || '—'}</td>
                  <td className="text-xs opacity-60">{u.phone || '—'}</td>
                  <td>
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium border border-white/20 opacity-60">{u.role}</span>
                  </td>
                  <td>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      u.membership_status === 'active' ? 'bg-green-500/20 text-green-400' : 'bg-white/10 text-white/40'
                    }`}>
                      {u.membership_name || 'Sin membresía'}
                    </span>
                  </td>
                  <td>
                    <span className={u.is_active ? 'badge-active' : 'badge-inactive'}>
                      {u.is_active ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td>
                    <div className="flex items-center gap-1">
                      <button onClick={() => openDetail(u)} title="Ver detalle"
                        className="p-1.5 rounded-lg opacity-40 hover:opacity-100 hover:bg-white/10 transition-all">
                        <Eye size={14} />
                      </button>
                      <button onClick={async () => {
    try {
      const res = await adminAPI.getUser(u.id);
      const usr = res.data.user;
      setForm({ 
        cedula: usr.cedula, name: usr.name, email: usr.email || '', 
        phone: usr.phone || '', birthDate: usr.birth_date ? usr.birth_date.split('T')[0] : '', 
        emergencyContactName: usr.emergency_contact_name || '', 
        emergencyContactPhone: usr.emergency_contact_phone || '', 
        password: '', confirmPassword: '', role: 'user' 
      });
      setEditUser(usr);
      setShowCreate(true);
    } catch { toast.error('Error al cargar usuario'); }
  }}
  title="Editar"
  className="p-1.5 rounded-lg opacity-40 hover:opacity-100 hover:bg-white/10 transition-all">
  <Edit2 size={14} />
</button>
                      <button onClick={() => { setShowMem(u); setMemForm(EMPTY_MEM); }}
                        title="Activar membresía"
                        className="p-1.5 rounded-lg opacity-40 hover:opacity-100 hover:bg-white/10 transition-all">
                        <CreditCard size={14} />
                      </button>
                     <button title="Resetear contraseña"
                        className="p-1.5 rounded-lg opacity-40 hover:opacity-100 hover:bg-white/10 transition-all">
                        <Key size={14} />
                      </button>
                      <button onClick={() => handleDeleteUser(u.id)} title="Eliminar usuario"
                        className="p-1.5 rounded-lg opacity-40 hover:opacity-100 hover:bg-red-500/20 hover:text-red-400 transition-all">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Paginación */}
      {total > 50 && (
        <div className="flex justify-center gap-2 mt-4">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
            className="px-3 py-1.5 rounded-lg text-sm opacity-50 hover:opacity-100 disabled:opacity-20 transition-all"
            style={{ background: '#1a1a1a' }}>← Anterior</button>
          <span className="px-3 py-1.5 text-sm opacity-50">Pág {page}</span>
          <button onClick={() => setPage(p => p + 1)} disabled={users.length < 50}
            className="px-3 py-1.5 rounded-lg text-sm opacity-50 hover:opacity-100 disabled:opacity-20 transition-all"
            style={{ background: '#1a1a1a' }}>Siguiente →</button>
        </div>
      )}

      {/* Modal Crear Usuario */}
        <Modal open={showCreate} onClose={() => { setShowCreate(false); setEditUser(null); setForm(EMPTY_USER); }} title={editUser ? 'Editar Usuario' : 'Nuevo Usuario'} maxWidth="max-w-lg">
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
            <button onClick={handleCreate} disabled={saving}
              className="btn-primary flex-1 text-sm flex items-center justify-center gap-2"
              style={{ backgroundColor: primaryColor }}>
              {saving && <Spinner size={14} className="text-white" />}
              {editUser ? 'Guardar Cambios' : 'Crear Usuario'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal Activar Membresía */}
      <Modal open={!!showMem} onClose={() => setShowMem(null)} title="Activar Suscripción">
        {showMem && (
          <div className="flex flex-col gap-4">
            <div className="p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.05)' }}>
              <p className="text-xs opacity-50">Cliente</p>
              <p className="font-bold">{showMem.name}</p>
              <p className="text-xs opacity-40">Cédula: {showMem.cedula}</p>
            </div>
            <Field label="Tipo de Membresía" required>
              <select className="input-field" value={memForm.membershipTypeId}
                onChange={e => {
                  const type = memTypes.find(t => t.id === e.target.value);
                  setMemForm({ ...memForm, membershipTypeId: e.target.value, amount: type?.price || '' });
                }}>
                <option value="">Seleccionar tipo</option>
                {memTypes.filter(t => t.is_active).map(t => (
                  <option key={t.id} value={t.id}>
                    {t.name} - ${t.price} ({t.duration_value} {t.duration_unit})
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Método de Pago" required>
              <select className="input-field" value={memForm.method}
                onChange={e => setMemForm({ ...memForm, method: e.target.value })}>
                <option value="efectivo">Efectivo</option>
                <option value="transferencia">Transferencia</option>
                <option value="tarjeta">Tarjeta</option>
                <option value="payphone">PayPhone</option>
              </select>
            </Field>
            <Field label="Monto Recibido ($)" required>
              <input className="input-field" type="number" step="0.01" value={memForm.amount}
                onChange={e => setMemForm({ ...memForm, amount: e.target.value })} />
            </Field>
            <Field label="Notas (opcional)">
              <textarea className="input-field" rows={2} placeholder="Observaciones adicionales..."
                value={memForm.notes} onChange={e => setMemForm({ ...memForm, notes: e.target.value })} />
            </Field>
           <Field label="Fecha de inicio (opcional)">
              <input className="input-field" type="date" value={memForm.startDate}
                onChange={e => setMemForm({ ...memForm, startDate: e.target.value })}
                placeholder="Dejar vacío para usar fecha de hoy" />
            </Field>
            <div className="flex gap-3">
              <button onClick={() => setShowMem(null)} className="btn-secondary flex-1 text-sm">Cancelar</button>
              <button onClick={handleActivateMem} disabled={saving}
                className="btn-primary flex-1 text-sm flex items-center justify-center gap-2"
                style={{ backgroundColor: primaryColor }}>
                {saving && <Spinner size={14} className="text-white" />}
                Activar Suscripción
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal Detalle Usuario */}
      <Modal open={showDetail} onClose={() => setShowDetail(false)} title="Detalle de Usuario" maxWidth="max-w-lg">
        {selectedUser && (
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3 p-4 rounded-xl" style={{ background: 'rgba(255,255,255,0.05)' }}>
              <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-black text-xl"
                style={{ backgroundColor: primaryColor }}>
                {selectedUser.user.name?.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="font-bold text-lg">{selectedUser.user.name}</p>
                <p className="text-xs opacity-50">Cédula: {selectedUser.user.cedula}</p>
                {selectedUser.user.email && <p className="text-xs opacity-50">✉ {selectedUser.user.email}</p>}
                {selectedUser.user.phone && <p className="text-xs opacity-50">📱 {selectedUser.user.phone}</p>}
                <p className="text-xs opacity-30">Registrado: {new Date(selectedUser.user.created_at).toLocaleDateString('es-EC')}</p>
                <div className="flex gap-1 mt-1">
                  <span className={selectedUser.user.is_active ? 'badge-active' : 'badge-inactive'}>
                    {selectedUser.user.is_active ? 'Activo' : 'Inactivo'}
                  </span>
                  <span className="badge-info">user</span>
                </div>
              </div>
            </div>

            {/* Membresías */}
            <div>
              <p className="text-xs font-bold opacity-50 uppercase mb-2">Membresías</p>
              {selectedUser.memberships?.length === 0 ? (
                <p className="text-xs opacity-30">Sin membresías</p>
              ) : selectedUser.memberships?.map(m => (
                <div key={m.id} className="flex items-center justify-between p-2.5 rounded-lg mb-1"
                  style={{ background: 'rgba(255,255,255,0.04)' }}>
                  <p className="text-sm font-semibold">{m.type_name}</p>
                  <div className="text-right">
                    <span className={m.status === 'active' && new Date(m.end_date) >= new Date()
                      ? 'badge-active' : 'badge-inactive'}>
                      {m.status === 'active' && new Date(m.end_date) >= new Date() ? 'active' : 'expired'}
                    </span>
                    <p className="text-xs opacity-40 mt-0.5">
                      {new Date(m.start_date).toLocaleDateString('es-EC')} — {new Date(m.end_date).toLocaleDateString('es-EC')}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Reservas recientes */}
            <div>
              <p className="text-xs font-bold opacity-50 uppercase mb-2">Reservas Recientes</p>
              {selectedUser.recentBookings?.length === 0 ? (
                <p className="text-xs opacity-30">Sin reservas</p>
              ) : selectedUser.recentBookings?.map(b => (
                <div key={b.id} className="flex items-center justify-between p-2 rounded-lg mb-1"
                  style={{ background: 'rgba(255,255,255,0.04)' }}>
                  <p className="text-xs font-medium">{b.session_name}</p>
                  <p className="text-xs opacity-40">
                    {new Date(b.class_date).toLocaleDateString('es-EC')} {b.start_time?.slice(0,5)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
