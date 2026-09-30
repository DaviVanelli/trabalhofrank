# Validação na implantação real
## Caminho feliz
- /api/health: 200.
- /api/me sem sessão: 401.
- Login Google e GitHub: início 302, PKCE S256, callback exato e cookie temporário seguro.
- Google solicita openid email profile e nonce. GitHub não solicita scope nem nonce.
- Client Secret e code_verifier ausentes das URLs de autorização.
- Autenticar nos dois provedores e confirmar o perfil mínimo em /api/me.
- Verificar que localStorage e sessionStorage não contêm tokens.
- GitHub funciona com e-mail público ausente; autorização revogada antes da sessão.
- Logout POST da origem correta: redireciona; /api/me retorna 401.
- Arquivos estáticos continuam acessíveis sem sessão.
- Provedor desconhecido: 404; método inválido no logout: 405.

## Falhas obrigatórias
Registrar quatro campos por caso: preparação, pedido enviado (sem valores sensíveis), resultado esperado e observado.
1. Retorno sem cookie: concluir login em janela sem cookie temporário. Callback recusado sem sessão.
2. State alterado: alterar um caractere antes da autenticação. Recusa antes da troca de código.
3. Reutilização: repetir o retorno já concluído. Recusa porque transação foi consumida.
4. Expiração: após login, executar UPDATE sessions SET expires_at = 0; no banco exclusivo do laboratório. /api/me: 401.
5. Origem inválida: POST de outra origem ao logout. Recusa e sessão original preservada.
6. Cookie revogado: em sessão exclusiva de teste, conservar temporariamente cookie, sair e restaurá-lo. /api/me: 401. Descartar cópia imediatamente.

Também conferir transação expirada, corrida de callbacks (apenas uma conclusão), rejeição de assinatura/audiência/nonce inválidos no Google e falha de revogação no GitHub.
Não salvar URLs transitórias, cookies nem corpos de troca de tokens nas evidências.
