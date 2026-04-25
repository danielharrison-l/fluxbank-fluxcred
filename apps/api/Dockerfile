# syntax=docker/dockerfile:1.18-labs
# -------- Production Builder --------
FROM node:24-alpine AS builder

RUN corepack enable pnpm && corepack install -g pnpm@10.14.0

WORKDIR /loci

# Copy manifests 
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY apps/api/package.json apps/api/
COPY --parents packages/*/package.json ./

# Install workspace deps
RUN pnpm install --frozen-lockfile

# Copy in only what the API needs
COPY apps/api apps/api
COPY packages packages

# Generate Prisma Client before TypeScript compilation. The dummy URL is only
# needed because prisma.config.ts reads DATABASE_URL while generating types.
RUN DATABASE_URL="postgresql://postgres:postgres@localhost:5432/fluxcred?schema=public" pnpm --dir apps/api prisma generate

# Build the api (outputs to apps/api/dist)
RUN pnpm turbo build --filter=api

# Prune to runtime-only (dist + prod deps)
RUN pnpm -F api deploy --prod /out



# -------- Production --------
FROM node:24-alpine AS prod 

WORKDIR /loci

RUN apk add --no-cache curl

COPY --from=builder /out ./

CMD ["node", "dist/main"]



# -------- Dev (with hot reload) --------
FROM node:24-alpine AS dev

RUN apk add --no-cache curl

RUN corepack enable pnpm && corepack install -g pnpm@10.14.0

WORKDIR /loci

CMD ["pnpm", "turbo", "start:dev", "--filter=api"]
