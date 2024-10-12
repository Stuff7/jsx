cargo run --bin jsx js/sample -import '~/jsx' > $1
./node_modules/esbuild/bin/esbuild $1 --bundle --sourcemap --minify --outdir=sample
