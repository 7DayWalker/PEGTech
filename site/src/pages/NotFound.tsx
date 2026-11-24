/**
 * 404 Not Found page.
 */
import { Link } from "react-router-dom"
import { useTitle } from "../lib/useTitle"
import { ChatWidget } from "../components/ChatWidget"

export function NotFound() {
  useTitle("404 — PEGTech")

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-muted/50 px-4">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-text">404</h1>
        <p className="text-xl text-muted mt-4">Page not found</p>
        <Link to="/" className="mt-6 inline-block btn">Go Home</Link>
      </div>
      <ChatWidget />
    </div>
  )
}
