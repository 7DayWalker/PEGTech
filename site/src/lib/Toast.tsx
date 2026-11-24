/**
 * Simple toast notification system.
 */
import { createContext, useContext, useCallback, useState, ReactNode } from "react"

type Toast = {
  id: string
  message: string
  type: "success" | "error" | "info"
}

type ToastContextType = {
  toasts: Toast[]
  show: (message: string, type?: Toast["type"]) => void
  hide: (id: string) => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const show = useCallback((message: string, type: Toast["type"] = "info") => {
    const id = Math.random().toString(36).slice(2)
    setToasts((prev) => [...prev, { id, message, type }])
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 5000)
  }, [])

  const hide = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={{ toasts, show, hide }}>
      {children}
      <div className="fixed top-5 right-5 z-50 flex flex-col gap-2 pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto px-4 py-3 rounded-lg shadow-lg flex items-start gap-3 animate-in fade-in slide-in-from-right-2 duration-300 ${
              t.type === "success"
                ? "bg-green-900 text-green-100 border border-green-700"
                : t.type === "error"
                ? "bg-red-900 text-red-100 border border-red-700"
                : "bg-blue-900 text-blue-100 border border-blue-700"
            }`}
          >
            <span className="text-sm">{t.message}</span>
            <button
              onClick={() => hide(t.id)}
              className="ml-2 hover:opacity-70 transition-opacity"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error("useToast must be used within ToastProvider")
  return ctx
}
