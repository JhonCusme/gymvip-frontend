import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { userAPI } from '../../api';
import { UserLayout } from './UserPages';
import { Spinner } from '../../components/ui';
import { Check, X, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../api';

// ============================================================
// PÁGINA DE PAGO — renderiza la Cajita de Pagos oficial de PayPhone
// ============================================================
export function UserPayphonePage() {
  const { gym } = useAuth();
  const primaryColor = gym?.primaryColor || '#E85D04';
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const planId = searchParams.get('plan');
  const [paymentData, setPaymentData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [step, setStep] = useState('choice'); // choice | consent | payment
  const [wantsRecurring, setWantsRecurring] = useState(false);
  const [consentSigned, setConsentSigned] = useState(false);
  const [signingConsent, setSigningConsent] = useState(false);
  const cajitaRef = useRef(null);
  const scriptLoaded = useRef(false);

 useEffect(() => {
    if (!planId) {
      navigate('/usuario/home');
      return;
    }
    // Solo cargar info del plan para mostrar opciones
    api.get('/usuario/payphone/init', { params: { membershipTypeId: planId, infoOnly: true } })
      .then(r => setPaymentData(r.data))
      .catch(err => setError(err.response?.data?.error || 'Error al cargar plan'))
      .finally(() => setLoading(false));
  }, [planId]);

  // Cargar cajita cuando llega al paso de pago
  useEffect(() => {
    if (step !== 'payment' || !paymentData || !planId) return;
    scriptLoaded.current = false;
    api.get('/usuario/payphone/init', { params: { membershipTypeId: planId, recurring: wantsRecurring } })
      .then(r => {
        console.log('Datos init payment:', JSON.stringify(r.data).substring(0, 100));
        setPaymentData(prev => ({ ...prev, ...r.data }));
      })
      .catch(err => {
        console.error('Error iniciando pago:', err);
        toast.error('Error al iniciar el pago. Intenta de nuevo.');
        setStep('choice');
      });
  }, [step]);

  // Inyectar los scripts de PayPhone y renderizar la cajita
  useEffect(() => {
    if (!paymentData || scriptLoaded.current || step !== 'payment') return;
    
    const loadScript = () => {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://cdn.payphonetodoesposible.com/box/v2.0/payphone-payment-box.css';
      document.head.appendChild(link);

      const script = document.createElement('script');
      script.type = 'module';
      script.src = 'https://cdn.payphonetodoesposible.com/box/v2.0/payphone-payment-box.js';
      script.onload = () => renderCajita();
      document.head.appendChild(script);

      scriptLoaded.current = true;
    };

    const renderCajita = () => {
      if (!window.PPaymentButtonBox) {
        setTimeout(renderCajita, 500);
        return;
      }
      const appUrl = window.location.origin;
      try {
        console.log('PayPhone token enviado:', paymentData.token?.substring(0, 30));
        console.log('PayPhone storeId enviado:', paymentData.storeId);
        new window.PPaymentButtonBox({
          token: paymentData.token,
          clientTransactionId: paymentData.clientTransactionId,
          amount: paymentData.amount,
          amountWithoutTax: paymentData.amountWithoutTax,
          currency: paymentData.currency,
          storeId: paymentData.storeId,
          reference: paymentData.reference,
          lang: paymentData.lang || 'es',
          timeZone: paymentData.timeZone || -5,
          ...(paymentData.phoneNumber && { phoneNumber: paymentData.phoneNumber }),
          ...(paymentData.email && { email: paymentData.email }),
          ...(paymentData.documentId && { documentId: paymentData.documentId }),
          identificationType: paymentData.identificationType || 1,
          defaultMethod: 'card',
        }).render('pp-button');
      } catch (err) {
        console.error('Error rendering cajita:', err);
        setError('Error al cargar el formulario de pago. Intenta de nuevo.');
      }
    };

    loadScript();
  }, [paymentData, step]);

  if (loading) return (
    <UserLayout title="Pagar con PayPhone" showBack>
      <div className="flex justify-center py-20"><Spinner size={28} className="opacity-30" /></div>
    </UserLayout>
  );

  if (error) return (
    <UserLayout title="Pagar con PayPhone" showBack>
      <div className="rounded-2xl p-6 text-center border border-red-500/30" style={{ background: 'rgba(220,38,38,0.1)' }}>
        <X size={32} className="text-red-400 mx-auto mb-3" />
        <p className="font-bold text-red-400 mb-2">No se pudo iniciar el pago</p>
        <p className="text-sm opacity-60">{error}</p>
        <button onClick={() => navigate(-1)} className="mt-4 btn-secondary text-sm">Volver</button>
      </div>
    </UserLayout>
  );

  return (
    <UserLayout title="Pagar con PayPhone" showBack>
      {/* Info del plan */}
      {paymentData?.plan && (
        <div className="rounded-2xl p-4 mb-5 border" style={{ background: '#1a1a1a', borderColor: 'rgba(255,255,255,0.06)' }}>
          <p className="text-xs opacity-50 mb-1">Plan seleccionado</p>
          <p className="font-bold text-lg">{paymentData.plan.name}</p>
          <p className="text-xs opacity-50">
            Duración: {paymentData.plan.durationValue} {paymentData.plan.durationUnit === 'months' ? 'mes(es)' : paymentData.plan.durationUnit}
          </p>
          <div className="flex items-center gap-3 mt-2">
            <p className={`text-2xl font-black ${wantsRecurring && paymentData.plan.recurringDiscount > 0 ? 'line-through opacity-40 text-lg' : ''}`} style={{ color: primaryColor }}>
              ${parseFloat(paymentData.plan.price).toFixed(2)} USD
            </p>
            {wantsRecurring && paymentData.plan.recurringDiscount > 0 && (
              <div>
                <p className="text-2xl font-black text-green-400">
                  ${(parseFloat(paymentData.plan.price) * (1 - paymentData.plan.recurringDiscount / 100)).toFixed(2)} USD
                </p>
                <p className="text-xs text-green-400">{paymentData.plan.recurringDiscount}% descuento recurrente</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* PASO 1 — Elegir si quiere cobro recurrente */}
      {step === 'choice' && (
        <div className="flex flex-col gap-4">
          {paymentData?.plan?.recurringDiscount > 0 && (
            <div className="rounded-2xl p-5 border-2" style={{ background: 'rgba(22,163,74,0.08)', borderColor: '#16a34a' }}>
              <p className="font-black text-lg text-green-400 mb-1">🎉 Ahorra {paymentData.plan.recurringDiscount}% activando el cobro automático</p>
              <p className="text-sm opacity-70 mb-3">
                Activa la renovación automática y paga ${(parseFloat(paymentData?.plan?.price || 0) * (1 - (paymentData?.plan?.recurringDiscount || 0) / 100)).toFixed(2)} en lugar de ${parseFloat(paymentData?.plan?.price || 0).toFixed(2)} cada vez.
              </p>
              <button onClick={() => { setWantsRecurring(true); setStep('consent'); }}
                className="w-full py-3 rounded-xl font-bold text-white mb-2"
                style={{ backgroundColor: '#16a34a' }}>
                ✅ Activar cobro automático con descuento
              </button>
              <button onClick={() => { setWantsRecurring(false); setStep('payment'); }}
                className="w-full py-3 rounded-xl font-semibold text-sm opacity-60 border border-white/20">
                Pagar sin descuento (${parseFloat(paymentData?.plan?.price || 0).toFixed(2)})
              </button>
            </div>
          )}
          {(!paymentData?.plan?.recurringDiscount || paymentData?.plan?.recurringDiscount <= 0) && (
            <div className="flex flex-col gap-3">
              <button onClick={() => { setWantsRecurring(true); setStep('consent'); }}
                className="w-full py-3 rounded-xl font-bold text-white"
                style={{ backgroundColor: primaryColor }}>
                Activar cobro automático
              </button>
              <button onClick={() => { setWantsRecurring(false); setStep('payment'); }}
                className="w-full py-3 rounded-xl font-semibold text-sm opacity-60 border border-white/20">
                Pagar una sola vez
              </button>
            </div>
          )}
        </div>
      )}

      {/* PASO 2 — Firmar consentimiento */}
      {step === 'consent' && (
        <div className="flex flex-col gap-4">
          <div className="rounded-2xl p-4 border" style={{ background: '#1a1a1a', borderColor: 'rgba(255,255,255,0.06)' }}>
            <p className="font-bold mb-2">Contrato de Autorización</p>
            <div className="rounded-xl p-3 max-h-48 overflow-y-auto text-xs opacity-60 leading-relaxed mb-3"
              style={{ background: 'rgba(255,255,255,0.04)' }}>
              Por medio del presente instrumento, autorizo expresamente a {gym?.name} a almacenar de forma segura el token de mi tarjeta y realizar cobros automáticos por el valor de mi membresía vigente al momento de cada renovación. Esta autorización puede ser revocada en cualquier momento desde mi perfil.
            </div>
            <label className="flex items-start gap-3 cursor-pointer mb-4">
              <input type="checkbox" checked={consentSigned} onChange={e => setConsentSigned(e.target.checked)} className="mt-0.5 w-4 h-4 flex-shrink-0" />
              <span className="text-xs opacity-60">He leído y acepto los términos del contrato de autorización de débito automático</span>
            </label>
            <button onClick={async () => {
              if (!consentSigned) return toast.error('Debes aceptar el contrato');
              setSigningConsent(true);
              try {
                await api.post('/usuario/payphone/consent');
                setStep('payment');
              } catch { toast.error('Error al firmar consentimiento'); }
              finally { setSigningConsent(false); }
            }} disabled={!consentSigned || signingConsent}
              className="w-full py-3 rounded-xl font-bold text-white flex items-center justify-center gap-2"
              style={{ backgroundColor: '#16a34a' }}>
              {signingConsent && <Spinner size={16} className="text-white" />}
              ✍ Firmar y continuar al pago
            </button>
            <button onClick={() => setStep('choice')} className="w-full py-2 mt-2 text-sm opacity-40">
              ← Volver
            </button>
          </div>
        </div>
      )}

      {/* PASO 3 — Cajita de PayPhone */}
      {step === 'payment' && (
        <div>
          <div id="pp-button" ref={cajitaRef} className="min-h-64 rounded-2xl overflow-hidden" style={{ background: 'transparent' }}>
            <div className="flex items-center justify-center h-48 opacity-20">
              <Spinner size={24} />
              <span className="ml-2 text-sm">Cargando formulario de pago...</span>
            </div>
          </div>
          <p className="text-xs opacity-30 text-center mt-4">
            Pago seguro procesado por PayPhone · PCI DSS 4.0 · 3D Secure
          </p>
        </div>
      )}
    </UserLayout>
  );
}

// ============================================================
// PÁGINA DE RESULTADO — URL de respuesta de PayPhone
// PayPhone redirige aquí con ?id=xxx&clientTransactionId=xxx
// ============================================================
export function UserPaymentResultPage() {
  const { gym } = useAuth();
  const primaryColor = gym?.primaryColor || '#E85D04';
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('loading'); // loading | success | error
  const [result, setResult] = useState(null);
  const confirmCalled = useRef(false);

  useEffect(() => {
    if (confirmCalled.current) return;
    confirmCalled.current = true;

    const id = searchParams.get('id');
    const clientTransactionId = searchParams.get('clientTransactionId');

    if (!id || !clientTransactionId) {
      setStatus('error');
      setResult({ message: 'Parámetros de pago inválidos' });
      return;
    }

    // Confirmar el pago con el backend (dentro de los 5 minutos)
    api.post('/usuario/payphone/confirm', { id, clientTransactionId })
      .then(r => {
        if (r.data.success) {
          setStatus('success');
          setResult(r.data);
        } else {
          setStatus('error');
          setResult(r.data);
        }
      })
      .catch(err => {
        setStatus('error');
        setResult({ message: err.response?.data?.error || 'Error al confirmar el pago' });
      });
  }, []);

  return (
    <UserLayout title="Resultado del Pago">
      <div className="flex flex-col items-center justify-center min-h-64 py-8">
        {status === 'loading' && (
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-t-transparent rounded-full animate-spin mx-auto mb-4"
              style={{ borderColor: primaryColor, borderTopColor: 'transparent' }} />
            <p className="font-bold text-lg">Confirmando pago con PayPhone...</p>
            <p className="text-sm opacity-50 mt-1">Por favor espera, esto puede tomar unos segundos.</p>
          </div>
        )}

        {status === 'success' && (
          <div className="text-center w-full">
            <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check size={32} className="text-white" />
            </div>
            <p className="text-2xl font-black text-green-400 mb-2">¡Pago Exitoso!</p>
            <p className="text-sm opacity-60 mb-4">¡Pago aprobado! Tu membresía ha sido renovada.</p>

            {result?.membership && (
              <div className="rounded-2xl p-4 mb-5 text-left border border-green-500/30"
                style={{ background: 'rgba(22,163,74,0.1)' }}>
                <p className="font-bold text-green-400 mb-2">{result.membership.typeName}</p>
                <p className="text-xs opacity-60">Inicio: {result.membership.startDate}</p>
                <p className="text-xs opacity-60">Válida hasta: {result.membership.endDate}</p>
                {result.transaction?.authorizationCode && (
                  <p className="text-xs opacity-40 mt-2">Auth: {result.transaction.authorizationCode}</p>
                )}
              </div>
            )}

            <button onClick={() => navigate('/usuario/home')}
              className="w-full py-3.5 rounded-xl font-bold text-white flex items-center justify-center gap-2"
              style={{ backgroundColor: primaryColor }}>
              🏠 Ir al inicio
            </button>
          </div>
        )}

        {status === 'error' && (
          <div className="text-center w-full">
            <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <X size={32} className="text-white" />
            </div>
            <p className="text-2xl font-black text-red-400 mb-2">Pago no completado</p>
            <p className="text-sm opacity-60 mb-6">
              {result?.message || 'El pago no pudo ser procesado. Intenta de nuevo.'}
            </p>

            <div className="flex flex-col gap-3">
              <button onClick={() => navigate(-1)}
                className="w-full py-3.5 rounded-xl font-bold border border-white/20 flex items-center justify-center gap-2 text-sm">
                <ArrowLeft size={16} /> Intentar de nuevo
              </button>
              <button onClick={() => navigate('/usuario/home')}
                className="w-full py-3 rounded-xl text-sm opacity-50">
                Volver al inicio
              </button>
            </div>
          </div>
        )}
      </div>
    </UserLayout>
  );
}

// ============================================================
// PÁGINA DE COBRO AUTOMÁTICO — estado y gestión de la tarjeta guardada
// ============================================================
export function UserAutoChargePage() {
  const { gym } = useAuth();
  const primaryColor = gym?.primaryColor || '#E85D04';
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [consentText] = useState(`AUTORIZACIÓN DE DÉBITO AUTOMÁTICO Y CONSENTIMIENTO DE TOKENIZACIÓN DE TARJETA

Fecha: ${new Date().toLocaleDateString('es-EC', { day: 'numeric', month: 'long', year: 'numeric' })}
Gimnasio: ${gym?.name || 'GymVIP'}

Por medio del presente instrumento, yo autorizo expresamente a ${gym?.name || 'GymVIP'} a:

1. TOKENIZACIÓN: Almacenar de forma segura el token de mi tarjeta de crédito/débito (Visa o Mastercard) proporcionado por el procesador de pagos PayPhone, con el único propósito de realizar cobros periódicos de membresía.

2. COBROS AUTOMÁTICOS: Autorizar cargos automáticos a mi tarjeta por el valor de mi membresía vigente al momento de la renovación.

3. RENOVACIÓN: Procesar la renovación automática de mi membresía al vencimiento del período contratado.

Esta autorización puede ser revocada en cualquier momento desde la configuración de mi perfil.`);

  const load = async () => {
    try {
      const r = await api.get('/usuario/payphone/auto-charge');
      setData(r.data);
    } catch { toast.error('Error al cargar'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleSignConsent = async () => {
    try {
      await api.post('/usuario/payphone/consent');
      toast.success('Consentimiento firmado');
      load();
    } catch { toast.error('Error al firmar'); }
  };

  const handleCancel = async () => {
    try {
      await api.delete('/usuario/payphone/auto-charge');
      toast.success('Cobro automático cancelado');
      load();
    } catch { toast.error('Error al cancelar'); }
  };

  if (loading) return (
    <UserLayout title="Cobro Automático" showBack>
      <div className="flex justify-center py-20"><Spinner size={24} className="opacity-30" /></div>
    </UserLayout>
  );

  return (
    <UserLayout title="Cobro Automatico de Membresia" showBack>
      {/* Estado actual */}
      <div className="rounded-2xl p-4 mb-4 border" style={{ background: '#1a1a1a', borderColor: 'rgba(255,255,255,0.06)' }}>
        <p className="text-xs opacity-50 font-semibold uppercase mb-3">Estado actual</p>
        <div className="flex items-center gap-2 mb-1.5">
          <span className="text-sm">💳</span>
          <p className={`text-sm ${data?.hasCard ? 'text-green-400' : 'opacity-40'}`}>
            {data?.hasCard
              ? `Tarjeta guardada - ${new Date(data.cardDate).toLocaleDateString('es-EC')}`
              : 'Sin tarjeta tokenizada'}
          </p>
        </div>
        <div className="flex items-center gap-2 mb-1.5">
          <span className="text-sm">🛡️</span>
          <p className={`text-sm ${data?.consentSigned ? 'text-green-400' : 'opacity-40'}`}>
            {data?.consentSigned
              ? `Consentimiento firmado - ${new Date(data.consentDate).toLocaleDateString('es-EC')}`
              : 'Sin consentimiento activo'}
          </p>
        </div>
        {data?.autoRenewActive && (
          <div className="mt-2 px-3 py-2 rounded-xl bg-green-500/20 border border-green-500/30">
            <p className="text-green-400 text-sm font-bold">✓ Renovacion automatica habilitada</p>
          </div>
        )}
      </div>

      {!data?.consentSigned ? (
        /* Formulario de consentimiento */
        <div className="rounded-2xl p-4 mb-4 border" style={{ background: '#1a1a1a', borderColor: 'rgba(255,255,255,0.06)' }}>
          <p className="font-bold mb-3">Contrato de Consentimiento</p>
          <p className="text-xs opacity-40 mb-3">Version 1.0</p>
          <div className="rounded-xl p-4 max-h-48 overflow-y-auto mb-4 text-xs opacity-60 leading-relaxed"
            style={{ background: 'rgba(255,255,255,0.04)' }}>
            {consentText}
          </div>
          <label className="flex items-start gap-3 cursor-pointer mb-4">
            <input type="checkbox" id="consent-check" className="mt-0.5 w-4 h-4 flex-shrink-0" />
            <span className="text-xs opacity-60">He leído y acepto los terminos del contrato de autorizacion de debito automatico</span>
          </label>
          <button onClick={handleSignConsent}
            className="w-full py-3.5 rounded-xl font-bold text-white flex items-center justify-center gap-2"
            style={{ backgroundColor: '#16a34a' }}>
            ✍ Firmar y habilitar cobro automatico
          </button>
        </div>
      ) : (
        /* Ya firmado — opciones de pago */
        <div className="flex flex-col gap-3 mb-4">
          {data?.hasCard ? (
            <>
              <button onClick={() => navigate('/usuario/home')}
                className="w-full py-3.5 rounded-xl font-bold text-white flex items-center justify-center gap-2"
                style={{ backgroundColor: '#16a34a' }}>
                💳 Pagar con tarjeta guardada
              </button>
              <button onClick={() => navigate('/usuario/home')}
                className="w-full py-3 rounded-xl font-semibold text-sm border flex items-center justify-center gap-2"
                style={{ borderColor: primaryColor, color: primaryColor }}>
                💳 Pagar con nueva tarjeta
              </button>
            </>
          ) : (
            <p className="text-sm opacity-50 text-center py-4">
              Realiza un pago con PayPhone para guardar tu tarjeta automáticamente
            </p>
          )}

          {/* Contrato firmado resumido */}
          <div className="rounded-2xl p-4 border" style={{ background: '#1a1a1a', borderColor: 'rgba(255,255,255,0.06)' }}>
            <p className="font-bold text-sm mb-2">Contrato firmado</p>
            <p className="text-xs opacity-40 mb-2">Version 1.0</p>
            <div className="text-xs opacity-40 leading-relaxed max-h-24 overflow-hidden"
              style={{ maskImage: 'linear-gradient(to bottom, black 60%, transparent 100%)' }}>
              {consentText.substring(0, 300)}...
            </div>
          </div>

          <button onClick={handleCancel}
            className="w-full py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 border border-red-500/30 text-red-400">
            ✕ Cancelar suscripcion automatica
          </button>

          {/* Historial de pagos PayPhone */}
          {data?.payphonePayments?.length > 0 && (
            <div className="rounded-2xl p-4 border" style={{ background: '#1a1a1a', borderColor: 'rgba(255,255,255,0.06)' }}>
              <p className="font-bold text-sm mb-3">Historial de pagos PayPhone</p>
              {data.payphonePayments.map((p, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b last:border-0"
                  style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                  <div>
                    <p className="text-sm font-medium">{p.membership_name}</p>
                    <p className="text-xs opacity-40">{new Date(p.created_at).toLocaleDateString('es-EC', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-green-400">${parseFloat(p.amount).toFixed(2)}</p>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/20 text-green-400">{p.status}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </UserLayout>
  );
}
