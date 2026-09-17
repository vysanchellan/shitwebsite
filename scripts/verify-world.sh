#!/usr/bin/env bash
# Compiles the world's pure modules and runs the collision/reachability checks.
# The browser cannot be trusted for this: it throttles requestAnimationFrame
# when its pane is hidden, which stalls the render loop and makes working
# movement look broken.
set -e
OUT="$(mktemp -d)"
npx tsc src/components/world/layout.ts src/components/world/collision.ts \
  --outDir "$OUT" --module es2022 --target es2022 \
  --moduleResolution bundler --skipLibCheck
sed -i "s|from './layout'|from './layout.js'|" "$OUT/collision.js"
printf '{"type":"module"}' > "$OUT/package.json"
cp scripts/verify-world.mjs "$OUT/"
node "$OUT/verify-world.mjs"
