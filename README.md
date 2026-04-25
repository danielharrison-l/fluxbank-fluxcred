# FluxCred

Aplicação full-stack para fluxo de crédito, com API NestJS, Prisma, PostgreSQL e frontend Vite/React.

## Requisitos

- Node.js 24.x
- pnpm 10.14.0
- Docker e Docker Compose
- PostgreSQL 16+

## Variáveis de Ambiente

Crie os arquivos locais a partir dos exemplos:

```bash
cp apps/api/.env.example apps/api/.env
cp apps/www/.env.example apps/www/.env
```

O arquivo `apps/api/.env` não deve ser commitado.

## Documentação

- [Documento da Solução](docs/solution.md)
- [Organização do Repositório](docs/repository.md)
- [Infraestrutura e Deploy](docs/infrastructure.md)
- [Diagrama de Arquitetura](docs/architecture-diagram.mmd)
- [Melhorias Futuras](docs/future-improvements.md)

## API

Variáveis principais:

```env
PORT=3000
HOST=0.0.0.0
CORS_ORIGIN=http://localhost:3001
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/fluxcred?schema=public"
JWT_SECRET="change-me"
APP_WEB_URL=http://localhost:3001
MAIL_DELIVERY_MODE=console
MAIL_FROM="FluxCred <no-reply@example.com>"
```

Detalhes:

- `PORT` e `HOST`: endereço em que a API sobe.
- `CORS_ORIGIN`: origem do frontend autorizada a chamar a API. Aceita mais de uma origem separada por vírgula.
- `DATABASE_URL`: string de conexão do PostgreSQL usada pelo Prisma.
- `JWT_SECRET`: segredo para assinar tokens de acesso e refresh. Use um valor forte fora do ambiente local.
- `APP_WEB_URL`: URL do frontend usada para montar links de verificação de e-mail e redefinição de senha.
- `MAIL_DELIVERY_MODE=console`: modo recomendado para desenvolvimento local. O backend não envia e-mail real; ele imprime os links no terminal.
- `MAIL_FROM`: remetente usado quando o envio real de e-mail estiver ativo.

Variáveis opcionais:

- `RESEND_API_KEY`: habilita envio real via Resend quando `MAIL_DELIVERY_MODE` não for `console`.
- `ENABLE_API_DOCS=false`: desativa Swagger, OpenAPI JSON e Scalar.
- `ENABLE_DEMO_CONNECTIONS=false`: desativa conexões demo.

Não é necessário configurar integração bancária externa neste momento.

## Frontend

Variáveis principais:

```env
PORT=3001
HOST=0.0.0.0
VITE_API_URL=http://localhost:3000
```

Detalhes:

- `PORT` e `HOST`: endereço do Vite em desenvolvimento ou preview.
- `VITE_API_URL`: URL base da API usada pelo frontend.
- `E2E_APP_BASE_URL`: URL usada pelos testes Playwright.

## E-mail em Desenvolvimento

Para testar cadastro, verificação de e-mail e redefinição de senha sem conta na Resend, use:

```env
MAIL_DELIVERY_MODE=console
```

Fluxo local:

1. Crie uma conta pelo frontend.
2. Veja o terminal da API.
3. Copie o link impresso, por exemplo `Email verification link for ...`.
4. Abra o link no navegador.
5. Depois disso, o login fica liberado.

O mesmo vale para redefinição de senha: o link aparece no terminal como `Password reset link for ...`.

Para envio real de e-mail:

```env
MAIL_DELIVERY_MODE=resend
RESEND_API_KEY=re_...
MAIL_FROM="FluxCred <no-reply@seudominio.com>"
```

O domínio/remetente precisa estar validado na Resend.

## Rodando Localmente

Instale as dependências:

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

Inicie o frontend em outro terminal:

```bash
pnpm --dir apps/www start:dev
```

URLs locais:

```text
API:      http://localhost:3000
Frontend: http://localhost:3001
```

## Docker Compose

O `docker-compose.yaml` sobe API e frontend, mas espera um banco PostgreSQL acessível pela `DATABASE_URL`.

Com o banco já rodando:

```bash
docker compose up --build api
```

Para subir API e web:

```bash
docker compose up --build api www
```

Em produção:

```bash
docker compose -f docker-compose.prod.yaml up --build
```

Se usar Docker para a API e o Postgres estiver no host, ajuste `DATABASE_URL` conforme o ambiente.

## Documentação da API

Com a API rodando:

```text
Swagger UI:   http://localhost:3000/docs
OpenAPI JSON: http://localhost:3000/api-json
Scalar:       http://localhost:3000/reference
```

Use o botão de autenticação Bearer/JWT e informe:

```text
Bearer <accessToken>
```

Para desativar a documentação da API:

```env
ENABLE_API_DOCS=false
```

## Fluxo Básico de Teste

1. Criar usuário:

```http
POST /auth/register
```

2. Confirmar o e-mail usando o link impresso no terminal da API.

3. Login:

```http
POST /auth/login
```

4. Usar o `accessToken` nas rotas privadas.

5. Calcular métricas e score:

```http
POST /financial-metrics/calculate
POST /credit-score/calculate
```

6. Solicitar crédito:

```http
POST /credit-requests
```

A solicitação é aprovada ou recusada automaticamente com base no score e no limite recomendado.

## Comandos Úteis

```bash
pnpm --dir apps/api check
pnpm --dir apps/api build
pnpm --dir apps/www check
pnpm --dir apps/www build
pnpm prisma generate
pnpm prisma migrate dev
```
