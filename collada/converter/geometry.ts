class ColladaConverterGeometryChunk {
    indices: Int32Array;
    position: Float32Array;
    normal: Float32Array;
    texcoord: Float32Array;
    boneweight: Float32Array;
    boneindex: Uint8Array;
    material: ColladaConverterMaterial;

    constructor() {
        this.indices = null;
        this.position = null;
        this.normal = null;
        this.texcoord = null;
        this.boneweight = null;
        this.boneindex = null;
    }
}

class ColladaConverterGeometry {
    id: string;
    chunks: ColladaConverterGeometryChunk[];
    skin: ColladaConverterSkin;

    constructor(id: string) {
        this.id = id;
        this.chunks = [];
        this.skin = null;
    }

    static createStatic(instanceGeometry: ColladaInstanceGeometry, context: ColladaConverterContext): ColladaConverterGeometry {
        var geometry: ColladaGeometry = ColladaGeometry.fromLink(instanceGeometry.geometry, context);
        if (geometry === null) {
            context.log.write("Geometry instance has no geometry, mesh ignored", LogLevel.Warning);
            return null;
        }

        var gnm = ColladaConverterGeometry.createGeometryAndMaterial(geometry, instanceGeometry.materials, context);
    }

    static createAnimated(controller: ColladaInstanceController, context: ColladaConverterContext): ColladaConverterGeometry {
        return null;
    }

    static createGeometryAndMaterial(geometry: ColladaGeometry, instanceMaterials: ColladaInstanceMaterial[], context: ColladaConverterContext): ColladaConverterGeometry {
        var materialMap: ColladaConverterMaterialMap = ColladaConverterMaterial.getMaterialMap(instanceMaterials, context);
        var converterGeometry = ColladaConverterGeometry.createGeometry(geometry, materialMap, context);
        return converterGeometry;
    }

    static createGeometry(geometry: ColladaGeometry, materialMap: ColladaConverterMaterialMap, context: ColladaConverterContext): ColladaConverterGeometry {
        var result: ColladaConverterGeometry = new ColladaConverterGeometry(geometry.id);

        var trianglesList: ColladaTriangles[] = geometry.triangles;
        for (var i: number = 0; i < trianglesList.length; i++) {
            var triangles = trianglesList[i];

            var material: ColladaConverterMaterial;
            if (triangles.material !== null) {
                material = materialMap.symbols[triangles.material];
                if (material === null) {
                    context.log.write("Material symbol " + triangles.material + " has no bound material instance, using default material", LogLevel.Warning);
                    material = ColladaConverterMaterial.createDefaultMaterial(context);
                }
            } else {
                context.log.write("Missing material index, using default material", LogLevel.Warning);
                material = ColladaConverterMaterial.createDefaultMaterial(context);
            }

            var chunk: ColladaConverterGeometryChunk = ColladaConverterGeometry.createChunk(geometry, triangles, context);
            chunk.material = material;
            result.chunks.push(chunk);
        }
        return result;
    }

    static createChunk(geometry: ColladaGeometry, triangles: ColladaTriangles, context: ColladaConverterContext): ColladaConverterGeometryChunk {

    }

}