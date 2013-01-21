@CALL node node_modules\coffee-script\bin\coffee -c ColladaLoader2
@CALL node node_modules\uglify-js\bin\uglifyjs ColladaLoader2.js > ColladaLoader2-min.js
@pause
