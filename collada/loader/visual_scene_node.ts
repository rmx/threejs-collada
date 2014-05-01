/// <reference path="element.ts" />

/**
*   A <node> element (child of <visual_scene>, <library_nodes>, or another <node>).
*
*/
class ColladaVisualSceneNode extends ColladaElement {
    type: string;
    layer: string;
    children: ColladaVisualSceneNode[];
    parent: ColladaElement;
    transformations: ColladaNodeTransform[];
    geometries: ColladaInstanceGeometry[];
    controllers: ColladaInstanceController[];
    lights: ColladaInstanceLight[];
    cameras: ColladaInstanceCamera[];

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

    /**
    * Returns the local transformation matrix of this node
    */
    getTransformMatrix(result: Mat4, context: ColladaProcessingContext) {
        var temp: Mat4 = mat4.create();
        mat4.identity(result);
        for (var i: number = 0; i < this.transformations.length; i++) {
            var transform: ColladaNodeTransform = this.transformations[i];
            transform.getTransformMatrix(temp, context);
            mat4.multiply(result, result, temp);
        }
    }

    static fromLink(link: Link, context: ColladaProcessingContext): ColladaVisualSceneNode {
        return ColladaElement._fromLink<ColladaVisualSceneNode>(link, ColladaVisualSceneNode, "ColladaVisualSceneNode", context);
    }

    static registerParent(child: ColladaVisualSceneNode, parent: ColladaElement, context: ColladaParsingContext) {
        child.parent = parent;
        context.registerSidTarget(child, parent);
    }

    static parse(node: Node, context: ColladaParsingContext): ColladaVisualSceneNode {
        var result: ColladaVisualSceneNode = new ColladaVisualSceneNode();

        result.id = context.getAttributeAsString(node, "id", null, false);
        result.sid = context.getAttributeAsString(node, "sid", null, false);
        result.name = context.getAttributeAsString(node, "name", null, false);
        result.type = context.getAttributeAsString(node, "type", null, false);
        result.layer = context.getAttributeAsString(node, "layer", null, false);

        context.registerUrlTarget(result, false);

        Utils.forEachChild(node, function (child: Node) {
            switch (child.nodeName) {
                case "instance_geometry":
                    result.geometries.push(ColladaInstanceGeometry.parse(child, result, context));
                    break;
                case "instance_controller":
                    result.controllers.push(ColladaInstanceController.parse(child, result, context));
                    break;
                case "instance_light":
                    result.lights.push(ColladaInstanceLight.parse(child, result, context));
                    break;
                case "instance_camera":
                    result.cameras.push(ColladaInstanceCamera.parse(child, result, context));
                    break;
                case "matrix":
                case "rotate":
                case "translate":
                case "scale":
                    result.transformations.push(ColladaNodeTransform.parse(child, result, context));
                    break;
                case "node":
                    var childNode: ColladaVisualSceneNode = ColladaVisualSceneNode.parse(child, context);
                    ColladaVisualSceneNode.registerParent(childNode, result, context);
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