/** 404 Not Found page. */
import { Link } from "react-router-dom";
import { useTitle } from "../lib/useTitle";
import { GlowBackground } from "../components/GlowBackground";

export function NotFound() {
  useTitle("404 — PEGTech");

  return (
    <div className="relative overflow-hidden min-h-screen flex flex-col items-center justify-center bg-dark-900 text-white px-4">
      <GlowBackground />
      <div className="relative text-center max-w-md">
        <h1 className="text-8xl font-bold text-gradient opacity-20 mb-4">404</h1>
        <h2 className="text-3xl font-bold text-white mb-4">Page not found</h2>
        <p className="text-gray-400 mb-8">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Link to="/" className="btn-primary">
          Go Home
        </Link>
      </div>
    </div>
  );
}
