@ECHO building ColladaLoader2.js
@CALL node node_modules\coffee-script\bin\coffee -m -b -c ColladaLoader2.coffee
@REM @ECHO building ColladaLoader2-redux.js
@REM @CALL node node_modules\coffee-script-redux\bin\coffee -j -i ColladaLoader2.coffee -o ColladaLoader2-redux.js
@ECHO building ColladaLoader2-min.js
@CALL node node_modules\uglify-js\bin\uglifyjs ColladaLoader2.js > ColladaLoader2-min.js
@PAUSE