#!/usr/bin/env bash
#
# Rewrites the marker positions in src/data/content.ts from the precinct plan.
# Run it after moving a tenancy; `npm run verify:world` fails if you forget.
set -e

OUT="$(mktemp -d)"
trap 'rm -rf "$OUT"' EXIT

npx tsc \
  src/components/world/parkSquare.ts \
  src/components/world/terrain.ts \
  --outDir "$OUT" --module es2022 --target es2022 \
  --moduleResolution bundler --skipLibCheck

find "$OUT" -name '*.js' -mindepth 2 -exec mv -f {} "$OUT"/ \;

for f in "$OUT"/*.js; do
  perl -pi -e "s{from '[^']*/([A-Za-z0-9_-]+)'}{from './\$1.js'}g" "$f"
done

printf '{"type":"module"}' > "$OUT/package.json"
cp scripts/derive-markers.mjs "$OUT/"
node "$OUT/derive-markers.mjs" "$PWD/src/data/content.ts"
