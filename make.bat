@REM Typescript compiler
@ECHO building collada.js
@CALL tsc src/loader.ts src/converter.ts src/exporter.ts -t ES5 -sourcemap -d --out lib/collada.js

@REM UglifyJS minifier
@ECHO building collada.min.js
@CALL node node_modules/uglify-js/bin/uglifyjs lib/collada.js > lib/collada.min.js

@REM Typescript compiler
@ECHO building convert.js
@CALL tsc examples/convert.ts -t ES5 -sourcemap -d --out examples/convert.js

@PAUSE