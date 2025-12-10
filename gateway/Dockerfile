# Stage 1: Install production dependencies ONCE
FROM node:20.19.0-alpine AS deps
WORKDIR /workspace
RUN apk add --no-cache libc6-compat
COPY package.json package-lock.json tsconfig.json ./
COPY database/package.json ./database/
COPY gateway/package.json ./gateway/
RUN npm ci --omit=dev

# Stage 2: Install ALL dependencies ONCE (for building)
FROM node:20.19.0-alpine AS build-deps
WORKDIR /workspace
RUN apk add --no-cache libc6-compat
COPY package.json package-lock.json tsconfig.json ./
COPY database/package.json database/tsconfig.json ./database/
COPY gateway/package.json ./gateway/
RUN npm ci

# Stage 3: Build database (reuse build-deps)
FROM build-deps AS database
COPY database ./database/
RUN npm run build -w database

# Stage 4: Build gateway (reuse build-deps)
FROM build-deps AS builder
COPY --from=database /workspace/database/build ./database/build
COPY --from=database /workspace/database/src ./database/src
COPY gateway ./gateway/
RUN npm run build -w gateway

# Production image
FROM node:20.19.0-alpine AS runner
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
