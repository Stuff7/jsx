rm -rf dist/*

# Build
esbuild $(find js -type f \( -name '*.ts' -o -name '*.tsx' \) ! -name '*.d.ts') --sourcemap --tree-shaking=false --format=esm --jsx=automatic --outdir=dist
target/release/ts_imports dist

# Bundle external types
sed -i '/import .* from "csstype";/r node_modules/csstype/index.d.ts' dist/types/dom-utils.d.ts
sed -i '/import .* from "csstype";/d' dist/types/dom-utils.d.ts
