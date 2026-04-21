# syntax=docker/dockerfile:1.6

########################
# 1) Dépendances (dev+prod)
########################
FROM node:20-slim AS deps
WORKDIR /app

ENV NODE_ENV=development
RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates git openssl && \
    rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm ci

########################
# 2) Build Next.js
########################
FROM node:20-slim AS builder
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build (sans Turbopack)
RUN npm run build

########################
# 3) Runner minimal (prod)
########################
FROM node:20-slim AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
ENV NEXT_TELEMETRY_DISABLED=1

# wget requis pour le healthcheck Swarm
RUN apt-get update && apt-get install -y --no-install-recommends wget && \
    rm -rf /var/lib/apt/lists/*

# User non-root
RUN useradd -m -u 1001 nextjs

# Copie le bundle standalone + assets
COPY --from=builder --chown=nextjs:nextjs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nextjs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nextjs /app/public ./public

EXPOSE 3000

USER nextjs

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD wget -qO- http://localhost:3000/ || exit 1

CMD ["node", "server.js"]
