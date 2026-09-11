'use client';

import { CbbaStationsExplorer } from '@/components/cbba-stations-explorer';
import type { PublicStation } from '@/components/station-types';

/** Compat: el explorador con detalle reemplaza la sección simple. */
export function CbbaMapSection({ stations }: { stations: PublicStation[] }) {
  return <CbbaStationsExplorer stations={stations} />;
}
