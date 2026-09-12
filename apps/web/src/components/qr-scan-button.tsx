'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import jsQR from '@/vendor/jsqr';

type Props = {
  onToken?: (tokenId: string) => void;
};

/**
 * Escáner QR multi-navegador (cámara + foto).
 * Usa BarcodeDetector si existe; si no, jsQR sobre canvas (Firefox, Safari, etc.).
 * Extrae /c/TOKEN (cisterna) o /q/TOKEN (bastón).
 */
export function QrScanButton({ onToken }: Props) {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [open, setOpen] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const handledRef = useRef(false);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    handledRef.current = false;

    async function start() {
      setMsg(null);
      const video = videoRef.current;
      if (!video) return;

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' } },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        video.srcObject = stream;
        await video.play();

        if ('BarcodeDetector' in window) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const Detector = (window as any).BarcodeDetector;
          const detector = new Detector({ formats: ['qr_code'] });
          const tick = async () => {
            if (cancelled || handledRef.current) return;
            if (video.readyState >= 2) {
              try {
                const codes = await detector.detect(video);
                const raw = codes?.[0]?.rawValue as string | undefined;
                if (raw) acceptRaw(raw);
              } catch {
                /* ignore frame errors */
              }
            }
            if (!cancelled && !handledRef.current) {
              rafRef.current = window.setTimeout(() => void tick(), 350);
            }
          };
          void tick();
          return;
        }

        const canvas = canvasRef.current;
        if (!canvas) {
          setMsg('No se pudo iniciar el decodificador QR.');
          return;
        }
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) {
          setMsg('No se pudo iniciar el decodificador QR.');
          return;
        }

        const tickJs = () => {
          if (cancelled || handledRef.current) return;
          if (video.readyState >= 2) {
            const w = video.videoWidth;
            const h = video.videoHeight;
            if (w > 0 && h > 0) {
              canvas.width = w;
              canvas.height = h;
              ctx.drawImage(video, 0, 0, w, h);
              const image = ctx.getImageData(0, 0, w, h);
              const code = jsQR(image.data, image.width, image.height, {
                inversionAttempts: 'attemptBoth',
              });
              if (code?.data) acceptRaw(code.data);
            }
          }
          if (!cancelled && !handledRef.current) {
            rafRef.current = window.setTimeout(tickJs, 250);
          }
        };
        tickJs();
      } catch {
        if (!cancelled) {
          setMsg(
            'No se pudo abrir la cámara. Revisá permisos del navegador o subí una foto.',
          );
        }
      }
    }

    function acceptRaw(raw: string) {
      if (handledRef.current) return;
      const token = extractToken(raw);
      if (!token) {
        setMsg('QR leído, pero no es un código FuelChain válido.');
        return;
      }
      handledRef.current = true;
      stopCamera();
      setOpen(false);
      if (onToken) onToken(token);
      else router.push(routeForToken(token));
    }

    function stopCamera() {
      if (rafRef.current != null) {
        clearTimeout(rafRef.current);
        rafRef.current = null;
      }
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
      if (videoRef.current) videoRef.current.srcObject = null;
    }

    void start();

    return () => {
      cancelled = true;
      stopCamera();
    };
  }, [open, onToken, router]);

  async function onFile(file: File) {
    setMsg(null);
    try {
      const raw = await decodeQrFromFile(file);
      const token = raw ? extractToken(raw) : null;
      if (!token) {
        setMsg('No se encontró un QR de cisterna o bastón en la imagen.');
        return;
      }
      if (onToken) onToken(token);
      else router.push(routeForToken(token));
    } catch {
      setMsg('No se pudo leer la imagen. Probá otra foto más nítida.');
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="fc-btn fc-btn-ghost"
        >
          {open ? 'Cerrar cámara' : 'Escanear QR'}
        </button>
        <label className="fc-btn fc-btn-ghost cursor-pointer">
          Subir foto QR
          <input
            type="file"
            accept="image/*"
            capture="environment"
            className="sr-only"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void onFile(f);
              e.target.value = '';
            }}
          />
        </label>
      </div>
      {open && (
        <>
          <video
            ref={videoRef}
            className="max-h-64 w-full border border-[var(--ink)] bg-black object-cover"
            muted
            playsInline
          />
          <canvas ref={canvasRef} className="hidden" aria-hidden />
        </>
      )}
      {msg && <p className="text-sm text-[var(--mute)]">{msg}</p>}
    </div>
  );
}

async function decodeQrFromFile(file: File): Promise<string | null> {
  if ('BarcodeDetector' in window) {
    try {
      const bmp = await createImageBitmap(file);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const Detector = (window as any).BarcodeDetector;
      const detector = new Detector({ formats: ['qr_code'] });
      const codes = await detector.detect(bmp);
      const raw = codes?.[0]?.rawValue as string | undefined;
      if (raw) return raw;
    } catch {
      /* fall through to jsQR */
    }
  }

  const bitmap = await createImageBitmap(file);
  const canvas = document.createElement('canvas');
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return null;
  ctx.drawImage(bitmap, 0, 0);
  const image = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const code = jsQR(image.data, image.width, image.height, {
    inversionAttempts: 'attemptBoth',
  });
  return code?.data ?? null;
}

function extractToken(raw: string): string | null {
  try {
    const u = new URL(raw, 'http://local');
    const cistern = u.pathname.match(/\/c\/([^/?#]+)/);
    if (cistern?.[1]) return decodeURIComponent(cistern[1]);
    const m = u.pathname.match(/\/q\/([^/?#]+)/);
    if (m?.[1]) return decodeURIComponent(m[1]);
  } catch {
    /* plain token */
  }
  const trimmed = raw.trim();
  if (/^CQ-[A-Z0-9-]+$/i.test(trimmed)) return trimmed;
  if (/^GW-CIS-/i.test(trimmed)) return trimmed;
  if (/^CIS-[A-Z0-9-]+$/i.test(trimmed)) return trimmed;
  if (/^BT-[A-Z0-9]+$/i.test(trimmed)) return trimmed;
  const c2 = raw.match(/\/c\/([A-Za-z0-9_-]+)/);
  if (c2?.[1]) return c2[1];
  const m2 = raw.match(/\/q\/([A-Za-z0-9_-]+)/);
  return m2?.[1] ?? null;
}

function routeForToken(token: string): string {
  if (/^(CQ-|GW-|CIS-)/i.test(token)) return `/c/${token}`;
  return `/q/${token}`;
}
