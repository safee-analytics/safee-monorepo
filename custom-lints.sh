#!/bin/bash
# This script is used to run custom lints on the codebase

# Get the base branch (default to origin/main, but check if it exists)
if git rev-parse --verify origin/main >/dev/null 2>&1; then
  BASE_BRANCH="origin/main"
elif git rev-parse --verify main >/dev/null 2>&1; then
  BASE_BRANCH="main"
else
  echo "Warning: Could not find main branch, skipping migration checks"
  exit 0
fi

files_changed=$(git diff --name-only "$BASE_BRANCH" 2>/dev/null)

# If we can't diff against base branch, skip checks
if [ -z "$files_changed" ]; then
  echo "Warning: Could not compare against $BASE_BRANCH, skipping migration checks"
  exit 0
fi

for file in $files_changed; do
  # Check if file is in migrations directory
  if [[ $file == **/migrations/* ]] || [[ $file == */migrations/* ]]; then

    # Allow _journal.json to be modified (Drizzle migration tracker)
    if [[ $file == */_journal.json ]]; then
      continue
    fi

    # Check if this file exists in the base branch (i.e., it's not a new migration)
    if git show "$BASE_BRANCH:$file" >/dev/null 2>&1; then
      echo "ERROR: Committed migration file has been modified: '$file'"
      echo ""
      echo "Migration files should NEVER be changed after they're committed."
      echo ""
      echo "If you need to make changes:"
      echo "  1. Revert changes to: $file"
      echo "  2. Create a NEW migration with: npm run db:generate"
      echo ""
      echo "(Or this could mean your branch is out of date and needs to be merged with main)"
      exit 1
    fi

    # New migration files are okay
  fi
done

echo "✓ Migration files check passed"
