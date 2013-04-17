// A hack to get closure to understand common javascript objects

// module.exports
var module;

// console.log
var console;
/**
@param {*} msg
*/
console.log = function(msg){};

/**
@constructor
*/
var XMLDocument = function(){};

/** @type {!Array.<Node>} */ XMLDocument.prototype.childNodes;
