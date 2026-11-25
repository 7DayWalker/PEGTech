/**
 * Shared compose + history modal for emailing/WhatsApp-ing a lead or client.
 * Backed by /api/admin/{leads|clients}/{id}/email|whatsapp + /messages.
 */
import { useEffect, useState } from "react";
import { Mail, MessageCircle, Send, Clock, AlertTriangle, CheckCircle2 } from "lucide-react";
import { Modal } from "./Modal";
import { Input, Textarea } from "./Input";
import { Button } from "./Button";
import { Badge } from "./Badge";
import { api } from "../lib/api";
import { useToast } from "../lib/Toast";

type MessageLog = {
  id: number;
  channel: "email" | "whatsapp";
  subject?: string | null;
  body: string;
  trigger: string;
  status: "sent" | "failed" | "skipped_not_configured";
  error?: string | null;
  created_at: string;
};

type Props = {
  isOpen: boolean;
  onClose: () => void;
  entityType: "leads" | "clients";
  entityId: number;
  entityName: string;
  hasEmail: boolean;
  hasPhone: boolean;
};

const statusBadge: Record<MessageLog["status"], { variant: "success" | "warning" | "default"; label: string }> = {
  sent: { variant: "success", label: "Sent" },
  failed: { variant: "warning", label: "Failed" },
  skipped_not_configured: { variant: "default", label: "Not configured" },
};

export function MessageCenterModal({ isOpen, onClose, entityType, entityId, entityName, hasEmail, hasPhone }: Props) {
  const { show } = useToast();
  const [tab, setTab] = useState<"email" | "whatsapp">(hasEmail ? "email" : "whatsapp");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [history, setHistory] = useState<MessageLog[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  function loadHistory() {
    setLoadingHistory(true);
    api
      .get(`/api/admin/${entityType}/${entityId}/messages`)
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => setHistory(data))
      .finally(() => setLoadingHistory(false));
  }

  useEffect(() => {
    if (isOpen) {
      loadHistory();
      setSubject("");
      setBody("");
      setTab(hasEmail ? "email" : "whatsapp");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, entityId]);

  async function handleSend() {
    if (!body.trim()) return;
    setSending(true);
    try {
      const path = tab === "email" ? "email" : "whatsapp";
      const payload = tab === "email" ? { subject, body } : { message: body };
      const res = await api.post(`/api/admin/${entityType}/${entityId}/${path}`, payload);
      const data = await res.json().catch(() => null);
      if (res.ok && data?.status === "sent") {
        show(`${tab === "email" ? "Email" : "WhatsApp message"} sent.`, "success");
        setSubject("");
        setBody("");
      } else if (res.ok && data?.status === "skipped_not_configured") {
        show(`${tab === "email" ? "Resend" : "WhatsApp"} isn't configured yet — logged but not delivered.`, "info");
      } else if (res.ok) {
        show(data?.error || "Send failed — see history below.", "error");
      } else {
        show(data?.detail || "Couldn't send message.", "error");
      }
      loadHistory();
    } catch {
      show("Network error — couldn't send message.", "error");
    } finally {
      setSending(false);
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Message ${entityName}`} size="lg">
      <div className="space-y-5">
        <div className="flex gap-2">
          <button
            onClick={() => setTab("email")}
            disabled={!hasEmail}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
              tab === "email" ? "bg-gemini-gradient text-white" : "bg-white/5 text-slate-300 hover:bg-white/10"
            }`}
          >
            <Mail size={14} /> Email
          </button>
          <button
            onClick={() => setTab("whatsapp")}
            disabled={!hasPhone}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
              tab === "whatsapp" ? "bg-gemini-gradient text-white" : "bg-white/5 text-slate-300 hover:bg-white/10"
            }`}
          >
            <MessageCircle size={14} /> WhatsApp
          </button>
        </div>

        {!hasEmail && tab === "email" && <p className="text-xs text-amber-400">No email address on file.</p>}
        {!hasPhone && tab === "whatsapp" && <p className="text-xs text-amber-400">No phone number on file.</p>}

        <div className="space-y-3">
          {tab === "email" && (
            <Input label="Subject" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Subject line" />
          )}
          <Textarea
            label={tab === "email" ? "Message (HTML allowed)" : "Message"}
            rows={4}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder={tab === "email" ? "<p>Hi there...</p>" : "Hi there..."}
          />
          {tab === "whatsapp" && (
            <p className="text-xs text-gray-500">
              Note: WhatsApp only delivers free-form text within 24h of the contact messaging in first — otherwise Meta requires a pre-approved template.
            </p>
          )}
          <div className="flex justify-end">
            <Button
              onClick={handleSend}
              disabled={sending || !body.trim() || (tab === "email" ? !hasEmail : !hasPhone)}
              size="sm"
            >
              <Send size={14} />
              {sending ? "Sending…" : "Send"}
            </Button>
          </div>
        </div>

        <div className="border-t border-white/10 pt-4">
          <h3 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-1.5">
            <Clock size={14} /> History
          </h3>
          {loadingHistory ? (
            <p className="text-sm text-gray-500">Loading…</p>
          ) : history.length === 0 ? (
            <p className="text-sm text-gray-500">No messages sent yet.</p>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {history.map((m) => (
                <div key={m.id} className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
                  <div className="flex items-center gap-2 mb-1">
                    {m.channel === "email" ? <Mail size={12} className="text-gray-400" /> : <MessageCircle size={12} className="text-gray-400" />}
                    <span className="text-xs text-gray-400">{m.channel === "email" ? m.subject || "(no subject)" : "WhatsApp"}</span>
                    <Badge variant={statusBadge[m.status].variant} className="ml-auto text-[10px] px-2 py-0.5">
                      {m.status === "sent" ? <CheckCircle2 size={10} className="mr-1" /> : m.status === "failed" ? <AlertTriangle size={10} className="mr-1" /> : null}
                      {statusBadge[m.status].label}
                    </Badge>
                    {m.trigger === "stage_change" && (
                      <Badge variant="default" className="text-[10px] px-2 py-0.5">Auto</Badge>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 line-clamp-2">{m.body.replace(/<[^>]+>/g, "")}</p>
                  <p className="text-[10px] text-gray-600 mt-1">{new Date(m.created_at).toLocaleString()}</p>
                  {m.error && <p className="text-[10px] text-amber-500 mt-1">{m.error}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
