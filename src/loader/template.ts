/// <reference path="context.ts" />
/// <reference path="element.ts" />
/// <reference path="utils.ts" />

class ColladaElementTemplate extends ColladaElement {
    member: any;

    constructor() {
        super();
        this.member = null;
    }

    /**
    *   Parses a <...> element.
    */
    static parse(node: Node, context: ColladaParsingContext): ColladaElementTemplate {
        var result: ColladaElementTemplate = new ColladaElementTemplate();

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