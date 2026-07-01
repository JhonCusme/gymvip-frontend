import { useState, useEffect } from 'react';
import { superAPI, uploadAPI } from '../../api';
import { Modal, ConfirmDialog, PageHeader, SearchInput, Spinner, Field, EmptyState } from '../../components/ui';
import { Plus, Edit2, Power, Shield, CreditCard, Copy, Check, ChevronDown, ChevronUp, Users, Layers, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import GymAdminsModal, { GymPlansModal } from '../../components/super/GymAdminsModal';

const THEMES = [
  { value: 'classic_red', label: 'Estilo Clásico (Rojo)' },
  { value: 'glow_neon', label: 'Glow Neón' },
  { value: 'fuego_fenix', label: 'Fuego Fénix' },
  { value: 'esmeralda_premium', label: 'Esmeralda Premium' },
  { value: 'acero_artico', label: 'Acero Ártico' },
  { value: 'oro_imperial', label: 'Oro Imperial' },
  { value: 'titan_negro', label: 'Titán Negro' },
  { value: 'sangre_fria', label: 'Sangre Fría' },
  { value: 'oceano_profundo', label: 'Océano Profundo' },
  { value: 'arena_combat', label: 'Arena Combat' },
];

const DEFAULT_FORM = {
  slug: '', name: '', logoUrl: '', email: '', phone: '', address: '',
  payphoneEnabled: false, bookingAdvanceDays: 7,
  primaryColor: '#E85D04', secondaryColor: '#000000', theme: 'classic_red'
};

export default function SuperGymsPage() {
  const [gyms, setGyms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [editGym, setEditGym] = useState(null);
  const [form, setForm] = useState(DEFAULT_FORM);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [confirmToggle, setConfirmToggle] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [adminsGym, setAdminsGym] = useState(null);
  const [plansGym, setPlansGym] = useState(null);
  const [copied, setCopied] = useState('');

  const load = async () => {
    try {
      const res = await superAPI.getGyms();
      setGyms(res.data);
    } catch { toast.error('Error al cargar gimnasios'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => { setForm(DEFAULT_FORM); setEditGym(null); setShowCreate(true); };
  const openEdit = (gym) => {
    setForm({
      slug: gym.slug, name: gym.name, logoUrl: gym.logo_url || '',
      email: gym.email || '', phone: gym.phone || '', address: gym.address || '',
      payphoneEnabled: gym.payphone_enabled, bookingAdvanceDays: gym.booking_advance_days,
      primaryColor: gym.primary_color, secondaryColor: gym.secondary_color, theme: gym.theme
    });
    setEditGym(gym);
    setShowCreate(true);
  };

  const handleSave = async () => {
    if (!form.slug || !form.name) return toast.error('Slug y nombre son requeridos');
    setSaving(true);
    try {
      if (editGym) {
        await superAPI.updateGym(editGym.id, form);
        toast.success('Gimnasio actualizado');
      } else {
        await superAPI.createGym(form);
        toast.success('Gimnasio creado exitosamente');
      }
      setShowCreate(false);
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al guardar');
    } finally { setSaving(false); }
  };

  const handleToggle = async (gym) => {
    try {
      await superAPI.toggleGym(gym.id);
      toast.success(gym.is_active ? 'Gimnasio desactivado' : 'Gimnasio activado');
      load();
    } catch { toast.error('Error al cambiar estado'); }
  };

  const handleDelete = async (gym) => {
    try {
      await superAPI.deleteGym(gym.id);
      toast.success('Gimnasio eliminado');
      load();
    } catch { toast.error('Error al eliminar gimnasio'); }
  };

  const copyText = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(''), 2000);
  };

  const filtered = gyms.filter(g =>
    g.name.toLowerCase().includes(search.toLowerCase()) ||
    g.slug.toLowerCase().includes(search.toLowerCase())
  );

  const getLinks = (slug) => [
    { label: 'Recepción', url: `${window.location.origin}/recepcion/?gym=${slug}` },
    { label: 'Usuarios', url: `${window.location.origin}/usuario/?gym=${slug}` },
    { label: 'Administrador', url: `${window.location.origin}/login?gym=${slug}` },
    { label: 'Entrenador', url: `${window.location.origin}/instructor/?gym=${slug}` },
  ];

  return (
    <div className="fade-in">
      <PageHeader
        title="Gimnasios"
        subtitle="Selecciona un gimnasio para gestionar su información, usuarios, membresías y más."
        action={
          <button onClick={openCreate} className="btn-primary flex items-center gap-2 text-sm" style={{ backgroundColor: '#DC2626' }}>
            <Plus size={16} /> Nuevo gimnasio
          </button>
        }
      />

      <SearchInput value={search} onChange={setSearch} placeholder="Buscar gimnasio..." />

      {loading ? (
        <div className="flex justify-center py-20"><Spinner size={32} className="text-gray-300" /></div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={Shield} title="No hay gimnasios" subtitle="Crea el primer gimnasio del sistema" />
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 mt-6">
          {filtered.map((gym) => (
            <GymCard
              key={gym.id}
              gym={gym}
              onEdit={() => openEdit(gym)}
              onToggle={() => setConfirmToggle(gym)}
              onDelete={() => setConfirmDelete(gym)}
              onAdmins={() => setAdminsGym(gym)}
              onPlans={() => setPlansGym(gym)}
              getLinks={getLinks}
              copyText={copyText}
              copied={copied}
            />
          ))}
        </div>
      )}

      {/* Modal Crear/Editar */}
      <Modal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        title={editGym ? `Editar: ${editGym.name}` : 'Nuevo gimnasio'}
        maxWidth="max-w-lg"
      >
        <div className="flex flex-col gap-4">
          {/* Logo */}
          <div className="flex items-center gap-4">
            <div
              className="w-16 h-16 rounded-xl flex items-center justify-center text-white text-2xl font-black flex-shrink-0 overflow-hidden"
              style={{ backgroundColor: form.primaryColor || '#E85D04' }}
            >
              {form.logoUrl
                ? <img src={form.logoUrl} alt="" className="w-full h-full object-contain" />
                : form.name?.charAt(0)?.toUpperCase() || '?'
              }
            </div>
            <div className="flex-1 flex flex-col gap-2">
              <label className="cursor-pointer">
                <div className="btn-secondary text-xs text-center py-2 flex items-center justify-center gap-2">
                  {uploadingLogo ? <Spinner size={12} /> : '📁'}
                  {uploadingLogo ? 'Subiendo...' : 'Subir imagen'}
                </div>
                <input type="file" accept="image/*" className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files[0];
                    if (!file) return;
                    if (file.size > 2 * 1024 * 1024) return toast.error('La imagen no puede superar 2MB');
                    setUploadingLogo(true);
                    try {
                      const res = await uploadAPI.uploadGymLogo(file);
                      setForm({ ...form, logoUrl: res.data.url });
                      toast.success('Logo subido exitosamente');
                    } catch { toast.error('Error al subir la imagen'); }
                    finally { setUploadingLogo(false); }
                  }} />
              </label>
              <input
                className="input-field text-xs"
                placeholder="o pegar URL del logo"
                value={form.logoUrl}
                onChange={(e) => setForm({ ...form, logoUrl: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Nombre" required>
              <input className="input-field" value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </Field>
            <Field label="Slug" required>
              <input className="input-field" value={form.slug} placeholder="theshed"
                onChange={(e) => setForm({ ...form, slug: e.target.value.toLowerCase().replace(/\s/g, '') })}
                disabled={!!editGym} />
            </Field>
            <Field label="Email">
              <input className="input-field" type="email" value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </Field>
            <Field label="Teléfono">
              <input className="input-field" value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </Field>
          </div>

          <Field label="Dirección">
            <input className="input-field" value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })} />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Color primario">
              <div className="flex gap-2">
                <input type="color" value={form.primaryColor}
                  onChange={(e) => setForm({ ...form, primaryColor: e.target.value })}
                  className="w-10 h-10 rounded-lg border-0 cursor-pointer bg-transparent" />
                <input className="input-field" value={form.primaryColor}
                  onChange={(e) => setForm({ ...form, primaryColor: e.target.value })} />
              </div>
            </Field>
            <Field label="Color secundario">
              <div className="flex gap-2">
                <input type="color" value={form.secondaryColor}
                  onChange={(e) => setForm({ ...form, secondaryColor: e.target.value })}
                  className="w-10 h-10 rounded-lg border-0 cursor-pointer bg-transparent" />
                <input className="input-field" value={form.secondaryColor}
                  onChange={(e) => setForm({ ...form, secondaryColor: e.target.value })} />
              </div>
            </Field>
          </div>

          <Field label="Plantilla de Diseño (Tema)">
            <select className="input-field" value={form.theme}
              onChange={(e) => setForm({ ...form, theme: e.target.value })}>
              {THEMES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </Field>

          <div className="flex items-center justify-between p-3 rounded-xl" style={{ background: 'rgba(0,0,0,0.06)' }}>
            <div>
              <p className="text-sm font-semibold">Habilitar PayPhone</p>
              <p className="text-xs opacity-50">Permite cobros desde la app de usuarios</p>
            </div>
            <button
              onClick={() => setForm({ ...form, payphoneEnabled: !form.payphoneEnabled })}
              className={`w-11 h-6 rounded-full transition-all ${form.payphoneEnabled ? 'bg-green-500' : 'bg-gray-300'}`}
            >
              <span className={`block w-5 h-5 bg-white rounded-full shadow transition-transform mx-0.5 ${form.payphoneEnabled ? 'translate-x-5' : 'translate-x-0'}`} />
            </button>
          </div>

          <Field label="Días de anticipación para reservas">
            <input className="input-field" type="number" min={1} max={30}
              value={form.bookingAdvanceDays}
              onChange={(e) => setForm({ ...form, bookingAdvanceDays: parseInt(e.target.value) })} />
          </Field>

          <div className="flex gap-3 mt-2">
            <button onClick={() => setShowCreate(false)} className="btn-secondary flex-1 text-sm">Cancelar</button>
            <button onClick={handleSave} disabled={saving} className="btn-primary flex-1 text-sm flex items-center justify-center gap-2"
              style={{ backgroundColor: '#DC2626' }}>
              {saving && <Spinner size={14} className="text-white" />}
              {editGym ? 'Guardar cambios' : 'Crear gimnasio'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Confirm toggle */}
      <ConfirmDialog
        open={!!confirmToggle}
        onClose={() => setConfirmToggle(null)}
        onConfirm={() => handleToggle(confirmToggle)}
        title={confirmToggle?.is_active ? 'Desactivar gimnasio' : 'Activar gimnasio'}
        message={`¿Confirmas ${confirmToggle?.is_active ? 'desactivar' : 'activar'} el gimnasio "${confirmToggle?.name}"?`}
        danger={confirmToggle?.is_active}
      />
      <ConfirmDialog
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={() => handleDelete(confirmDelete)}
        title="Eliminar gimnasio"
        message={`¿Estás seguro de eliminar "${confirmDelete?.name}"? Se eliminarán TODOS sus datos. Esta acción NO se puede deshacer.`}
        danger
      />

      {/* Modales de admins y planes */}
      {adminsGym && <GymAdminsModal gym={adminsGym} onClose={() => setAdminsGym(null)} />}
      {plansGym && <GymPlansModal gym={plansGym} onClose={() => setPlansGym(null)} />}
    </div>
  );
}

// ============================================================
// GYM CARD
// ============================================================
function GymCard({ gym, onEdit, onToggle, onDelete, onAdmins, onPlans, getLinks, copyText, copied }) {
const [expanded, setExpanded] = useState(false);
  const links = getLinks(gym.slug);
  const appUrl = window.location.origin;

  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-black text-lg flex-shrink-0"
              style={{ backgroundColor: gym.primary_color || '#E85D04' }}
            >
              {gym.logo_url
                ? <img src={gym.logo_url} alt="" className="w-full h-full object-contain rounded-xl" />
                : gym.name?.charAt(0)?.toUpperCase()
              }
            </div>
            <div>
              <h3 className="font-bold text-gray-900">{gym.name}</h3>
              <p className="text-xs text-gray-400">{gym.slug}</p>
            </div>
          </div>
        <div className="flex items-center gap-1.5">
            <button onClick={onEdit} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors">
              <Edit2 size={15} />
            </button>
            <button onClick={onToggle} className={`p-1.5 rounded-lg transition-colors ${gym.is_active ? 'text-red-400 hover:bg-red-50' : 'text-green-500 hover:bg-green-50'}`}>
              <Power size={15} />
            </button>
            <button onClick={onDelete} className="p-1.5 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors" title="Eliminar gimnasio">
              <Trash2 size={15} />
            </button>
          </div>
        </div>

        {/* Badges */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${gym.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
            {gym.is_active ? 'Activo' : 'Inactivo'}
          </span>
          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${gym.payphone_enabled ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
            PayPhone {gym.payphone_enabled ? 'ON' : 'OFF'}
          </span>
          {gym.user_count > 0 && (
            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
              {gym.user_count} usuarios
            </span>
          )}
          {gym.active_memberships > 0 && (
            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
              {gym.active_memberships} membresías
            </span>
          )}
          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500">
            Reserva: {gym.booking_advance_days} días
          </span>
        </div>

        {/* Info */}
        {(gym.email || gym.phone || gym.address) && (
          <div className="text-xs text-gray-500 space-y-0.5 mb-3">
            {gym.email && <p>Email: {gym.email}</p>}
            {gym.phone && <p>Teléfono: {gym.phone}</p>}
            {gym.address && <p>Dirección: {gym.address}</p>}
          </div>
        )}

        {/* Links de acceso (colapsables) */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 transition-colors mb-2"
        >
          {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          LINKS DE ACCESO
        </button>

        {expanded && (
          <div className="space-y-1.5 mb-3">
            {links.map((link) => (
              <div key={link.label} className="flex items-center justify-between gap-2 bg-gray-50 rounded-lg px-3 py-1.5">
                <span className="text-xs text-gray-500 w-24 flex-shrink-0">{link.label}</span>
                <span className="text-xs text-blue-600 truncate flex-1">{link.url}</span>
                <button
                  onClick={() => copyText(link.url, link.label)}
                  className="text-gray-400 hover:text-gray-700 transition-colors flex-shrink-0"
                >
                  {copied === link.label ? <Check size={13} className="text-green-500" /> : <Copy size={13} />}
                </button>
              </div>
            ))}

            {/* PayPhone config */}
            <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide mt-2 mb-1">Configuración PayPhone</p>
            {[
              { label: 'Dominio web', url: appUrl },
              { label: 'URL respuesta', url: `${appUrl}/usuario/payment-result` },
              { label: 'URL notificación', url: `${appUrl.replace('http://localhost:5173', 'http://localhost:3001')}/api/payments/payphone/notify` },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between gap-2 bg-blue-50 rounded-lg px-3 py-1.5">
                <span className="text-xs text-blue-600 w-28 flex-shrink-0">{item.label}</span>
                <span className="text-xs text-blue-800 truncate flex-1">{item.url}</span>
                <button onClick={() => copyText(item.url, item.label)} className="text-blue-400 hover:text-blue-700 flex-shrink-0">
                  {copied === item.label ? <Check size={13} className="text-green-500" /> : <Copy size={13} />}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer acciones */}
      <div className="border-t border-gray-100 grid grid-cols-2">
        <button
          onClick={onAdmins}
          className="flex items-center justify-center gap-2 py-3 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors border-r border-gray-100"
        >
          <Users size={15} /> Administradores
        </button>
        <button
          onClick={onPlans}
          className="flex items-center justify-center gap-2 py-3 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
        >
          <Layers size={15} /> Planes de membresía
        </button>
      </div>
    </div>
  );
}
