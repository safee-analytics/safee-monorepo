FROM node:20.19.0-alpine AS frontend
WORKDIR /workspace
RUN apk add --no-cache libc6-compat
COPY package.json package-lock.json tsconfig.json ./
COPY ui/package.json ./ui/
COPY frontend/package.json ./frontend/
RUN npm ci
COPY ui ./ui/
COPY frontend ./frontend/
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
RUN npm run build -w frontend

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
