
class ColladaConverterSkin {
    jointSids: string[];
    invBindMatrices: Float32Array;
    bindShapeMatrix: Float32Array;
    skeletonRootNodes: ColladaVisualSceneNode[];
    bones: ColladaConverterBone[];
    boneWeights: Float32Array;
    boneIndices: Uint32Array;

    constructor() {
        this.jointSids = null;
        this.invBindMatrices = null;
        this.skeletonRootNodes = null;
        this.bones = null;
    }

    static createSkin(instanceController: ColladaInstanceController, context: ColladaConverterContext): ColladaConverterSkin {

        // Controller element
        var controller: ColladaController = ColladaController.fromLink(instanceController.controller, context);
        if (controller === null) {
            context.log.write("Controller instance has no controller, skin ignored", LogLevel.Error);
            return null;
        }

        // Skin element
        var skin: ColladaSkin = controller.skin;
        if (skin === null) {
            context.log.write("Controller has no skin, skin ignored", LogLevel.Error);
            return null;
        }

        // Skeleton root nodes
        var skeletonLinks: Link[] = instanceController.skeletons;
        var skeletonRootNodes: ColladaVisualSceneNode[];
        for (var i: number = 0; i < skeletonLinks.length; i++) {
            var skeletonLink: Link = skeletonLinks[i];
            var skeletonRootNode: ColladaVisualSceneNode = ColladaVisualSceneNode.fromLink(skeletonLink, context);
            if (skeletonRootNode === null) {
                context.log.write("Skeleton root node " + skeletonLink.getUrl() + " not found, skeleton ignored", LogLevel.Warning);
                continue;
            }
            skeletonRootNodes.push(skeletonRootNode);
        }
        if (skeletonRootNodes.length === 0) {
            context.log.write("Controller has no skeleton, skin ignored", LogLevel.Error);
            return null;
        }
        
        // Joints
        var jointsElement: ColladaSkinJoints = skin.joints;
        if (jointsElement === null) {
            context.log.write("Skin has no joints element, skin ignored", LogLevel.Warning);
            return null;
        }
        var jointsInput: ColladaInput = jointsElement.joints;
        if (jointsInput === null) {
            context.log.write("Skin has no joints input, skin ignored", LogLevel.Warning);
            return null;
        }
        var jointsSource: ColladaSource = ColladaSource.fromLink(jointsInput.source, context);
        if (jointsSource === null) {
            context.log.write("Skin has no joints source, skin ignored", LogLevel.Warning);
            return null;
        }
        var jointSids: string[] = <string[]>jointsSource.data;

        // InvBindMatrices
        var invBindMatricesInput: ColladaInput = jointsElement.invBindMatrices;
        if (invBindMatricesInput === null) {
            context.log.write("Skin has no inverse bind matrix input, skin ignored", LogLevel.Warning);
            return null;
        }
        var invBindMatricesSource: ColladaSource = ColladaSource.fromLink(invBindMatricesInput.source, context);
        if (jointsSource === null) {
            context.log.write("Skin has no inverse bind matrix source, skin ignored", LogLevel.Warning);
            return null;
        }
        if (invBindMatricesSource.data.length !== jointsSource.data.length * 16) {
            context.log.write("Skin has an inconsistent length of joint data sources, skin ignored", LogLevel.Warning);
            return null;
        }
        if (!(invBindMatricesSource.data instanceof Float32Array)) {
            context.log.write("Skin inverse bind matrices data does not contain floating point data, skin ignored", LogLevel.Warning);
            return null;
        }
        var invBindMatrices: Float32Array = <Float32Array> invBindMatricesSource.data;

        // Vertex weights
        var weightsElement: ColladaVertexWeights = skin.vertexWeights;
        if (weightsElement === null) {
            context.log.write("Skin contains no bone weights element, skin ignored", LogLevel.Warning);
            return null;
        }
        var weightsInput = weightsElement.weights;
        if (weightsInput === null) {
            context.log.write("Skin contains no bone weights input, skin ignored", LogLevel.Warning);
            return null;
        }
        var weightsSource: ColladaSource = ColladaSource.fromLink(weightsInput.source, context);
        if (weightsSource === null) {
            context.log.write("Skin has no bone weights source, skin ignored", LogLevel.Warning);
            return null;
        }
        if (!(weightsSource.data instanceof Float32Array)) {
            context.log.write("Bone weights data does not contain floating point data, skin ignored", LogLevel.Warning);
            return null;
        }
        var boneWeights: Float32Array = <Float32Array> weightsSource.data;

        // Bones
        var bones: ColladaConverterBone[] = ColladaConverterBone.createSkinBones(jointSids, skeletonRootNodes, invBindMatrices, context);
        if (bones === null || bones.length === 0) {
            context.log.write("Skin contains no bones, skin ignored", LogLevel.Warning);
            return null;
        }

        // Output
        var result: ColladaConverterSkin = new ColladaConverterSkin();
        result.jointSids = jointSids;
        result.invBindMatrices = invBindMatrices;
        result.skeletonRootNodes = skeletonRootNodes;
        result.bones = bones;
        result.boneWeights = boneWeights;
        result.bindShapeMatrix = skin.bindShapeMatrix;
        return result;
    }
}