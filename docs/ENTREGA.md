# Evidências finais
A seção 6 do PDF contém instruções contraditórias sobre a publicação. A exigência explícita de avaliação automática determina public/entrega1 com exatamente estes oito arquivos:

1. 01-pages-configuracao.pdf: nome do projeto, produção main e opções de construção. Sem identificadores privados.
2. 02-google-retorno.txt: somente a URL de retorno cadastrada.
3. 03-github-retorno.txt: página inicial e URL de retorno cadastradas.
4. 04-d1-esquema.txt: nomes e tipos realmente obtidos no console com:
   SELECT name, type FROM sqlite_schema WHERE name NOT LIKE 'sqlite_%' ORDER BY type, name;
5. 05-inicio-login-google.pdf: cabeçalhos observados, saneados. Cookie, state, nonce e code_challenge substituídos por [REMOVIDO].
6. 06-inicio-login-github.pdf: cabeçalhos observados, saneados. Cookie, state e code_challenge substituídos por [REMOVIDO].
7. 07-testes-falha.md: preparação, pedido enviado saneado, esperado e observado dos seis testes.
8. 08-aceitacao.md: critérios do PDF, status verdadeiro e assinatura dos participantes.

A pasta só deverá receber os arquivos quando existir evidência real. Não preencher resultados, URLs ou assinaturas por suposição.
