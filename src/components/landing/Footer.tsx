import Link from 'next/link';
import { HERO, SUPPORT_EMAIL } from '@/data/content';
import { Mark } from '@/components/ui/Wordmark';

const COLUMNS = [
  {
    title: 'Platform',
    links: [
      { label: 'Home', href: '/' },
      { label: 'Enter the District', href: '/world' },
      { label: 'Overview', href: '/overview' },
      { label: 'Complete Registration', href: '/register/complete' },
    ],
  },
  {
    title: 'Learn',
    links: [
      { label: 'How It Works', href: '/overview#journey' },
      { label: 'Risk Analysis', href: '/overview#analysis' },
      { label: 'Insurance Partners', href: '/overview#insurance' },
      { label: 'Security', href: '/overview#security' },
    ],
  },
  {
    title: 'Support',
    links: [
      { label: 'FAQ', href: '/overview#faq' },
      { label: 'Contact', href: `mailto:${SUPPORT_EMAIL}?subject=RiskSense%20AI%20support%20request` },
    ],
  },
  {
    title: 'Legal',
    links: [
      { label: 'Privacy Notice', href: '/privacy' },
      { label: 'Terms of Service', href: '/terms' },
      { label: 'Medical Disclaimer', href: '/medical-disclaimer' },
    ],
  },
];

export function Footer() {
  return (
    <footer className="relative overflow-hidden border-t border-white/8 bg-void px-5 pt-20 pb-8 sm:px-8 lg:px-12">
      <div className="mx-auto max-w-[1800px]">
        <div className="grid gap-12 lg:grid-cols-[1.4fr_2fr] lg:gap-20">
          <div>
            <Link href="/" className="inline-flex items-center gap-3 text-paper" aria-label="RiskSense AI — home">
              <Mark className="h-8 w-8 text-brass" />
              <span className="font-display text-xl font-normal tracking-[-0.03em]">
                RiskSense<span className="text-brass"> AI</span>
              </span>
            </Link>

            <p className="mt-6 max-w-[42ch] text-[0.92rem] leading-[1.7] text-paper/45">
              The public information and service-activation layer of RiskSense AI. The mobile
              application remains the primary patient health experience.
            </p>
          </div>

          <nav aria-label="Footer" className="grid grid-cols-2 gap-8 sm:grid-cols-4">
            {COLUMNS.map((col) => (
              <div key={col.title}>
                <h2 className="micro-sm text-brass/70">{col.title}</h2>
                <ul className="mt-5 space-y-3">
                  {col.links.map((link) => (
                    <li key={link.label}>
                      <Link
                        href={link.href}
                        className="text-[0.88rem] text-paper/55 transition-colors duration-300 hover:text-paper"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>

        <div className="rule mt-16 mb-7 text-paper" />

        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between lg:gap-16">
          <p className="max-w-3xl micro-sm leading-[1.95] text-paper/32">{HERO.disclaimer}</p>

          <div className="flex shrink-0 flex-col gap-2 micro-sm text-paper/30 lg:items-end">
            <p>&copy; {new Date().getFullYear()} RiskSense AI. All rights reserved.</p>
            <p className="text-warn/70">Academic prototype — demonstration environment</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
