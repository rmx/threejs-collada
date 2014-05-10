class ColladaConverterBone {
    index: number;
    node: ColladaConverterNode;
    name: string;
    parent: ColladaConverterBone;
    attachedToSkin: boolean;
    invBindMatrix: Mat4;

    constructor(node: ColladaConverterNode) {
        this.node = node;
        this.name = "";
        this.index = null;
        this.parent = null;
        this.attachedToSkin = false;
        this.invBindMatrix = mat4.create();
    }

    parentIndex(): number {
        return this.parent === null ? -1 : this.parent.index;
    }

    static create(node: ColladaConverterNode): ColladaConverterBone {
        return new ColladaConverterBone(node);
    }

    /**
    * Finds the visual scene node that is referenced by the joint SID.
    * The skin element contains the skeleton root nodes.
    */
    static findBoneNode(boneSid: string, skeletonRootNodes: ColladaVisualSceneNode[], context: ColladaConverterContext): ColladaVisualSceneNode {
        // The spec is inconsistent here.
        // The joint ids do not seem to be real scoped identifiers(chapter 3.3, "COLLADA Target Addressing"), since they lack the first part (the anchor id)
        // The skin element(chapter 5, "skin" element) * implies * that the joint ids are scoped identifiers relative to the skeleton root node,
        // so perform a sid - like breadth - first search.
        var boneNode: ColladaElement = null;
        for (var i: number = 0; i < skeletonRootNodes.length; i++) {
            var skeletonRoot: ColladaVisualSceneNode = skeletonRootNodes[i];
            var sids: string[] = boneSid.split("/");
            boneNode = SidLink.findSidTarget(boneSid, skeletonRoot, sids, context);
            if (boneNode != null) {
                break;
            }
        }
        if (boneNode instanceof ColladaVisualSceneNode) {
            return <ColladaVisualSceneNode> boneNode;
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
    static findBoneParents(bones: ColladaConverterBone[], context: ColladaConverterContext) {
        var i: number = 0;
        // The bones array will grow during traversal, therefore the while loop
        while (i < bones.length) {
            // Select the next unprocessed bone
            var bone: ColladaConverterBone = bones[i];
            i = i + 1;

            // Find a bone that corresponds to this bone's node parent
            for (var k: number = 0; k < bones.length; k++) {
                var parentBone: ColladaConverterBone = bones[k];
                if (bone.node.parent === parentBone.node) {
                    bone.parent = parentBone;
                    break;
                }
            }

            // If no parent bone found, add it to the list
            if ((bone.node.parent != null) && (bone.parent == null)) {
                bone.parent = ColladaConverterBone.create(bone.node.parent);
                bones.push(bone.parent);
            }
        }
    }
    
    /**
    * Create all bones used in the given skin
    */
    static createSkinBones(jointSids: string[], skeletonRootNodes: ColladaVisualSceneNode[], bindShapeMatrix: Mat4, invBindMatrices: Float32Array, context: ColladaConverterContext): ColladaConverterBone[]{
        var bones: ColladaConverterBone[] = [];

        // Add all bones referenced by the skin
        for (var i: number = 0; i < jointSids.length; i++) {
            var jointSid: string = jointSids[i];
            var jointNode: ColladaVisualSceneNode = ColladaConverterBone.findBoneNode(jointSid, skeletonRootNodes, context);
            if (jointNode === null) {
                context.log.write("Joint " + jointSid + " not found for skeleton, no bones created", LogLevel.Warning);
                return [];
            }
            var converterNode: ColladaConverterNode = context.nodes.findConverter(jointNode);
            if (converterNode === null) {
                context.log.write("Joint " + jointSid + " not converted for skeleton, no bones created", LogLevel.Warning);
                return [];
            }
            var bone: ColladaConverterBone = ColladaConverterBone.create(converterNode);
            bone.name = jointSid;
            bone.attachedToSkin = true;

            // Collada skinning equation: boneWeight*boneMatrix*invBindMatrix*bindShapeMatrix*vertexPos
            // (see chapter 4: "Skin Deformation (or Skinning) in COLLADA")
            // Here we are pre-multiplying the inverse bind matrix and the bind shape matrix
            ColladaMath.mat4Extract(invBindMatrices, i, bone.invBindMatrix);
            mat4.multiply(bone.invBindMatrix, bone.invBindMatrix, bindShapeMatrix);
            bones.push(bone);
        }

        // Add all missing bones of the skeleton
        ColladaConverterBone.findBoneParents(bones, context);

        // Set indices
        ColladaConverterBone.updateIndices(bones);

        return bones;
    }

    /**
    * Updates the index member for all bones of the given array
    */
    static updateIndices(bones: ColladaConverterBone[]) {
        for (var i: number = 0; i < bones.length; ++i) {
            var bone: ColladaConverterBone = bones[i];
            bone.index = i;
        }
    }

    /**
    * Returns true if the two bones can safely be merged, i.e.,
    * they reference the same scene graph node and have the same inverse bind matrix
    */
    static sameBone(a: ColladaConverterBone, b: ColladaConverterBone): boolean {
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
    static appendBones(dest: ColladaConverterBone[], src: ColladaConverterBone[]) {
        for (var is: number = 0; is < src.length; ++is) {
            var src_bone: ColladaConverterBone = src[is];

            var already_present: boolean = false;
            for (var id: number = 0; id < dest.length; ++id) {
                var dest_bone: ColladaConverterBone = src[id];
                if (ColladaConverterBone.sameBone(dest_bone, src_bone)) {
                    already_present = true;

                    // Merge the 'attached to skin' property
                    dest_bone.attachedToSkin = dest_bone.attachedToSkin || src_bone.attachedToSkin;

                    break;
                }
            }

            if (!already_present) {
                dest.push(src_bone);
            }
        }

        ColladaConverterBone.updateIndices(dest);
    }

    /**
    * Given two arrays a and b, such that each bone from a is contained in b,
    * compute a map that maps the old index of each bone to the new index.
    */
    static getBoneIndexMap(a: ColladaConverterBone[], b: ColladaConverterBone[]): Uint32Array {
        var result: Uint32Array = new Uint32Array(a.length);
        for (var i: number = 0; i < a.length; ++i) {
            var new_index: number = b.indexOf(a[i]);
            result[i] = new_index;
        }
        return result;
    }
}