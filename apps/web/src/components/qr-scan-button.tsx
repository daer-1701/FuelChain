'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

type Props = {
  onToken?: (tokenId: string) => void;
};

/** Escáner QR con cámara (BarcodeDetector) o foto. Extrae /c/TOKEN (cisterna) o /q/TOKEN (bastón). */
export function QrScanButton({ onToken }: Props) {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [open, setOpen] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    let timer: ReturnType<typeof setInterval> | null = null;

    async function start() {
      setMsg(null);
      try {
        if (!('BarcodeDetector' in window)) {
          setMsg(
            'Este navegador no lee QR por cámara. Usá el link del chofer o subí una foto.',
          );
          return;
        }
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const Detector = (window as any).BarcodeDetector;
        const detector = new Detector({ formats: ['qr_code'] });
        timer = setInterval(async () => {
          if (!videoRef.current || videoRef.current.readyState < 2) return;
          try {
            const codes = await detector.detect(videoRef.current);
            const raw = codes?.[0]?.rawValue as string | undefined;
            if (!raw) return;
            const token = extractToken(raw);
            if (token) {
              stop();
              setOpen(false);
              if (onToken) onToken(token);
              else router.push(routeForToken(token));
            }
          } catch {
            /* ignore frame errors */
          }
        }, 500);
      } catch {
        setMsg('No se pudo abrir la cámara. Revisá permisos del navegador.');
      }
    }

    function stop() {
      if (timer) clearInterval(timer);
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }

    void start();
    return () => {
      cancelled = true;
      stop();
    };
  }, [open, onToken, router]);

  async function onFile(file: File) {
    setMsg(null);
    try {
      if (!('BarcodeDetector' in window)) {
        setMsg('Este navegador no decodifica QR desde foto.');
        return;
      }
      const bmp = await createImageBitmap(file);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const Detector = (window as any).BarcodeDetector;
      const detector = new Detector({ formats: ['qr_code'] });
      const codes = await detector.detect(bmp);
      const raw = codes?.[0]?.rawValue as string | undefined;
      const token = raw ? extractToken(raw) : null;
      if (!token) {
        setMsg('No se encontró un QR de bastón en la imagen.');
        return;
      }
      if (onToken) onToken(token);
      else router.push(routeForToken(token));
    } catch {
      setMsg('No se pudo leer la imagen.');
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
            }}
          />
        </label>
      </div>
      {open && (
        <video
          ref={videoRef}
          className="max-h-64 w-full border border-[var(--ink)] bg-black object-cover"
          muted
          playsInline
        />
      )}
      {msg && <p className="text-sm text-[var(--mute)]">{msg}</p>}
    </div>
  );
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
