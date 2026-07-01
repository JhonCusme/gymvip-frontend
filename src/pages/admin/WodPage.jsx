import { useState, useEffect } from 'react';
import { wodAPI } from '../../api';
import { Spinner } from '../../components/ui';
import { ChevronLeft, ChevronRight, Plus, Edit2, Trash2, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';

const DAYS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const MONTHS = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

const EMPTY_WOD = { title: '', description: '', warmup: '', workout: '', cooldown: '', notes: '', difficulty: 'rx' };

export default function WodPage() {
  const { gym } = useAuth();
  const primaryColor = gym?.primaryColor || '#E85D04';
  const today = new Date();

  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [wods, setWods] = useState([]);
  const [selectedDate, setSelectedDate] = useState(today.toISOString().split('T')[0]);
  const [selectedWod, setSelectedWod] = useState(null);
  const [form, setForm] = useState(EMPTY_WOD);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const r = await wodAPI.getWods({ month: currentMonth + 1, year: currentYear });
      setWods(r.data);
    } catch { toast.error('Error al cargar WODs'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [currentMonth, currentYear]);

  const selectDate = async (date) => {
    setSelectedDate(date);
    setEditing(false);
    try {
      const r = await wodAPI.getWod(date);
      setSelectedWod(r.data);
      if (r.data) setForm({
        title: r.data.title || '',
        description: r.data.description || '',
        warmup: r.data.warmup || '',
        workout: r.data.workout || '',
        cooldown: r.data.cooldown || '',
        notes: r.data.notes || '',
        difficulty: r.data.difficulty || 'rx'
      });
      else setForm(EMPTY_WOD);
    } catch { }
  };

  const handleSave = async () => {
    if (!form.description && !form.workout) return toast.error('Agrega al menos una descripción o workout');
    setSaving(true);
    try {
      await wodAPI.saveWod({ date: selectedDate, ...form });
      toast.success('WOD guardado');
      setEditing(false);
      load();
      const r = await wodAPI.getWod(selectedDate);
      setSelectedWod(r.data);
    } catch { toast.error('Error al guardar WOD'); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!window.confirm('¿Eliminar el WOD de este día?')) return;
    try {
      await wodAPI.deleteWod(selectedDate);
      toast.success('WOD eliminado');
      setSelectedWod(null);
      setForm(EMPTY_WOD);
      load();
    } catch { toast.error('Error al eliminar'); }
  };

  // Generar días del mes
  const getDaysInMonth = () => {
    const firstDay = new Date(currentYear, currentMonth, 1).getDay();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const days = [];
    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(i);
    return days;
  };

  const getDateStr = (day) => {
    if (!day) return null;
    return `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  };

  const hasWod = (day) => {
    const dateStr = getDateStr(day);
    return wods.some(w => w.wod_date?.split('T')[0] === dateStr);
  };

  const isToday = (day) => {
    const dateStr = getDateStr(day);
    return dateStr === today.toISOString().split('T')[0];
  };

  const isSelected = (day) => getDateStr(day) === selectedDate;

  const difficultyColors = {
    rx: 'bg-blue-500/20 text-blue-400',
    scaled: 'bg-green-500/20 text-green-400',
    rx_plus: 'bg-red-500/20 text-red-400'
  };

  return (
    <div className="fade-in">
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-xl font-bold">WOD del Día</h1>
        <p className="text-xs opacity-40">Workout of the Day — planifica con anticipación</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        {/* Calendario */}
        <div className="rounded-xl p-5" style={{ background: '#1a1a1a' }}>
          {/* Header mes */}
          <div className="flex items-center justify-between mb-4">
            <button onClick={() => {
              if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear(y => y - 1); }
              else setCurrentMonth(m => m - 1);
            }} className="p-1.5 rounded-lg opacity-50 hover:opacity-100 hover:bg-white/10 transition-all">
              <ChevronLeft size={16} />
            </button>
            <p className="font-bold">{MONTHS[currentMonth]} {currentYear}</p>
            <button onClick={() => {
              if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear(y => y + 1); }
              else setCurrentMonth(m => m + 1);
            }} className="p-1.5 rounded-lg opacity-50 hover:opacity-100 hover:bg-white/10 transition-all">
              <ChevronRight size={16} />
            </button>
          </div>

          {/* Días semana */}
          <div className="grid grid-cols-7 mb-2">
            {DAYS.map(d => <p key={d} className="text-center text-xs opacity-40 font-medium py-1">{d}</p>)}
          </div>

          {/* Días del mes */}
          <div className="grid grid-cols-7 gap-1">
            {getDaysInMonth().map((day, i) => (
              <button key={i} onClick={() => day && selectDate(getDateStr(day))}
                disabled={!day}
                className={`relative aspect-square rounded-lg text-sm font-medium transition-all flex items-center justify-center
                  ${!day ? 'invisible' : ''}
                  ${isSelected(day) ? 'text-white' : isToday(day) ? 'font-black' : 'opacity-60 hover:opacity-100 hover:bg-white/10'}
                `}
                style={isSelected(day) ? { backgroundColor: primaryColor } : {}}>
                {day}
                {hasWod(day) && !isSelected(day) && (
                  <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full" style={{ backgroundColor: primaryColor }} />
                )}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3 mt-4 text-xs opacity-40">
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: primaryColor }} />
              <span>Tiene WOD</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-white" />
              <span>Sin WOD</span>
            </div>
          </div>
        </div>

        {/* WOD del día seleccionado */}
        <div className="rounded-xl p-5" style={{ background: '#1a1a1a' }}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="font-bold">
                {new Date(selectedDate + 'T00:00:00').toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
              </p>
            </div>
            <div className="flex gap-2">
              {selectedWod && !editing && (
                <>
                  <button onClick={() => setEditing(true)} className="p-1.5 rounded-lg opacity-50 hover:opacity-100 hover:bg-white/10 transition-all"><Edit2 size={14} /></button>
                  <button onClick={handleDelete} className="p-1.5 rounded-lg opacity-50 hover:opacity-100 hover:bg-red-500/20 hover:text-red-400 transition-all"><Trash2 size={14} /></button>
                </>
              )}
              {!selectedWod && !editing && (
                <button onClick={() => setEditing(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white transition-all"
                  style={{ backgroundColor: primaryColor }}>
                  <Plus size={13} /> Crear WOD
                </button>
              )}
            </div>
          </div>

          {!editing && !selectedWod && (
            <div className="flex flex-col items-center justify-center py-12 opacity-30">
              <p className="text-4xl mb-3">💪</p>
              <p className="text-sm">No hay WOD para este día</p>
              <p className="text-xs mt-1">Haz clic en "Crear WOD" para agregar</p>
            </div>
          )}

          {!editing && selectedWod && (
            <div className="flex flex-col gap-3">
              {selectedWod.title && <p className="font-bold text-lg">{selectedWod.title}</p>}
              {selectedWod.description && (
                <div>
                  <p className="text-xs font-bold opacity-40 uppercase mb-1">Descripción</p>
                  <p className="text-sm opacity-80 whitespace-pre-wrap">{selectedWod.description}</p>
                </div>
              )}
              {selectedWod.warmup && (
                <div>
                  <p className="text-xs font-bold opacity-40 uppercase mb-1">🔥 Calentamiento</p>
                  <p className="text-sm opacity-80 whitespace-pre-wrap">{selectedWod.warmup}</p>
                </div>
              )}
              {selectedWod.workout && (
                <div>
                  <p className="text-xs font-bold opacity-40 uppercase mb-1">⚡ Workout</p>
                  <p className="text-sm opacity-80 whitespace-pre-wrap">{selectedWod.workout}</p>
                </div>
              )}
              {selectedWod.cooldown && (
                <div>
                  <p className="text-xs font-bold opacity-40 uppercase mb-1">❄️ Enfriamiento</p>
                  <p className="text-sm opacity-80 whitespace-pre-wrap">{selectedWod.cooldown}</p>
                </div>
              )}
              {selectedWod.notes && (
                <div>
                  <p className="text-xs font-bold opacity-40 uppercase mb-1">📝 Notas</p>
                  <p className="text-sm opacity-60 whitespace-pre-wrap">{selectedWod.notes}</p>
                </div>
              )}
            </div>
          )}

          {editing && (
            <div className="flex flex-col gap-3">
              <div>
                <p className="text-xs opacity-50 mb-1">Título (opcional)</p>
                <input className="input-field" placeholder="Ej: Cindy, Fran, Amanda..." value={form.title}
                  onChange={e => setForm({ ...form, title: e.target.value })} />
              </div>
              <div>
                <p className="text-xs opacity-50 mb-1">Descripción general</p>
                <textarea className="input-field" rows={2} placeholder="Descripción del WOD..."
                  value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
              </div>
              <div>
                <p className="text-xs opacity-50 mb-1">🔥 Calentamiento</p>
                <textarea className="input-field" rows={2} placeholder="Ejercicios de calentamiento..."
                  value={form.warmup} onChange={e => setForm({ ...form, warmup: e.target.value })} />
              </div>
              <div>
                <p className="text-xs opacity-50 mb-1">⚡ Workout</p>
                <textarea className="input-field" rows={3} placeholder="21-15-9&#10;Thrusters 95/65 lb&#10;Pull-ups"
                  value={form.workout} onChange={e => setForm({ ...form, workout: e.target.value })} />
              </div>
              <div>
                <p className="text-xs opacity-50 mb-1">❄️ Enfriamiento</p>
                <textarea className="input-field" rows={2} placeholder="Ejercicios de enfriamiento..."
                  value={form.cooldown} onChange={e => setForm({ ...form, cooldown: e.target.value })} />
              </div>
              <div>
                <p className="text-xs opacity-50 mb-1">📝 Notas del coach</p>
                <textarea className="input-field" rows={2} placeholder="Tips, modificaciones, pesos sugeridos..."
                  value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
              </div>
              <div className="flex gap-3 mt-2">
                <button onClick={() => { setEditing(false); if (selectedWod) setForm({ title: selectedWod.title || '', description: selectedWod.description || '', warmup: selectedWod.warmup || '', workout: selectedWod.workout || '', cooldown: selectedWod.cooldown || '', notes: selectedWod.notes || '', difficulty: selectedWod.difficulty || 'rx' }); }}
                  className="btn-secondary flex-1 text-sm">Cancelar</button>
                <button onClick={handleSave} disabled={saving}
                  className="btn-primary flex-1 text-sm flex items-center justify-center gap-2"
                  style={{ backgroundColor: primaryColor }}>
                  {saving ? <Spinner size={14} className="text-white" /> : <Save size={14} />}
                  Guardar WOD
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}