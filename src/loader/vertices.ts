/// <reference path="context.ts" />
/// <reference path="element.ts" />
/// <reference path="input.ts" />
/// <reference path="utils.ts" />

module COLLADA.Loader {

    export class Vertices extends COLLADA.Loader.Element {
        inputs: COLLADA.Loader.Input[];

        constructor() {
            super();
            this.inputs = [];
        }

        static fromLink(link: Link, context: COLLADA.Context): COLLADA.Loader.Vertices {
            return COLLADA.Loader.Element._fromLink<COLLADA.Loader.Vertices>(link, COLLADA.Loader.Vertices, "COLLADA.Loader.Vertices", context);
        }

        /**
        *   Parses a <vertices> element.
        */
        static parse(node: Node, context: COLLADA.Loader.Context): COLLADA.Loader.Vertices {
            var result: COLLADA.Loader.Vertices = new COLLADA.Loader.Vertices();

            result.id = context.getAttributeAsString(node, "id", null, true);
            result.name = context.getAttributeAsString(node, "name", null, false);
            context.registerUrlTarget(result, true);

            Utils.forEachChild(node, function (child: Node) {
                switch (child.nodeName) {
                    case "input":
                        result.inputs.push(COLLADA.Loader.Input.parse(child, false, context));
                        break;
                    default:
                        context.reportUnexpectedChild(child);
                }
            });

            return result;
        }

    }
}