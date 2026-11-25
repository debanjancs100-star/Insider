import { Component, type ErrorInfo, type ReactNode } from 'react';

type State = { error: Error | null };

export class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Unhandled render error:', error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-surface text-foreground px-6">
          <div className="max-w-md w-full border border-border bg-card p-8 text-center">
            <p className="text-brand text-xs font-bold uppercase tracking-[0.3em] mb-3">Application error</p>
            <h1 className="text-3xl font-serif italic mb-4">Unable to render this page</h1>
            <p className="text-xs text-muted-foreground mb-6 break-words">{this.state.error.message || 'An unexpected error occurred.'}</p>
            <div className="flex justify-center gap-3">
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="px-5 py-2.5 bg-brand text-white text-xs uppercase tracking-widest font-bold hover:brightness-110 transition-all"
              >
                Reload
              </button>
              <a
                href="/"
                className="px-5 py-2.5 border border-border text-xs uppercase tracking-widest hover:bg-white hover:text-black transition-all"
              >
                Home
              </a>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
