# Temporal Worker Dockerfile
# Multi-stage build for optimized production image
#
# Note: Temporal SDK bundles workflows at runtime, so we need source files available
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

# Install dependencies for the worker package
RUN npm ci

# Build stage
FROM base AS builder
WORKDIR /app

# Copy deps (npm workspaces uses hoisted node_modules at root)
COPY --from=deps /app/node_modules ./node_modules

# Copy source
COPY package.json ./
COPY packages/temporal-worker ./packages/temporal-worker

# Build TypeScript
WORKDIR /app/packages/temporal-worker
RUN npm run build

# Production stage
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 worker

# Copy package files
COPY --from=builder /app/packages/temporal-worker/package.json ./

# Copy node_modules (needed for Temporal SDK)
COPY --from=deps /app/node_modules ./node_modules

# Copy compiled JavaScript (worker entry, activities)
COPY --from=builder /app/packages/temporal-worker/dist ./dist

# Copy workflow source files (Temporal bundles these at runtime)
COPY --from=builder /app/packages/temporal-worker/src/workflows ./src/workflows
COPY --from=builder /app/packages/temporal-worker/src/shared ./src/shared

USER worker

# Environment variables (can be overridden at runtime)
ENV TEMPORAL_ADDRESS=${TEMPORAL_ADDRESS:-temporal:7233}
ENV TASK_QUEUE=${TASK_QUEUE:-agent-tasks}
ENV TEMPORAL_NAMESPACE=${TEMPORAL_NAMESPACE:-default}
ENV MAX_CONCURRENT_ACTIVITIES=${MAX_CONCURRENT_ACTIVITIES:-10}
ENV MAX_CONCURRENT_WORKFLOWS=${MAX_CONCURRENT_WORKFLOWS:-10}

CMD ["node", "dist/worker.js"]
