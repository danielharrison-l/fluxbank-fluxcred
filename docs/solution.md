# Documento da Solucao

## 1. Visao Geral

### Problema

Autonomos e profissionais liberais podem ter dificuldade para acessar credito quando a avaliacao depende de comprovantes tradicionais de renda. O projeto busca demonstrar uma forma simples de avaliar comportamento financeiro a partir de movimentacoes, saldo e recorrencia de renda.

### Solucao

O FluxCred permite criar uma conta, conectar um perfil demonstrativo, visualizar dashboard financeiro, consultar score de credito e solicitar credito. Em ambiente local, os perfis demo geram contas, transacoes, metricas e score sem depender de integracao bancaria externa.

## 2. Arquitetura

### Diagrama

O diagrama esta em [architecture-diagram.mmd](./architecture-diagram.mmd).

```mermaid
flowchart LR
  User[Usuario] --> Web[Frontend React/Vite]
  Web --> API[API NestJS]
  API --> Auth[Modulo Auth]
  API --> Demo[Modulo Demo]
  API --> Metrics[Metricas Financeiras]
  API --> Score[Score de Credito]
  API --> Requests[Solicitacoes de Credito]
  API --> DB[(PostgreSQL)]
  Auth --> DB
  Demo --> DB
  Metrics --> DB
  Score --> DB
  Requests --> DB
  API --> Mail[Email: console local ou Resend]
```

### Principais Componentes

- Frontend: aplicacao React com Vite para cadastro, login, dashboard, analise, score, conexao demo e solicitacao de credito.
- API: backend NestJS com modulos de autenticacao, usuarios, demo, contas, transacoes, metricas, score e solicitacoes.
- Banco: PostgreSQL acessado via Prisma.
- Email: em desenvolvimento, os links de verificacao e reset sao impressos no console; em producao, pode ser usado Resend.
- Demo: gera massa de dados local para quatro perfis financeiros: excelente, aprovado, limitrofe e recusado.

### Infraestrutura e Deploy

Para hospedar o projeto, foi utilizada uma VPS da Hostinger com Dokploy autohospedado. O Dokploy centraliza a configuracao e a operacao dos servicos, incluindo deploy automatizado, gerenciamento de aplicacoes, variaveis de ambiente, logs e configuracoes de infraestrutura.

A exposicao publica dos servicos usa proxy reverso com Traefik, permitindo rotear os subdominios para os containers/servicos corretos. Os apontamentos de DNS dos subdominios sao feitos pela Cloudflare, que tambem facilita a gestao do dominio e da camada de DNS.

O envio de emails transacionais usa o plano gratuito da Resend, configurado com o dominio do projeto. Essa configuracao permite enviar emails de verificacao de conta e recuperacao de senha usando um remetente do proprio dominio.

Resumo da infraestrutura:

- VPS: Hostinger.
- Orquestracao/deploy: Dokploy autohospedado.
- Proxy reverso: Traefik.
- DNS/subdominios: Cloudflare.
- Email transacional: Resend no plano gratuito.
- Deploy: automatizado via recursos do Dokploy.

## 3. Modelo de Score

### Dados Utilizados

O score usa metricas derivadas das transacoes do usuario:

- frequencia de renda;
- estabilidade da renda;
- relacao entre despesas e receitas;
- saldo medio;
- volume medio de renda;
- penalidades de risco.

### Calculo das Metricas

As metricas financeiras sao calculadas a partir de um periodo informado ou dos ultimos 90 dias:

- `totalIncome`: soma das transacoes de credito.
- `totalExpense`: soma absoluta das transacoes de debito.
- `avgMonthlyIncome`: renda media mensal.
- `incomeDays`: dias com entrada de renda.
- `noIncomeDays`: dias sem entrada.
- `expenseRatio`: despesas divididas por receitas.
- `averageBalance`: media dos saldos apos transacoes.

### Calculo do Score

O score final vai de 0 a 1000. Primeiro e calculada uma base de 0 a 100:

- frequencia de renda: ate 25 pontos;
- estabilidade da renda: ate 20 pontos;
- fluxo de caixa: ate 20 pontos;
- saldo medio: ate 15 pontos;
- volume de renda: ate 10 pontos;
- penalidade de risco: ate 30 pontos negativos.

A base e limitada entre 0 e 100 e multiplicada por 10.

### Regras de Aprovacao

- Score igual ou superior a 600: aprovado.
- Score abaixo de 600: recusado.
- Para score igual ou superior a 800, o limite recomendado e 30% da renda media mensal.
- Para score entre 600 e 799, o limite recomendado e 15% da renda media mensal.
- A solicitacao de credito e aprovada apenas se o valor solicitado estiver dentro do limite recomendado.

## 4. Decisoes Tecnicas

### Tecnologias Escolhidas

- NestJS: estrutura modular para a API.
- Prisma: acesso tipado ao PostgreSQL e migrations versionadas.
- PostgreSQL: banco relacional adequado para usuarios, contas, transacoes e historico de score.
- React + Vite: frontend leve, rapido e simples de executar localmente.
- TanStack Query: carregamento e cache de dados no frontend.
- Tailwind CSS: construcao rapida de interfaces responsivas.
- Resend: opcao simples para envio real de email.
- Dokploy: facilita deploy, configuracao de servicos, logs e automacao em uma VPS propria.
- Traefik: proxy reverso para expor API e frontend por subdominios.
- Cloudflare: gerenciamento de DNS e apontamento dos subdominios.

### Trade-offs

- O projeto usa dados demonstrativos locais em vez de integracao bancaria real neste momento. Isso reduz dependencia externa e facilita testes, mas nao representa conectividade real com bancos.
- A verificacao de email e mantida no fluxo local usando links no console. Isso preserva o comportamento real sem exigir conta de email transacional.
- O modelo de score e deterministico e simples. Ele e explicavel, mas nao substitui modelos estatisticos ou validacao com dados reais.
- O refresh token usa cookie HTTP-only, enquanto o access token fica em memoria no frontend. Isso reduz persistencia indevida do token de acesso, mas exige refresh apos reload.

## 5. Limitacoes e Melhorias Futuras

### Limitacoes

- Nao ha integracao bancaria externa ativa.
- O score foi definido por regras fixas e nao por modelo treinado.
- Os perfis demo sao sinteticos.
- Nao ha painel administrativo.
- O fluxo de credito aprova ou recusa automaticamente; nao ha revisao manual.
- A nomenclatura interna ainda possui referencias historicas a `pluggy` em entidades de banco usadas como conexoes.

### Melhorias Futuras

- Renomear entidades internas de conexao para termos neutros, como `connectionItem`.
- Adicionar testes automatizados para garantir faixas esperadas dos perfis demo.
- Criar testes e2e cobrindo cadastro, verificacao por console, login, conexao demo, score e solicitacao de credito.
- Reintroduzir uma integracao bancaria real quando houver credenciais e escopo de produto definidos.
- Evoluir o score com dados reais, validacao estatistica e acompanhamento de performance.
- Adicionar observabilidade, logs estruturados e tratamento mais detalhado de erros em producao.

Uma lista mais completa esta em [Melhorias Futuras](./future-improvements.md).
