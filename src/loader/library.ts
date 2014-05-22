/// <reference path="context.ts" />
/// <reference path="element.ts" />
/// <reference path="utils.ts" />

module COLLADA.Loader {

    export class Library<T extends COLLADA.Loader.Element> {
        children: T[];


        constructor() {
            this.children = [];
        }

        static parse<T extends COLLADA.Loader.Element>(node: Node, parser: (child: Node, context: COLLADA.Loader.Context) => T, childName: string, context: COLLADA.Loader.Context): COLLADA.Loader.Library<T> {
            var result: COLLADA.Loader.Library<T> = new COLLADA.Loader.Library<T>();

            Utils.forEachChild(node, function (child: Node) {
                switch (child.nodeName) {
                    case childName:
                        result.children.push(parser(child, context));
                        break;
                    case "extra":
                        context.reportUnhandledChild(child);
                        break;
                    default:
                        context.reportUnexpectedChild(child);
                        break;
                }
            });

            return result;
        }
    }
}