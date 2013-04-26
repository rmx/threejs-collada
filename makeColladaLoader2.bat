@REM Coffeescript compiler
@ECHO building ColladaLoader2.js
@CALL node node_modules/coffee-script/bin/coffee -m -b -c ColladaLoader2.coffee

@REM Coffeescript2 compiler
@REM @ECHO building ColladaLoader2-redux.js
@REM @CALL node node_modules/coffee-script-redux/bin/coffee -j -i ColladaLoader2.coffee -o ColladaLoader2-redux.js

@REM UglifyJS minifier
@ECHO building ColladaLoader2.min.js
@CALL node node_modules/uglify-js/bin/uglifyjs ColladaLoader2.js > ColladaLoader2.min.js

@REM Closure compiler/minifier
@ECHO building ColladaLoader2.closure.js
@CALL java -jar closure/compiler.jar --compilation_level ADVANCED_OPTIMIZATIONS --formatting PRETTY_PRINT --warning_level VERBOSE --summary_detail_level 3 --js ColladaLoader2.js --externs closure/threejs-exports.js --externs closure/common-exports.js --js_output_file ColladaLoader2.closure.js

@PAUSE