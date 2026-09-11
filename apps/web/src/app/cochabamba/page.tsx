import { redirect } from 'next/navigation';

/** Alias canónico del piloto Cochabamba → mapa ciudadano. */
export default function CochabambaAliasPage() {
  redirect('/mapa');
}
