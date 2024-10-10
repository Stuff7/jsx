cargo run --bin jsx_template logs/test_dir/ -import '~/runtime' > build/index.js
./node_modules/esbuild/bin/esbuild build/index.js --bundle --sourcemap --jsx=preserve --minify --outdir=sample
