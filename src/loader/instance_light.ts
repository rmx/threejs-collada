/// <reference path="context.ts" />
/// <reference path="element.ts" />
/// <reference path="utils.ts" />

module COLLADA.Loader {

    export class InstanceLight extends COLLADA.Loader.Element {
        light: Link;

        constructor() {
            super();
            this.light = null;
        }

        /**
        *   Parses a <instance_light> element.
        */
        static parse(node: Node, parent: COLLADA.Loader.VisualSceneNode, context: COLLADA.Loader.Context): COLLADA.Loader.InstanceLight {
            var result: COLLADA.Loader.InstanceLight = new COLLADA.Loader.InstanceLight();

            result.light = context.getAttributeAsUrlLink(node, "url", true);
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