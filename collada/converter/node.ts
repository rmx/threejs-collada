
class ColladaConverterNode {
    parent: ColladaConverterNode;
    children: ColladaConverterNode[];
    geometries: ColladaConverterGeometry[];
    transformations: ColladaConverterTransform[];
    matrix: Mat4;
    worldMatrix: Mat4;

    constructor() {
        this.parent = null;
        this.children = [];
        this.geometries = [];
        this.transformations = [];
        this.matrix = mat4.create();
        this.worldMatrix = mat4.create();
    }

    /**
    * Returns the world transformation matrix of this node
    */
    getWorldMatrix(): Mat4 {
        if (this.parent != null) {
            mat4.multiply(this.worldMatrix, this.parent.getWorldMatrix(), this.getLocalMatrix());
        } else {
            mat4.copy(this.worldMatrix, this.getLocalMatrix());
        }
        return this.worldMatrix;
    }

    /**
    * Returns the local transformation matrix of this node
    */
    getLocalMatrix() {
        var pos: Vec3 = vec3.create();
        var rot: Quat = quat.create();
        var scl: Vec3 = vec3.create();
        this.getLocalTransform(pos, rot, scl);
        var rotpos = mat4.create();
        mat4.fromRotationTranslation(rotpos, rot, pos);
        mat4.identity(this.matrix);
        mat4.scale(this.matrix, this.matrix, scl);
        mat4.multiply(this.matrix, this.matrix, rotpos);
        return this.matrix;
    }

    /**
    * Returns the local transformation matrix of this node
    */
    getLocalTransform(pos: Vec3, rot: Quat, scl: Vec3) {
        vec3.set(pos, 0, 0, 0);
        vec3.set(scl, 1, 1, 1);
        quat.set(rot, 0, 0, 0, 1);
        for (var i: number = 0; i < this.transformations.length; i++) {
            var transform: ColladaConverterTransform = this.transformations[i];
            transform.applyTransform(pos, rot, scl);
        }
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
    * Returns whether there exists any animation that targets the transformation of this node
    */
    isAnimated(): boolean {
        for (var i: number = 0; i < this.transformations.length; i++) {
            var transform: ColladaConverterTransform = this.transformations[i];
            if (transform.isAnimated()) return true;
        }
        return false;
    }

    /**
    * Returns whether the given animation targets the given transformation of this node
    */
    isAnimatedBy(animation: ColladaConverterAnimation, type: ColladaConverterTransformType): boolean {
        for (var i: number = 0; i < this.transformations.length; i++) {
            var transform: ColladaConverterTransform = this.transformations[i];
            if (transform.isAnimatedBy(animation, type)) return true;
        }
        return false;
    }

    resetAnimation(): void {
        for (var i: number = 0; i < this.transformations.length; i++) {
            var transform: ColladaConverterTransform = this.transformations[i];
            transform.resetAnimation();
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
        context.nodes.register(node, converterNode);

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
        for (var i = 0; i < node.transformations.length; ++i) {
            var transform: ColladaNodeTransform = node.transformations[i];
            var converterTransform: ColladaConverterTransform = null;
            switch (transform.type) {
                case "matrix":
                    converterTransform = new ColladaConverterTransformMatrix(transform);
                    break;
                case "rotate":
                    converterTransform = new ColladaConverterTransformRotate(transform);
                    break;
                case "translate":
                    converterTransform = new ColladaConverterTransformTranslate(transform);
                    break;
                case "scale":
                    converterTransform = new ColladaConverterTransformScale(transform);
                    break;
                default:
                    context.log.write("Transformation type " + transform.type + " not supported, transform ignored", LogLevel.Warning);
            }
            if (converterTransform !== null) {
                context.animationTargets.register(transform, converterTransform);
                converterNode.transformations.push(converterTransform);
            }
        }
        converterNode.getLocalMatrix();

        return converterNode;
    }
}