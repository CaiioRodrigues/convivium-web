# Imagem do portal.
#
# Tres etapas para a imagem final nao carregar o que so serve para compilar.
# O node_modules completo tem quase 500 MB de ferramenta de build; o que o
# servidor precisa sao os 43 MB que o modo standalone separa.

FROM node:22-alpine AS deps
WORKDIR /app

# Corepack ativa o pnpm na versao que o package.json fixa, em vez de
# qualquer uma que a imagem base trouxer.
RUN corepack enable

# Manifesto e lockfile primeiro: enquanto eles nao mudarem, o Docker
# reaproveita esta camada e pula a instalacao inteira.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

FROM node:22-alpine AS build
WORKDIR /app
RUN corepack enable

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Sem telemetria: um servidor de condominio nao precisa mandar estatistica
# de build para lugar nenhum.
ENV NEXT_TELEMETRY_DISABLED=1
RUN pnpm build

FROM node:22-alpine AS runtime
WORKDIR /app

ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0 \
    TZ=America/Sao_Paulo

RUN apk add --no-cache curl \
    && addgroup --system --gid 1001 nodejs \
    && adduser --system --uid 1001 nextjs

# O standalone nao inclui os estaticos: eles sao servidos como arquivo, e
# entram por fora. Nao ha "public/" neste projeto — o favicon mora em
# src/app, que e onde o App Router procura; se um dia surgir uma pasta
# public, ela precisa de um COPY proprio aqui.
COPY --from=build --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=build --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000

HEALTHCHECK --interval=15s --timeout=5s --start-period=20s --retries=5 \
    CMD curl -fsS http://localhost:3000/entrar || exit 1

CMD ["node", "server.js"]
