export function captureTokenFromUrl() {
  const hash = new URLSearchParams(window.location.hash.replace("#", ""));
  const token = hash.get("token");
  if (token) {
    localStorage.setItem("auth_token", token);
    history.replaceState({}, document.title, window.location.pathname);
  }
}

export function isTokenValid(): boolean {
  const t = localStorage.getItem("auth_token");
  if (!t) return false;
  const parts = t.split(".");
  if (parts.length !== 3) return false;
  try {
    const payload = JSON.parse(atob(parts[1]));
    const exp = Number(payload.exp || 0) * 1000;
    return Date.now() < exp;
  } catch {
    return false;
  }
}
