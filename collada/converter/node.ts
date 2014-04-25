
class ColladaConverterNode {
    parent: ColladaConverterNode;
    children: ColladaConverterNode[];
    geometries: ColladaConverterGeometry[];
    matrix: Mat4;

    constructor() {
        this.parent = null;
        this.children = [];
        this.geometries = [];
        this.matrix = mat4.create();
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

    static createNodes(node: ColladaVisualSceneNode, parent: ColladaConverterNode, context: ColladaProcessingContext) {
        var geometries: ColladaConverterGeometry[] = [];

        // Static geometries (<instance_geometry>)
        for (var i: number = 0; i < node.geometries.length; i++) {
            var colladaGeometry: ColladaInstanceGeometry = node.geometries[i];
            var converterGeometry: ColladaConverterGeometry = ColladaConverterGeometry.createStatic(colladaGeometry, context);
        }

        // Animated geometries (<instance_controller>)
        for (var i: number = 0; i < node.controllers.length; i++) {
            var colladaController: ColladaInstanceController = node.controllers[i];
            var converterGeometry: ColladaConverterGeometry = ColladaConverterGeometry.createAnimated(colladaController, context);
        }

        // Lights, cameras
        if (node.lights.length > 0) {
            context.log.write("Node " + node.id + " contains lights, lights are ignored", LogLevel.Warning);
        }
        if (node.cameras.length > 0) {
            context.log.write("Node " + node.id + " contains cameras, cameras are ignored", LogLevel.Warning);
        }

        // Warn about empty nodes
        /*
        if (geometries.length === 0) {
            if (node.type !== "JOINT") {
                context.log.write("Collada node " + node.name + " did not produce any geometries", LogLevel.Warning);
            }
        }*/

        // Create new node
        var converterNode: ColladaConverterNode = new ColladaConverterNode();
        converterNode.parent = parent;
        parent.children.push(converterNode);

        // Node transform
        node.getTransformMatrix(converterNode.matrix, context);

        // Children
        for (var i: number = 0; i < node.children.length; i++) {
            var child: ColladaVisualSceneNode = node.children[i];
            ColladaConverterNode.createNodes(child, converterNode, context);
        }
    }
}