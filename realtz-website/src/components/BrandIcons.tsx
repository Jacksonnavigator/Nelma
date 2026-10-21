type P = { className?: string };

export const Instagram = ({ className }: P) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
    <rect x="2" y="2" width="20" height="20" rx="5" />
    <circle cx="12" cy="12" r="4" />
    <circle cx="17.5" cy="6.5" r="0.6" fill="currentColor" />
  </svg>
);

export const Facebook = ({ className }: P) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
    <path d="M14 8.5V6.8c0-.8.5-1 .9-1H17V2.2L14.2 2C11 2 10.3 4.4 10.3 6v2.5H8V12h2.3v10H14V12h2.7l.4-3.5H14z" />
  </svg>
);

export const WhatsApp = ({ className }: P) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
    <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38a9.9 9.9 0 0 0 4.74 1.21h.01c5.46 0 9.91-4.45 9.91-9.91A9.84 9.84 0 0 0 12.04 2zm5.8 14.1c-.24.68-1.42 1.3-1.95 1.35-.5.05-1.13.23-3.8-.79-3.21-1.26-5.27-4.56-5.43-4.77-.16-.21-1.3-1.73-1.3-3.3 0-1.57.82-2.34 1.11-2.66.29-.32.64-.4.85-.4h.61c.2 0 .46-.07.72.55.26.64.9 2.2.98 2.36.08.16.13.35.03.56-.1.21-.16.34-.32.53-.16.18-.33.41-.48.55-.16.16-.32.33-.14.65.18.32.82 1.35 1.76 2.19 1.21 1.08 2.23 1.41 2.55 1.57.32.16.5.13.69-.08.19-.21.8-.93 1.01-1.25.21-.32.42-.27.71-.16.29.11 1.86.88 2.18 1.04.32.16.53.24.61.37.08.13.08.76-.16 1.44z" />
  </svg>
);
