/** AI CSR chat widget — first response before human joins. */
import { useState, useEffect, useRef } from "react";
import { ai } from "../lib/ai";
import { useToast } from "../lib/Toast";
import { MessageCircle, X, ArrowUp, Sparkles } from "lucide-react";

type ChatMessage = { role: "user" | "assistant"; content: string };

const QUICK_PROMPTS = [
  "What services does PEGTech offer?",
  "What's your pricing model?",
  "Do you offer ongoing support?",
  "I'd like to book a call",
];

function TypingDots() {
  return (
    <div className="mr-auto flex items-center gap-1.5 bg-dark-700/80 text-gray-300 rounded-2xl rounded-bl-sm px-4 py-3">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce"
          style={{ animationDelay: `${i * 0.15}s` }}
        />
      ))}
    </div>
  );
}

export function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [hasOpenedOnce, setHasOpenedOnce] = useState(false);
  const [showGreeting, setShowGreeting] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionId] = useState(() => "s_" + Math.random().toString(36).slice(2));
  const endRef = useRef<HTMLDivElement>(null);
  const { show } = useToast();

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // A one-time, dismissible greeting bubble pops up next to the launcher
  // a few seconds after page load (once per browser, via sessionStorage)
  // to invite the visitor to chat, rather than relying on a bare icon
  // alone to signal "this is interactive".
  useEffect(() => {
    if (sessionStorage.getItem("pegtech_chat_greeted")) return;
    const timer = setTimeout(() => {
      if (!hasOpenedOnce) setShowGreeting(true);
    }, 3500);
    return () => clearTimeout(timer);
  }, [hasOpenedOnce]);

  function dismissGreeting() {
    setShowGreeting(false);
    sessionStorage.setItem("pegtech_chat_greeted", "1");
  }

  function openChat() {
    setOpen(true);
    setHasOpenedOnce(true);
    dismissGreeting();
  }

  async function sendMessage(text?: string) {
    const userMsg = (text ?? input).trim();
    if (!userMsg) return;
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMsg }]);
    setLoading(true);

    try {
      const res = await ai.csrResponse({
        message: userMsg,
        session_id: sessionId,
        history: messages,
      });
      const data = await res.json().catch(() => ({}));

      if (res.status === 429) {
        show(data.detail || "You're sending messages a bit fast — please wait a moment.", "error");
        return;
      }
      if (!res.ok || !data.response) {
        show("AI assistant temporarily unavailable. Please try again.", "error");
        return;
      }

      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.response },
      ]);
      if (data.escalate) {
        show(
          "This has been flagged for our team — a human usually jumps in within about 2 minutes.",
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
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      {!open && showGreeting && (
        <div className="relative max-w-[220px] rounded-2xl rounded-br-sm border border-white/10 bg-dark-800/95 backdrop-blur-xl shadow-2xl px-4 py-3 text-sm text-gray-200 reveal-up">
          <button
            onClick={dismissGreeting}
            className="absolute -top-2 -right-2 bg-dark-700 border border-white/10 rounded-full p-0.5 text-gray-400 hover:text-white"
            aria-label="Dismiss"
          >
            <X size={12} />
          </button>
          👋 Hi! Questions about our services or pricing? Chat with us — our team usually replies within 2 minutes.
        </div>
      )}

      {!open && (
        <button
          onClick={openChat}
          className="group relative"
          aria-label="Open chat"
        >
          <span className="absolute inset-0 rounded-full bg-gemini-gradient blur-lg opacity-60 group-hover:opacity-90 transition-opacity duration-300 animate-pulse-slow" />
          <span className="relative flex items-center justify-center w-14 h-14 rounded-full bg-gemini-gradient border border-white/20 shadow-2xl shadow-gemini-purple/30 group-hover:scale-105 active:scale-95 transition-transform duration-200">
            <MessageCircle size={24} className="text-white" strokeWidth={2.25} />
          </span>
        </button>
      )}

      {open && (
        <div className="flex flex-col h-[560px] w-[380px] max-w-[calc(100vw-3rem)] bg-dark-800/95 border border-white/10 rounded-3xl shadow-2xl backdrop-blur-xl overflow-hidden">
          <div className="relative bg-gemini-gradient p-4 flex items-start justify-between gap-3 shrink-0 overflow-hidden">
            <div className="absolute inset-0 bg-white/5 backdrop-blur-sm" />
            <div className="relative">
              <h3 className="text-white font-semibold flex items-center gap-2 whitespace-nowrap">
                <span className="relative flex w-2 h-2 shrink-0">
                  <span className="absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75 animate-ping" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-400" />
                </span>
                AI Assistant
              </h3>
              <p className="text-xs text-white/80 mt-0.5">
                Instant replies • Our team usually joins within 2 min
              </p>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="relative shrink-0 text-white/80 hover:text-white transition-colors"
              aria-label="Close chat"
            >
              <X size={20} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.length === 0 && (
              <div className="space-y-4">
                <div className="mr-auto max-w-[90%] bg-dark-700/80 text-gray-200 rounded-2xl rounded-bl-sm px-4 py-3 text-sm">
                  👋 Hi, I'm PEGTech's AI assistant. Ask me about our services, pricing,
                  or anything else — I'm here 24/7, and a human teammate typically
                  joins within 2 minutes if you need one.
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-2 flex items-center gap-1">
                    <Sparkles size={12} /> Quick questions
                  </p>
                  <div className="flex flex-col gap-2">
                    {QUICK_PROMPTS.map((q) => (
                      <button
                        key={q}
                        onClick={() => sendMessage(q)}
                        className="text-left text-sm px-3.5 py-2.5 rounded-xl border border-white/10 bg-white/[0.03] text-gray-300 hover:bg-white/[0.08] hover:border-white/20 hover:text-white transition-colors"
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {messages.map((m, i) => (
              <div
                key={i}
                className={`max-w-[85%] px-4 py-3 text-sm leading-relaxed ${
                  m.role === "user"
                    ? "ml-auto bg-gemini-gradient text-white rounded-2xl rounded-br-sm"
                    : "mr-auto bg-dark-700/80 text-gray-200 rounded-2xl rounded-bl-sm"
                }`}
              >
                {m.content}
              </div>
            ))}
            {loading && <TypingDots />}
            <div ref={endRef} />
          </div>

          <div className="p-3 border-t border-white/10 shrink-0">
            <div className="flex gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                placeholder="Type your message..."
                className="flex-1 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-gemini-purple/50 focus:border-transparent"
              />
              <button
                onClick={() => sendMessage()}
                disabled={loading || !input.trim()}
                className="flex items-center justify-center w-10 h-10 shrink-0 rounded-full bg-gemini-gradient text-white disabled:opacity-40 hover:opacity-90 active:scale-95 transition-all"
                aria-label="Send message"
              >
                <ArrowUp size={18} strokeWidth={2.5} />
              </button>
            </div>
            <p className="text-[11px] text-center text-gray-500 mt-2">
              AI-generated — a real teammate typically responds within ~2 minutes.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
