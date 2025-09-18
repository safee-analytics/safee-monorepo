
set shell := ["bash", "-uc"]
set dotenv-load

DATABASE_URL := env("DATABASE_URL", "postgresql://postgres:postgres@localhost:5433/safee")
DEV_DATABASE_URL := env("DEV_DB_URL", "")
test_database_url := "postgresql://postgres:postgres@localhost:45432/safee"

# Build anything that might be needed and then run the servers.

default: build-database  prepare-gateway && run

# Run the servers.
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
test mode="changed" do="run" $DATABASE_URL=test_database_url: setup-test
    @just _all "^test-" {{mode}} {{do}}
    just teardown-test

# Clean all
clean: (_all "^clean-")

# Install TypeScript dependencies
[group('typescript')]
tsinit:
    npm ci

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
start-test:
    docker-compose -f tests/docker-compose.yml up -d

# Stop test Docker services
[group('docker')]
stop-test:
    docker-compose -f tests/docker-compose.yml down

# Clean test Docker volumes and containers
[group('docker')]
clean-test:
    docker-compose -f tests/docker-compose.yml down -v
    docker system prune -f --volumes

# Wait for test services to be ready
[group('test')]
wait-for-test-services:
    #!/usr/bin/env bash
    echo "Waiting for test services to be ready..."
    until docker-compose -f tests/docker-compose.yml exec postgres pg_isready -U postgres; do
        echo "Waiting for postgres..."
        sleep 1
    done
    until docker-compose -f tests/docker-compose.yml exec redis redis-cli ping | grep -q PONG; do
        echo "Waiting for redis..."
        sleep 1
    done
    echo "✅ Test services are ready!"

# Setup test environment (start services and run migrations)
[group('test')]
setup-test: start-test wait-for-test-services
    #!/usr/bin/env bash
    export DATABASE_URL="{{test_database_url}}"
    export REDIS_URL="redis://localhost:46379"
    export NODE_ENV="test"

    echo "Recreating test database..."
    docker-compose -f tests/docker-compose.yml exec postgres dropdb -U postgres safee || true
    docker-compose -f tests/docker-compose.yml exec postgres createdb -U postgres safee

    echo "Running test database migrations..."
    npm run -w database migrate
    echo "✅ Test environment ready!"

# Run integration tests
[group('test')]
test-integration: setup-test
    cd tests && npm run test:integration

# Run unit tests
[group('test')]
test-unit: setup-test
    cd tests && npm run test:unit

# Run all tests with coverage
[group('test')]
test-coverage: setup-test
    cd tests && npm run test:coverage

# Run tests in watch mode (for development)
[group('test')]
test-watch: setup-test
    cd tests && npm run test:watch

# Open Vitest UI
[group('test')]
test-ui: setup-test
    cd tests && npm run test:ui

# Teardown test environment
[group('test')]
teardown-test: stop-test

# Run unit tests for database module
[group('test')]
test-database:
    npm -w database test

# Run unit tests for gateway module
[group('test')]
test-gateway:
    npm -w gateway test

# Run unit tests for eslint-plugin
[group('test')]
test-eslint-plugin:
    npm -w eslint-plugin-safee test

# Run all module unit tests
[group('test')]
test-all-modules:
    npm -w database test
    npm -w gateway test
    npm -w eslint-plugin-safee test

# Run tests with coverage for all modules
[group('test')]
test-coverage-all:
    npm -w database run test:coverage
    npm -w gateway run test:coverage

# Recompile imports into the latest migration
[group('database')]
compile-migration mode="--write":
    npx -w database tsx -r dotenv/config src/private/compilemigration.ts {{mode}}

# Migrate the database to the latest state
[group('database')]
migrate:
    npx -w database tsx -r dotenv/config src/private/migrate.ts
    npx -w database tsx -r dotenv/config src/private/postmigrate.ts

# Clear the database and re-run all migrations
[group('database')]
reset-database: clear-database && migrate

# Clear the database
[group('database')]
[confirm("Are you sure you want to reset the database? This action cannot be undone.")]
clear-database:
    docker compose exec postgres dropdb -U postgres safee || true
    docker compose exec postgres createdb -U postgres safee


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
    npx -w gateway eslint . --max-warnings 0 --cache

# Format gateway
[group('gateway')]
fmt-gateway:
    npx -w gateway prettier . --write --cache


# Clean generated files from gateway
[group('gateway')]
clean-gateway:
    npx -w gateway tsc --build --clean
    rm -f gateway/.eslintcache
    rm -rf gateway/node_modules/.cache/prettier/

# Build tests package
[group('tests')]
build-tests:
    npm -w tests run build

# Typecheck tests package
[group('tests')]
check-tests:
    npx -w tests tsc --build --emitDeclarationOnly

# Lint tests package
[group('tests')]
lint-tests: build-eslint-plugin-safee
    npx -w tests eslint . --max-warnings 0 --cache

# Format tests package
[group('tests')]
fmt-tests:
    npx -w tests prettier . --write --cache

# Clean generated files from tests package
[group('tests')]
clean-tests:
    npx -w tests run clean
    rm -f tests/.eslintcache
    rm -rf tests/node_modules/.cache/prettier/

# Run unit tests for tests module
[group('tests')]
test-tests:
    npm -w tests test


[private]
build-eslint-plugin-safee:
    npx tsc --build eslint-plugin-safee

[private]
check-eslint-plugin-safee:
    npx -w eslint-plugin-safee tsc --build --emitDeclarationOnly

[private]
lint-eslint-plugin-safee:
    npx -w eslint-plugin-safee eslint . --max-warnings 0 --cache

[private]
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

