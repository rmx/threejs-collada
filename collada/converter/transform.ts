class ColladaConverterTransform {
    data: Float32Array;
    original_data: Float32Array;
    rows: number;
    colums: number;
    constructor(transform: ColladaNodeTransform, rows: number, columns: number) {
        this.rows = rows;
        this.colums = columns;
        var data_elements: number = rows * columns;
        this.data = new Float32Array(data_elements);
        this.original_data = new Float32Array(data_elements);
        for (var i = 0; i < data_elements; ++i) {
            this.data[i] = transform.data[i];
            this.original_data[i] = transform.data[i];
        }
    }
    getTargetDataRows(): number {
        return this.rows;
    }
    getTargetDataColumns(): number {
        return this.colums;
    }
    applyAnimation(channel: ColladaConverterAnimationChannel, time: number, context: ColladaConverterContext) {
        ColladaConverterAnimationChannel.applyToData(channel, this.data, time, context);
        this.updateFromData();
    }
    resetAnimation() {
        for (var i = 0; i < this.data.length; ++i) {
            this.data[i] = this.original_data[i];
        }
        this.updateFromData();
    }
    applyTransform(pos: Vec3, rot: Quat, scl: Vec3) {
        throw new Error("Not implemented");
    }
    updateFromData() {
        throw new Error("Not implemented");
    }
}

class ColladaConverterTransformMatrix extends ColladaConverterTransform implements ColladaConverterAnimationTarget {
    /** Source data: matrix */
    matrix: Mat4;
    /** Derived data: translation */
    pos: Vec3;
    /** Derived data: rotation */
    rot: Quat;
    /** Derived data: scaling */
    scl: Vec3;
    constructor(transform: ColladaNodeTransform) {
        super(transform, 4, 4);
        this.matrix = mat4.create();
        this.pos = vec3.create();
        this.rot = quat.create();
        this.scl = vec3.create();
        this.updateFromData();
    }
    updateFromData() {
        ColladaMath.mat4Extract(this.data, 0, this.matrix);
        ColladaMath.decompose(this.matrix, this.pos, this.rot, this.scl);
    }
    applyTransform(pos: Vec3, rot: Quat, scl: Vec3) {

        // Apply scale
        vec3.multiply(scl, scl, this.scl);
        vec3.multiply(pos, pos, this.scl);

        // Apply rotation
        quat.multiply(rot, rot, this.rot);
        vec3.transformQuat(pos, pos, this.rot);

        // Apply translation     
        vec3.add(pos, pos, this.pos);
    }
}

class ColladaConverterTransformRotate extends ColladaConverterTransform implements ColladaConverterAnimationTarget {
    /** Source data: axis */
    axis: Vec3;
    /** Source data: angle */
    angle: number;
    /** Derived data: rotation */
    rot: Quat;
    constructor(transform: ColladaNodeTransform) {
        super(transform, 4, 1);
        this.rot = quat.create();
        this.axis = vec3.create();
        this.angle = 0;
        this.updateFromData();
    }
    updateFromData() {
        vec3.set(this.axis, this.data[0], this.data[1], this.data[2]);
        this.angle = this.data[3];
        quat.setAxisAngle(this.rot, this.axis, this.angle);
    }
    applyTransform(pos: Vec3, rot: Quat, scl: Vec3) {
        // Apply rotation
        quat.multiply(rot, rot, this.rot);
        vec3.transformQuat(pos, pos, this.rot);
    }
}

class ColladaConverterTransformTranslate extends ColladaConverterTransform implements ColladaConverterAnimationTarget {
    /** Source data: translation */
    pos: Vec3;
    constructor(transform: ColladaNodeTransform) {
        super(transform, 3, 1);
        this.pos = vec3.create();
        this.updateFromData();
    }
    updateFromData() {
        vec3.set(this.pos, this.data[0], this.data[1], this.data[2]);
    }
    applyTransform(pos: Vec3, rot: Quat, scl: Vec3) {

        // Apply translation     
        vec3.add(pos, pos, this.pos);
    }
}

class ColladaConverterTransformScale extends ColladaConverterTransform implements ColladaConverterAnimationTarget {
    /** Source data: scaling */
    scl: Vec3;
    constructor(transform: ColladaNodeTransform) {
        super(transform, 3, 1);
        this.scl = vec3.create();
        this.updateFromData();
    }
    updateFromData() {
        vec3.set(this.scl, this.data[0], this.data[1], this.data[2]);
    }
    applyTransform(pos: Vec3, rot: Quat, scl: Vec3) {

        // Apply translation     
        vec3.multiply(pos, pos, this.scl);
    }
}
