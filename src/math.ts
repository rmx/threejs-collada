
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

    static round(num: number, decimals: number): number {
        if (decimals !== null) {
            // Nice, but does not work for scientific notation numbers
            // return +(Math.round(+(num + "e+" + decimals)) + "e-" + decimals);
            return Math.round(num * Math.pow(10, decimals)) / Math.pow(10, decimals);
        } else {
            return num;
        }
    }

    static copyNumberArray(src: NumberArray, dest: NumberArray, count:number) {
        for (var i: number = 0; i < count; ++i) {
            dest[i] = src[i];
        }
    }

    /**
    * Calls the given function for each src[i*stride + offset]
    */
    static forEachElement(src: NumberArray, stride: number, offset: number, fn: (x: number) => void) {
        var count = src.length / stride;
        for (var i: number = 0; i < count; ++i) {
            fn(src[i * stride + offset]);
        }
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
        // webgl matrices are column major
        mat4.transpose(dest, dest);
    }

    static decompose(mat: Mat4, pos: Vec3, rot: Quat, scl: Vec3) {
        var tempMat3: Mat3 = mat3.create();

        // Translation
        vec3.set(pos, mat[12], mat[13], mat[14]);

        // Rotation
        mat3.normalFromMat4(tempMat3, mat);
        quat.fromMat3(rot, tempMat3);
        quat.normalize(rot, rot);
        rot[3] = -rot[3]; // Because glmatrix matrix-to-quaternion somehow gives the inverse rotation
        // mat3.fromQuat(tempMat3, rot); // For checking the precision of the conversion

        // Scale
        scl[0] = vec3.length(vec3.fromValues(mat[0], mat[1], mat[2]));
        scl[1] = vec3.length(vec3.fromValues(mat[4], mat[5], mat[6]));
        scl[2] = vec3.length(vec3.fromValues(mat[8], mat[9], mat[10]));
    }


    static bezier(p0: number, c0: number, c1: number, p1: number, s: number): number {
        if (s < 0 || s > 1) throw new Error("Invalid Bezier parameter: " + s);
        return p0 * (1 - s) * (1 - s) * (1 - s) + 3 * c0 * s * (1 - s) * (1 - s) + 3 * c1 * s * s * (1 - s) + p1 * s * s * s;
    }

    static hermite(p0: number, t0: number, t1: number, p1: number, s: number): number {
        if (s < 0 || s > 1) throw new Error("Invalid Hermite parameter: " + s);
        var s2: number = s * s;
        var s3: number = s2 * s;
        return p0 * (2 * s3 - 3 * s2 + 1) + t0 * (s3 - 2 * s2 + s) + p1 * (-2 * s3 + 3 * s2) + t1 * (s3 - s2);
    }

    /**
    * Given a monotonously increasing function fn and a value target_y, finds a value x with 0<=x<=1 such that fn(x)=target_y
    */
    static bisect(target_y: number, fn: (x: number) => number, tol_y: number, max_iterations: number): number {
        var x0: number = 0;
        var x1: number = 1;
        var y0: number = fn(x0);
        var y1: number = fn(x1);
        if (target_y <= y0) return x0;
        if (target_y >= y1) return x1;

        var x: number = 0.5 * (x0 + x1);
        var y: number = fn(x);

        var iteration: number = 0;
        while (Math.abs(y - target_y) > tol_y) {

            // Update bounds
            if (y < target_y) {
                x0 = x;
            } else if (y > target_y) {
                x1 = x;
            } else {
                return x;
            }

            // Update values
            x = 0.5 * (x0 + x1);
            y = fn(x);

            // Check iteration count
            ++iteration;
            if (iteration > max_iterations) {
                throw new Error("Too many iterations");
            }
        }
        return x;
    }
};