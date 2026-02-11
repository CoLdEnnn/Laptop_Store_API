const API_BASE = "http://localhost:3000";
function setToken(token) {
  localStorage.setItem("token", token);
}

function getToken() {
  return localStorage.getItem("token");
}

function authHeaders() {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}


async function registerUser({ name, email, password }) {
  const res = await fetch(`${API_BASE}/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email, password })
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || "Register failed");

  setToken(data.token);
  return data;
}

async function loginUser({ email, password }) {
  const res = await fetch(`${API_BASE}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password })
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || "Login failed");

  setToken(data.token);
  return data;
}

async function getProfile() {
  const res = await fetch(`${API_BASE}/users/profile`, {
    headers: { ...authHeaders() }
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || "Profile failed");

  return data;
}


function $(id) {
  return document.getElementById(id);
}

function showMessage(msg, isError = false) {
  const el = $("msg");
  if (!el) return;
  el.textContent = msg;
  el.className = isError ? "msg error" : "msg ok";
}


window.app = {
  registerUser,
  loginUser,
  getProfile,
  showMessage
};


(async () => {
  if (!getToken()) return;
  try {
    const data = await getProfile();
    console.log("Profile:", data);
  } catch (e) {
    console.warn(e.message);
  }
})();
