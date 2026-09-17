import type { Metadata, Viewport } from 'next';
import { Inter_Tight, Instrument_Serif, JetBrains_Mono } from 'next/font/google';
import './globals.css';

const interTight = Inter_Tight({
  subsets: ['latin'],
  variable: '--font-inter-tight',
  display: 'swap',
});

const instrument = Instrument_Serif({
  subsets: ['latin'],
  weight: '400',
  style: ['normal', 'italic'],
  variable: '--font-instrument',
  display: 'swap',
});

const mono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono-face',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL('https://risksense-ai.vercel.app'),
  title: {
    default: 'RiskSense AI — Know your risk before it becomes your reality',
    template: '%s — RiskSense AI',
  },
  description:
    'RiskSense AI turns patient health information into decision-support risk estimates for heart disease and diabetes, reviewed with a connected clinician. Walk the district to see how it works.',
  keywords: [
    'RiskSense AI',
    'health risk analysis',
    'heart disease risk',
    'diabetes risk',
    'clinical decision support',
    'zero trust healthcare',
  ],
  openGraph: {
    title: 'RiskSense AI — Know your risk before it becomes your reality',
    description:
      'Decision-support risk estimates for heart disease and diabetes, connected to your clinician. Enter the RiskSense District.',
    type: 'website',
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: '#04070f',
  colorScheme: 'dark',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${interTight.variable} ${instrument.variable} ${mono.variable}`}
    >
      <body className="antialiased">{children}</body>
    </html>
  );
}
