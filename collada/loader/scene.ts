/// <reference path="element.ts" />
/// <reference path="utils.ts" />

/**
*   A <scene> element.
*
*/
class ColladaScene extends ColladaElement {
    instance: Link;

    constructor() {
        super();
        this.instance = null;
    }

    static parse(node: Node, context: ColladaParsingContext): ColladaScene {
        var result: ColladaScene = new ColladaScene();

        Utils.forEachChild(node, function (child: Node) {
            switch (child.nodeName) {
                case "instance_visual_scene":
                    result.instance = context.getAttributeAsUrlLink(child, "url", true);
                    break;
                default:
                    context.reportUnexpectedChild(child);
                    break;
            }
        });

        return result;
    }
};