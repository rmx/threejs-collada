/// <reference path="context.ts" />
/// <reference path="element.ts" />
/// <reference path="instance_camera.ts" />
/// <reference path="instance_controller.ts" />
/// <reference path="instance_geometry.ts" />
/// <reference path="instance_light.ts" />
/// <reference path="node_transform.ts" />
/// <reference path="utils.ts" />


module COLLADA.Loader {

    /**
    *   A <node> element (child of <visual_scene>, <library_nodes>, or another <node>).
    */
    export class VisualSceneNode extends COLLADA.Loader.Element {
        type: string;
        layer: string;
        children: COLLADA.Loader.VisualSceneNode[];
        parent: COLLADA.Loader.Element;
        transformations: COLLADA.Loader.NodeTransform[];
        geometries: COLLADA.Loader.InstanceGeometry[];
        controllers: COLLADA.Loader.InstanceController[];
        lights: COLLADA.Loader.InstanceLight[];
        cameras: COLLADA.Loader.InstanceCamera[];

        constructor() {
            super();
            this.type = null;
            this.layer = null;
            this.children = [];
            this.parent = null;
            this.transformations = [];
            this.geometries = [];
            this.controllers = [];
            this.lights = [];
            this.cameras = [];
        }

        static fromLink(link: Link, context: COLLADA.Context): COLLADA.Loader.VisualSceneNode {
            return COLLADA.Loader.Element._fromLink<COLLADA.Loader.VisualSceneNode>(link, COLLADA.Loader.VisualSceneNode, "COLLADA.Loader.VisualSceneNode", context);
        }

        static registerParent(child: COLLADA.Loader.VisualSceneNode, parent: COLLADA.Loader.Element, context: COLLADA.Loader.Context) {
            child.parent = parent;
            context.registerSidTarget(child, parent);
        }

        static parse(node: Node, context: COLLADA.Loader.Context): COLLADA.Loader.VisualSceneNode {
            var result: COLLADA.Loader.VisualSceneNode = new COLLADA.Loader.VisualSceneNode();

            result.id = context.getAttributeAsString(node, "id", null, false);
            result.sid = context.getAttributeAsString(node, "sid", null, false);
            result.name = context.getAttributeAsString(node, "name", null, false);
            result.type = context.getAttributeAsString(node, "type", null, false);
            result.layer = context.getAttributeAsString(node, "layer", null, false);

            context.registerUrlTarget(result, false);

            Utils.forEachChild(node, function (child: Node) {
                switch (child.nodeName) {
                    case "instance_geometry":
                        result.geometries.push(COLLADA.Loader.InstanceGeometry.parse(child, result, context));
                        break;
                    case "instance_controller":
                        result.controllers.push(COLLADA.Loader.InstanceController.parse(child, result, context));
                        break;
                    case "instance_light":
                        result.lights.push(COLLADA.Loader.InstanceLight.parse(child, result, context));
                        break;
                    case "instance_camera":
                        result.cameras.push(COLLADA.Loader.InstanceCamera.parse(child, result, context));
                        break;
                    case "matrix":
                    case "rotate":
                    case "translate":
                    case "scale":
                        result.transformations.push(COLLADA.Loader.NodeTransform.parse(child, result, context));
                        break;
                    case "node":
                        var childNode: COLLADA.Loader.VisualSceneNode = COLLADA.Loader.VisualSceneNode.parse(child, context);
                        COLLADA.Loader.VisualSceneNode.registerParent(childNode, result, context);
                        result.children.push(childNode);
                        break;
                    case "extra":
                        context.reportUnhandledChild(child);
                        break;
                    default:
                        context.reportUnexpectedChild(child);
                }
            });

            return result;
        }
    };
}