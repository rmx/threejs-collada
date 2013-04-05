@echo Building ColladaLoader2.js
@call node ..\node_modules\coffee-script\bin\coffee -b -o . -c ..\ColladaLoader2.coffee 
@echo Building ColladaLoader2-closure.js
@call java -jar compiler.jar --compilation_level ADVANCED_OPTIMIZATIONS --formatting PRETTY_PRINT --warning_level VERBOSE --summary_detail_level 3 --js ColladaLoader2.js --externs threejs-exports.js --externs common-exports.js --js_output_file ColladLoader2-closure.js
@pause