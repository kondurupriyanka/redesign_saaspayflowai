import * as Sentry from '@sentry/react';

let initialized = false;

export function initializeMonitoring() {
  if (initialized) return;

  const dsn = import.meta.env.VITE_SENTRY_DSN as string | undefined;
  if (!dsn) return;

  Sentry.init({
    dsn,
    environment: import.meta.env.MODE,
    tracesSampleRate: 0.1,
  });

  initialized = true;
}
