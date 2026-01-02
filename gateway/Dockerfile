FROM node:20.19.0-alpine AS deps
WORKDIR /workspace
RUN apk add --no-cache libc6-compat
COPY package.json package-lock.json tsconfig.json ./
COPY database/package.json ./database/
COPY gateway/package.json ./gateway/
COPY jobs/package.json ./jobs/
RUN npm ci --omit=dev

FROM node:20.19.0-alpine AS build-deps
WORKDIR /workspace
RUN apk add --no-cache libc6-compat
COPY package.json package-lock.json tsconfig.json ./
COPY database/package.json database/tsconfig.json ./database/
COPY gateway/package.json ./gateway/
COPY jobs/package.json jobs/tsconfig.json ./jobs/
RUN npm ci

FROM build-deps AS database
COPY database ./database/
RUN npm run build -w database

FROM build-deps AS jobs
COPY --from=database /workspace/database/build ./database/build
COPY --from=database /workspace/database/src ./database/src
COPY jobs ./jobs/
RUN npm run build -w jobs

FROM build-deps AS builder
ARG NODE_ENV=development
COPY --from=database /workspace/database/build ./database/build
COPY --from=database /workspace/database/src ./database/src
COPY --from=jobs /workspace/jobs/build ./jobs/build
COPY --from=jobs /workspace/jobs/src ./jobs/src
COPY gateway ./gateway/
RUN --mount=type=secret,id=SENTRY_AUTH_TOKEN \
    export NODE_ENV=${NODE_ENV} && \
    export SENTRY_AUTH_TOKEN=$(cat /run/secrets/SENTRY_AUTH_TOKEN 2>/dev/null || echo "") && \
    npm run build -w gateway

FROM node:20.19.0-alpine AS runner
WORKDIR /workspace
ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nodeapp

COPY --from=deps --chown=nodeapp:nodejs /workspace/node_modules ./node_modules
COPY --from=deps --chown=nodeapp:nodejs /workspace/database/node_modules ./database/node_modules
COPY --from=deps --chown=nodeapp:nodejs /workspace/gateway/node_modules ./gateway/node_modules
COPY --from=deps --chown=nodeapp:nodejs /workspace/jobs/node_modules ./jobs/node_modules

COPY --chown=nodeapp:nodejs package.json package-lock.json ./
COPY --chown=nodeapp:nodejs database/package.json ./database/
COPY --chown=nodeapp:nodejs database/drizzle.config.ts ./database/
COPY --chown=nodeapp:nodejs gateway/package.json ./gateway/
COPY --chown=nodeapp:nodejs jobs/package.json ./jobs/
COPY --from=database --chown=nodeapp:nodejs /workspace/database/build ./database/build
COPY --from=database --chown=nodeapp:nodejs /workspace/database/src ./database/src
COPY --from=builder --chown=nodeapp:nodejs /workspace/gateway/build ./gateway/build
COPY --from=jobs --chown=nodeapp:nodejs /workspace/jobs/build ./jobs/build

USER nodeapp

EXPOSE 3000

CMD ["node", "gateway/build/src/index.js"]
