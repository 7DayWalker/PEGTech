/** AI CSR chat widget — first response before human joins. */
import { useState, useEffect, useRef } from "react";
import { ai } from "../lib/ai";
import { useToast } from "../lib/Toast";
import { Send, X } from "lucide-react";

type ChatMessage = { role: "user" | "assistant"; content: string };

export function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionId] = useState(() => "s_" + Math.random().toString(36).slice(2));
  const endRef = useRef<HTMLDivElement>(null);
  const { show } = useToast();

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function sendMessage() {
    if (!input.trim()) return;
    const userMsg = input;
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMsg }]);
    setLoading(true);

    try {
      const res = await ai.csrResponse({
        message: userMsg,
        session_id: sessionId,
        history: messages,
      });
      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.response },
      ]);
      if (data.escalate) {
        show(
          "This has been flagged for human review. A team member will join shortly.",
          "info"
        );
      }
    } catch {
      show("AI assistant temporarily unavailable. Please try again.", "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="bg-blue-600 text-dark-900 rounded-full p-3 shadow-2xl shadow-gemini-purple/25 hover:bg-blue-500 hover:shadow-gemini-purple/40 transition-all duration-200 active:scale-95"
          aria-label="Open chat"
        >
          <Send size={22} strokeWidth={2.5} />
        </button>
      )}
      {open && (
        <div className="flex flex-col h-[500px] w-[360px] bg-dark-800 border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
          <div className="bg-blue-600 p-4 flex items-center justify-between">
            <h3 className="text-dark-900 font-semibold flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />{' '}
              AI Assistant
            </h3>
            <button
              onClick={() => setOpen(false)}
              className="text-dark-900/70 hover:text-dark-900"
            >
              <X size={20} />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((m, i) => (
              <div
                key={i}
                className={`max-w-[85%] p-3 rounded-xl ${
                  m.role === "user"
                    ? "ml-auto bg-blue-600 text-dark-900 rounded-tr-none"
                    : "mr-auto bg-dark-700 text-gray-300 rounded-tl-none"
                }`}
              >
                {m.content}
              </div>
            ))}
            <div ref={endRef} />
          </div>
          <div className="p-3 border-t border-white/10">
            <div className="flex gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                placeholder="Type your message..."
                className="flex-1 rounded-xl border border-input bg-dark-900/50 px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                onClick={sendMessage}
                disabled={loading}
                className="px-4 py-2 rounded-xl bg-blue-600 text-dark-900 disabled:opacity-50 disabled:hover:bg-blue-600 hover:bg-blue-500 transition-colors"
              >
                Send
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
