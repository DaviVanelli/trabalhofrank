import {hash} from "../_shared/crypto.js";
import {SESSION,readCookie,headers,error,base} from "../_shared/cookies.js";
export async function onRequest(context) {
  if (context.request.method !== "GET") return error(405);
  try {
    base(context.env,context.request);
    const session = readCookie(context.request,SESSION);
    if (!session) return error(401,"Nenhuma sessão válida.");
    const row = await context.env.DB.prepare("SELECT issuer,subject,email,display_name FROM sessions WHERE id_hash = ? AND expires_at > ?").bind(await hash(session),Math.floor(Date.now()/1000)).first();
    if (!row) return error(401,"Nenhuma sessão válida.");
    return Response.json({issuer:row.issuer,subject:row.subject,email:row.email,displayName:row.display_name},{headers:headers()});
  } catch {return error(503);}
}
