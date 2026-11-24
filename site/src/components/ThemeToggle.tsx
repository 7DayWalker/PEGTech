/**
 * Dark mode toggle.
 */
import { useEffect, useState } from "react"
import { Moon, Sun } from "lucide-react"

export function ThemeToggle() {
  const [dark, setDark] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem("pegtech-theme")
    if (saved === "dark") setDark(true)
    if (dark) document.documentElement.classList.add("dark")
    else document.documentElement.classList.remove("dark")
  }, [dark])

  return (
    <button
      onClick={() => {
        const next = !dark
        setDark(next)
        localStorage.setItem("pegtech-theme", next ? "dark" : "light")
      }}
      className="rounded-full p-2 text-muted hover:text-accent transition-colors"
      aria-label="Toggle dark mode"
    >
      {dark ? <Sun size={20} /> : <Moon size={20} />}
    </button>
  )
}
