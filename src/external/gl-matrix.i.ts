/// <reference path="gl-matrix.d.ts" />

// Assume that we load gl-matrix before
// This will introduce the following symbols in global space:
declare var glMatrix: glMatrixStatic;
declare var mat3: Mat3Static;
declare var mat4: Mat4Static;
declare var vec2: Vec2Static;
declare var vec3: Vec3Static;
declare var vec4: Vec4Static;
declare var quat: QuatStatic;