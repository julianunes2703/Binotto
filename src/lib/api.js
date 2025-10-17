// src/lib/api.js  (CRA-friendly)
function detectApiBase() {
  // CRA injeta env em build time: process.env.REACT_APP_*
  const fromEnv = (typeof process !== "undefined" && process.env && process.env.REACT_APP_API_BASE) 
    ? process.env.REACT_APP_API_BASE 
    : "";

  if (fromEnv) return fromEnv;

  // Dev local fallback (quando rodando npm start)
  if (typeof window !== "undefined" && window.location.hostname === "localhost") {
    return "http://localhost:3001";
  }

  // Produção sem env -> mesma origem (útil se você optar por rewrites)
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
