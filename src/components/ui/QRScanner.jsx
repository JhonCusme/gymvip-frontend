import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

export default function QRScanner({ onScan, onError }) {
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState(null);
  const scannerRef = useRef(null);
  const html5QrRef = useRef(null);

  const startScanner = async () => {
    setError(null);
    try {
      const scanner = new Html5Qrcode('qr-reader');
      html5QrRef.current = scanner;

      await scanner.start(
        { facingMode: 'environment' }, // cámara trasera
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText) => {
          onScan(decodedText);
          stopScanner();
        },
        () => {} // ignorar errores de frame
      );
      setScanning(true);
    } catch (err) {
      setError('No se pudo acceder a la cámara. Verifica los permisos.');
      if (onError) onError(err);
    }
  };

  const stopScanner = async () => {
    if (html5QrRef.current) {
      try {
        await html5QrRef.current.stop();
        html5QrRef.current.clear();
      } catch {}
      html5QrRef.current = null;
    }
    setScanning(false);
  };

  useEffect(() => {
    return () => { stopScanner(); };
  }, []);

  return (
    <div className="flex flex-col gap-3">
      <div
        id="qr-reader"
        className="rounded-xl overflow-hidden w-full"
        style={{ minHeight: '200px', background: '#111' }}
      />
      {!scanning && !error && (
        <div className="flex items-center justify-center h-40 rounded-xl" style={{ background: '#111' }}>
          <div className="text-center opacity-30">
            <div className="text-4xl mb-2">📷</div>
            <p className="text-xs">Presiona "Iniciar" para escanear</p>
          </div>
        </div>
      )}
      {error && (
        <div className="p-3 rounded-xl text-xs text-red-400" style={{ background: 'rgba(220,38,38,0.1)' }}>
          ⚠ {error}
        </div>
      )}
      <button
        onClick={scanning ? stopScanner : startScanner}
        className="w-full py-3 rounded-xl font-bold text-white flex items-center justify-center gap-2"
        style={{ backgroundColor: scanning ? '#374151' : 'var(--color-primary)' }}
      >
        📷 {scanning ? 'Detener Escáner' : 'Iniciar Escáner'}
      </button>
    </div>
  );
}