# Melhorias Futuras

Este documento lista evolucoes possiveis para o FluxCred, considerando impacto no produto, complexidade tecnica e custo operacional.

## 1. Integracao Real com Open Finance

Hoje o projeto usa perfis demonstrativos locais. Uma evolucao natural seria integrar provedores reais de Open Finance para coletar contas, saldos e transacoes com consentimento do usuario.

Beneficios:

- dados reais para calculo de score;
- experiencia mais proxima de um produto financeiro em producao;
- sincronizacao automatica de historico financeiro;
- maior confiabilidade para decisao de credito.

Trade-offs:

- custo mensal de provedores de Open Finance;
- necessidade de lidar com consentimento, expiracao e renovacao;
- maior complexidade de tratamento de erros;
- dependencia de disponibilidade de terceiros;
- requisitos mais fortes de seguranca e privacidade.

## 2. Evolucao do Modelo de Score

O score atual e deterministico e baseado em regras simples. Ele e explicavel, mas limitado.

Melhorias possiveis:

- calibrar pesos com dados reais;
- adicionar faixas intermediarias de risco;
- separar score financeiro de decisao de credito;
- registrar versao do modelo usado em cada score;
- criar simulador para testar cenarios;
- validar o modelo com metricas historicas.

Em um estagio mais avancado, o projeto poderia usar modelos estatisticos ou machine learning, desde que houvesse volume e qualidade de dados suficientes.

## 3. Testes Automatizados Mais Completos

O projeto ja possui checks e testes basicos, mas pode evoluir a cobertura.

Prioridades:

- testes unitarios do calculo de metricas financeiras;
- testes unitarios do modelo de score;
- testes garantindo faixas esperadas dos perfis demo;
- testes de solicitacao de credito aprovada e recusada;
- testes e2e do fluxo completo: cadastro, verificacao, login, demo, score e credito.

## 4. Refatoracao de Nomenclatura Interna

Algumas entidades ainda usam nomes historicos relacionados a Pluggy, como `pluggyItemId`, mesmo com a integracao externa desativada.

Melhoria sugerida:

- renomear conceitos internos para termos neutros, como `connection`, `connectionItem` ou `institutionConnection`;
- criar migration de banco para refletir essa mudanca;
- atualizar DTOs, telas e documentacao.

Isso reduziria acoplamento conceitual com um provedor especifico.

## 5. Painel Administrativo

O fluxo atual aprova ou recusa automaticamente. Futuramente, um painel administrativo poderia permitir acompanhamento operacional.

Possibilidades:

- visualizar solicitacoes de credito;
- auditar metricas e score;
- revisar casos especificos;
- acompanhar erros de sincronizacao;
- gerar relatorios.

Caso a revisao manual volte a existir, ela deve ser baseada em roles/permissoes de usuario, nao em API key simples.

## 6. Observabilidade e Operacao

Para producao, o projeto pode melhorar monitoramento e diagnostico.

Melhorias:

- logs estruturados;
- metricas de API;
- rastreamento de erros;
- health checks mais completos;
- alertas de falha em email, banco e deploy;
- dashboards operacionais no ambiente de hospedagem.

## 7. Seguranca e Privacidade

Como o produto lida com dados financeiros, seguranca deve evoluir junto com o escopo.

Melhorias:

- revisao de LGPD e politicas de retencao;
- criptografia de dados sensiveis em repouso quando aplicavel;
- rotacao de segredos;
- controle de acesso por papel;
- auditoria de eventos sensiveis;
- hardening de cookies e CORS por ambiente.

## 8. Experiencia do Usuario

Melhorias de produto:

- explicar melhor os fatores que impactam o score;
- mostrar simulacoes de valor solicitado versus chance de aprovacao;
- orientar o usuario sobre como melhorar o perfil;
- adicionar estados vazios mais claros;
- melhorar acessibilidade e responsividade de telas densas;
- permitir exportar relatorios.

## 9. Deploy e Infraestrutura

O deploy atual usa VPS, Dokploy, Traefik e Cloudflare. Futuramente, a operacao pode ganhar mais robustez.

Melhorias:

- backups automaticos e testados do PostgreSQL;
- ambientes separados de homologacao e producao;
- deploy com migrations controladas;
- rollback documentado;
- monitoramento de certificados e DNS;
- secrets gerenciados com rotacao periodica.
