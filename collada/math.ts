/// <reference path="external/gl-matrix.d.ts" />

declare var glMatrix: glMatrixStatic;
declare var mat3: Mat3Static;
declare var mat4: Mat4Static;
declare var vec2: Vec2Static;
declare var vec3: Vec3Static;
declare var vec4: Vec4Static;
declare var quat: QuatStatic;

interface NumberArray {
    length: number;
    [index: number]: number;
}

class ColladaMath {
    contructor() {
    }

    static TO_RADIANS: number = Math.PI / 180.0;

    /**
    * Extracts a 3D vector from an array of vectors (stored as an array of numbers)
    */
    static vec3Extract(src: NumberArray, srcOff: number, dest: Vec3) {
        dest[0] = src[srcOff * 3 + 0];
        dest[1] = src[srcOff * 3 + 1];
        dest[2] = src[srcOff * 3 + 2];
    }

    static vec3copy(src: NumberArray, srcOff: number, dest: NumberArray, destOff) {
        dest[3 * destOff + 0] = src[3 * srcOff + 0];
        dest[3 * destOff + 1] = src[3 * srcOff + 1];
        dest[3 * destOff + 2] = src[3 * srcOff + 2];
    }

    /**
    * Extracts a 4D matrix from an array of matrices (stored as an array of numbers)
    */
    static mat4Extract(src: NumberArray, srcOff: number, dest: Mat4) {
        for (var i: number = 0; i < 16; ++i) {
                dest[i] = src[srcOff * 16 + i];
        }
        // Collada matrices are row major
        // glMatrix matrices are column major
        mat4.transpose(dest, dest);
    }

    /**
    * Converts a glMatrix matrix to a plain array
    */
    static mat4ToJSON(a: Mat4): number[]{
        return [
            a[ 0], a[ 1], a[ 2], a[ 3],
            a[ 4], a[ 5], a[ 6], a[ 7],
            a[ 8], a[ 9], a[10], a[11],
            a[12], a[13], a[14], a[15]
            ];
    }

    static decompose(mat: Mat4, pos: Vec3, rot: Quat, scl: Vec3) {
        var tempMat3: Mat3 = mat3.create();

        // Translation
        vec3.fromValues(mat[12], mat[13], mat[14]);

        // Rotation
        mat3.normalFromMat4(tempMat3, mat);
        quat.fromMat3(rot, tempMat3);

        // Scale
        scl[0] = vec3.length(vec3.fromValues(mat[0], mat[1], mat[2]));
        scl[1] = vec3.length(vec3.fromValues(mat[4], mat[5], mat[6]));
        scl[2] = vec3.length(vec3.fromValues(mat[8], mat[9], mat[10]));
    }
};