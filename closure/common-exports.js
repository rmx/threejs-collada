// A hack to get closure to understand console.log and module.exports

var module;
var console;
console.log = function(msg){};