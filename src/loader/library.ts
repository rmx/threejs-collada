/// <reference path="context.ts" />
/// <reference path="element.ts" />

class ColladaLibrary<T extends ColladaElement> {
    children: T[];


    constructor() {
        this.children = [];
    }

    static parse<T extends ColladaElement>(node: Node, parser: (child: Node, context: ColladaParsingContext)=>T, childName: string, context: ColladaParsingContext): ColladaLibrary<T> {
        var result: ColladaLibrary<T> = new ColladaLibrary<T>();

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