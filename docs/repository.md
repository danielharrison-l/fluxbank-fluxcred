# Organização do Repositório

Este documento explica como o repositório do FluxCred está organizado e por que algumas decisões foram tomadas para melhorar manutenção, build, deploy e experiência de desenvolvimento.

## Visão Geral

O projeto usa uma estrutura de monorepo com `pnpm workspaces` e Turborepo. A ideia é manter frontend, backend e configurações compartilhadas no mesmo repositório, evitando duplicação e facilitando a evolução coordenada da aplicação.

Estrutura principal:

```text
apps/
  api/   API NestJS, Prisma e módulos de domínio
  www/   Frontend React/Vite
packages/
  config/ Configurações compartilhadas de TypeScript, Jest e Biome
docs/    Documentação técnica e de produto
docker/  Imagens auxiliares
```

## Por que Monorepo

O monorepo foi escolhido porque o projeto tem partes que evoluem juntas:

- a API define contratos consumidos pelo frontend;
- mudanças de autenticação, score, crédito e demo normalmente exigem ajuste nos dois lados;
- configurações de lint, TypeScript e testes podem ser centralizadas;
- o onboarding fica mais simples, com um único repositório e comandos padronizados;
- o deploy consegue usar a mesma base de código para construir serviços separados.

Essa abordagem reduz a fricção para um projeto full-stack pequeno ou médio. O trade-off é que o repositório precisa de boa organização para não misturar responsabilidades, por isso `apps/`, `packages/` e `docs/` ficam separados.

## pnpm Workspaces

O arquivo `pnpm-workspace.yaml` define os pacotes do monorepo:

```yaml
packages:
  - apps/*
  - packages/*
```

Também existe um catálogo de versões para dependências comuns, como TypeScript, Jest, Biome e tipos do Node. Isso ajuda a manter versões consistentes entre API, frontend e pacotes compartilhados.

O `injectWorkspacePackages: true` facilita o uso de pacotes internos sem precisar publicar nada fora do repositório.

## Turborepo

O `turbo.json` organiza tarefas como `build`, `check`, `test`, `start:dev` e `test:e2e`.

Pontos importantes:

- `build` depende do build dos pacotes usados pelo app, por isso usa `dependsOn: ["^build"]`.
- tarefas persistentes, como `start:dev` e `test:watch`, são marcadas com `persistent: true`;
- saídas de build e cobertura são declaradas em `outputs`, permitindo cache e execução mais previsível;
- `envMode: "loose"` reduz atrito com variáveis de ambiente durante desenvolvimento e deploy.

Com isso, é possível rodar tarefas filtrando por app:

```bash
pnpm turbo build --filter=api
pnpm turbo build --filter=www
pnpm turbo test --filter=api
```

## Pacote de Configuração Compartilhada

O pacote `packages/config` centraliza configurações base:

- Biome;
- TypeScript;
- Jest.

Isso evita copiar a mesma configuração em cada aplicação. Cada app pode estender a configuração base e ajustar apenas o que for específico.

Essa decisão melhora a experiência no monorepo porque:

- reduz divergência entre apps;
- deixa checks e formatação mais consistentes;
- facilita alterar uma regra global em um único lugar;
- mantém os apps focados em código de produto.

## Dockerfiles

Cada aplicação possui Dockerfile próprio porque API e frontend têm necessidades diferentes.

### API

Arquivo: `apps/api/Dockerfile`

O Dockerfile da API usa múltiplos estágios:

- `builder`: instala dependências, gera Prisma Client e compila a API;
- `prod`: copia o resultado final e roda migrations antes de iniciar o NestJS;
- `dev`: ambiente de desenvolvimento com hot reload via Turborepo.

Durante o build, o Prisma Client é gerado antes da compilação TypeScript. Isso é necessário porque os tipos gerados pelo Prisma são usados pela aplicação.

No container de produção, o comando executa:

```sh
prisma migrate deploy && node dist/src/main.js
```

Assim, as migrations pendentes são aplicadas antes de a API subir.

### Frontend

Arquivo: `apps/www/Dockerfile`

O Dockerfile do frontend também usa múltiplos estágios:

- `builder`: instala dependências e gera o build estático do Vite;
- `prod`: serve os arquivos com Nginx;
- `dev`: roda o Vite em modo desenvolvimento.

O frontend usa `docker-entrypoint.sh` para gerar `/runtime-config.js` no início do container. Isso permite configurar `VITE_API_URL` no ambiente de hospedagem sem precisar rebuildar a imagem para trocar a URL da API.

### Testes E2E

Arquivo: `apps/www/Dockerfile.e2e`

Esse Dockerfile usa uma imagem com Playwright para rodar testes de ponta a ponta em um ambiente isolado. Ele ajuda a manter as dependências de browser fora da imagem principal do frontend.

## Docker Compose

O projeto possui dois arquivos principais:

- `docker-compose.yaml`: fluxo local/desenvolvimento;
- `docker-compose.prod.yaml`: fluxo mais próximo de produção.

No desenvolvimento, os serviços montam o repositório como volume e usam os targets `dev`. Em produção, os serviços usam os targets `prod`, com builds otimizados e Nginx para servir o frontend.

## Configurações para Melhor Experiência no Monorepo

Algumas escolhas foram feitas para reduzir atrito no dia a dia:

- comandos raiz para tarefas comuns, como `pnpm prisma` e `pnpm start:dev`;
- `pnpm --dir apps/...` para rodar comandos diretamente em cada app;
- configurações compartilhadas em `packages/config`;
- Dockerfiles separados por aplicação;
- runtime config no frontend para evitar rebuild por troca de URL da API;
- documentação separada por assunto em `docs/`;
- exemplos de ambiente em `.env.example` para facilitar setup local.

## Boas Práticas de Evolução

Ao adicionar novas partes ao projeto:

- coloque aplicações em `apps/`;
- coloque bibliotecas ou configurações reutilizáveis em `packages/`;
- evite dependência circular entre pacotes;
- prefira contratos claros entre API e frontend;
- documente decisões relevantes em `docs/`;
- mantenha Dockerfiles e `.env.example` atualizados quando houver novas variáveis ou serviços.
