# FluxCred

Backend NestJS com Prisma, PostgreSQL e integracao Pluggy.

## Requisitos

- Node.js 24.x
- pnpm 10.14.0
- Docker e Docker Compose
- PostgreSQL 16+

## Variaveis de ambiente

Crie o arquivo da API:

```bash
cp apps/api/.env.example apps/api/.env
```

Configure:

```env
PORT=3000
HOST=0.0.0.0
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/fluxcred?schema=public"
JWT_SECRET="change-me"
PLUGGY_CLIENT_ID=""
PLUGGY_CLIENT_SECRET=""
PLUGGY_BASE_URL="https://api.pluggy.ai"
```

Para o frontend, se for usar:

```bash
cp apps/www/.env.example apps/www/.env
```

## Rodando localmente

Instale dependencias:

```bash
pnpm install
```

Suba um PostgreSQL local com Docker:

```bash
docker run --name fluxcred-postgres \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=fluxcred \
  -p 5432:5432 \
  -d postgres:16-alpine
```

Gere o Prisma Client:

```bash
pnpm prisma generate
```

Rode as migrations:

```bash
pnpm prisma migrate dev
```

Inicie a API:

```bash
pnpm start:dev
```

API:

```text
http://localhost:3000
```

## Rodando com Docker Compose

O `docker-compose.yaml` sobe os servicos da aplicacao, mas espera um banco PostgreSQL acessivel pela `DATABASE_URL`.

Com o banco ja rodando, execute:

```bash
docker compose up --build api
```

Para subir API e web:

```bash
docker compose up --build api www
```

Em producao:

```bash
docker compose -f docker-compose.prod.yaml up --build
```

## Documentacao da API

Com a API rodando:

```text
Swagger UI:   http://localhost:3000/docs
OpenAPI JSON: http://localhost:3000/api-json
Scalar:       http://localhost:3000/reference
```

Use o botao de autenticacao Bearer/JWT e informe:

```text
Bearer <accessToken>
```

## Fluxo basico de teste

1. Criar usuario:

```http
POST /auth/register
```

2. Login:

```http
POST /auth/login
```

3. Usar o `accessToken` nas rotas privadas.

4. Gerar token Pluggy:

```http
POST /pluggy/connect-token
```

5. Salvar item conectado:

```http
POST /pluggy/items
```

6. Sincronizar contas e transacoes:

```http
POST /pluggy/sync/:itemId/accounts
POST /pluggy/sync/:itemId/transactions
```

7. Calcular metricas e score:

```http
POST /financial-metrics/calculate
POST /credit-score/calculate
```

8. Solicitar credito:

```http
POST /credit-requests
```

## Comandos uteis

```bash
pnpm --dir apps/api check
pnpm --dir apps/api build
pnpm prisma generate
pnpm prisma migrate dev
```

## Observacoes

- O arquivo `apps/api/.env` nao deve ser commitado.
- Use credenciais sandbox/demo da Pluggy em desenvolvimento.
- Se usar Docker para a API e o Postgres estiver no host, ajuste `DATABASE_URL` conforme o ambiente.
