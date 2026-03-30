import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: "Xaranga L'Espurna — Peticions",
  description: "Demana la teua cançó a la Xaranga L'Espurna",
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#004aad',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ca-ES">
      <body>{children}</body>
    </html>
  );
}
