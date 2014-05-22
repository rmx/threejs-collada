@REM Typescript compiler
@ECHO building ColladaLoader2.js
@CALL tsc src/loader.ts src/converter.ts src/exporter.ts -t ES5 -sourcemap -d --out collada.js

@REM UglifyJS minifier
@ECHO building ColladaLoader2.min.js
@CALL node node_modules/uglify-js/bin/uglifyjs collada.js > collada.min.js

@PAUSE