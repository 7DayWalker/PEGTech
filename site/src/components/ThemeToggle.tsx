/** Dark mode toggle. */
import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

export function ThemeToggle() {
  const [dark, setDark] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem("pegtech-theme");
    const isDark = saved === null || saved === "dark";
    setDark(isDark);
    if (isDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, []);

  return (
    <button
      onClick={() => {
        const next = !dark;
        setDark(next);
        localStorage.setItem("pegtech-theme", next ? "dark" : "light");
        if (next) {
          document.documentElement.classList.add("dark");
        } else {
          document.documentElement.classList.remove("dark");
        }
      }}
      className="rounded-lg p-2 text-gray-400 hover:text-accent hover:bg-dark-700 transition-colors"
      aria-label="Toggle theme"
    >
      {dark ? <Sun size={18} className="text-accent" /> : <Moon size={18} />}
    </button>
  );
}
