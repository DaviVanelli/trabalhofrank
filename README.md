# Trabalho Frank - Avaliação 2
Site de login em português, Pages Functions sem dependências e sessões revogáveis no D1.

## Estado real
Código implementado. Publicação, banco, registros OAuth, testes de integração e evidências finais ainda pendentes. Não considerar este repositório uma entrega concluída.
O dashboard original da disciplina não foi disponibilizado; foi criada uma página de login conforme a alternativa mínima do roteiro.

## Estrutura
- public/: página, JavaScript e CSS públicos.
- functions/: rotas executadas no servidor.
- database/schema.sql: esquema para executar no console D1.
- docs/: configuração e roteiro de testes.
- public/entrega1/: reservado exclusivamente aos oito arquivos finais saneados, depois dos testes reais.

## Configuração
No Cloudflare Pages conecte este repositório, produção main, framework None, comando de construção vazio, saída public e raiz vazia.
Crie o D1, execute database/schema.sql e vincule como DB. Reimplante após alterar ligações e variáveis.

Variáveis: PUBLIC_BASE_URL (origem HTTPS pages.dev sem barra final), GOOGLE_CLIENT_ID e GITHUB_CLIENT_ID.
Segredos criptografados: GOOGLE_CLIENT_SECRET e GITHUB_CLIENT_SECRET.
Nunca salve os valores de segredos no GitHub, em arquivos locais, mensagens ou evidências.

Google: cliente Web, aplicativo em teste, contas autorizadas como usuárias de teste; retorno PUBLIC_BASE_URL/oauth/callback/google; escopos openid email profile.
GitHub: OAuth App com página inicial PUBLIC_BASE_URL, retorno PUBLIC_BASE_URL/oauth/callback/github e Device Flow desativado. Não solicitar escopos.
Nenhum cartão, assinatura, Node.js, npm, npx ou Wrangler é necessário para configurar este projeto.

## Segurança
Transações duram 10 minutos e são consumidas atomicamente antes da troca do código. As sessões duram 8 horas; o banco conserva apenas o SHA-256 do cookie. Google exige verificação RS256 e validação das claims; GitHub exige /user e revogação da autorização antes de criar a sessão. O logout aceita somente POST da origem canônica.
Os arquivos estáticos permanecem públicos. Não há conta local nem autorização por nome ou e-mail. O logout encerra apenas a sessão local.

## Entrega
Consulte docs/ENTREGA.md e docs/TESTES.md. Somente marque resultados observados depois de executar os casos na implantação real. Não publique cookies, state, nonce, code_challenge, códigos, tokens, segredos ou identificadores privados de conta. A assinatura deve ser feita pelos participantes.
