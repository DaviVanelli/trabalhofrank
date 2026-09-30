async function consultSession() {
  const status = document.getElementById("status");
  try {
    const response = await fetch("/api/me", {credentials:"same-origin",cache:"no-store"});
    if (response.status === 401) {status.textContent = "Nenhuma sessão neste navegador."; return;}
    if (!response.ok) throw new Error("unavailable");
    const user = await response.json();
    document.getElementById("name").textContent = user.displayName || "Não informado";
    document.getElementById("email").textContent = user.email || "Não disponibilizado pelo provedor";
    document.getElementById("provider").textContent = user.issuer === "https://github.com" ? "GitHub" : "Google";
    document.getElementById("login").hidden = true;
    document.getElementById("profile").hidden = false;
    status.textContent = "Sessão autenticada.";
  } catch {status.textContent = "Não foi possível consultar a sessão. O serviço pode precisar de configuração.";}
}
consultSession();
