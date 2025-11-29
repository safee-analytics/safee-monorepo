# Multi-stage build for production gateway
FROM node:20.14.0-alpine AS base
WORKDIR /workspace
RUN apk add --no-cache libc6-compat

# Install dependencies
FROM base AS deps
COPY package.json package-lock.json tsconfig.json ./
COPY database/package.json ./database/
COPY gateway/package.json ./gateway/
RUN npm ci --omit=dev

# Build database
FROM base AS database
COPY package.json package-lock.json tsconfig.json ./
COPY database/package.json ./database/
RUN npm ci
COPY database ./database/
RUN npm run build -w database

# Build gateway
FROM base AS builder
COPY package.json package-lock.json tsconfig.json ./
COPY database/package.json ./database/
COPY database/tsconfig.json ./database/
COPY gateway/package.json ./gateway/
RUN npm ci
COPY --from=database /workspace/database/build ./database/build
COPY --from=database /workspace/database/src ./database/src
COPY gateway ./gateway/
RUN npm run build -w gateway

# Production image
FROM base AS runner
ENV NODE_ENV=production

# Copy dependencies
COPY --from=deps /workspace/node_modules ./node_modules
COPY --from=deps /workspace/database/node_modules ./database/node_modules
COPY --from=deps /workspace/gateway/node_modules ./gateway/node_modules

# Copy built artifacts
COPY package.json package-lock.json ./
COPY database/package.json ./database/
COPY database/drizzle.config.ts ./database/
COPY gateway/package.json ./gateway/
COPY --from=database /workspace/database/build ./database/build
COPY --from=database /workspace/database/src/migrations ./database/src/migrations
COPY --from=builder /workspace/gateway/build ./gateway/build

# Expose port
EXPOSE 3000

# Start gateway
CMD ["npm", "start", "-w", "gateway"]
