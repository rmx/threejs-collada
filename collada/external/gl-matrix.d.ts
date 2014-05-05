// glMatrix 2.2.1
// -----------------------------------------------------------------------------

interface glMatrixStatic {
    setMatrixArrayType(type: any): void;
}

interface glMatrixNumberArray {
    length: number;
    [index: number]: number;
}


// mat3
// -----------------------------------------------------------------------------

interface Mat3 extends glMatrixNumberArray { }
interface Mat3Static {
    adjoint(out, a)
    clone(a)
    copy(out, a)
    create(): Mat3;
    determinant(a)
    fromMat2d(out, a)
    fromMat4(out, a)
    fromQuat(out, q)
    identity(out)
    invert(out, a)
    mul()
    multiply(out, a, b)
    normalFromMat4(out: Mat3, a: Mat4): Mat3;
    rotate(out, a, rad)
    scale(out, a, v)
    str(mat)
    translate(out, a, v)
    transpose(out, a)
}

// mat4
// -----------------------------------------------------------------------------

interface Mat4 extends glMatrixNumberArray {}
interface Mat4Static {
    create(): Mat4;
    clone(a: Mat4): Mat4;
    adjoint(out, a)
    copy(out: Mat4, a: Mat4)
    determinant(a)
    fromQuat(out, q)
    fromRotationTranslation(out: Mat4, q: Quat, v: Vec3): Mat4;
    frustum(out, left, right, bottom, top, near, far)
    identity(out: Mat4): Mat4;
    invert(out, a)
    lookAt(out, eye, center, up)
    mul()
    multiply(out, a, b)
    ortho(out, left, right, bottom, top, near, far)
    perspective(out, fovy, aspect, near, far)
    rotate(out: Mat4, a: Mat4, rad: number, axis: Vec3): Mat4;
    rotateX(out, a, rad)
    rotateY(out, a, rad)
    rotateZ(out, a, rad)
    scale(out: Mat4, a: Mat4, v: Vec3): Mat4;
    str(mat)
    translate(out: Mat4, a: Mat4, v: Vec3): Mat4;
    transpose(out: Mat4, a: Mat4): Mat4;
}



// quat
// -----------------------------------------------------------------------------

interface Quat extends Float32Array {}
interface QuatStatic {
    add(out, a, b)
    calculateW(out, a)
    clone(a)
    conjugate(out, a)
    copy(out, a)
    create(): Quat;
    dot(a, b)
    fromMat3(out: Quat, m: Mat3): Quat;
    fromValues(x, y, z, w)
    identity(out)
    invert(out, a)
    len()
    length(a)
    lerp(out, a, b, t)
    mul()
    multiply(out, a, b)
    normalize(out, a)
    rotateX(out, a, rad)
    rotateY(out, a, rad)
    rotateZ(out, a, rad)
    scale(out, a, b)
    set(out, x, y, z, w)
    setAxisAngle(out, axis, rad)
    slerp(out, a, b, t)
    sqrLen()
    squaredLength(a)
    str(vec)
}



// vec2
// -----------------------------------------------------------------------------

interface Vec2 extends Float32Array {}
interface Vec2Static {
    add(out, a, b)
    clone(a)
    copy(out, a)
    create()
    cross(out, a, b)
    dist(a, b)
    distance(a, b)
    div()
    divide(out, a, b)
    dot(a, b)
    forEach(a, stride, offset, count, fn, arg)
    fromValues(x, y)
    len()
    length(a)
    lerp(out, a, b, t)
    max(out, a, b)
    min(out, a, b)
    mul()
    multiply(out, a, b)
    negate(out, a)
    normalize(out, a)
    random(out, scale)
    scale(out, a, b)
    scaleAndAdd(out, a, b, scale)
    set(out, x, y)
    sqrDist()
    sqrLen()
    squaredDistance(a, b)
    squaredLength(a)
    str(vec)
    sub(out, a, b)
    subtract(out, a, b)
    transformMat2(out, a, m)
    transformMat2d(out, a, m)
    transformMat3(out, a, m)
    transformMat4(out, a, m)
}



// vec3
// -----------------------------------------------------------------------------

interface Vec3 extends Float32Array {}
interface Vec3Static {
    add(out: Vec3, a, b): Vec3;
    clone(a)
    copy(out, a)
    create(): Vec3;
    cross(out, a, b)
    dist(a: Vec3, b: Vec3): number;
    distance(a: Vec3, b: Vec3): number;
    div()
    divide(out, a, b)
    dot(a, b)
    forEach(a, stride, offset, count, fn, arg)
    fromValues(x, y, z)
    len(a: Vec3): number;
    length(a: Vec3): number;
    lerp(out, a, b, t)
    max(out, a, b)
    min(out, a, b)
    mul(out: Vec3, a: Vec3, b: Vec3): Vec3;
    multiply(out: Vec3, a: Vec3, b: Vec3): Vec3;
    negate(out, a)
    normalize(out: Vec3, a: Vec3): Vec3;
    random(out, scale)
    scale(out: Vec3, a: Vec3, b: number): Vec3;
    scaleAndAdd(out, a, b, scale)
    set(out, x, y, z)
    sqrDist()
    sqrLen()
    squaredDistance(a, b)
    squaredLength(a)
    str(vec)
    sub(out: Vec3, a: Vec3, b: Vec3): Vec3;
    subtract(out: Vec3, a: Vec3, b: Vec3): Vec3;
    transformMat3(out, a, m)
    transformMat4(out, a, m)
    transformQuat(out: Vec3, a: Vec3, q: Quat): Vec3;
}



// vec4
// -----------------------------------------------------------------------------

interface Vec4 extends Float32Array {}
interface Vec4Static {
    add(out, a, b)
    clone(a)
    copy(out, a)
    create()
    dist(a, b)
    distance(a, b)
    div()
    divide(out, a, b)
    dot(a, b)
    forEach(a, stride, offset, count, fn, arg)
    fromValues(x, y, z, w)
    len()
    length(a)
    lerp(out, a, b, t)
    max(out, a, b)
    min(out, a, b)
    mul()
    multiply(out, a, b)
    negate(out, a)
    normalize(out, a)
    random(out, scale)
    scale(out, a, b)
    scaleAndAdd(out, a, b, scale)
    set(out, x, y, z, w)
    sqrDist()
    sqrLen()
    squaredDistance(a, b)
    squaredLength(a)
    str(vec)
    sub(out, a, b)
    subtract(out, a, b)
    transformMat4(out, a, m)
    transformQuat(out, a, q)
}
