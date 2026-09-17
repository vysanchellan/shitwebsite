#!/usr/bin/env bash
#
# Compiles the world's pure modules and runs the collision / reachability
# checks against them.
#
# These do not run in a browser on purpose. A browser throttles
# requestAnimationFrame whenever its window is hidden or occluded, which stalls
# the render loop, stops IntersectionObserver delivering, and makes perfectly
# working movement look broken. The layout, precinct plan and collision modules
# are pure functions of data, so they can be checked properly without any of it.
set -e

OUT="$(mktemp -d)"
trap 'rm -rf "$OUT"' EXIT

npx tsc \
  src/components/world/layout.ts \
  src/components/world/collision.ts \
  src/components/world/parkSquare.ts \
  --outDir "$OUT" --module es2022 --target es2022 \
  --moduleResolution bundler --skipLibCheck

# tsc emits bare specifiers; Node's ESM loader needs the extension on each one.
for f in "$OUT"/*.js; do
  perl -pi -e "s{from '(\./[A-Za-z0-9_-]+)'}{from '\$1.js'}g" "$f"
done

printf '{"type":"module"}' > "$OUT/package.json"
cp scripts/verify-world.mjs "$OUT/"
node "$OUT/verify-world.mjs"
