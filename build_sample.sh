cargo run --bin jsx js/sample -import '~/jsx' -outdir build
./node_modules/esbuild/bin/esbuild build/index.tsx --bundle --sourcemap --minify --outdir=sample
