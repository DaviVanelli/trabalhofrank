export const TX = "__Host-oauth-tx";
export const SESSION = "__Host-session";
export function readCookie(request, name) {
  const matches = (request.headers.get("Cookie") || "").split(";").map(s => s.trim()).filter(s => s.startsWith(name + "="));
  if (matches.length !== 1) return null;
  const value = matches[0].slice(name.length + 1);
  return /^[A-Za-z0-9_-]{43}$/.test(value) ? value : null;
}
export function cookie(name, value, age, sameSite) {
  return name + "=" + value + "; Path=/; HttpOnly; Secure; SameSite=" + sameSite + "; Max-Age=" + age;
}
export function headers() {
  return new Headers({"Cache-Control": "no-store", "Referrer-Policy": "no-referrer", "X-Content-Type-Options": "nosniff"});
}
export function error(status, message = "Não foi possível concluir esta solicitação.") {
  return new Response(message, {status, headers: headers()});
}
export function base(env, request) {
  const url = new URL(env.PUBLIC_BASE_URL);
  if (url.protocol !== "https:" || !url.hostname.endsWith(".pages.dev") || url.origin !== env.PUBLIC_BASE_URL || new URL(request.url).origin !== url.origin) throw new Error("configuration");
  if (!env.DB) throw new Error("configuration");
  return url.origin;
}
