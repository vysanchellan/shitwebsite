type Props = { className?: string; compact?: boolean };

/**
 * The RiskSense mark: a pulse contained by a ring. Drawn rather than imported so
 * it stays crisp at any size and inherits colour from its context.
 */
export function Mark({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true" className={className} fill="none">
      <circle cx="16" cy="16" r="14.25" stroke="currentColor" strokeWidth="1.2" opacity="0.45" />
      <path
        d="M4.5 16.5h5.2l2-5.4 3.1 10.2 2.5-6.3 1.6 3.1h8.1"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function Wordmark({ className = '', compact = false }: Props) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <Mark className="h-[1.35em] w-[1.35em] shrink-0" />
      {!compact && (
        <span className="font-display text-[0.95em] font-semibold tracking-[-0.03em]">
          RiskSense<span className="text-cyan"> AI</span>
        </span>
      )}
    </span>
  );
}
