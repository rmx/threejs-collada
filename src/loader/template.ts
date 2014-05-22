/// <reference path="context.ts" />
/// <reference path="element.ts" />
/// <reference path="utils.ts" />

module COLLADA.Loader {

    /**
    *   A template for a COLLADA element class. No actual use.
    */
    export class ElementTemplate extends COLLADA.Loader.Element {
        member: any;

        constructor() {
            super();
            this.member = null;
        }

        /**
        *   Parses a <...> element.
        */
        static parse(node: Node, context: COLLADA.Loader.Context): COLLADA.Loader.ElementTemplate {
            var result: COLLADA.Loader.ElementTemplate = new COLLADA.Loader.ElementTemplate();

            result.id = context.getAttributeAsString(node, "id", null, true);

            Utils.forEachChild(node, function (child: Node) {
                switch (child.nodeName) {
                    case "childnode":
                        break;
                    default:
                        context.reportUnexpectedChild(child);
                }
            });

            return result;
        }

    }
}