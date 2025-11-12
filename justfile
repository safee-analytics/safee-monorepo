set shell := ["bash", "-uc"]
set dotenv-load

DATABASE_URL := env("DATABASE_URL", "postgresql://safee:safee@localhost:15432/safee")
DEV_DATABASE_URL := env("DEV_DB_URL", "")
test_database_url := "postgresql://safee:safee@localhost:25432/safee"

# Build anything that might be needed and then run the servers
default: build-database build-jobs prepare-gateway && run

# Run the servers
run:
    npx tsx {{ if env("DEBUG", "") == "true" { "--inspect-brk" } else { "" } }} -r dotenv/config dev.ts

# Initialize the most basic parts of the repo
init: tsinit
    #!/usr/bin/env bash
    DIRS=$(find . -type f -name '*.env.example' -exec dirname {} \; |sed -r 's|./?||' | sort | uniq)
    for D in $DIRS; do
      if [ ! -e $D/.env ]; then
        (cd $D && ln -s ../.env .env)
      fi
    done

_all pattern mode="all" do="run":
    ruby task-runner.rb {{pattern}} {{mode}} {{do}}

# Build all components of the project
build mode="changed" do="run": (_all "^build-" mode do)

# Lint all components
lint mode="changed" do="run": (_all "^lint-" mode do)

# Format all code
fmt mode="changed" do="run": (_all "^fmt-" mode do)

# Typecheck all components
check mode="changed" do="run": (_all "^check-" mode do)

# Run all tests
test mode="changed" do="run" $DATABASE_URL=test_database_url:
    @just _all "^test-" {{mode}} {{do}}

# Clean all
clean: (_all "^clean-")

# Install TypeScript dependencies
[group('typescript')]
tsinit:
    npm ci

# ============================================================================
# Database
# ============================================================================

[group('database')]
bump:
    npm run -w database bumpMigrations

# Build database package
[group('database')]
build-database:
    npm -w database run build

# Typecheck database package
[group('database')]
check-database:
    npx -w database tsc --build --emitDeclarationOnly

# Lint database package
[group('database')]
lint-database: build-eslint-plugin-safee
    npx -w database eslint . --max-warnings 0 --cache

# Format database package
[group('database')]
fmt-database:
    npx -w database prettier . --write --cache

# Clean generated files from database package
[group('database')]
clean-database:
    npx -w database tsc --build --clean
    rm -f database/.eslintcache
    rm -rf database/node_modules/.cache/prettier/

# Run app-level database tests
[group('database')]
test-database: build-database (start-e2e "postgres")
    docker compose -f e2e/docker-compose.yml up -d --wait redis
    npm -w database test

# Generate a new (possibly empty) migration
[group('database')]
migration name:
    npx -w database tsx -r dotenv/config src/private/makemigration.ts "{{name}}"

# Generate migration from Drizzle schema changes
[group('database')]
generate-migration name:
    npx -w database tsx -r dotenv/config src/private/generate-migration.ts "{{name}}"

# Generate Drizzle migration (schema changes only)
[group('database')]
drizzle-generate:
    npx -w database drizzle-kit generate

# Open Drizzle Studio (database browser)
[group('database')]
drizzle-studio:
    npx -w database drizzle-kit studio

# Recompile imports into the latest migration
[group('database')]
compile-migration mode="--write":
    npx -w database tsx -r dotenv/config src/private/compilemigration.ts {{mode}}

# Migrate the database to the latest state
[group('database')]
migrate:
    npm -w database run migrate
    npx -w database tsx -r dotenv/config src/private/postmigrate.ts

# Clear the database and re-run all migrations
[group('database')]
reset-database: clear-database && migrate

# Clear the database
[group('database')]
[confirm("Are you sure you want to reset the database? This action cannot be undone.")]
clear-database:
    @echo "Terminating all connections to database..."
    docker compose exec postgres psql -U safee -d postgres -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = 'safee' AND pid <> pg_backend_pid();" || true
    @echo "Dropping database..."
    docker compose exec postgres dropdb -U safee safee || true
    @echo "Creating database..."
    docker compose exec postgres createdb -U safee safee

# ============================================================================
# Gateway
# ============================================================================

# Prepare generated files for Gateway
[group('gateway')]
prepare-gateway: build-database build-jobs

# Build gateway package
[group('gateway')]
build-gateway: prepare-gateway
    npm -w gateway run build

# Typecheck gateway
[group('gateway')]
check-gateway: prepare-gateway
    npx -w gateway tsoa spec-and-routes
    npx -w gateway tsc --build --emitDeclarationOnly

# Lint gateway
[group('gateway')]
lint-gateway: build-eslint-plugin-safee build-database build-jobs build-gateway
    npx -w gateway eslint . --max-warnings 0 --cache

# Format gateway
[group('gateway')]
fmt-gateway:
    npx -w gateway prettier . --write --cache

# Test gateway
[group('gateway')]
test-gateway: prepare-gateway (start-e2e "postgres")
    docker compose -f e2e/docker-compose.yml up -d --wait redis
    npm -w gateway test

# Clean generated files from gateway
[group('gateway')]
clean-gateway:
    npx -w gateway tsc --build --clean
    rm -f gateway/.eslintcache
    rm -rf gateway/node_modules/.cache/prettier/

# ============================================================================
# Jobs
# ============================================================================

[private]
[group('jobs')]
prepare-jobs: build-database

# Build jobs package
[group('jobs')]
build-jobs: prepare-jobs
    npm -w jobs run build

# Typecheck jobs
[group('jobs')]
check-jobs: prepare-jobs
    npx -w jobs tsc --build --emitDeclarationOnly

# Lint jobs
[group('jobs')]
lint-jobs: build-eslint-plugin-safee build-database
    npx -w jobs eslint . --max-warnings 0 --cache

# Format jobs
[group('jobs')]
fmt-jobs:
    npx -w jobs prettier . --write --cache

# Clean generated files from jobs
[group('jobs')]
clean-jobs:
    npx -w jobs tsc --build --clean
    rm -f jobs/.eslintcache
    rm -rf jobs/node_modules/.cache/prettier/

# Run unit tests for jobs module
[group('jobs')]
test-jobs: build-jobs (start-e2e "postgres")
    docker compose -f e2e/docker-compose.yml up -d --wait redis
    npm -w jobs test

# ============================================================================
# E2E Tests
# ============================================================================

# Build e2e package
[group('e2e')]
build-e2e: build-gateway
    npm -w e2e run build

# Typecheck e2e package
[group('e2e')]
check-e2e: build-database build-jobs
    npx -w e2e tsc --build

# Lint e2e package
[group('e2e')]
lint-e2e: build-eslint-plugin-safee build-database build-jobs
    npx -w e2e eslint . --max-warnings 0 --cache

# Format e2e package
[group('e2e')]
fmt-e2e:
    npx -w e2e prettier . --write --cache

# Clean generated files from e2e package
[group('e2e')]
clean-e2e:
    npm -w e2e run clean
    rm -f e2e/.eslintcache
    rm -rf e2e/node_modules/.cache/prettier/

# Run unit tests for e2e module
[group('e2e')]
test-e2e: build-e2e (start-e2e "postgres")
    docker compose -f e2e/docker-compose.yml up -d --wait redis
    npm -w e2e test

# Start e2e Docker services (postgres, redis), reset DB, and run migrations
[group('e2e')]
start-e2e service="" $DATABASE_URL=test_database_url:
    @echo "Starting e2e services..."
    docker compose -f e2e/docker-compose.yml up -d --wait {{service}}
    sleep 1
    @echo "Resetting test database..."
    docker compose -f e2e/docker-compose.yml exec postgres psql -U safee -d postgres -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = 'safee' AND pid <> pg_backend_pid();" || true
    docker compose -f e2e/docker-compose.yml exec postgres dropdb -U safee safee || true
    docker compose -f e2e/docker-compose.yml exec postgres createdb -U safee safee
    @echo "Running migrations..."
    npm run -w database migrate
    @echo "✅ E2E environment ready!"

# Stop e2e Docker services
[group('e2e')]
stop-e2e:
    @echo "Stopping e2e services..."
    docker compose -f e2e/docker-compose.yml down
    @echo "✅ E2E services stopped"

# Restart e2e services without resetting DB
[group('e2e')]
restart-e2e:
    docker compose -f e2e/docker-compose.yml restart

# Show e2e service status
[group('e2e')]
status-e2e:
    docker compose -f e2e/docker-compose.yml ps

# View e2e service logs
[group('e2e')]
logs-e2e:
    docker compose -f e2e/docker-compose.yml logs -f

# Clean e2e Docker volumes and containers
[group('e2e')]
clean-e2e-docker:
    @echo "Cleaning e2e Docker resources..."
    docker compose -f e2e/docker-compose.yml down -v
    docker system prune -f --volumes
    @echo "✅ E2E Docker resources cleaned"

# Reset e2e database without restarting containers
[group('e2e')]
reset-e2e-db $DATABASE_URL=test_database_url:
    @echo "Resetting e2e database..."
    docker compose -f e2e/docker-compose.yml exec postgres psql -U safee -d postgres -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = 'safee' AND pid <> pg_backend_pid();" || true
    docker compose -f e2e/docker-compose.yml exec postgres dropdb -U safee safee || true
    docker compose -f e2e/docker-compose.yml exec postgres createdb -U safee safee
    npm run -w database migrate
    @echo "✅ E2E database reset complete"

# Run integration tests
[group('test')]
test-integration: (start-e2e "postgres")
    docker compose -f e2e/docker-compose.yml up -d --wait redis
    cd e2e && npm run test:integration

# Run unit tests
[group('test')]
test-unit: (start-e2e "postgres")
    docker compose -f e2e/docker-compose.yml up -d --wait redis
    cd e2e && npm run test:unit

# Run all tests with coverage
[group('test')]
test-coverage: (start-e2e "postgres")
    docker compose -f e2e/docker-compose.yml up -d --wait redis
    cd e2e && npm run test:coverage

# Run tests in watch mode
[group('test')]
test-watch: (start-e2e "postgres")
    docker compose -f e2e/docker-compose.yml up -d --wait redis
    cd e2e && npm run test:watch

# Open Vitest UI
[group('test')]
test-ui: (start-e2e "postgres")
    docker compose -f e2e/docker-compose.yml up -d --wait redis
    cd e2e && npm run test:ui

# ============================================================================
# Frontend
# ============================================================================

# Build frontend package
[group('frontend')]
build-frontend:
    npm -w frontend run build

# Typecheck frontend package
[group('frontend')]
check-frontend:
    npx -w frontend tsc --build --emitDeclarationOnly

# Lint frontend package
[group('frontend')]
lint-frontend: build-eslint-plugin-safee
    npx -w frontend eslint . --max-warnings 0 --cache

# Format frontend package
[group('frontend')]
fmt-frontend:
    npx -w frontend prettier . --write --cache

# Clean generated files from frontend package
[group('frontend')]
clean-frontend:
    npx -w frontend tsc --build --clean
    rm -f frontend/.eslintcache
    rm -rf frontend/node_modules/.cache/prettier/

# Run frontend tests
[group('frontend')]
test-frontend:
    npm -w frontend test

# Start frontend dev server
[group('frontend')]
dev-frontend:
    npm -w frontend run dev

# ============================================================================
# Landing
# ============================================================================

# Build landing package
[group('landing')]
build-landing:
    npm -w landing run build

# Typecheck landing package
[group('landing')]
check-landing:
    npx -w landing tsc --build --emitDeclarationOnly

# Lint landing package
[group('landing')]
lint-landing: build-eslint-plugin-safee
    npx -w landing eslint . --max-warnings 0 --cache

# Format landing package
[group('landing')]
fmt-landing:
    npx -w landing prettier . --write --cache

# Clean generated files from landing package
[group('landing')]
clean-landing:
    npx -w landing tsc --build --clean
    rm -f landing/.eslintcache
    rm -rf landing/node_modules/.cache/prettier/

# Run landing tests
[group('landing')]
test-landing:
    npm -w landing test

# Start landing dev server
[group('landing')]
dev-landing:
    npm -w landing run dev

# ============================================================================
# ESLint Plugin
# ============================================================================

[private]
build-eslint-plugin-safee:
    npx tsc --build eslint-plugin-safee

[private]
check-eslint-plugin-safee:
    npx -w eslint-plugin-safee tsc --build --emitDeclarationOnly

[private]
lint-eslint-plugin-safee: build-eslint-plugin-safee
    npx -w eslint-plugin-safee eslint . --max-warnings 0 --cache

# Format eslint plugin
[group('eslint-plugin')]
fmt-eslint-plugin-safee:
    npx -w eslint-plugin-safee prettier . --write --cache

[private]
test-eslint-plugin-safee: build-eslint-plugin-safee
    npm -w eslint-plugin-safee test

[private]
clean-eslint-plugin-safee:
    npx -w eslint-plugin-safee tsc --build --clean
    rm -f eslint-plugin-safee/.eslintcache
    rm -rf eslint-plugin-safee/node_modules/.cache/prettier/

# ============================================================================
# Docker
# ============================================================================

# Start all Docker services
[group('docker')]
docker-up:
    docker compose up -d

# Stop all Docker services
[group('docker')]
docker-down:
    docker compose down

# Restart all Docker services
[group('docker')]
docker-restart:
    docker compose restart

# View logs from all services
[group('docker')]
docker-logs:
    docker compose logs -f

# View logs from specific service
[group('docker')]
docker-logs-service service:
    docker compose logs -f {{service}}

# Build Docker images
[group('docker')]
docker-build:
    docker compose build

# Rebuild and restart services
[group('docker')]
docker-rebuild:
    docker compose down
    docker compose build
    docker compose up -d

# Clean up Docker (remove volumes)
[group('docker')]
docker-clean:
    docker compose down -v
    docker system prune -f

# Clean up Docker (remove volumes and images)
[group('docker')]
docker-clean-all:
    docker compose down -v --rmi all
    docker system prune -af --volumes

# Show Docker service status
[group('docker')]
docker-ps:
    docker compose ps

# Execute command in postgres container
[group('docker')]
docker-exec-postgres command:
    docker compose exec postgres {{command}}

# Execute command in redis container
[group('docker')]
docker-exec-redis command:
    docker compose exec redis {{command}}

# Open psql shell
[group('docker')]
docker-psql:
    docker compose exec postgres psql -U safee -d safee

# Open redis-cli shell
[group('docker')]
docker-redis-cli:
    docker compose exec redis redis-cli

# ============================================================================
# Caddy (Reverse Proxy)
# ============================================================================

[group('caddy')]
caddy-dev:
    @echo "Starting Caddy on http://localhost:8080"
    @echo "Make sure backend (port 3000) and frontend (port 3001) are running!"
    caddy run --config Caddyfile.dev

[group('caddy')]
caddy-prod:
    @echo "Starting Caddy with auto HTTPS"
    @echo "Make sure to update domain in Caddyfile first!"
    sudo caddy run --config Caddyfile

[group('caddy')]
caddy-reload:
    caddy reload --config Caddyfile

[group('caddy')]
caddy-stop:
    caddy stop

[group('caddy')]
caddy-fmt:
    caddy fmt --overwrite Caddyfile
    caddy fmt --overwrite Caddyfile.dev

# Validate Caddyfile
[group('caddy')]
caddy-validate:
    @echo "Validating Caddyfile..."
    caddy validate --config Caddyfile
    @echo "Validating Caddyfile.dev..."
    caddy validate --config Caddyfile.dev

# Run full stack with Caddy (landing + gateway + frontend + caddy)
[group('caddy')]
dev-with-caddy:
    #!/usr/bin/env bash
    set -euo pipefail

    # Trap to cleanup background processes on exit
    trap 'echo ""; echo "🛑 Shutting down services..."; jobs -p | xargs -r kill 2>/dev/null; wait; echo "✅ All services stopped"' EXIT INT TERM

    echo "🚀 Starting full stack development environment..."
    echo ""

    # Start Gateway in background (port 3000)
    echo "▶ Starting Gateway (port 3000)..."
    (cd gateway && npm run dev) &
    GATEWAY_PID=$!

    # Start Frontend in background (port 3001)
    echo "▶ Starting Frontend (port 3001)..."
    (cd frontend && npm run dev) &
    FRONTEND_PID=$!

    # Start Landing page in background (port 3002)
    echo "▶ Starting Landing (port 3002)..."
    (cd landing && npm run dev) &
    LANDING_PID=$!

    # Wait for services to be ready
    echo ""
    echo "⏳ Waiting for services to start..."
    sleep 8

    # Start Caddy reverse proxy in foreground
    echo "▶ Starting Caddy reverse proxy (http://localhost:8080)..."
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "  🌐 Access your application at: http://localhost:8080"
    echo "  📄 Landing page: http://localhost:8080"
    echo "  💻 App: http://localhost:8080/app"
    echo "  🔌 API: http://localhost:8080/api"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "Press Ctrl+C to stop all services"
    echo ""

    caddy run --config Caddyfile.dev
