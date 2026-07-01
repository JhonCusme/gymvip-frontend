import { useState, useEffect } from 'react';
import { adminAPI, uploadAPI } from '../../api';
import { PageHeader, Modal, Field, Spinner, EmptyState, ConfirmDialog } from '../../components/ui';
import { Plus, Edit2, Trash2, Clock, Users, Key } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';

// ============================================================
// SESIONES
// ============================================================
const EMPTY_SESSION = { name: '', description: '', maxCapacity: 20, durationMinutes: 60, difficulty: 'beginner', isActive: true };

export function AdminSessionsPage() {
  const { gym } = useAuth();
  const primaryColor = gym?.primaryColor || '#E85D04';
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState(EMPTY_SESSION);
  const [saving, setSaving] = useState(false);
  const [confirm, setConfirm] = useState(null);

  const load = async () => {
    setLoading(true);
    try { const r = await adminAPI.getSessions(); setSessions(r.data); }
    catch { toast.error('Error al cargar sesiones'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const open = (item = null) => {
    setEditItem(item);
    setForm(item ? {
      name: item.name, description: item.description || '', maxCapacity: item.max_capacity,
      durationMinutes: item.duration_minutes, difficulty: item.difficulty, isActive: item.is_active
    } : EMPTY_SESSION);
    setShowModal(true);
  };

  const save = async () => {
    if (!form.name) return toast.error('Nombre requerido');
    setSaving(true);
    try {
      if (editItem) await adminAPI.updateSession(editItem.id, form);
      else await adminAPI.createSession(form);
      toast.success(editItem ? 'Sesión actualizada' : 'Sesión creada');
      setShowModal(false); load();
    } catch (err) { toast.error(err.response?.data?.error || 'Error al guardar'); }
    finally { setSaving(false); }
  };

  const remove = async (id) => {
    try { await adminAPI.deleteSession(id); toast.success('Sesión eliminada'); load(); }
    catch { toast.error('Error al eliminar'); }
  };

  const difficultyColors = { beginner: 'text-green-400 bg-green-500/20', intermediate: 'text-yellow-400 bg-yellow-500/20', advanced: 'text-red-400 bg-red-500/20' };

  return (
    <div className="fade-in">
      <PageHeader title="Sesiones de Entrenamiento"
        action={<button onClick={() => open()} className="btn-primary flex items-center gap-2 text-sm" style={{ backgroundColor: primaryColor }}><Plus size={15} /> Nueva Sesión</button>} />
      {loading ? <div className="flex justify-center py-16"><Spinner size={28} className="opacity-30" /></div>
        : sessions.length === 0 ? <EmptyState icon={Clock} title="No hay sesiones" />
        : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {sessions.map(s => (
              <div key={s.id} className="rounded-xl p-4 flex flex-col gap-2" style={{ background: '#1a1a1a' }}>
                <div className="flex items-start justify-between">
                  <p className="font-bold">{s.name}</p>
                  <div className="flex gap-1">
                    <button onClick={() => open(s)} className="p-1.5 rounded-lg opacity-40 hover:opacity-100 hover:bg-white/10 transition-all"><Edit2 size={13} /></button>
                    <button onClick={() => setConfirm(s)} className="p-1.5 rounded-lg opacity-40 hover:opacity-100 hover:bg-red-500/20 hover:text-red-400 transition-all"><Trash2 size={13} /></button>
                  </div>
                </div>
                <p className="text-xs opacity-50">Capacidad: {s.max_capacity} personas</p>
                <p className="text-xs opacity-50">Duración: {s.duration_minutes} minutos</p>
                <div className="flex gap-2 mt-1">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${difficultyColors[s.difficulty]}`}>{s.difficulty}</span>
                  <span className={s.is_active ? 'badge-active' : 'badge-inactive'}>{s.is_active ? 'Activo' : 'Inactivo'}</span>
                </div>
              </div>
            ))}
          </div>
        )}

      <Modal open={showModal} onClose={() => setShowModal(false)} title={editItem ? 'Editar Sesión' : 'Nueva Sesión'}>
        <div className="flex flex-col gap-4">
          <Field label="Nombre" required><input className="input-field" placeholder="Ej: CrossFit WOD" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></Field>
          <Field label="Descripción"><textarea className="input-field" rows={2} placeholder="Describe la sesión..." value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Capacidad máxima"><input className="input-field" type="number" min={1} value={form.maxCapacity} onChange={e => setForm({ ...form, maxCapacity: parseInt(e.target.value) })} /></Field>
            <Field label="Duración (min)"><input className="input-field" type="number" min={1} value={form.durationMinutes} onChange={e => setForm({ ...form, durationMinutes: parseInt(e.target.value) })} /></Field>
          </div>
          <Field label="Dificultad">
            <select className="input-field" value={form.difficulty} onChange={e => setForm({ ...form, difficulty: e.target.value })}>
              <option value="beginner">Principiante</option>
              <option value="intermediate">Intermedio</option>
              <option value="advanced">Avanzado</option>
            </select>
          </Field>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input type="checkbox" checked={form.isActive} onChange={e => setForm({ ...form, isActive: e.target.checked })} className="w-4 h-4" />
            Activo
          </label>
          <div className="flex gap-3">
            <button onClick={() => setShowModal(false)} className="btn-secondary flex-1 text-sm">Cancelar</button>
            <button onClick={save} disabled={saving} className="btn-primary flex-1 text-sm flex items-center justify-center gap-2" style={{ backgroundColor: primaryColor }}>
              {saving && <Spinner size={14} className="text-white" />}Crear
            </button>
          </div>
        </div>
      </Modal>
      <ConfirmDialog open={!!confirm} onClose={() => setConfirm(null)} onConfirm={() => remove(confirm?.id)}
        title="Eliminar sesión" message={`¿Eliminar la sesión "${confirm?.name}"?`} danger />
    </div>
  );
}

// ============================================================
// HORARIOS
// ============================================================
const DAYS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
const EMPTY_SCHEDULE = { sessionId: '', instructorId: '', dayOfWeek: 1, startTime: '06:00', endTime: '07:00' };

export function AdminSchedulesPage() {
  const { gym } = useAuth();
  const primaryColor = gym?.primaryColor || '#E85D04';
  const [schedules, setSchedules] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [instructors, setInstructors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(EMPTY_SCHEDULE);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [sch, ses, ins] = await Promise.all([adminAPI.getSchedules(), adminAPI.getSessions(), adminAPI.getInstructors()]);
      setSchedules(sch.data); setSessions(ses.data); setInstructors(ins.data);
    } catch { toast.error('Error al cargar horarios'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!form.sessionId) return toast.error('Selecciona una sesión');
    setSaving(true);
    try {
      await adminAPI.createSchedule(form);
      toast.success('Horario creado'); setShowModal(false); load();
    } catch (err) { toast.error(err.response?.data?.error || 'Error al guardar'); }
    finally { setSaving(false); }
  };

  const remove = async (id) => {
    try { await adminAPI.deleteSchedule(id); toast.success('Horario eliminado'); load(); }
    catch { toast.error('Error al eliminar'); }
  };

  // Agrupar por día
  const byDay = DAYS.map((day, idx) => ({
    day, idx,
    schedules: schedules.filter(s => s.day_of_week === idx).sort((a, b) => a.start_time.localeCompare(b.start_time))
  }));

  return (
    <div className="fade-in">
      <PageHeader title="Horarios"
        action={<button onClick={() => { setForm(EMPTY_SCHEDULE); setShowModal(true); }} className="btn-primary flex items-center gap-2 text-sm" style={{ backgroundColor: primaryColor }}><Plus size={15} /> Nuevo Horario</button>} />

      {loading ? <div className="flex justify-center py-16"><Spinner size={28} className="opacity-30" /></div> : (
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          {byDay.map(({ day, idx, schedules: dayScheds }) => (
            <div key={idx} className="rounded-xl p-4" style={{ background: '#1a1a1a' }}>
              <p className="font-bold mb-3 text-sm" style={{ color: dayScheds.length > 0 ? primaryColor : undefined }}>{day}</p>
              {dayScheds.length === 0 ? (
                <p className="text-xs opacity-30 text-center py-4">Sin horarios</p>
              ) : dayScheds.map(s => (
                <div key={s.id} className="flex items-start justify-between p-2 rounded-lg mb-1.5" style={{ background: 'rgba(255,255,255,0.04)' }}>
                  <div>
                    <p className="text-xs font-semibold">{s.session_name}</p>
                    <p className="text-xs opacity-50">{s.start_time?.slice(0,5)} - {s.end_time?.slice(0,5)}</p>
                    {s.instructor_name && <p className="text-xs opacity-40">Instructor: {s.instructor_name}</p>}
                  </div>
                  <button onClick={() => remove(s.id)} className="p-1 rounded opacity-30 hover:opacity-100 hover:text-red-400 transition-all"><Trash2 size={12} /></button>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      <Modal open={showModal} onClose={() => setShowModal(false)} title="Nuevo Horario">
        <div className="flex flex-col gap-4">
          <Field label="Sesión" required>
            <select className="input-field" value={form.sessionId} onChange={e => setForm({ ...form, sessionId: e.target.value })}>
              <option value="">Seleccionar sesión</option>
              {sessions.filter(s => s.is_active).map(s => <option key={s.id} value={s.id}>{s.name} ({s.duration_minutes} min)</option>)}
            </select>
          </Field>
          <Field label="Instructor">
            <select className="input-field" value={form.instructorId} onChange={e => setForm({ ...form, instructorId: e.target.value })}>
              <option value="">Sin instructor asignado</option>
              {instructors.filter(i => i.is_active).map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
            </select>
          </Field>
          <Field label="Día de la semana" required>
            <select className="input-field" value={form.dayOfWeek} onChange={e => setForm({ ...form, dayOfWeek: parseInt(e.target.value) })}>
              {DAYS.map((d, i) => <option key={i} value={i}>{d}</option>)}
            </select>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Hora inicio"><input className="input-field" type="time" value={form.startTime} onChange={e => setForm({ ...form, startTime: e.target.value })} /></Field>
            <Field label="Hora fin"><input className="input-field" type="time" value={form.endTime} onChange={e => setForm({ ...form, endTime: e.target.value })} /></Field>
          </div>
          <div className="flex gap-3">
            <button onClick={() => setShowModal(false)} className="btn-secondary flex-1 text-sm">Cancelar</button>
            <button onClick={save} disabled={saving} className="btn-primary flex-1 text-sm flex items-center justify-center gap-2" style={{ backgroundColor: primaryColor }}>
              {saving && <Spinner size={14} className="text-white" />}Crear
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

// ============================================================
// INSTRUCTORES
// ============================================================
const EMPTY_INSTR = { name: '', photoUrl: '', specialization: '', phone: '', cedula: '', password: '', bio: '', isActive: true };

export function AdminInstructorsPage() {
  const { gym } = useAuth();
  const primaryColor = gym?.primaryColor || '#E85D04';
  const [instructors, setInstructors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(EMPTY_INSTR);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try { const r = await adminAPI.getInstructors(); setInstructors(r.data); }
    catch { toast.error('Error al cargar instructores'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!form.name) return toast.error('Nombre requerido');
    setSaving(true);
    try {
      await adminAPI.createInstructor(form);
      toast.success('Instructor creado'); setShowModal(false); load();
    } catch (err) { toast.error(err.response?.data?.error || 'Error al guardar'); }
    finally { setSaving(false); }
  };

  const handleDeleteInstructor = async (id) => {
    if (!window.confirm('¿Desactivar este instructor?')) return;
    try {
      await adminAPI.deleteInstructor(id);
      toast.success('Instructor desactivado');
      load();
    } catch { toast.error('Error al desactivar'); }
  };

  return (
    <div className="fade-in">
      <PageHeader title="Instructores"
        action={<button onClick={() => { setForm(EMPTY_INSTR); setShowModal(true); }} className="btn-primary flex items-center gap-2 text-sm" style={{ backgroundColor: primaryColor }}><Plus size={15} /> Nuevo Instructor</button>} />

      {loading ? <div className="flex justify-center py-16"><Spinner size={28} className="opacity-30" /></div>
        : instructors.length === 0 ? <EmptyState icon={Users} title="No hay instructores" />
        : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {instructors.map(i => (
              <div key={i.id} className="rounded-xl p-4 flex items-center gap-3" style={{ background: '#1a1a1a' }}>
                <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0 overflow-hidden">
                  {i.photo_url ? <img src={i.photo_url} alt="" className="w-full h-full object-cover" />
                    : <span className="font-bold text-lg opacity-50">{i.name?.charAt(0)}</span>}
                </div>
                <div className="min-w-0">
                  <p className="font-bold">{i.name}</p>
                  <p className="text-xs opacity-50">{i.specialization || '—'}</p>
                  <p className="text-xs opacity-40">{i.phone}</p>
                  <p className="text-xs opacity-30">{i.schedule_count} horarios asignados</p>
                </div>
               <div className="ml-auto flex-shrink-0 flex items-center gap-1">
                  <span className={i.is_active ? 'badge-active' : 'badge-inactive'}>
                    {i.is_active ? 'Activo' : 'Inactivo'}
                  </span>
                  <button onClick={() => handleDeleteInstructor(i.id)}
                    className="p-1.5 rounded-lg opacity-40 hover:opacity-100 hover:bg-red-500/20 hover:text-red-400 transition-all">
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

      <Modal open={showModal} onClose={() => setShowModal(false)} title="Nuevo Instructor" maxWidth="max-w-lg">
        <div className="flex flex-col gap-4">
          <div className="flex justify-center">
            <label className="cursor-pointer">
              <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center text-3xl hover:opacity-60 transition-opacity overflow-hidden relative">
                {form.photoUrl
                  ? <img src={form.photoUrl} alt="" className="w-full h-full object-cover" />
                  : <span className="opacity-30">👤</span>
                }
                <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 hover:opacity-100 transition-opacity rounded-full">
                  <span className="text-xs text-white">📁</span>
                </div>
              </div>
              <input type="file" accept="image/*" className="hidden"
                onChange={async (e) => {
                  const file = e.target.files[0];
                  if (!file) return;
                  if (file.size > 2 * 1024 * 1024) return toast.error('La imagen no puede superar 2MB');
                  try {
                    const res = await uploadAPI.uploadInstructorPhoto(file);
                    setForm({ ...form, photoUrl: res.data.url });
                    toast.success('Foto subida exitosamente');
                  } catch { toast.error('Error al subir la foto'); }
                }} />
            </label>
          </div>
          <p className="text-center text-xs opacity-30">Clic para subir foto</p>
          <Field label="Nombre" required><input className="input-field" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></Field>
          <Field label="Especialización"><input className="input-field" placeholder="Ej: CrossFit Level 2, Olympic Lifting" value={form.specialization} onChange={e => setForm({ ...form, specialization: e.target.value })} /></Field>
          <Field label="Teléfono"><input className="input-field" placeholder="Ej: 0991234567" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} /></Field>
          <Field label="Cédula / Usuario (Acceso)"><input className="input-field" placeholder="Ej: 0999999999" value={form.cedula} onChange={e => setForm({ ...form, cedula: e.target.value })} /></Field>
          <Field label="Contraseña de Acceso"><input className="input-field" type="password" placeholder="Contraseña de acceso" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} /></Field>
          <Field label="Biografía"><textarea className="input-field" rows={2} placeholder="Breve descripción del instructor..." value={form.bio} onChange={e => setForm({ ...form, bio: e.target.value })} /></Field>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input type="checkbox" checked={form.isActive} onChange={e => setForm({ ...form, isActive: e.target.checked })} className="w-4 h-4" />
            Instructor activo
          </label>
          <div className="flex gap-3">
            <button onClick={() => setShowModal(false)} className="btn-secondary flex-1 text-sm">Cancelar</button>
            <button onClick={save} disabled={saving} className="btn-primary flex-1 text-sm flex items-center justify-center gap-2" style={{ backgroundColor: primaryColor }}>
              {saving && <Spinner size={14} className="text-white" />}Crear
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

// ============================================================
// RECEPCIONISTAS
// ============================================================
const EMPTY_RECEP = { cedula: '', name: '', email: '', phone: '', password: '' };

export function AdminReceptionistsPage() {
  const { gym } = useAuth();
  const primaryColor = gym?.primaryColor || '#E85D04';
  const [receptionists, setReceptionists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(EMPTY_RECEP);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try { const r = await adminAPI.getReceptionists(); setReceptionists(r.data); }
    catch { toast.error('Error al cargar recepcionistas'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!form.cedula || !form.name || !form.password) return toast.error('Cédula, nombre y contraseña requeridos');
    setSaving(true);
    try {
      await adminAPI.createReceptionist(form);
      toast.success('Recepcionista creado'); setShowModal(false); setForm(EMPTY_RECEP); load();
    } catch (err) { toast.error(err.response?.data?.error || 'Error al crear'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (userId) => {
    if (!window.confirm('¿Desactivar este recepcionista?')) return;
    try {
      await adminAPI.updateUser(userId, { isActive: false });
      toast.success('Recepcionista desactivado');
      load();
    } catch { toast.error('Error al desactivar'); }
  };

  return (
    <div className="fade-in">
      <PageHeader title="Recepcionistas"
        action={<button onClick={() => { setForm(EMPTY_RECEP); setShowModal(true); }} className="btn-primary flex items-center gap-2 text-sm" style={{ backgroundColor: primaryColor }}><Plus size={15} /> Nuevo Recepcionista</button>} />

      <div className="rounded-xl overflow-hidden mt-2" style={{ background: '#1a1a1a' }}>
        {loading ? <div className="flex justify-center py-16"><Spinner size={28} className="opacity-30" /></div>
          : receptionists.length === 0 ? <EmptyState icon={Users} title="No hay recepcionistas" />
          : (
            <table className="data-table">
              <thead><tr><th>Cédula</th><th>Nombre</th><th>Email</th><th>Teléfono</th><th>Estado</th><th>Acciones</th></tr></thead>
              <tbody>
                {receptionists.map(r => (
                  <tr key={r.id} className="hover:bg-white/3 transition-colors">
                    <td className="font-mono text-xs opacity-70">{r.cedula}</td>
                    <td className="font-semibold">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-xs font-bold">{r.name?.charAt(0)}</div>
                        {r.name}
                      </div>
                    </td>
                    <td className="text-xs opacity-60">{r.email || '—'}</td>
                    <td className="text-xs opacity-60">{r.phone || '—'}</td>
                    <td><span className={r.is_active ? 'badge-active' : 'badge-inactive'}>{r.is_active ? 'Activo' : 'Inactivo'}</span></td>
                    <td><div className="flex gap-1">
                      <button onClick={() => handleDelete(r.id)} title="Desactivar recepcionista"
                        className="p-1.5 rounded-lg opacity-40 hover:opacity-100 hover:bg-red-500/20 hover:text-red-400 transition-all"><Trash2 size={13} /></button>
                    </div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
      </div>

      <Modal open={showModal} onClose={() => setShowModal(false)} title="Nuevo Recepcionista">
        <div className="flex flex-col gap-4">
          <Field label="Cédula" required><input className="input-field" placeholder="Ej: 1712345678" value={form.cedula} onChange={e => setForm({ ...form, cedula: e.target.value })} /></Field>
          <Field label="Nombre completo" required><input className="input-field" placeholder="Ej: María López" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></Field>
          <Field label="Email"><input className="input-field" type="email" placeholder="Ej: recep@crossfit.com" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></Field>
          <Field label="Teléfono"><input className="input-field" placeholder="Ej: 0991234567" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} /></Field>
          <Field label="Contraseña" required><input className="input-field" type="password" placeholder="Mínimo 6 caracteres" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} /></Field>
          <div className="flex gap-3">
            <button onClick={() => setShowModal(false)} className="btn-secondary flex-1 text-sm">Cancelar</button>
            <button onClick={save} disabled={saving} className="btn-primary flex-1 text-sm flex items-center justify-center gap-2" style={{ backgroundColor: primaryColor }}>
              {saving && <Spinner size={14} className="text-white" />}Crear recepcionista
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

