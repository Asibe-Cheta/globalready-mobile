#!/usr/bin/env bash
# Run pod install with verbose output so "Integrating client project" doesn't look stuck.
# From repo root: ./scripts/pod-install-verbose.sh

set -e
cd "$(dirname "$0")/../ios"
echo "Running pod install (verbose). Integrating client project can take 10–20 min on first run."
COCOAPODS_DISABLE_STATS=1 pod install --verbose --no-repo-update
