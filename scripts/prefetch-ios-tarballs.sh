#!/usr/bin/env bash
# Pre-download React Native iOS tarballs so pod install doesn't hang on slow Maven.
# Run from repo root: ./scripts/prefetch-ios-tarballs.sh

set -e
RN_VERSION="0.81.5"
BASE="https://repo1.maven.org/maven2/com/facebook/react/react-native-artifacts/${RN_VERSION}"
PODS_ROOT="ios/Pods"
DEPS_ARTIFACTS="${PODS_ROOT}/ReactNativeDependencies-artifacts"
CORE_ARTIFACTS="${PODS_ROOT}/ReactNativeCore-artifacts"

mkdir -p "$DEPS_ARTIFACTS" "$CORE_ARTIFACTS"

download_if_missing() {
  local dir=$1
  local file=$2
  local url=$3
  local label=$4
  if [[ -f "${dir}/${file}" ]]; then
    echo "[skip] ${label} already present."
  else
    echo "Downloading ${label} (large, may take several minutes)..."
    if curl -L --progress-bar -o "${dir}/${file}" "$url"; then
      echo "Done: ${label}"
    else
      echo "Failed: ${label}" >&2
      exit 1
    fi
  fi
}

# Dependencies: debug + release
download_if_missing "$DEPS_ARTIFACTS" "reactnative-dependencies-${RN_VERSION}-debug.tar.gz" \
  "${BASE}/react-native-artifacts-${RN_VERSION}-reactnative-dependencies-debug.tar.gz" "ReactNativeDependencies (debug)"
download_if_missing "$DEPS_ARTIFACTS" "reactnative-dependencies-${RN_VERSION}-release.tar.gz" \
  "${BASE}/react-native-artifacts-${RN_VERSION}-reactnative-dependencies-release.tar.gz" "ReactNativeDependencies (release)"

# Core: debug + release
download_if_missing "$CORE_ARTIFACTS" "reactnative-core-${RN_VERSION}-debug.tar.gz" \
  "${BASE}/react-native-artifacts-${RN_VERSION}-reactnative-core-debug.tar.gz" "ReactNativeCore (debug)"
download_if_missing "$CORE_ARTIFACTS" "reactnative-core-${RN_VERSION}-release.tar.gz" \
  "${BASE}/react-native-artifacts-${RN_VERSION}-reactnative-core-release.tar.gz" "ReactNativeCore (release)"

echo ""
echo "Pre-download complete. Run: cd ios && pod install --no-repo-update"
