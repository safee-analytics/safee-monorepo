#!/bin/bash
set -e

# Start the docker-compose environment
docker-compose up -d --build odoo

# Wait for the odoo container to be healthy
echo "⏳ Waiting for Odoo to be ready..."
until [ "`docker-compose ps -q odoo | xargs docker inspect --format='{{.State.Health.Status}}'`" = "healthy" ]; do
  sleep 1;
done

# List the contents of /usr/local/bin
echo "🔍 Listing contents of /usr/local/bin in odoo container..."
docker-compose exec odoo ls -l /usr/local/bin

# Run the init-odoo-template.sh script
echo "🚀 Initializing the Odoo template database..."
docker-compose exec -e DB_PASSWORD=safee -e DB_HOST=postgres -e DB_SSLMODE=disable odoo bash /usr/local/bin/init-odoo-template.sh
