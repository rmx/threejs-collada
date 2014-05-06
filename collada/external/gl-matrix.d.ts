// glMatrix 2.2.1
// -----------------------------------------------------------------------------

interface glMatrixStatic {
    setMatrixArrayType(type: any): void;
}

interface glMatrixNumberArray {
    length: number;
    [index: number]: number;
}

// mat2
// -----------------------------------------------------------------------------

interface Mat2 extends glMatrixNumberArray { }
interface Mat2Static {

}

// mat2d
// -----------------------------------------------------------------------------

interface Mat2d extends glMatrixNumberArray { }
interface Mat2dStatic {

}


// mat3
// -----------------------------------------------------------------------------

interface Mat3 extends glMatrixNumberArray { }
interface Mat3Static {
    adjoint(out: Mat3, a: Mat3): Mat3;
    clone(a: Mat3): Mat3;
    copy(out: Mat3, a: Mat3): Mat3;
    create(): Mat3;
    determinant(a: Mat3): number;
    fromMat2d(out: Mat3, a: Mat2d): Mat3;
    fromMat4(out: Mat3, a: Mat4): Mat3;
    fromQuat(out: Mat3, q: Quat): Mat3;
    identity(out: Mat3): Mat3;
    invert(out: Mat3, a: Mat3): Mat3;
    mul(out: Mat3, a: Mat3, b: Mat3): Mat3;
    multiply(out: Mat3, a: Mat3, b: Mat3): Mat3;
    normalFromMat4(out: Mat3, a: Mat4): Mat3;
    rotate(out: Mat3, a: Mat3, rad: number): Mat3;
    scale(out: Mat3, a: Mat3, v: Vec2): Mat3;
    str(mat: Mat3): string;
    translate(out: Mat3, a: Mat3, v: Vec2): Mat3;
    transpose(out: Mat3, a: Mat3): Mat3;
}

// mat4
// -----------------------------------------------------------------------------

interface Mat4 extends glMatrixNumberArray {}
interface Mat4Static {
    create(): Mat4;
    clone(a: Mat4): Mat4;
    adjoint(out: Mat4, a: Mat4): Mat4;
    copy(out: Mat4, a: Mat4): Mat4;
    determinant(a: Mat4): number;
    fromQuat(out: Mat4, q: Quat): Mat4;
    fromRotationTranslation(out: Mat4, q: Quat, v: Vec3): Mat4;
    frustum(out: Mat4, left: number, right: number, bottom: number, top: number, near: number, far: number): Mat4;
    identity(out: Mat4): Mat4;
    invert(out: Mat4, a: Mat4): Mat4;
    lookAt(out: Mat4, eye: Vec3, center: Vec3, up: Vec3): Mat4;
    mul(out: Mat4, a: Mat4, b: Mat4): Mat4;
    multiply(out: Mat4, a: Mat4, b: Mat4): Mat4;
    ortho(out: Mat4, left: number, right: number, bottom: number, top: number, near: number, far: number): Mat4;
    perspective(out: Mat4, fovy: number, aspect: number, near: number, far: number): Mat4;
    rotate(out: Mat4, a: Mat4, rad: number, axis: Vec3): Mat4;
    rotateX(out: Mat4, a: Mat4, rad: number): Mat4;
    rotateY(out: Mat4, a: Mat4, rad: number): Mat4;
    rotateZ(out: Mat4, a: Mat4, rad: number): Mat4;
    scale(out: Mat4, a: Mat4, v: Vec3): Mat4;
    str(mat: Mat4): string;
    translate(out: Mat4, a: Mat4, v: Vec3): Mat4;
    transpose(out: Mat4, a: Mat4): Mat4;
}



// quat
// -----------------------------------------------------------------------------

interface Quat extends Float32Array {}
interface QuatStatic {
    add(out: Quat, a: Quat, b: Quat): Quat;
    calculateW(out: Quat, a: Quat): Quat;
    clone(a: Quat): Quat;
    conjugate(out: Quat, a: Quat): Quat;
    copy(out: Quat, a: Quat): Quat;
    create(): Quat;
    dot(a: Quat, b: Quat): number;
    fromMat3(out: Quat, m: Mat3): Quat;
    fromValues(x: number, y: number, z: number, w: number): Quat;
    identity(out: Quat): Quat;
    invert(out: Quat, a: Quat): Quat;
    len(a: Quat): number;
    length(a: Quat): number;
    lerp(out: Quat, a: Quat, b: Quat, t: number): Quat;
    mul(out: Quat, a: Quat, b: Quat): Quat;
    multiply(out: Quat, a: Quat, b: Quat): Quat;
    normalize(out: Quat, a: Quat): Quat;
    rotateX(out: Quat, a: Quat, rad: number): Quat;
    rotateY(out: Quat, a: Quat, rad: number): Quat;
    rotateZ(out: Quat, a: Quat, rad: number): Quat;
    scale(out: Quat, a: Quat, b: number): Quat;
    set(out: Quat, x: number, y: number, z: number, w: number): Quat;
    setAxisAngle(out: Quat, axis: Vec3, rad: number): Quat;
    slerp(out: Quat, a: Quat, b: Quat, t: number): Quat;
    sqrLen(a: Quat): number;
    squaredLength(a: Quat): number;
    str(a: Quat): string;
}



// vec2
// -----------------------------------------------------------------------------

interface Vec2 extends Float32Array {}
interface Vec2Static {
    add(out: Vec2, a: Vec2, b: Vec2): Vec2;
    clone(a: Vec2): Vec2;
    copy(out: Vec2, a: Vec2): Vec2;
    create(): Vec2;
    cross(out: Vec3, a: Vec2, b: Vec2): Vec2;
    dist(a: Vec2, b: Vec2): number;
    distance(a: Vec2, b: Vec2): number;
    div(out: Vec2, a: Vec2, b: Vec2): Vec2;
    divide(out: Vec2, a: Vec2, b: Vec2): Vec2;
    dot(a: Vec2, b: Vec2): number;
    forEach<T>(a: glMatrixNumberArray, stride: number, offset: number, count: number, fn: (out: Vec2, a: Vec2, arg: T) => void, arg: T): glMatrixNumberArray;
    fromValues(x: number, y: number): Vec2;
    len(a: Vec2): number;
    length(a: Vec2): number;
    lerp(out: Vec2, a: Vec2, b: Vec2, t: number): Vec2;
    max(out: Vec2, a: Vec2, b: Vec2): Vec2;
    min(out: Vec2, a: Vec2, b: Vec2): Vec2;
    mul(): Vec2;
    multiply(out: Vec2, a: Vec2, b: Vec2): Vec2;
    negate(out: Vec2, a: Vec2): Vec2;
    normalize(out: Vec2, a: Vec2): Vec2;
    random(out: Vec2, scale: number): Vec2;
    scale(out: Vec2, a: Vec2, b: number): Vec2;
    scaleAndAdd(out: Vec2, a: Vec2, b: Vec2, scale: number): Vec2;
    set(out: Vec2, x: number, y: number): Vec2;
    sqrDist(a: Vec2, b: Vec2): number;
    sqrLen(a: Vec2): number;
    squaredDistance(a: Vec2, b: Vec2): number;
    squaredLength(a: Vec2): number;
    str(a: Vec2): string;
    sub(out: Vec2, a: Vec2, b: Vec2): Vec2;
    subtract(out: Vec2, a: Vec2, b: Vec2): Vec2;
    transformMat2(out: Vec2, a: Vec2, m: Mat2): Vec2;
    transformMat2d(out: Vec2, a: Vec2, m: Mat2d): Vec2;
    transformMat3(out: Vec2, a: Vec2, m: Mat3): Vec2;
    transformMat4(out: Vec2, a: Vec2, m: Mat4): Vec2;
}



// vec3
// -----------------------------------------------------------------------------

interface Vec3 extends Float32Array {}
interface Vec3Static {
    add(out: Vec3, a: Vec3, b: Vec3): Vec3;
    clone(a: Vec3): Vec3;
    copy(out: Vec3, a: Vec3): Vec3;
    create(): Vec3;
    cross(out: Vec3, a: Vec3, b: Vec3): Vec3;
    dist(a: Vec3, b: Vec3): number;
    distance(a: Vec3, b: Vec3): number;
    div(out: Vec3, a: Vec3, b: Vec3): Vec3;
    divide(out: Vec3, a: Vec3, b: Vec3): Vec3;
    dot(a: Vec3, b: Vec3): number;
    forEach<T>(a: glMatrixNumberArray, stride: number, offset: number, count: number, fn: (out: Vec3, a: Vec3, arg: T) => void, arg: T): glMatrixNumberArray;
    fromValues(x: number, y: number, z: number): Vec3;
    len(a: Vec3): number;
    length(a: Vec3): number;
    lerp(out: Vec3, a: Vec3, b: Vec3, t: number): Vec3;
    max(out: Vec3, a: Vec3, b: Vec3): Vec3;
    min(out: Vec3, a: Vec3, b: Vec3): Vec3;
    mul(out: Vec3, a: Vec3, b: Vec3): Vec3;
    multiply(out: Vec3, a: Vec3, b: Vec3): Vec3;
    negate(out: Vec3, a: Vec3): Vec3;
    normalize(out: Vec3, a: Vec3): Vec3;
    random(out: Vec3, scale: number): Vec3;
    scale(out: Vec3, a: Vec3, b: number): Vec3;
    scaleAndAdd(out: Vec3, a: Vec3, b: Vec3, scale: number): Vec3;
    set(out: Vec3, x: number, y: number, z: number): Vec3;
    sqrDist(a: Vec3, b: Vec3): number;
    sqrLen(a: Vec3): number;
    squaredDistance(a: Vec3, b: Vec3): number;
    squaredLength(a: Vec3): number;
    str(a: Vec3): string;
    sub(out: Vec3, a: Vec3, b: Vec3): Vec3;
    subtract(out: Vec3, a: Vec3, b: Vec3): Vec3;
    transformMat3(out: Vec3, a: Vec3, m: Mat3): Vec3;
    transformMat4(out: Vec3, a: Vec3, m: Mat4): Vec3;
    transformQuat(out: Vec3, a: Vec3, q: Quat): Vec3;
}



// vec4
// -----------------------------------------------------------------------------

interface Vec4 extends Float32Array {}
interface Vec4Static {
    add(out: Vec4, a: Vec4, b: Vec4): Vec4;
    clone(a: Vec4): Vec4;
    copy(out: Vec4, a: Vec4): Vec4;
    create(): Vec4;
    dist(a: Vec4, b: Vec4): number;
    distance(a: Vec4, b: Vec4): number;
    div(out: Vec4, a: Vec4, b: Vec4): Vec4;
    divide(out: Vec4, a: Vec4, b: Vec4): Vec4;
    dot(a: Vec4, b: Vec4): number;
    forEach<T>(a: glMatrixNumberArray, stride: number, offset: number, count: number, fn: (out: Vec4, a: Vec4, arg: T) => void, arg: T): glMatrixNumberArray;
    fromValues(x: number, y: number, z: number, w: number): Vec4;
    len(a: Vec4): number;
    length(a: Vec4): number;
    lerp(out: Vec4, a: Vec4, b: Vec4, t: number): Vec4;
    max(out: Vec4, a: Vec4, b: Vec4): Vec4;
    min(out: Vec4, a: Vec4, b: Vec4): Vec4;
    mul(out: Vec4, a: Vec4, b: Vec4): Vec4;
    multiply(out: Vec4, a: Vec4, b: Vec4): Vec4;
    negate(out: Vec4, a: Vec4): Vec4;
    normalize(out: Vec4, a: Vec4): Vec4;
    random(out: Vec4, scale: number): Vec4;
    scale(out: Vec4, a: Vec4, b: number): Vec4;
    scaleAndAdd(out: Vec4, a: Vec4, b: Vec4, scale: number): Vec4;
    set(out: Vec4, x: number, y: number, z: number, w: number): Vec4;
    sqrDist(): number;
    sqrLen(): number;
    squaredDistance(a: Vec4, b: Vec4): number;
    squaredLength(a: Vec4): number;
    str(a: Vec4): string;
    sub(out: Vec4, a: Vec4, b: Vec4): Vec4;
    subtract(out: Vec4, a: Vec4, b: Vec4): Vec4;
    transformMat4(out: Vec4, a: Vec4, m: Mat4): Vec4;
    transformQuat(out: Vec4, a: Vec4, q: Quat): Vec4;
}
