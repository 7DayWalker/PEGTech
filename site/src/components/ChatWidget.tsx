/**
 * AI CSR chat widget — first response before human joins.
 */
import { useState, useEffect, useRef } from "react"
import { ai } from "../lib/ai"
import { useToast } from "../lib/Toast"
import { Send, X } from "lucide-react"

type ChatMessage = { role: "user" | "assistant"; content: string }

export function ChatWidget() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [sessionId] = useState(() => "s_" + Math.random().toString(36).slice(2))
  const endRef = useRef<HTMLDivElement>(null)
  const { show } = useToast()

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  async function sendMessage() {
    if (!input.trim()) return
    const userMsg = input
    setInput("")
    setMessages((prev) => [...prev, { role: "user", content: userMsg }])
    setLoading(true)

    try {
      const res = await ai.csrResponse({
        message: userMsg,
        session_id: sessionId,
        history: messages,
      })
      setMessages((prev) => [...prev, { role: "assistant", content: res.response }])
      if (res.escalate) {
        show("This has been flagged for human review. A team member will join shortly.", "info")
      }
    } catch {
      show("AI assistant temporarily unavailable. Please try again later.", "error")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="bg-accent text-primary rounded-full p-3 shadow-lg hover:bg-accent/90 transition-colors"
          aria-label="Open chat"
        >
          <Send size={22} strokeWidth={2.5} />
        </button>
      )}
      {open && (
        <div className="flex flex-col h-[500px] w-[360px] bg-card border border-input rounded-xl shadow-2xl overflow-hidden">
          <div className="bg-primary p-4 flex items-center justify-between">
            <h3 className="text-white font-semibold flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" /> AI Assistant
            </h3>
            <button onClick={() => setOpen(false)} className="text-white/70 hover:text-white">
              <X size={20} />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((m, i) => (
              <div
                key={i}
                className={`max-w-[85%] p-3 rounded-lg ${
                  m.role === "user"
                    ? "ml-auto bg-accent text-primary rounded-tr-none"
                    : "mr-auto bg-muted/50 text-text rounded-tl-none"
                }`}
              >
                {m.content}
              </div>
            ))}
            <div ref={endRef} />
          </div>
          <div className="p-3 border-t border-input">
            <div className="flex gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                placeholder="Type your message..."
                className="flex-1 rounded-md border border-input px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-accent"
              />
              <button
                onClick={sendMessage}
                disabled={loading}
                className="px-4 py-2 rounded-md bg-primary text-white disabled:opacity-50"
              >
                Send
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
