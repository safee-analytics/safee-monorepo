#!/bin/bash
set -e

echo "🐍 Starting Odoo server setup..."

# 1. Update system
echo "📦 Updating system packages..."
apt-get update && apt-get upgrade -y

# 2. Install Docker
echo "🐳 Installing Docker..."
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
systemctl enable docker
systemctl start docker

# 3. Install Docker Compose
echo "🔧 Installing Docker Compose..."
apt-get install -y docker-compose-plugin

# 4. Install Nginx
echo "🌐 Installing Nginx..."
apt-get install -y nginx
systemctl enable nginx
systemctl start nginx

# 5. Install Certbot for Let's Encrypt SSL
echo "🔒 Installing Certbot and DNS tools..."
apt-get install -y certbot python3-certbot-nginx dnsutils

# 6. Create directory for Let's Encrypt challenges
mkdir -p /var/www/certbot

# 7. Enable Nginx site configuration (if exists)
if [ -f "/etc/nginx/sites-available/odoo" ]; then
  echo "🔗 Enabling Nginx Odoo configuration..."
  ln -sf /etc/nginx/sites-available/odoo /etc/nginx/sites-enabled/odoo
  # Remove default site if it exists
  rm -f /etc/nginx/sites-enabled/default
  # Test nginx configuration
  nginx -t && systemctl reload nginx
fi

# 8. Verify config files are in place
echo "✅ Odoo configuration files:"
ls -la /opt/odoo/config/
ls -la /opt/odoo/

# 9. Start Odoo
echo "🚀 Starting Odoo..."
cd /opt/odoo
docker compose up -d

# 10. Wait for Odoo to be ready
echo "⏳ Waiting for Odoo to start..."
sleep 10

echo "✅ Odoo setup complete!"
echo ""
echo "📊 Service status:"
docker compose ps
echo ""
echo "🌐 Odoo services:"
echo "   - HTTP: http://$(hostname -I | awk '{print $1}')"
if [ -f "/etc/nginx/sites-enabled/odoo" ]; then
  DOMAIN=$(grep "server_name" /etc/nginx/sites-enabled/odoo | grep -v "#" | awk '{print $2}' | tr -d ';' | head -1)
  if [ -n "$DOMAIN" ] && [ "$DOMAIN" != "_" ]; then
    echo "   - Domain: http://$DOMAIN"
    echo ""

    # Try to automatically set up SSL if DNS is ready
    echo "🔍 Checking if DNS is configured for $DOMAIN..."
    SERVER_IP=$(hostname -I | awk '{print $1}')
    DOMAIN_IP=$(dig +short "$DOMAIN" @8.8.8.8 | tail -1)

    if [ "$DOMAIN_IP" = "$SERVER_IP" ]; then
      echo "✅ DNS is configured correctly ($DOMAIN -> $SERVER_IP)"
      echo "🔒 Attempting to set up SSL certificate..."

      # Get email from environment or use default
      EMAIL="${LETSENCRYPT_EMAIL:-mahmoud@safee.dev}"

      # Try to obtain SSL certificate
      if certbot certonly --nginx -d "$DOMAIN" --email "$EMAIL" --agree-tos --non-interactive 2>&1 | tee /tmp/certbot.log; then
        echo "✅ SSL certificate obtained!"

        # Update nginx config to enable HTTPS
        if [ -f "/tmp/setup-ssl.sh" ]; then
          bash /tmp/setup-ssl.sh "$DOMAIN" "$EMAIL" && echo "🌐 Odoo is now available at: https://$DOMAIN"
        fi
      else
        echo "⚠️  SSL setup skipped (may need DNS propagation time)"
        echo "📝 To set up SSL later, run: bash /tmp/setup-ssl.sh $DOMAIN $EMAIL"
      fi
    else
      echo "⚠️  DNS not ready yet. Expected: $DOMAIN -> $SERVER_IP, Got: $DOMAIN_IP"
      echo "📝 After DNS propagates, run: bash /tmp/setup-ssl.sh $DOMAIN mahmoud@safee.dev"
    fi
  fi
fi
echo ""
echo "📝 Configuration file: /opt/odoo/config/odoo.conf"
echo "📁 Data directory: /var/lib/odoo"
