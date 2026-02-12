const API = ""; 

const EP = {
  login: `${API}/api/auth/login`,
  me: `${API}/api/auth/me`,
  laptops: `${API}/api/laptops`,
  laptopById: (id) => `${API}/api/laptops/${id}`,
  ordersAdmin: `${API}/api/orders/admin/all`,
  orderStatus: (id) => `${API}/api/orders/${id}/status`,
};

const $ = (id) => document.getElementById(id);

function setToken(t) { localStorage.setItem("token", t); }
function getToken() { return localStorage.getItem("token"); }
function clearToken() { localStorage.removeItem("token"); }

function authHeaders() {
  const t = getToken();
  return t ? { Authorization: `Bearer ${t}` } : {};
}

function toast(msg, type = "ok") {
  const el = $("toast");
  if (!el) return;
  el.textContent = msg;
  el.className = `toast ${type}`;
  el.style.opacity = "1";
  clearTimeout(window.__toastTimer);
  window.__toastTimer = setTimeout(() => (el.style.opacity = "0"), 2200);
}
async function showAdminLinkIfAdmin() {
  const el = document.getElementById("adminLink");
  if (!el) return;

  const token = localStorage.getItem("token");
  if (!token) return;

  try {
    const res = await fetch("/api/auth/me", {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok && data?.user?.role === "admin") {
      el.style.display = "inline-flex";
    }
  } catch {}
}

document.addEventListener("DOMContentLoaded", showAdminLinkIfAdmin);

async function fetchJSON(url, opts = {}) {
  const res = await fetch(url, {
    ...opts,
    headers: {
      ...(opts.headers || {}),
      ...(opts.body ? { "Content-Type": "application/json" } : {}),
      ...authHeaders(),
    },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.message || `Request failed (${res.status})`);
  return data;
}

function initBurger() {
  const burger = $("burger");
  const links = $("navLinks");
  const actions = $("navActions");
  if (!burger || !links || !actions) return;

  burger.addEventListener("click", () => {
    links.classList.toggle("open");
    actions.classList.toggle("open");
  });
}

function renderCartBadge() {
  const badge = $("cartBadge");
  if (!badge) return;
  let cart;
  try { cart = JSON.parse(localStorage.getItem("cart:v1")) || { items: [] }; } catch { cart = { items: [] }; }
  const n = (cart.items || []).reduce((s, it) => s + Number(it.qty || 0), 0);
  badge.textContent = n;
  badge.style.display = n ? "inline-flex" : "none";
}

function setAdminUI(enabled) {
  $("adminArea").style.display = enabled ? "block" : "none";
  $("logoutBtn").style.display = enabled ? "inline-flex" : "none";
}

async function checkAdmin() {
  const token = getToken();
  if (!token) throw new Error("No token");

  const me = await fetchJSON(EP.me);
  if (me?.user?.role !== "admin") throw new Error("Not admin");
  return me.user;
}

function laptopRowHTML(p) {
  const specs = p.specs || {};
  const specText = [specs.cpu, specs.ram, specs.storage, specs.gpu].filter(Boolean).join(" • ") || "-";
  const stockClass = Number(p.stock || 0) > 0 ? "ok" : "out";
  const stockText = Number(p.stock || 0) > 0 ? `In stock: ${p.stock}` : "Out";

  return `
    <tr>
      <td><b>${escapeHTML(p.brand)}</b><div class="muted">${escapeHTML(p.model)}</div></td>
      <td class="muted">${escapeHTML(specText)}</td>
      <td><b>$${Number(p.price || 0)}</b></td>
      <td><span class="pc-stock ${stockClass}">${stockText}</span></td>
      <td>
        <button class="btn btn-ghost" data-edit="${p._id}" type="button">Edit</button>
        <button class="btn btn-ghost" style="border-color:rgba(239,68,68,.25)" data-del="${p._id}" type="button">Delete</button>
      </td>
    </tr>
  `;
}

function readLaptopForm() {
  const brand = $("brand").value.trim();
  const model = $("model").value.trim();
  const price = Number($("price").value);
  const stock = $("stock").value === "" ? 0 : Number($("stock").value);

  const specs = {
    cpu: $("cpu").value.trim(),
    ram: $("ram").value.trim(),
    storage: $("storage").value.trim(),
    gpu: $("gpu").value.trim(),
  };

  Object.keys(specs).forEach((k) => { if (!specs[k]) delete specs[k]; });

  return { brand, model, price, stock, specs };
}

function fillLaptopForm(p) {
  $("lapId").value = p._id;
  $("brand").value = p.brand || "";
  $("model").value = p.model || "";
  $("price").value = p.price ?? "";
  $("stock").value = p.stock ?? 0;

  const specs = p.specs || {};
  $("cpu").value = specs.cpu || "";
  $("ram").value = specs.ram || "";
  $("storage").value = specs.storage || "";
  $("gpu").value = specs.gpu || "";
}

function resetLaptopForm() {
  $("lapId").value = "";
  $("brand").value = "";
  $("model").value = "";
  $("price").value = "";
  $("stock").value = "";
  $("cpu").value = "";
  $("ram").value = "";
  $("storage").value = "";
  $("gpu").value = "";
}

async function loadLaptops() {
  const tbody = $("laptopsTbody");
  tbody.innerHTML = `<tr><td colspan="5" class="muted">Loading...</td></tr>`;

  const data = await fetchJSON(`${EP.laptops}?page=1&limit=100&sort=-createdAt`);
  const items = Array.isArray(data) ? data : (data.items || []);

  tbody.innerHTML = items.map(laptopRowHTML).join("") || `<tr><td colspan="5" class="muted">No laptops</td></tr>`;

  tbody.querySelectorAll("[data-edit]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const id = btn.getAttribute("data-edit");
      const p = await fetchJSON(EP.laptopById(id));
      fillLaptopForm(p);
      toast("Loaded to form");
    });
  });

  tbody.querySelectorAll("[data-del]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const id = btn.getAttribute("data-del");
      if (!confirm("Delete this laptop?")) return;
      await fetchJSON(EP.laptopById(id), { method: "DELETE" });
      toast("Deleted");
      resetLaptopForm();
      await loadLaptops();
    });
  });
}

function statusBadge(status) {
  const s = String(status || "created");
  return `<span class="order-status ${s}">${s}</span>`;
}

function orderRowHTML(o) {
  const itemsText = (o.items || []).map(it =>
    `${escapeHTML(it.brand)} ${escapeHTML(it.model)} — ${it.qty} × $${Number(it.price || 0)}`
  ).join("<br>") || "-";

  const idShort = String(o._id || "").slice(0, 8) + "…";
  const statuses = ["created", "paid", "shipped", "cancelled"];

  return `
    <tr>
      <td>
        <b>${idShort}</b>
        <div class="muted">${escapeHTML(new Date(o.createdAt || Date.now()).toLocaleString())}</div>
      </td>
      <td class="muted">${escapeHTML(String(o.userId || ""))}</td>
      <td><b>$${Number(o.total || 0)}</b></td>
      <td>${statusBadge(o.status)}</td>
      <td class="muted">${itemsText}</td>
      <td>
        <div style="display:flex; gap:10px; flex-wrap:wrap; align-items:center;">
          <select class="input" style="min-width:160px; padding:10px 12px; border-radius:14px;" data-status="${o._id}">
            ${statuses.map(s => `<option value="${s}" ${s === o.status ? "selected" : ""}>${s}</option>`).join("")}
          </select>
          <button class="btn btn-dark" data-update="${o._id}" type="button">Update</button>
        </div>
      </td>
    </tr>
  `;
}

async function loadOrders() {
  const tbody = $("ordersTbody");
  tbody.innerHTML = `<tr><td colspan="6" class="muted">Loading...</td></tr>`;

  const orders = await fetchJSON(EP.ordersAdmin);
  tbody.innerHTML = (orders || []).map(orderRowHTML).join("") || `<tr><td colspan="6" class="muted">No orders</td></tr>`;

  tbody.querySelectorAll("[data-update]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const id = btn.getAttribute("data-update");
      const sel = tbody.querySelector(`[data-status="${id}"]`);
      const status = sel.value;

      await fetchJSON(EP.orderStatus(id), {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });

      toast("Status updated");
      await loadOrders();
    });
  });
}

function showTab(name) {
  const isL = name === "laptops";
  $("panelLaptops").style.display = isL ? "block" : "none";
  $("panelOrders").style.display = isL ? "none" : "block";

  $("tabLaptops").className = isL ? "btn btn-dark" : "btn btn-ghost";
  $("tabOrders").className = isL ? "btn btn-ghost" : "btn btn-dark";
}

function escapeHTML(s) {
  return String(s ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

document.addEventListener("DOMContentLoaded", async () => {
  initBurger();
  renderCartBadge();

  const authSlot = $("authSlot");
  const accessInfo = $("accessInfo");
  const logoutBtn = $("logoutBtn");
  const loginForm = $("loginForm");

  logoutBtn.addEventListener("click", () => {
    clearToken();
    toast("Logged out");
    setAdminUI(false);
    authSlot.textContent = "Log in";
    accessInfo.textContent = "Please login as admin to use this panel.";
  });

  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    try {
      const email = $("loginEmail").value.trim();
      const password = $("loginPassword").value;
      const data = await fetchJSON(EP.login, {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      setToken(data.token);
      toast("Logged in");
      location.reload();
    } catch (err) {
      toast(err.message, "err");
    }
  });

  $("tabLaptops").addEventListener("click", () => showTab("laptops"));
  $("tabOrders").addEventListener("click", () => showTab("orders"));

  $("refreshBtn").addEventListener("click", async () => {
    try {
      if ($("panelLaptops").style.display !== "none") await loadLaptops();
      else await loadOrders();
      toast("Refreshed");
    } catch (e) {
      toast(e.message, "err");
    }
  });

  $("resetForm").addEventListener("click", resetLaptopForm);

  $("laptopForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    try {
      const id = $("lapId").value.trim();
      const payload = readLaptopForm();

      if (!payload.brand || !payload.model || !Number.isFinite(payload.price)) {
        throw new Error("brand, model, price required");
      }

      if (!id) {
        await fetchJSON(EP.laptops, { method: "POST", body: JSON.stringify(payload) });
        toast("Laptop created");
      } else {
        await fetchJSON(EP.laptopById(id), { method: "PUT", body: JSON.stringify(payload) });
        toast("Laptop updated");
      }

      resetLaptopForm();
      await loadLaptops();
    } catch (err) {
      toast(err.message, "err");
    }
  });

  try {
    const user = await checkAdmin();
    authSlot.textContent = `Admin: ${user.name}`;
    accessInfo.textContent = "Access granted ✅";
    setAdminUI(true);

    showTab("laptops");
    await loadLaptops();
  } catch (err) {
    setAdminUI(false);
    authSlot.textContent = "Log in";
    accessInfo.textContent = getToken()
      ? "You are logged in, but NOT admin (role != admin). Logout and login as admin."
      : "Please login as admin to use this panel.";
  }
});
