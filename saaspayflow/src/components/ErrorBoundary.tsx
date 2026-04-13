import { Component, type ErrorInfo, type ReactNode } from 'react';
import * as Sentry from '@sentry/react';
import { Button } from '@/components/ui/button';

type Props = {
  children: ReactNode;
};

type State = {
  hasError: boolean;
  error: Error | null;
};

export class ErrorBoundary extends Component<Props, State> {
  state: State = {
    hasError: false,
    error: null,
  };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    Sentry.captureException(error, {
      extra: {
        componentStack: errorInfo.componentStack,
      },
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#0A0F0A] text-white flex items-center justify-center px-6">
          <div className="max-w-lg rounded-3xl border border-white/10 bg-[#0F1A12] p-8 text-center shadow-2xl">
            <p className="text-xs uppercase tracking-[0.24em] text-[#84cc16]">Something went wrong</p>
            <h1 className="mt-3 text-2xl font-semibold">We hit an unexpected error</h1>
            <p className="mt-3 text-sm leading-7 text-white/70">
              Please refresh the page. If the issue keeps happening, we&apos;ll capture it in monitoring so we can fix it quickly.
            </p>
            {this.state.error && (
              <p className="mt-4 rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-left text-xs text-white/50">
                {this.state.error.message}
              </p>
            )}
            <div className="mt-6 flex items-center justify-center gap-3">
              <Button onClick={() => window.location.reload()} className="bg-[#84cc16] text-[#0A0F0A] hover:bg-[#a3e635]">
                Reload app
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
