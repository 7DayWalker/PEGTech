/**
 * Lead Gen SaaS — Frontend Application
 * Multi-niche lead generation and outreach dashboard.
 */

const API_BASE = ""; // Same origin (FastAPI serves the frontend)

class App {
  constructor() {
    this.token = localStorage.getItem("lg_token") || null;
    this.user = null;
    this.init();
  }

  init() {
    this.bindAuth();
    this.bindForms();
    this.checkAuth();
  }

  // ------------------------------------------------------------------
  // Auth
  // ------------------------------------------------------------------
  bindAuth() {
    const btnLogin = document.getElementById("btnLogin");
    const btnDashboard = document.getElementById("btnDashboard");
    const btnLogout = document.getElementById("btnLogout");
    const btnSubmitLogin = document.getElementById("btnSubmitLogin");

    if (btnLogin) btnLogin.addEventListener("click", () => this.showAuth());
    if (btnDashboard) btnDashboard.addEventListener("click", () => this.showDashboard());
    if (btnLogout) btnLogout.addEventListener("click", () => this.logout());
    if (btnSubmitLogin) {
      btnSubmitLogin.addEventListener("click", (e) => {
        e.preventDefault();
        const email = document.getElementById("loginEmail").value;
        const password = document.getElementById("loginPassword").value;
        this.login(email, password);
      });
    }
  }

  async login(email, password) {
    try {
      const resp = await fetch(`${API_BASE}/api/v1/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await resp.json();

      if (data.access_token) {
        this.token = data.access_token;
        localStorage.setItem("lg_token", this.token);
        await this.checkAuth();
        this.showDashboard();
        this.loadDashboard();
      } else {
        this.showMsg("authMsg", data.detail || "Login failed", "error");
      }
    } catch (err) {
      this.showMsg("authMsg", err.message, "error");
    }
  }

  logout() {
    this.token = null;
    this.user = null;
    localStorage.removeItem("lg_token");
    this.updateAuthUI();
    this.showAuth();
  }

  async checkAuth() {
    if (!this.token) {
      this.showAuth();
      return;
    }

    try {
      const resp = await fetch(`${API_BASE}/api/v1/auth/me`, {
        headers: { Authorization: `Bearer ${this.token}` },
      });
      if (resp.ok) {
        this.user = await resp.json();
        this.updateAuthUI();
        this.showDashboard();
      } else {
        this.logout();
      }
    } catch (err) {
      this.logout();
    }
  }

  updateAuthUI() {
    const btnLogin = document.getElementById("btnLogin");
    const btnDashboard = document.getElementById("btnDashboard");
    const btnLogout = document.getElementById("btnLogout");
    const userEmail = document.getElementById("userEmail");

    if (this.token && this.user) {
      if (btnLogin) btnLogin.classList.add("hidden");
      if (btnDashboard) btnDashboard.classList.remove("hidden");
      if (btnLogout) btnLogout.classList.remove("hidden");
      if (userEmail) {
        userEmail.classList.remove("hidden");
        userEmail.textContent = this.user.email || "";
      }
    } else {
      if (btnLogin) btnLogin.classList.remove("hidden");
      if (btnDashboard) btnDashboard.classList.add("hidden");
      if (btnLogout) btnLogout.classList.add("hidden");
      if (userEmail) userEmail.classList.add("hidden");
    }
  }

  // ------------------------------------------------------------------
  // API helper
  // ------------------------------------------------------------------
  async api(path, options = {}) {
    const headers = {
      "Content-Type": "application/json",
      ...options.headers,
    };
    if (this.token) headers["Authorization"] = `Bearer ${this.token}`;

    const resp = await fetch(`${API_BASE}/api/v1${path}`, { ...options, headers });

    if (resp.status === 401) {
      this.logout();
      throw new Error("Session expired");
    }

    const data = await resp.json().catch(() => ({}));
    if (!resp.ok) throw new Error(data.detail || `Request failed (${resp.status})`);
    return data;
  }

  // ------------------------------------------------------------------
  // Dashboard
  // ------------------------------------------------------------------
  async loadDashboard() {
    try {
      const [leads, campaigns, sends] = await Promise.all([
        this.api("/leads?page_size=100"),
        this.api("/campaigns"),
        this.api("/sends/stats"),
      ]);

      document.getElementById("statTotalLeads").textContent = leads.total || 0;
      document.getElementById("statContacted").textContent = leads.leads.filter(l => l.send_status !== "not_contacted").length;
      document.getElementById("statCampaigns").textContent = campaigns.length;
      document.getElementById("statSends").textContent = sends.total || 0;

      this.renderLeads(leads.leads);
      this.loadNichesForFilters();
    } catch (err) {
      console.error(err);
    }
  }

  async loadNichesForFilters() {
    try {
      const niches = await this.api("/niches");
      const nicheSelect = document.getElementById("liNicheId");
      const filterSelect = document.getElementById("leadNicheFilter");

      if (nicheSelect) {
        nicheSelect.innerHTML = '<option value="">Select niche (optional)</option>';
        for (const n of niches) {
          nicheSelect.innerHTML += `<option value="${n.id}">${escapeHtml(n.name)}</option>`;
        }
      }
      if (filterSelect) {
        filterSelect.innerHTML = '<option value="">All Niches</option>';
        for (const n of niches) {
          filterSelect.innerHTML += `<option value="${n.id}">${escapeHtml(n.name)}</option>`;
        }
      }
    } catch (err) {
      console.error(err);
    }
  }

  renderLeads(leads) {
    const tbody = document.getElementById("leadsTableBody");
    if (!tbody) return;
    tbody.innerHTML = "";

    if (!leads || leads.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" class="empty-state">No leads yet. Add your first lead.</td></tr>`;
      return;
    }

    for (const lead of leads) {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td><strong>${escapeHtml(lead.business_name)}</strong></td>
        <td>${escapeHtml(lead.niche_id ? lead.niche_name || "—" : "—")}</td>
        <td>${escapeHtml(lead.phone || "-")}</td>
        <td>${escapeHtml(lead.email || "-")}</td>
        <td><span class="badge ${this.statusClass(lead.send_status)}">${escapeHtml(lead.send_status)}</span></td>
        <td><button class="btn-ghost btn-sm" onclick="app.editLead(${lead.id})">Edit</button></td>
      `;
      tbody.appendChild(tr);
    }
  }

  statusClass(status) {
    switch (status) {
      case "contacted": return "badge-green";
      case "replied": return "badge-green";
      case "opted_out": return "badge-gray";
      default: return "badge-yellow";
    }
  }

  async loadLeads() {
    try {
      const search = document.getElementById("leadSearch")?.value || "";
      const nicheId = document.getElementById("leadNicheFilter")?.value || "";
      const status = document.getElementById("leadStatusFilter")?.value || "";

      let url = `/leads?page_size=100`;
      if (search) url += `&search=${encodeURIComponent(search)}`;
      if (nicheId) url += `&niche_id=${nicheId}`;
      if (status) url += `&send_status=${status}`;

      const data = await this.api(url);
      this.renderLeads(data.leads);
      document.getElementById("statTotalLeads").textContent = data.total || 0;
    } catch (err) {
      console.error(err);
    }
  }

  // ------------------------------------------------------------------
  // Modals
  // ------------------------------------------------------------------
  openModal(id) {
    const el = document.getElementById(id);
    if (el) el.classList.remove("hidden");
  }

  closeModal(id) {
    const el = document.getElementById(id);
    if (el) el.classList.add("hidden");
  }

  // ------------------------------------------------------------------
  // Forms
  // ------------------------------------------------------------------
  bindForms() {
    // Niche form
    const nicheForm = document.getElementById("nicheForm");
    if (nicheForm) {
      nicheForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const niche = {
          name: document.getElementById("nName").value,
          slug: document.getElementById("nSlug").value,
          description: document.getElementById("nDesc").value,
        };
        try {
          await this.api("/niches", { method: "POST", body: JSON.stringify(niche) });
          this.showMsg("nicheMsg", "Niche saved!", "success");
          nicheForm.reset();
          setTimeout(() => this.closeModal("nicheModal"), 800);
          this.loadNichesForFilters();
          this.loadDashboard();
        } catch (err) {
          this.showMsg("nicheMsg", err.message, "error");
        }
      });
    }

    // Lead form
    const leadForm = document.getElementById("leadForm");
    if (leadForm) {
      leadForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const lead = {
          business_name: document.getElementById("liBusinessName").value,
          niche_id: document.getElementById("liNicheId").value || undefined,
          phone: document.getElementById("liPhone").value,
          address: document.getElementById("liAddress").value,
          city: document.getElementById("liCity").value,
          state: document.getElementById("liState").value,
          email: document.getElementById("liEmail").value,
          rating: parseFloat(document.getElementById("liRating").value) || undefined,
          review_count: parseInt(document.getElementById("liReviewCount").value) || undefined,
        };
        try {
          await this.api("/leads", { method: "POST", body: JSON.stringify(lead) });
          this.showMsg("leadMsg", "Lead saved!", "success");
          leadForm.reset();
          setTimeout(() => this.closeModal("leadModal"), 800);
          this.loadLeads();
        } catch (err) {
          this.showMsg("leadMsg", err.message, "error");
        }
      });
    }

    // Campaign form
    const campaignForm = document.getElementById("campaignForm");
    if (campaignForm) {
      campaignForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const campaign = {
          name: document.getElementById("cpName").value,
          channel: document.getElementById("cpChannel").value,
          subject: document.getElementById("cpSubject").value,
          body_text: document.getElementById("cpBody").value,
        };
        try {
          await this.api("/campaigns", { method: "POST", body: JSON.stringify(campaign) });
          this.showMsg("campaignMsg", "Campaign created!", "success");
          campaignForm.reset();
          setTimeout(() => this.closeModal("campaignModal"), 800);
          this.loadDashboard();
        } catch (err) {
          this.showMsg("campaignMsg", err.message, "error");
        }
      });
    }
  }

  editLead(id) {
    alert("Lead editing coming soon.");
  }

  // ------------------------------------------------------------------
  // UI
  // ------------------------------------------------------------------
  showAuth() {
    document.getElementById("authSection").classList.remove("hidden");
    document.getElementById("dashboardSection").classList.add("hidden");
  }

  showDashboard() {
    document.getElementById("authSection").classList.add("hidden");
    document.getElementById("dashboardSection").classList.remove("hidden");
  }

  showMsg(id, text, type) {
    const el = document.getElementById(id);
    if (!el) return;
    el.textContent = text;
    el.className = `alert alert-${type}`;
    el.classList.remove("hidden");
    setTimeout(() => el.classList.add("hidden"), 4000);
  }
}

function escapeHtml(text) {
  if (!text) return "";
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

const app = new App();