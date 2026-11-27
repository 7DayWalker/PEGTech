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
  size?: "sm" | "md" | "lg" | "xl"
  /** Fixed-height flex-column layout instead of the default auto-growing,
   * whole-card-scrolls behavior — lets the caller pin something (e.g. a
   * compose box) at the bottom while an inner panel scrolls independently
   * (a WhatsApp-style chat). */
  chatLayout?: boolean
}

const sizeClasses = {
  sm: "max-w-md",
  md: "max-w-lg",
  lg: "max-w-2xl",
  xl: "max-w-4xl",
}

export function Modal({ isOpen, onClose, title, children, size = "md", chatLayout = false }: ModalProps) {
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
        className={`glass-card rounded-3xl border-white/15 shadow-2xl p-6 w-full ${sizeClasses[size]} animate-in zoom-in-95 duration-200 ${
          chatLayout ? "h-[82vh] flex flex-col" : "max-h-[85vh] overflow-y-auto"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {title && (
          <div className="flex items-center gap-2 mb-5 flex-shrink-0">
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
        {chatLayout ? <div className="flex-1 min-h-0 flex flex-col">{children}</div> : children}
      </div>
    </div>
  )
}
