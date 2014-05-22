/// <reference path="../math.ts" />
/// <reference path="context.ts" />
/// <reference path="utils.ts" />
/// <reference path="node.ts" />

module COLLADA.Converter {

    export class Bone {
        index: number;
        node: COLLADA.Converter.Node;
        name: string;
        parent: COLLADA.Converter.Bone;
        attachedToSkin: boolean;
        invBindMatrix: Mat4;

        constructor(node: COLLADA.Converter.Node) {
            this.node = node;
            this.name = node.name;
            this.index = null;
            this.parent = null;
            this.attachedToSkin = false;
            this.invBindMatrix = mat4.create();
        }

        parentIndex(): number {
            return this.parent === null ? -1 : this.parent.index;
        }

        depth(): number {
            return this.parent === null ? 0 : (this.parent.depth() + 1);
        }

        static create(node: COLLADA.Converter.Node): COLLADA.Converter.Bone {
            return new COLLADA.Converter.Bone(node);
        }

        /**
        * Finds the visual scene node that is referenced by the joint SID.
        * The skin element contains the skeleton root nodes.
        */
        static findBoneNode(boneSid: string, skeletonRootNodes: COLLADA.Loader.VisualSceneNode[], context: COLLADA.Converter.Context): COLLADA.Loader.VisualSceneNode {
            // The spec is inconsistent here.
            // The joint ids do not seem to be real scoped identifiers(chapter 3.3, "COLLADA Target Addressing"), since they lack the first part (the anchor id)
            // The skin element(chapter 5, "skin" element) * implies * that the joint ids are scoped identifiers relative to the skeleton root node,
            // so perform a sid - like breadth - first search.
            var boneNode: COLLADA.Loader.Element = null;
            for (var i: number = 0; i < skeletonRootNodes.length; i++) {
                var skeletonRoot: COLLADA.Loader.VisualSceneNode = skeletonRootNodes[i];
                var sids: string[] = boneSid.split("/");
                boneNode = COLLADA.Loader.SidLink.findSidTarget(boneSid, skeletonRoot, sids, context);
                if (boneNode != null) {
                    break;
                }
            }
            if (boneNode instanceof COLLADA.Loader.VisualSceneNode) {
                return <COLLADA.Loader.VisualSceneNode> boneNode;
            } else {
                context.log.write("Joint " + boneSid + " does not point to a visual scene node, joint ignored", LogLevel.Warning);
                return null;
            }
        }

        /**
        * Find the parent for each bone
        * The skeleton(s) may contain more bones than referenced by the skin
        * This function also adds all bones that are not referenced but used for the skeleton transformation
        */
        static findBoneParents(bones: COLLADA.Converter.Bone[], context: COLLADA.Converter.Context) {
            var i: number = 0;
            // The bones array will grow during traversal, therefore the while loop
            while (i < bones.length) {
                // Select the next unprocessed bone
                var bone: COLLADA.Converter.Bone = bones[i];
                i = i + 1;

                // Find a bone that corresponds to this bone's node parent
                for (var k: number = 0; k < bones.length; k++) {
                    var parentBone: COLLADA.Converter.Bone = bones[k];
                    if (bone.node.parent === parentBone.node) {
                        bone.parent = parentBone;
                        break;
                    }
                }

                // If no parent bone found, add it to the list
                if ((bone.node.parent != null) && (bone.parent == null)) {
                    bone.parent = COLLADA.Converter.Bone.create(bone.node.parent);
                    bones.push(bone.parent);
                }
            }
        }

        /**
        * Create all bones used in the given skin
        */
        static createSkinBones(jointSids: string[], skeletonRootNodes: COLLADA.Loader.VisualSceneNode[], bindShapeMatrix: Mat4, invBindMatrices: Float32Array, context: COLLADA.Converter.Context): COLLADA.Converter.Bone[] {
            var bones: COLLADA.Converter.Bone[] = [];

            // Add all bones referenced by the skin
            for (var i: number = 0; i < jointSids.length; i++) {
                var jointSid: string = jointSids[i];
                var jointNode: COLLADA.Loader.VisualSceneNode = COLLADA.Converter.Bone.findBoneNode(jointSid, skeletonRootNodes, context);
                if (jointNode === null) {
                    context.log.write("Joint " + jointSid + " not found for skeleton, no bones created", LogLevel.Warning);
                    return [];
                }
                var converterNode: COLLADA.Converter.Node = context.nodes.findConverter(jointNode);
                if (converterNode === null) {
                    context.log.write("Joint " + jointSid + " not converted for skeleton, no bones created", LogLevel.Warning);
                    return [];
                }
                var bone: COLLADA.Converter.Bone = COLLADA.Converter.Bone.create(converterNode);
                bone.attachedToSkin = true;

                COLLADA.MathUtils.mat4Extract(invBindMatrices, i, bone.invBindMatrix);
                // Collada skinning equation: boneWeight*boneMatrix*invBindMatrix*bindShapeMatrix*vertexPos
                // (see chapter 4: "Skin Deformation (or Skinning) in COLLADA")
                // Here we could pre-multiply the inverse bind matrix and the bind shape matrix
                // We do not pre-multiply the bind shape matrix, because the same bone could be bound to
                // different meshes using different bind shape matrices and we would have to duplicate the bones
                // mat4.multiply(bone.invBindMatrix, bone.invBindMatrix, bindShapeMatrix);
                bones.push(bone);
            }

            // Add all missing bones of the skeleton
            COLLADA.Converter.Bone.findBoneParents(bones, context);

            // Set indices
            COLLADA.Converter.Bone.updateIndices(bones);

            return bones;
        }

        /**
        * Updates the index member for all bones of the given array
        */
        static updateIndices(bones: COLLADA.Converter.Bone[]) {
            for (var i: number = 0; i < bones.length; ++i) {
                var bone: COLLADA.Converter.Bone = bones[i];
                bone.index = i;
            }
        }

        /**
        * Returns true if the two bones can safely be merged, i.e.,
        * they reference the same scene graph node and have the same inverse bind matrix
        */
        static sameBone(a: COLLADA.Converter.Bone, b: COLLADA.Converter.Bone): boolean {
            if (a.node !== b.node) {
                return false;
            }
            for (var i = 0; i < 16; ++i) {
                if (a.invBindMatrix[i] !== b.invBindMatrix[i]) {
                    return false;
                }
            }
            return true;
        }

        /**
        * Appends bones from src to dest, so that each bone is unique
        */
        static appendBones(dest: COLLADA.Converter.Bone[], src: COLLADA.Converter.Bone[]) {
            for (var is: number = 0; is < src.length; ++is) {
                var src_bone: COLLADA.Converter.Bone = src[is];
                COLLADA.Converter.Bone.appendBone(dest, src_bone);
            }

            // Update bone indices
            COLLADA.Converter.Bone.updateIndices(dest);
        }

        /**
        * Appends src_bone to dest
        */
        static appendBone(dest: COLLADA.Converter.Bone[], src_bone: COLLADA.Converter.Bone): COLLADA.Converter.Bone {

            var already_present: boolean = false;
            for (var id: number = 0; id < dest.length; ++id) {
                var dest_bone: COLLADA.Converter.Bone = dest[id];
                if (COLLADA.Converter.Bone.sameBone(dest_bone, src_bone)) {
                    already_present = true;

                    // Merge the 'attached to skin' property
                    dest_bone.attachedToSkin = dest_bone.attachedToSkin || src_bone.attachedToSkin;

                    return dest_bone;
                }
            }

            if (!already_present) {
                dest.push(src_bone);

                if (src_bone.parent !== null) {
                    src_bone.parent = COLLADA.Converter.Bone.appendBone(dest, src_bone.parent);
                }
            }
            return src_bone;
        }

        /**
        * Given two arrays a and b, such that each bone from a is contained in b,
        * compute a map that maps the old index of each bone to the new index.
        */
        static getBoneIndexMap(a: COLLADA.Converter.Bone[], b: COLLADA.Converter.Bone[]): Uint32Array {
            var result: Uint32Array = new Uint32Array(a.length);
            for (var i: number = 0; i < a.length; ++i) {
                var bone_a: COLLADA.Converter.Bone = a[i];

                // Find the index of the current bone in b
                var new_index: number = -1;
                for (var j: number = 0; j < b.length; ++j) {
                    var bone_b: COLLADA.Converter.Bone = b[j];
                    if (COLLADA.Converter.Bone.sameBone(bone_a, bone_b)) {
                        new_index = j;
                        break;
                    }
                }

                if (new_index < 0) {
                    var a_name: string = bone_a.name;
                    var b_names: string[] = b.map((b: COLLADA.Converter.Bone) => b.name);
                    throw new Error("Bone " + a_name + " not found in " + b_names);
                }
                result[i] = new_index;
            }
            return result;
        }
    }
}