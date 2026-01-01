set shell := ["bash", "-uc"]
set dotenv-load

DATABASE_URL := env("DATABASE_URL", "postgresql://safee:safee@localhost:15432/safee")
TEST_DB_URL := "postgresql://safee:safee@localhost:25432/safee"

# ============================================
# Development
# ============================================

# Default: build core packages and run dev server
default: build-database build-jobs build-ui && run

# Run dev server (without building)
run:
    npx tsx {{ if env("DEBUG", "") == "true" { "--inspect-brk" } else { "" } }} -r dotenv/config dev.ts

# Start full development environment (infrastructure + all services)
dev:
    #!/usr/bin/env bash
    set -euo pipefail
    trap 'echo ""; echo "🛑 Shutting down..."; jobs -p | xargs -r kill 2>/dev/null; wait; echo "✅ Stopped"' EXIT INT TERM
    echo "🚀 Starting development environment..."
    docker compose up -d postgres redis
    sleep 2
    echo "▶ Starting services (gateway, frontend, landing)..."
    npx tsx -r dotenv/config dev.ts &
    echo "▶ Starting jobs worker..."
    (cd jobs && npm run dev) &
    echo "▶ Starting admin dashboard..."
    (cd admin && npm run dev) &
    sleep 5
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "  🌐 http://localhost:8080 (Landing)"
    echo "  💻 http://app.localhost:8080 (App)"
    echo "  👤 http://admin.localhost:8080 (Admin)"
    echo "  📊 http://app.localhost:8080/admin/queues"
    echo "  🗄️  localhost:15432 (Postgres)"
    echo "  🔴 localhost:16379 (Redis)"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "Press Ctrl+C to stop"
    echo ""
    caddy run --config caddy/Caddyfile.local

# Initialize repo (install deps, link env files)
init: tsinit
    #!/usr/bin/env bash
    DIRS=$(find . -type f -name '*.env.example' -exec dirname {} \; |sed -r 's|./?||' | sort | uniq)
    for D in $DIRS; do
      if [ ! -e $D/.env ]; then
        (cd $D && ln -s ../.env .env)
      fi
    done

# Install TypeScript dependencies
tsinit:
    npm ci

# ============================================
# Infrastructure (Docker)
# ============================================

# Start infrastructure (Postgres, Redis)
infra-start:
    @echo "🚀 Starting infrastructure..."
    @docker compose up -d postgres redis
    @echo "✅ Postgres: localhost:15432"
    @echo "✅ Redis: localhost:16379"

# Stop infrastructure
infra-stop:
    @docker compose down

# View infrastructure logs
infra-logs service="":
    @[ -z "{{service}}" ] && docker compose logs -f postgres redis || docker compose logs -f {{service}}

# Connect to Postgres
psql:
    docker compose exec postgres psql -U safee -d safee

# Connect to Redis CLI
redis-cli:
    docker compose exec redis redis-cli

# ============================================
# Odoo Management
# ============================================

# Start Odoo (workers=0 for local dev, ~500MB RAM)
start-odoo:
    @echo "🚀 Starting Odoo..."
    @docker compose --profile odoo up -d odoo
    @echo "✅ Odoo: http://localhost:8069"

# Stop Odoo
stop-odoo:
    @docker compose --profile odoo down

# View Odoo logs
logs-odoo:
    docker compose logs -f odoo

# Shell into Odoo container
shell-odoo:
    docker compose exec odoo bash

# Reset Odoo (clear data, keep image)
reset-odoo:
    @echo "🔄 Resetting Odoo..."
    @docker compose --profile odoo down
    @-docker volume rm safee_odoo-data safee-e2e_odoo-data 2>/dev/null || true
    @echo "✅ Run 'just start-odoo' to start fresh"

# Reset Odoo completely (rebuild image + clear data)
reset-odoo-hard:
    @echo "🔄 Complete Odoo reset..."
    @docker compose --profile odoo down
    @cd e2e && docker compose down && cd ..
    @-docker volume rm safee_odoo-data safee-e2e_odoo-data 2>/dev/null || true
    @-docker rmi safee-odoo:local ghcr.io/safee-analytics/safee-odoo:18.0 2>/dev/null || true
    @docker compose build odoo
    @echo "✅ Run 'just start-odoo' to start fresh"

# ============================================
# Database
# ============================================

# Run migrations
migrate:
    npm -w database run migrate
    npx -w database tsx -r dotenv/config src/private/postmigrate.ts

# Reset database
[confirm("Reset database? This cannot be undone.")]
reset-database: clear-database migrate

# Clear database
clear-database:
    @docker compose exec postgres psql -U safee -d postgres -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = 'safee' AND pid <> pg_backend_pid();" || true
    @docker compose exec postgres dropdb -U safee safee || true
    @docker compose exec postgres createdb -U safee safee

# Create new migration
migration name:
    npx -w database tsx -r dotenv/config src/private/makemigration.ts "{{name}}"

# Generate migration from schema changes
generate-migration name:
    npx -w database tsx -r dotenv/config src/private/generate-migration.ts "{{name}}"

# Bump migration version
bump:
    npm run -w database bumpMigrations

# Generate Drizzle migrations from schema
drizzle-generate:
    npx -w database drizzle-kit generate

# Open Drizzle Studio
drizzle-studio:
    npx -w database drizzle-kit studio

# ============================================
# Build
# ============================================

_all pattern mode="all" do="run":
    ruby task-runner.rb {{pattern}} {{mode}} {{do}}

# Build all packages
build mode="changed" do="run": (_all "^build-" mode do)

build-database:
    npm -w database run build

build-jobs: build-database
    npm -w jobs run build

build-gateway: build-database build-jobs
    npm -w gateway run build

build-ui:
    npm -w ui run build

build-frontend: build-ui build-database
    npm -w frontend run build

build-landing:
    npm -w landing run build

build-admin: build-database build-jobs
    npm -w admin run build

build-e2e: build-gateway
    npm -w e2e run build

[private]
build-eslint-plugin-safee:
    npx tsc --build eslint-plugin-safee

# ============================================
# Type Check
# ============================================

# Type check all packages
check mode="changed" do="run": (_all "^check-" mode do)

check-database:
    npx -w database tsc --build --emitDeclarationOnly

check-jobs: build-database
    npx -w jobs tsc --build --emitDeclarationOnly

check-gateway: build-database build-jobs
    npx -w gateway tsoa spec-and-routes
    npx -w gateway tsc --build --emitDeclarationOnly

check-ui:
    npx -w ui tsc --build --emitDeclarationOnly

check-frontend: build-ui build-database
    npx -w frontend tsc --noEmit

check-landing:
    npx -w landing tsc --noEmit

check-admin: build-database build-jobs
    npx -w admin tsc --noEmit

check-e2e: build-gateway
    npx -w e2e tsc --build

# ============================================
# Lint
# ============================================

# Lint all packages
lint mode="changed" do="run": (_all "^lint-" mode do)

lint-database: build-eslint-plugin-safee
    npx -w database eslint . --max-warnings 0 --cache

lint-jobs: build-eslint-plugin-safee build-database
    npx -w jobs eslint . --max-warnings 0 --cache

lint-gateway: build-eslint-plugin-safee build-database build-jobs build-gateway
    npx -w gateway eslint . --max-warnings 0 --cache

lint-ui: build-eslint-plugin-safee
    npx -w ui eslint . --max-warnings 0 --cache

lint-frontend: build-eslint-plugin-safee
    npx -w frontend eslint . --max-warnings 0 --cache

lint-landing: build-eslint-plugin-safee
    npx -w landing eslint . --max-warnings 0 --cache

lint-admin: build-eslint-plugin-safee
    npx -w admin eslint . --max-warnings 0 --cache

lint-e2e: build-eslint-plugin-safee build-database build-jobs build-gateway
    npx -w e2e eslint . --max-warnings 0 --cache

[private]
lint-eslint-plugin-safee: build-eslint-plugin-safee
    npx -w eslint-plugin-safee eslint . --max-warnings 0 --cache

# ============================================
# Format
# ============================================

# Format all code
fmt mode="changed" do="run": (_all "^fmt-" mode do)

fmt-database:
    npx -w database prettier . --write --cache

fmt-jobs:
    npx -w jobs prettier . --write --cache

fmt-gateway:
    npx -w gateway prettier . --write --cache

fmt-ui:
    npx -w ui prettier . --write --cache

fmt-frontend:
    npx -w frontend prettier . --write --cache

fmt-landing:
    npx -w landing prettier . --write --cache

fmt-admin:
    npx -w admin prettier . --write --cache

fmt-e2e:
    npx -w e2e prettier . --write --cache

fmt-eslint-plugin-safee:
    npx -w eslint-plugin-safee prettier . --write --cache

fmt-infra:
    terraform -chdir=infra fmt -recursive

# ============================================
# Test
# ============================================

# Run all tests
test mode="changed" do="run" $DATABASE_URL=TEST_DB_URL:
    @just _all "^test-" {{mode}} {{do}}

test-database: build-database start-e2e
    REDIS_URL=redis://localhost:26379 npm -w database test

test-jobs: build-jobs start-e2e
    docker compose -f e2e/docker-compose.yml up -d --wait redis
    npm -w jobs test

test-gateway: build-database build-jobs (start-e2e "odoo")
    REDIS_URL=redis://localhost:26379 npm -w gateway test

test-ui:
    npm -w ui test

test-frontend:
    npm -w frontend test

test-landing:
    npm -w landing test

test-admin:
    npm -w admin test

test-e2e: build-e2e start-e2e
    REDIS_URL=redis://localhost:26379 npm -w e2e test

[private]
test-eslint-plugin-safee: build-eslint-plugin-safee
    npm -w eslint-plugin-safee test

# Integration tests
integration: build-database build-gateway start-e2e
    REDIS_URL=redis://localhost:26379 cd e2e && npm run test:integration

# ============================================
# E2E Environment
# ============================================

# Start E2E test environment
start-e2e service="" $DATABASE_URL=TEST_DB_URL $REDIS_URL="redis://localhost:26379":
    #!/usr/bin/env bash
    set -euo pipefail
    if [ "{{service}}" = "odoo" ]; then
        echo "Starting E2E environment with Odoo..."
        docker compose -f e2e/docker-compose.yml --profile odoo up -d --build --wait postgres redis odoo
    else
        echo "Starting E2E environment (no Odoo)..."
        docker compose -f e2e/docker-compose.yml up -d --wait postgres redis
    fi
    sleep 1
    docker compose -f e2e/docker-compose.yml exec postgres psql -U safee -d postgres -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = 'safee' AND pid <> pg_backend_pid();" > /dev/null 2>&1 || true
    docker compose -f e2e/docker-compose.yml exec postgres dropdb -U safee --if-exists safee
    docker compose -f e2e/docker-compose.yml exec postgres createdb -U safee safee
    DATABASE_URL={{DATABASE_URL}} REDIS_URL={{REDIS_URL}} npm run -w database migrate

# Stop E2E environment
stop-e2e:
    @docker compose -f e2e/docker-compose.yml down

# View E2E logs
logs-e2e:
    docker compose -f e2e/docker-compose.yml logs -f

# ============================================
# Clean
# ============================================

# Clean all build artifacts
clean: (_all "^clean-")

clean-database:
    npx -w database tsc --build --clean
    rm -f database/.eslintcache
    rm -rf database/node_modules/.cache/prettier/

clean-jobs:
    npx -w jobs tsc --build --clean
    rm -f jobs/.eslintcache
    rm -rf jobs/node_modules/.cache/prettier/

clean-gateway:
    npx -w gateway tsc --build --clean
    rm -f gateway/.eslintcache
    rm -rf gateway/node_modules/.cache/prettier/

clean-ui:
    npx -w ui tsc --build --clean
    rm -f ui/.eslintcache
    rm -rf ui/node_modules/.cache/prettier/

clean-frontend:
    npx -w frontend tsc --build --clean
    rm -f frontend/.eslintcache
    rm -rf frontend/node_modules/.cache/prettier/

clean-landing:
    npx -w landing tsc --build --clean
    rm -f landing/.eslintcache
    rm -rf landing/node_modules/.cache/prettier/

clean-admin:
    npx -w admin tsc --build --clean
    rm -f admin/.eslintcache
    rm -rf admin/node_modules/.cache/prettier/

clean-e2e:
    npm -w e2e run clean
    rm -f e2e/.eslintcache
    rm -rf e2e/node_modules/.cache/prettier/

[private]
clean-eslint-plugin-safee:
    npx -w eslint-plugin-safee tsc --build --clean
    rm -f eslint-plugin-safee/.eslintcache
    rm -rf eslint-plugin-safee/node_modules/.cache/prettier/
