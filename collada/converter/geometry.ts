class ColladaConverterGeometryChunk {
    vertexCount: number;
    indices: Int32Array;
    position: Float32Array;
    normal: Float32Array;
    texcoord: Float32Array;
    boneweight: Float32Array;
    boneindex: Uint8Array;
    material: ColladaConverterMaterial;

    /** Original indices, contained in <triangles>/<p> */
    _colladaVertexIndices: Int32Array;
    /** The stride of the original indices (number of independent indices per vertex) */
    _colladaIndexStride: number;
    /** The offset of the main (position) index in the original vertices */
    _colladaIndexOffset: number;

    constructor() {
        this.vertexCount = null;
        this.indices = null;
        this.position = null;
        this.normal = null;
        this.texcoord = null;
        this.boneweight = null;
        this.boneindex = null;
        this._colladaVertexIndices = null;
        this._colladaIndexStride = null;
        this._colladaIndexOffset = null;
    }
}

class ColladaConverterGeometry {
    name: string;
    chunks: ColladaConverterGeometryChunk[];
    bones: ColladaConverterBone[];

    constructor() {
        this.name = "";
        this.chunks = [];
        this.bones = [];
    }

    static createStatic(instanceGeometry: ColladaInstanceGeometry, context: ColladaConverterContext): ColladaConverterGeometry {
        var geometry: ColladaGeometry = ColladaGeometry.fromLink(instanceGeometry.geometry, context);
        if (geometry === null) {
            context.log.write("Geometry instance has no geometry, mesh ignored", LogLevel.Warning);
            return null;
        }

        return ColladaConverterGeometry.createGeometry(geometry, instanceGeometry.materials, context);
    }

    static createAnimated(instanceController: ColladaInstanceController, context: ColladaConverterContext): ColladaConverterGeometry {
        var controller: ColladaController = ColladaController.fromLink(instanceController.controller, context);
        if (controller === null) {
            context.log.write("Controller instance has no controller, mesh ignored", LogLevel.Warning);
            return null;
        }

        if (controller.skin !== null) {
            return ColladaConverterGeometry.createSkin(instanceController, controller, context);
        } else if (controller.morph !== null) {
            return ColladaConverterGeometry.createMorph(instanceController, controller, context);
        }

        return null;
    }

    static createSkin(instanceController: ColladaInstanceController, controller: ColladaController, context: ColladaConverterContext): ColladaConverterGeometry {
        // Controller element
        var controller: ColladaController = ColladaController.fromLink(instanceController.controller, context);
        if (controller === null) {
            context.log.write("Controller instance has no controller, mesh ignored", LogLevel.Error);
            return null;
        }

        // Skin element
        var skin: ColladaSkin = controller.skin;
        if (skin === null) {
            context.log.write("Controller has no skin, mesh ignored", LogLevel.Error);
            return null;
        }

        // Geometry element
        var colladaGeometry: ColladaGeometry = ColladaGeometry.fromLink(skin.source, context);
        if (colladaGeometry === null) {
            context.log.write("Controller has no geometry, mesh ignored", LogLevel.Error);
            return null;
        }

        // Create skin geometry
        var geometry: ColladaConverterGeometry = ColladaConverterGeometry.createGeometry(colladaGeometry, instanceController.materials, context);

        // Skeleton root nodes
        var skeletonLinks: Link[] = instanceController.skeletons;
        var skeletonRootNodes: ColladaVisualSceneNode[] = [];
        for (var i: number = 0; i < skeletonLinks.length; i++) {
            var skeletonLink: Link = skeletonLinks[i];
            var skeletonRootNode: ColladaVisualSceneNode = ColladaVisualSceneNode.fromLink(skeletonLink, context);
            if (skeletonRootNode === null) {
                context.log.write("Skeleton root node " + skeletonLink.getUrl() + " not found, skeleton root ignored", LogLevel.Warning);
                continue;
            }
            skeletonRootNodes.push(skeletonRootNode);
        }
        if (skeletonRootNodes.length === 0) {
            context.log.write("Controller has no skeleton, using unskinned mesh", LogLevel.Error);
            return geometry;
        }

        // Joints
        var jointsElement: ColladaSkinJoints = skin.joints;
        if (jointsElement === null) {
            context.log.write("Skin has no joints element, using unskinned mesh", LogLevel.Warning);
            return geometry;
        }
        var jointsInput: ColladaInput = jointsElement.joints;
        if (jointsInput === null) {
            context.log.write("Skin has no joints input, using unskinned mesh", LogLevel.Warning);
            return geometry;
        }
        var jointsSource: ColladaSource = ColladaSource.fromLink(jointsInput.source, context);
        if (jointsSource === null) {
            context.log.write("Skin has no joints source, using unskinned mesh", LogLevel.Warning);
            return geometry;
        }
        var jointSids: string[] = <string[]>jointsSource.data;

        // Bind shape matrix
        var bindShapeMatrix: Mat4 = mat4.create();
        if (skin.bindShapeMatrix !== null) {
            ColladaMath.mat4Extract(skin.bindShapeMatrix, 0, bindShapeMatrix);
        }
        
        // InvBindMatrices
        var invBindMatricesInput: ColladaInput = jointsElement.invBindMatrices;
        if (invBindMatricesInput === null) {
            context.log.write("Skin has no inverse bind matrix input, using unskinned mesh", LogLevel.Warning);
            return geometry;
        }
        var invBindMatricesSource: ColladaSource = ColladaSource.fromLink(invBindMatricesInput.source, context);
        if (jointsSource === null) {
            context.log.write("Skin has no inverse bind matrix source, using unskinned mesh", LogLevel.Warning);
            return geometry;
        }
        if (invBindMatricesSource.data.length !== jointsSource.data.length * 16) {
            context.log.write("Skin has an inconsistent length of joint data sources, using unskinned mesh", LogLevel.Warning);
            return geometry;
        }
        if (!(invBindMatricesSource.data instanceof Float32Array)) {
            context.log.write("Skin inverse bind matrices data does not contain floating point data, using unskinned mesh", LogLevel.Warning);
            return geometry;
        }
        var invBindMatrices: Float32Array = <Float32Array> invBindMatricesSource.data;

        // Vertex weights
        var weightsElement: ColladaVertexWeights = skin.vertexWeights;
        if (weightsElement === null) {
            context.log.write("Skin contains no bone weights element, using unskinned mesh", LogLevel.Warning);
            return geometry;
        }
        var weightsInput = weightsElement.weights;
        if (weightsInput === null) {
            context.log.write("Skin contains no bone weights input, using unskinned mesh", LogLevel.Warning);
            return geometry;
        }
        var weightsSource: ColladaSource = ColladaSource.fromLink(weightsInput.source, context);
        if (weightsSource === null) {
            context.log.write("Skin has no bone weights source, using unskinned mesh", LogLevel.Warning);
            return geometry;
        }
        if (!(weightsSource.data instanceof Float32Array)) {
            context.log.write("Bone weights data does not contain floating point data, using unskinned mesh", LogLevel.Warning);
            return geometry;
        }
        var weightsData: Float32Array = <Float32Array> weightsSource.data;

        // Indices
        if (skin.vertexWeights.joints.source.url !== skin.joints.joints.source.url) {
            // Holy crap, how many indirections does this stupid format have?!?
            // If the data sources differ, we would have to reorder the elements of the "bones" array.
            context.log.write("Skin uses different data sources for joints in <joints> and <vertex_weights>, this is not supported. Using unskinned mesh.", LogLevel.Warning);
            return geometry;
        }

        // Bones
        var bones: ColladaConverterBone[] = ColladaConverterBone.createSkinBones(jointSids, skeletonRootNodes, bindShapeMatrix, invBindMatrices, context);
        if (bones === null || bones.length === 0) {
            context.log.write("Skin contains no bones, using unskinned mesh", LogLevel.Warning);
            return geometry;
        }

        // Compact skinning data
        var bonesPerVertex: number = 4;
        var weightsIndices: Int32Array = skin.vertexWeights.v;
        var weightsCounts: Int32Array = skin.vertexWeights.vcount;
        var skinVertexCount: number = weightsCounts.length;
        var skinWeights: Float32Array = new Float32Array(skinVertexCount * bonesPerVertex);
        var skinIndices: Float32Array = new Uint8Array(skinVertexCount * bonesPerVertex);

        var vindex: number = 0;
        var verticesWithTooManyInfluences: number = 0;
        var verticesWithInvalidTotalWeight: number = 0;
        for (var i = 0; i < skinVertexCount; ++i) {

            // Extract weights and indices
            var weightCount: number = weightsCounts[i];
            var totalWeight: number = 0;
            for (var w: number = 0; w < weightCount; ++w) {
                var boneIndex: number = weightsIndices[vindex];
                var boneWeightIndex: number = weightsIndices[vindex + 1];
                vindex += 2;
                var boneWeight: number = weightsData[boneWeightIndex];

                if (w < bonesPerVertex) {
                    totalWeight += boneWeight;
                    skinIndices[i * bonesPerVertex + w] = boneIndex;
                    skinWeights[i * bonesPerVertex + w] = boneWeight;
                } else {
                    // TODO: replace one of the existing elements if necessary
                }
            }
            if (weightCount > bonesPerVertex) {
                verticesWithTooManyInfluences++;
            }

            // Normalize weights (COLLADA weights should be already normalized)
            if (totalWeight < 1e-6 || totalWeight > 1e6) {
                verticesWithInvalidTotalWeight++;
            } else {
                for (var w: number = 0; w < weightCount; ++w) {
                    skinWeights[i * bonesPerVertex + w] /= totalWeight;
                }
            }
        }

        if (verticesWithTooManyInfluences > 0) {
            context.log.write("" + verticesWithTooManyInfluences + " vertices are influenced by too many bones, some influences were ignored. Only " + bonesPerVertex + " bones per vertex are supported.", LogLevel.Warning);
        }
        if (verticesWithInvalidTotalWeight > 0) {
            context.log.write("" + verticesWithInvalidTotalWeight + " vertices have zero or infinite total weight, skin will be broken.", LogLevel.Warning);
        }

        // Distribute skin data to chunks
        for (var i = 0; i < geometry.chunks.length; ++i) {
            var chunk: ColladaConverterGeometryChunk = geometry.chunks[i];

            // Distribute indices to chunks
            chunk.boneindex = new Uint8Array(chunk.vertexCount * bonesPerVertex);
            ColladaConverterUtils.reIndex(skinIndices, chunk._colladaVertexIndices, chunk._colladaIndexStride, chunk._colladaIndexOffset, bonesPerVertex,
                chunk.boneindex, chunk.indices, 1, 0, bonesPerVertex);

            // Distribute weights to chunks
            chunk.boneweight = new Float32Array(chunk.vertexCount * bonesPerVertex);
            ColladaConverterUtils.reIndex(skinWeights, chunk._colladaVertexIndices, chunk._colladaIndexStride, chunk._colladaIndexOffset, bonesPerVertex,
                chunk.boneweight, chunk.indices, 1, 0, bonesPerVertex);
        }

        geometry.bones = bones;
        return geometry;
    }

    static createMorph(instanceController: ColladaInstanceController, controller: ColladaController, context: ColladaConverterContext): ColladaConverterGeometry {
        context.log.write("Morph animated meshes not supported, mesh ignored", LogLevel.Warning);
        return null;
    }

    static createGeometry(geometry: ColladaGeometry, instanceMaterials: ColladaInstanceMaterial[], context: ColladaConverterContext): ColladaConverterGeometry {
        var materialMap: ColladaConverterMaterialMap = ColladaConverterMaterial.getMaterialMap(instanceMaterials, context);

        var result: ColladaConverterGeometry = new ColladaConverterGeometry();
        result.name = geometry.id;

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
        var dataVertPos = ColladaConverterUtils.createFloatArray(srcVertPos, 3, context);
        var dataVertNormal = ColladaConverterUtils.createFloatArray(srcVertNormal, 3, context);
        var dataTriNormal = ColladaConverterUtils.createFloatArray(srcTriNormal, 3, context);
        var dataVertColor = ColladaConverterUtils.createFloatArray(srcVertColor, 4, context);
        var dataTriColor = ColladaConverterUtils.createFloatArray(srcTriColor, 4, context);
        var dataVertTexcoord = srcVertTexcoord.map((x) => ColladaConverterUtils.createFloatArray(x, 2, context));
        var dataTriTexcoord = srcTriTexcoord.map((x) => ColladaConverterUtils.createFloatArray(x, 2, context));

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

        // Security checks
        if (srcVertPos.stride !== 3) {
            context.log.write("Geometry " + geometry.id + " vertex positions are not 3D vectors, geometry ignored", LogLevel.Warning);
            return null;
        }

        // Extract indices used by this chunk
        var colladaIndices: Int32Array = triangles.indices;
        var trianglesCount: number = triangles.count;
        var triangleStride: number = colladaIndices.length / triangles.count;
        var indices: Int32Array = ColladaConverterUtils.compactIndices(colladaIndices, triangleStride, inputTriVertices.offset);

        // The vertex count (size of the vertex buffer) is the number of unique indices in the index buffer
        var vertexCount: number = ColladaConverterUtils.maxIndex(indices);

        // Position buffer
        var position = new Float32Array(vertexCount * 3);
        var indexOffsetPosition: number = inputTriVertices.offset;
        ColladaConverterUtils.reIndex(dataVertPos, colladaIndices, triangleStride, indexOffsetPosition, 3, position, indices, 1, 0, 3);

        // Normal buffer
        var normal = new Float32Array(vertexCount * 3);
        var indexOffsetNormal: number = inputTriNormal !== null ? inputTriNormal.offset : null;
        if (dataVertNormal !== null) {
            ColladaConverterUtils.reIndex(dataVertNormal, colladaIndices, triangleStride, indexOffsetPosition, 3, normal, indices, 1, 0, 3);
        } else if (dataTriNormal !== null) {
            ColladaConverterUtils.reIndex(dataTriNormal, colladaIndices, triangleStride, indexOffsetNormal, 3, normal, indices, 1, 0, 3);
        } else {
            context.log.write("Geometry " + geometry.id + " has no normal data, using zero vectors", LogLevel.Warning);
        }

        // Texture coordinate buffer
        var texcoord = new Float32Array(vertexCount * 3);
        var indexOffsetTexcoord: number = inputTriTexcoord.length > 0 ? inputTriTexcoord[0].offset : null;
        if (dataVertTexcoord.length > 0) {
            ColladaConverterUtils.reIndex(dataVertTexcoord[0], colladaIndices, triangleStride, indexOffsetPosition, 2, texcoord, indices, 1, 0, 2);
        } else if (dataTriTexcoord.length > 0) {
            ColladaConverterUtils.reIndex(dataTriTexcoord[0], colladaIndices, triangleStride, indexOffsetTexcoord, 2, texcoord, indices, 1, 0, 2);
        } else {
            context.log.write("Geometry " + geometry.id + " has no texture coordinate data, using zero vectors", LogLevel.Warning);
        }

        var result: ColladaConverterGeometryChunk = new ColladaConverterGeometryChunk();
        result.vertexCount = vertexCount;
        result.indices = indices;
        result.position = position;
        result.normal = normal;
        result.texcoord = texcoord;
        result._colladaVertexIndices = colladaIndices;
        result._colladaIndexStride = triangleStride;
        result._colladaIndexOffset = indexOffsetPosition;

        return result;
    }

    static transformGeometry(geometry: ColladaConverterGeometry, transformMatrix: Mat4, context: ColladaConverterContext) {
        // Create the normal transformation matrix
        var normalMatrix: Mat3 = mat3.create();
        mat3.normalFromMat4(normalMatrix, transformMatrix);

        // Transform normals and positions of all chunks
        for (var i = 0; i < geometry.chunks.length; ++i) {
            var chunk: ColladaConverterGeometryChunk = geometry.chunks[i];

            if (chunk.position !== null) {
                vec3.forEach<Mat4>(chunk.position, 3, 0, chunk.position.length / 3, vec3.transformMat4, transformMatrix);
            }

            if (chunk.normal !== null) {
                vec3.forEach<Mat3>(chunk.normal, 3, 0, chunk.normal.length / 3, vec3.transformMat3, normalMatrix);
            }
        }
    }

    static addSkeleton(geometry: ColladaConverterGeometry, node: ColladaConverterNode, context: ColladaConverterContext) {
        // Create a single bone
        var colladaNode: ColladaVisualSceneNode = context.nodes.findCollada(node);
        var bone: ColladaConverterBone = ColladaConverterBone.create(node);
        mat4.identity(bone.invBindMatrix);
        geometry.bones.push(bone);

        ColladaConverterBone.updateIndices(geometry.bones);

        // Attach all geometry to the bone
        for (var i = 0; i < geometry.chunks.length; ++i) {
            var chunk: ColladaConverterGeometryChunk = geometry.chunks[i];

            chunk.boneindex = new Uint8Array(chunk.vertexCount * 4);
            chunk.boneweight = new Float32Array(chunk.vertexCount * 4);
            for (var v = 0; v < chunk.vertexCount; ++v) {
                chunk.boneindex[4 * v + 0] = 0;
                chunk.boneindex[4 * v + 1] = 0;
                chunk.boneindex[4 * v + 2] = 0;
                chunk.boneindex[4 * v + 3] = 0;

                chunk.boneweight[4 * v + 0] = 1;
                chunk.boneweight[4 * v + 1] = 0;
                chunk.boneweight[4 * v + 2] = 0;
                chunk.boneweight[4 * v + 3] = 0;
            }
        }
    }

    /**
    * Moves all data from given geometries into one merged geometry.
    * The original geometries will be empty after this operation (lazy design to avoid data duplication).
    */
    static mergeGeometries(geometries: ColladaConverterGeometry[], context: ColladaConverterContext): ColladaConverterGeometry {
        var result: ColladaConverterGeometry = new ColladaConverterGeometry();
        result.name = "merged_geometry";
        
        // Merge skeleton bones
        var merged_bones: ColladaConverterBone[] = [];
        for (var i = 0; i < geometries.length; ++i) {
            ColladaConverterBone.appendBones(merged_bones, geometries[i].bones);
        }

        // Recode bone indices
        for (var i = 0; i < geometries.length; ++i) {
            ColladaConverterGeometry.adaptBoneIndices(geometries[i], merged_bones, context);
        }

        // Merge geometry chunks
        for (var i = 0; i < geometries.length; ++i) {
            result.chunks = result.chunks.concat(geometries[i].chunks);
        }

        // We modified the original data, unlink it from the original geometries
        for (var i = 0; i < geometries.length; ++i) {
            geometries[i].chunks = [];
            geometries[i].bones = [];
        }

        return result;
    }

    /**
    * Change all vertex bone indices so that they point to the given new_bones array, instead of the current geometry.bones array
    */
    static adaptBoneIndices(geometry: ColladaConverterGeometry, new_bones: ColladaConverterBone[], context: ColladaConverterContext) {
        if (geometry.bones.length === 0) {
            return;
        }

        // Compute the index map
        var index_map: Uint32Array = ColladaConverterBone.getBoneIndexMap(geometry.bones, new_bones);

        // Recode indices
        for (var i = 0; i < geometry.chunks.length; ++i) {
            var chunk: ColladaConverterGeometryChunk = geometry.chunks[i];
            var boneindex: Uint8Array = chunk.boneindex;

            for (var j = 0; j < boneindex.length; ++j) {
                boneindex[j] = index_map[boneindex[j]];
            }
        }
    }
}