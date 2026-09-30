import {hash} from "../_shared/crypto.js";
import {SESSION,readCookie,cookie,headers,error,base} from "../_shared/cookies.js";
export async function onRequest(context) {
  const {request,env} = context;
  if (request.method !== "POST") return error(405);
  try {
    const origin = base(env,request);
    if (request.headers.get("Origin") !== origin) return error(403,"Origem recusada.");
    const session = readCookie(request,SESSION);
    if (session) await env.DB.prepare("DELETE FROM sessions WHERE id_hash = ?").bind(await hash(session)).run();
    const h = headers(); h.append("Set-Cookie",cookie(SESSION,"",0,"Strict")); h.set("Location",origin);
    return new Response(null,{status:303,headers:h});
  } catch {return error(503);}
}
