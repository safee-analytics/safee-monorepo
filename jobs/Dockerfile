# Stage 1: Install production dependencies ONCE
FROM node:20.19.0-alpine AS deps
WORKDIR /workspace
RUN apk add --no-cache libc6-compat
COPY package.json package-lock.json tsconfig.json ./
COPY database/package.json ./database/
COPY jobs/package.json ./jobs/
RUN npm ci --omit=dev

# Stage 2: Install ALL dependencies ONCE (for building)
FROM node:20.19.0-alpine AS build-deps
WORKDIR /workspace
RUN apk add --no-cache libc6-compat
COPY package.json package-lock.json tsconfig.json ./
COPY database/package.json database/tsconfig.json ./database/
COPY jobs/package.json jobs/tsconfig.json ./jobs/
RUN npm ci

# Stage 3: Build database (reuse build-deps)
FROM build-deps AS database
COPY database ./database/
RUN npm run build -w database

# Stage 4: Build jobs (reuse build-deps)
FROM build-deps AS builder
ARG NODE_ENV=development
COPY --from=database /workspace/database/build ./database/build
COPY --from=database /workspace/database/src ./database/src
COPY jobs ./jobs/
RUN --mount=type=secret,id=SENTRY_AUTH_TOKEN \
    export NODE_ENV=${NODE_ENV} && \
    export SENTRY_AUTH_TOKEN=$(cat /run/secrets/SENTRY_AUTH_TOKEN 2>/dev/null || echo "") && \
    npm run build -w jobs

# Production image
FROM node:20.19.0-alpine AS runner
WORKDIR /workspace
ENV NODE_ENV=production

# Don't run as root
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nodeapp

# Copy dependencies
COPY --from=deps --chown=nodeapp:nodejs /workspace/node_modules ./node_modules
COPY --from=deps --chown=nodeapp:nodejs /workspace/database/node_modules ./database/node_modules
COPY --from=deps --chown=nodeapp:nodejs /workspace/jobs/node_modules ./jobs/node_modules

# Copy built artifacts
COPY --chown=nodeapp:nodejs package.json package-lock.json ./
COPY --chown=nodeapp:nodejs database/package.json ./database/
COPY --chown=nodeapp:nodejs jobs/package.json ./jobs/
COPY --from=database --chown=nodeapp:nodejs /workspace/database/build ./database/build
COPY --from=database --chown=nodeapp:nodejs /workspace/database/src ./database/src
COPY --from=builder --chown=nodeapp:nodejs /workspace/jobs/build ./jobs/build

USER nodeapp

# Expose metrics port if needed
EXPOSE 9090

# Start job worker directly (bypass npm workspaces)
CMD ["node", "jobs/build/src/worker.js"]
