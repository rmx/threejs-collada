

class ColladaNodeTransform extends ColladaElement {
    type: string;
    data: Float32Array;
    _tempVec3: Vec3;

    constructor() {
        super();
        this.type = null;
        this.data = null;
        this._tempVec3 = vec3.create();
    }

    getTransformMatrix(result: Mat4, context: ColladaProcessingContext){
        mat4.identity(result);

        if (this.data == null) {
            context.log.write("Transform data not defined, using identity transform", LogLevel.Warning);
            return;
        }
        switch (this.type) {
            case "matrix":
                ColladaMath.mat4Extract(this.data, 0, result);
                break;
            case "rotate":
                ColladaMath.vec3Extract(this.data, 0, this._tempVec3);
                mat4.rotate(result, result, this.data[3] * ColladaMath.TO_RADIANS, this._tempVec3);
                break;
            case "translate":
                ColladaMath.vec3Extract(this.data, 0, this._tempVec3);
                mat4.translate(result, result, this._tempVec3);
                break;
            case "scale":
                ColladaMath.vec3Extract(this.data, 0, this._tempVec3);
                mat4.scale(result, result, this._tempVec3);
                break;
            default:
                context.log.write("Transform type '" + this.type + "' not implemented, using identity transform", LogLevel.Warning);
        }
    }

    getTransform(pos: Vec3, rot: Quat, scl: Vec3, context: ColladaProcessingContext) {
        vec3.set(pos, 0, 0, 0);
        quat.identity(rot);
        vec3.set(scl, 1, 1, 1);

        if (this.data == null) {
            context.log.write("Transform data not defined, using identity transform", LogLevel.Warning);
            return;
        }

        var tempMat: Mat4;
        var tempVec: Vec3;
        switch (this.type) {
            case "matrix":
                tempMat = mat4.create();
                ColladaMath.mat4Extract(this.data, 0, tempMat);
                ColladaMath.decompose(tempMat, pos, rot, scl);
                break;
            case "rotate":
                tempVec = vec3.create();
                ColladaMath.vec3Extract(this.data, 0, tempVec);
                quat.setAxisAngle(rot, tempVec, this.data[3] * ColladaMath.TO_RADIANS);                break;
            case "translate":
                ColladaMath.vec3Extract(this.data, 0, pos);
                break;
            case "scale":
                ColladaMath.vec3Extract(this.data, 0, scl);
                break;
            default:
                context.log.write("Transform type '" + this.type + "' not implemented, using identity transform", LogLevel.Warning);
        }
    }

    /**
    *   Parses a transformation element.
    */
    static parse(node: Node, parent: ColladaVisualSceneNode, context: ColladaParsingContext): ColladaNodeTransform {
        var result: ColladaNodeTransform = new ColladaNodeTransform();

        result.sid = context.getAttributeAsString(node, "sid", null, false);
        result.type = node.nodeName;

        context.registerSidTarget(result, parent);
        result.data = context.strToFloats(node.textContent);

        var expectedDataLength: number = 0;
        switch (result.type) {
            case "matrix":
                expectedDataLength = 16;
                break;
            case "rotate":
                expectedDataLength = 4;
                break;
            case "translate":
                expectedDataLength = 3;
                break;
            case "scale":
                expectedDataLength = 3;
                break;
            case "skew":
                expectedDataLength = 7;
                break;
            case "lookat":
                expectedDataLength = 9;
                break;
            default:
                context.log.write("Unknown transformation type " + result.type + ".", LogLevel.Error);
        }

        if (result.data.length !== expectedDataLength) {
            context.log.write("Wrong number of elements for transformation type '" + result.type + "': expected " +
                expectedDataLength + ", found " + result.data.length, LogLevel.Error);
        }

        return result;
    }
}