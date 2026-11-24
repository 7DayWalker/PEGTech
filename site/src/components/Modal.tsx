/**
 * Accessible modal dialog.
 */
import { useEffect, useCallback, ReactNode } from "react"
import { X } from "lucide-react"

type ModalProps = {
  isOpen: boolean
  onClose: () => void
  title?: string
  children: ReactNode
}

export function Modal({ isOpen, onClose, title, children }: ModalProps) {
  const handleKey = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    },
    [onClose],
  )

  useEffect(() => {
    document.addEventListener("keydown", handleKey)
    document.body.style.overflow = "hidden"
    return () => {
      document.removeEventListener("keydown", handleKey)
      document.body.style.overflow = ""
    }
  }, [handleKey, isOpen])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-card border border-input rounded-lg shadow-xl p-6 max-w-lg w-full animate-in zoom-in duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {title && (
          <div className="flex items-center gap-2 mb-4">
            <h2 className="text-lg font-semibold text-text">{title}</h2>
            <button onClick={onClose} className="ml-auto text-muted hover:text-accent">
              <X size={20} />
            </button>
          </div>
        )}
        {children}
      </div>
    </div>
  )
}
