# syntax=docker/dockerfile:1.6

########################
# 1) Dépendances (dev+prod)
########################
FROM node:18-slim AS deps
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
FROM node:18-slim AS builder
WORKDIR /app
# ✅ Evite l’avertissement "non-standard NODE_ENV"
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build (sans Turbopack)
RUN npm run build

########################
# 3) Runner minimal (prod)
########################
FROM node:18-slim AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV NEXT_TELEMETRY_DISABLED=1

# User non-root
RUN useradd -m -u 1001 nextjs

# Copie le bundle standalone + assets
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

EXPOSE 3000
USER nextjs
CMD ["node", "server.js"]
