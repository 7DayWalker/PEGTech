/** Staff dashboard — Leads pipeline management. */
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useTitle } from "../../lib/useTitle";
import { api } from "../../lib/api";
import { useToast } from "../../lib/Toast";
import { Card } from "../../components/Card";
import { Container } from "../../components/Section";
import { Badge } from "../../components/Badge";
import { Button } from "../../components/Button";
import { Modal } from "../../components/Modal";
import { Input, Select, Textarea } from "../../components/Input";
import { GlowBackground } from "../../components/GlowBackground";
import { MessageCenterModal } from "../../components/MessageCenterModal";
import {
  ArrowLeft, Plus, Mail, Pencil, Trash2, Phone, MessageSquare,
  ArrowRight, Trophy, LayoutGrid, Rows3,
} from "lucide-react";

type Lead = {
  id: number;
  name: string;
  business_name?: string | null;
  source?: string | null;
  service?: string | null;
  score?: string | null;
  value_usd?: number | null;
  stage: number;
  email?: string | null;
  phone?: string | null;
  city?: string | null;
  country?: string | null;
  whatsapp_opt_in?: boolean;
  email_opt_in?: boolean;
  notes?: string | null;
};

const STAGES = ["New", "Contacted", "Qualified", "Proposal", "Won"];

const STAGE_DOT = ["bg-blue-400", "bg-teal-400", "bg-amber-400", "bg-purple-400", "bg-emerald-400"];

const scoreVariant: Record<string, "default" | "success" | "warning"> = {
  HOT: "warning",
  WARM: "default",
  COLD: "default",
};

const emptyForm = {
  name: "",
  business_name: "",
  source: "",
  service: "",
  score: "WARM",
  value_usd: "",
  stage: 0,
  email: "",
  phone: "",
  city: "",
  country: "",
  whatsapp_opt_in: false,
  email_opt_in: false,
  notes: "",
};

export function LeadsAdmin() {
  useTitle("Leads — PEGTech Admin");
  const { show } = useToast();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [stageFilter, setStageFilter] = useState<number | "all">("all");
  const [view, setView] = useState<"board" | "list">(() => (localStorage.getItem("pegtech_leads_view") as "board" | "list") || "board");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [messagingLead, setMessagingLead] = useState<Lead | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  function load() {
    setLoading(true);
    api.get("/api/admin/leads").then(async (res) => {
      setLeads(res.ok ? await res.json() : []);
      setLoading(false);
    });
  }

  useEffect(load, []);

  const filtered = useMemo(
    () => leads.filter((l) => stageFilter === "all" || l.stage === stageFilter),
    [leads, stageFilter],
  );

  const stageCounts = useMemo(() => {
    const counts = [0, 0, 0, 0, 0];
    leads.forEach((l) => { if (l.stage >= 0 && l.stage <= 4) counts[l.stage]++; });
    return counts;
  }, [leads]);

  const columns = useMemo(() => {
    const cols: Lead[][] = [[], [], [], [], []];
    leads.forEach((l) => { if (l.stage >= 0 && l.stage <= 4) cols[l.stage].push(l); });
    return cols;
  }, [leads]);

  const totalValue = useMemo(
    () => leads.reduce((sum, l) => sum + (l.value_usd || 0), 0),
    [leads],
  );

  function switchView(next: "board" | "list") {
    setView(next);
    localStorage.setItem("pegtech_leads_view", next);
  }

  function openCreate() {
    setEditingId(null);
    setForm(emptyForm);
    setModalOpen(true);
  }

  function openEdit(l: Lead) {
    setEditingId(l.id);
    setForm({
      name: l.name,
      business_name: l.business_name || "",
      source: l.source || "",
      service: l.service || "",
      score: l.score || "WARM",
      value_usd: l.value_usd != null ? String(l.value_usd) : "",
      stage: l.stage,
      email: l.email || "",
      phone: l.phone || "",
      city: l.city || "",
      country: l.country || "",
      whatsapp_opt_in: !!l.whatsapp_opt_in,
      email_opt_in: !!l.email_opt_in,
      notes: l.notes || "",
    });
    setModalOpen(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const payload: Record<string, unknown> = {
      ...form,
      value_usd: form.value_usd ? Number(form.value_usd) : 0,
      stage: Number(form.stage),
    };
    for (const k of ["business_name", "source", "service", "email", "phone", "city", "country", "notes"]) {
      if (payload[k] === "") payload[k] = null;
    }
    try {
      const res = editingId
        ? await api.put(`/api/admin/leads/${editingId}`, payload)
        : await api.post("/api/admin/leads", payload);
      if (res.ok) {
        show(editingId ? "Lead updated." : "Lead created.", "success");
        setModalOpen(false);
        load();
      } else {
        const data = await res.json().catch(() => ({}));
        show(data.detail ? JSON.stringify(data.detail) : "Couldn't save lead.", "error");
      }
    } catch {
      show("Network error — couldn't save lead.", "error");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: number) {
    if (!window.confirm("Delete this lead? This can't be undone.")) return;
    const res = await api.delete(`/api/leads/${id}`);
    if (res.ok) {
      show("Lead deleted.", "success");
      load();
    } else {
      show("Couldn't delete lead.", "error");
    }
  }

  async function advanceStage(l: Lead) {
    if (l.stage >= 4) return;
    const res = await api.put(`/api/admin/leads/${l.id}`, { stage: l.stage + 1 });
    if (res.ok) load();
  }

  function update<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  return (
    <div className="relative overflow-hidden py-8 px-4 min-h-screen">
      <GlowBackground />
      <Container className="relative">
        <div className="flex items-center gap-3 mb-6">
          <Link to="/admin" className="text-gray-400 hover:text-white transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-white">
              <span className="text-gradient">Leads</span>
            </h1>
            <p className="text-gray-400 text-sm">
              {leads.length} total{totalValue > 0 && <> · ${totalValue.toLocaleString()} pipeline value</>}
            </p>
          </div>
          <div className="flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.03] p-1">
            <button
              onClick={() => switchView("board")}
              className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                view === "board" ? "bg-gemini-gradient text-white" : "text-gray-400 hover:text-white"
              }`}
              aria-label="Board view"
            >
              <LayoutGrid size={14} /> Board
            </button>
            <button
              onClick={() => switchView("list")}
              className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                view === "list" ? "bg-gemini-gradient text-white" : "text-gray-400 hover:text-white"
              }`}
              aria-label="List view"
            >
              <Rows3 size={14} /> List
            </button>
          </div>
          <Button onClick={openCreate} size="sm">
            <Plus size={16} />
            New Lead
          </Button>
        </div>

        {loading ? (
          <Card className="p-10 text-center text-gray-400">Loading leads…</Card>
        ) : leads.length === 0 ? (
          <Card className="p-10 text-center text-gray-400">
            <Mail size={32} className="mx-auto mb-3 opacity-40" />
            No leads here yet.
          </Card>
        ) : view === "board" ? (
          <div className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4 sm:mx-0 sm:px-0">
            {STAGES.map((label, i) => (
              <div key={label} className="flex-shrink-0 w-[270px] flex flex-col gap-3">
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${STAGE_DOT[i]}`} />
                    <span className="text-sm font-semibold text-white">{label}</span>
                    <span className="text-xs text-gray-500">{stageCounts[i]}</span>
                  </div>
                </div>
                <div className="flex flex-col gap-3 min-h-[60px]">
                  {columns[i].length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-white/10 p-4 text-center text-xs text-gray-600">
                      No leads
                    </div>
                  ) : (
                    columns[i].map((l) => (
                      <LeadCard
                        key={l.id}
                        lead={l}
                        onMessage={() => setMessagingLead(l)}
                        onEdit={() => openEdit(l)}
                        onDelete={() => handleDelete(l.id)}
                        onAdvance={() => advanceStage(l)}
                      />
                    ))
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <>
            {/* Pipeline summary (List view filter) */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
              {STAGES.map((label, i) => (
                <button
                  key={label}
                  onClick={() => setStageFilter(stageFilter === i ? "all" : i)}
                  className={`glass-card rounded-2xl p-4 text-left transition-all ${
                    stageFilter === i ? "border-gemini-purple/50 bg-white/[0.08]" : "hover:bg-white/[0.06]"
                  }`}
                >
                  <p className="text-xs text-gray-400 mb-1">{label}</p>
                  <p className="text-xl font-bold text-white">{stageCounts[i]}</p>
                </button>
              ))}
            </div>

            <Card padding="none" className="overflow-hidden">
              {filtered.length === 0 ? (
                <div className="p-10 text-center text-gray-400">
                  <Mail size={32} className="mx-auto mb-3 opacity-40" />
                  No leads here yet.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-white/10 text-left text-gray-400">
                        <th className="px-5 py-3 font-medium">Lead</th>
                        <th className="px-5 py-3 font-medium">Contact</th>
                        <th className="px-5 py-3 font-medium">Service</th>
                        <th className="px-5 py-3 font-medium">Score</th>
                        <th className="px-5 py-3 font-medium">Value</th>
                        <th className="px-5 py-3 font-medium">Stage</th>
                        <th className="px-5 py-3 font-medium"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((l) => (
                        <tr key={l.id} className="border-b border-white/5 hover:bg-white/[0.03] transition-colors">
                          <td className="px-5 py-3 text-white font-medium">
                            {l.name}
                            {l.business_name && <div className="text-xs text-gray-500">{l.business_name}</div>}
                          </td>
                          <td className="px-5 py-3 text-gray-400">
                            <div className="flex flex-col gap-0.5">
                              {l.email && <span className="flex items-center gap-1.5"><Mail size={12} />{l.email}</span>}
                              {l.phone && <span className="flex items-center gap-1.5"><Phone size={12} />{l.phone}</span>}
                            </div>
                          </td>
                          <td className="px-5 py-3 text-gray-300">{l.service || "—"}</td>
                          <td className="px-5 py-3">
                            <Badge variant={scoreVariant[l.score || "WARM"] || "default"}>{l.score || "WARM"}</Badge>
                          </td>
                          <td className="px-5 py-3 text-gray-300">
                            {l.value_usd ? `$${l.value_usd.toLocaleString()}` : "—"}
                          </td>
                          <td className="px-5 py-3">
                            <button
                              onClick={() => advanceStage(l)}
                              disabled={l.stage >= 4}
                              className="text-left disabled:cursor-default"
                              title={l.stage < 4 ? `Advance to ${STAGES[l.stage + 1]}` : "Won"}
                            >
                              <Badge variant={l.stage === 4 ? "success" : "default"}>{STAGES[l.stage]}</Badge>
                            </button>
                          </td>
                          <td className="px-5 py-3">
                            <div className="flex items-center justify-end gap-3">
                              <button
                                onClick={() => setMessagingLead(l)}
                                disabled={!l.email && !l.phone}
                                className="text-gray-400 hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                                aria-label={`Message ${l.name}`}
                              >
                                <MessageSquare size={16} />
                              </button>
                              <button onClick={() => openEdit(l)} className="text-gray-400 hover:text-white transition-colors" aria-label={`Edit ${l.name}`}>
                                <Pencil size={16} />
                              </button>
                              <button onClick={() => handleDelete(l.id)} className="text-gray-400 hover:text-red-400 transition-colors" aria-label={`Delete ${l.name}`}>
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          </>
        )}
      </Container>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editingId ? "Edit lead" : "New lead"} size="lg">
        <form onSubmit={handleSave} className="space-y-5">
          <div className="grid sm:grid-cols-2 gap-4">
            <Input label="Name *" required value={form.name} onChange={(e) => update("name", e.target.value)} />
            <Input label="Business name" value={form.business_name} onChange={(e) => update("business_name", e.target.value)} />
            <Input label="Email" type="email" value={form.email} onChange={(e) => update("email", e.target.value)} />
            <Input label="Phone (WhatsApp)" value={form.phone} onChange={(e) => update("phone", e.target.value)} />
            <Input label="City" value={form.city} onChange={(e) => update("city", e.target.value)} />
            <Input label="Country" value={form.country} onChange={(e) => update("country", e.target.value)} />
            <Input label="Service interest" value={form.service} onChange={(e) => update("service", e.target.value)} />
            <Input label="Source" placeholder="e.g. Website, Referral" value={form.source} onChange={(e) => update("source", e.target.value)} />
            <Select label="Score" value={form.score} onChange={(e) => update("score", e.target.value)}>
              <option value="HOT">Hot</option>
              <option value="WARM">Warm</option>
              <option value="COLD">Cold</option>
            </Select>
            <Input label="Estimated value (USD)" type="number" min={0} value={form.value_usd} onChange={(e) => update("value_usd", e.target.value)} />
            <Select label="Stage" value={form.stage} onChange={(e) => update("stage", Number(e.target.value))}>
              {STAGES.map((s, i) => (
                <option key={s} value={i}>{s}</option>
              ))}
            </Select>
          </div>
          <div className="flex gap-6">
            <label className="flex items-center gap-2 text-sm text-gray-300">
              <input type="checkbox" checked={form.whatsapp_opt_in} onChange={(e) => update("whatsapp_opt_in", e.target.checked)} />
              WhatsApp opt-in
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-300">
              <input type="checkbox" checked={form.email_opt_in} onChange={(e) => update("email_opt_in", e.target.checked)} />
              Email opt-in
            </label>
          </div>
          <Textarea label="Notes" rows={3} value={form.notes} onChange={(e) => update("notes", e.target.value)} />
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="ghost" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={saving}>{saving ? "Saving…" : editingId ? "Save changes" : "Create lead"}</Button>
          </div>
        </form>
      </Modal>

      {messagingLead && (
        <MessageCenterModal
          isOpen={!!messagingLead}
          onClose={() => setMessagingLead(null)}
          entityType="leads"
          entityId={messagingLead.id}
          entityName={messagingLead.name}
          hasEmail={!!messagingLead.email}
          hasPhone={!!messagingLead.phone}
          onSent={load}
        />
      )}
    </div>
  );
}

function LeadCard({
  lead, onMessage, onEdit, onDelete, onAdvance,
}: {
  lead: Lead;
  onMessage: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onAdvance: () => void;
}) {
  return (
    <Card padding="sm" className="!p-4">
      <div className="flex items-start justify-between gap-2 mb-1">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-white truncate" title={lead.name}>{lead.name}</p>
          {lead.business_name && (
            <p className="text-xs text-gray-500 truncate" title={lead.business_name}>{lead.business_name}</p>
          )}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={onMessage}
            disabled={!lead.email && !lead.phone}
            className="p-1 text-gray-500 hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            aria-label={`Message ${lead.name}`}
          >
            <MessageSquare size={13} />
          </button>
          <button onClick={onEdit} className="p-1 text-gray-500 hover:text-white transition-colors" aria-label={`Edit ${lead.name}`}>
            <Pencil size={13} />
          </button>
          <button onClick={onDelete} className="p-1 text-gray-500 hover:text-red-400 transition-colors" aria-label={`Delete ${lead.name}`}>
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      {lead.service && <p className="text-xs text-gray-400 mb-2 line-clamp-1">{lead.service}</p>}

      {(lead.email || lead.phone) && (
        <div className="flex flex-col gap-0.5 mb-3">
          {lead.email && (
            <span className="flex items-center gap-1.5 text-[11px] text-gray-500 truncate">
              <Mail size={10} className="shrink-0" />{lead.email}
            </span>
          )}
          {lead.phone && (
            <span className="flex items-center gap-1.5 text-[11px] text-gray-500 truncate">
              <Phone size={10} className="shrink-0" />{lead.phone}
            </span>
          )}
        </div>
      )}

      <div className="flex items-center justify-between pt-2 border-t border-white/5">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-sm font-bold text-white truncate">
            {lead.value_usd ? `$${lead.value_usd.toLocaleString()}` : "—"}
          </span>
          <Badge variant={scoreVariant[lead.score || "WARM"] || "default"} className="text-[10px] px-2 py-0.5 shrink-0">
            {lead.score || "WARM"}
          </Badge>
        </div>
        {lead.stage < 4 ? (
          <button
            onClick={onAdvance}
            title={`Advance to ${STAGES[lead.stage + 1]}`}
            aria-label={`Advance ${lead.name} to ${STAGES[lead.stage + 1]}`}
            className="w-7 h-7 rounded-full bg-gemini-gradient text-white flex items-center justify-center hover:brightness-110 active:scale-95 transition shrink-0"
          >
            <ArrowRight size={14} />
          </button>
        ) : (
          <span className="w-7 h-7 rounded-full bg-emerald-500/15 text-emerald-400 flex items-center justify-center shrink-0" title="Won">
            <Trophy size={14} />
          </span>
        )}
      </div>
    </Card>
  );
}
