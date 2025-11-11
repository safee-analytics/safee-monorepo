
set shell := ["bash", "-uc"]
set dotenv-load

DATABASE_URL := env("DATABASE_URL", "postgresql://postgres:postgres@localhost:15432/safee")
DEV_DATABASE_URL := env("DEV_DB_URL", "")
test_database_url := "postgresql://safee:safee@localhost:25432/safee"


default: build-database  prepare-gateway && run

run:
    npx tsx {{ if env("DEBUG", "") == "true" { "--inspect-brk" } else { "" } }} -r dotenv/config dev.ts

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

build mode="changed" do="run": (_all "^build-" mode do)

lint package="" mode="changed" do="run":
    #!/usr/bin/env bash
    if [ "{{do}}" = "list" ]; then
        if [ "{{mode}}" = "changed" ]; then
            # Get changed packages dynamically
            npx turbo run lint --filter='[HEAD^1]' --dry-run=json | jq -r '.tasks[].package' | jq -R -s -c 'split("\n") | map(select(length > 0))'
        else
            # Get all workspace packages
            node -p "JSON.stringify(require('./package.json').workspaces)"
        fi
    elif [ -n "{{package}}" ] && [ "{{package}}" != "all" ]; then
        # Run specific package lint command
        just lint-{{package}}
    else
        # Run all lint commands (when no package specified or package="all")
        # Use mode="all" when package="all" is specified
        if [ "{{package}}" = "all" ]; then
            just _all "^lint-" "all" {{do}}
        else
            just _all "^lint-" {{mode}} {{do}}
        fi
    fi

fmt mode="changed" do="run": (_all "^fmt-" mode do)

check package="" mode="changed" do="run":
    #!/usr/bin/env bash
    if [ "{{do}}" = "list" ]; then
        if [ "{{mode}}" = "changed" ]; then
            # Get changed packages dynamically
            npx turbo run check --filter='[HEAD^1]' --dry-run=json | jq -r '.tasks[].package' | jq -R -s -c 'split("\n") | map(select(length > 0))'
        else
            # Get all workspace packages
            node -p "JSON.stringify(require('./package.json').workspaces)"
        fi
    elif [ -n "{{package}}" ]; then
        # Run specific package check command
        just check-{{package}}
    else
        # Run all check commands
        just _all "^check-" {{mode}} {{do}}
    fi

test package="" mode="changed" do="run" $DATABASE_URL=test_database_url:
    #!/usr/bin/env bash
    if [ "{{do}}" = "list" ]; then
        if [ "{{mode}}" = "changed" ]; then
            # Get changed packages dynamically
            npx turbo run test --filter='[HEAD^1]' --dry-run=json | jq -r '.tasks[].package' | jq -R -s -c 'split("\n") | map(select(length > 0))'
        else
            # Get all workspace packages
            node -p "JSON.stringify(require('./package.json').workspaces)"
        fi
    elif [ -n "{{package}}" ]; then
        # Run specific package test command
        just test-{{package}}
    else
        # Run all test commands
        just _all "^test-" {{mode}} {{do}}
    fi

clean: (_all "^clean-")

[group('typescript')]
tsinit:
    npm ci

[group('database')]
bump:
    npm run -w database bumpMigrations

[group('database')]
build-database:
    npm -w database run build

# Typecheck database package
[group('database')]
check-database:
    npx turbo run check --filter=@safee/database

[group('database')]
lint-database: build-eslint-plugin-safee
    npx turbo run lint --filter=@safee/database

[group('database')]
fmt-database:
    npx turbo run fmt --filter=@safee/database

[group('database')]
clean-database:
    npx -w database tsc --build --clean
    rm -f database/.eslintcache
    rm -rf database/node_modules/.cache/prettier/


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

# Start test Docker services
[group('docker')]
start-test service="" $DATABASE_URL=test_database_url:
    docker compose -f e2e/docker-compose.yml up -d --wait {{service}}
    sleep 1
    docker compose -f e2e/docker-compose.yml exec postgres psql -U safee -d postgres -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = 'safee' AND pid <> pg_backend_pid();" || true
    docker compose -f e2e/docker-compose.yml exec postgres dropdb -U safee safee || true
    docker compose -f e2e/docker-compose.yml exec postgres createdb -U safee safee
    npm run -w database migrate

# Stop test Docker services
[group('docker')]
stop-test:
    docker compose -f e2e/docker-compose.yml down

# Clean test Docker volumes and containers
[group('docker')]
clean-test:
    docker compose -f e2e/docker-compose.yml down -v
    docker system prune -f --volumes

# Run integration tests
[group('test')]
test-integration: (start-test "postgres")
    docker compose -f e2e/docker-compose.yml up -d --wait redis
    cd e2e && npm run test:integration

# Run unit tests
[group('test')]
test-unit: (start-test "postgres")
    docker compose -f e2e/docker-compose.yml up -d --wait redis
    cd e2e && npm run test:unit

# Run all tests with coverage
[group('test')]
test-coverage: (start-test "postgres")
    docker compose -f e2e/docker-compose.yml up -d --wait redis
    cd e2e && npm run test:coverage

# Run unit tests for database module
[group('test')]
test-database: build-database (start-test "postgres")
    docker compose -f e2e/docker-compose.yml up -d --wait redis
    npm -w database test

# Run unit tests for gateway module
[group('test')]
test-gateway: prepare-gateway (start-test "postgres")
    docker compose -f e2e/docker-compose.yml up -d --wait redis
    npm -w gateway test

# Run unit tests for eslint-plugin
[group('test')]
test-eslint-plugin:
    npm -w eslint-plugin-safee test

[group('test')]
test-watch: (start-test "postgres")
    docker compose -f e2e/docker-compose.yml up -d --wait redis
    cd e2e && npm run test:watch

# Open Vitest UI
[group('test')]
test-ui: (start-test "postgres")
    docker compose -f e2e/docker-compose.yml up -d --wait redis
    cd e2e && npm run test:ui

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


# Prepare generated files for Gateway
[group('gateway')]
prepare-gateway: build-database 

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
lint-gateway: build-eslint-plugin-safee build-database build-gateway
    npx turbo run lint --filter=@safee/gateway

# Format gateway
[group('gateway')]
fmt-gateway:
    npx turbo run fmt --filter=@safee/gateway


# Clean generated files from gateway
[group('gateway')]
clean-gateway:
    npx -w gateway tsc --build --clean
    rm -f gateway/.eslintcache
    rm -rf gateway/node_modules/.cache/prettier/

# Build jobs package
[group('jobs')]
build-jobs: build-database
    npm -w jobs run build

# Typecheck jobs
[group('jobs')]
check-jobs: build-database
    npx turbo run check --filter=@safee/jobs

# Lint jobs
[group('jobs')]
lint-jobs: build-eslint-plugin-safee build-database
    npx turbo run lint --filter=@safee/jobs

# Format jobs
[group('jobs')]
fmt-jobs:
    npx turbo run fmt --filter=@safee/jobs

# Clean generated files from jobs
[group('jobs')]
clean-jobs:
    npx -w jobs tsc --build --clean
    rm -f jobs/.eslintcache
    rm -rf jobs/node_modules/.cache/prettier/

# Run unit tests for jobs module
[group('jobs')]
test-jobs: build-jobs
    npm -w jobs test

# Build tests package
[group('e2e')]
build-e2e: build-gateway
    npm -w e2e run build

# Typecheck tests package
[group('e2e')]
check-e2e:
    npx turbo run check --filter=@safee/e2e

# Lint tests package
[group('e2e')]
lint-e2e: build-eslint-plugin-safee
    npx turbo run lint --filter=@safee/e2e

# Format tests package
[group('e2e')]
fmt-e2e:
    npx turbo run fmt --filter=@safee/e2e

# Clean generated files from tests package
[group('e2e')]
clean-e2e:
    npm -w e2e run clean
    rm -f e2e/.eslintcache
    rm -rf e2e/node_modules/.cache/prettier/

# Run unit tests for tests module
[group('e2e')]
test-e2e: build-e2e
    npm -w e2e test


[private]
build-eslint-plugin-safee:
    npx tsc --build eslint-plugin-safee

[private]
check-eslint-plugin-safee:
    npx turbo run check --filter=@safee/eslint-plugin

[private]
lint-eslint-plugin-safee: build-eslint-plugin-safee
    npx turbo run lint --filter=@safee/eslint-plugin

# Format eslint plugin
[group('eslint-plugin')]
fmt-eslint-plugin-safee:
    npx turbo run fmt --filter=@safee/eslint-plugin

[private]
test-eslint-plugin-safee: build-eslint-plugin-safee
    npm -w eslint-plugin-safee test

[private]
clean-eslint-plugin-safee:
    npx -w eslint-plugin-safee tsc --build --clean
    rm -f eslint-plugin-safee/.eslintcache
    rm -rf eslint-plugin-safee/node_modules/.cache/prettier/

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
    set -e

        echo "▶ Starting Gateway (port 3000)..."
    cd gateway && npm run dev
    # Start frontend in background (new process group)
    echo "▶ Starting Frontend (port 3001)..."
    cd frontend && npm run dev 
    # Start landing page in background (new process group)
    echo "▶ Starting Landing (port 3002)..."
    cd landing && npm run dev   

    # Wait for services to be ready
    echo ""
    echo "⏳ Waiting for services to start..."
    sleep 5

    # Start Caddy (foreground)
    echo "▶ Starting Caddy reverse proxy..."
    echo ""
    caddy run --config Caddyfile.dev &
    CADDY_PID=$!

    # Wait for Caddy to finish (keeps script running)
    wait $CADDY_PID

