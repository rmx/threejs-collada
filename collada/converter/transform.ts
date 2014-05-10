
enum ColladaConverterTransformType {
    Translation,
    Rotation,  
    Scale
};

class ColladaConverterTransform {
    data: Float32Array;
    original_data: Float32Array;
    rows: number;
    colums: number;
    channels: ColladaConverterAnimationChannel[];

    constructor(transform: ColladaNodeTransform, rows: number, columns: number) {
        this.rows = rows;
        this.colums = columns;
        this.channels = [];
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
    registerAnimation(channel: ColladaConverterAnimationChannel): void {
        this.channels.push(channel);
    }
    isAnimated(): boolean {
        return this.channels.length > 0;
    }
    isAnimatedBy(animation: ColladaConverterAnimation): boolean {
        if (animation !== null) {
            for (var i: number = 0; i < this.channels.length; ++i) {
                var channel: ColladaConverterAnimationChannel = this.channels[i];
                if (animation.channels.indexOf(channel) !== -1) {
                    return true;
                }
            }
            return false;
        } else {
            return this.channels.length > 0;
        }
    }
    resetAnimation() {
        for (var i = 0; i < this.data.length; ++i) {
            this.data[i] = this.original_data[i];
        }
        this.updateFromData();
    }
    applyTransformation(mat: Mat4) {
        throw new Error("Not implemented");
    }
    updateFromData() {
        throw new Error("Not implemented");
    }
    hasTransformType(type: ColladaConverterTransformType): boolean {
        throw new Error("Not implemented");
    }
}

class ColladaConverterTransformMatrix extends ColladaConverterTransform implements ColladaConverterAnimationTarget {
    matrix: Mat4;
    constructor(transform: ColladaNodeTransform) {
        super(transform, 4, 4);
        this.matrix = mat4.create();
        this.updateFromData();
    }
    updateFromData() {
        ColladaMath.mat4Extract(this.data, 0, this.matrix);
    }
    applyTransformation(mat: Mat4) {
        mat4.multiply(mat, mat, this.matrix);
    }
    hasTransformType(type: ColladaConverterTransformType): boolean {
        return true;
    }
}

class ColladaConverterTransformRotate extends ColladaConverterTransform implements ColladaConverterAnimationTarget {
    /** Source data: axis */
    axis: Vec3;
    /** Source data: angle */
    angle: number;
    constructor(transform: ColladaNodeTransform) {
        super(transform, 4, 1);
        this.axis = vec3.create();
        this.angle = 0;
        this.updateFromData();
    }
    updateFromData() {
        vec3.set(this.axis, this.data[0], this.data[1], this.data[2]);
        this.angle = this.data[3];
    }
    applyTransformation(mat: Mat4) {
        mat4.rotate(mat, mat, this.angle, this.axis);
    }
    hasTransformType(type: ColladaConverterTransformType): boolean {
        return (type === ColladaConverterTransformType.Rotation);
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
    applyTransformation(mat: Mat4) {
        mat4.translate(mat, mat, this.pos);
    }
    hasTransformType(type: ColladaConverterTransformType): boolean {
        return (type === ColladaConverterTransformType.Translation);
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
    applyTransformation(mat: Mat4) {
        mat4.scale(mat, mat, this.scl);
    }
    hasTransformType(type: ColladaConverterTransformType): boolean {
        return (type === ColladaConverterTransformType.Scale);
    }
}
