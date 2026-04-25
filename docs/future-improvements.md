# Melhorias Futuras

Este documento lista evoluções possíveis para o FluxCred, considerando impacto no produto, complexidade técnica e custo operacional.

## 1. Integração Real com Open Finance

Hoje o projeto usa perfis demonstrativos locais. Uma evolução natural seria integrar provedores reais de Open Finance para coletar contas, saldos e transações com consentimento do usuário.

Benefícios:

- dados reais para cálculo de score;
- experiência mais próxima de um produto financeiro em produção;
- sincronização automática de histórico financeiro;
- maior confiabilidade para decisão de crédito.

Trade-offs:

- custo mensal de provedores de Open Finance;
- necessidade de lidar com consentimento, expiração e renovação;
- maior complexidade de tratamento de erros;
- dependência de disponibilidade de terceiros;
- requisitos mais fortes de segurança e privacidade.

## 2. Evolução do Modelo de Score

O score atual é determinístico e baseado em regras simples. Ele é explicável, mas limitado.

Melhorias possíveis:

- calibrar pesos com dados reais;
- adicionar faixas intermediárias de risco;
- separar score financeiro de decisão de crédito;
- registrar versão do modelo usado em cada score;
- criar simulador para testar cenários;
- validar o modelo com métricas históricas.

Em um estágio mais avançado, o projeto poderia usar modelos estatísticos ou machine learning, desde que houvesse volume e qualidade de dados suficientes.

## 3. Testes Automatizados Mais Completos

O projeto já possui checks e testes básicos, mas pode evoluir a cobertura.

Prioridades:

- testes unitários do cálculo de métricas financeiras;
- testes unitários do modelo de score;
- testes garantindo faixas esperadas dos perfis demo;
- testes de solicitação de crédito aprovada e recusada;
- testes e2e do fluxo completo: cadastro, verificação, login, demo, score e crédito.

## 4. Refatoração de Nomenclatura Interna

Algumas entidades ainda usam nomes históricos relacionados a Pluggy, como `pluggyItemId`, mesmo com a integração externa desativada.

Melhoria sugerida:

- renomear conceitos internos para termos neutros, como `connection`, `connectionItem` ou `institutionConnection`;
- criar migration de banco para refletir essa mudança;
- atualizar DTOs, telas e documentação.

Isso reduziria acoplamento conceitual com um provedor específico.

## 5. Painel Administrativo

O fluxo atual aprova ou recusa automaticamente. Futuramente, um painel administrativo poderia permitir acompanhamento operacional.

Possibilidades:

- visualizar solicitações de crédito;
- auditar métricas e score;
- revisar casos específicos;
- acompanhar erros de sincronização;
- gerar relatórios.

Caso a revisão manual volte a existir, ela deve ser baseada em roles/permissões de usuário, não em API key simples.

## 6. Observabilidade e Operação

Para produção, o projeto pode melhorar monitoramento e diagnóstico.

Melhorias:

- logs estruturados;
- métricas de API;
- rastreamento de erros;
- health checks mais completos;
- alertas de falha em e-mail, banco e deploy;
- dashboards operacionais no ambiente de hospedagem.

## 7. Segurança e Privacidade

Como o produto lida com dados financeiros, segurança deve evoluir junto com o escopo.

Melhorias:

- revisão de LGPD e políticas de retenção;
- criptografia de dados sensíveis em repouso quando aplicável;
- rotação de segredos;
- controle de acesso por papel;
- auditoria de eventos sensíveis;
- hardening de cookies e CORS por ambiente.

## 8. Experiência do Usuário

Melhorias de produto:

- explicar melhor os fatores que impactam o score;
- mostrar simulações de valor solicitado versus chance de aprovação;
- orientar o usuário sobre como melhorar o perfil;
- adicionar estados vazios mais claros;
- melhorar acessibilidade e responsividade de telas densas;
- permitir exportar relatórios.

## 9. Deploy e Infraestrutura

O deploy atual usa VPS, Dokploy, Traefik e Cloudflare. Futuramente, a operação pode ganhar mais robustez.

Melhorias:

- backups automáticos e testados do PostgreSQL;
- ambientes separados de homologação e produção;
- deploy com migrations controladas;
- rollback documentado;
- monitoramento de certificados e DNS;
- secrets gerenciados com rotação periódica.
