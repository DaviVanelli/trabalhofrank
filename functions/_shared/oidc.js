import {decode, equal} from "./crypto.js";
async function json(url) {
  const response = await timedFetch(url, {redirect: "error"});
  if (!response.ok) throw new Error("identity");
  return response.json();
}
export async function validateGoogle(token, clientId, nonce) {
  if (typeof token !== "string" || token.length > 20000) throw new Error("identity");
  const parts = token.split(".");
  if (parts.length !== 3) throw new Error("identity");
  const header = JSON.parse(new TextDecoder().decode(decode(parts[0])));
  if (header.alg !== "RS256" || typeof header.kid !== "string" || header.crit) throw new Error("identity");
  const discovery = await json("https://accounts.google.com/.well-known/openid-configuration");
  if (discovery.issuer !== "https://accounts.google.com") throw new Error("identity");
  const jwksURL = new URL(discovery.jwks_uri);
  if (jwksURL.protocol !== "https:" || jwksURL.hostname !== "www.googleapis.com" || jwksURL.username || jwksURL.password) throw new Error("identity");
  const jwks = await json(jwksURL.href);
  const candidates = jwks.keys.filter(k => k.kid === header.kid && k.kty === "RSA" && (!k.use || k.use === "sig") && (!k.alg || k.alg === "RS256"));
  if (candidates.length !== 1) throw new Error("identity");
  const key = await crypto.subtle.importKey("jwk", candidates[0], {name: "RSASSA-PKCS1-v1_5", hash: "SHA-256"}, false, ["verify"]);
  const valid = await crypto.subtle.verify("RSASSA-PKCS1-v1_5", key, decode(parts[2]), new TextEncoder().encode(parts[0] + "." + parts[1]));
  if (!valid) throw new Error("identity");
  const claims = JSON.parse(new TextDecoder().decode(decode(parts[1])));
  const now = Math.floor(Date.now() / 1000);
  const audience = claims.aud === clientId || (Array.isArray(claims.aud) && claims.aud.includes(clientId) && claims.azp === clientId);
  if (!["https://accounts.google.com", "accounts.google.com"].includes(claims.iss) || !audience || (claims.azp !== undefined && claims.azp !== clientId) ||
      !Number.isInteger(claims.exp) || claims.exp <= now || !Number.isInteger(claims.iat) || claims.iat > now + 60 || claims.iat >= claims.exp ||
      !equal(claims.nonce, nonce) || typeof claims.sub !== "string" || !claims.sub) throw new Error("identity");
  return {issuer: "https://accounts.google.com", subject: claims.sub, email: claims.email_verified === true && typeof claims.email === "string" ? claims.email : null, displayName: typeof claims.name === "string" ? claims.name : "Usuário Google"};
}

async function timedFetch(url, options = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10000);
  try { return await fetch(url, {...options, signal: controller.signal}); }
  finally { clearTimeout(timer); }
}
