set shell := ["bash", "-uc"]
set dotenv-load

DATABASE_URL := env("DATABASE_URL", "postgresql://safee:safee@localhost:15432/safee")
DEV_DATABASE_URL := env("DEV_DB_URL", "")
test_database_url := "postgresql://safee:safee@localhost:25432/safee"

# Build anything that might be needed and then run the servers
default: build-database build-jobs build-ui prepare-gateway && run

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


[group('database')]
bump:
    npm run -w database bumpMigrations

[group('database')]
build-database:
    npm -w database run build

[group('database')]
check-database:
    npx -w database tsc --build --emitDeclarationOnly

[group('database')]
lint-database: build-eslint-plugin-safee
    npx -w database eslint . --max-warnings 0 --cache

[group('database')]
fmt-database:
    npx -w database prettier . --write --cache

[group('database')]
clean-database:
    npx -w database tsc --build --clean
    rm -f database/.eslintcache
    rm -rf database/node_modules/.cache/prettier/

[group('database')]
test-database: build-database (start-e2e "")
    REDIS_URL=redis://localhost:26379 npm -w database test

[group('database')]
migration name:
    npx -w database tsx -r dotenv/config src/private/makemigration.ts "{{name}}"

[group('database')]
generate-migration name:
    npx -w database tsx -r dotenv/config src/private/generate-migration.ts "{{name}}"

[group('database')]
drizzle-generate:
    npx -w database drizzle-kit generate

[group('database')]
drizzle-studio:
    npx -w database drizzle-kit studio

[group('database')]
compile-migration mode="--write":
    npx -w database tsx -r dotenv/config src/private/compilemigration.ts {{mode}}

[group('database')]
migrate:
    npm -w database run migrate
    npx -w database tsx -r dotenv/config src/private/postmigrate.ts

[group('database')]
reset-database: clear-database && migrate

[group('database')]
[confirm("Are you sure you want to reset the database? This action cannot be undone.")]
clear-database:
    @echo "Terminating all connections to database..."
    docker compose exec postgres psql -U safee -d postgres -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = 'safee' AND pid <> pg_backend_pid();" || true
    @echo "Dropping database..."
    docker compose exec postgres dropdb -U safee safee || true
    @echo "Creating database..."
    docker compose exec postgres createdb -U safee safee

[group('ui')]
build-ui:
    npm -w ui run build

[group('ui')]
check-ui:
    npx -w ui tsc --build --emitDeclarationOnly

[group('ui')]
lint-ui: build-eslint-plugin-safee
    npx -w ui eslint . --max-warnings 0 --cache

[group('ui')]
fmt-ui:
    npx -w ui prettier . --write --cache

[group('ui')]
test-ui:
    npm -w ui test

[group('ui')]
clean-ui:
    npx -w ui tsc --build --clean
    rm -f ui/.eslintcache
    rm -rf ui/node_modules/.cache/prettier/

[group('gateway')]
prepare-gateway: build-database build-jobs

[group('gateway')]
build-gateway: prepare-gateway
    npm -w gateway run build

[group('gateway')]
check-gateway: prepare-gateway
    npx -w gateway tsoa spec-and-routes
    npx -w gateway tsc --build --emitDeclarationOnly

[group('gateway')]
lint-gateway: build-eslint-plugin-safee build-database build-jobs build-gateway
    npx -w gateway eslint . --max-warnings 0 --cache

[group('gateway')]
fmt-gateway:
    npx -w gateway prettier . --write --cache

[group('gateway')]
test-gateway: prepare-gateway (start-e2e "odoo")
    REDIS_URL=redis://localhost:26379 npm -w gateway test

[group('gateway')]
clean-gateway:
    npx -w gateway tsc --build --clean
    rm -f gateway/.eslintcache
    rm -rf gateway/node_modules/.cache/prettier/


[private]
[group('jobs')]
prepare-jobs: build-database

[group('jobs')]
build-jobs: prepare-jobs
    npm -w jobs run build

[group('jobs')]
check-jobs: prepare-jobs
    npx -w jobs tsc --build --emitDeclarationOnly

[group('jobs')]
lint-jobs: build-eslint-plugin-safee build-database
    npx -w jobs eslint . --max-warnings 0 --cache

[group('jobs')]
fmt-jobs:
    npx -w jobs prettier . --write --cache

[group('jobs')]
clean-jobs:
    npx -w jobs tsc --build --clean
    rm -f jobs/.eslintcache
    rm -rf jobs/node_modules/.cache/prettier/

[group('jobs')]
test-jobs: build-jobs (start-e2e "postgres")
    docker compose -f e2e/docker-compose.yml up -d --wait redis
    npm -w jobs test

[group('e2e')]
build-e2e: build-gateway
    npm -w e2e run build

[group('e2e')]
check-e2e: build-database build-jobs
    npx -w e2e tsc --build


[group('e2e')]
lint-e2e: build-eslint-plugin-safee build-database build-jobs
    npx -w e2e eslint . --max-warnings 0 --cache

[group('e2e')]
fmt-e2e:
    npx -w e2e prettier . --write --cache

[group('e2e')]
clean-e2e:
    npm -w e2e run clean
    rm -f e2e/.eslintcache
    rm -rf e2e/node_modules/.cache/prettier/

[group('e2e')]
test-e2e: build-e2e (start-e2e "")
    REDIS_URL=redis://localhost:26379 npm -w e2e test

[group('e2e')]
start-e2e service="" $DATABASE_URL=test_database_url $REDIS_URL="redis://localhost:26379":
    #!/usr/bin/env bash
    set -euo pipefail
    echo "Starting e2e services..."
    COMPOSE_FILES="-f e2e/docker-compose.yml"
    # Check if odoo submodule is actually populated (not just initialized)
    # by verifying if the Dockerfile exists
    if [ "{{service}}" = "odoo" ] && [ -f "odoo/Dockerfile" ] && [ -f "e2e/docker-compose.local.yml" ]; then
      echo "Using local Odoo build..."
      COMPOSE_FILES="$COMPOSE_FILES -f e2e/docker-compose.local.yml"
    fi
    if [ "{{service}}" = "odoo" ]; then
      docker compose $COMPOSE_FILES --profile odoo up -d --wait postgres redis odoo
    else
      docker compose $COMPOSE_FILES up -d --wait postgres redis
    fi
    sleep 1
    echo "Resetting test database..."
    docker compose -f e2e/docker-compose.yml exec postgres psql -U safee -d postgres -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = 'safee' AND pid <> pg_backend_pid();" || true
    docker compose -f e2e/docker-compose.yml exec postgres dropdb -U safee safee || true
    docker compose -f e2e/docker-compose.yml exec postgres createdb -U safee safee
    echo "Running migrations..."
    DATABASE_URL={{DATABASE_URL}} REDIS_URL={{REDIS_URL}} npm run -w database migrate
    echo "✅ E2E environment ready!"

[group('e2e')]
stop-e2e:
    @echo "Stopping e2e services..."
    docker compose -f e2e/docker-compose.yml down
    @echo "✅ E2E services stopped"

stop-test: stop-e2e

[group('e2e')]
restart-e2e:
    docker compose -f e2e/docker-compose.yml restart

[group('e2e')]
status-e2e:
    docker compose -f e2e/docker-compose.yml ps

[group('e2e')]
logs-e2e:
    docker compose -f e2e/docker-compose.yml logs -f

[group('e2e')]
clean-e2e-docker:
    @echo "Cleaning e2e Docker resources..."
    docker compose -f e2e/docker-compose.yml down -v
    docker system prune -f --volumes
    @echo "✅ E2E Docker resources cleaned"

[group('e2e')]
reset-e2e-db $DATABASE_URL=test_database_url:
    @echo "Resetting e2e database..."
    docker compose -f e2e/docker-compose.yml exec postgres psql -U safee -d postgres -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = 'safee' AND pid <> pg_backend_pid();" || true
    docker compose -f e2e/docker-compose.yml exec postgres dropdb -U safee safee || true
    docker compose -f e2e/docker-compose.yml exec postgres createdb -U safee safee
    npm run -w database migrate
    @echo "✅ E2E database reset complete"

[group('test')]
integration: build-database build-gateway (start-e2e "")
    REDIS_URL=redis://localhost:26379 cd e2e && npm run test:integration

[group('test')]
unit: build-database build-gateway (start-e2e "")
    REDIS_URL=redis://localhost:26379 cd e2e && npm run test:unit

[group('test')]
coverage: build-database build-gateway (start-e2e "")
    REDIS_URL=redis://localhost:26379 cd e2e && npm run test:coverage

[group('test')]
watch: build-database build-gateway (start-e2e "")
    REDIS_URL=redis://localhost:26379 cd e2e && npm run test:watch

[group('test')]
ui: build-database build-gateway (start-e2e "")
    REDIS_URL=redis://localhost:26379 cd e2e && npm run test:ui

[group('frontend')]
build-frontend: build-eslint-plugin-safee build-ui
    npm -w frontend run build

[group('frontend')]
check-frontend: build-eslint-plugin-safee
    npx -w frontend tsc --noEmit

[group('frontend')]
lint-frontend: build-eslint-plugin-safee
    npx -w frontend eslint . --max-warnings 0 --cache

[group('frontend')]
fmt-frontend:
    npx -w frontend prettier . --write --cache

[group('frontend')]
clean-frontend:
    npx -w frontend tsc --build --clean
    rm -f frontend/.eslintcache
    rm -rf frontend/node_modules/.cache/prettier/

[group('frontend')]
test-frontend:
    npm -w frontend test

[group('frontend')]
dev-frontend:
    npm -w frontend run dev

[group('landing')]
build-landing: build-eslint-plugin-safee
    npm -w landing run build

[group('landing')]
check-landing: build-eslint-plugin-safee
    npx -w landing tsc --noEmit

[group('landing')]
lint-landing: build-eslint-plugin-safee
    npx -w landing eslint . --max-warnings 0 --cache

[group('landing')]
fmt-landing:
    npx -w landing prettier . --write --cache

[group('landing')]
clean-landing:
    npx -w landing tsc --build --clean
    rm -f landing/.eslintcache
    rm -rf landing/node_modules/.cache/prettier/

[group('landing')]
test-landing:
    npm -w landing test

[group('landing')]
dev-landing:
    npm -w landing run dev

[private]
build-eslint-plugin-safee:
    npx tsc --build eslint-plugin-safee

[private]
check-eslint-plugin-safee:
    npx -w eslint-plugin-safee tsc --build --emitDeclarationOnly

[private]
lint-eslint-plugin-safee: build-eslint-plugin-safee
    npx -w eslint-plugin-safee eslint . --max-warnings 0 --cache

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


[group('docker')]
docker-up:
    docker compose up -d

[group('docker')]
docker-down:
    docker compose down

[group('docker')]
docker-restart:
    docker compose restart

[group('docker')]
docker-logs:
    docker compose logs -f

[group('docker')]
docker-logs-service service:
    docker compose logs -f {{service}}

[group('docker')]
docker-build:
    docker compose build

[group('docker')]
docker-rebuild:
    docker compose down
    docker compose build
    docker compose up -d

[group('docker')]
docker-clean:
    docker compose down -v
    docker system prune -f

[group('docker')]
docker-clean-all:
    docker compose down -v --rmi all
    docker system prune -af --volumes

[group('docker')]
docker-ps:
    docker compose ps

[group('docker')]
docker-exec-postgres command:
    docker compose exec postgres {{command}}

[group('docker')]
docker-exec-redis command:
    docker compose exec redis {{command}}

[group('docker')]
docker-psql:
    docker compose exec postgres psql -U safee -d safee

[group('docker')]
docker-redis-cli:
    docker compose exec redis redis-cli


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

[group('caddy')]
caddy-validate:
    @echo "Validating Caddyfile..."
    caddy validate --config Caddyfile
    @echo "Validating Caddyfile.dev..."
    caddy validate --config Caddyfile.dev

[group('caddy')]
dev-with-caddy:
    #!/usr/bin/env bash
    set -euo pipefail

    trap 'echo ""; echo "🛑 Shutting down services..."; jobs -p | xargs -r kill 2>/dev/null; wait; echo "✅ All services stopped"' EXIT INT TERM

    echo "🚀 Starting full stack development environment..."
    echo ""

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
