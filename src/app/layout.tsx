import type { Metadata, Viewport } from 'next';
import { Bodoni_Moda, Jost } from 'next/font/google';
import './globals.css';

/** The marque voice: a Didone, for headlines and one italic phrase per view. */
const bodoni = Bodoni_Moda({
  subsets: ['latin'],
  style: ['normal', 'italic'],
  variable: '--font-bodoni',
  display: 'swap',
});

/** Everything with a job: geometric, light, and wide-tracked in its caps. */
const jost = Jost({
  subsets: ['latin'],
  variable: '--font-jost',
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
  themeColor: '#08070a',
  colorScheme: 'dark',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${bodoni.variable} ${jost.variable}`}
    >
      <body className="antialiased">{children}</body>
    </html>
  );
}
