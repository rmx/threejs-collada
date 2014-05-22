/// <reference path="context.ts" />
/// <reference path="element.ts" />
/// <reference path="visual_scene_node.ts" />
/// <reference path="utils.ts" />


module COLLADA.Loader {

    /**
    *   An <visual_scene> element.
    */
    export class VisualScene extends COLLADA.Loader.Element {

        children: COLLADA.Loader.VisualSceneNode[];

        constructor() {
            super();
            this.children = [];
        }

        static fromLink(link: Link, context: COLLADA.Context): COLLADA.Loader.VisualScene {
            return COLLADA.Loader.Element._fromLink<COLLADA.Loader.VisualScene>(link, COLLADA.Loader.VisualScene, "COLLADA.Loader.VisualScene", context);
        }

        static parse(node: Node, context: COLLADA.Loader.Context): COLLADA.Loader.VisualScene {
            var result: COLLADA.Loader.VisualScene = new COLLADA.Loader.VisualScene();

            result.id = context.getAttributeAsString(node, "id", null, false);

            context.registerUrlTarget(result, false);

            Utils.forEachChild(node, function (child: Node) {
                switch (child.nodeName) {
                    case "node":
                        var childNode: COLLADA.Loader.VisualSceneNode = COLLADA.Loader.VisualSceneNode.parse(child, context);
                        COLLADA.Loader.VisualSceneNode.registerParent(childNode, result, context);
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
}