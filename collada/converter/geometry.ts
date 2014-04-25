
interface ColladaConverterJSONGeometry {
    indices: number;
    vertices: number;
    offsets: {
        position: number;
        normal: number;
        texcoord: number;
        boneweight?: number;
        boneindex?: number;
    }
}

class ColladaConverterGeometry {
    name: string;
    indices: Int32Array;
    position: Float32Array;
    normal: Float32Array;
    texcoord: Float32Array;
    boneweight: Float32Array;
    boneindex: Uint8Array;
    skin: ColladaConverterSkin;

    constructor() {
        this.name = "";
        this.indices = null;
        this.position = null;
        this.normal = null;
        this.texcoord = null;
        this.boneweight = null;
        this.boneindex = null;
    }

    toJSON(): ColladaConverterJSONGeometry {
        if (this.position.length === null) {
            throw new Error("Geometry " + this.name + " is missing position data");
        }
        if (this.normal.length === null) {
            throw new Error("Geometry " + this.name + " is missing normal data");
        }
        if (this.texcoord.length === null) {
            throw new Error("Geometry " + this.name + " is missing texture coordinate data");
        }
        var result: ColladaConverterJSONGeometry = {
            indices: this.indices.length,
            vertices: this.position.length,
            offsets: {
                position: this.position.offset,
                normal: this.normal.offset,
                texcoord: this.texcoord.offset
            }
        };
        if (this.boneweight.length > 0) {
            result.offsets.boneweight = this.boneweight.offset;
        }
        if (this.boneindex.length > 0) {
            result.offsets.boneweight = this.boneindex.offset;
        }
        return result;
    }
}