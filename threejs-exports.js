/*
A totally incomplete file containing three.js exports.
Use it with google's closure compiler.

*/
var THREE = {};

/**
@constructor
@param {?number=} n11 
@param {?number=} n12
@param {?number=} n13
@param {?number=} n14
@param {?number=} n21
@param {?number=} n22
@param {?number=} n23
@param {?number=} n24
@param {?number=} n31
@param {?number=} n32
@param {?number=} n33
@param {?number=} n34
@param {?number=} n41
@param {?number=} n42
@param {?number=} n43
@param {?number=} n44
*/
THREE.Matrix4 = function( n11, n12, n13, n14, n21, n22, n23, n24, n31, n32, n33, n34, n41, n42, n43, n44 ){};

/**
@param {THREE.Vector3} axis
@param {number} angle
*/
THREE.Matrix4.prototype.makeRotationAxis = function(axis,angle){};

/**
@param {THREE.Vector3} v
*/
THREE.Matrix4.prototype.makeTranslation = function(v){};

/**
@param {THREE.Vector3} s
*/
THREE.Matrix4.prototype.makeScale = function(s){};

/**
@param {THREE.Matrix4} a
@param {THREE.Matrix4} b
*/
THREE.Matrix4.prototype.multiply = function(a,b){};

/**
@param {THREE.Vector3} v
*/
THREE.Matrix4.prototype.multiplyVector3 = function(v){};

/**
@constructor
@param {?number=} x
@param {?number=} y
@param {?number=} z
*/
THREE.Vector3 = function(x,y,z){};

/**
@param {THREE.Vector3} v
*/
THREE.Vector3.prototype.copy = function(v){};

/**
@param {number} s
*/
THREE.Vector3.prototype.multiplyScalar = function(s){};

/**
@param {THREE.Vector3} v
*/
THREE.Vector3.prototype.addSelf = function(v){};

/**
@constructor
@param {?number=} x
@param {?number=} y
*/
THREE.Vector2 = function(x,y){};

/** @constructor */
THREE.Color = function(){};

/**
@param {string} h
*/
THREE.Color.prototype.setHex = function(h){};

/**
@param {number} r
@param {number} g
@param {number} b
*/
THREE.Color.prototype.setRGB = function(r,g,b){};

/**
@constructor
@param {number} v1
@param {number} v2
@param {number} v3
@param {THREE.Vector3|Array.<THREE.Vector3>} n
@param {THREE.Color|Array.<THREE.Color>} c
*/
THREE.Face3 = function(v1,v2,v3,n,c){};


THREE.ShaderUtils = {};

THREE.ShaderUtils.lib = {};

THREE.UniformsUtils = {};

/**
@param {Object} u
@return Object
*/
THREE.UniformsUtils.clone = function(u){};

THREE.ImageUtils = {};

/**
@param {string} s
@return THREE.Texture
*/
THREE.ImageUtils.loadTexture = function(s){};

/** @constructor */
THREE.Object3D = function(){};

/**
@param {THREE.Object3D} o
*/
THREE.Object3D.prototype.add = function(o){};

/**
@constructor
@param {THREE.Geometry} g
@param {THREE.Material|THREE.MeshFaceMaterial} m
*/
THREE.MorphAnimMesh = function(g,m){};

/**
@constructor
@param {THREE.Geometry} g
@param {THREE.Material|THREE.MeshFaceMaterial} m
*/
THREE.SkinnedMesh = function(g,m){};

/**
@constructor
@param {THREE.Geometry} g
@param {THREE.Material|THREE.MeshFaceMaterial} m
*/
THREE.Mesh = function(g,m){};

/** @constructor */
THREE.Geometry = function(){};

/** */
THREE.Geometry.prototype.computeFaceNormals = function(){};

/** */
THREE.Geometry.prototype.computeCentroids = function(){};

/** */
THREE.Geometry.prototype.computeTangents = function(){};

/** */
THREE.Geometry.prototype.computeBoundingBox = function(){};

/** @type {Array.<THREE.Vector2>} */
THREE.Geometry.faceVertexUvs;

/** @type {Array.<THREE.Face3>} */
THREE.Geometry.faces;

/**
@constructor
@param {*} img
*/
THREE.Texture = function(img){};

/** @type {boolean} */
THREE.Texture.flipY;

/** @constructor */
THREE.Material = function(){};

/** @type {THREE.Texture?} */
THREE.Material.bumpMap;

/** @type {THREE.Texture?} */
THREE.Material.normalMap;

/**
@constructor
*/
THREE.MeshFaceMaterial = function(){};

/**
@constructor
@extends THREE.Material
@param {*=} p
*/
THREE.ShaderMaterial = function(p){};

/**
@constructor
@extends THREE.Material
@param {*=} p
*/
THREE.MeshBasicMaterial = function(p){};

/**
@constructor
@extends THREE.Material
@param {*=} p
*/
THREE.MeshPhongMaterial = function(p){};

/**
@constructor
@extends THREE.Material
@param {*=} p
*/
THREE.MeshLambertMaterial = function(p){};

/** @const */
THREE.SmoothShading = function(){};

/** @const */
THREE.FlatShading = function(){};

/** @const */
THREE.RepeatWrapping = function(){};

/** @const */
THREE.DoubleSide = function(){};