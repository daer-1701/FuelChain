'use client';

import { useEffect, useRef } from 'react';
import type { PublicStation } from '@/components/station-types';

const COLORS: Record<PublicStation['availability'], string> = {
  FULL: '#1a7a3c',
  MEDIUM: '#d35a00',
  LOW: '#c47a00',
  EMPTY: '#b83228',
  UNKNOWN: '#4d5f68',
};

type LeafletNs = {
  map: (el: HTMLElement) => LeafletMap;
  tileLayer: (
    url: string,
    opts: Record<string, unknown>,
  ) => { addTo: (m: LeafletMap) => void };
  circleMarker: (
    latlng: [number, number],
    opts: Record<string, unknown>,
  ) => LeafletMarker;
};

type LeafletMap = {
  setView: (c: [number, number], z: number) => LeafletMap;
  fitBounds: (b: [number, number][], o?: object) => void;
  remove: () => void;
  panTo: (c: [number, number], o?: object) => void;
};

type LeafletMarker = {
  addTo: (m: LeafletMap) => LeafletMarker;
  on: (event: string, fn: () => void) => LeafletMarker;
  setStyle: (opts: Record<string, unknown>) => void;
};

declare global {
  interface Window {
    L?: LeafletNs;
  }
}

function loadLeaflet(): Promise<LeafletNs> {
  return new Promise((resolve, reject) => {
    if (window.L) {
      resolve(window.L);
      return;
    }
    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link');
      link.id = 'leaflet-css';
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.async = true;
    script.onload = () =>
      window.L ? resolve(window.L) : reject(new Error('Leaflet no cargó'));
    script.onerror = () => reject(new Error('No se pudo cargar Leaflet'));
    document.body.appendChild(script);
  });
}

export function CbbaLeafletMap({
  stations,
  selectedCode,
  onSelect,
}: {
  stations: PublicStation[];
  selectedCode: string | null;
  onSelect: (code: string) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const markersRef = useRef<Map<string, LeafletMarker>>(new Map());
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;

  useEffect(() => {
    let cancelled = false;

    (async () => {
      if (!ref.current || stations.length === 0) return;
      const L = await loadLeaflet();
      if (cancelled || !ref.current) return;

      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        markersRef.current.clear();
      }

      const map = L.map(ref.current).setView([-17.3895, -66.1568], 12);
      mapRef.current = map;
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> · DEMO FuelChain',
        maxZoom: 18,
      }).addTo(map);

      const bounds: [number, number][] = [];
      for (const s of stations) {
        const lat = Number(s.latitude);
        const lng = Number(s.longitude);
        if (Number.isNaN(lat) || Number.isNaN(lng)) continue;
        bounds.push([lat, lng]);
        const marker = L.circleMarker([lat, lng], {
          radius: 10,
          color: '#102028',
          weight: 2,
          fillColor: COLORS[s.availability],
          fillOpacity: 0.9,
        }).addTo(map);
        marker.on('click', () => onSelectRef.current(s.code));
        markersRef.current.set(s.code, marker);
      }
      if (bounds.length > 1) map.fitBounds(bounds, { padding: [28, 28] });
    })().catch(() => {
      /* map optional if CDN blocked */
    });

    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
      markersRef.current.clear();
    };
  }, [stations]);

  useEffect(() => {
    for (const [code, marker] of markersRef.current) {
      const active = code === selectedCode;
      marker.setStyle({
        radius: active ? 14 : 10,
        weight: active ? 3 : 2,
        fillOpacity: active ? 1 : 0.9,
      });
    }
    if (!selectedCode || !mapRef.current) return;
    const s = stations.find((x) => x.code === selectedCode);
    if (!s) return;
    const lat = Number(s.latitude);
    const lng = Number(s.longitude);
    if (!Number.isNaN(lat) && !Number.isNaN(lng)) {
      mapRef.current.panTo([lat, lng]);
    }
  }, [selectedCode, stations]);

  return (
    <div
      ref={ref}
      className="h-[420px] w-full cursor-pointer border-2 border-[var(--ink)] bg-[#dce8d4]"
      role="application"
      aria-label="Mapa de surtidores. Clic en un punto para ver detalles."
    />
  );
}
