/** Staff dashboard — Clients management. */
import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useTitle } from "../../lib/useTitle";
import { api } from "../../lib/api";
import { useToast } from "../../lib/Toast";
import { usePolling } from "../../lib/usePolling";
import { Card } from "../../components/Card";
import { Container } from "../../components/Section";
import { Badge } from "../../components/Badge";
import { Button } from "../../components/Button";
import { Modal } from "../../components/Modal";
import { Input, Select, Textarea } from "../../components/Input";
import { GlowBackground } from "../../components/GlowBackground";
import { MessageCenterModal } from "../../components/MessageCenterModal";
import { ArrowLeft, Plus, Search, Pencil, Users, MessageSquare } from "lucide-react";

type Staff = { id: number; name: string | null; email: string };
type Client = {
  id: number;
  company: string;
  contact_name?: string | null;
  email?: string | null;
  phone?: string | null;
  industry?: string | null;
  market?: string | null;
  engagement?: string | null;
  campaign?: string | null;
  channels?: string | null;
  kpi_label?: string | null;
  status?: string | null;
  rag?: string | null;
  week_label?: string | null;
  progress_pct?: number | null;
  strategist_id?: number | null;
  delivery_lead_id?: number | null;
  success_lead_id?: number | null;
  strategist?: Staff | null;
  delivery_lead?: Staff | null;
  success_lead?: Staff | null;
  start_date?: string | null;
  has_unread?: boolean;
};

const emptyForm = {
  company: "",
  contact_name: "",
  email: "",
  phone: "",
  industry: "",
  market: "",
  engagement: "",
  campaign: "",
  channels: "",
  kpi_label: "",
  status: "active",
  rag: "green",
  week_label: "",
  progress_pct: 0,
  strategist_id: "",
  delivery_lead_id: "",
  success_lead_id: "",
  start_date: "",
};

const ragDot: Record<string, string> = {
  green: "bg-green-400",
  amber: "bg-amber-400",
  red: "bg-red-400",
};

const statusVariant: Record<string, "default" | "success" | "warning"> = {
  active: "success",
  paused: "warning",
  completed: "default",
};

export function ClientsAdmin() {
  useTitle("Clients — PEGTech Admin");
  const { show } = useToast();
  const [clients, setClients] = useState<Client[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [messagingClient, setMessagingClient] = useState<Client | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();

  function load(opts: { silent?: boolean } = {}) {
    if (!opts.silent) setLoading(true);
    Promise.all([
      api.get("/api/admin/clients").then((r) => (r.ok ? r.json() : [])),
      api.get("/api/admin/staff").then((r) => (r.ok ? r.json() : [])),
    ]).then(([clientsData, staffData]) => {
      setClients(clientsData);
      setStaff(staffData);
      if (!opts.silent) setLoading(false);
    });
  }

  useEffect(() => load(), []);

  // Deep-link support: ?client=<id>&action=edit|message — lets the
  // Dashboard's Daily Briefing (and Escalation detail) open the exact
  // flagged client directly instead of dumping staff onto the generic
  // client list to go hunt for it themselves.
  useEffect(() => {
    const clientId = searchParams.get("client");
    if (!clientId || clients.length === 0) return;
    const client = clients.find((c) => c.id === Number(clientId));
    if (client) {
      if (searchParams.get("action") === "message") {
        setMessagingClient(client);
      } else {
        openEdit(client);
      }
    } else {
      show("That client couldn't be found — it may have been deleted.", "error");
    }
    const next = new URLSearchParams(searchParams);
    next.delete("client");
    next.delete("action");
    setSearchParams(next, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clients]);

  // Quietly refresh in the background so new inbound messages/reactions
  // show up as an unread badge without ever needing a manual reload.
  usePolling(() => load({ silent: true }), 15000);

  const filtered = useMemo(() => {
    return clients.filter((c) => {
      const matchesQuery =
        !query ||
        c.company.toLowerCase().includes(query.toLowerCase()) ||
        (c.contact_name || "").toLowerCase().includes(query.toLowerCase());
      const matchesStatus = statusFilter === "all" || c.status === statusFilter;
      return matchesQuery && matchesStatus;
    });
  }, [clients, query, statusFilter]);

  function openCreate() {
    setEditingId(null);
    setForm(emptyForm);
    setModalOpen(true);
  }

  function openEdit(c: Client) {
    setEditingId(c.id);
    setForm({
      company: c.company || "",
      contact_name: c.contact_name || "",
      email: c.email || "",
      phone: c.phone || "",
      industry: c.industry || "",
      market: c.market || "",
      engagement: c.engagement || "",
      campaign: c.campaign || "",
      channels: c.channels || "",
      kpi_label: c.kpi_label || "",
      status: c.status || "active",
      rag: c.rag || "green",
      week_label: c.week_label || "",
      progress_pct: c.progress_pct ?? 0,
      strategist_id: c.strategist_id ? String(c.strategist_id) : "",
      delivery_lead_id: c.delivery_lead_id ? String(c.delivery_lead_id) : "",
      success_lead_id: c.success_lead_id ? String(c.success_lead_id) : "",
      start_date: c.start_date ? c.start_date.slice(0, 10) : "",
    });
    setModalOpen(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const payload: Record<string, unknown> = {
      ...form,
      progress_pct: Number(form.progress_pct) || 0,
      strategist_id: form.strategist_id ? Number(form.strategist_id) : null,
      delivery_lead_id: form.delivery_lead_id ? Number(form.delivery_lead_id) : null,
      success_lead_id: form.success_lead_id ? Number(form.success_lead_id) : null,
      start_date: form.start_date || null,
    };
    // Backend requires `company` on create but ClientUpdate allows partials —
    // strip blank optional strings so we don't overwrite with empty values.
    for (const k of Object.keys(payload)) {
      if (payload[k] === "") payload[k] = null;
    }
    try {
      const res = editingId
        ? await api.put(`/api/admin/clients/${editingId}`, payload)
        : await api.post("/api/admin/clients", payload);
      if (res.ok) {
        show(editingId ? "Client updated." : "Client created.", "success");
        setModalOpen(false);
        load();
      } else {
        const data = await res.json().catch(() => ({}));
        show(data.detail || "Couldn't save client.", "error");
      }
    } catch {
      show("Network error — couldn't save client.", "error");
    } finally {
      setSaving(false);
    }
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
              <span className="text-gradient">Clients</span>
            </h1>
            <p className="text-gray-400 text-sm">{clients.length} total</p>
          </div>
          <Button onClick={openCreate} size="sm">
            <Plus size={16} />
            New Client
          </Button>
        </div>

        <Card padding="md" className="mb-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                className="input-base pl-10"
                placeholder="Search by company or contact..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            <select
              className="input-base sm:w-48"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All statuses</option>
              <option value="active">Active</option>
              <option value="paused">Paused</option>
              <option value="completed">Completed</option>
            </select>
          </div>
        </Card>

        <Card padding="none" className="overflow-hidden">
          {loading ? (
            <div className="p-10 text-center text-gray-400">Loading clients…</div>
          ) : filtered.length === 0 ? (
            <div className="p-10 text-center text-gray-400">
              <Users size={32} className="mx-auto mb-3 opacity-40" />
              No clients match your filters yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10 text-left text-gray-400">
                    <th className="px-5 py-3 font-medium">Company</th>
                    <th className="px-5 py-3 font-medium">Contact</th>
                    <th className="px-5 py-3 font-medium">Industry / Market</th>
                    <th className="px-5 py-3 font-medium">Status</th>
                    <th className="px-5 py-3 font-medium">Health</th>
                    <th className="px-5 py-3 font-medium">Progress</th>
                    <th className="px-5 py-3 font-medium">Strategist</th>
                    <th className="px-5 py-3 font-medium"></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((c) => (
                    <tr key={c.id} className="border-b border-white/5 hover:bg-white/[0.03] transition-colors">
                      <td className="px-5 py-3 text-white font-medium">{c.company}</td>
                      <td className="px-5 py-3 text-gray-300">
                        {c.contact_name || "—"}
                        {c.email && <div className="text-xs text-gray-500">{c.email}</div>}
                      </td>
                      <td className="px-5 py-3 text-gray-400">
                        {[c.industry, c.market].filter(Boolean).join(" · ") || "—"}
                      </td>
                      <td className="px-5 py-3">
                        <Badge variant={statusVariant[c.status || "active"] || "default"}>
                          {c.status || "active"}
                        </Badge>
                      </td>
                      <td className="px-5 py-3">
                        <span className={`inline-block w-2.5 h-2.5 rounded-full ${ragDot[c.rag || "green"]}`} />
                      </td>
                      <td className="px-5 py-3 text-gray-300">{c.progress_pct ?? 0}%</td>
                      <td className="px-5 py-3 text-gray-400">{c.strategist?.name || c.strategist?.email || "—"}</td>
                      <td className="px-5 py-3 text-right">
                        <div className="flex items-center justify-end gap-3">
                          <button
                            onClick={() => setMessagingClient(c)}
                            disabled={!c.email && !c.phone}
                            className="relative text-gray-400 hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                            aria-label={`Message ${c.company}`}
                          >
                            <MessageSquare size={16} />
                            {c.has_unread && (
                              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-red-500 shadow-[0_0_0_2px_rgba(10,10,16,0.9)]" />
                            )}
                          </button>
                          <button
                            onClick={() => openEdit(c)}
                            className="text-gray-400 hover:text-white transition-colors"
                            aria-label={`Edit ${c.company}`}
                          >
                            <Pencil size={16} />
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
      </Container>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editingId ? "Edit client" : "New client"} size="lg">
        <form onSubmit={handleSave} className="space-y-5">
          <div className="grid sm:grid-cols-2 gap-4">
            <Input label="Company *" required value={form.company} onChange={(e) => update("company", e.target.value)} />
            <Input label="Contact name" value={form.contact_name} onChange={(e) => update("contact_name", e.target.value)} />
            <Input label="Email" type="email" value={form.email} onChange={(e) => update("email", e.target.value)} />
            <Input label="Phone" value={form.phone} onChange={(e) => update("phone", e.target.value)} />
            <Input label="Industry" value={form.industry} onChange={(e) => update("industry", e.target.value)} />
            <Input label="Market" placeholder="e.g. Nigeria, UK, US" value={form.market} onChange={(e) => update("market", e.target.value)} />
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <Input label="Engagement" placeholder="e.g. Growth Retainer" value={form.engagement} onChange={(e) => update("engagement", e.target.value)} />
            <Input label="Active campaign" value={form.campaign} onChange={(e) => update("campaign", e.target.value)} />
            <Select label="Status" value={form.status} onChange={(e) => update("status", e.target.value)}>
              <option value="active">Active</option>
              <option value="paused">Paused</option>
              <option value="completed">Completed</option>
            </Select>
            <Select label="Health (RAG)" value={form.rag} onChange={(e) => update("rag", e.target.value)}>
              <option value="green">Green — on track</option>
              <option value="amber">Amber — at risk</option>
              <option value="red">Red — needs attention</option>
            </Select>
            <Input label="This week's label" placeholder="e.g. Week 4" value={form.week_label} onChange={(e) => update("week_label", e.target.value)} />
            <Input
              label="Progress %"
              type="number"
              min={0}
              max={100}
              value={form.progress_pct}
              onChange={(e) => update("progress_pct", Number(e.target.value))}
            />
            <Input label="KPI label" placeholder="e.g. Leads/mo" value={form.kpi_label} onChange={(e) => update("kpi_label", e.target.value)} />
            <Input label="Start date" type="date" value={form.start_date} onChange={(e) => update("start_date", e.target.value)} />
          </div>

          <Textarea label="Channels" placeholder="e.g. WhatsApp, Email, SEO" value={form.channels} onChange={(e) => update("channels", e.target.value)} rows={2} />

          <div className="grid sm:grid-cols-3 gap-4">
            <Select label="Strategist" value={form.strategist_id} onChange={(e) => update("strategist_id", e.target.value)}>
              <option value="">Unassigned</option>
              {staff.map((s) => (
                <option key={s.id} value={s.id}>{s.name || s.email}</option>
              ))}
            </Select>
            <Select label="Delivery lead" value={form.delivery_lead_id} onChange={(e) => update("delivery_lead_id", e.target.value)}>
              <option value="">Unassigned</option>
              {staff.map((s) => (
                <option key={s.id} value={s.id}>{s.name || s.email}</option>
              ))}
            </Select>
            <Select label="Success lead" value={form.success_lead_id} onChange={(e) => update("success_lead_id", e.target.value)}>
              <option value="">Unassigned</option>
              {staff.map((s) => (
                <option key={s.id} value={s.id}>{s.name || s.email}</option>
              ))}
            </Select>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="ghost" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={saving}>{saving ? "Saving…" : editingId ? "Save changes" : "Create client"}</Button>
          </div>
        </form>
      </Modal>

      {messagingClient && (
        <MessageCenterModal
          isOpen={!!messagingClient}
          onClose={() => setMessagingClient(null)}
          entityType="clients"
          entityId={messagingClient.id}
          entityName={messagingClient.company}
          hasEmail={!!messagingClient.email}
          hasPhone={!!messagingClient.phone}
        />
      )}
    </div>
  );
}
