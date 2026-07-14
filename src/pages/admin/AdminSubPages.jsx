import { useState, useEffect } from 'react';
import { adminAPI, uploadAPI } from '../../api';
import { PageHeader, Modal, Field, Spinner, EmptyState, ConfirmDialog } from '../../components/ui';
import { Plus, Edit2, Trash2, Clock, Users, Key, CreditCard } from 'lucide-react';
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
const EMPTY_INSTR = { name: '', photoUrl: '', specialization: '', phone: '', cedula: '', password: '', bio: '', isActive: true, isHeadCoach: false };

export function AdminInstructorsPage() {
  const { gym } = useAuth();
  const primaryColor = gym?.primaryColor || '#E85D04';
  const [instructors, setInstructors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editInstructor, setEditInstructor] = useState(null);
  const [form, setForm] = useState(EMPTY_INSTR);
  const [saving, setSaving] = useState(false);
  const [showResetPass, setShowResetPass] = useState(null);
const [newPassword, setNewPassword] = useState('');
const [showMemInstructor, setShowMemInstructor] = useState(null);
const [memTypes, setMemTypes] = useState([]);
const [memForm, setMemForm] = useState({ membershipTypeId: '', method: 'cortesia' });
const [savingMem, setSavingMem] = useState(false);

  const load = async () => {
    setLoading(true);
    try { const r = await adminAPI.getInstructors(); setInstructors(r.data); }
    catch { toast.error('Error al cargar instructores'); }
    finally { setLoading(false); }
  };

  useEffect(() => { 
    load(); 
    adminAPI.getMembershipTypes().then(r => setMemTypes(r.data)).catch(() => {});
  }, []);

 const save = async () => {
    if (!form.name) return toast.error('Nombre requerido');
    setSaving(true);
    try {
      if (editInstructor) {
        await adminAPI.updateInstructor(editInstructor.id, form);
        toast.success('Instructor actualizado');
      } else {
        await adminAPI.createInstructor(form);
        toast.success('Instructor creado');
      }
      setShowModal(false);
      setEditInstructor(null);
      setForm(EMPTY_INSTR);
      load();
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
  
  const handleToggleInstructor = async (instructor) => {
    const accion = instructor.is_active ? 'desactivar' : 'activar';
    if (!window.confirm(`¿${accion} este instructor?`)) return;
    try {
      await adminAPI.updateInstructor(instructor.id, { isActive: !instructor.is_active });
      toast.success(`Instructor ${instructor.is_active ? 'desactivado' : 'activado'}`);
      load();
    } catch { toast.error('Error al actualizar instructor'); }
  };

  const handleResetPassInstructor = async () => {
    if (!newPassword || newPassword.length < 6) return toast.error('Mínimo 6 caracteres');
    try {
      await adminAPI.resetPassword(showResetPass.user_id, { newPassword });
      toast.success('Contraseña reseteada exitosamente');
      setShowResetPass(null);
      setNewPassword('');
    } catch { toast.error('Error al resetear. El instructor puede no tener cuenta de acceso.'); }
  };

  const handleToggleUserRole = async (userId, role, hasRole) => {
    if (!userId) return toast.error('Este instructor no tiene cuenta de acceso');
    try {
      if (hasRole) {
        await adminAPI.removeRole(userId, role);
        toast.success('Rol removido');
      } else {
        await adminAPI.assignRole(userId, role);
        toast.success('Rol asignado');
      }
      load();
    } catch { toast.error('Error al actualizar rol'); }
  };

  const handleAssignMembership = async () => {
    if (!memForm.membershipTypeId) return toast.error('Selecciona un tipo de membresía');
    if (!showMemInstructor.user_id) return toast.error('Este instructor no tiene cuenta de usuario asociada');
    setSavingMem(true);
    try {
      await adminAPI.activateMembership(showMemInstructor.user_id, {
        membershipTypeId: memForm.membershipTypeId,
        method: memForm.method,
        amount: 0
      });
      toast.success('Membresía asignada exitosamente');
      setShowMemInstructor(null);
      setMemForm({ membershipTypeId: '', method: 'cortesia' });
      load();
    } catch (err) { toast.error(err.response?.data?.error || 'Error al asignar membresía'); }
    finally { setSavingMem(false); }
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
             <div key={i.id} className="rounded-xl p-4 flex flex-col gap-3" style={{ background: '#1a1a1a' }}>
                {/* Info del instructor */}
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white/10 flex-shrink-0 overflow-hidden">
                    {i.photo_url 
                      ? <img src={i.photo_url} alt="" className="w-full h-full object-cover rounded-full" />
                      : <div className="w-full h-full flex items-center justify-center"><span className="font-bold text-sm opacity-50">{i.name?.charAt(0)}</span></div>}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-bold">{i.name}</p>
                    <p className="text-xs opacity-50">{i.specialization || '—'}</p>
                    {i.phone && <p className="text-xs opacity-40">📱 {i.phone}</p>}
                    {i.cedula && <p className="text-xs opacity-40">C.I.: {i.cedula}</p>}
                    <p className="text-xs opacity-30">{i.schedule_count} horarios asignados</p>
                  </div>
                </div>

                {/* Badges de estado */}
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={i.is_active ? 'badge-active' : 'badge-inactive'}>
                    {i.is_active ? 'Activo' : 'Inactivo'}
                  </span>
                  {i.has_user_role && (
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-500/20 text-blue-400">
                      👤 Usuario
                    </span>
                  )}
                  {i.has_active_membership ? (
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-500/20 text-green-400">
                      ✓ Membresía activa
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-500/20 text-red-400">
                      Sin membresía
                    </span>
                  )}
                </div>

                {/* Botones de acción */}
                <div className="flex items-center gap-1 flex-wrap">
                  <button onClick={() => handleToggleUserRole(i.user_id, 'user', i.has_user_role)}
                    title={i.has_user_role ? 'Quitar rol usuario' : 'Dar rol usuario'}
                    className={`px-2 py-1 rounded text-xs font-medium transition-all ${i.has_user_role ? 'bg-green-500/20 text-green-400' : 'bg-white/10 opacity-50 hover:opacity-100'}`}>
                    👤 {i.has_user_role ? 'Es usuario' : '+ Usuario'}
                  </button>
                  <button onClick={() => {
                      setEditInstructor(i);
                      setForm({ name: i.name, photoUrl: i.photo_url || '', specialization: i.specialization || '', phone: i.phone || '', cedula: i.cedula || '', password: '', bio: i.bio || '', isActive: i.is_active, isHeadCoach: i.is_head_coach || false });
                      setShowModal(true);
                    }}
                    className="p-1.5 rounded-lg opacity-40 hover:opacity-100 hover:bg-white/10 transition-all">
                    <Edit2 size={13} />
                  </button>
                  <button onClick={() => { setShowMemInstructor(i); setMemForm({ membershipTypeId: '', method: 'cortesia' }); }}
                    title="Asignar membresía"
                    className="p-1.5 rounded-lg opacity-40 hover:opacity-100 hover:bg-white/10 transition-all">
                    <CreditCard size={13} />
                  </button>
                  <button onClick={() => { setShowResetPass(i); setNewPassword(''); }}
                    title="Resetear contraseña"
                    className="p-1.5 rounded-lg opacity-40 hover:opacity-100 hover:bg-white/10 transition-all">
                    <Key size={13} />
                  </button>
                  <button onClick={() => handleToggleInstructor(i)}
                    title={i.is_active ? 'Desactivar' : 'Activar'}
                    className={`p-1.5 rounded-lg opacity-40 hover:opacity-100 transition-all ${i.is_active ? 'hover:bg-red-500/20 hover:text-red-400' : 'hover:bg-green-500/20 hover:text-green-400'}`}>
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

      <Modal open={showModal} onClose={() => { setShowModal(false); setEditInstructor(null); setForm(EMPTY_INSTR); }} title={editInstructor ? 'Editar Instructor' : 'Nuevo Instructor'} maxWidth="max-w-lg">
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
          <Field label="Cédula / Usuario (Acceso)">
           <input className="input-field" placeholder="Ej: 0999999999" 
          value={form.cedula} 
          onChange={e => setForm({ ...form, cedula: e.target.value })}
           disabled={!!editInstructor?.user_id}
          />
          {editInstructor?.user_id && <p className="text-xs opacity-40 mt-1">La cédula no se puede cambiar desde aquí</p>}
          </Field>
          <Field label="Contraseña de Acceso"><input className="input-field" type="password" placeholder="Contraseña de acceso" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} /></Field>
          <Field label="Biografía"><textarea className="input-field" rows={2} placeholder="Breve descripción del instructor..." value={form.bio} onChange={e => setForm({ ...form, bio: e.target.value })} /></Field>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input type="checkbox" checked={form.isActive} onChange={e => setForm({ ...form, isActive: e.target.checked })} className="w-4 h-4" />
            Instructor activo
          </label>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input type="checkbox" checked={form.isHeadCoach} onChange={e => setForm({ ...form, isHeadCoach: e.target.checked })} className="w-4 h-4" />
            👑 Head Coach (puede crear y editar WODs)
          </label>
          <div className="flex gap-3">
            <button onClick={() => setShowModal(false)} className="btn-secondary flex-1 text-sm">Cancelar</button>
            <button onClick={save} disabled={saving} className="btn-primary flex-1 text-sm flex items-center justify-center gap-2" style={{ backgroundColor: primaryColor }}>
              {saving && <Spinner size={14} className="text-white" />}{editInstructor ? 'Guardar' : 'Crear'}
            </button>
          </div>
        </div>
      </Modal>

      <Modal open={!!showResetPass} onClose={() => setShowResetPass(null)} title="Resetear Contraseña">
        {showResetPass && (
          <div className="flex flex-col gap-4">
            <div className="p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.05)' }}>
              <p className="text-xs opacity-50">Instructor</p>
              <p className="font-bold">{showResetPass.name}</p>
            </div>
            <Field label="Nueva Contraseña" required>
              <input className="input-field" type="password" placeholder="Mínimo 6 caracteres"
                value={newPassword} onChange={e => setNewPassword(e.target.value)} />
            </Field>
            <div className="flex gap-3">
              <button onClick={() => setShowResetPass(null)} className="btn-secondary flex-1 text-sm">Cancelar</button>
              <button onClick={handleResetPassInstructor}
                className="btn-primary flex-1 text-sm"
                style={{ backgroundColor: gym?.primaryColor || '#E85D04' }}>
                Resetear Contraseña
              </button>
            </div>
          </div>
        )}
      </Modal>
      <Modal open={!!showMemInstructor} onClose={() => setShowMemInstructor(null)} title="Asignar Membresía">
        {showMemInstructor && (
          <div className="flex flex-col gap-4">
            <div className="p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.05)' }}>
              <p className="text-xs opacity-50">Instructor</p>
              <p className="font-bold">{showMemInstructor.name}</p>
              {!showMemInstructor.user_id && (
                <p className="text-xs text-red-400 mt-1">⚠ Este instructor no tiene cuenta de usuario asociada</p>
              )}
            </div>
            <Field label="Tipo de Membresía" required>
              <select className="input-field" value={memForm.membershipTypeId}
                onChange={e => setMemForm({ ...memForm, membershipTypeId: e.target.value })}>
                <option value="">Seleccionar tipo</option>
                {memTypes.filter(t => t.is_active).map(t => (
                  <option key={t.id} value={t.id}>
                    {t.name} — ${parseFloat(t.price).toFixed(2)}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Método">
              <select className="input-field" value={memForm.method}
                onChange={e => setMemForm({ ...memForm, method: e.target.value })}>
                <option value="cortesia">Cortesía</option>
                <option value="beca">Beca</option>
                <option value="efectivo">Efectivo</option>
                <option value="transferencia">Transferencia</option>
              </select>
            </Field>
            <div className="flex gap-3">
              <button onClick={() => setShowMemInstructor(null)} className="btn-secondary flex-1 text-sm">Cancelar</button>
              <button onClick={handleAssignMembership} disabled={savingMem || !showMemInstructor.user_id}
                className="btn-primary flex-1 text-sm flex items-center justify-center gap-2"
                style={{ backgroundColor: gym?.primaryColor || '#E85D04' }}>
                {savingMem && <Spinner size={14} className="text-white" />}
                Asignar Membresía
              </button>
            </div>
          </div>
        )}
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
  const [showResetPass, setShowResetPass] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [showMemReception, setShowMemReception] = useState(null);
const [memTypesR, setMemTypesR] = useState([]);
const [memFormR, setMemFormR] = useState({ membershipTypeId: '', method: 'cortesia' });
const [savingMemR, setSavingMemR] = useState(false);

  const load = async () => {
    setLoading(true);
    try { const r = await adminAPI.getReceptionists(); setReceptionists(r.data); }
    catch { toast.error('Error al cargar recepcionistas'); }
    finally { setLoading(false); }
  };

  useEffect(() => { 
    load(); 
    adminAPI.getMembershipTypes().then(r => setMemTypesR(r.data)).catch(() => {});
  }, []);

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

  const handleResetPassReceptionist = async () => {
    if (!newPassword || newPassword.length < 6) return toast.error('Mínimo 6 caracteres');
    try {
      await adminAPI.resetPassword(showResetPass.id, { newPassword });
      toast.success('Contraseña reseteada exitosamente');
      setShowResetPass(null);
      setNewPassword('');
    } catch { toast.error('Error al resetear contraseña'); }
  };

  const handleToggleUserRoleReception = async (userId, role, hasRole) => {
    try {
      if (hasRole) {
        await adminAPI.removeRole(userId, role);
        toast.success('Rol removido');
      } else {
        await adminAPI.assignRole(userId, role);
        toast.success('Rol asignado');
      }
      load();
    } catch { toast.error('Error al actualizar rol'); }
  };

  const handleAssignMemReception = async () => {
    if (!memFormR.membershipTypeId) return toast.error('Selecciona un tipo de membresía');
    setSavingMemR(true);
    try {
      await adminAPI.activateMembership(showMemReception.id, {
        membershipTypeId: memFormR.membershipTypeId,
        method: memFormR.method,
        amount: 0
      });
      toast.success('Membresía asignada exitosamente');
      setShowMemReception(null);
      setMemFormR({ membershipTypeId: '', method: 'cortesia' });
      load();
    } catch (err) { toast.error(err.response?.data?.error || 'Error al asignar membresía'); }
    finally { setSavingMemR(false); }
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
                    <td>
                      <div className="flex flex-wrap gap-1">
                        <span className={r.is_active ? 'badge-active' : 'badge-inactive'}>{r.is_active ? 'Activo' : 'Inactivo'}</span>
                        {r.has_user_role && <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-500/20 text-blue-400">👤</span>}
                        {r.has_active_membership 
                          ? <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-500/20 text-green-400">✓ Mem</span>
                          : <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-500/20 text-red-400">Sin mem</span>
                        }
                      </div>
                    </td>
                    <td><div className="flex gap-1">
                      <button onClick={() => handleToggleUserRoleReception(r.id, 'user', r.has_user_role)}
                        title={r.has_user_role ? 'Quitar rol usuario' : 'Dar rol usuario'}
                        className={`px-2 py-1 rounded text-xs font-medium transition-all ${r.has_user_role ? 'bg-green-500/20 text-green-400' : 'bg-white/10 opacity-50 hover:opacity-100'}`}>
                        👤 {r.has_user_role ? 'Usuario' : '+ Usuario'}
                      </button>
                      <button onClick={() => { setShowMemReception(r); setMemFormR({ membershipTypeId: '', method: 'cortesia' }); }}
                        title="Asignar membresía"
                        className="p-1.5 rounded-lg opacity-40 hover:opacity-100 hover:bg-white/10 transition-all"><CreditCard size={13} /></button>
                      <button onClick={() => { setShowResetPass(r); setNewPassword(''); }}
                        title="Resetear contraseña"
                        className="p-1.5 rounded-lg opacity-40 hover:opacity-100 hover:bg-white/10 transition-all"><Key size={13} /></button>
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

      <Modal open={!!showResetPass} onClose={() => setShowResetPass(null)} title="Resetear Contraseña">
        {showResetPass && (
          <div className="flex flex-col gap-4">
            <div className="p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.05)' }}>
              <p className="text-xs opacity-50">Recepcionista</p>
              <p className="font-bold">{showResetPass.name}</p>
              <p className="text-xs opacity-40">Cédula: {showResetPass.cedula}</p>
            </div>
            <Field label="Nueva Contraseña" required>
              <input className="input-field" type="password" placeholder="Mínimo 6 caracteres"
                value={newPassword} onChange={e => setNewPassword(e.target.value)} />
            </Field>
            <div className="flex gap-3">
              <button onClick={() => setShowResetPass(null)} className="btn-secondary flex-1 text-sm">Cancelar</button>
              <button onClick={handleResetPassReceptionist}
                className="btn-primary flex-1 text-sm"
                style={{ backgroundColor: gym?.primaryColor || '#E85D04' }}>
                Resetear Contraseña
              </button>
            </div>
          </div>
        )}
      </Modal>

      <Modal open={!!showMemReception} onClose={() => setShowMemReception(null)} title="Asignar Membresía">
        {showMemReception && (
          <div className="flex flex-col gap-4">
            <div className="p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.05)' }}>
              <p className="text-xs opacity-50">Recepcionista</p>
              <p className="font-bold">{showMemReception.name}</p>
            </div>
            <Field label="Tipo de Membresía" required>
              <select className="input-field" value={memFormR.membershipTypeId}
                onChange={e => setMemFormR({ ...memFormR, membershipTypeId: e.target.value })}>
                <option value="">Seleccionar tipo</option>
                {memTypesR.filter(t => t.is_active).map(t => (
                  <option key={t.id} value={t.id}>
                    {t.name} — ${parseFloat(t.price).toFixed(2)}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Método">
              <select className="input-field" value={memFormR.method}
                onChange={e => setMemFormR({ ...memFormR, method: e.target.value })}>
                <option value="cortesia">Cortesía</option>
                <option value="beca">Beca</option>
                <option value="efectivo">Efectivo</option>
                <option value="transferencia">Transferencia</option>
              </select>
            </Field>
            <div className="flex gap-3">
              <button onClick={() => setShowMemReception(null)} className="btn-secondary flex-1 text-sm">Cancelar</button>
              <button onClick={handleAssignMemReception} disabled={savingMemR}
                className="btn-primary flex-1 text-sm flex items-center justify-center gap-2"
                style={{ backgroundColor: gym?.primaryColor || '#E85D04' }}>
                {savingMemR && <Spinner size={14} className="text-white" />}
                Asignar Membresía
              </button>
            </div>
          </div>
        )}
      </Modal>
      
    </div>
  );
}
// ============================================================
// MEMBRESÍAS (vista central — solo la más reciente por cliente)
// ============================================================
export function AdminActiveMembershipsPage() {
  const { gym } = useAuth();
  const primaryColor = gym?.primaryColor || '#E85D04';
  const [memberships, setMemberships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [cancelling, setCancelling] = useState(null);
  const [historyUser, setHistoryUser] = useState(null);
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const load = () => {
    setLoading(true);
    adminAPI.getMemberships({ filter })
      .then(r => setMemberships(r.data))
      .catch(() => toast.error('Error al cargar membresías'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [filter]);

  const getDaysInfo = (endDate, status) => {
    if (status === 'cancelled') return { label: 'Anulada', color: 'text-gray-400', bg: 'bg-gray-500/20', days: -999 };
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const end = new Date(endDate.split('T')[0] + 'T00:00:00');
    const diffDays = Math.ceil((end - today) / (1000 * 60 * 60 * 24));
    if (diffDays < 0) return { label: 'Vencida', color: 'text-gray-400', bg: 'bg-gray-500/20', days: diffDays };
    if (diffDays <= 2) return { label: `${diffDays}d`, color: 'text-red-400', bg: 'bg-red-500/20', days: diffDays };
    if (diffDays <= 5) return { label: `${diffDays}d`, color: 'text-yellow-400', bg: 'bg-yellow-500/20', days: diffDays };
    return { label: `${diffDays}d`, color: 'text-green-400', bg: 'bg-green-500/20', days: diffDays };
  };

  const getMethodLabel = (m) => {
    const method = m.payment_method;
    if (!method) return { label: 'Sin pago', color: 'bg-gray-500/20 text-gray-400' };
    if (method === 'payphone') {
      return m.by_staff
        ? { label: 'PayPhone (link)', color: 'bg-blue-500/20 text-blue-400' }
        : { label: 'PayPhone (app)', color: 'bg-purple-500/20 text-purple-400' };
    }
    const map = {
      efectivo: { label: 'Efectivo', color: 'bg-emerald-500/20 text-emerald-400' },
      transferencia: { label: 'Transferencia', color: 'bg-cyan-500/20 text-cyan-400' },
      tarjeta: { label: 'Tarjeta', color: 'bg-indigo-500/20 text-indigo-400' },
      cortesia: { label: 'Cortesía', color: 'bg-pink-500/20 text-pink-400' },
      beca: { label: 'Beca', color: 'bg-pink-500/20 text-pink-400' },
    };
    return map[method] || { label: method, color: 'bg-gray-500/20 text-gray-400' };
  };

  const handleCancel = async (m) => {
    const isPayphoneApp = m.payment_method === 'payphone' && !m.by_staff;
    let msg = `¿Anular la membresía de ${m.client_name}?\n\nSe marcará como anulada y el pago quedará anulado.`;
    if (m.payment_method === 'payphone') {
      msg += `\n\n⚠ Fue pagada con PayPhone. Se intentará el reembolso automático (solo válido el mismo día hasta las 20:00).`;
    }
    if (!window.confirm(msg)) return;
    setCancelling(m.id);
    try {
      const r = await adminAPI.cancelMembership(m.id);
      toast.success(r.data.refunded ? 'Membresía anulada y pago reembolsado' : 'Membresía anulada');
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al anular');
    } finally {
      setCancelling(null);
    }
  };

  const openHistory = async (m) => {
    setHistoryUser(m);
    setLoadingHistory(true);
    try {
      const r = await adminAPI.getUserMembershipsHistory(m.user_id);
      setHistory(r.data);
    } catch { toast.error('Error al cargar historial'); }
    finally { setLoadingHistory(false); }
  };

  const filtered = memberships.filter(m =>
    !search || m.client_name?.toLowerCase().includes(search.toLowerCase()) || m.client_cedula?.includes(search)
  );

  return (
    <div className="fade-in">
      <PageHeader title="Membresías" />

      <input
        type="text"
        placeholder="🔍 Buscar por nombre o cédula..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        className="w-full mb-4 px-4 py-2.5 rounded-xl text-sm outline-none"
        style={{ background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.08)', color: '#fff' }}
      />

      <div className="flex gap-2 mb-4 flex-wrap">
        {[['all', 'Todas'], ['active', 'Activas'], ['expiring', '⚠ Por vencer'], ['expired', 'Vencidas'], ['cancelled', 'Anuladas']].map(([v, l]) => (
          <button key={v} onClick={() => setFilter(v)}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
            style={filter === v ? { backgroundColor: primaryColor, color: '#fff' } : { background: '#1a1a1a', opacity: 0.5 }}>
            {l}
          </button>
        ))}
      </div>

      <div className="rounded-xl overflow-hidden" style={{ background: '#1a1a1a' }}>
        {loading ? <div className="flex justify-center py-16"><Spinner size={28} className="opacity-30" /></div>
          : filtered.length === 0 ? <EmptyState icon={CreditCard} title="No hay membresías" />
          : (
            <table className="data-table">
              <thead><tr><th>Cliente</th><th>Tipo</th><th>Vence</th><th>Restante</th><th>Pago</th><th>Estado</th><th>Acciones</th></tr></thead>
              <tbody>
                {filtered.map(m => {
                  const info = getDaysInfo(m.end_date, m.status);
                  const method = getMethodLabel(m);
                  const isActive = m.status === 'active' && info.days >= 0;
                  return (
                    <tr key={m.id} className="hover:bg-white/3 transition-colors">
                      <td>
                        <p className="font-semibold text-sm">{m.client_name}</p>
                        <p className="text-xs opacity-40">{m.client_cedula}</p>
                      </td>
                      <td className="text-sm">{m.type_name}</td>
                      <td className="text-xs opacity-60">{new Date(m.end_date.split('T')[0] + 'T00:00:00').toLocaleDateString('es-EC')}</td>
                      <td>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${info.color} ${info.bg}`}>
                          {info.label}
                        </span>
                      </td>
                      <td>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${method.color}`}>{method.label}</span>
                      </td>
                      <td>
                        <span className={
                          m.status === 'cancelled' ? 'badge-inactive' :
                          isActive ? 'badge-active' : 'badge-inactive'
                        }>
                          {m.status === 'cancelled' ? 'Anulada' : isActive ? 'Activa' : 'Vencida'}
                        </span>
                      </td>
                      <td>
                        <div className="flex gap-1">
                          <button onClick={() => openHistory(m)} title="Ver historial"
                            className="p-1.5 rounded-lg opacity-40 hover:opacity-100 hover:bg-white/10 transition-all">
                            <Clock size={13} />
                          </button>
                          {isActive && (
                            <button onClick={() => handleCancel(m)} disabled={cancelling === m.id}
                              title="Anular membresía"
                              className="p-1.5 rounded-lg opacity-40 hover:opacity-100 hover:bg-red-500/20 hover:text-red-400 transition-all">
                              {cancelling === m.id ? <Spinner size={13} /> : <Trash2 size={13} />}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
      </div>

      {/* Modal Historial */}
      <Modal open={!!historyUser} onClose={() => { setHistoryUser(null); setHistory([]); }}
        title={`Historial — ${historyUser?.client_name || ''}`} maxWidth="max-w-2xl">
        {loadingHistory ? (
          <div className="flex justify-center py-10"><Spinner size={24} className="opacity-30" /></div>
        ) : history.length === 0 ? (
          <p className="text-center text-sm opacity-30 py-8">Sin historial de membresías</p>
        ) : (
          <div className="flex flex-col gap-2 max-h-96 overflow-y-auto">
            {history.map(h => {
              const method = getMethodLabel(h);
              return (
                <div key={h.id} className="p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)' }}>
                  <div className="flex items-center justify-between mb-1">
                    <p className="font-semibold text-sm">{h.type_name}</p>
                    <span className={
                      h.status === 'cancelled' ? 'badge-inactive' :
                      h.status === 'active' && new Date(h.end_date) >= new Date() ? 'badge-active' : 'badge-inactive'
                    }>
                      {h.status === 'cancelled' ? 'Anulada' : h.status === 'active' && new Date(h.end_date) >= new Date() ? 'Activa' : 'Vencida'}
                    </span>
                  </div>
                  <p className="text-xs opacity-50">
                    {new Date(h.start_date.split('T')[0] + 'T00:00:00').toLocaleDateString('es-EC')} — {new Date(h.end_date.split('T')[0] + 'T00:00:00').toLocaleDateString('es-EC')}
                  </p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${method.color}`}>{method.label}</span>
                    {h.amount != null && <span className="text-xs opacity-50">${parseFloat(h.amount).toFixed(2)}</span>}
                    {h.registered_by_name && <span className="text-xs opacity-30">por {h.registered_by_name}</span>}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Modal>
    </div>
  );
}

