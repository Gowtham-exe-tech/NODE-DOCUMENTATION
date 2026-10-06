// Tokens are kept in plain variables (memory) on purpose. localStorage can be read by any script on the page.
const state = { accessToken: null, refreshToken: null, user: null, expiryTimer: null };
const byId = (id) => document.getElementById(id);
const apiBase = "/api/v1";
// Small helper that builds elements with textContent so product names can never inject HTML.
function createEl(tag, className, text) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text !== undefined) element.textContent = text;
  return element;
}
function logRequest(method, path, status, message) {
  const item = createEl("li", status >= 200 && status < 400 ? "ok" : "fail");
  item.append(createEl("span", "status", String(status)), createEl("span", "", `${method} ${path}`), createEl("span", "logMessage", message || ""));
  byId("activityLog").prepend(item);
}
// Sends one request and returns { status, data }. It never throws on 4xx, the caller checks status.
async function sendRequest(method, path, body, useAuth) {
  const headers = { "Content-Type": "application/json" };
  if (useAuth && state.accessToken) headers.Authorization = `Bearer ${state.accessToken}`;
  const response = await fetch(apiBase + path, { method, headers, body: body ? JSON.stringify(body) : undefined });
  const data = await response.json().catch(() => ({}));
  const detail = data.errors ? data.errors.map((item) => item.message).join(", ") : "";
  logRequest(method, path, response.status, [data.message, detail].filter(Boolean).join(": "));
  return { status: response.status, data };
}
// Used for protected routes. If the access token is rejected, try one refresh and repeat the request once.
async function api(method, path, body) {
  let result = await sendRequest(method, path, body, true);
  if (result.status === 401 && state.refreshToken && (await refreshSession())) result = await sendRequest(method, path, body, true);
  return result;
}
function setSession(data) {
  state.accessToken = data.accessToken;
  state.refreshToken = data.refreshToken;
  state.user = data.user;
  renderSession();
}
function clearSession() {
  state.accessToken = null;
  state.refreshToken = null;
  state.user = null;
  renderSession();
}
async function refreshSession() {
  // The old refresh token is revoked by the server, so the new one from the response must replace it.
  const result = await sendRequest("POST", "/auth/refresh", { refreshToken: state.refreshToken }, false);
  if (result.status === 200) { setSession(result.data); return true; }
  clearSession();
  return false;
}
// The access token is a JWT: header.payload.signature. The payload is only base64, so I can read exp for the countdown.
// This does NOT verify anything, only the server can verify the signature.
function getTokenExpiry(token) {
  try {
    const payloadPart = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(atob(payloadPart)).exp * 1000;
  } catch (error) {
    return 0;
  }
}
function updateExpiry() {
  const secondsLeft = Math.max(0, Math.round((getTokenExpiry(state.accessToken) - Date.now()) / 1000));
  byId("expiryText").textContent = `${Math.floor(secondsLeft / 60)}m ${String(secondsLeft % 60).padStart(2, "0")}s`;
  const bar = byId("expiryBar");
  bar.style.width = `${Math.min(100, (secondsLeft / 900) * 100)}%`;
  bar.classList.toggle("low", secondsLeft < 120);
}
function renderSession() {
  clearInterval(state.expiryTimer);
  const signedIn = Boolean(state.user);
  byId("guestPanel").classList.toggle("hidden", signedIn);
  byId("sessionPanel").classList.toggle("hidden", !signedIn);
  // Admin controls are only a convenience. The real protection is requireRole("admin") on the server.
  byId("adminPanel").classList.toggle("hidden", !(signedIn && state.user.role === "admin"));
  byId("adminTryButton").classList.toggle("hidden", !(signedIn && state.user.role !== "admin"));
  if (signedIn) {
    byId("userName").textContent = state.user.name;
    byId("userEmail").textContent = state.user.email;
    const badge = byId("roleBadge");
    badge.textContent = state.user.role;
    badge.className = `badge ${state.user.role}`;
    updateExpiry();
    state.expiryTimer = setInterval(updateExpiry, 1000);
  } else {
    byId("productGrid").replaceChildren();
    byId("productsMessage").textContent = "Sign in to see the catalogue.";
  }
}
function renderProducts(products) {
  const grid = byId("productGrid");
  grid.replaceChildren();
  byId("productsMessage").textContent = products.length ? "" : "No active products yet.";
  for (const product of products) {
    const card = createEl("article", "card");
    card.append(createEl("span", "chip", product.category), createEl("h3", "", product.name), createEl("p", "", product.description), createEl("span", "price", `$${product.price.toFixed(2)}`), createEl("p", "", `${product.stock} in stock`));
    if (state.user && state.user.role === "admin") {
      const deactivateButton = createEl("button", "danger", "Deactivate");
      deactivateButton.addEventListener("click", () => deactivateProduct(product.id));
      card.append(deactivateButton);
    }
    grid.append(card);
  }
}
async function loadProducts() {
  if (!state.user) return;
  const result = await api("GET", "/products");
  if (result.status === 200) renderProducts(result.data.products);
}
async function deactivateProduct(productId) {
  const result = await api("DELETE", `/products/${productId}`);
  if (result.status === 200) loadProducts();
}
async function handleAuthSubmit(event, path, body) {
  event.preventDefault();
  const result = await sendRequest("POST", path, body, false);
  if (result.status === 200 || result.status === 201) { setSession(result.data); loadProducts(); }
  else alert(result.data.message || "Something went wrong");
}
byId("loginForm").addEventListener("submit", (event) => handleAuthSubmit(event, "/auth/login", { email: byId("loginEmail").value, password: byId("loginPassword").value }));
byId("registerForm").addEventListener("submit", (event) => handleAuthSubmit(event, "/auth/register", { name: byId("registerName").value, email: byId("registerEmail").value, password: byId("registerPassword").value }));
function showTab(showLogin) {
  byId("loginForm").classList.toggle("hidden", !showLogin);
  byId("registerForm").classList.toggle("hidden", showLogin);
  byId("loginTab").classList.toggle("active", showLogin);
  byId("registerTab").classList.toggle("active", !showLogin);
}
byId("loginTab").addEventListener("click", () => showTab(true));
byId("registerTab").addEventListener("click", () => showTab(false));
byId("profileButton").addEventListener("click", async () => {
  const result = await api("GET", "/auth/me");
  if (result.status === 200) state.user = result.data.user;
  renderSession();
});
byId("refreshButton").addEventListener("click", () => refreshSession());
// Demo helper: ruins the access token so the next call returns 401 and the auto refresh kicks in.
byId("breakButton").addEventListener("click", () => { state.accessToken = "broken.token.value"; updateExpiry(); logRequest("LOCAL", "access token", 0, "Access token corrupted, try Get profile"); });
// Demo helper: a normal user calling an admin route to see the 403.
byId("adminTryButton").addEventListener("click", () => api("POST", "/products", { name: "Test", description: "RBAC test", price: 1, category: "Test", stock: 1 }));
byId("logoutButton").addEventListener("click", async () => {
  await api("POST", "/auth/logout", { refreshToken: state.refreshToken });
  clearSession();
});
byId("loadProductsButton").addEventListener("click", loadProducts);
byId("clearLogButton").addEventListener("click", () => byId("activityLog").replaceChildren());
byId("productForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  const body = { name: byId("productName").value, description: byId("productDescription").value, category: byId("productCategory").value, price: Number(byId("productPrice").value), stock: Number(byId("productStock").value) };
  const result = await api("POST", "/products", body);
  if (result.status === 201) { event.target.reset(); byId("productStock").value = 10; loadProducts(); }
});
renderSession();
