/** 404 Not Found page. */
import { Link } from "react-router-dom";
import { useTitle } from "../lib/useTitle";
export function NotFound() {
  useTitle("404 — PEGTech");

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-dark-900 text-slate-100 px-4">
      <div className="text-center max-w-md">
        <h1 className="text-8xl font-bold text-slate-900/10 mb-4">404</h1>
        <h2 className="text-3xl font-bold text-slate-100 mb-4">Page not found</h2>
        <p className="text-slate-400 mb-8">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Link to="/" className="btn variant-primary">
          Go Home
        </Link>
      </div>
    </div>
  );
}
