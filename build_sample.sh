cargo run --bin jsx_template logs/test_dir/ -import '~/jsx' > $1
./node_modules/esbuild/bin/esbuild $1 --bundle --sourcemap --minify --outdir=sample
