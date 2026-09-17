'use client';

import Link from 'next/link';
import { useCallback, useMemo, useState } from 'react';
import { INSURERS, type Insurer } from '@/data/insurers';
import { Mark } from '@/components/ui/Wordmark';
import { InsurerLogo } from '@/components/landing/Insurance';

/* -------------------------------------------------------------------------- */
/* Simulated backend                                                           */
/* -------------------------------------------------------------------------- */

/**
 * The prototype talks to nothing. Everything below stands in for the FastAPI
 * calls the real flow makes, with the same shape of success and failure.
 */

/** The only card this demo accepts. A real number is rejected on purpose. */
const DEMO_CARD = '4242424242424242';

const DEMO_CLINICIANS: Record<string, { name: string; specialty: string; practice: string }> = {
  'RS-2026-4471': {
    name: 'Dr. A. Mensah',
    specialty: 'Cardiology',
    practice: 'Northgate Medical Centre',
  },
  'RS-2026-1188': {
    name: 'Dr. L. Okafor',
    specialty: 'Internal Medicine',
    practice: 'Riverside Family Practice',
  },
};

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

/* -------------------------------------------------------------------------- */
/* Failure states — specification section 9                                    */
/* -------------------------------------------------------------------------- */

type Failure = {
  id: string;
  title: string;
  body: string;
  primary: string;
  secondary?: string;
};

const FAILURES: Failure[] = [
  {
    id: 'payment',
    title: 'The demo payment didn’t go through',
    body: 'Nothing was charged — this is a demonstration gateway. You can try the demo payment again or switch to activating with insurance instead.',
    primary: 'Try again',
    secondary: 'Use insurance instead',
  },
  {
    id: 'insurance',
    title: 'We couldn’t verify that cover',
    body: 'The membership details didn’t match a record for that provider. Check the policy or membership number and try once more.',
    primary: 'Check the details',
  },
  {
    id: 'clinician',
    title: 'That Clinician ID isn’t recognised',
    body: 'The identifier is either mistyped or belongs to a clinician who isn’t approved for RiskSense. No connection has been made. Ask your clinician to confirm their RiskSense Clinician ID.',
    primary: 'Re-enter the ID',
  },
  {
    id: 'expired',
    title: 'This registration link has expired',
    body: 'For your security, the link from the mobile app is short-lived. Open RiskSense on your phone and start access setup again to get a fresh one.',
    primary: 'Start over',
    secondary: 'Return to app',
  },
  {
    id: 'backend',
    title: 'We can’t reach RiskSense right now',
    body: 'The service is temporarily unavailable. Nothing has been lost — your account is unchanged and you can pick this up in a moment.',
    primary: 'Try again',
  },
  {
    id: 'activated',
    title: 'This account is already active',
    body: 'Access has already been activated for this account. Head back to the RiskSense app and sign in — there is nothing left to do here.',
    primary: 'Return to app',
  },
  {
    id: 'incomplete',
    title: 'Some registration details are missing',
    body: 'The mobile app hasn’t finished sending your basic profile. Reopen RiskSense on your phone, complete the profile step, and come back.',
    primary: 'Return to app',
  },
];

/* -------------------------------------------------------------------------- */
/* Shared pieces                                                               */
/* -------------------------------------------------------------------------- */

const STEPS = [
  { id: 'welcome', label: 'Welcome' },
  { id: 'method', label: 'Access method' },
  { id: 'details', label: 'Verification' },
  { id: 'clinician', label: 'Clinician ID' },
  { id: 'review', label: 'Review' },
  { id: 'done', label: 'Activate' },
] as const;

type StepId = (typeof STEPS)[number]['id'];

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="micro-sm block text-paper/45">{label}</span>
      {children}
      {hint && <span className="mt-1.5 block micro-sm text-paper/28">{hint}</span>}
    </label>
  );
}

const inputClass =
  'mt-2 w-full border border-white/12 bg-white/[0.03] px-4 py-3.5 font-sans text-[0.95rem] text-paper placeholder:text-paper/22 transition-colors focus:border-cyan/60 focus:outline-none';

function Busy({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center gap-2.5">
      <span className="h-1.5 w-1.5 animate-blink rounded-full bg-current" />
      {label}
    </span>
  );
}

/* -------------------------------------------------------------------------- */

export function RegisterFlow() {
  const [step, setStep] = useState<StepId>('welcome');
  const [method, setMethod] = useState<'subscription' | 'insurance' | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [failure, setFailure] = useState<Failure | null>(null);

  // Subscription — the card number and CVV are held only for the field values
  // and are never stored, summarised or sent anywhere. Only the last four
  // digits survive into the review step.
  const [card, setCard] = useState({ name: '', number: '', expiry: '', cvv: '' });
  const [paidLast4, setPaidLast4] = useState<string | null>(null);

  // Insurance
  const [insurer, setInsurer] = useState<Insurer | null>(null);
  const [policy, setPolicy] = useState({
    number: '',
    memberId: '',
    holder: '',
    relationship: 'Self',
  });
  const [insuranceVerified, setInsuranceVerified] = useState(false);

  // Clinician
  const [clinicianId, setClinicianId] = useState('');
  const [clinician, setClinician] = useState<
    { name: string; specialty: string; practice: string } | null
  >(null);
  const [clinicianError, setClinicianError] = useState<string | null>(null);

  const [accepted, setAccepted] = useState(false);

  const stepIndex = STEPS.findIndex((s) => s.id === step);

  const mask = useCallback(
    (value: string) =>
      value.length <= 4 ? value : `${'•'.repeat(Math.max(0, value.length - 4))}${value.slice(-4)}`,
    [],
  );

  const detailsComplete =
    method === 'subscription'
      ? paidLast4 !== null
      : insuranceVerified && insurer !== null;

  /* --- simulated calls --------------------------------------------------- */

  const runDemoPayment = async () => {
    const digits = card.number.replace(/\s/g, '');
    if (digits !== DEMO_CARD) {
      setFailure(FAILURES[0]);
      return;
    }
    setBusy('payment');
    await wait(1200);
    setBusy(null);
    setPaidLast4(digits.slice(-4));
    // The full number and CVV are dropped the moment the demo "charge" returns.
    setCard((c) => ({ ...c, number: '', cvv: '' }));
    setStep('clinician');
  };

  const runInsuranceCheck = async () => {
    if (!insurer || policy.number.trim().length < 4 || policy.holder.trim().length < 2) {
      setFailure(FAILURES[1]);
      return;
    }
    setBusy('insurance');
    await wait(1200);
    setBusy(null);
    setInsuranceVerified(true);
    setStep('clinician');
  };

  const verifyClinician = async () => {
    setClinicianError(null);
    const id = clinicianId.trim().toUpperCase();
    setBusy('clinician');
    await wait(900);
    setBusy(null);

    const match = DEMO_CLINICIANS[id];
    if (!match) {
      setClinician(null);
      setClinicianError(
        'That ID isn’t recognised, or the clinician isn’t approved for RiskSense. No connection has been made — check the ID with your clinician.',
      );
      return;
    }
    setClinician(match);
  };

  const activate = async () => {
    setBusy('activate');
    await wait(1500);
    setBusy(null);
    setStep('done');
  };

  const reset = () => {
    setStep('welcome');
    setMethod(null);
    setCard({ name: '', number: '', expiry: '', cvv: '' });
    setPaidLast4(null);
    setInsurer(null);
    setPolicy({ number: '', memberId: '', holder: '', relationship: 'Self' });
    setInsuranceVerified(false);
    setClinicianId('');
    setClinician(null);
    setClinicianError(null);
    setAccepted(false);
    setFailure(null);
  };

  const summary = useMemo(
    () => [
      {
        k: 'Access method',
        v: method === 'subscription' ? 'RiskSense Subscription' : 'Insurance provider',
      },
      ...(method === 'subscription'
        ? [{ k: 'Demo payment', v: paidLast4 ? `Card ending ${paidLast4} · no charge made` : '—' }]
        : [
            { k: 'Provider', v: insurer?.name ?? '—' },
            { k: 'Policy / membership', v: policy.number ? mask(policy.number) : '—' },
            { k: 'Member ID', v: policy.memberId ? mask(policy.memberId) : 'Not supplied' },
            { k: 'Policy holder', v: policy.holder || '—' },
            { k: 'Relationship', v: policy.relationship },
          ]),
      { k: 'Clinician', v: clinician ? `${clinician.name} · ${clinician.specialty}` : '—' },
      { k: 'Clinician ID', v: clinicianId ? clinicianId.toUpperCase() : '—' },
      { k: 'Account status', v: 'Registered · awaiting activation' },
    ],
    [method, paidLast4, insurer, policy, clinician, clinicianId, mask],
  );

  return (
    <div className="min-h-[100svh] bg-ink">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-white/8 bg-ink/85">
        <div className="mx-auto flex h-16 max-w-[1500px] items-center justify-between gap-4 px-5 sm:px-8">
          <Link href="/" className="flex items-center gap-2.5 text-paper" aria-label="RiskSense AI — home">
            <Mark className="h-5 w-5 text-cyan" />
            <span className="font-display text-[0.95rem] font-semibold tracking-[-0.03em]">
              RiskSense<span className="text-cyan"> AI</span>
            </span>
          </Link>

          <p className="hidden micro-sm text-paper/40 sm:block">Complete your access setup</p>

          <span className="rounded-full border border-warn/35 bg-warn/10 px-3.5 py-1.5 micro-sm text-warn">
            Demo environment
          </span>
        </div>

        <div className="h-px w-full bg-white/8">
          <div
            className="h-full bg-cyan transition-[width] duration-700 ease-[var(--ease-out-expo)]"
            style={{ width: `${((stepIndex + 1) / STEPS.length) * 100}%` }}
          />
        </div>
      </header>

      <div className="mx-auto grid max-w-[1500px] gap-10 px-5 py-12 sm:px-8 sm:py-16 lg:grid-cols-[16rem_1fr] lg:gap-20">
        {/* Progress rail */}
        <nav aria-label="Registration progress" className="lg:sticky lg:top-28 lg:self-start">
          <ol className="flex gap-4 overflow-x-auto pb-2 lg:block lg:space-y-1 lg:overflow-visible lg:pb-0">
            {STEPS.map((s, i) => {
              const state = i < stepIndex ? 'done' : i === stepIndex ? 'now' : 'todo';
              return (
                <li key={s.id} className="shrink-0">
                  <div className="flex items-center gap-3 py-1.5">
                    <span
                      className={`grid h-6 w-6 shrink-0 place-items-center rounded-full font-mono text-[0.6rem] transition-colors ${
                        state === 'done'
                          ? 'bg-cyan/20 text-cyan'
                          : state === 'now'
                            ? 'bg-cyan text-ink'
                            : 'border border-white/15 text-paper/30'
                      }`}
                    >
                      {state === 'done' ? '✓' : String(i + 1).padStart(2, '0')}
                    </span>
                    <span
                      className={`micro-sm whitespace-nowrap ${
                        state === 'todo' ? 'text-paper/30' : 'text-paper/75'
                      }`}
                    >
                      {s.label}
                    </span>
                  </div>
                </li>
              );
            })}
          </ol>

          <p className="mt-8 hidden border border-white/10 bg-white/[0.02] p-4 micro-sm leading-[1.85] text-paper/32 lg:block">
            Your account already exists. Access to risk analysis is granted once this setup and the
            clinician connection are both complete.
          </p>
        </nav>

        {/* Step content */}
        <main id="main" className="min-w-0">
          {/* --- Welcome ---------------------------------------------------- */}
          {step === 'welcome' && (
            <section className="animate-rise">
              <p className="micro text-cyan">Step 01 · Welcome</p>
              <h1 className="mt-6 display-l text-paper text-balance">
                Your account exists. <span className="editorial text-cyan">Access doesn’t yet.</span>
              </h1>
              <p className="mt-6 max-w-[58ch] text-[1rem] leading-[1.68] text-paper/62">
                You started registration in the RiskSense app and it handed you here over a secure,
                short-lived link. There are three things left: choose how you’re paying for access,
                connect your clinician, and activate.
              </p>

              <ul className="mt-10 grid gap-px overflow-hidden border border-white/10 bg-white/10 sm:grid-cols-3">
                {[
                  { k: 'Account', v: 'Created', tone: 'ok' },
                  { k: 'Access', v: 'Not activated', tone: 'warn' },
                  { k: 'Clinician', v: 'Not connected', tone: 'warn' },
                ].map((row) => (
                  <li key={row.k} className="bg-ink p-5">
                    <p className="micro-sm text-paper/35">{row.k}</p>
                    <p
                      className={`mt-2.5 font-display text-[1.05rem] font-semibold tracking-[-0.02em] ${
                        row.tone === 'ok' ? 'text-ok' : 'text-warn'
                      }`}
                    >
                      {row.v}
                    </p>
                  </li>
                ))}
              </ul>

              <button
                type="button"
                onClick={() => setStep('method')}
                className="mt-10 rounded-full bg-cyan px-7 py-4 micro text-ink transition-opacity hover:opacity-85"
              >
                Continue
              </button>
            </section>
          )}

          {/* --- Access method ---------------------------------------------- */}
          {step === 'method' && (
            <section className="animate-rise">
              <p className="micro text-cyan">Step 02 · Access method</p>
              <h1 className="mt-6 display-l text-paper text-balance">
                How would you like to activate?
              </h1>
              <p className="mt-6 max-w-[58ch] text-[1rem] leading-[1.68] text-paper/62">
                Either route gets you the same access. Only the form for the option you pick is
                shown.
              </p>

              <div className="mt-10 grid gap-4 sm:grid-cols-2">
                {[
                  {
                    id: 'subscription' as const,
                    title: 'RiskSense Subscription',
                    lede: 'Pay for access directly.',
                    points: ['Supported risk analyses', 'Clinician connection', 'Health monitoring'],
                  },
                  {
                    id: 'insurance' as const,
                    title: 'Insurance',
                    lede: 'Activate through a supported provider.',
                    points: ['Choose your provider', 'Confirm membership', 'Eligibility checked'],
                  },
                ].map((opt) => {
                  const selected = method === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setMethod(opt.id)}
                      aria-pressed={selected}
                      className={`border p-6 text-left transition-colors duration-400 sm:p-7 ${
                        selected
                          ? 'border-cyan bg-cyan/8'
                          : 'border-white/12 bg-white/[0.02] hover:border-white/28'
                      }`}
                    >
                      <span className="flex items-start justify-between gap-4">
                        <span className="font-display text-[1.3rem] leading-tight font-semibold tracking-[-0.03em] text-paper">
                          {opt.title}
                        </span>
                        <span
                          className={`mt-1 grid h-5 w-5 shrink-0 place-items-center rounded-full border ${
                            selected ? 'border-cyan bg-cyan' : 'border-white/25'
                          }`}
                        >
                          {selected && (
                            <svg viewBox="0 0 10 10" className="h-2.5 w-2.5 text-ink" fill="none" aria-hidden="true">
                              <path d="m2 5 2 2 4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          )}
                        </span>
                      </span>

                      <span className="mt-2 block text-[0.9rem] text-paper/55">{opt.lede}</span>

                      <span className="mt-5 block space-y-1.5">
                        {opt.points.map((p) => (
                          <span key={p} className="flex items-center gap-2.5 micro-sm text-paper/45">
                            <span className="h-1 w-1 rounded-full bg-cyan/60" />
                            {p}
                          </span>
                        ))}
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="mt-10 flex flex-wrap gap-3">
                <button
                  type="button"
                  disabled={!method}
                  onClick={() => setStep('details')}
                  className="rounded-full bg-cyan px-7 py-4 micro text-ink transition-opacity hover:opacity-85 disabled:opacity-25"
                >
                  Continue
                </button>
                <button
                  type="button"
                  onClick={() => setStep('welcome')}
                  className="rounded-full border border-white/14 px-7 py-4 micro text-paper/65 transition-colors hover:border-white/35 hover:text-paper"
                >
                  Back
                </button>
              </div>
            </section>
          )}

          {/* --- Subscription ------------------------------------------------ */}
          {step === 'details' && method === 'subscription' && (
            <section className="animate-rise">
              <p className="micro text-cyan">Step 03 · Subscription</p>
              <h1 className="mt-6 display-l text-paper text-balance">RiskSense access</h1>

              <div className="mt-9 border border-white/10 bg-white/[0.02] p-6 sm:p-8">
                <div className="flex flex-wrap items-baseline justify-between gap-4">
                  <div>
                    <p className="micro-sm text-cyan/70">Access package</p>
                    <p className="mt-2 font-display text-[1.6rem] font-semibold tracking-[-0.03em] text-paper">
                      RiskSense Patient Access
                    </p>
                  </div>
                  <p className="font-display text-[2rem] leading-none font-semibold tracking-[-0.04em] text-paper">
                    Demo
                    <span className="ml-2 align-middle micro-sm text-paper/35">no charge</span>
                  </p>
                </div>

                <ul className="mt-6 grid gap-2 sm:grid-cols-2">
                  {[
                    'Heart disease risk analysis',
                    'Diabetes v1 risk analysis (adults)',
                    'Connected clinician review',
                    'Health profile and monitoring',
                  ].map((f) => (
                    <li key={f} className="flex items-center gap-2.5 text-[0.88rem] text-paper/62">
                      <svg viewBox="0 0 12 12" className="h-3 w-3 shrink-0 text-ok" fill="none" aria-hidden="true">
                        <path d="m2.5 6.2 2.4 2.4L9.5 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      {f}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Demo gateway */}
              <div className="mt-5 border border-warn/30 bg-warn/[0.06] p-6 sm:p-8">
                <div className="flex items-center gap-3">
                  <span className="grid h-7 w-7 place-items-center rounded-full bg-warn/20">
                    <svg viewBox="0 0 16 16" className="h-3.5 w-3.5 text-warn" fill="none" aria-hidden="true">
                      <path d="M8 4.6v4.2M8 11.2v.1" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                      <circle cx="8" cy="8" r="6.6" stroke="currentColor" strokeWidth="1.2" />
                    </svg>
                  </span>
                  <p className="micro text-warn">Demonstration payment gateway</p>
                </div>

                <p className="mt-4 text-[0.9rem] leading-[1.65] text-paper/70">
                  No real payment is processed and no card details are stored. This form only accepts
                  the test card below — a real card number will be rejected.
                </p>

                <button
                  type="button"
                  onClick={() =>
                    setCard({
                      name: 'A. Patient',
                      number: '4242 4242 4242 4242',
                      expiry: '12/29',
                      cvv: '123',
                    })
                  }
                  className="mt-4 rounded-full border border-warn/40 px-4 py-2 micro-sm text-warn transition-colors hover:bg-warn/15"
                >
                  Fill the test card · 4242 4242 4242 4242
                </button>

                <div className="mt-7 grid gap-5 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <Field label="Name on card">
                      <input
                        className={inputClass}
                        value={card.name}
                        onChange={(e) => setCard({ ...card, name: e.target.value })}
                        placeholder="As printed on the card"
                        autoComplete="off"
                      />
                    </Field>
                  </div>

                  <div className="sm:col-span-2">
                    <Field label="Card number" hint="Test card only — never stored.">
                      <input
                        className={`${inputClass} font-mono tracking-[0.12em]`}
                        value={card.number}
                        onChange={(e) => setCard({ ...card, number: e.target.value })}
                        placeholder="4242 4242 4242 4242"
                        inputMode="numeric"
                        autoComplete="off"
                      />
                    </Field>
                  </div>

                  <Field label="Expiry">
                    <input
                      className={`${inputClass} font-mono`}
                      value={card.expiry}
                      onChange={(e) => setCard({ ...card, expiry: e.target.value })}
                      placeholder="MM/YY"
                      autoComplete="off"
                    />
                  </Field>

                  <Field label="CVV" hint="Never stored.">
                    <input
                      className={`${inputClass} font-mono`}
                      value={card.cvv}
                      onChange={(e) => setCard({ ...card, cvv: e.target.value })}
                      placeholder="123"
                      autoComplete="off"
                    />
                  </Field>
                </div>
              </div>

              <div className="mt-8 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={runDemoPayment}
                  disabled={busy !== null}
                  className="rounded-full bg-cyan px-7 py-4 micro text-ink transition-opacity hover:opacity-85 disabled:opacity-40"
                >
                  {busy === 'payment' ? <Busy label="Processing demo payment" /> : 'Run demo payment'}
                </button>
                <button
                  type="button"
                  onClick={() => setStep('method')}
                  className="rounded-full border border-white/14 px-7 py-4 micro text-paper/65 transition-colors hover:border-white/35 hover:text-paper"
                >
                  Back
                </button>
              </div>
            </section>
          )}

          {/* --- Insurance --------------------------------------------------- */}
          {step === 'details' && method === 'insurance' && (
            <section className="animate-rise">
              <p className="micro text-cyan">Step 03 · Insurance</p>
              <h1 className="mt-6 display-l text-paper text-balance">Choose your provider</h1>

              <p className="mt-5 border border-warn/30 bg-warn/[0.06] px-5 py-4 text-[0.88rem] leading-[1.6] text-paper/70">
                <span className="micro-sm mr-2 text-warn">Demonstration data</span>
                Every provider listed is a placeholder for the academic prototype, and insurance
                verification is simulated until a real insurer integration exists.
              </p>

              <ul className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {INSURERS.map((ins) => {
                  const selected = insurer?.id === ins.id;
                  return (
                    <li key={ins.id}>
                      <button
                        type="button"
                        disabled={!ins.enabled}
                        onClick={() => setInsurer(ins)}
                        aria-pressed={selected}
                        className={`flex h-full w-full flex-col items-start gap-3 border p-4 text-left transition-colors duration-300 ${
                          selected
                            ? 'border-cyan bg-cyan/8'
                            : ins.enabled
                              ? 'border-white/12 bg-white/[0.02] hover:border-white/28'
                              : 'cursor-not-allowed border-white/8 opacity-40'
                        }`}
                      >
                        <InsurerLogo insurer={ins} size={38} />
                        <span className="block text-[0.85rem] leading-tight font-semibold text-paper">
                          {ins.name}
                        </span>
                        <span className="micro-sm text-paper/35">
                          {ins.enabled ? ins.plan : 'Disabled'}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>

              {insurer && (
                <div className="animate-rise mt-8 border border-white/10 bg-white/[0.02] p-6 sm:p-8">
                  <div className="flex items-center gap-4">
                    <InsurerLogo insurer={insurer} size={44} />
                    <div>
                      <p className="font-display text-[1.1rem] font-semibold tracking-[-0.02em] text-paper">
                        {insurer.name}
                      </p>
                      <p className="mt-0.5 micro-sm text-paper/40">{insurer.plan}</p>
                    </div>
                  </div>

                  <div className="mt-7 grid gap-5 sm:grid-cols-2">
                    <Field label="Policy or membership number">
                      <input
                        className={`${inputClass} font-mono tracking-[0.1em]`}
                        value={policy.number}
                        onChange={(e) => setPolicy({ ...policy, number: e.target.value })}
                        placeholder="e.g. AH-9920-4471"
                        autoComplete="off"
                      />
                    </Field>

                    <Field label="Member ID" hint="Optional, where your provider issues one.">
                      <input
                        className={`${inputClass} font-mono tracking-[0.1em]`}
                        value={policy.memberId}
                        onChange={(e) => setPolicy({ ...policy, memberId: e.target.value })}
                        placeholder="e.g. 88213004"
                        autoComplete="off"
                      />
                    </Field>

                    <Field label="Policy holder name">
                      <input
                        className={inputClass}
                        value={policy.holder}
                        onChange={(e) => setPolicy({ ...policy, holder: e.target.value })}
                        placeholder="Name on the policy"
                        autoComplete="off"
                      />
                    </Field>

                    <Field label="Relationship to policy holder">
                      <select
                        className={inputClass}
                        value={policy.relationship}
                        onChange={(e) => setPolicy({ ...policy, relationship: e.target.value })}
                      >
                        {['Self', 'Spouse or partner', 'Child', 'Dependant', 'Other'].map((r) => (
                          <option key={r} value={r} className="bg-navy">
                            {r}
                          </option>
                        ))}
                      </select>
                    </Field>
                  </div>
                </div>
              )}

              <div className="mt-8 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={runInsuranceCheck}
                  disabled={!insurer || busy !== null}
                  className="rounded-full bg-cyan px-7 py-4 micro text-ink transition-opacity hover:opacity-85 disabled:opacity-25"
                >
                  {busy === 'insurance' ? <Busy label="Verifying cover" /> : 'Verify cover (simulated)'}
                </button>
                <button
                  type="button"
                  onClick={() => setStep('method')}
                  className="rounded-full border border-white/14 px-7 py-4 micro text-paper/65 transition-colors hover:border-white/35 hover:text-paper"
                >
                  Back
                </button>
              </div>
            </section>
          )}

          {/* --- Clinician ---------------------------------------------------- */}
          {step === 'clinician' && (
            <section className="animate-rise">
              <p className="micro text-cyan">Step 04 · Clinician ID</p>
              <h1 className="mt-6 display-l text-paper text-balance">
                Connect the clinician who will <span className="editorial text-ok">read</span> this.
              </h1>
              <p className="mt-6 max-w-[58ch] text-[1rem] leading-[1.68] text-paper/62">
                A Clinician ID is required whichever access method you chose. Your clinician gives
                you this identifier; RiskSense verifies it belongs to an approved clinician before
                any connection is made.
              </p>

              <div className="mt-9 border border-white/10 bg-white/[0.02] p-6 sm:p-8">
                <Field label="RiskSense Clinician ID" hint="Format: RS-0000-0000">
                  <div className="mt-2 flex flex-col gap-3 sm:flex-row">
                    <input
                      className={`${inputClass} mt-0 flex-1 font-mono tracking-[0.18em] uppercase`}
                      value={clinicianId}
                      onChange={(e) => {
                        setClinicianId(e.target.value);
                        setClinician(null);
                        setClinicianError(null);
                      }}
                      placeholder="RS-2026-4471"
                      autoComplete="off"
                    />
                    <button
                      type="button"
                      onClick={verifyClinician}
                      disabled={clinicianId.trim().length < 6 || busy !== null}
                      className="shrink-0 bg-paper px-6 py-3.5 micro text-ink transition-opacity hover:opacity-85 disabled:opacity-25"
                    >
                      {busy === 'clinician' ? <Busy label="Verifying" /> : 'Verify clinician'}
                    </button>
                  </div>
                </Field>

                <p className="mt-4 micro-sm leading-[1.8] text-paper/28">
                  Demo IDs for this prototype:{' '}
                  {Object.keys(DEMO_CLINICIANS).map((id, i) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => {
                        setClinicianId(id);
                        setClinician(null);
                        setClinicianError(null);
                      }}
                      className="text-cyan/70 underline underline-offset-4 transition-colors hover:text-cyan"
                    >
                      {id}
                      {i === 0 ? ' · ' : ''}
                    </button>
                  ))}
                </p>

                {clinician && (
                  <div className="animate-rise mt-6 border border-ok/25 bg-ok/[0.07] p-5">
                    <p className="flex items-center gap-2.5 micro-sm text-ok">
                      <svg viewBox="0 0 14 14" className="h-3.5 w-3.5" fill="none" aria-hidden="true">
                        <path d="m3 7.4 2.6 2.6L11 4.6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      Clinician verified
                    </p>
                    <p className="mt-3 font-display text-[1.15rem] font-semibold tracking-[-0.02em] text-paper">
                      {clinician.name}
                    </p>
                    <p className="mt-1 text-[0.88rem] text-paper/58">
                      {clinician.specialty} · {clinician.practice}
                    </p>
                    <p className="mt-3 micro-sm leading-[1.8] text-paper/30">
                      Only the minimum detail needed to confirm the match is shown.
                    </p>
                  </div>
                )}

                {clinicianError && (
                  <div className="animate-rise mt-6 border border-risk/30 bg-risk/[0.08] p-5">
                    <p className="micro-sm text-risk">Not connected</p>
                    <p className="mt-2.5 text-[0.9rem] leading-[1.6] text-paper/72">
                      {clinicianError}
                    </p>
                  </div>
                )}
              </div>

              <div className="mt-8 flex flex-wrap gap-3">
                <button
                  type="button"
                  disabled={!clinician || !detailsComplete}
                  onClick={() => setStep('review')}
                  className="rounded-full bg-cyan px-7 py-4 micro text-ink transition-opacity hover:opacity-85 disabled:opacity-25"
                >
                  Continue to review
                </button>
                <button
                  type="button"
                  onClick={() => setStep('details')}
                  className="rounded-full border border-white/14 px-7 py-4 micro text-paper/65 transition-colors hover:border-white/35 hover:text-paper"
                >
                  Back
                </button>
              </div>
            </section>
          )}

          {/* --- Review -------------------------------------------------------- */}
          {step === 'review' && (
            <section className="animate-rise">
              <p className="micro text-cyan">Step 05 · Review</p>
              <h1 className="mt-6 display-l text-paper text-balance">Check this over.</h1>

              <dl className="mt-9 overflow-hidden border border-white/10">
                {summary.map((row, i) => (
                  <div
                    key={row.k}
                    className={`flex flex-col gap-1 px-6 py-4 sm:flex-row sm:items-baseline sm:gap-8 ${
                      i % 2 === 0 ? 'bg-white/[0.02]' : ''
                    }`}
                  >
                    <dt className="micro-sm shrink-0 text-paper/40 sm:w-56">{row.k}</dt>
                    <dd className="font-sans text-[0.95rem] text-paper">{row.v}</dd>
                  </div>
                ))}
              </dl>

              <p className="mt-4 micro-sm leading-[1.9] text-paper/30">
                Membership and card details are masked here and are never persisted by RiskSense.
              </p>

              <label className="mt-8 flex cursor-pointer items-start gap-3.5 border border-white/10 bg-white/[0.02] p-5">
                <input
                  type="checkbox"
                  checked={accepted}
                  onChange={(e) => setAccepted(e.target.checked)}
                  className="mt-0.5 h-4 w-4 shrink-0 accent-[var(--color-cyan)]"
                />
                <span className="text-[0.88rem] leading-[1.6] text-paper/70">
                  I accept the{' '}
                  <Link href="/terms" className="text-cyan underline underline-offset-4">
                    Terms of Service
                  </Link>{' '}
                  and the{' '}
                  <Link href="/privacy" className="text-cyan underline underline-offset-4">
                    Privacy Notice
                  </Link>
                  , and I understand that RiskSense provides decision-support risk estimates and does
                  not diagnose disease.
                </span>
              </label>

              <div className="mt-8 flex flex-wrap gap-3">
                <button
                  type="button"
                  disabled={!accepted || busy !== null}
                  onClick={activate}
                  className="rounded-full bg-cyan px-7 py-4 micro text-ink transition-opacity hover:opacity-85 disabled:opacity-25"
                >
                  {busy === 'activate' ? <Busy label="Activating access" /> : 'Activate access'}
                </button>
                <button
                  type="button"
                  onClick={() => setStep('clinician')}
                  className="rounded-full border border-white/14 px-7 py-4 micro text-paper/65 transition-colors hover:border-white/35 hover:text-paper"
                >
                  Back
                </button>
              </div>
            </section>
          )}

          {/* --- Success -------------------------------------------------------- */}
          {step === 'done' && (
            <section className="animate-rise">
              <span className="grid h-14 w-14 place-items-center rounded-full bg-ok/15">
                <svg viewBox="0 0 24 24" className="h-7 w-7 text-ok" fill="none" aria-hidden="true">
                  <path d="m5 12.5 4.5 4.5L19 7.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>

              <p className="mt-7 micro text-ok">Step 06 · Activated</p>
              <h1 className="mt-6 display-l text-paper text-balance">
                Access is <span className="editorial text-ok">live</span>.
              </h1>

              <p className="mt-6 max-w-[58ch] text-[1rem] leading-[1.68] text-paper/62">
                Head back to the RiskSense app to carry on. The app checks your entitlement with the
                backend when you return — it doesn’t take this screen’s word for it.
              </p>

              <div className="mt-9 grid gap-px overflow-hidden border border-white/10 bg-white/10 sm:grid-cols-3">
                {[
                  { k: 'Access', v: 'Activated' },
                  { k: 'Clinician', v: clinician?.name ?? 'Connected' },
                  {
                    k: 'Method',
                    v: method === 'subscription' ? 'Subscription (demo)' : insurer?.name ?? 'Insurance',
                  },
                ].map((row) => (
                  <div key={row.k} className="bg-ink p-5">
                    <p className="micro-sm text-paper/35">{row.k}</p>
                    <p className="mt-2.5 font-display text-[1rem] font-semibold tracking-[-0.02em] text-ok">
                      {row.v}
                    </p>
                  </div>
                ))}
              </div>

              <div className="mt-9 flex flex-wrap gap-3">
                <a
                  href="risksense://return?status=activated"
                  className="rounded-full bg-cyan px-7 py-4 micro text-ink transition-opacity hover:opacity-85"
                >
                  Return to RiskSense
                </a>
                <Link
                  href="/world"
                  className="rounded-full border border-white/14 px-7 py-4 micro text-paper/65 transition-colors hover:border-cyan/50 hover:text-cyan"
                >
                  Explore the district
                </Link>
                <button
                  type="button"
                  onClick={reset}
                  className="rounded-full border border-white/14 px-7 py-4 micro text-paper/45 transition-colors hover:border-white/35 hover:text-paper"
                >
                  Run the demo again
                </button>
              </div>

              <p className="mt-6 micro-sm leading-[1.9] text-paper/28">
                The deep link above is what a real device would follow. In a desktop browser it will
                simply do nothing.
              </p>
            </section>
          )}

          {/* --- Failure state explorer (specification section 9) -------------- */}
          <details className="mt-16 border border-white/10 bg-white/[0.02] p-5">
            <summary className="cursor-pointer micro-sm text-paper/40 transition-colors hover:text-paper/70">
              Failure and recovery states
            </summary>
            <p className="mt-4 text-[0.85rem] leading-[1.6] text-paper/45">
              Every way this flow can fail, with the words a patient would actually see. Open one to
              preview it.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {FAILURES.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setFailure(f)}
                  className="rounded-full border border-white/12 px-4 py-2 micro-sm text-paper/55 transition-colors hover:border-warn/50 hover:text-warn"
                >
                  {f.id}
                </button>
              ))}
            </div>
          </details>
        </main>
      </div>

      {/* Failure dialog */}
      {failure && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center"
          role="dialog"
          aria-modal="true"
          aria-labelledby="rs-failure-title"
        >
          <button
            type="button"
            aria-label="Dismiss"
            onClick={() => setFailure(null)}
            className="absolute inset-0 cursor-default bg-ink/80"
          />

          <div className="animate-rise relative w-full max-w-lg overflow-hidden border border-warn/25 bg-navy p-7 sm:p-9">
            <span className="absolute inset-x-0 top-0 h-[3px] bg-warn" aria-hidden="true" />

            <p className="micro text-warn">Something needs your attention</p>
            <h2
              id="rs-failure-title"
              className="mt-4 font-display text-[1.45rem] leading-[1.15] font-semibold tracking-[-0.03em] text-paper"
            >
              {failure.title}
            </h2>
            <p className="mt-4 text-[0.93rem] leading-[1.65] text-paper/68">{failure.body}</p>

            <div className="mt-7 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => setFailure(null)}
                className="rounded-full bg-cyan px-6 py-3.5 micro text-ink"
              >
                {failure.primary}
              </button>
              {failure.secondary && (
                <button
                  type="button"
                  onClick={() => {
                    setFailure(null);
                    if (failure.id === 'payment') {
                      setMethod('insurance');
                      setStep('details');
                    }
                  }}
                  className="rounded-full border border-white/14 px-6 py-3.5 micro text-paper/65 transition-colors hover:border-white/35 hover:text-paper"
                >
                  {failure.secondary}
                </button>
              )}
            </div>

            <p className="mt-6 micro-sm leading-[1.85] text-paper/28">
              Recovery messages never expose raw API errors — only what went wrong and what to do
              next.
            </p>
          </div>
        </div>
      )}

      {/* Foot */}
      <footer className="border-t border-white/8 px-5 py-8 sm:px-8">
        <div className="mx-auto flex max-w-[1500px] flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="max-w-2xl micro-sm leading-[1.9] text-paper/28">
            Academic prototype. No real payment is processed, insurance verification is simulated,
            and card details are never stored.
          </p>
          <nav aria-label="Legal" className="flex gap-5">
            {[
              { label: 'Privacy', href: '/privacy' },
              { label: 'Terms', href: '/terms' },
              { label: 'Disclaimer', href: '/medical-disclaimer' },
            ].map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="micro-sm text-paper/40 transition-colors hover:text-paper"
              >
                {l.label}
              </Link>
            ))}
          </nav>
        </div>
      </footer>

    </div>
  );
}
