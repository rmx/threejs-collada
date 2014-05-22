/// <reference path="context.ts" />
/// <reference path="element.ts" />
/// <reference path="utils.ts" />

module COLLADA.Loader {

    export class Material extends COLLADA.Loader.Element {
        effect: Link;

        constructor() {
            super();
            this.effect = null;
        }

        static fromLink(link: Link, context: COLLADA.Context): COLLADA.Loader.Material {
            return COLLADA.Loader.Element._fromLink<COLLADA.Loader.Material>(link, COLLADA.Loader.Material, "COLLADA.Loader.Material", context);
        }

        /**
        *   Parses a <material> element.
        */
        static parse(node: Node, context: COLLADA.Loader.Context): COLLADA.Loader.Material {
            var result: COLLADA.Loader.Material = new COLLADA.Loader.Material();

            result.id = context.getAttributeAsString(node, "id", null, true);
            result.name = context.getAttributeAsString(node, "name", null, false);
            context.registerUrlTarget(result, true);

            Utils.forEachChild(node, function (child: Node) {
                switch (child.nodeName) {
                    case "instance_effect":
                        result.effect = context.getAttributeAsUrlLink(child, "url", true);
                        break;
                    default:
                        context.reportUnexpectedChild(child);
                }
            });

            return result;
        }
    };
}