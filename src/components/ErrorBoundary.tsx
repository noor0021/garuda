import { Component, type ErrorInfo, type ReactNode } from 'react';

type State = { failed: boolean };

/** Root error boundary (PLAN.md C8): a crash shows a calm message and a Reload button. */
export class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  override state: State = { failed: false };

  static getDerivedStateFromError(): State {
    return { failed: true };
  }

  override componentDidCatch(error: Error, info: ErrorInfo): void {
    // Kept for whoever opens the console; the user sees the message below.
    console.error('Garuda Shabd crashed:', error, info.componentStack);
  }

  override render() {
    if (!this.state.failed) return this.props.children;
    return (
      <main className="fullpage-message" role="alert">
        <p className="fullpage-hi" lang="hi">कुछ गड़बड़ हो गई</p>
        <h1>Something went wrong</h1>
        <p>The page hit an unexpected error. Your saved words are safe.</p>
        <button type="button" className="button" onClick={() => window.location.reload()}>
          Reload
        </button>
      </main>
    );
  }
}
