/**
 * Hook to set page title.
 */
import { useEffect } from "react"

export function useTitle(title: string) {
  useEffect(() => {
    document.title = title
  }, [title])
}
