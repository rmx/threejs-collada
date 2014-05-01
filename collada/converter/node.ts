
class ColladaConverterNode {
    parent: ColladaConverterNode;
    children: ColladaConverterNode[];
    geometries: ColladaConverterGeometry[];
    matrix: Mat4;
    worldMatrix: Mat4;

    constructor() {
        this.parent = null;
        this.children = [];
        this.geometries = [];
        this.matrix = mat4.create();
        this.worldMatrix = mat4.create();
    }

    getWorldMatrix(): Mat4 {
        if (this.parent != null) {
            mat4.multiply(this.worldMatrix, this.parent.getWorldMatrix(), this.worldMatrix);
        } else {
            mat4.copy(this.worldMatrix, this.matrix);
        }
        return this.worldMatrix;
    }

    /**
    * Returns true if this node contains any scene graph items (geometry, lights, cameras, ...)
    */
    containsSceneGraphItems(): boolean {
        if (this.geometries.length > 0) {
            return true;
        } else {
            return false;
        }
    }

    /**
    * Removes all nodes from that list that are not relevant for the scene graph
    */
    static pruneNodes(nodes: ColladaConverterNode[], context: ColladaProcessingContext) {
        // Prune all children recursively
        for (var n: number = 0; n < nodes.length; ++n) {
            var node: ColladaConverterNode = nodes[n];
            ColladaConverterNode.pruneNodes(node.children, context);
        }

        // Remove all nodes from the list that are not relevant
        nodes = nodes.filter((value: ColladaConverterNode, index: number, array: ColladaConverterNode[]) =>
            (value.containsSceneGraphItems() || value.children.length > 0));
    }

    /**
    * Recursively creates a converter node tree from the given collada node root node
    */
    static createNode(node: ColladaVisualSceneNode, context: ColladaConverterContext): ColladaConverterNode {
        // Create new node
        var converterNode: ColladaConverterNode = new ColladaConverterNode();
        context.registerNode(node, converterNode);

        // Create children before processing data 
        for (var i: number = 0; i < node.children.length; i++) {
            var colladaChild: ColladaVisualSceneNode = node.children[i];
            var converterChild: ColladaConverterNode = ColladaConverterNode.createNode(colladaChild, context);
            converterChild.parent = converterNode;
            converterNode.children.push(converterChild);
        }

        // Static geometries (<instance_geometry>)
        for (var i: number = 0; i < node.geometries.length; i++) {
            var colladaGeometry: ColladaInstanceGeometry = node.geometries[i];
            var converterGeometry: ColladaConverterGeometry = ColladaConverterGeometry.createStatic(colladaGeometry, context);
            converterNode.geometries.push(converterGeometry);
        }

        // Animated geometries (<instance_controller>)
        for (var i: number = 0; i < node.controllers.length; i++) {
            var colladaController: ColladaInstanceController = node.controllers[i];
            var converterGeometry: ColladaConverterGeometry = ColladaConverterGeometry.createAnimated(colladaController, context);
            converterNode.geometries.push(converterGeometry);
        }

        // Lights, cameras
        if (node.lights.length > 0) {
            context.log.write("Node " + node.id + " contains lights, lights are ignored", LogLevel.Warning);
        }
        if (node.cameras.length > 0) {
            context.log.write("Node " + node.id + " contains cameras, cameras are ignored", LogLevel.Warning);
        }

        // Node transform
        node.getTransformMatrix(converterNode.matrix, context);

        return converterNode;
    }
}