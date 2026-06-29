import { X, Loader2 } from 'lucide-react';

// ============================================================
// MODAL
// ============================================================
export const Modal = ({ open, onClose, title, children, maxWidth = 'max-w-md' }) => {
  if (!open) return null;
  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={`modal-box ${maxWidth} fade-in`}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold">{title}</h2>
          <button onClick={onClose} className="p-1 rounded-lg opacity-50 hover:opacity-100 transition-opacity">
            <X size={20} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
};

// ============================================================
// SPINNER
// ============================================================
export const Spinner = ({ size = 20, className = '' }) => (
  <Loader2 size={size} className={`animate-spin ${className}`} />
);

export const PageLoader = () => (
  <div className="flex items-center justify-center h-64">
    <Spinner size={32} className="opacity-40" />
  </div>
);

// ============================================================
// BADGE
// ============================================================
export const Badge = ({ children, type = 'info' }) => {
  const classes = {
    active: 'badge-active',
    inactive: 'badge-inactive',
    warning: 'badge-warning',
    info: 'badge-info',
    success: 'badge-active',
  };
  return <span className={classes[type] || classes.info}>{children}</span>;
};

// ============================================================
// KPI CARD
// ============================================================
export const KPICard = ({ title, value, subtitle, icon: Icon, iconBg = 'bg-blue-500' }) => (
  <div className="card flex items-center gap-4">
    <div className={`${iconBg} p-3 rounded-xl flex-shrink-0`}>
      <Icon size={22} className="text-white" />
    </div>
    <div>
      <p className="text-2xl font-bold">{value ?? '—'}</p>
      <p className="text-sm font-medium opacity-80">{title}</p>
      {subtitle && <p className="text-xs opacity-50 mt-0.5">{subtitle}</p>}
    </div>
  </div>
);

// ============================================================
// EMPTY STATE
// ============================================================
export const EmptyState = ({ icon: Icon, title, subtitle, action }) => (
  <div className="flex flex-col items-center justify-center py-16 text-center opacity-60">
    {Icon && <Icon size={40} className="mb-4 opacity-40" />}
    <p className="font-semibold text-lg">{title}</p>
    {subtitle && <p className="text-sm mt-1 opacity-70">{subtitle}</p>}
    {action && <div className="mt-4">{action}</div>}
  </div>
);

// ============================================================
// CONFIRM DIALOG
// ============================================================
export const ConfirmDialog = ({ open, onClose, onConfirm, title, message, danger = false }) => {
  if (!open) return null;
  return (
    <div className="modal-overlay">
      <div className="modal-box max-w-sm fade-in">
        <h3 className="text-lg font-bold mb-2">{title}</h3>
        <p className="text-sm opacity-70 mb-6">{message}</p>
        <div className="flex gap-3 justify-end">
          <button onClick={onClose} className="btn-secondary text-sm">Cancelar</button>
          <button
            onClick={() => { onConfirm(); onClose(); }}
            className={`px-4 py-2 rounded-lg font-semibold text-white text-sm transition-all ${danger ? 'bg-red-600 hover:bg-red-700' : 'btn-primary'}`}
          >
            Confirmar
          </button>
        </div>
      </div>
    </div>
  );
};

// ============================================================
// INPUT FIELD
// ============================================================
export const Field = ({ label, required, error, children }) => (
  <div className="flex flex-col gap-1">
    {label && (
      <label className="text-xs font-semibold uppercase tracking-wide opacity-60">
        {label} {required && <span className="text-red-400">*</span>}
      </label>
    )}
    {children}
    {error && <p className="text-xs text-red-400 mt-0.5">{error}</p>}
  </div>
);

// ============================================================
// SELECT
// ============================================================
export const Select = ({ value, onChange, options, placeholder, className = '' }) => (
  <select
    value={value}
    onChange={(e) => onChange(e.target.value)}
    className={`input-field ${className}`}
  >
    {placeholder && <option value="">{placeholder}</option>}
    {options.map((opt) => (
      <option key={opt.value} value={opt.value}>{opt.label}</option>
    ))}
  </select>
);

// ============================================================
// TABS
// ============================================================
export const Tabs = ({ tabs, active, onChange }) => (
  <div className="flex gap-1 p-1 rounded-xl" style={{ background: 'rgba(255,255,255,0.06)' }}>
    {tabs.map((tab) => (
      <button
        key={tab.value}
        onClick={() => onChange(tab.value)}
        className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
          active === tab.value
            ? 'text-white shadow-sm'
            : 'opacity-50 hover:opacity-80'
        }`}
        style={active === tab.value ? { backgroundColor: 'var(--color-primary)' } : {}}
      >
        {tab.label}
      </button>
    ))}
  </div>
);

// ============================================================
// PAGE HEADER
// ============================================================
export const PageHeader = ({ title, subtitle, action }) => (
  <div className="flex items-start justify-between mb-6">
    <div>
      <h1 className="text-2xl font-bold">{title}</h1>
      {subtitle && <p className="text-sm opacity-50 mt-1">{subtitle}</p>}
    </div>
    {action && <div>{action}</div>}
  </div>
);

// ============================================================
// SEARCH INPUT
// ============================================================
export const SearchInput = ({ value, onChange, placeholder = 'Buscar...' }) => (
  <div className="relative">
    <svg className="absolute left-3 top-1/2 -translate-y-1/2 opacity-40" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
    </svg>
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="input-field pl-9"
    />
  </div>
);
