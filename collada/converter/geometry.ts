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

        return ColladaConverterGeometry.createGeometry(geometry, instanceGeometry.materials, context);
    }

    static createAnimated(controller: ColladaInstanceController, context: ColladaConverterContext): ColladaConverterGeometry {
        return null;
    }

    static createGeometry(geometry: ColladaGeometry, instanceMaterials: ColladaInstanceMaterial[], context: ColladaConverterContext): ColladaConverterGeometry {
        var materialMap: ColladaConverterMaterialMap = ColladaConverterMaterial.getMaterialMap(instanceMaterials, context);

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
                    context.log.write("Geometry " + geometry.id + " has non-triangle polygons, geometry ignored", LogLevel.Warning);
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
        var indices: Int32Array = triangles.indices;
        var normal: Float32Array = null;
        var texcoord: Float32Array = null;

        // Normal buffer
        if (dataVertNormal != null) {
            normal = dataVertNormal;
        } else if (dataTriNormal != null) {
            normal = ColladaConverterGeometry.reIndex(indices, dataTriNormal, inputTriVertices.offset, inputTriNormal.offset, trianglesCount, vertexCount, 3);
        } else {
            context.log.write("Geometry " + geometry.id + " has no normal data, using zero normals", LogLevel.Warning);
            normal = new Float32Array(vertexCount * 3);
        }

        // Normal buffer
        if (dataVertTexcoord.length > 0) {
            texcoord = dataVertTexcoord[0];
        } else if (dataTriTexcoord.length > 0) {
            texcoord = ColladaConverterGeometry.reIndex(indices, dataTriNormal, inputTriVertices.offset, inputTriTexcoord[0].offset, trianglesCount, vertexCount, 3);
        }
        if (dataVertTexcoord.length + dataTriTexcoord.length > 1) {
            context.log.write("Geometry " + geometry.id + " has multiple texture coordinate channels, only using the first one", LogLevel.Warning);
        }
        
        var result: ColladaConverterGeometryChunk = new ColladaConverterGeometryChunk();
        result.indices = triangles.indices;
        result.position = dataVertPos;
        result.normal = normal;
        result.texcoord = texcoord;

        return result;
    }

    /**
    * Re-indexes data.
    *
    * Used because in COLLADA, each geometry attribute (position, normal, ...) can have its own index buffer,
    * whereas for GPU rendering, there is only one index buffer for the whole geometry.
    */
    static reIndex(indices: Int32Array, srcData: Float32Array, srcOffset: number, destOffset:number, triangleCount: number, vertexCount: number, dim: number): Float32Array {
        var destData: Float32Array = new Float32Array(vertexCount * dim);
        var triangleStride: number = indices.length / triangleCount;
        for (var t: number = 0; t < triangleCount; ++t) {
            
            // Position in the "indices" array at which the current triangle starts
            var indexBaseOffset: number = t * triangleStride;

            // Copy data for each vertex of the triangle
            for (var v: number = 0; v < 3; ++v) {
                
                // Position in the "indices" array at which the current vertex index can be found
                var indexOffset: number = indexBaseOffset + v * 3;

                // Index in the "srcData" array at which the vertex data can be found
                var srcIndex: number = indices[indexOffset + srcOffset];

                // Index in the "destData" array at which the vertex data should be stored
                var destIndex: number = indices[indexOffset + destOffset];

                // Copy vertex data (one value for each dimension)
                for (var d: number = 0; d < dim; ++d) {
                    destData[dim * destIndex + d] = srcData[dim * srcIndex + d];
                }
            }
        }

        return destData;
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
        if (iEnd > source.data.length) {
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
        for (var i: number = iBegin; i < iEnd; i += outDim) {
            for (var j: number = 0; j < outDim; ++j) {
                result[i - iBegin + j] = srcData[i + j];
            }
        }
        return result;
    }
}