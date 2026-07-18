# -----------------------------
# Base
# -----------------------------
FROM node:22-alpine AS base

WORKDIR /app

RUN apk add --no-cache libc6-compat

# -----------------------------
# Dependencies
# -----------------------------
FROM base AS deps

COPY package*.json ./

RUN npm ci

# -----------------------------
# Builder
# -----------------------------
FROM base AS builder

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1

RUN npm run build

# -----------------------------
# Runtime
# -----------------------------
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3002

RUN apk add --no-cache libc6-compat

RUN addgroup -S nextjs
RUN adduser -S nextjs -G nextjs

COPY --from=builder /app/public ./public

COPY --from=builder /app/.next/standalone ./

COPY --from=builder /app/.next/static ./.next/static

USER nextjs

EXPOSE 3002

CMD ["node", "server.js"]