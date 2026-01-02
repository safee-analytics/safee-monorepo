# Stage 1: Install ALL dependencies ONCE
FROM node:20.19.0-alpine AS deps
WORKDIR /workspace
RUN apk add --no-cache libc6-compat
COPY package.json package-lock.json tsconfig.json ./
COPY database/package.json database/tsconfig.json ./database/
COPY ui/package.json ui/tsconfig.json ./ui/
COPY frontend/package.json ./frontend/
RUN npm ci

# Stage 2: Build database (reuse node_modules)
FROM deps AS database
COPY database ./database/
RUN npm run build -w database

# Stage 3: Build UI (reuse node_modules)
FROM deps AS ui
COPY ui ./ui/
RUN npm run build -w ui

# Stage 4: Build frontend (reuse node_modules)
FROM deps AS frontend
COPY --from=database /workspace/database/build ./database/build
COPY --from=database /workspace/database/src ./database/src
COPY --from=ui /workspace/ui/dist ./ui/dist
COPY --from=ui /workspace/ui/src ./ui/src
COPY frontend ./frontend/
ARG NODE_ENV=development
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_LANDING_URL
ARG NEXT_PUBLIC_SENTRY_DSN
ARG SENTRY_DSN
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
ENV NEXT_PUBLIC_LANDING_URL=${NEXT_PUBLIC_LANDING_URL}
ENV NEXT_PUBLIC_SENTRY_DSN=${NEXT_PUBLIC_SENTRY_DSN}
ENV SENTRY_DSN=${SENTRY_DSN}
RUN --mount=type=secret,id=SENTRY_AUTH_TOKEN \
    export NODE_ENV=${NODE_ENV} && \
    export SENTRY_AUTH_TOKEN=$(cat /run/secrets/SENTRY_AUTH_TOKEN 2>/dev/null || echo "") && \
    npm run build -w frontend

# Production image - standalone mode
FROM node:20.19.0-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# Don't run as root
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy standalone build
COPY --from=frontend --chown=nextjs:nodejs /workspace/frontend/.next/standalone/node_modules ./node_modules
COPY --from=frontend --chown=nextjs:nodejs /workspace/frontend/.next/standalone/frontend ./
COPY --from=frontend /workspace/frontend/public ./public
COPY --from=frontend --chown=nextjs:nodejs /workspace/frontend/.next/static ./.next/static

USER nextjs

EXPOSE 3001

ENV PORT=3001
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
