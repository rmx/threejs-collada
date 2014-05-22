/// <reference path="../external/gl-matrix.i.ts" />
/// <reference path="../math.ts" />
/// <reference path="context.ts" />
/// <reference path="geometry.ts" />
/// <reference path="transform.ts" />

module COLLADA.Converter {

    export class Node {
        name: string;
        parent: COLLADA.Converter.Node;
        children: COLLADA.Converter.Node[];
        geometries: COLLADA.Converter.Geometry[];
        transformations: COLLADA.Converter.Transform[];
        matrix: Mat4;
        worldMatrix: Mat4;

        constructor() {
            this.name = "";
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
            mat4.identity(this.matrix);

            for (var i: number = 0; i < this.transformations.length; i++) {
                var transform: COLLADA.Converter.Transform = this.transformations[i];
                transform.applyTransformation(this.matrix);
            }

            return this.matrix;
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
        isAnimated(recursive: boolean): boolean {
            return this.isAnimatedBy(null, recursive);
        }

        /**
        * Returns whether there the given animation targets the transformation of this node
        */
        isAnimatedBy(animation: COLLADA.Converter.Animation, recursive: boolean): boolean {

            for (var i: number = 0; i < this.transformations.length; i++) {
                var transform: COLLADA.Converter.Transform = this.transformations[i];
                if (transform.isAnimatedBy(animation)) return true;
            }
            if (recursive && this.parent !== null) {
                return this.parent.isAnimatedBy(animation, recursive);
            }
            return false;
        }

        resetAnimation(): void {
            for (var i: number = 0; i < this.transformations.length; i++) {
                var transform: COLLADA.Converter.Transform = this.transformations[i];
                transform.resetAnimation();
            }
        }

        /**
        * Removes all nodes from that list that are not relevant for the scene graph
        */
        static pruneNodes(nodes: COLLADA.Converter.Node[], context: COLLADA.Context) {
            // Prune all children recursively
            for (var n: number = 0; n < nodes.length; ++n) {
                var node: COLLADA.Converter.Node = nodes[n];
                COLLADA.Converter.Node.pruneNodes(node.children, context);
            }

            // Remove all nodes from the list that are not relevant
            nodes = nodes.filter((value: COLLADA.Converter.Node, index: number, array: COLLADA.Converter.Node[]) =>
                (value.containsSceneGraphItems() || value.children.length > 0));
        }

        /**
        * Recursively creates a converter node tree from the given collada node root node
        */
        static createNode(node: COLLADA.Loader.VisualSceneNode, context: COLLADA.Converter.Context): COLLADA.Converter.Node {
            // Create new node
            var converterNode: COLLADA.Converter.Node = new COLLADA.Converter.Node();
            context.nodes.register(node, converterNode);

            converterNode.name = node.name || node.id || node.sid || "Unnamed node";

            // Node transform
            for (var i = 0; i < node.transformations.length; ++i) {
                var transform: COLLADA.Loader.NodeTransform = node.transformations[i];
                var converterTransform: COLLADA.Converter.Transform = null;
                switch (transform.type) {
                    case "matrix":
                        converterTransform = new COLLADA.Converter.TransformMatrix(transform);
                        break;
                    case "rotate":
                        converterTransform = new COLLADA.Converter.TransformRotate(transform);
                        break;
                    case "translate":
                        converterTransform = new COLLADA.Converter.TransformTranslate(transform);
                        break;
                    case "scale":
                        converterTransform = new COLLADA.Converter.TransformScale(transform);
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

            // Create children
            for (var i: number = 0; i < node.children.length; i++) {
                var colladaChild: COLLADA.Loader.VisualSceneNode = node.children[i];
                var converterChild: COLLADA.Converter.Node = COLLADA.Converter.Node.createNode(colladaChild, context);
                converterChild.parent = converterNode;
                converterNode.children.push(converterChild);
            }

            return converterNode;
        }

        static createNodeData(converter_node: COLLADA.Converter.Node, context: COLLADA.Converter.Context) {

            var collada_node: COLLADA.Loader.VisualSceneNode = context.nodes.findCollada(converter_node);

            // Static geometries (<instance_geometry>)
            for (var i: number = 0; i < collada_node.geometries.length; i++) {
                var loaderGeometry: COLLADA.Loader.InstanceGeometry = collada_node.geometries[i];
                var converterGeometry: COLLADA.Converter.Geometry = COLLADA.Converter.Geometry.createStatic(loaderGeometry, context);
                converter_node.geometries.push(converterGeometry);
            }

            // Animated geometries (<instance_controller>)
            for (var i: number = 0; i < collada_node.controllers.length; i++) {
                var loaderController: COLLADA.Loader.InstanceController = collada_node.controllers[i];
                var converterGeometry: COLLADA.Converter.Geometry = COLLADA.Converter.Geometry.createAnimated(loaderController, context);
                converter_node.geometries.push(converterGeometry);
            }

            // Lights, cameras
            if (collada_node.lights.length > 0) {
                context.log.write("Node " + collada_node.id + " contains lights, lights are ignored", LogLevel.Warning);
            }
            if (collada_node.cameras.length > 0) {
                context.log.write("Node " + collada_node.id + " contains cameras, cameras are ignored", LogLevel.Warning);
            }

            // Children
            for (var i: number = 0; i < converter_node.children.length; i++) {
                var child: COLLADA.Converter.Node = converter_node.children[i];
                COLLADA.Converter.Node.createNodeData(child, context);
            }
        }

        /**
        * Calls the given function for all given nodes and their children (recursively)
        */
        static forEachNode(nodes: COLLADA.Converter.Node[], fn: (node: COLLADA.Converter.Node) => void) {

            for (var i: number = 0; i < nodes.length; ++i) {
                var node: COLLADA.Converter.Node = nodes[i];
                fn(node);
                COLLADA.Converter.Node.forEachNode(node.children, fn);
            }
        }

        /**
        * Extracts all geometries in the given scene and merges them into a single geometry.
        * The geometries are detached from their original nodes in the process.
        */
        static extractGeometries(scene_nodes: COLLADA.Converter.Node[], context: COLLADA.Converter.Context): COLLADA.Converter.Geometry[] {

            // Collect all geometries and the corresponding nodes
            // Detach geometries from nodes in the process
            var nodes: COLLADA.Converter.Node[] = [];
            var geometries: COLLADA.Converter.Geometry[] = [];
            COLLADA.Converter.Node.forEachNode(scene_nodes, (node) => {
                for (var i: number = 0; i < node.geometries.length; ++i) {
                    nodes.push(node);
                    geometries.push(node.geometries[i]);
                    node.geometries = [];
                }
            });

            if (geometries.length === 0) {
                context.log.write("No geometry found in the scene, returning an empty geometry", LogLevel.Warning);
                var geometry: COLLADA.Converter.Geometry = new COLLADA.Converter.Geometry();
                geometry.name = "empty_geometry";
                return [geometry];
            }

            // Apply the node transformation to static geometries
            // A geometry is static if it is not skinned and attached to a static node
            for (var i: number = 0; i < geometries.length; ++i) {
                var geometry: COLLADA.Converter.Geometry = geometries[i];
                var node: COLLADA.Converter.Node = nodes[i];
                var is_static: boolean = ((geometry.bones.length === 0) && (!node.isAnimated(true)));
                if (is_static) {
                    COLLADA.Converter.Geometry.transformGeometry(geometry, node.getWorldMatrix(), context);
                }
            }

            // Merge all geometries
            if (context.options.singleGeometry) {
                var geometry: COLLADA.Converter.Geometry = COLLADA.Converter.Geometry.mergeGeometries(geometries, context);
                geometries = [geometry];
            }

            return geometries;
        }
    }
}