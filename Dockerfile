# syntax=docker/dockerfile:1

FROM node:22-bookworm-slim AS deps

WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

RUN apt-get update \
  && apt-get install -y --no-install-recommends ca-certificates openssl \
  && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
RUN npm ci

FROM deps AS builder

WORKDIR /app

COPY prisma ./prisma
COPY prisma.config.ts ./prisma.config.ts
RUN DATABASE_URL="postgresql://useravaa_build:useravaa_build@localhost:5432/useravaa_build?schema=public" npx prisma generate

COPY . .
RUN npm run build
RUN npm prune --omit=dev

FROM node:22-bookworm-slim AS runner

WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000

RUN apt-get update \
  && apt-get install -y --no-install-recommends ca-certificates openssl \
  && rm -rf /var/lib/apt/lists/*

COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/package-lock.json ./package-lock.json
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.ts ./prisma.config.ts
COPY --from=builder /app/src/lib/deployment/safety.ts ./src/lib/deployment/safety.ts
COPY --from=builder /app/next.config.ts ./next.config.ts

EXPOSE 3000

USER node

CMD ["npm", "start"]
