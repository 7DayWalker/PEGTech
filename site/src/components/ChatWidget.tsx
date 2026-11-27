/** AI CSR chat widget — first response before human joins. */
import { useState, useEffect, useRef, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { ai } from "../lib/ai";
import { api } from "../lib/api";
import { useToast } from "../lib/Toast";
import { Input, Select } from "./Input";
import { MessageCircle, X, ArrowUp, Sparkles, Calendar, CheckCircle2 } from "lucide-react";

type ChatMessage = { role: "user" | "assistant"; content: string };

const QUICK_PROMPTS = [
  "What services does PEGTech offer?",
  "What's your pricing model?",
  "Do you offer ongoing support?",
];

// Known real routes only — deliberately NOT a generic "/anything" matcher,
// so an AI reply can never accidentally render a link to a path that
// doesn't exist on the site.
const KNOWN_ROUTES = ["book", "audit", "services", "careers", "contact", "about", "work", "faq"];
const LINK_PATTERN = new RegExp(
  `(https?:\\/\\/[^\\s]+)` +
    `|(?:pegtech\\.co)(\\/(?:${KNOWN_ROUTES.join("|")})\\b[^\\s.,;:!?)]*)` +
    `|(\\/(?:${KNOWN_ROUTES.join("|")})\\b[^\\s.,;:!?)]*)`,
  "gi"
);

/** Turns any http(s) URL or known PEGTech route mentioned in AI text into
 * an actual clickable link (internal routes navigate client-side via
 * react-router, external URLs open in a new tab). */
function linkifyMessage(text: string, keyPrefix: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let i = 0;
  const re = new RegExp(LINK_PATTERN);
  while ((match = re.exec(text)) !== null) {
    const [full, httpUrl, domainPath, barePath] = match;
    if (match.index > lastIndex) nodes.push(text.slice(lastIndex, match.index));
    if (httpUrl) {
      nodes.push(
        <a
          key={`${keyPrefix}-${i++}`}
          href={httpUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="underline decoration-dotted text-sky-300 hover:text-sky-200 font-medium break-all"
        >
          {httpUrl}
        </a>
      );
    } else {
      const to = (domainPath || barePath || full) as string;
      nodes.push(
        <Link
          key={`${keyPrefix}-${i++}`}
          to={to}
          className="underline decoration-dotted text-sky-300 hover:text-sky-200 font-medium"
        >
          {full}
        </Link>
      );
    }
    lastIndex = match.index + full.length;
  }
  if (lastIndex < text.length) nodes.push(text.slice(lastIndex));
  return nodes;
}

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

const SLOTS = ["09:00", "10:30", "12:00", "13:30", "15:00", "16:30"];
const SERVICES = [
  "Web Development",
  "Mobile Apps",
  "AI Solutions",
  "Digital Marketing",
  "Brand & Design",
  "Tech Consulting",
];

type BookingResult = { ref: string; day: string; slot: string };

/** Compact version of the full Book.tsx form, embedded directly in the
 * chat so a visitor can actually book without leaving the conversation
 * or navigating away. Posts to the same public endpoint Book.tsx uses. */
function InlineBookingForm({ onBooked, onDismiss }: { onBooked: (r: BookingResult) => void; onDismiss: () => void }) {
  const [form, setForm] = useState({ name: "", email: "", phone: "", service: "", day: "", slot: "" });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [openSlots, setOpenSlots] = useState<string[] | null>(null);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const { show } = useToast();

  function update<K extends keyof typeof form>(key: K, value: string) {
    setForm((prev) => ({ ...prev, [key]: value, ...(key === "day" ? { slot: "" } : {}) }));
    setError(null);
  }

  // Query real availability for the chosen day instead of always showing
  // the full static slot list regardless of what's actually already
  // booked (the standalone /book page has this gap — the in-chat form
  // doesn't repeat it).
  useEffect(() => {
    if (!form.day) {
      setOpenSlots(null);
      return;
    }
    let cancelled = false;
    setLoadingSlots(true);
    api
      .get(`/api/public/bookings/availability?day=${encodeURIComponent(form.day)}`)
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        const slots = Array.isArray(data?.[form.day]) ? data[form.day] : SLOTS;
        setOpenSlots(slots);
      })
      .catch(() => {
        if (!cancelled) setOpenSlots(SLOTS);
      })
      .finally(() => {
        if (!cancelled) setLoadingSlots(false);
      });
    return () => {
      cancelled = true;
    };
  }, [form.day]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await api.post("/api/public/bookings", form);
      const data = await res.json().catch(() => ({}));
      if (res.status === 409) {
        setError("That slot was just taken — please pick a different time.");
        return;
      }
      if (!res.ok) {
        setError(data.detail || "Couldn't book that slot. Please try a different time.");
        return;
      }
      onBooked({ ref: data.ref, day: form.day, slot: form.slot });
    } catch {
      show("Booking failed. Please try again.", "error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mr-auto w-full max-w-[90%] bg-dark-700/80 border border-white/10 rounded-2xl rounded-bl-sm p-4 space-y-3"
    >
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-white flex items-center gap-1.5">
          <Calendar size={14} className="text-gemini-blue" /> Book a call
        </p>
        <button type="button" onClick={onDismiss} className="text-gray-500 hover:text-white" aria-label="Dismiss booking form">
          <X size={14} />
        </button>
      </div>

      <Input
        placeholder="Full name"
        value={form.name}
        onChange={(e) => update("name", e.target.value)}
        required
        className="!py-2 !text-sm"
      />
      <Input
        type="email"
        placeholder="Email"
        value={form.email}
        onChange={(e) => update("email", e.target.value)}
        required
        className="!py-2 !text-sm"
      />
      <Input
        type="tel"
        placeholder="Phone"
        value={form.phone}
        onChange={(e) => update("phone", e.target.value)}
        required
        className="!py-2 !text-sm"
      />
      <Select value={form.service} onChange={(e) => update("service", e.target.value)} className="!py-2 !text-sm">
        <option value="">Service of interest (optional)</option>
        {SERVICES.map((s) => (
          <option key={s} value={s}>{s}</option>
        ))}
      </Select>
      <div className="grid grid-cols-2 gap-2">
        <Input
          type="date"
          min={new Date().toISOString().split("T")[0]}
          value={form.day}
          onChange={(e) => update("day", e.target.value)}
          required
          className="!py-2 !text-sm"
        />
        <Select
          value={form.slot}
          onChange={(e) => update("slot", e.target.value)}
          required
          disabled={!form.day || loadingSlots}
          className="!py-2 !text-sm"
        >
          <option value="">{!form.day ? "Pick a date first" : loadingSlots ? "Loading…" : "Time"}</option>
          {(openSlots ?? SLOTS).map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
          {openSlots !== null && openSlots.length === 0 && (
            <option value="" disabled>No open slots that day</option>
          )}
        </Select>
      </div>

      {error && <p className="text-xs text-red-400">{error}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="w-full py-2.5 rounded-xl bg-gemini-gradient text-white text-sm font-semibold disabled:opacity-50 hover:opacity-90 active:scale-[0.99] transition-all"
      >
        {submitting ? "Booking…" : "Confirm booking"}
      </button>
    </form>
  );
}

export function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [hasOpenedOnce, setHasOpenedOnce] = useState(false);
  const [showGreeting, setShowGreeting] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [bookingResult, setBookingResult] = useState<BookingResult | null>(null);
  const [sessionId] = useState(() => "s_" + Math.random().toString(36).slice(2));
  const endRef = useRef<HTMLDivElement>(null);
  const { show } = useToast();

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading, showBookingForm, bookingResult]);

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

  // "Book a call" skips the AI round-trip entirely — it deterministically
  // opens the real booking form inline, rather than hoping the model
  // decides to suggest it. The AI can still trigger the same form later
  // via `escalate`-less intent=booking_request from a free-typed message.
  function openBookingForm() {
    setMessages((prev) => [...prev, { role: "user", content: "I'd like to book a call" }]);
    setShowBookingForm(true);
    setBookingResult(null);
  }

  function handleBooked(result: BookingResult) {
    setShowBookingForm(false);
    setBookingResult(result);
    const pretty = new Date(result.day + "T00:00:00").toLocaleDateString(undefined, {
      weekday: "long",
      month: "long",
      day: "numeric",
    });
    setMessages((prev) => [
      ...prev,
      {
        role: "assistant",
        content: `You're booked for ${pretty} at ${result.slot}. Confirmation ref ${result.ref} — we'll email you shortly.`,
      },
    ]);
    show("Call booked! Check your email for confirmation.", "success");
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
      if (data.intent === "booking_request" && !bookingResult) {
        setShowBookingForm(true);
      }
      if (data.escalate) {
        show(
          "This has been flagged for our team — a teammate usually reaches out directly (by phone, email, or WhatsApp) within about 2 minutes.",
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
                Instant AI replies • A teammate follows up fast if needed
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
                  or anything else — I'm here 24/7, and if you need a human, a
                  teammate typically follows up directly within about 2 minutes.
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
                    <button
                      onClick={openBookingForm}
                      className="text-left text-sm px-3.5 py-2.5 rounded-xl border border-white/10 bg-white/[0.03] text-gray-300 hover:bg-white/[0.08] hover:border-white/20 hover:text-white transition-colors flex items-center gap-2"
                    >
                      <Calendar size={14} className="text-gemini-blue shrink-0" /> Book a call
                    </button>
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
                {m.role === "assistant" ? linkifyMessage(m.content, `m-${i}`) : m.content}
              </div>
            ))}

            {bookingResult && (
              <div className="mr-auto max-w-[90%] flex items-start gap-2 bg-green-500/10 border border-green-500/20 text-green-300 rounded-2xl rounded-bl-sm px-4 py-3 text-sm">
                <CheckCircle2 size={16} className="shrink-0 mt-0.5" />
                <span>Booking confirmed — ref {bookingResult.ref}. Check your email.</span>
              </div>
            )}

            {showBookingForm && (
              <InlineBookingForm onBooked={handleBooked} onDismiss={() => setShowBookingForm(false)} />
            )}

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
