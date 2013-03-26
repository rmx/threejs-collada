@CALL node node_modules\coffee-script\bin\coffee -c ColladaLoader2.coffee
@REM @CALL node node_modules\coffee-script-redux\bin\coffee -j -i ColladaLoader2.coffee ColladaLoader2.js
@CALL node node_modules\uglify-js\bin\uglifyjs ColladaLoader2.js > ColladaLoader2-min.js
@pause
