#!/bin/bash
# This script is used to run custom lints on the codebase
files_changed=$(git diff --name-only origin/main)

for file in $files_changed; do
  if [[ $file == **/migrations/* ]]; then
    if git show "origin/main:$file" >/dev/null 2>&1; then
      echo "Commited migration file: '$file' has been changed"
      echo "Should never change committed migration files"
      echo "(This could also just mean that your branch is out of date, and needs to be merged with main)"
      exit 1
    fi
    # New files in migration folder are okay
  fi
done
