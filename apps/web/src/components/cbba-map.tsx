'use client';

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { PublicStation } from '@/components/station-types';

const COLORS: Record<PublicStation['availability'], string> = {
  FULL: '#1a7a3c',
  MEDIUM: '#d35a00',
  LOW: '#c47a00',
  EMPTY: '#b83228',
  UNKNOWN: '#4d5f68',
};

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
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<Map<string, L.CircleMarker>>(new Map());
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;

  useEffect(() => {
    if (!ref.current || stations.length === 0) return;

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

    const bounds: L.LatLngExpression[] = [];
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
    if (bounds.length > 1) {
      map.fitBounds(L.latLngBounds(bounds as L.LatLngTuple[]), {
        padding: [28, 28],
      });
    }

    return () => {
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
