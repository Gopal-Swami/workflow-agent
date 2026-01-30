# Next.js Web Dockerfile
# Multi-stage build for optimized production image
# Using slim (Debian) instead of Alpine because Temporal SDK has native glibc dependencies

FROM node:18-slim AS base
RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates && rm -rf /var/lib/apt/lists/*

# Install dependencies
FROM base AS deps
WORKDIR /app

# Copy all package files for workspace resolution
COPY package.json package-lock.json ./
COPY packages/temporal-worker/package.json ./packages/temporal-worker/
COPY packages/web/package.json ./packages/web/

# Install dependencies
RUN npm ci

# Build stage
FROM base AS builder
WORKDIR /app

# Copy deps (npm workspaces uses hoisted node_modules at root)
COPY --from=deps /app/node_modules ./node_modules

# Copy source
COPY package.json ./
COPY packages/web ./packages/web

# Build Next.js
ENV NEXT_TELEMETRY_DISABLED=1
WORKDIR /app/packages/web
RUN npm run build

# Production stage
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy standalone build (server.js at root)
COPY --from=builder /app/packages/web/.next/standalone ./

# Copy static files (CSS, JS bundles) - not included in standalone trace
COPY --from=builder /app/packages/web/.next/static ./.next/static

# Copy public folder if it exists (uncomment if you add one)
# COPY --from=builder /app/packages/web/public ./public

# Copy node_modules for server runtime (Next.js + Temporal)
# The standalone output traces files but in monorepo we need to copy explicitly
COPY --from=deps /app/node_modules ./node_modules

USER nextjs

EXPOSE 3000

# Environment variables (can be overridden at runtime)
ENV PORT=${PORT:-3000}
ENV HOSTNAME="0.0.0.0"
ENV TEMPORAL_ADDRESS=${TEMPORAL_ADDRESS:-temporal:7233}
ENV TEMPORAL_NAMESPACE=${TEMPORAL_NAMESPACE:-default}
ENV TEMPORAL_TASK_QUEUE=${TEMPORAL_TASK_QUEUE:-agent-tasks}

CMD ["node", "server.js"]
