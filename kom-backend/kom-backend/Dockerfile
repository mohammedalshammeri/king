# ─── Stage 1: Build ───────────────────────────
FROM node:20-bookworm-slim AS builder
WORKDIR /app

RUN apt-get update -y && apt-get install -y openssl ca-certificates && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
COPY prisma ./prisma/
COPY scripts ./scripts/

RUN npm ci
RUN npx prisma generate

COPY . .
RUN npm run build


# ─── Stage 2: Production ──────────────────────
FROM node:20-bookworm-slim AS runner
WORKDIR /app

RUN apt-get update -y && apt-get install -y \
  openssl ca-certificates \
  python3 make g++ \
  && rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=production
ENV SKIP_POSTINSTALL=1

COPY package*.json ./
COPY prisma ./prisma/
COPY scripts ./scripts/

RUN npm ci --omit=dev

COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/dist ./dist

EXPOSE 3000
CMD ["npm","run","start:prod"]