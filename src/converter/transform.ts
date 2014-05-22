/// <reference path="../math.ts" />
/// <reference path="animation_channel.ts" />
/// <reference path="animation.ts" />

module COLLADA.Converter {

    export enum TransformType {
        Translation = 1,
        Rotation = 2,
        Scale = 3
    };

    export class Transform {
        data: Float32Array;
        original_data: Float32Array;
        rows: number;
        colums: number;
        channels: COLLADA.Converter.AnimationChannel[];

        constructor(transform: COLLADA.Loader.NodeTransform, rows: number, columns: number) {
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
        applyAnimation(channel: COLLADA.Converter.AnimationChannel, time: number, context: COLLADA.Converter.Context) {
            COLLADA.Converter.AnimationChannel.applyToData(channel, this.data, time, context);
            this.updateFromData();
        }
        registerAnimation(channel: COLLADA.Converter.AnimationChannel): void {
            this.channels.push(channel);
        }
        isAnimated(): boolean {
            return this.channels.length > 0;
        }
        isAnimatedBy(animation: COLLADA.Converter.Animation): boolean {
            if (animation !== null) {
                for (var i: number = 0; i < this.channels.length; ++i) {
                    var channel: COLLADA.Converter.AnimationChannel = this.channels[i];
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
        hasTransformType(type: COLLADA.Converter.TransformType): boolean {
            throw new Error("Not implemented");
        }
    }

    export class TransformMatrix extends Transform implements COLLADA.Converter.AnimationTarget {
        matrix: Mat4;
        constructor(transform: COLLADA.Loader.NodeTransform) {
            super(transform, 4, 4);
            this.matrix = mat4.create();
            this.updateFromData();
        }
        updateFromData() {
            COLLADA.MathUtils.mat4Extract(this.data, 0, this.matrix);
        }
        applyTransformation(mat: Mat4) {
            mat4.multiply(mat, mat, this.matrix);
        }
        hasTransformType(type: COLLADA.Converter.TransformType): boolean {
            return true;
        }
    }

    export class TransformRotate extends Transform implements COLLADA.Converter.AnimationTarget {
        /** Source data: axis */
        axis: Vec3;
        /** Source data: angle */
        radians: number;
        constructor(transform: COLLADA.Loader.NodeTransform) {
            super(transform, 4, 1);
            this.axis = vec3.create();
            this.radians = 0;
            this.updateFromData();
        }
        updateFromData() {
            vec3.set(this.axis, this.data[0], this.data[1], this.data[2]);
            this.radians = this.data[3] / 180 * Math.PI;
        }
        applyTransformation(mat: Mat4) {
            mat4.rotate(mat, mat, this.radians, this.axis);
        }
        hasTransformType(type: COLLADA.Converter.TransformType): boolean {
            return (type === COLLADA.Converter.TransformType.Rotation);
        }
    }

    export class TransformTranslate extends Transform implements COLLADA.Converter.AnimationTarget {
        /** Source data: translation */
        pos: Vec3;
        constructor(transform: COLLADA.Loader.NodeTransform) {
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
        hasTransformType(type: COLLADA.Converter.TransformType): boolean {
            return (type === COLLADA.Converter.TransformType.Translation);
        }
    }

    export class TransformScale extends Transform implements COLLADA.Converter.AnimationTarget {
        /** Source data: scaling */
        scl: Vec3;
        constructor(transform: COLLADA.Loader.NodeTransform) {
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
        hasTransformType(type: COLLADA.Converter.TransformType): boolean {
            return (type === COLLADA.Converter.TransformType.Scale);
        }
    }
}