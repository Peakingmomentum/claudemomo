import type { Metadata, Viewport } from 'next';
import '@/styles/globals.css';

export const metadata: Metadata = {
  title: 'Pocket Pilot — Your AI real estate copilot',
  description: 'AI copilot, lead pipeline, daily briefings, and automated outreach for real estate pros.',
  manifest: '/manifest.json',
  verification: { google: 'icHSyT_jk9isP7jZJ7ED93RIA4cB4Z7---C_6rtX5pA' },
};

export const viewport: Viewport = {
  themeColor: '#ffffff',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="light">
      <body>{children}</body>
    </html>
  );
}
