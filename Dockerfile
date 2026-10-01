# Multi-stage Dockerfile for AI Service
FROM node:20-alpine AS builder

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@latest --activate

COPY package.json pnpm-lock.yaml* tsconfig.json ./
COPY src ./src

RUN pnpm install --frozen-lockfile || pnpm install
RUN pnpm run build

# Production stage
FROM node:20-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production
ENV PORT=4000
ENV HOST=0.0.0.0

RUN corepack enable && corepack prepare pnpm@latest --activate

COPY package.json ./
RUN pnpm install --prod --ignore-scripts

COPY --from=builder /app/dist ./dist
COPY src/database/schema.sql ./dist/database/schema.sql

EXPOSE 4000

CMD ["node", "dist/server.js"]
