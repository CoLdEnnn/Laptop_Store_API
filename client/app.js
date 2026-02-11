/* Laptop Store Frontend (API-first)
   Uses your backend endpoints:
   - /api/auth/register, /api/auth/login, /api/auth/me
   - /api/laptops, /api/laptops/:id, /api/laptops/:id/reviews
   - /api/orders (GET mine), /api/orders (POST create), /api/orders/:id (PUT cancel)
*/

const API = ""; // same origin (http://localhost:3000)
const endpoints = {
  register: `${API}/api/auth/register`,
  login: `${API}/api/auth/login`,
  me: `${API}/api/auth/me`,

  laptops: `${API}/api/laptops`,
  laptopById: (id) => `${API}/api/laptops/${id}`,
  reviews: (id) => `${API}/api/laptops/${id}/reviews`,
  reviewDelete: (id, reviewId) => `${API}/api/laptops/${id}/reviews/${reviewId}`,

  orders: `${API}/api/orders`,
  orderById: (id) => `${API}/api/orders/${id}`
};

// ---------- helpers ----------
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
const money = (n) => `$${Number(n || 0).toFixed(0)}`;

function setToken(token) { localStorage.setItem("token", token); }
function getToken() { return localStorage.getItem("token"); }
function clearToken() { localStorage.removeItem("token"); }

function authHeaders() {
  const t = getToken();
  return t ? { Authorization: `Bearer ${t}` } : {};
}

async function fetchJSON(url, opts = {}) {
  const res = await fetch(url, {
    ...opts,
    headers: {
      ...(opts.headers || {}),
      ...(opts.body ? { "Content-Type": "application/json" } : {}),
      ...authHeaders()
    }
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = data?.message || `Request failed (${res.status})`;
    const err = new Error(msg);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

// ---------- auth API ----------
async function apiRegister({ name, email, password }) {
  return fetchJSON(endpoints.register, { method: "POST", body: JSON.stringify({ name, email, password }) });
}
async function apiLogin({ email, password }) {
  return fetchJSON(endpoints.login, { method: "POST", body: JSON.stringify({ email, password }) });
}
async function apiMe() {
  return fetchJSON(endpoints.me);
}

// ---------- laptops API ----------
async function apiGetLaptops(params = {}) {
  const q = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && String(v).length) q.set(k, v);
  });
  const url = q.toString() ? `${endpoints.laptops}?${q}` : endpoints.laptops;
  return fetchJSON(url, { method: "GET" });
}
async function apiGetLaptop(id) {
  return fetchJSON(endpoints.laptopById(id), { method: "GET" });
}
async function apiAddReview(id, { rating, comment }) {
  return fetchJSON(endpoints.reviews(id), { method: "POST", body: JSON.stringify({ rating, comment }) });
}
async function apiDeleteReview(id, reviewId) {
  return fetchJSON(endpoints.reviewDelete(id, reviewId), { method: "DELETE" });
}

// ---------- orders API ----------
async function apiCreateOrder(items) {
  // items: [{laptopId, qty}]
  return fetchJSON(endpoints.orders, { method: "POST", body: JSON.stringify({ items }) });
}
async function apiMyOrders() {
  return fetchJSON(endpoints.orders, { method: "GET" });
}
async function apiCancelOrder(orderId) {
  // your backend supports PUT /orders/:id with {status:"cancelled"}
  return fetchJSON(endpoints.orderById(orderId), { method: "PUT", body: JSON.stringify({ status: "cancelled" }) });
}

// ---------- cart ----------
const CART_KEY = "cart:v1";

function getCart() {
  try {
    return JSON.parse(localStorage.getItem(CART_KEY)) || { items: [] };
  } catch {
    return { items: [] };
  }
}
function saveCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  renderCartBadge();
}
function clearCart() {
  saveCart({ items: [] });
}
function cartCount() {
  const c = getCart();
  return c.items.reduce((s, it) => s + Number(it.qty || 0), 0);
}
function addToCart(laptop, qty = 1) {
  const cart = getCart();
  const id = laptop._id || laptop.id;
  const found = cart.items.find((x) => x.laptopId === id);
  if (found) found.qty += qty;
  else {
    cart.items.push({
      laptopId: id,
      brand: laptop.brand,
      model: laptop.model,
      price: laptop.price,
      qty
    });
  }
  saveCart(cart);
}
function setCartQty(laptopId, qty) {
  const cart = getCart();
  const it = cart.items.find((x) => x.laptopId === laptopId);
  if (!it) return;
  it.qty = Math.max(1, Number(qty) || 1);
  saveCart(cart);
}
function removeFromCart(laptopId) {
  const cart = getCart();
  cart.items = cart.items.filter((x) => x.laptopId !== laptopId);
  saveCart(cart);
}
function cartTotal() {
  const cart = getCart();
  return cart.items.reduce((s, it) => s + Number(it.price || 0) * Number(it.qty || 0), 0);
}

// ---------- UI shared ----------
function toast(msg, type = "ok") {
  const el = $("#toast");
  if (!el) return;
  el.textContent = msg;
  el.className = `toast ${type}`;
  el.style.opacity = "1";
  clearTimeout(window.__toastTimer);
  window.__toastTimer = setTimeout(() => { el.style.opacity = "0"; }, 2400);
}

function renderCartBadge() {
  const el = $("#cartBadge");
  if (!el) return;
  const n = cartCount();
  el.textContent = n;
  el.style.display = n ? "inline-flex" : "none";
}

async function renderAuthStatus() {
  const slot = $("#authSlot");
  if (!slot) return;

  const token = getToken();
  if (!token) {
    slot.innerHTML = `
      <a class="link" href="/auth.html">Log in</a>
      <a class="btn btn-dark" href="/auth.html">Join</a>
    `;
    return;
  }

  try {
    const me = await apiMe();
    const user = me.user;
    slot.innerHTML = `
      <a class="link" href="/orders.html">My orders</a>
      <button class="btn btn-ghost" id="logoutBtn" type="button">
        Logout (${user?.name || "user"})
      </button>
    `;
    $("#logoutBtn")?.addEventListener("click", () => {
      clearToken();
      toast("Logged out");
      renderAuthStatus();
    });
  } catch {
    clearToken();
    slot.innerHTML = `
      <a class="link" href="/auth.html">Log in</a>
      <a class="btn btn-dark" href="/auth.html">Join</a>
    `;
  }
}

function mobileMenuInit() {
  const burger = $(".burger");
  const links = $(".nav-links");
  const actions = $(".nav-actions");
  burger?.addEventListener("click", () => {
    links?.classList.toggle("open");
    actions?.classList.toggle("open");
  });
}

// ---------- page renderers ----------
function productCardHTML(p) {
  const id = p._id;
  const inStock = Number(p.stock || 0) > 0;
  return `
    <div class="product-card glass">
      <div class="pc-top">
        <div class="pc-badge">${p.brand}</div>
        <div class="pc-title">${p.model}</div>
        <div class="pc-sub">${p.specs?.cpu || "CPU"} • ${p.specs?.ram || "RAM"} • ${p.specs?.storage || "Storage"}</div>
      </div>
      <div class="pc-bottom">
        <div class="pc-price">${money(p.price)}</div>
        <div class="pc-stock ${inStock ? "ok" : "out"}">${inStock ? `In stock: ${p.stock}` : "Out of stock"}</div>
        <div class="pc-actions">
          <a class="btn btn-ghost" href="/product.html?id=${id}">View</a>
          <button class="btn btn-dark" type="button" data-add="${id}" ${inStock ? "" : "disabled"}>
            Add to cart
          </button>
        </div>
      </div>
    </div>
  `;
}

// index: featured
async function renderFeatured() {
  const wrap = $("#featuredGrid");
  if (!wrap) return;

  try {
    const data = await apiGetLaptops({ page: 1, limit: 6, sort: "-createdAt" });
    const items = data.items || data; // fallback if your API returns array
    wrap.innerHTML = (items || []).map(productCardHTML).join("") || `<div class="muted">No products yet.</div>`;

    $$("[data-add]", wrap).forEach((btn) => {
      btn.addEventListener("click", async () => {
        const id = btn.getAttribute("data-add");
        const p = (items || []).find((x) => x._id === id);
        addToCart(p, 1);
        toast("Added to cart");
      });
    });
  } catch (e) {
    wrap.innerHTML = `<div class="muted">Failed to load products: ${e.message}</div>`;
  }
}

// catalog page
async function renderCatalog() {
  const grid = $("#catalogGrid");
  if (!grid) return;

  const form = $("#filtersForm");
  const pageEl = $("#pageInfo");
  const prevBtn = $("#prevPage");
  const nextBtn = $("#nextPage");

  let state = {
    brand: "",
    minPrice: "",
    maxPrice: "",
    sort: "-createdAt",
    page: 1,
    limit: 9
  };

  function syncFromForm() {
    state.brand = $("#fBrand")?.value || "";
    state.minPrice = $("#fMin")?.value || "";
    state.maxPrice = $("#fMax")?.value || "";
    state.sort = $("#fSort")?.value || "-createdAt";
  }

  async function load() {
    grid.innerHTML = `<div class="muted">Loading…</div>`;

    try {
      const data = await apiGetLaptops(state);
      const items = data.items || data;
      const meta = data.meta || null;

      grid.innerHTML = (items || []).map(productCardHTML).join("") || `<div class="muted">No matching laptops.</div>`;

      $$("[data-add]", grid).forEach((btn) => {
        btn.addEventListener("click", () => {
          const id = btn.getAttribute("data-add");
          const p = (items || []).find((x) => x._id === id);
          addToCart(p, 1);
          toast("Added to cart");
        });
      });

      if (meta) {
        pageEl.textContent = `Page ${meta.page} of ${meta.pages} • Total ${meta.total}`;
        prevBtn.disabled = meta.page <= 1;
        nextBtn.disabled = meta.page >= meta.pages;
      } else {
        pageEl.textContent = "";
        prevBtn.disabled = true;
        nextBtn.disabled = true;
      }
    } catch (e) {
      grid.innerHTML = `<div class="muted">Failed: ${e.message}</div>`;
    }
  }

  form?.addEventListener("submit", (ev) => {
    ev.preventDefault();
    syncFromForm();
    state.page = 1;
    load();
  });

  $("#resetBtn")?.addEventListener("click", () => {
    form?.reset();
    state = { brand: "", minPrice: "", maxPrice: "", sort: "-createdAt", page: 1, limit: 9 };
    load();
  });

  prevBtn?.addEventListener("click", () => { state.page = Math.max(1, state.page - 1); load(); });
  nextBtn?.addEventListener("click", () => { state.page += 1; load(); });

  load();
}

// product page
async function renderProduct() {
  const box = $("#productBox");
  if (!box) return;

  const id = new URLSearchParams(location.search).get("id");
  if (!id) {
    box.innerHTML = `<div class="muted">No product id.</div>`;
    return;
  }

  box.innerHTML = `<div class="muted">Loading…</div>`;

  try {
    const p = await apiGetLaptop(id);
    const inStock = Number(p.stock || 0) > 0;

    box.innerHTML = `
      <div class="product-view glass">
        <div class="pv-head">
          <div class="pv-brand">${p.brand}</div>
          <h1 class="pv-title">${p.model}</h1>
          <div class="pv-sub">${p.specs?.cpu || ""} • ${p.specs?.ram || ""} • ${p.specs?.storage || ""} • ${p.specs?.gpu || ""}</div>
        </div>

        <div class="pv-body">
          <div class="pv-col">
            <div class="pv-price">${money(p.price)}</div>
            <div class="pv-stock ${inStock ? "ok" : "out"}">${inStock ? `In stock: ${p.stock}` : "Out of stock"}</div>

            <div class="pv-buy">
              <label class="label">Quantity</label>
              <input class="input" id="qty" type="number" min="1" value="1" />
              <button class="btn btn-dark" id="addBtn" type="button" ${inStock ? "" : "disabled"}>Add to cart</button>
              <a class="btn btn-ghost" href="/cart.html">Go to cart →</a>
            </div>

            <div class="pv-specs">
              <div class="spec"><span>CPU</span><b>${p.specs?.cpu || "-"}</b></div>
              <div class="spec"><span>RAM</span><b>${p.specs?.ram || "-"}</b></div>
              <div class="spec"><span>Storage</span><b>${p.specs?.storage || "-"}</b></div>
              <div class="spec"><span>GPU</span><b>${p.specs?.gpu || "-"}</b></div>
            </div>
          </div>

          <div class="pv-col">
            <h3 class="h3">Reviews</h3>
            <div id="reviewsList" class="reviews"></div>

            <div class="review-form glass" id="reviewFormBox">
              <div class="h4">Leave a review</div>
              <div class="row">
                <div>
                  <label class="label">Rating (1..5)</label>
                  <input class="input" id="rating" type="number" min="1" max="5" value="5" />
                </div>
              </div>
              <label class="label">Comment</label>
              <textarea class="input" id="comment" rows="3" placeholder="Your comment..."></textarea>
              <button class="btn btn-dark" id="sendReview" type="button">Submit</button>
              <div class="muted" id="reviewHint"></div>
            </div>
          </div>
        </div>
      </div>
    `;

    $("#addBtn")?.addEventListener("click", () => {
      const qty = Math.max(1, Number($("#qty")?.value || 1));
      addToCart(p, qty);
      toast("Added to cart");
    });

    // render reviews
    const list = $("#reviewsList");
    const reviews = Array.isArray(p.reviews) ? p.reviews : [];
    list.innerHTML = reviews.length
      ? reviews.map((r) => `
        <div class="review glass">
          <div class="review-top">
            <div class="stars">⭐ ${r.rating}</div>
            <div class="muted">${new Date(r.createdAt).toLocaleString()}</div>
          </div>
          <div class="review-text">${(r.comment || "").replaceAll("<", "&lt;")}</div>
        </div>
      `).join("")
      : `<div class="muted">No reviews yet.</div>`;

    // review submit (requires auth)
    const token = getToken();
    const hint = $("#reviewHint");
    if (!token) {
      hint.textContent = "Login to leave a review.";
      $("#sendReview").disabled = true;
    } else {
      $("#sendReview")?.addEventListener("click", async () => {
        try {
          const rating = Number($("#rating")?.value || 5);
          const comment = $("#comment")?.value || "";
          await apiAddReview(id, { rating, comment });
          toast("Review added");
          location.reload(); // simplest refresh
        } catch (e) {
          toast(e.message, "err");
        }
      });
    }
  } catch (e) {
    box.innerHTML = `<div class="muted">Failed: ${e.message}</div>`;
  }
}

// cart page
async function renderCartPage() {
  const wrap = $("#cartBox");
  if (!wrap) return;

  function render() {
    const cart = getCart();
    if (!cart.items.length) {
      wrap.innerHTML = `
        <div class="glass pad">
          <h2 class="section-title">Your cart is empty</h2>
          <p class="section-sub">Go to catalog and add laptops.</p>
          <a class="btn btn-dark" href="/catalog.html">Browse catalog</a>
        </div>
      `;
      return;
    }

    const rows = cart.items.map((it) => `
      <tr>
        <td>
          <div class="cart-title">${it.brand} <b>${it.model}</b></div>
          <div class="muted small">${it.laptopId}</div>
        </td>
        <td>${money(it.price)}</td>
        <td>
          <input class="input qty" type="number" min="1" value="${it.qty}" data-qty="${it.laptopId}" />
        </td>
        <td><b>${money(Number(it.price) * Number(it.qty))}</b></td>
        <td><button class="btn btn-ghost" type="button" data-rm="${it.laptopId}">Remove</button></td>
      </tr>
    `).join("");

    wrap.innerHTML = `
      <div class="glass pad">
        <h2 class="section-title">Cart</h2>
        <div class="cart-table">
          <table>
            <thead>
              <tr>
                <th>Item</th>
                <th>Price</th>
                <th style="width:120px">Qty</th>
                <th>Total</th>
                <th></th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
        </div>

        <div class="cart-foot">
          <div class="muted">Subtotal</div>
          <div class="big">${money(cartTotal())}</div>
        </div>

        <div class="cart-actions">
          <a class="btn btn-ghost" href="/catalog.html">← Continue shopping</a>
          <button class="btn btn-dark" id="checkoutBtn" type="button">Checkout</button>
          <button class="btn btn-ghost" id="clearBtn" type="button">Clear cart</button>
        </div>

        <div class="muted" id="checkoutHint"></div>
      </div>
    `;

    $$("[data-qty]").forEach((inp) => {
      inp.addEventListener("change", () => {
        setCartQty(inp.getAttribute("data-qty"), inp.value);
        render();
      });
    });

    $$("[data-rm]").forEach((btn) => {
      btn.addEventListener("click", () => {
        removeFromCart(btn.getAttribute("data-rm"));
        render();
        toast("Removed");
      });
    });

    $("#clearBtn")?.addEventListener("click", () => {
      clearCart();
      render();
      toast("Cart cleared");
    });

    $("#checkoutBtn")?.addEventListener("click", async () => {
      const hint = $("#checkoutHint");
      if (!getToken()) {
        hint.textContent = "Please login to checkout.";
        toast("Login required", "err");
        return;
      }
      try {
        hint.textContent = "Creating order…";
        const payload = getCart().items.map((x) => ({ laptopId: x.laptopId, qty: x.qty }));
        await apiCreateOrder(payload);
        clearCart();
        toast("Order created");
        location.href = "/orders.html";
      } catch (e) {
        hint.textContent = e.message;
        toast(e.message, "err");
      }
    });
  }

  render();
}

// orders page
async function renderOrdersPage() {
  const wrap = $("#ordersBox");
  if (!wrap) return;

  if (!getToken()) {
    wrap.innerHTML = `
      <div class="glass pad">
        <h2 class="section-title">My orders</h2>
        <p class="section-sub">Login to view your orders.</p>
        <a class="btn btn-dark" href="/auth.html">Go to login</a>
      </div>
    `;
    return;
  }

  wrap.innerHTML = `<div class="muted">Loading…</div>`;

  try {
    const orders = await apiMyOrders();
    const list = Array.isArray(orders) ? orders : (orders.items || []);

    if (!list.length) {
      wrap.innerHTML = `
        <div class="glass pad">
          <h2 class="section-title">My orders</h2>
          <p class="section-sub">No orders yet.</p>
          <a class="btn btn-dark" href="/catalog.html">Browse catalog</a>
        </div>
      `;
      return;
    }

    wrap.innerHTML = `
      <div class="glass pad">
        <h2 class="section-title">My orders</h2>
        <div class="orders">
          ${list.map((o) => {
            const canCancel = o.status !== "cancelled" && o.status !== "shipped";
            return `
              <div class="order glass">
                <div class="order-top">
                  <div>
                    <div class="order-id">Order: <b>${o._id}</b></div>
                    <div class="muted small">${new Date(o.createdAt).toLocaleString()}</div>
                  </div>
                  <div class="order-status ${o.status}">${o.status}</div>
                </div>
                <div class="order-items">
                  ${(o.items || []).map((it) => `
                    <div class="order-item">
                      <div>${it.brand} <b>${it.model}</b></div>
                      <div class="muted">${it.qty} × ${money(it.price)}</div>
                    </div>
                  `).join("")}
                </div>
                <div class="order-foot">
                  <div class="big">${money(o.total)}</div>
                  <div class="order-actions">
                    ${canCancel ? `<button class="btn btn-ghost" data-cancel="${o._id}" type="button">Cancel</button>` : ""}
                  </div>
                </div>
              </div>
            `;
          }).join("")}
        </div>
      </div>
    `;

    $$("[data-cancel]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const id = btn.getAttribute("data-cancel");
        try {
          await apiCancelOrder(id);
          toast("Order cancelled");
          renderOrdersPage();
        } catch (e) {
          toast(e.message, "err");
        }
      });
    });
  } catch (e) {
    wrap.innerHTML = `<div class="muted">Failed: ${e.message}</div>`;
  }
}

// auth page
function authPageInit() {
  const box = $("#authBox");
  if (!box) return;

  const loginForm = $("#loginForm");
  const regForm = $("#registerForm");

  loginForm?.addEventListener("submit", async (ev) => {
    ev.preventDefault();
    try {
      const email = $("#loginEmail").value.trim();
      const password = $("#loginPassword").value.trim();
      const data = await apiLogin({ email, password });
      setToken(data.token);
      toast("Logged in");
      location.href = "/catalog.html";
    } catch (e) {
      toast(e.message, "err");
    }
  });

  regForm?.addEventListener("submit", async (ev) => {
    ev.preventDefault();
    try {
      const name = $("#regName").value.trim();
      const email = $("#regEmail").value.trim();
      const password = $("#regPassword").value.trim();
      const data = await apiRegister({ name, email, password });
      setToken(data.token);
      toast("Account created");
      location.href = "/catalog.html";
    } catch (e) {
      toast(e.message, "err");
    }
  });
}

// ---------- boot ----------
document.addEventListener("DOMContentLoaded", async () => {
  renderCartBadge();
  mobileMenuInit();
  renderAuthStatus();

  const page = document.body.getAttribute("data-page");
  if (page === "home") renderFeatured();
  if (page === "catalog") renderCatalog();
  if (page === "product") renderProduct();
  if (page === "cart") renderCartPage();
  if (page === "orders") renderOrdersPage();
  if (page === "auth") authPageInit();
});
// ---- Admin link (show only if token role === "admin") ----
function decodeJwtPayload(token) {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const json = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(json);
  } catch {
    return null;
  }
}

function showAdminLinkIfAdmin() {
  const link = document.getElementById("adminLink");
  if (!link) return;

  const token = localStorage.getItem("token");
  if (!token) return;

  const payload = decodeJwtPayload(token);
  if (payload?.role === "admin") {
    link.style.display = "inline-flex";
  } else {
    link.style.display = "none";
  }
}

document.addEventListener("DOMContentLoaded", showAdminLinkIfAdmin);
