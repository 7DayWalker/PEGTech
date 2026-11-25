/**
 * Accessible modal dialog — frosted glass styling, consistent with the
 * rest of the dashboard's Liquid Glass design system.
 */
import { useEffect, useCallback, ReactNode } from "react"
import { X } from "lucide-react"

type ModalProps = {
  isOpen: boolean
  onClose: () => void
  title?: string
  children: ReactNode
  size?: "sm" | "md" | "lg"
}

const sizeClasses = {
  sm: "max-w-md",
  md: "max-w-lg",
  lg: "max-w-2xl",
}

export function Modal({ isOpen, onClose, title, children, size = "md" }: ModalProps) {
  const handleKey = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    },
    [onClose],
  )

  useEffect(() => {
    if (!isOpen) return
    document.addEventListener("keydown", handleKey)
    document.body.style.overflow = "hidden"
    return () => {
      document.removeEventListener("keydown", handleKey)
      document.body.style.overflow = ""
    }
  }, [handleKey, isOpen])

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className={`glass-card rounded-3xl border-white/15 shadow-2xl p-6 w-full ${sizeClasses[size]} max-h-[85vh] overflow-y-auto animate-in zoom-in-95 duration-200`}
        onClick={(e) => e.stopPropagation()}
      >
        {title && (
          <div className="flex items-center gap-2 mb-5">
            <h2 className="text-lg font-bold text-white">{title}</h2>
            <button
              onClick={onClose}
              className="ml-auto text-gray-400 hover:text-white transition-colors"
              aria-label="Close"
            >
              <X size={20} />
            </button>
          </div>
        )}
        {children}
      </div>
    </div>
  )
}
