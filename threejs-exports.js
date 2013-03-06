/*
A totally incomplete file containing three.js exports.
Use it with google's closure compiler.

*/
var THREE = {};

// ----------------------------------------------------------------------------
// THREE.Matrix4
// ----------------------------------------------------------------------------

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
THREE.Matrix4 = function(n11, n12, n13, n14, n21, n22, n23, n24, n31, n32, n33, n34, n41, n42, n43, n44){};

/**
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
@return {THREE.Matrix4}
*/
THREE.Matrix4.prototype.set = function(n11, n12, n13, n14, n21, n22, n23, n24, n31, n32, n33, n34, n41, n42, n43, n44){};

/**
@return {THREE.Matrix4}
*/
THREE.Matrix4.prototype.identity = function(){};

/**
@param {THREE.Matrix4} m
@return {THREE.Matrix4}
*/
THREE.Matrix4.prototype.copy = function(m){};

/**
@param {THREE.Vector3} v
@param {?String=} order
@return {THREE.Matrix4}
*/
THREE.Matrix4.prototype.setRotationFromEuler = function(v, order){};

/**
@param {THREE.Quaternion} q
@return {THREE.Matrix4}
*/
THREE.Matrix4.prototype.setRotationFromQuaternion = function(q){};

/**
@param {THREE.Vector3} eye
@param {THREE.Vector3} target
@param {THREE.Vector3} at
@return {THREE.Matrix4}
*/
THREE.Matrix4.prototype.lookAt = function(eye, target, up){};

/**
@param {THREE.Matrix4} m
@return {THREE.Matrix4}
*/
THREE.Matrix4.prototype.multiply = function(m){};

/**
@param {THREE.Matrix4} m
@param {THREE.Matrix4} n
@return {THREE.Matrix4}
*/
THREE.Matrix4.prototype.multiplyMatrices = function(m, n){};

/**
@param {THREE.Matrix4} m
@param {THREE.Matrix4} n
@param {Array.<Number>} r
@return {THREE.Matrix4}
*/
THREE.Matrix4.prototype.multiplyToArray = function(m, n, r){};

/**
@param {Number} s
@return {THREE.Matrix4}
*/
THREE.Matrix4.prototype.multiplyScalar = function(s){};

/**
@param {Array.<Number>} a
@return {Array.<Number>}
*/
THREE.Matrix4.prototype.multiplyVector3Array = function(a){};

/**
@param {THREE.Vector3} v
@return {THREE.Vector3}
*/
THREE.Matrix4.prototype.rotateAxis = function(v){};

/**
@param {THREE.Vector4} v
@return {THREE.Vector4}
*/
THREE.Matrix4.prototype.crossVector = function(v){};

/**
@return {Number}
@nosideeffects
*/
THREE.Matrix4.prototype.determinant = function(v){};

/**
@return {THREE.Matrix4}
*/
THREE.Matrix4.prototype.transpose = function(){};

/**
@param {Array.<Number>} a
@return {Array.<Number>}
*/
THREE.Matrix4.prototype.flattenToArray = function(a){};

/**
@param {Array.<Number>} a
@param {Number} o
@return {Array.<Number>}
*/
THREE.Matrix4.prototype.flattenToArrayOffset = function(a, o){};

/**
@param {THREE.Vector3} p
@return {THREE.Matrix4}
*/
THREE.Matrix4.prototype.setPosition = function(p){};

/**
@param {THREE.Matrix4} m
@param {Boolean=} throwOnInvertible
@return {THREE.Matrix4}
*/
THREE.Matrix4.prototype.getInverse = function(m, throwOnInvertible){};

/**
@param {THREE.Vector3} t
@param {THREE.Quaternion} r
@param {THREE.Vector3} s
@return {THREE.Matrix4}
*/
THREE.Matrix4.prototype.compose = function(t, r, s){};

/**
@param {?THREE.Vector3=} t
@param {?THREE.Quaternion=} r
@param {?THREE.Vector3=} s
@return {Array.<THREE.Vector3|THREE.Quaternion>}
*/
THREE.Matrix4.prototype.decompose = function(t, r, s){};

/**
@param {THREE.Matrix4} m
@return {THREE.Matrix4}
*/
THREE.Matrix4.prototype.extractPosition = function(m){};

/**
@param {THREE.Matrix4} m
@return {THREE.Matrix4}
*/
THREE.Matrix4.prototype.extractRotation = function(m){};

/**
@param {THREE.Vector3} v
@return {THREE.Matrix4}
*/
THREE.Matrix4.prototype.translate = function(v){};

/**
@param {Number} angle
@return {THREE.Matrix4}
*/
THREE.Matrix4.prototype.rotateX = function(angle){};

/**
@param {Number} angle
@return {THREE.Matrix4}
*/
THREE.Matrix4.prototype.rotateY = function(angle){};

/**
@param {Number} angle
@return {THREE.Matrix4}
*/
THREE.Matrix4.prototype.rotateZ = function(angle){};

/**
@param {THREE.Vector3} axis
@param {Number} angle
@return {THREE.Matrix4}
*/
THREE.Matrix4.prototype.rotateByAxis = function(axis, angle){};

/**
@param {THREE.Vector3} s
@return {THREE.Matrix4}
*/
THREE.Matrix4.prototype.scale = function(s){};

/**
@nosideeffects
@return {Number}
*/
THREE.Matrix4.prototype.getMaxScaleOnAxis = function(){};

/**
@param {Number} x
@param {Number} y
@param {Number} z
@return {THREE.Matrix4}
*/
THREE.Matrix4.prototype.makeTranslation = function(x,y,z){};

/**
@param {Number} theta
@return {THREE.Matrix4}
*/
THREE.Matrix4.prototype.makeRotationX = function(theta){};

/**
@param {Number} theta
@return {THREE.Matrix4}
*/
THREE.Matrix4.prototype.makeRotationY = function(theta){};

/**
@param {Number} theta
@return {THREE.Matrix4}
*/
THREE.Matrix4.prototype.makeRotationZ = function(theta){};

/**
@param {THREE.Vector3} axis
@param {Number} angle
@return {THREE.Matrix4}
*/
THREE.Matrix4.prototype.makeRotationAxis = function(axis, angle){};

/**
@param {Number} x
@param {Number} y
@param {Number} z
@return {THREE.Matrix4}
*/
THREE.Matrix4.prototype.makeScale = function(x,y,z){};

/**
@param {Number} left
@param {Number} right
@param {Number} bottom
@param {Number} top
@param {Number} near
@param {Number} far
@return {THREE.Matrix4}
*/
THREE.Matrix4.prototype.makeFrustum = function(left, right, bottom, top, near, far){};

/**
@param {Number} fov
@param {Number} aspect
@param {Number} near
@param {Number} far
@return {THREE.Matrix4}
*/
THREE.Matrix4.prototype.makePerspective = function(fov, aspect, near, far){};

/**
@param {Number} left
@param {Number} right
@param {Number} bottom
@param {Number} top
@param {Number} near
@param {Number} far
@return {THREE.Matrix4}
*/
THREE.Matrix4.prototype.makeOrthographic = function(left, right, top, bottom, near, far){};

/**
@nosideeffects
@return {THREE.Matrix4}
*/
THREE.Matrix4.prototype.clone = function(){};

// ----------------------------------------------------------------------------
// THREE.Vector3
// ----------------------------------------------------------------------------

/**
@constructor
@param {?number=} x
@param {?number=} y
@param {?number=} z
*/
THREE.Vector3 = function(x,y,z){};

/** @type {number} */
THREE.Vector3.prototype.x;

/** @type {number} */
THREE.Vector3.prototype.y;

/** @type {number} */
THREE.Vector3.prototype.z;

/**
@param {Number} x
@param {Number} y
@param {Number} z
@return {THREE.Vector3}
*/
THREE.Vector3.prototype.set = function(x,y,z){};

/**
@param {Number} x
@return {THREE.Vector3}
*/
THREE.Vector3.prototype.setX = function(x){};

/**
@param {Number} y
@return {THREE.Vector3}
*/
THREE.Vector3.prototype.setY = function(y){};

/**
@param {Number} z
@return {THREE.Vector3}
*/
THREE.Vector3.prototype.setZ = function(z){};

/**
@param {Number} index
@param {Number} value
@return {THREE.Vector3}
*/
THREE.Vector3.prototype.setComponent = function(index, value){};

/**
@nosideeffects
@param {Number} index
@return {Number}
*/
THREE.Vector3.prototype.getComponent = function(index){};

/**
@param {THREE.Vector3} v
@return {THREE.Vector3}
*/
THREE.Vector3.prototype.copy = function(v){};

/**
@param {THREE.Vector3} v
@return {THREE.Vector3}
*/
THREE.Vector3.prototype.add = function(v){};

/**
@param {Number} s
@return {THREE.Vector3}
*/
THREE.Vector3.prototype.addScalar = function(s){};

/**
@param {THREE.Vector3} v
@param {THREE.Vector3} w
@return {THREE.Vector3}
*/
THREE.Vector3.prototype.addVectors = function(v, w){};

/**
@param {THREE.Vector3} v
@return {THREE.Vector3}
*/
THREE.Vector3.prototype.sub = function(v){};

/**
@param {THREE.Vector3} v
@param {THREE.Vector3} w
@return {THREE.Vector3}
*/
THREE.Vector3.prototype.subVectors = function(v, w){};

/**
@param {THREE.Vector3} v
@return {THREE.Vector3}
*/
THREE.Vector3.prototype.multiply = function(v){};

/**
@param {Number} s
@return {THREE.Vector3}
*/
THREE.Vector3.prototype.multiplyScalar = function(s){};

/**
@param {THREE.Vector3} v
@param {THREE.Vector3} w
@return {THREE.Vector3}
*/
THREE.Vector3.prototype.multiplyVectors = function(v, w){};

/**
@param {THREE.Matrix3} m
@return {THREE.Vector3}
*/
THREE.Vector3.prototype.applyMatrix3 = function(m){};

/**
@param {THREE.Matrix4} m
@return {THREE.Vector3}
*/
THREE.Vector3.prototype.applyMatrix4 = function(m){};

/**
@param {THREE.Matrix4} m
@return {THREE.Vector3}
*/
THREE.Vector3.prototype.applyProjection = function(m){};

/**
@param {THREE.Quaternion} q
@return {THREE.Vector3}
*/
THREE.Vector3.prototype.applyQuaternion = function(q){};

/**
@param {THREE.Vector3} v
@param {?String=} order
@return {THREE.Vector3}
*/
THREE.Vector3.prototype.applyEuler = function(v, order){};

/**
@param {THREE.Vector3} axis
@param {Number} angle
@return {THREE.Vector3}
*/
THREE.Vector3.prototype.applyAxisAngle = function(axis, angle){};

/**
@param {THREE.Matrix4} m
@return {THREE.Vector3}
*/
THREE.Vector3.prototype.transformDirection = function(m){};

/**
@param {THREE.Vector3} v
@return {THREE.Vector3}
*/
THREE.Vector3.prototype.divide = function(v){};

/**
@param {Number} s
@return {THREE.Vector3}
*/
THREE.Vector3.prototype.divideScalar = function(s){};

/**
@param {THREE.Vector3} v
@return {THREE.Vector3}
*/
THREE.Vector3.prototype.min = function(v){};

/**
@param {THREE.Vector3} v
@return {THREE.Vector3}
*/
THREE.Vector3.prototype.max = function(v){};

/**
@param {THREE.Vector3} min
@param {THREE.Vector3} max
@return {THREE.Vector3}
*/
THREE.Vector3.prototype.clamp = function(min, max){};

/**
@return {THREE.Vector3}
*/
THREE.Vector3.prototype.negate = function(){};

/**
@nosideeffects
@param {THREE.Vector3} v
@return {Number}
*/
THREE.Vector3.prototype.dot = function(v){};

/**
@nosideeffects
@return {Number}
*/
THREE.Vector3.prototype.lengthSq = function(){};

/**
@nosideeffects
@return {Number}
*/
THREE.Vector3.prototype.length = function(){};

/**
@nosideeffects
@return {Number}
*/
THREE.Vector3.prototype.lengthManhattan = function(){};

/**
@return {THREE.Vector3}
*/
THREE.Vector3.prototype.normalize = function(){};

/**
@param {Number} l
@return {THREE.Vector3}
*/
THREE.Vector3.prototype.setLength = function(l){};

/**
@param {THREE.Vector3} v
@param {Number} alpha
@return {THREE.Vector3}
*/
THREE.Vector3.prototype.lerp = function(v, alpha){};

/**
@param {THREE.Vector3} v
@return {THREE.Vector3}
*/
THREE.Vector3.prototype.cross = function(v){};

/**
@param {THREE.Vector3} v
@param {THREE.Vector3} w
@return {THREE.Vector3}
*/
THREE.Vector3.prototype.crossVectors = function(v, w){};

/**
@param {THREE.Vector3} v
@return {THREE.Vector3}
*/
THREE.Vector3.prototype.projectOnVector = function(v){};

/**
@param {THREE.Vector3} normal
@return {THREE.Vector3}
*/
THREE.Vector3.prototype.projectOnPlane = function(normal){};

/**
@param {THREE.Vector3} v
@return {THREE.Vector3}
*/
THREE.Vector3.prototype.reflect = function(v){};

/**
@nosideeffects
@param {THREE.Vector3} v
@return {Number}
*/
THREE.Vector3.prototype.angleTo = function(v){};

/**
@nosideeffects
@param {THREE.Vector3} v
@return {Number}
*/
THREE.Vector3.prototype.distanceTo = function(v){};

/**
@nosideeffects
@param {THREE.Vector3} v
@return {Number}
*/
THREE.Vector3.prototype.distanceToSquared = function(v){};

/**
@param {THREE.Matrix4} m
@return {THREE.Vector3}
*/
THREE.Vector3.prototype.getPositionFromMatrix = function(m){};

/**
@param {THREE.Matrix4} m
@param {?String=} order
@return {THREE.Vector3}
*/
THREE.Vector3.prototype.setEulerFromRotationMatrix = function(m, order){};

/**
@param {THREE.Quaternion} q
@param {?String=} order
@return {THREE.Vector3}
*/
THREE.Vector3.prototype.setEulerFromQuaternion = function(q, order){};

/**
@param {THREE.Matrix4} m
@return {THREE.Vector3}
*/
THREE.Vector3.prototype.getScaleFromMatrix = function(m){};

/**
@nosideeffects
@param {THREE.Vector3} v
@return {Boolean}
*/
THREE.Vector3.prototype.equals = function(v){};

/**
@nosideeffects
@return {Array.<Number>}
*/
THREE.Vector3.prototype.toArray = function(){};

/**
@nosideeffects
@return {THREE.Vector3}
*/
THREE.Vector3.prototype.clone = function(){};

// ----------------------------------------------------------------------------
// THREE.Vector2
// ----------------------------------------------------------------------------

/**
@constructor
@param {?number=} x
@param {?number=} y
*/
THREE.Vector2 = function(x,y){};

// ----------------------------------------------------------------------------
// THREE.Color
// ----------------------------------------------------------------------------

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

// ----------------------------------------------------------------------------
// THREE.Face3
// ----------------------------------------------------------------------------

/**
@constructor
@param {number} v1
@param {number} v2
@param {number} v3
@param {THREE.Vector3|Array.<THREE.Vector3>} n
@param {THREE.Color|Array.<THREE.Color>} c
*/
THREE.Face3 = function(v1,v2,v3,n,c){};

// ----------------------------------------------------------------------------
// THREE.Object3D
// ----------------------------------------------------------------------------

/** @constructor */
THREE.Object3D = function(){};

/**
@param {THREE.Object3D} o
*/
THREE.Object3D.prototype.add = function(o){};

// ----------------------------------------------------------------------------
// THREE.Mesh
// ----------------------------------------------------------------------------

/**
@constructor
@param {THREE.Geometry} g
@param {THREE.Material|THREE.MeshFaceMaterial} m
*/
THREE.Mesh = function(g,m){};

// ----------------------------------------------------------------------------
// THREE.MorphAnimMesh
// ----------------------------------------------------------------------------

/**
@constructor
@extends THREE.Mesh
@param {THREE.Geometry} g
@param {THREE.Material|THREE.MeshFaceMaterial} m
*/
THREE.MorphAnimMesh = function(g,m){};

// ----------------------------------------------------------------------------
// THREE.SkinnedMesh
// ----------------------------------------------------------------------------

/**
@constructor
@extends THREE.Mesh
@param {THREE.Geometry} g
@param {THREE.Material|THREE.MeshFaceMaterial} m
*/
THREE.SkinnedMesh = function(g,m){};

// ----------------------------------------------------------------------------
// THREE.Geometry
// ----------------------------------------------------------------------------

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

// ----------------------------------------------------------------------------
// THREE.Texture
// ----------------------------------------------------------------------------

/**
@constructor
@param {*} img
*/
THREE.Texture = function(img){};

/** @type {boolean} */
THREE.Texture.flipY;

// ----------------------------------------------------------------------------
// THREE.Material
// ----------------------------------------------------------------------------

/** @constructor */
THREE.Material = function(){};

/** @type {THREE.Texture?} */
THREE.Material.bumpMap;

/** @type {THREE.Texture?} */
THREE.Material.normalMap;

// ----------------------------------------------------------------------------
// THREE.MeshFaceMaterial
// ----------------------------------------------------------------------------

/**
@constructor
*/
THREE.MeshFaceMaterial = function(){};

// ----------------------------------------------------------------------------
// THREE.ShaderMaterial
// ----------------------------------------------------------------------------

/**
@constructor
@extends THREE.Material
@param {*=} p
*/
THREE.ShaderMaterial = function(p){};

// ----------------------------------------------------------------------------
// THREE.MeshBasicMaterial
// ----------------------------------------------------------------------------

/**
@constructor
@extends THREE.Material
@param {*=} p
*/
THREE.MeshBasicMaterial = function(p){};

// ----------------------------------------------------------------------------
// THREE.MeshPhongMaterial
// ----------------------------------------------------------------------------

/**
@constructor
@extends THREE.Material
@param {*=} p
*/
THREE.MeshPhongMaterial = function(p){};

// ----------------------------------------------------------------------------
// THREE.MeshLambertMaterial
// ----------------------------------------------------------------------------

/**
@constructor
@extends THREE.Material
@param {*=} p
*/
THREE.MeshLambertMaterial = function(p){};

// ----------------------------------------------------------------------------
// Misc utils
// ----------------------------------------------------------------------------

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

// ----------------------------------------------------------------------------
// Misc constants
// ----------------------------------------------------------------------------

/** @const */
THREE.SmoothShading = function(){};

/** @const */
THREE.FlatShading = function(){};

/** @const */
THREE.RepeatWrapping = function(){};

/** @const */
THREE.DoubleSide = function(){};