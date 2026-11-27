/**
 * Shared compose + history modal for emailing/WhatsApp-ing a lead or client.
 * Backed by /api/admin/{leads|clients}/{id}/email|whatsapp + /messages.
 *
 * Laid out like a real chat app: a scrollable history panel on top (oldest
 * at the top, newest at the bottom, auto-scrolled into view), with the
 * compose box pinned at the bottom of the modal.
 */
import { useEffect, useRef, useState } from "react";
import { Mail, MessageCircle, Send, AlertTriangle, CheckCircle2, CheckCheck, Inbox, Smile, Paperclip, X, FileText } from "lucide-react";
import { Modal } from "./Modal";
import { Input, Textarea } from "./Input";
import { Button } from "./Button";
import { Badge } from "./Badge";
import { EmojiPicker } from "./EmojiPicker";
import { MediaBubble } from "./MediaBubble";
import { api, uploadFile } from "../lib/api";
import { useToast } from "../lib/Toast";

type MessageLog = {
  id: number;
  channel: "email" | "whatsapp";
  subject?: string | null;
  body: string;
  trigger: string;
  status: "sent" | "delivered" | "read" | "received" | "failed" | "skipped_not_configured";
  direction?: "outbound" | "inbound";
  media_id?: number | null;
  media_type?: string | null;
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
  /** Called after a message successfully sends — e.g. a lead may have just
   * auto-advanced stage (New -> Contacted), so the caller should refetch. */
  onSent?: () => void;
};

const statusBadge: Record<MessageLog["status"], { variant: "success" | "warning" | "default"; label: string }> = {
  sent: { variant: "success", label: "Sent" },
  delivered: { variant: "success", label: "Delivered" },
  read: { variant: "success", label: "Read" },
  received: { variant: "default", label: "Received" },
  failed: { variant: "warning", label: "Failed" },
  skipped_not_configured: { variant: "default", label: "Not configured" },
};

const statusIcon: Record<MessageLog["status"], React.ElementType | null> = {
  sent: CheckCircle2,
  delivered: CheckCircle2,
  read: CheckCheck,
  received: null,
  failed: AlertTriangle,
  skipped_not_configured: null,
};

const MAX_ATTACHMENT_BYTES = 16 * 1024 * 1024; // keep in sync with api/app/routers/messaging.py

export function MessageCenterModal({ isOpen, onClose, entityType, entityId, entityName, hasEmail, hasPhone, onSent }: Props) {
  const { show } = useToast();
  const [tab, setTab] = useState<"email" | "whatsapp">(hasEmail ? "email" : "whatsapp");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [history, setHistory] = useState<MessageLog[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);
  const [attachment, setAttachment] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const historyEndRef = useRef<HTMLDivElement>(null);

  function loadHistory(scrollAfter = true) {
    setLoadingHistory(true);
    api
      .get(`/api/admin/${entityType}/${entityId}/messages`)
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => {
        setHistory(data);
        if (scrollAfter) {
          // Wait a tick for the new rows to actually render before scrolling.
          setTimeout(() => historyEndRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
        }
      })
      .finally(() => setLoadingHistory(false));
  }

  useEffect(() => {
    if (isOpen) {
      loadHistory(false);
      setSubject("");
      setBody("");
      setAttachment(null);
      setShowEmoji(false);
      setTab(hasEmail ? "email" : "whatsapp");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, entityId]);

  // Jump to the latest message once history first loads for this conversation.
  useEffect(() => {
    if (!loadingHistory && history.length > 0) {
      historyEndRef.current?.scrollIntoView({ behavior: "auto" });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadingHistory]);

  function handlePickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow picking the same file again later
    if (!file) return;
    if (file.size > MAX_ATTACHMENT_BYTES) {
      show(`File too large — max ${MAX_ATTACHMENT_BYTES / (1024 * 1024)}MB.`, "error");
      return;
    }
    setAttachment(file);
  }

  function insertEmoji(emoji: string) {
    setBody((prev) => prev + emoji);
    setShowEmoji(false);
  }

  async function handleSend() {
    if (!body.trim() && !attachment) return;
    setSending(true);
    try {
      let res: Response;
      if (tab === "whatsapp" && attachment) {
        res = await uploadFile(`/api/admin/${entityType}/${entityId}/whatsapp-media`, attachment, { caption: body });
      } else {
        const path = tab === "email" ? "email" : "whatsapp";
        const payload = tab === "email" ? { subject, body } : { message: body };
        res = await api.post(`/api/admin/${entityType}/${entityId}/${path}`, payload);
      }
      const data = await res.json().catch(() => null);
      if (res.ok && data?.status === "sent") {
        show(`${tab === "email" ? "Email" : "WhatsApp message"} sent.`, "success");
        setSubject("");
        setBody("");
        setAttachment(null);
        onSent?.();
      } else if (res.ok && data?.status === "skipped_not_configured") {
        show(`${tab === "email" ? "Resend" : "WhatsApp"} isn't configured yet — logged but not delivered.`, "info");
      } else if (res.ok) {
        show(data?.error || "Send failed — see history above.", "error");
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
    <Modal isOpen={isOpen} onClose={onClose} title={`Message ${entityName}`} size="xl" chatLayout>
      <div className="flex flex-col h-full min-h-0">
        {/* Tabs — fixed at top */}
        <div className="flex gap-2 flex-shrink-0 mb-3">
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

        {!hasEmail && tab === "email" && <p className="text-xs text-amber-400 flex-shrink-0 mb-2">No email address on file.</p>}
        {!hasPhone && tab === "whatsapp" && <p className="text-xs text-amber-400 flex-shrink-0 mb-2">No phone number on file.</p>}

        {/* History — scrollable, oldest at top, newest at bottom, like a real chat */}
        <div className="flex-1 min-h-0 overflow-y-auto rounded-2xl border border-white/10 bg-black/20 p-4 mb-3">
          {loadingHistory ? (
            <p className="text-sm text-gray-500">Loading…</p>
          ) : history.length === 0 ? (
            <div className="h-full flex items-center justify-center">
              <p className="text-sm text-gray-500">No messages yet — say hello below 👋</p>
            </div>
          ) : (
            <div className="space-y-3">
              {[...history].reverse().map((m) => {
                const inbound = m.direction === "inbound";
                const StatusIcon = statusIcon[m.status];
                return (
                  <div key={m.id} className={`flex ${inbound ? "justify-start" : "justify-end"}`}>
                    <div
                      className={`max-w-[75%] rounded-2xl px-3.5 py-2.5 ${
                        inbound
                          ? "bg-white/[0.06] border border-gemini-blue/20 rounded-bl-sm"
                          : "bg-gemini-gradient/20 border border-white/10 rounded-br-sm"
                      }`}
                    >
                      <div className="flex items-center gap-1.5 mb-1">
                        {inbound ? (
                          <Inbox size={11} className="text-gemini-blue" />
                        ) : m.channel === "email" ? (
                          <Mail size={11} className="text-gray-400" />
                        ) : (
                          <MessageCircle size={11} className="text-gray-400" />
                        )}
                        <span className="text-[10px] text-gray-400">
                          {inbound ? "Received" : m.channel === "email" ? m.subject || "(no subject)" : "WhatsApp"}
                        </span>
                        {m.trigger === "stage_change" && (
                          <Badge variant="default" className="text-[9px] px-1.5 py-0">Auto</Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-200 whitespace-pre-wrap break-words">{m.body.replace(/<[^>]+>/g, "")}</p>
                      {m.media_id != null && <MediaBubble mediaId={m.media_id} mediaType={m.media_type} />}
                      <div className="flex items-center gap-1.5 mt-1.5">
                        <span className="text-[10px] text-gray-500">{new Date(m.created_at).toLocaleString()}</span>
                        {!inbound && (
                          <Badge variant={statusBadge[m.status].variant} className="text-[9px] px-1.5 py-0 ml-auto">
                            {StatusIcon && <StatusIcon size={9} className="mr-0.5" />}
                            {statusBadge[m.status].label}
                          </Badge>
                        )}
                      </div>
                      {m.error && <p className="text-[10px] text-amber-500 mt-1">{m.error}</p>}
                    </div>
                  </div>
                );
              })}
              <div ref={historyEndRef} />
            </div>
          )}
        </div>

        {/* Compose box — pinned at the bottom */}
        <div className="flex-shrink-0 space-y-2">
          {tab === "email" && (
            <Input label="Subject" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Subject line" />
          )}
          {tab === "whatsapp" && attachment && (
            <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-gray-300">
              {attachment.type.startsWith("image/") ? (
                <img src={URL.createObjectURL(attachment)} alt="" className="h-10 w-10 rounded object-cover" />
              ) : (
                <FileText size={18} className="text-gray-400 flex-shrink-0" />
              )}
              <span className="truncate flex-1">{attachment.name}</span>
              <span className="text-gray-500 flex-shrink-0">{(attachment.size / 1024).toFixed(0)}KB</span>
              <button onClick={() => setAttachment(null)} className="text-gray-400 hover:text-white flex-shrink-0">
                <X size={14} />
              </button>
            </div>
          )}
          <div className="flex items-end gap-2">
            {tab === "whatsapp" && (
              <div className="relative flex items-center gap-0.5 flex-shrink-0 pb-1">
                <button
                  type="button"
                  onClick={() => setShowEmoji((v) => !v)}
                  className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
                  title="Insert emoji"
                >
                  <Smile size={18} />
                </button>
                {showEmoji && <EmojiPicker onSelect={insertEmoji} onClose={() => setShowEmoji(false)} />}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
                  title="Attach image or document"
                >
                  <Paperclip size={18} />
                </button>
                <input ref={fileInputRef} type="file" className="hidden" onChange={handlePickFile} accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt" />
              </div>
            )}
            <div className="flex-1">
              <Textarea
                rows={2}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder={tab === "email" ? "<p>Hi there...</p>" : attachment ? "Add a caption (optional)..." : "Type a message..."}
              />
            </div>
            <Button
              onClick={handleSend}
              disabled={sending || (!body.trim() && !attachment) || (tab === "email" ? !hasEmail : !hasPhone)}
              size="sm"
              className="flex-shrink-0 mb-0.5"
            >
              <Send size={14} />
              {sending ? "Sending…" : "Send"}
            </Button>
          </div>
          {tab === "whatsapp" && (
            <p className="text-[11px] text-gray-500">
              WhatsApp only delivers free-form content within 24h of the contact messaging in first — otherwise Meta requires a pre-approved template.
            </p>
          )}
        </div>
      </div>
    </Modal>
  );
}
