# Stage 1: Install ALL dependencies ONCE
FROM node:20.19.0-alpine AS deps
WORKDIR /workspace
RUN apk add --no-cache libc6-compat
COPY package.json package-lock.json tsconfig.json ./
COPY database/package.json database/tsconfig.json ./database/
COPY jobs/package.json jobs/tsconfig.json ./jobs/
COPY admin/package.json ./admin/
RUN npm ci

# Stage 2: Build database (reuse node_modules)
FROM deps AS database
COPY database ./database/
RUN npm run build -w database

# Stage 3: Build jobs (reuse node_modules)
FROM deps AS jobs
COPY --from=database /workspace/database/build ./database/build
COPY --from=database /workspace/database/src ./database/src
COPY jobs ./jobs/
RUN npm run build -w jobs

# Stage 4: Build admin (reuse node_modules)
FROM deps AS admin
COPY --from=database /workspace/database/build ./database/build
COPY --from=database /workspace/database/src ./database/src
COPY --from=jobs /workspace/jobs/build ./jobs/build
COPY --from=jobs /workspace/jobs/src ./jobs/src
COPY admin ./admin/
ARG NEXT_PUBLIC_GATEWAY_URL
ENV NEXT_PUBLIC_GATEWAY_URL=${NEXT_PUBLIC_GATEWAY_URL}
RUN npm run build -w admin

# Production image - standalone mode
FROM node:20.19.0-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# Don't run as root
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy standalone build
COPY --from=admin --chown=nextjs:nodejs /workspace/admin/.next/standalone/node_modules ./node_modules
COPY --from=admin --chown=nextjs:nodejs /workspace/admin/.next/standalone/admin ./
COPY --from=admin /workspace/admin/public ./public
COPY --from=admin --chown=nextjs:nodejs /workspace/admin/.next/static ./.next/static

USER nextjs

EXPOSE 3003

ENV PORT=3003
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
