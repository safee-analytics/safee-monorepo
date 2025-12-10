FROM node:20.19.0-alpine AS landing
WORKDIR /workspace
RUN apk add --no-cache libc6-compat
COPY package.json package-lock.json tsconfig.json ./
COPY landing/package.json ./landing/
RUN npm ci
COPY landing ./landing/
ARG NEXT_PUBLIC_APP_URL
ENV NEXT_PUBLIC_APP_URL=${NEXT_PUBLIC_APP_URL}
RUN npm run build -w landing

# Production image - standalone mode
FROM node:20.19.0-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# Don't run as root
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy standalone build
COPY --from=landing --chown=nextjs:nodejs /workspace/landing/.next/standalone/node_modules ./node_modules
COPY --from=landing --chown=nextjs:nodejs /workspace/landing/.next/standalone/landing ./
COPY --from=landing /workspace/landing/public ./public
COPY --from=landing --chown=nextjs:nodejs /workspace/landing/.next/static ./.next/static

USER nextjs

EXPOSE 3002

ENV PORT=3002
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
