/*
A totally incomplete file containing three.js exports.
Use it with google's closure compiler.

*/
var THREE = {};

// ============================================================================
// THREE.Matrix4 (r56)
// ============================================================================

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
@param {?string=} order
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
@param {THREE.Vector3} up
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
@param {Array.<number>} r
@return {THREE.Matrix4}
*/
THREE.Matrix4.prototype.multiplyToArray = function(m, n, r){};

/**
@param {number} s
@return {THREE.Matrix4}
*/
THREE.Matrix4.prototype.multiplyScalar = function(s){};

/**
@param {Array.<number>} a
@return {Array.<number>}
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
@return {number}
@nosideeffects
*/
THREE.Matrix4.prototype.determinant = function(v){};

/**
@return {THREE.Matrix4}
*/
THREE.Matrix4.prototype.transpose = function(){};

/**
@param {Array.<number>} a
@return {Array.<number>}
*/
THREE.Matrix4.prototype.flattenToArray = function(a){};

/**
@param {Array.<number>} a
@param {number} o
@return {Array.<number>}
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
@param {number} angle
@return {THREE.Matrix4}
*/
THREE.Matrix4.prototype.rotateX = function(angle){};

/**
@param {number} angle
@return {THREE.Matrix4}
*/
THREE.Matrix4.prototype.rotateY = function(angle){};

/**
@param {number} angle
@return {THREE.Matrix4}
*/
THREE.Matrix4.prototype.rotateZ = function(angle){};

/**
@param {THREE.Vector3} axis
@param {number} angle
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
@return {number}
*/
THREE.Matrix4.prototype.getMaxScaleOnAxis = function(){};

/**
@param {number} x
@param {number} y
@param {number} z
@return {THREE.Matrix4}
*/
THREE.Matrix4.prototype.makeTranslation = function(x,y,z){};

/**
@param {number} theta
@return {THREE.Matrix4}
*/
THREE.Matrix4.prototype.makeRotationX = function(theta){};

/**
@param {number} theta
@return {THREE.Matrix4}
*/
THREE.Matrix4.prototype.makeRotationY = function(theta){};

/**
@param {number} theta
@return {THREE.Matrix4}
*/
THREE.Matrix4.prototype.makeRotationZ = function(theta){};

/**
@param {THREE.Vector3} axis
@param {number} angle
@return {THREE.Matrix4}
*/
THREE.Matrix4.prototype.makeRotationAxis = function(axis, angle){};

/**
@param {number} x
@param {number} y
@param {number} z
@return {THREE.Matrix4}
*/
THREE.Matrix4.prototype.makeScale = function(x,y,z){};

/**
@param {number} left
@param {number} right
@param {number} bottom
@param {number} top
@param {number} near
@param {number} far
@return {THREE.Matrix4}
*/
THREE.Matrix4.prototype.makeFrustum = function(left, right, bottom, top, near, far){};

/**
@param {number} fov
@param {number} aspect
@param {number} near
@param {number} far
@return {THREE.Matrix4}
*/
THREE.Matrix4.prototype.makePerspective = function(fov, aspect, near, far){};

/**
@param {number} left
@param {number} right
@param {number} bottom
@param {number} top
@param {number} near
@param {number} far
@return {THREE.Matrix4}
*/
THREE.Matrix4.prototype.makeOrthographic = function(left, right, top, bottom, near, far){};

/**
@nosideeffects
@return {THREE.Matrix4}
*/
THREE.Matrix4.prototype.clone = function(){};

// ============================================================================
// THREE.Matrix3
// ============================================================================

/**
@constructor
@param {?number=} n11 
@param {?number=} n12
@param {?number=} n13
@param {?number=} n21
@param {?number=} n22
@param {?number=} n23
@param {?number=} n31
@param {?number=} n32
@param {?number=} n33
*/
THREE.Matrix3 = function(n11, n12, n13, n21, n22, n23, n31, n32, n33){};

// ============================================================================
// THREE.Vector3 (r56)
// ============================================================================

/**
@constructor
@param {?number=} x
@param {?number=} y
@param {?number=} z
*/
THREE.Vector3 = function(x,y,z){};

/** @type {number} */ THREE.Vector3.prototype.x;
/** @type {number} */ THREE.Vector3.prototype.y;
/** @type {number} */ THREE.Vector3.prototype.z;

/**
@param {number} x
@param {number} y
@param {number} z
@return {THREE.Vector3}
*/
THREE.Vector3.prototype.set = function(x,y,z){};

/**
@param {number} x
@return {THREE.Vector3}
*/
THREE.Vector3.prototype.setX = function(x){};

/**
@param {number} y
@return {THREE.Vector3}
*/
THREE.Vector3.prototype.setY = function(y){};

/**
@param {number} z
@return {THREE.Vector3}
*/
THREE.Vector3.prototype.setZ = function(z){};

/**
@param {number} index
@param {number} value
@return {THREE.Vector3}
*/
THREE.Vector3.prototype.setComponent = function(index, value){};

/**
@nosideeffects
@param {number} index
@return {number}
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
@param {number} s
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
@param {number} s
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
@param {?string=} order
@return {THREE.Vector3}
*/
THREE.Vector3.prototype.applyEuler = function(v, order){};

/**
@param {THREE.Vector3} axis
@param {number} angle
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
@param {number} s
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
@return {number}
*/
THREE.Vector3.prototype.dot = function(v){};

/**
@nosideeffects
@return {number}
*/
THREE.Vector3.prototype.lengthSq = function(){};

/**
@nosideeffects
@return {number}
*/
THREE.Vector3.prototype.length = function(){};

/**
@nosideeffects
@return {number}
*/
THREE.Vector3.prototype.lengthManhattan = function(){};

/**
@return {THREE.Vector3}
*/
THREE.Vector3.prototype.normalize = function(){};

/**
@param {number} l
@return {THREE.Vector3}
*/
THREE.Vector3.prototype.setLength = function(l){};

/**
@param {THREE.Vector3} v
@param {number} alpha
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
@return {number}
*/
THREE.Vector3.prototype.angleTo = function(v){};

/**
@nosideeffects
@param {THREE.Vector3} v
@return {number}
*/
THREE.Vector3.prototype.distanceTo = function(v){};

/**
@nosideeffects
@param {THREE.Vector3} v
@return {number}
*/
THREE.Vector3.prototype.distanceToSquared = function(v){};

/**
@param {THREE.Matrix4} m
@return {THREE.Vector3}
*/
THREE.Vector3.prototype.getPositionFromMatrix = function(m){};

/**
@param {THREE.Matrix4} m
@param {?string=} order
@return {THREE.Vector3}
*/
THREE.Vector3.prototype.setEulerFromRotationMatrix = function(m, order){};

/**
@param {THREE.Quaternion} q
@param {?string=} order
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
@return {Array.<number>}
*/
THREE.Vector3.prototype.toArray = function(){};

/**
@nosideeffects
@return {THREE.Vector3}
*/
THREE.Vector3.prototype.clone = function(){};

// ============================================================================
// THREE.Vector2
// ============================================================================

/**
@constructor
@param {?number=} x
@param {?number=} y
*/
THREE.Vector2 = function(x,y){};

/** @type {number} */ THREE.Vector2.prototype.x;
/** @type {number} */ THREE.Vector2.prototype.y;

// ============================================================================
// THREE.Vector4
// ============================================================================

/**
@constructor
@param {?number=} x
@param {?number=} y
@param {?number=} z
@param {?number=} w
*/
THREE.Vector4 = function(x,y,z,w){};

// ============================================================================
// THREE.Quaternion (r56)
// ============================================================================

/**
@constructor
@param {?number=} x
@param {?number=} y
@param {?number=} z
@param {?number=} w
*/
THREE.Quaternion = function(x,y,z,w){};

/** @type {number} */ THREE.Quaternion.prototype.x;
/** @type {number} */ THREE.Quaternion.prototype.y;
/** @type {number} */ THREE.Quaternion.prototype.z;
/** @type {number} */ THREE.Quaternion.prototype.w;

/**
@param {number} x
@param {number} y
@param {number} z
@param {number} w
@return {THREE.Quaternion}
*/
THREE.Quaternion.prototype.set = function(x,y,z,w){};

/**
@param {THREE.Quaternion} q
@return {THREE.Quaternion}
*/
THREE.Quaternion.prototype.copy = function(q){};

/**
@param {THREE.Vector3} v
@param {?string=} order
@return {THREE.Quaternion}
*/
THREE.Quaternion.prototype.setFromEuler = function(v, order){};

/**
@param {THREE.Vector3} axis
@param {number} angle
@return {THREE.Quaternion}
*/
THREE.Quaternion.prototype.setAxisAngle = function(axis, angle){};

/**
@param {THREE.Matrix4} m
@return {THREE.Quaternion}
*/
THREE.Quaternion.prototype.setFromRotationMatrix = function(m){};

/**
@return {THREE.Quaternion}
*/
THREE.Quaternion.prototype.inverse = function(){};

/**
@return {THREE.Quaternion}
*/
THREE.Quaternion.prototype.conjugate = function(){};

/**
@nosideeffects
@return {number}
*/
THREE.Quaternion.prototype.lengthSq = function(){};

/**
@nosideeffects
@return {number}
*/
THREE.Quaternion.prototype.length = function(){};

/**
@return {THREE.Quaternion}
*/
THREE.Quaternion.prototype.normalize = function(){};

/**
@param {THREE.Quaternion} q
@return {THREE.Quaternion}
*/
THREE.Quaternion.prototype.multiply = function(q){};

/**
@param {THREE.Quaternion} q
@param {THREE.Quaternion} p
@return {THREE.Quaternion}
*/
THREE.Quaternion.prototype.multiplyQuaternions = function(q, p){};

/**
@param {THREE.Quaternion} q
@param {number} t
@return {THREE.Quaternion}
*/
THREE.Quaternion.prototype.slerp = function(q, t){};

/**
@nosideeffects
@param {THREE.Quaternion} q
@return {Boolean}
*/
THREE.Quaternion.prototype.equals = function(q){};

/**
@nosideeffects
@return {THREE.Quaternion}
*/
THREE.Quaternion.prototype.clone = function(){};

// ============================================================================
// THREE.Color (r56, incomplete)
// ============================================================================

/** @constructor */
THREE.Color = function(){};

/** @type {number} */ THREE.Color.prototype.r;
/** @type {number} */ THREE.Color.prototype.g;
/** @type {number} */ THREE.Color.prototype.b;

/**
@param {string|number} v
*/
THREE.Color.prototype.set = function(v){};

/**
@param {number} h
*/
THREE.Color.prototype.setHex = function(h){};

/**
@param {number} r
@param {number} g
@param {number} b
*/
THREE.Color.prototype.setRGB = function(r,g,b){};

/**
@param {number} h
@param {number} s
@param {number} l
*/
THREE.Color.prototype.setHSL = function(h,s,l){};

/**
@param {string} style
*/
THREE.Color.prototype.setStyle = function(style){};

/**
@param {THREE.Color} c
*/
THREE.Color.prototype.copy = function(c){};

// ============================================================================
// THREE.Face3
// ============================================================================

/**
@constructor
@param {number} v1
@param {number} v2
@param {number} v3
@param {THREE.Vector3|Array.<THREE.Vector3>} n
@param {THREE.Color|Array.<THREE.Color>} c
*/
THREE.Face3 = function(v1,v2,v3,n,c){};

// ============================================================================
// THREE.Object3D (r56, incomplete)
// ============================================================================

/**
@constructor
@struct
*/
THREE.Object3D = function(){};

/** @type {string} */                   THREE.Object3D.prototype.name;
/** @type {Object} */                   THREE.Object3D.prototype.properties;
/** @type {?THREE.Object3D} */          THREE.Object3D.prototype.parent;
/** @type {Array.<THREE.Object3D>} */   THREE.Object3D.prototype.children;
/** @type {THREE.Vector3} */            THREE.Object3D.prototype.up;
/** @type {THREE.Vector3} */            THREE.Object3D.prototype.position;
/** @type {THREE.Vector3} */            THREE.Object3D.prototype.rotation;
/** @type {string} */                   THREE.Object3D.prototype.eulerOrder;
/** @type {THREE.Vector3} */            THREE.Object3D.prototype.scale;
/** @type {?number} */                  THREE.Object3D.prototype.renderDepth;
/** @type {Boolean} */                  THREE.Object3D.prototype.rotationAutoUpdate;
/** @type {THREE.Matrix4} */            THREE.Object3D.prototype.matrix;
/** @type {THREE.Matrix4} */            THREE.Object3D.prototype.matrixWorld;
/** @type {THREE.Matrix4} */            THREE.Object3D.prototype.matrixRotationWorld;
/** @type {Boolean} */                  THREE.Object3D.prototype.matrixAutoUpdate;
/** @type {Boolean} */                  THREE.Object3D.prototype.matrixWorldNeedsUpdate;
/** @type {THREE.Quaternion} */         THREE.Object3D.prototype.quaternion;
/** @type {Boolean} */                  THREE.Object3D.prototype.useQuaternion;
/** @type {Boolean} */                  THREE.Object3D.prototype.visible;
/** @type {Boolean} */                  THREE.Object3D.prototype.castShadow;
/** @type {Boolean} */                  THREE.Object3D.prototype.receiveShadow;
/** @type {Boolean} */                  THREE.Object3D.prototype.frustumCulled;

/**
@param {THREE.Matrix4} m
*/
THREE.Object3D.prototype.applyMatrix = function(m){};

/**
@param {THREE.Object3D} o
*/
THREE.Object3D.prototype.add = function(o){};

/**
@param {THREE.Object3D} o
*/
THREE.Object3D.prototype.remove = function(o){};

/**
Note: this function has side effects
@return {THREE.Object3D}
*/
THREE.Object3D.prototype.clone = function(){};

// ============================================================================
// THREE.Mesh
// ============================================================================

/**
@constructor
@param {THREE.Geometry} g
@param {THREE.Material|THREE.MeshFaceMaterial} m
*/
THREE.Mesh = function(g,m){};

// ============================================================================
// THREE.MorphAnimMesh
// ============================================================================

/**
@constructor
@extends THREE.Mesh
@param {THREE.Geometry} g
@param {THREE.Material|THREE.MeshFaceMaterial} m
*/
THREE.MorphAnimMesh = function(g,m){};

// ============================================================================
// THREE.SkinnedMesh
// ============================================================================

/**
@constructor
@extends THREE.Mesh
@param {THREE.Geometry} g
@param {THREE.Material|THREE.MeshFaceMaterial} m
*/
THREE.SkinnedMesh = function(g,m){};

// ============================================================================
// THREE.Geometry
// ============================================================================

/**
@constructor
@struct
*/
THREE.Geometry = function(){};

/** @type {string} */                           THREE.Geometry.prototype.name;
/** @type {Array.<THREE.Vector3>} */            THREE.Geometry.prototype.vertices;
/** @type {Array.<THREE.Color>} */              THREE.Geometry.prototype.colors;
/** @type {Array.<THREE.Vector3>} */            THREE.Geometry.prototype.normals;
/** @type {Array.<THREE.Face3>} */              THREE.Geometry.prototype.faces;
/** @type {Array.<Array.<THREE.Vector2>>} */    THREE.Geometry.prototype.faceUvs;
/** @type {Array.<Array.<THREE.Vector2>>} */    THREE.Geometry.prototype.faceVertexUvs;
/** @type {Array.<Object>} */                   THREE.Geometry.prototype.morphTargets;
/** @type {Array.<Object>} */                   THREE.Geometry.prototype.morphColors;
/** @type {Array.<Object>} */                   THREE.Geometry.prototype.morphNormals;
/** @type {Array.<THREE.Vector4>} */            THREE.Geometry.prototype.skinWeights;
/** @type {Array.<THREE.Vector4>} */            THREE.Geometry.prototype.skinIndices;
/** @type {Array.<number>} */                   THREE.Geometry.prototype.lineDistances;
/** @type {*} */                                THREE.Geometry.prototype.boundingBox;
/** @type {*} */                                THREE.Geometry.prototype.boundingSphere;
/** @type {Boolean} */                          THREE.Geometry.prototype.hasTangents;
/** @type {Boolean} */                          THREE.Geometry.prototype.dynamic;
/** @type {Boolean} */                          THREE.Geometry.prototype.verticesNeedUpdate;
/** @type {Boolean} */                          THREE.Geometry.prototype.elementsNeedUpdate;
/** @type {Boolean} */                          THREE.Geometry.prototype.uvsNeedUpdate;
/** @type {Boolean} */                          THREE.Geometry.prototype.normalsNeedUpdate;
/** @type {Boolean} */                          THREE.Geometry.prototype.tangentsNeedUpdate;
/** @type {Boolean} */                          THREE.Geometry.prototype.colorsNeedUpdate;
/** @type {Boolean} */                          THREE.Geometry.prototype.lineDistancesNeedUpdate;
/** @type {Boolean} */                          THREE.Geometry.prototype.buffersNeedUpdate;

/**
@param {THREE.Matrix4} m
*/
THREE.Geometry.prototype.applyMatrix = function(m){};

/** */
THREE.Geometry.prototype.computeCentroids = function(){};

/** */
THREE.Geometry.prototype.computeFaceNormals = function(){};

/**
@param {boolean} areaWeighted
*/
THREE.Geometry.prototype.computeVertexNormals = function(areaWeighted){};

/** */
THREE.Geometry.prototype.computeMorphNormals = function(){};

/** */
THREE.Geometry.prototype.computeTangents = function(){};

/** */
THREE.Geometry.prototype.computeLineDistances = function(){};

/** */
THREE.Geometry.prototype.computeBoundingBox = function(){};

/** */
THREE.Geometry.prototype.computeBoundingSphere = function(){};

/** */
THREE.Geometry.prototype.mergeVertices = function(){};

/**
@return {THREE.Geometry}
*/
THREE.Geometry.prototype.clone = function(){};

/** */
THREE.Geometry.prototype.dispose = function(){};

// ============================================================================
// THREE.Texture
// ============================================================================

/**
@constructor
@param {*} img
*/
THREE.Texture = function(img){};

/** @type {boolean} */
THREE.Texture.flipY;

// ============================================================================
// THREE.Material
// ============================================================================

/** @constructor */
THREE.Material = function(){};

/** @type {THREE.Texture?} */
THREE.Material.bumpMap;

/** @type {THREE.Texture?} */
THREE.Material.normalMap;

// ============================================================================
// THREE.MeshFaceMaterial
// ============================================================================

/**
@constructor
*/
THREE.MeshFaceMaterial = function(){};

// ============================================================================
// THREE.ShaderMaterial
// ============================================================================

/**
@constructor
@extends THREE.Material
@param {*=} p
*/
THREE.ShaderMaterial = function(p){};

// ============================================================================
// THREE.MeshBasicMaterial
// ============================================================================

/**
@constructor
@extends THREE.Material
@param {*=} p
*/
THREE.MeshBasicMaterial = function(p){};

// ============================================================================
// THREE.MeshPhongMaterial
// ============================================================================

/**
@constructor
@extends THREE.Material
@param {*=} p
*/
THREE.MeshPhongMaterial = function(p){};

// ============================================================================
// THREE.MeshLambertMaterial
// ============================================================================

/**
@constructor
@extends THREE.Material
@param {*=} p
*/
THREE.MeshLambertMaterial = function(p){};

// ============================================================================
// THREE.Light
// ============================================================================

/**
@constructor
@extends {THREE.Object3D}
@param {number} hex
*/
THREE.Light = function(hex){};

// ============================================================================
// THREE.AmbientLight
// ============================================================================

/**
@constructor
@extends {THREE.Light}
@param {number} hex
*/
THREE.AmbientLight = function(hex){};

// ============================================================================
// THREE.DirectionalLight
// ============================================================================

/**
@constructor
@extends {THREE.Light}
@param {number} hex
@param {?number=} intensity
*/
THREE.DirectionalLight = function(hex, intensity){};

// ============================================================================
// THREE.PointLight
// ============================================================================

/**
@constructor
@extends {THREE.Light}
@param {number} hex
@param {?number=} intensity
@param {?number=} distance
*/
THREE.PointLight = function(hex, intensity, distance){};

// ============================================================================
// THREE.SpotLight
// ============================================================================

/**
@constructor
@extends {THREE.Light}
@param {number} hex
@param {?number=} intensity
@param {?number=} distance
@param {?number=} angle
@param {?number=} exponent
*/
THREE.SpotLight = function(hex, intensity, distance, angle, exponent){};

// ============================================================================
// THREE.Camera
// ============================================================================

/**
@constructor
@extends {THREE.Object3D}
*/
THREE.Camera = function(){};

// ============================================================================
// THREE.OrthographicCamera
// ============================================================================

/**
@constructor
@extends {THREE.Camera}
@param {?number=} left
@param {?number=} right
@param {?number=} top
@param {?number=} bottom
@param {?number=} near
@param {?number=} far
*/
THREE.OrthographicCamera = function(left, right, top, bottom, near, far){};

// ============================================================================
// THREE.PerspectiveCamera
// ============================================================================

/**
@constructor
@extends {THREE.Camera}
@param {?number=} fov
@param {?number=} aspect
@param {?number=} near
@param {?number=} far
*/
THREE.PerspectiveCamera = function(fov, aspect, near, far){};

// ============================================================================
// Misc utils
// ============================================================================

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

// ============================================================================
// Misc constants
// ============================================================================

/** @const */
THREE.SmoothShading = function(){};

/** @const */
THREE.FlatShading = function(){};

/** @const */
THREE.RepeatWrapping = function(){};

/** @const */
THREE.DoubleSide = function(){};