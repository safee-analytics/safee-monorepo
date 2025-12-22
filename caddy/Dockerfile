FROM caddy:2-alpine

# Copy dev server config by default (for dev.safee.dev deployment)
# For production, override with Caddyfile.prod during build
COPY Caddyfile.dev /etc/caddy/Caddyfile

EXPOSE 80 443 443/udp

# Run Caddy
CMD ["caddy", "run", "--config", "/etc/caddy/Caddyfile", "--adapter", "caddyfile"]
