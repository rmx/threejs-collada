/// <reference path="context.ts" />
/// <reference path="utils.ts" />
/// <reference path="material.ts" />
/// <reference path="bone.ts" />
/// <reference path="../external/gl-matrix.i.ts" />
/// <reference path="../math.ts" />

module COLLADA.Converter {

    export class GeometryChunk {
        name: string;
        vertexCount: number;
        triangleCount: number;
        indices: Int32Array;
        position: Float32Array;
        normal: Float32Array;
        texcoord: Float32Array;
        boneweight: Float32Array;
        boneindex: Uint8Array;
        material: COLLADA.Converter.Material;
        bbox_min: Vec3;
        bbox_max: Vec3;
        bindShapeMatrix: Mat4;

        /** Original indices, contained in <triangles>/<p> */
        _colladaVertexIndices: Int32Array;
        /** The stride of the original indices (number of independent indices per vertex) */
        _colladaIndexStride: number;
        /** The offset of the main (position) index in the original vertices */
        _colladaIndexOffset: number;

        constructor() {
            this.name = null;
            this.vertexCount = null;
            this.indices = null;
            this.position = null;
            this.normal = null;
            this.texcoord = null;
            this.boneweight = null;
            this.boneindex = null;
            this.bbox_max = vec3.create();
            this.bbox_min = vec3.create();
            this.bindShapeMatrix = null;
            this._colladaVertexIndices = null;
            this._colladaIndexStride = null;
            this._colladaIndexOffset = null;
        }
    }

    export class Geometry {
        name: string;
        chunks: COLLADA.Converter.GeometryChunk[];
        bones: COLLADA.Converter.Bone[];

        constructor() {
            this.name = "";
            this.chunks = [];
            this.bones = [];
        }

        static createStatic(instanceGeometry: COLLADA.Loader.InstanceGeometry, context: COLLADA.Converter.Context): COLLADA.Converter.Geometry {
            var geometry: COLLADA.Loader.Geometry = COLLADA.Loader.Geometry.fromLink(instanceGeometry.geometry, context);
            if (geometry === null) {
                context.log.write("Geometry instance has no geometry, mesh ignored", LogLevel.Warning);
                return null;
            }

            return COLLADA.Converter.Geometry.createGeometry(geometry, instanceGeometry.materials, context);
        }

        static createAnimated(instanceController: COLLADA.Loader.InstanceController, context: COLLADA.Converter.Context): COLLADA.Converter.Geometry {
            var controller: COLLADA.Loader.Controller = COLLADA.Loader.Controller.fromLink(instanceController.controller, context);
            if (controller === null) {
                context.log.write("Controller instance has no controller, mesh ignored", LogLevel.Warning);
                return null;
            }

            if (controller.skin !== null) {
                return COLLADA.Converter.Geometry.createSkin(instanceController, controller, context);
            } else if (controller.morph !== null) {
                return COLLADA.Converter.Geometry.createMorph(instanceController, controller, context);
            }

            return null;
        }

        static createSkin(instanceController: COLLADA.Loader.InstanceController, controller: COLLADA.Loader.Controller, context: COLLADA.Converter.Context): COLLADA.Converter.Geometry {
            // Controller element
            var controller: COLLADA.Loader.Controller = COLLADA.Loader.Controller.fromLink(instanceController.controller, context);
            if (controller === null) {
                context.log.write("Controller instance has no controller, mesh ignored", LogLevel.Error);
                return null;
            }

            // Skin element
            var skin: COLLADA.Loader.Skin = controller.skin;
            if (skin === null) {
                context.log.write("Controller has no skin, mesh ignored", LogLevel.Error);
                return null;
            }

            // Geometry element
            var loaderGeometry: COLLADA.Loader.Geometry = COLLADA.Loader.Geometry.fromLink(skin.source, context);
            if (loaderGeometry === null) {
                context.log.write("Controller has no geometry, mesh ignored", LogLevel.Error);
                return null;
            }

            // Create skin geometry
            var geometry: COLLADA.Converter.Geometry = COLLADA.Converter.Geometry.createGeometry(loaderGeometry, instanceController.materials, context);

            // Skeleton root nodes
            var skeletonLinks: COLLADA.Loader.Link[] = instanceController.skeletons;
            var skeletonRootNodes: COLLADA.Loader.VisualSceneNode[] = [];
            for (var i: number = 0; i < skeletonLinks.length; i++) {
                var skeletonLink: COLLADA.Loader.Link = skeletonLinks[i];
                var skeletonRootNode: COLLADA.Loader.VisualSceneNode = COLLADA.Loader.VisualSceneNode.fromLink(skeletonLink, context);
                if (skeletonRootNode === null) {
                    context.log.write("Skeleton root node " + skeletonLink.getUrl() + " not found, skeleton root ignored", LogLevel.Warning);
                    continue;
                }
                skeletonRootNodes.push(skeletonRootNode);
            }
            if (skeletonRootNodes.length === 0) {
                context.log.write("Controller has no skeleton, using the whole scene as the skeleton root", LogLevel.Warning);
                skeletonRootNodes = context.nodes.collada.filter((node: COLLADA.Loader.VisualSceneNode) => (node.parent instanceof COLLADA.Loader.VisualScene));
            }
            if (skeletonRootNodes.length === 0) {
                context.log.write("Controller still has no skeleton, using unskinned geometry", LogLevel.Warning);
                return geometry;
            }

            // Joints
            var jointsElement: COLLADA.Loader.Joints = skin.joints;
            if (jointsElement === null) {
                context.log.write("Skin has no joints element, using unskinned mesh", LogLevel.Warning);
                return geometry;
            }
            var jointsInput: COLLADA.Loader.Input = jointsElement.joints;
            if (jointsInput === null) {
                context.log.write("Skin has no joints input, using unskinned mesh", LogLevel.Warning);
                return geometry;
            }
            var jointsSource: COLLADA.Loader.Source = COLLADA.Loader.Source.fromLink(jointsInput.source, context);
            if (jointsSource === null) {
                context.log.write("Skin has no joints source, using unskinned mesh", LogLevel.Warning);
                return geometry;
            }
            var jointSids: string[] = <string[]>jointsSource.data;

            // Bind shape matrix
            var bindShapeMatrix: Mat4 = null;
            if (skin.bindShapeMatrix !== null) {
                bindShapeMatrix = mat4.create();
                COLLADA.MathUtils.mat4Extract(skin.bindShapeMatrix, 0, bindShapeMatrix);
            }

            // InvBindMatrices
            var invBindMatricesInput: COLLADA.Loader.Input = jointsElement.invBindMatrices;
            if (invBindMatricesInput === null) {
                context.log.write("Skin has no inverse bind matrix input, using unskinned mesh", LogLevel.Warning);
                return geometry;
            }
            var invBindMatricesSource: COLLADA.Loader.Source = COLLADA.Loader.Source.fromLink(invBindMatricesInput.source, context);
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
            var weightsElement: COLLADA.Loader.VertexWeights = skin.vertexWeights;
            if (weightsElement === null) {
                context.log.write("Skin contains no bone weights element, using unskinned mesh", LogLevel.Warning);
                return geometry;
            }
            var weightsInput = weightsElement.weights;
            if (weightsInput === null) {
                context.log.write("Skin contains no bone weights input, using unskinned mesh", LogLevel.Warning);
                return geometry;
            }
            var weightsSource: COLLADA.Loader.Source = COLLADA.Loader.Source.fromLink(weightsInput.source, context);
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
            var bones: COLLADA.Converter.Bone[] = COLLADA.Converter.Bone.createSkinBones(jointSids, skeletonRootNodes, bindShapeMatrix, invBindMatrices, context);
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
                var chunk: COLLADA.Converter.GeometryChunk = geometry.chunks[i];

                // Distribute indices to chunks
                chunk.boneindex = new Uint8Array(chunk.vertexCount * bonesPerVertex);
                COLLADA.Converter.Utils.reIndex(skinIndices, chunk._colladaVertexIndices, chunk._colladaIndexStride, chunk._colladaIndexOffset, bonesPerVertex,
                    chunk.boneindex, chunk.indices, 1, 0, bonesPerVertex);

                // Distribute weights to chunks
                chunk.boneweight = new Float32Array(chunk.vertexCount * bonesPerVertex);
                COLLADA.Converter.Utils.reIndex(skinWeights, chunk._colladaVertexIndices, chunk._colladaIndexStride, chunk._colladaIndexOffset, bonesPerVertex,
                    chunk.boneweight, chunk.indices, 1, 0, bonesPerVertex);
            }

            // Copy bind shape matrices
            for (var i = 0; i < geometry.chunks.length; ++i) {
                var chunk: COLLADA.Converter.GeometryChunk = geometry.chunks[i];
                chunk.bindShapeMatrix = mat4.clone(bindShapeMatrix);
            }

            geometry.bones = bones;
            return geometry;
        }

        static createMorph(instanceController: COLLADA.Loader.InstanceController, controller: COLLADA.Loader.Controller, context: COLLADA.Converter.Context): COLLADA.Converter.Geometry {
            context.log.write("Morph animated meshes not supported, mesh ignored", LogLevel.Warning);
            return null;
        }

        static createGeometry(geometry: COLLADA.Loader.Geometry, instanceMaterials: COLLADA.Loader.InstanceMaterial[], context: COLLADA.Converter.Context): COLLADA.Converter.Geometry {
            var materialMap: COLLADA.Converter.MaterialMap = COLLADA.Converter.Material.getMaterialMap(instanceMaterials, context);

            var result: COLLADA.Converter.Geometry = new COLLADA.Converter.Geometry();
            result.name = geometry.name || geometry.id || geometry.sid || "geometry";

            var trianglesList: COLLADA.Loader.Triangles[] = geometry.triangles;
            for (var i: number = 0; i < trianglesList.length; i++) {
                var triangles = trianglesList[i];

                var material: COLLADA.Converter.Material;
                if (triangles.material !== null) {
                    material = materialMap.symbols[triangles.material];
                    if (material === null) {
                        context.log.write("Material symbol " + triangles.material + " has no bound material instance, using default material", LogLevel.Warning);
                        material = COLLADA.Converter.Material.createDefaultMaterial(context);
                    }
                } else {
                    context.log.write("Missing material index, using default material", LogLevel.Warning);
                    material = COLLADA.Converter.Material.createDefaultMaterial(context);
                }

                var chunk: COLLADA.Converter.GeometryChunk = COLLADA.Converter.Geometry.createChunk(geometry, triangles, context);
                if (chunk !== null) {
                    chunk.name = geometry.name;
                    if (trianglesList.length > 1) {
                        chunk.name += (" #" + i)
                }
                    chunk.material = material;
                    result.chunks.push(chunk);
                }
            }
            return result;
        }

        static createChunk(geometry: COLLADA.Loader.Geometry, triangles: COLLADA.Loader.Triangles, context: COLLADA.Converter.Context): COLLADA.Converter.GeometryChunk {
            // Per-triangle data input
            var inputTriVertices: COLLADA.Loader.Input = null;
            var inputTriNormal: COLLADA.Loader.Input = null;
            var inputTriColor: COLLADA.Loader.Input = null;
            var inputTriTexcoord: COLLADA.Loader.Input[] = [];
            for (var i: number = 0; i < triangles.inputs.length; i++) {
                var input: COLLADA.Loader.Input = triangles.inputs[i];
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
            var srcTriVertices: COLLADA.Loader.Vertices = COLLADA.Loader.Vertices.fromLink(inputTriVertices.source, context);
            if (srcTriVertices === null) {
                context.log.write("Geometry " + geometry.id + " has no vertices, geometry ignored", LogLevel.Warning);
                return null;
            }
            var srcTriNormal: COLLADA.Loader.Source = COLLADA.Loader.Source.fromLink(inputTriNormal != null ? inputTriNormal.source : null, context);
            var srcTriColor: COLLADA.Loader.Source = COLLADA.Loader.Source.fromLink(inputTriColor != null ? inputTriColor.source : null, context);
            var srcTriTexcoord: COLLADA.Loader.Source[] = inputTriTexcoord.map((x: COLLADA.Loader.Input) => COLLADA.Loader.Source.fromLink(x != null ? x.source : null, context));

            // Per-vertex data input
            var inputVertPos: COLLADA.Loader.Input = null;
            var inputVertNormal: COLLADA.Loader.Input = null;
            var inputVertColor: COLLADA.Loader.Input = null;
            var inputVertTexcoord: COLLADA.Loader.Input[] = [];
            for (var i: number = 0; i < srcTriVertices.inputs.length; i++) {
                var input: COLLADA.Loader.Input = srcTriVertices.inputs[i];
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
            var srcVertPos: COLLADA.Loader.Source = COLLADA.Loader.Source.fromLink(inputVertPos.source, context);
            if (srcVertPos === null) {
                context.log.write("Geometry " + geometry.id + " has no vertex positions, geometry ignored", LogLevel.Warning);
                return null;
            }
            var srcVertNormal: COLLADA.Loader.Source = COLLADA.Loader.Source.fromLink(inputVertNormal != null ? inputVertNormal.source : null, context);
            var srcVertColor: COLLADA.Loader.Source = COLLADA.Loader.Source.fromLink(inputVertColor != null ? inputVertColor.source : null, context);
            var srcVertTexcoord: COLLADA.Loader.Source[] = inputVertTexcoord.map((x: COLLADA.Loader.Input) => COLLADA.Loader.Source.fromLink(x != null ? x.source : null, context));

            // Raw data
            var dataVertPos = COLLADA.Converter.Utils.createFloatArray(srcVertPos, "vertex position", 3, context);
            var dataVertNormal = COLLADA.Converter.Utils.createFloatArray(srcVertNormal, "vertex normal", 3, context);
            var dataTriNormal = COLLADA.Converter.Utils.createFloatArray(srcTriNormal, "vertex normal (indexed)", 3, context);
            var dataVertColor = COLLADA.Converter.Utils.createFloatArray(srcVertColor, "vertex color", 4, context);
            var dataTriColor = COLLADA.Converter.Utils.createFloatArray(srcTriColor, "vertex color (indexed)", 4, context);
            var dataVertTexcoord = srcVertTexcoord.map((x) => COLLADA.Converter.Utils.createFloatArray(x, "texture coordinate", 2, context));
            var dataTriTexcoord = srcTriTexcoord.map((x) => COLLADA.Converter.Utils.createFloatArray(x, "texture coordinate (indexed)", 2, context));

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
            var triangleVertexStride: number = triangleStride / 3;
            var indices: Int32Array = COLLADA.Converter.Utils.compactIndices(colladaIndices, triangleVertexStride, inputTriVertices.offset);

            if ((indices === null) || (indices.length === 0)) {
                context.log.write("Geometry " + geometry.id + " does not contain any indices, geometry ignored", LogLevel.Error);
                return null;
            }

            // The vertex count (size of the vertex buffer) is the number of unique indices in the index buffer
            var vertexCount: number = COLLADA.Converter.Utils.maxIndex(indices) + 1;
            var triangleCount: number = indices.length / 3;

            if (triangleCount !== trianglesCount) {
                context.log.write("Geometry " + geometry.id + " has an inconsistent number of indices, geometry ignored", LogLevel.Error);
                return null;
            }

            // Position buffer
            var position = new Float32Array(vertexCount * 3);
            var indexOffsetPosition: number = inputTriVertices.offset;
            COLLADA.Converter.Utils.reIndex(dataVertPos, colladaIndices, triangleVertexStride, indexOffsetPosition, 3, position, indices, 1, 0, 3);

            // Normal buffer
            var normal = new Float32Array(vertexCount * 3);
            var indexOffsetNormal: number = inputTriNormal !== null ? inputTriNormal.offset : null;
            if (dataVertNormal !== null) {
                COLLADA.Converter.Utils.reIndex(dataVertNormal, colladaIndices, triangleVertexStride, indexOffsetPosition, 3, normal, indices, 1, 0, 3);
            } else if (dataTriNormal !== null) {
                COLLADA.Converter.Utils.reIndex(dataTriNormal, colladaIndices, triangleVertexStride, indexOffsetNormal, 3, normal, indices, 1, 0, 3);
            } else {
                context.log.write("Geometry " + geometry.id + " has no normal data, using zero vectors", LogLevel.Warning);
            }

            // Texture coordinate buffer
            var texcoord = new Float32Array(vertexCount * 2);
            var indexOffsetTexcoord: number = inputTriTexcoord.length > 0 ? inputTriTexcoord[0].offset : null;
            if (dataVertTexcoord.length > 0) {
                COLLADA.Converter.Utils.reIndex(dataVertTexcoord[0], colladaIndices, triangleVertexStride, indexOffsetPosition, 2, texcoord, indices, 1, 0, 2);
            } else if (dataTriTexcoord.length > 0) {
                COLLADA.Converter.Utils.reIndex(dataTriTexcoord[0], colladaIndices, triangleVertexStride, indexOffsetTexcoord, 2, texcoord, indices, 1, 0, 2);
            } else {
                context.log.write("Geometry " + geometry.id + " has no texture coordinate data, using zero vectors", LogLevel.Warning);
            }

            var result: COLLADA.Converter.GeometryChunk = new COLLADA.Converter.GeometryChunk();
            result.vertexCount = vertexCount;
            result.triangleCount = triangleCount;
            result.indices = indices;
            result.position = position;
            result.normal = normal;
            result.texcoord = texcoord;
            result._colladaVertexIndices = colladaIndices;
            result._colladaIndexStride = triangleVertexStride;
            result._colladaIndexOffset = indexOffsetPosition;

            COLLADA.Converter.Geometry.computeBoundingBox(result, context);

            return result;
        }

        /**
        * Computes the bounding box of the static (unskinned) geometry
        */
        static computeBoundingBox(chunk: COLLADA.Converter.GeometryChunk, context: COLLADA.Converter.Context) {
            var bbox_max = chunk.bbox_max;
            var bbox_min = chunk.bbox_min;
            var position: Float32Array = chunk.position;

            vec3.set(bbox_min, Infinity, Infinity, Infinity);
            vec3.set(bbox_max, -Infinity, -Infinity, -Infinity);

            var vec: Vec3 = vec3.create();
            for (var i: number = 0; i < position.length / 3; ++i) {
                vec[0] = position[i * 3 + 0];
                vec[1] = position[i * 3 + 1];
                vec[2] = position[i * 3 + 2];
                vec3.max(bbox_max, bbox_max, vec);
                vec3.min(bbox_min, bbox_min, vec);
            }
        }

        static transformGeometry(geometry: COLLADA.Converter.Geometry, transformMatrix: Mat4, context: COLLADA.Converter.Context) {
            // Create the normal transformation matrix
            var normalMatrix: Mat3 = mat3.create();
            mat3.normalFromMat4(normalMatrix, transformMatrix);

            // Transform normals and positions of all chunks
            for (var i = 0; i < geometry.chunks.length; ++i) {
                var chunk: COLLADA.Converter.GeometryChunk = geometry.chunks[i];

                if (chunk.position !== null) {
                    vec3.forEach<Mat4>(chunk.position, 3, 0, chunk.position.length / 3, vec3.transformMat4, transformMatrix);
                }

                if (chunk.normal !== null) {
                    vec3.forEach<Mat3>(chunk.normal, 3, 0, chunk.normal.length / 3, vec3.transformMat3, normalMatrix);
                }
            }
        }

        static addSkeleton(geometry: COLLADA.Converter.Geometry, node: COLLADA.Converter.Node, context: COLLADA.Converter.Context) {
            // Create a single bone
            var colladaNode: COLLADA.Loader.VisualSceneNode = context.nodes.findCollada(node);
            var bone: COLLADA.Converter.Bone = COLLADA.Converter.Bone.create(node);
            mat4.identity(bone.invBindMatrix);
            geometry.bones.push(bone);

            COLLADA.Converter.Bone.updateIndices(geometry.bones);

            // Attach all geometry to the bone
            for (var i = 0; i < geometry.chunks.length; ++i) {
                var chunk: COLLADA.Converter.GeometryChunk = geometry.chunks[i];

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
        static mergeGeometries(geometries: COLLADA.Converter.Geometry[], context: COLLADA.Converter.Context): COLLADA.Converter.Geometry {

            if (geometries.length === 1) {
                return geometries[0];
            }

            var result: COLLADA.Converter.Geometry = new COLLADA.Converter.Geometry();
            result.name = "merged_geometry";

            // Merge skeleton bones
            var merged_bones: COLLADA.Converter.Bone[] = [];
            for (var i = 0; i < geometries.length; ++i) {
                COLLADA.Converter.Bone.appendBones(merged_bones, geometries[i].bones);
            }
            result.bones = merged_bones;

            // Recode bone indices
            for (var i = 0; i < geometries.length; ++i) {
                COLLADA.Converter.Geometry.adaptBoneIndices(geometries[i], merged_bones, context);
            }

            // Set bone indices
            COLLADA.Converter.Bone.updateIndices(merged_bones);

            // Safety check
            for (var i = 0; i < merged_bones.length; ++i) {
                var bone: COLLADA.Converter.Bone = merged_bones[i];
                if (bone.parent !== null) {
                    if (bone.parent != merged_bones[bone.parentIndex()]) throw new Error("Inconsistent bone parent");
                }
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
        static adaptBoneIndices(geometry: COLLADA.Converter.Geometry, new_bones: COLLADA.Converter.Bone[], context: COLLADA.Converter.Context) {
            if (geometry.bones.length === 0) {
                return;
            }

            // Compute the index map
            var index_map: Uint32Array = COLLADA.Converter.Bone.getBoneIndexMap(geometry.bones, new_bones);

            // Recode indices
            for (var i = 0; i < geometry.chunks.length; ++i) {
                var chunk: COLLADA.Converter.GeometryChunk = geometry.chunks[i];
                var boneindex: Uint8Array = chunk.boneindex;

                for (var j = 0; j < boneindex.length; ++j) {
                    boneindex[j] = index_map[boneindex[j]];
                }
            }
        }


    }
}