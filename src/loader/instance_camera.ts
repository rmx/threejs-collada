/// <reference path="context.ts" />
/// <reference path="element.ts" />
/// <reference path="utils.ts" />

module COLLADA.Loader {

    export class InstanceCamera extends COLLADA.Loader.Element {
        camera: Link;

        constructor() {
            super();
            this.camera = null;
        }

        /**
        *   Parses a <instance_light> element.
        */
        static parse(node: Node, parent: COLLADA.Loader.VisualSceneNode, context: COLLADA.Loader.Context): COLLADA.Loader.InstanceCamera {
            var result: COLLADA.Loader.InstanceCamera = new COLLADA.Loader.InstanceCamera();

            result.camera = context.getAttributeAsUrlLink(node, "url", true);
            result.sid = context.getAttributeAsString(node, "sid", null, false);
            result.name = context.getAttributeAsString(node, "name", null, false);
            context.registerSidTarget(result, parent);

            Utils.forEachChild(node, function (child: Node) {
                switch (child.nodeName) {
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