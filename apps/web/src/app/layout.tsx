import type { Metadata } from 'next';
import { Chivo, IBM_Plex_Sans } from 'next/font/google';
import './globals.css';
import { AppShell } from '@/components/app-shell';

const chivo = Chivo({
  variable: '--font-chivo',
  subsets: ['latin'],
  weight: ['400', '600', '700', '900'],
});

const plex = IBM_Plex_Sans({
  variable: '--font-plex',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
});

export const metadata: Metadata = {
  title: 'FuelChain Bolivia',
  description: 'Cada litro. Cada movimiento. Cada evidencia.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={`${chivo.variable} ${plex.variable} antialiased`}>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
