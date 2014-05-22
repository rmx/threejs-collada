@REM Typescript compiler
@ECHO building collada.js
@CALL tsc src/loader.ts src/converter.ts src/exporter.ts -t ES5 -sourcemap -d --out collada.js

@REM UglifyJS minifier
@ECHO building collada.min.js
@CALL node node_modules/uglify-js/bin/uglifyjs collada.js > collada.min.js

@PAUSE