#!/bin/bash
set -e

#######################################
# Duplicate Odoo Template for New Company
# Creates a new company database from odoo_template
# Usage: ./duplicate-odoo-db.sh <company_slug> <company_name>
#######################################

# Check arguments
if [ "$#" -lt 2 ]; then
    echo "Usage: $0 <company_slug> <company_name>"
    echo "Example: $0 acme_corp 'Acme Corporation'"
    exit 1
fi

COMPANY_SLUG="$1"
COMPANY_NAME="$2"
NEW_DB="odoo_$COMPANY_SLUG"
TEMPLATE_DB="odoo_template"

# Database connection (must be provided via environment variables)
DB_HOST="${DB_HOST}"
DB_PORT="${DB_PORT:-5432}"
DB_USER="${DB_USER}"
DB_PASSWORD="${DB_PASSWORD}"

# Validate required environment variables
if [ -z "$DB_HOST" ] || [ -z "$DB_USER" ] || [ -z "$DB_PASSWORD" ]; then
    echo "❌ Error: Required environment variables not set!"
    echo ""
    echo "Please set the following environment variables:"
    echo "  - DB_HOST: PostgreSQL host"
    echo "  - DB_USER: PostgreSQL user"
    echo "  - DB_PASSWORD: PostgreSQL password"
    echo "  - DB_PORT: PostgreSQL port (optional, defaults to 5432)"
    echo ""
    echo "Example:"
    echo "  export DB_HOST=your-host.neon.tech"
    echo "  export DB_USER=neondb_owner"
    echo "  export DB_PASSWORD=your-password"
    echo "  ./duplicate-odoo-db.sh company_slug 'Company Name'"
    exit 1
fi

echo "🏢 Creating Odoo database for: $COMPANY_NAME"
echo "=================================================="
echo "New database: $NEW_DB"
echo "Template: $TEMPLATE_DB"
echo ""

# 1. Check if template exists
echo "📋 Checking template database..."
TEMPLATE_EXISTS=$(PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d postgres -tAc "SELECT 1 FROM pg_database WHERE datname='$TEMPLATE_DB'")

if [ "$TEMPLATE_EXISTS" != "1" ]; then
    echo "❌ Template database '$TEMPLATE_DB' does not exist!"
    echo "   Run ./init-odoo-template.sh first"
    exit 1
fi

# 2. Check if new database already exists
echo "📋 Checking if company database already exists..."
DB_EXISTS=$(PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d postgres -tAc "SELECT 1 FROM pg_database WHERE datname='$NEW_DB'")

if [ "$DB_EXISTS" = "1" ]; then
    echo "❌ Database '$NEW_DB' already exists!"
    exit 1
fi

# 3. Duplicate template database
echo "📋 Duplicating template database..."
PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d postgres -c "
  CREATE DATABASE $NEW_DB WITH TEMPLATE $TEMPLATE_DB OWNER $DB_USER;
"

# 4. Update company information
echo "🏢 Updating company information..."
PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $NEW_DB <<EOF
  -- Update main company record
  UPDATE res_company
  SET name = '$COMPANY_NAME'
  WHERE id = 1;

  -- Update partner (company) record
  UPDATE res_partner
  SET name = '$COMPANY_NAME'
  WHERE id = (SELECT partner_id FROM res_company WHERE id = 1);

  -- Add metadata
  CREATE TABLE IF NOT EXISTS safee_metadata (
    key VARCHAR(255) PRIMARY KEY,
    value TEXT,
    created_at TIMESTAMP DEFAULT NOW()
  );

  INSERT INTO safee_metadata (key, value) VALUES
    ('company_slug', '$COMPANY_SLUG'),
    ('company_name', '$COMPANY_NAME'),
    ('created_from_template', '$TEMPLATE_DB'),
    ('created_at', NOW()::TEXT)
  ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
EOF

echo ""
echo "✅ Company database created successfully!"
echo "=================================================="
echo "Database: $NEW_DB"
echo "Company: $COMPANY_NAME"
echo "Slug: $COMPANY_SLUG"
echo ""
echo "🔗 Access URL: http://your-odoo-server:8069/web?db=$NEW_DB"
echo ""
echo "📝 Next steps:"
echo "   1. Update company logo and branding in Odoo"
echo "   2. Configure company-specific settings"
echo "   3. Create user accounts for the company"
echo ""
