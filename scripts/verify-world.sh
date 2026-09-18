#!/usr/bin/env bash
#
# Compiles the world's pure modules and runs the collision / reachability
# checks against them.
#
# These do not run in a browser on purpose. A browser throttles
# requestAnimationFrame whenever its window is hidden or occluded, which stalls
# the render loop, stops IntersectionObserver delivering, and makes perfectly
# working movement look broken. The height field, precinct plan, layout and
# collision modules are pure functions of data, so they can be checked properly
# without any of it.
set -e

OUT="$(mktemp -d)"
trap 'rm -rf "$OUT"' EXIT

npx tsc \
  src/components/world/layout.ts \
  src/components/world/collision.ts \
  src/components/world/parkSquare.ts \
  src/components/world/terrain.ts \
  src/data/content.ts \
  --outDir "$OUT" --module es2022 --target es2022 \
  --moduleResolution bundler --skipLibCheck

# With several roots tsc mirrors the source tree; flatten it so the checks can
# import everything as siblings.
find "$OUT" -name '*.js' -mindepth 2 -exec mv -f {} "$OUT"/ \;

# tsc emits extensionless specifiers, and the tree is flat now, so every local
# import is rewritten to its basename with the extension Node's ESM loader
# insists on. Requiring a slash in the specifier leaves package imports alone.
for f in "$OUT"/*.js; do
  perl -pi -e "s{from '[^']*/([A-Za-z0-9_-]+)'}{from './\$1.js'}g" "$f"
done

printf '{"type":"module"}' > "$OUT/package.json"
cp scripts/verify-world.mjs "$OUT/"
node "$OUT/verify-world.mjs"
