interface ColladaConverterJSONBone {
    name: string;
    parent: number;
    attachedToSkin: boolean;
    invBindMatrix: number[];
}


class ColladaConverterBone {
    index: number;
    node: ColladaVisualSceneNode;
    sid: string;
    parent: ColladaConverterBone;
    isAnimated: boolean;
    attachedToSkin: boolean;
    invBindMatrix: number[];
    bindShapeMatrix: number[];

    constructor(node: ColladaVisualSceneNode, jointSid: string, index: number) {
        this.node = node;
        this.sid = jointSid;
        this.index = index;
        this.parent = null;
        this.attachedToSkin = false;
        this.invBindMatrix = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
        this.bindShapeMatrix = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
    }

    parentIndex(): number {
        return this.parent === null ? -1 : this.parent.index;
    }

    toJSON(): ColladaConverterJSONBone {
        return {
            name: this.sid,
            parent: this.parentIndex(),
            attachedToSkin: this.attachedToSkin,
            invBindMatrix: this.invBindMatrix
        }
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
    * Creates a new bone and adds it to the given list of bones
    */
    static createBone(node: ColladaVisualSceneNode, jointSid: string, bones: ColladaConverterBone[], context: ColladaConverterContext): ColladaConverterBone {
        var bone: ColladaConverterBone = new ColladaConverterBone(node, jointSid, bones.length);
        return bone;
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
            if ((bone.node.parent != null) && (bone.node.parent instanceof ColladaVisualSceneNode) && (bone.parent == null)) {
                bone.parent = ColladaConverterBone.createBone(<ColladaVisualSceneNode> bone.node.parent, "", bones, context);
            }
        }
    }

    static createSkinBones(skin: ColladaConverterSkin, context: ColladaConverterContext): ColladaConverterBone[]{
        var bones: ColladaConverterBone[] = [];

        for (var i: number = 0; i < skin.jointSids.length; i++) {
            var jointSid: string = skin.jointSids[i];
            var jointNode: ColladaVisualSceneNode = ColladaConverterBone.findBoneNode(jointSid, skin.skeletonRootNodes, context);
            if (jointNode === null) {
                context.log.write("Joint " + jointSid + " not found for skeleton, no skeleton bone created", LogLevel.Warning);
                continue;
            }
            var bone: ColladaConverterBone = ColladaConverterBone.createBone(jointNode, jointSid, bones, context);
            ColladaLoader2._fillMatrix4RowMajor(skin.invBindMatrices, bone.index * 16, bone.invBindMatrix);
        }

        return bones;
    }
}