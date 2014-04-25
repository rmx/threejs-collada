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
            if (chunk !== null) {
                chunk.material = material;
                result.chunks.push(chunk);
            }
        }
        return result;
    }

    static createChunk(geometry: ColladaGeometry, triangles: ColladaTriangles, context: ColladaConverterContext): ColladaConverterGeometryChunk {
        // Per-triangle data input
        var inputTriVertices: ColladaInput = null;
        var inputTriNormal: ColladaInput = null;
        var inputTriColor: ColladaInput = null;
        var inputTriTexcoord: ColladaInput[] = [];
        for (var i: number = 0; i < triangles.inputs.length; i++) {
            var input: ColladaInput = triangles.inputs[i];
            switch (input.semantic) {
                case "VERTEX":
                    inputTriVertices = input;
                    break;
                case "NORMAL":
                    inputTriNormal = input;
                    break;
                case "COLOR":
                    inputTriColor = input;
                    break;
                case "TEXCOORD":
                    inputTriTexcoord.push(input);
                    break;
                default:
                    context.log.write("Unknown triangles input semantic " + input.semantic + " ignored", LogLevel.Warning);
            }
        }

        // Per-triangle data source
        var srcTriVertices: ColladaVertices = ColladaVertices.fromLink(inputTriVertices.source, context);
        if (srcTriVertices === null) {
            context.log.write("Geometry " + geometry.id + " has no vertices, geometry ignored", LogLevel.Warning);
            return null;
        }
        var srcTriNormal: ColladaSource = ColladaSource.fromLink(inputTriNormal != null ? inputTriNormal.source : null, context);
        var srcTriColor: ColladaSource = ColladaSource.fromLink(inputTriColor != null ? inputTriColor.source : null, context);
        var srcTriTexcoord: ColladaSource[] = inputTriTexcoord.map((x: ColladaInput) => ColladaSource.fromLink(x != null ? x.source : null, context));

        // Per-vertex data input
        var inputVertPos: ColladaInput = null;
        var inputVertNormal: ColladaInput = null;
        var inputVertColor: ColladaInput = null;
        var inputVertTexcoord: ColladaInput[] = [];
        for (var i: number = 0; i < srcTriVertices.inputs.length; i++) {
            var input: ColladaInput = srcTriVertices.inputs[i];
            switch (input.semantic) {
                case "POSITION":
                    inputVertPos = input;
                    break;
                case "NORMAL":
                    inputVertNormal = input;
                    break;
                case "COLOR":
                    inputVertColor = input;
                    break;
                case "TEXCOORD":
                    inputVertTexcoord.push(input);
                    break;
                default:
                    context.log.write("Unknown vertices input semantic " + input.semantic + " ignored", LogLevel.Warning);
            }
        }

        // Per-vertex data source
        var srcVertPos: ColladaSource = ColladaSource.fromLink(inputVertPos.source, context);
        if (srcVertPos === null) {
            context.log.write("Geometry " + geometry.id + " has no vertex positions, geometry ignored", LogLevel.Warning);
            return null;
        }
        var srcVertNormal: ColladaSource = ColladaSource.fromLink(inputVertNormal != null ? inputVertNormal.source : null, context);
        var srcVertColor: ColladaSource = ColladaSource.fromLink(inputVertColor != null ? inputVertColor.source : null, context);
        var srcVertTexcoord: ColladaSource[] = inputVertTexcoord.map((x: ColladaInput) => ColladaSource.fromLink(x != null ? x.source : null, context));

        // Raw data
        var dataVertPos = ColladaConverterGeometry.createFloatArray(srcVertPos, 3, context);
        var dataVertNormal = ColladaConverterGeometry.createFloatArray(srcVertNormal, 3, context);
        var dataTriNormal = ColladaConverterGeometry.createFloatArray(srcTriNormal, 3, context);
        var dataVertColor = ColladaConverterGeometry.createFloatArray(srcVertColor, 4, context);
        var dataTriColor = ColladaConverterGeometry.createFloatArray(srcTriColor, 4, context);
        var dataVertTexcoord = srcVertTexcoord.map((x) => ColladaConverterGeometry.createFloatArray(x, 2, context));
        var dataTriTexcoord = srcTriTexcoord.map((x) => ColladaConverterGeometry.createFloatArray(x, 2, context));

        // Make sure the geometry only contains triangles
        if (triangles.type !== "triangles") {
            var vcount: Int32Array = triangles.vcount;
            for (var i: number = 0; i < vcount.length; i++) {
                var c: number = vcount[i];
                if (c !== 3) {
                    context.log.write("Geometry " + geometry.id + " has non-triangle polygons, parts of the geometry ignored", LogLevel.Warning);
                    return null;
                }
            }
        }

        // Number of items to process
        var triangleStride: number = triangles.indices.length / triangles.count;
        var trianglesCount: number = triangles.count;
        var vertexCount: number = dataVertPos.length;

        // Buffers for de-indexed data
        var position: Float32Array = dataVertPos;
        var normal: Float32Array = new Float32Array(dataVertPos.length);
        var indices: Int32Array = triangles.indices;

        // Copy and de-index data
        for (var triangleIndex: number = 0; triangleIndex < trianglesCount; ++triangleIndex) {
            var triangleBaseOffset: number = triangleIndex * triangleStride;

            // Indices in the "indices" array at which the definition of each triangle vertex start
            var baseOffset0: number = triangleBaseOffset + 0 * 3;
            var baseOffset1: number = triangleBaseOffset + 1 * 3;
            var baseOffset2: number = triangleBaseOffset + 2 * 3;

            // Indices in the "vertices" array at which the vertex data can be found
            var v0: number = indices[baseOffset0 + inputTriVertices.offset];
            var v1: number = indices[baseOffset1 + inputTriVertices.offset];
            var v2: number = indices[baseOffset2 + inputTriVertices.offset];

            if (dataVertNormal != null) {
                // Using the same indices as vertex data
                ColladaMath.vec3copy(dataVertNormal, v0, normal, v0);
                ColladaMath.vec3copy(dataVertNormal, v1, normal, v1);
                ColladaMath.vec3copy(dataVertNormal, v2, normal, v2);
            } else if (dataTriNormal != null) {
                // Using a separate index
                var n0: number = indices[baseOffset0 + inputTriNormal.offset];
                var n1: number = indices[baseOffset1 + inputTriNormal.offset];
                var n2: number = indices[baseOffset2 + inputTriNormal.offset];
                ColladaMath.vec3copy(dataTriNormal, n0, normal, v0);
                ColladaMath.vec3copy(dataTriNormal, n1, normal, v1);
                ColladaMath.vec3copy(dataTriNormal, n2, normal, v2);
            }
        }

        var result: ColladaConverterGeometryChunk = new ColladaConverterGeometryChunk();
        result.indices = triangles.indices;
        result.position = dataVertPos;
    }

    static deIndex(indices: Int32Array, indexOffset: number, data: Float32Array) {
        TODO!!!
    }

    static createFloatArray(source: ColladaSource, outDim:number, context: ColladaProcessingContext): Float32Array {
        if (source === null) {
            return null;
        }
        if (source.stride > outDim) {
            context.log.write("Vector source data contains too many dimensions, some data will be ignored", LogLevel.Warning);
        } else if (source.stride < outDim) {
            context.log.write("Vector source data does not contain enough dimensions, some data will be zero", LogLevel.Warning);
        }

        // Start and end index
        var iBegin: number = source.offset;
        var iEnd: number = source.offset + source.count * source.stride;
        if (iEnd >= source.data.length) {
            context.log.write("Vector source tries to access too many elements, data ignored", LogLevel.Warning);
            return null;
        }

        // Get source raw data
        if (!(source.data instanceof Float32Array)) {
            context.log.write("Vector source does not contain floating point data, data ignored", LogLevel.Warning);
            return null;
        }
        var srcData: Float32Array = <Float32Array>source.data;

        // Copy data
        var result = new Float32Array(source.count * outDim);
        for (var i: number = iBegin; i <= iEnd; i += outDim) {
            for (var j: number = 0; j < outDim; ++j) {
                result[i - iBegin + j] = srcData[i + j];
            }
        }
        return result;
    }
}