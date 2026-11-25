/** Staff dashboard — Projects management. */
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
import { ArrowLeft, Plus, Folder, Pencil, Trash2 } from "lucide-react";

type Client = { id: number; company: string };
type Project = {
  id: number;
  name: string;
  slug: string;
  description?: string | null;
  status?: string | null;
  budget_usd?: number | null;
  started_at?: string | null;
  due_at?: string | null;
  client_id: number;
};

const emptyForm = {
  name: "",
  slug: "",
  description: "",
  status: "planning",
  budget_usd: "",
  started_at: "",
  due_at: "",
  client_id: "",
};

const statusVariant: Record<string, "default" | "success" | "warning" | "accent"> = {
  planning: "default",
  active: "accent",
  in_progress: "accent",
  review: "warning",
  completed: "success",
  on_hold: "warning",
};

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function ProjectsAdmin() {
  useTitle("Projects — PEGTech Admin");
  const { show } = useToast();
  const [projects, setProjects] = useState<Project[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [slugTouched, setSlugTouched] = useState(false);
  const [saving, setSaving] = useState(false);

  function load() {
    setLoading(true);
    Promise.all([
      api.get("/api/admin/projects").then((r) => (r.ok ? r.json() : [])),
      api.get("/api/admin/clients").then((r) => (r.ok ? r.json() : [])),
    ]).then(([projectsData, clientsData]) => {
      setProjects(projectsData);
      setClients(clientsData);
      setLoading(false);
    });
  }

  useEffect(load, []);

  const clientName = (id: number) => clients.find((c) => c.id === id)?.company || `Client #${id}`;

  const filtered = useMemo(
    () => projects.filter((p) => statusFilter === "all" || p.status === statusFilter),
    [projects, statusFilter],
  );

  function openCreate() {
    setEditingId(null);
    setForm(emptyForm);
    setSlugTouched(false);
    setModalOpen(true);
  }

  function openEdit(p: Project) {
    setEditingId(p.id);
    setForm({
      name: p.name,
      slug: p.slug,
      description: p.description || "",
      status: p.status || "planning",
      budget_usd: p.budget_usd != null ? String(p.budget_usd) : "",
      started_at: p.started_at ? p.started_at.slice(0, 10) : "",
      due_at: p.due_at ? p.due_at.slice(0, 10) : "",
      client_id: String(p.client_id),
    });
    setSlugTouched(true);
    setModalOpen(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const payload: Record<string, unknown> = {
      name: form.name,
      slug: form.slug || slugify(form.name),
      description: form.description || null,
      status: form.status,
      budget_usd: form.budget_usd ? Number(form.budget_usd) : null,
      started_at: form.started_at || null,
      due_at: form.due_at || null,
    };
    if (!editingId) payload.client_id = Number(form.client_id);
    try {
      const res = editingId
        ? await api.put(`/api/projects/${editingId}`, payload)
        : await api.post("/api/admin/projects", payload);
      if (res.ok) {
        show(editingId ? "Project updated." : "Project created.", "success");
        setModalOpen(false);
        load();
      } else {
        const data = await res.json().catch(() => ({}));
        show(data.detail ? JSON.stringify(data.detail) : "Couldn't save project.", "error");
      }
    } catch {
      show("Network error — couldn't save project.", "error");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: number) {
    if (!window.confirm("Delete this project? This can't be undone.")) return;
    const res = await api.delete(`/api/projects/${id}`);
    if (res.ok) {
      show("Project deleted.", "success");
      load();
    } else {
      show("Couldn't delete project.", "error");
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
              <span className="text-gradient">Projects</span>
            </h1>
            <p className="text-gray-400 text-sm">{projects.length} total</p>
          </div>
          <Button onClick={openCreate} size="sm" disabled={clients.length === 0}>
            <Plus size={16} />
            New Project
          </Button>
        </div>

        <Card padding="md" className="mb-6">
          <select className="input-base sm:w-56" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="all">All statuses</option>
            <option value="planning">Planning</option>
            <option value="active">Active</option>
            <option value="in_progress">In progress</option>
            <option value="review">Review</option>
            <option value="on_hold">On hold</option>
            <option value="completed">Completed</option>
          </select>
        </Card>

        <Card padding="none" className="overflow-hidden">
          {loading ? (
            <div className="p-10 text-center text-gray-400">Loading projects…</div>
          ) : clients.length === 0 ? (
            <div className="p-10 text-center text-gray-400">
              <Folder size={32} className="mx-auto mb-3 opacity-40" />
              Add a client first — projects need to belong to one.
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-10 text-center text-gray-400">
              <Folder size={32} className="mx-auto mb-3 opacity-40" />
              No projects match your filter yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10 text-left text-gray-400">
                    <th className="px-5 py-3 font-medium">Project</th>
                    <th className="px-5 py-3 font-medium">Client</th>
                    <th className="px-5 py-3 font-medium">Status</th>
                    <th className="px-5 py-3 font-medium">Budget</th>
                    <th className="px-5 py-3 font-medium">Due</th>
                    <th className="px-5 py-3 font-medium"></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((p) => (
                    <tr key={p.id} className="border-b border-white/5 hover:bg-white/[0.03] transition-colors">
                      <td className="px-5 py-3 text-white font-medium">
                        {p.name}
                        <div className="text-xs text-gray-500">/{p.slug}</div>
                      </td>
                      <td className="px-5 py-3 text-gray-300">{clientName(p.client_id)}</td>
                      <td className="px-5 py-3">
                        <Badge variant={statusVariant[p.status || "planning"] || "default"}>
                          {(p.status || "planning").replace("_", " ")}
                        </Badge>
                      </td>
                      <td className="px-5 py-3 text-gray-300">
                        {p.budget_usd != null ? `$${p.budget_usd.toLocaleString()}` : "—"}
                      </td>
                      <td className="px-5 py-3 text-gray-400">{p.due_at ? p.due_at.slice(0, 10) : "—"}</td>
                      <td className="px-5 py-3">
                        <div className="flex items-center justify-end gap-3">
                          <button onClick={() => openEdit(p)} className="text-gray-400 hover:text-white transition-colors" aria-label={`Edit ${p.name}`}>
                            <Pencil size={16} />
                          </button>
                          <button onClick={() => handleDelete(p.id)} className="text-gray-400 hover:text-red-400 transition-colors" aria-label={`Delete ${p.name}`}>
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
      </Container>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editingId ? "Edit project" : "New project"} size="lg">
        <form onSubmit={handleSave} className="space-y-5">
          <div className="grid sm:grid-cols-2 gap-4">
            <Input
              label="Name *"
              required
              value={form.name}
              onChange={(e) => {
                const name = e.target.value;
                update("name", name);
                if (!slugTouched) update("slug", slugify(name));
              }}
            />
            <Input
              label="Slug"
              value={form.slug}
              onChange={(e) => {
                setSlugTouched(true);
                update("slug", slugify(e.target.value));
              }}
            />
            {!editingId && (
              <Select label="Client *" required value={form.client_id} onChange={(e) => update("client_id", e.target.value)}>
                <option value="">Select a client…</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>{c.company}</option>
                ))}
              </Select>
            )}
            <Select label="Status" value={form.status} onChange={(e) => update("status", e.target.value)}>
              <option value="planning">Planning</option>
              <option value="active">Active</option>
              <option value="in_progress">In progress</option>
              <option value="review">Review</option>
              <option value="on_hold">On hold</option>
              <option value="completed">Completed</option>
            </Select>
            <Input label="Budget (USD)" type="number" min={0} value={form.budget_usd} onChange={(e) => update("budget_usd", e.target.value)} />
            <Input label="Start date" type="date" value={form.started_at} onChange={(e) => update("started_at", e.target.value)} />
            <Input label="Due date" type="date" value={form.due_at} onChange={(e) => update("due_at", e.target.value)} />
          </div>
          <Textarea label="Description" rows={3} value={form.description} onChange={(e) => update("description", e.target.value)} />
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="ghost" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={saving}>{saving ? "Saving…" : editingId ? "Save changes" : "Create project"}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
