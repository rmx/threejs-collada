
interface ColladaConverterJSONFile {
    material: ColladaConverterJSONMaterial;
    bones: ColladaConverterJSONBone[];
    geometries: ColladaConverterJSONGeometry[];
}

class ColladaConverterFile {
    data: Uint8Array;

    bones: ColladaConverterBone[];
    geometries: ColladaConverterGeometry[];
    material: ColladaConverterMaterial;

    constructor() {
        this.data = null;
        this.bones = [];
        this.geometries = [];
        this.material = new ColladaConverterMaterial();
    }

    toJSON(): ColladaConverterJSONFile {
        var result: ColladaConverterJSONFile = {
            material: this.material.toJSON(),
            geometries: [],
            bones: []
        };
        for (var i = 0; i < this.bones.length; ++i) {
            result.bones.push(this.bones[i].toJSON());
        }
        for (var i = 0; i < this.geometries.length; ++i) {
            result.geometries.push(this.geometries[i].toJSON());
        }
        return result;
    }

    toString(): string {
        var json = this.toJSON();
        return JSON.stringify(json);
    }
}