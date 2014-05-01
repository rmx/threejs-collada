/// <reference path="element.ts" />
/// <reference path="utils.ts" />
/// <reference path="../context.ts" />
/// <reference path="visual_scene_node.ts" />

/**
*   An <visual_scene> element.
*
*/
class ColladaVisualScene extends ColladaElement {

    children: ColladaVisualSceneNode[];

    constructor() {
        super();
        this.children = [];
    }

    static fromLink(link: Link, context: ColladaProcessingContext): ColladaVisualScene {
        return ColladaElement._fromLink<ColladaVisualScene>(link, ColladaVisualScene, "ColladaVisualScene", context);
    }

    static parse(node: Node, context: ColladaParsingContext): ColladaVisualScene {
        var result: ColladaVisualScene = new ColladaVisualScene();

        result.id = context.getAttributeAsString(node, "id", null, false);

        context.registerUrlTarget(result, false);

        Utils.forEachChild(node, function (child: Node) {
            switch (child.nodeName) {
                case "node":
                    var childNode: ColladaVisualSceneNode = ColladaVisualSceneNode.parse(child, context);
                    ColladaVisualSceneNode.registerParent(childNode, result, context);
                    result.children.push(childNode);
                    break;
                default:
                    context.reportUnexpectedChild(child);
                    break;
            }
        });

        return result;
    }
};