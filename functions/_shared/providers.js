import {validateGoogle} from "./oidc.js";
export function provider(name, env, base) {
  if (!["google", "github"].includes(name)) return null;
  const google = name === "google";
  const clientId = google ? env.GOOGLE_CLIENT_ID : env.GITHUB_CLIENT_ID;
  const clientSecret = google ? env.GOOGLE_CLIENT_SECRET : env.GITHUB_CLIENT_SECRET;
  if (!clientId || !clientSecret) throw new Error("configuration");
  return {name, clientId, clientSecret, redirectUri: base + "/oauth/callback/" + name,
    authorize: google ? "https://accounts.google.com/o/oauth2/v2/auth" : "https://github.com/login/oauth/authorize",
    token: google ? "https://oauth2.googleapis.com/token" : "https://github.com/login/oauth/access_token"};
}
export async function identity(p, code, tx) {
  const body = new URLSearchParams({client_id: p.clientId, client_secret: p.clientSecret, code, code_verifier: tx.code_verifier, redirect_uri: p.redirectUri, grant_type: "authorization_code"});
  let response;
  try {
    response = await timedFetch(p.token, {method: "POST", headers: {"Accept": "application/json", "Content-Type": "application/x-www-form-urlencoded"}, body: body.toString(), redirect: "error"});
  } catch (e) { throw new Error(e?.name === "AbortError" ? "token_timeout" : "token_network"); }
  let tokens;
  try { tokens = await response.json(); }
  catch { throw new Error("token_response"); }
  if (!tokens || typeof tokens !== "object") throw new Error("token_response");
  if (!response.ok || tokens.error) {
    const reason = ["invalid_client", "invalid_grant", "redirect_uri_mismatch"].includes(tokens.error) ? tokens.error : "token_exchange";
    throw new Error(reason);
  }
  if (p.name === "google") {
    try { return await validateGoogle(tokens.id_token, p.clientId, tx.nonce); }
    catch { throw new Error("google_validation"); }
  }
  if (typeof tokens.access_token !== "string" || !tokens.access_token || typeof tokens.token_type !== "string" || tokens.token_type.toLowerCase() !== "bearer") throw new Error("identity");
  let profile;
  try {
    const userResponse = await timedFetch("https://api.github.com/user", {headers: {
      Authorization: "Bearer " + tokens.access_token, Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2026-03-10", "User-Agent": "trabalhofrank-oauth-lab"
    }, redirect: "error"});
    if (userResponse.status !== 200) throw new Error("identity");
    profile = await userResponse.json();
    if (!Number.isSafeInteger(profile.id) || profile.id <= 0) throw new Error("identity");
  } finally {
    const revoke = await timedFetch("https://api.github.com/applications/" + encodeURIComponent(p.clientId) + "/grant", {
      method: "DELETE", headers: {Authorization: "Basic " + btoa(p.clientId + ":" + p.clientSecret),
        Accept: "application/vnd.github+json", "Content-Type": "application/json",
        "X-GitHub-Api-Version": "2026-03-10", "User-Agent": "trabalhofrank-oauth-lab"},
      body: JSON.stringify({access_token: tokens.access_token}), redirect: "error"
    });
    if (revoke.status !== 204) throw new Error("identity");
  }
  return {issuer: "https://github.com", subject: String(profile.id), email: typeof profile.email === "string" ? profile.email : null, displayName: profile.name || profile.login || "Usuário GitHub"};
}

async function timedFetch(url, options = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10000);
  try { return await fetch(url, {...options, signal: controller.signal}); }
  finally { clearTimeout(timer); }
}
