import {hash, random, equal} from "../../_shared/crypto.js";
import {TX, SESSION, readCookie, cookie, headers, error, base} from "../../_shared/cookies.js";
import {provider, identity} from "../../_shared/providers.js";
function reject(status = 400, detail = "Transação inválida ou expirada. Inicie um novo login.") {
  const response = error(status, "Login recusado. " + detail);
  response.headers.append("Set-Cookie", cookie(TX,"",0,"Lax"));
  return response;
}
export async function onRequest(context) {
  const {request, env, params} = context;
  if (!["google","github"].includes(params.provider)) return error(404);
  if (request.method !== "GET") return error(405);
  let stage = "configuração";
  try {
    const origin = base(env,request), p = provider(params.provider,env,origin);
    const query = new URL(request.url).searchParams;
    const code = query.get("code"), state = query.get("state"), txCookie = readCookie(request,TX);
    if (query.has("error") || query.getAll("code").length !== 1 || query.getAll("state").length !== 1 || !code || code.length > 4096 || !state || !/^[A-Za-z0-9_-]{43}$/.test(state) || !txCookie) return reject();
    stage = "consulta da transação no D1";
    const now = Math.floor(Date.now()/1000), txHash = await hash(txCookie), stateHash = await hash(state);
    const tx = await env.DB.prepare("SELECT * FROM oauth_transactions WHERE id_hash = ? AND provider = ? AND expires_at > ?").bind(txHash,p.name,now).first();
    if (!tx || !equal(tx.state_hash,stateHash)) return reject();
    stage = "consumo da transação no D1";
    const consumed = await env.DB.prepare("DELETE FROM oauth_transactions WHERE id_hash = ? AND provider = ? AND state_hash = ? AND expires_at > ? RETURNING id_hash").bind(txHash,p.name,stateHash,now).first();
    if (!consumed) return reject();
    stage = "troca do código ou validação da identidade: confira a chave secreta do provedor";
    const user = await identity(p,code,tx);
    const session = random(), issued = Math.floor(Date.now()/1000), previous = readCookie(request,SESSION);
    const statements = [];
    if (previous) statements.push(env.DB.prepare("DELETE FROM sessions WHERE id_hash = ?").bind(await hash(previous)));
    statements.push(env.DB.prepare("DELETE FROM sessions WHERE expires_at <= ?").bind(issued));
    statements.push(env.DB.prepare("INSERT INTO sessions (id_hash,issuer,subject,email,display_name,expires_at,created_at) VALUES (?,?,?,?,?,?,?)").bind(await hash(session),user.issuer,user.subject,user.email,user.displayName,issued+28800,issued));
    stage = "gravação da sessão no D1";
    await env.DB.batch(statements);
    const h = headers(); h.set("Location",origin); h.append("Set-Cookie",cookie(TX,"",0,"Lax")); h.append("Set-Cookie",cookie(SESSION,session,28800,"Strict"));
    return new Response(null,{status:302,headers:h});
  } catch (e) {
    const details = {invalid_client: "Google recusou as credenciais do cliente.", invalid_grant: "Provedor recusou o código ou PKCE.", redirect_uri_mismatch: "Endereço de retorno divergente.", token_exchange: "Provedor recusou a troca do código.", google_validation: "Falha na validação criptográfica ou nos dados do ID token Google."};
    const detail = Object.prototype.hasOwnProperty.call(details, e?.message) ? details[e.message] : "Falha na etapa: " + stage + ".";
    return reject(502, detail);
  }
}
