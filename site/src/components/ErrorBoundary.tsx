/**
 * App-level error boundary — catches uncaught render errors so a bug on one
 * page surfaces a readable message instead of a silent blank screen.
 */
import { Component, type ReactNode } from "react";

type Props = { children: ReactNode };
type State = { error: Error | null };

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // eslint-disable-next-line no-console
    console.error("Unhandled error in app tree:", error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-dark-900 text-white px-4">
          <div className="max-w-md text-center">
            <h1 className="text-2xl font-bold mb-3">Something went wrong</h1>
            <p className="text-gray-400 text-sm mb-6">
              {this.state.error.message || "An unexpected error occurred."}
            </p>
            <button
              onClick={() => (window.location.href = "/")}
              className="btn-primary text-sm px-6 py-3"
            >
              Go back home
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
