import {random, hash} from "../../_shared/crypto.js";
import {TX, cookie, headers, error, base, readCookie} from "../../_shared/cookies.js";
import {provider} from "../../_shared/providers.js";
export async function onRequest(context) {
  const {request, env, params} = context;
  if (!["google", "github"].includes(params.provider)) return error(404);
  if (request.method !== "GET") return error(405);
  try {
    const origin = base(env, request), p = provider(params.provider, env, origin);
    const tx = random(), state = random(), verifier = random(), nonce = p.name === "google" ? random() : null;
    const now = Math.floor(Date.now() / 1000);
    const previous = readCookie(request, TX);
    if (previous) await env.DB.prepare("DELETE FROM oauth_transactions WHERE id_hash = ?").bind(await hash(previous)).run();
    await env.DB.prepare("DELETE FROM oauth_transactions WHERE expires_at <= ?").bind(now).run();
    await env.DB.prepare("INSERT INTO oauth_transactions (id_hash, provider, state_hash, nonce, code_verifier, expires_at) VALUES (?, ?, ?, ?, ?, ?)").bind(await hash(tx), p.name, await hash(state), nonce, verifier, now + 600).run();
    const url = new URL(p.authorize);
    for (const [key, value] of Object.entries({client_id:p.clientId, redirect_uri:p.redirectUri, response_type:"code", state, code_challenge:await hash(verifier), code_challenge_method:"S256"})) url.searchParams.set(key,value);
    if (nonce) {url.searchParams.set("nonce",nonce); url.searchParams.set("scope","openid email profile");}
    const h = headers(); h.set("Location",url.href); h.append("Set-Cookie",cookie(TX,tx,600,"Lax"));
    return new Response(null,{status:302,headers:h});
  } catch {return error(503, "Login indisponível. Confira a configuração do projeto.");}
}
