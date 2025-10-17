// src/lib/api.js
function detectApiBase() {
  // 1) Vite (import.meta.env.VITE_API_BASE)
  try {
    if (typeof import.meta !== "undefined" && import.meta.env && import.meta.env.REACT_APP_API_BASE) {
      return import.meta.env.REACT_APP_API_BASE;
    }
  } catch (_) {}

  // 2) CRA (process.env.REACT_APP_API_BASE)
  if (typeof process !== "undefined" && process.env && process.env.REACT_APP_API_BASE) {
    return process.env.REACT_APP_API_BASE;
  }

  // 3) Dev local fallback
  if (typeof window !== "undefined" && window.location && window.location.hostname === "localhost") {
    return "http://localhost:3001";
  }

  // 4) Produção sem variável -> mesma origem / proxy
  return "";
}

const API_BASE = detectApiBase();
console.log("[API_BASE]", API_BASE);

export async function postJSON({ path, body, init }) {
  const url = `${API_BASE}${path}`;
  const r = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(init?.headers || {}) },
    body: JSON.stringify(body ?? {}),
    ...init,
  });
  if (!r.ok) {
    const text = await r.text().catch(() => "");
    throw new Error(`HTTP ${r.status} ${r.statusText} :: ${text}`);
  }
  return r.json();
}
