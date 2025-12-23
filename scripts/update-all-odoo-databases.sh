#!/bin/bash
set -e

#######################################
# Update All Odoo Company Databases
# Installs/updates modules in all existing company databases
# Run this after updating the template with new modules
#######################################

# Configuration
GATEWAY_DB_URL="${DATABASE_URL}"
ODOO_URL="${ODOO_URL:-http://localhost:8069}"

# Modules to install (should match init-odoo-template.sh)
# Add any new modules here when you update the template
NEW_MODULES="base_rest_pydantic,fastapi,report_xlsx"  # Example: new modules added to template

echo "🔄 Updating all Odoo company databases with new modules"
echo "=================================================="
echo "New modules to install: $NEW_MODULES"
echo ""

# Query all company databases from gateway database
echo "📋 Fetching company databases from gateway..."
QUERY="SELECT database_name, admin_login, admin_password, odoo_url FROM odoo.databases ORDER BY database_name"

# Use psql to query and format as CSV
DATABASE_RECORDS=$(psql "$GATEWAY_DB_URL" -t -A -F',' -c "$QUERY")

if [ -z "$DATABASE_RECORDS" ]; then
  echo "⚠️  No company databases found in gateway database"
  exit 0
fi

TOTAL=$(echo "$DATABASE_RECORDS" | wc -l | tr -d ' ')
echo "Found $TOTAL company databases"
echo ""

# Process each database
COUNTER=0
FAILED=0

while IFS=',' read -r DB_NAME ADMIN_LOGIN ENCRYPTED_PASSWORD ODOO_URL; do
  COUNTER=$((COUNTER + 1))
  echo "[$COUNTER/$TOTAL] 📦 Updating: $DB_NAME"

  # Note: Password is encrypted in database
  # Need to decrypt using gateway's encryption service
  # For now, we'll use Odoo XML-RPC API which the gateway handles internally

  # Call gateway API endpoint to install modules for this database
  # This uses the gateway's decryption service internally
  ORG_ID=$(psql "$GATEWAY_DB_URL" -t -A -c "SELECT organization_id FROM odoo.databases WHERE database_name = '$DB_NAME'")

  if [ -z "$ORG_ID" ]; then
    echo "  ❌ Failed: Could not find organization ID"
    FAILED=$((FAILED + 1))
    continue
  fi

  # Call gateway endpoint to install modules
  # Assumes gateway is running locally or via GATEWAY_URL env var
  GATEWAY_URL="${GATEWAY_URL:-http://localhost:3000}"

  HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" \
    -X POST "$GATEWAY_URL/api/v1/odoo/organizations/$ORG_ID/install-modules" \
    -H "Authorization: Bearer ${API_TOKEN}" \
    -H "Content-Type: application/json")

  if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "204" ]; then
    echo "  ✅ Updated $DB_NAME"
  else
    echo "  ❌ Failed with HTTP $HTTP_CODE"
    FAILED=$((FAILED + 1))
  fi

  echo ""
done <<< "$DATABASE_RECORDS"

echo "=================================================="
echo "✅ Update complete!"
echo "   Total: $TOTAL databases"
echo "   Success: $((TOTAL - FAILED))"
if [ $FAILED -gt 0 ]; then
  echo "   Failed: $FAILED"
fi
