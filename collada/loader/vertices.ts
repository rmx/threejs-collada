
class ColladaVertices extends ColladaElement {
    inputs: ColladaInput[];

    constructor() {
        super();
        this.inputs = [];
    }

    static fromLink(link: Link, context: ColladaProcessingContext): ColladaVertices {
        return ColladaElement.fromLink<ColladaVertices>(link, ColladaVertices, "ColladaVertices", context);
    }

    /**
    *   Parses a <vertices> element.
    */
    static parse(node: Node, context: ColladaParsingContext): ColladaVertices {
        var result: ColladaVertices = new ColladaVertices();

        result.id = context.getAttributeAsString(node, "id", null, true);
        result.name = context.getAttributeAsString(node, "name", null, false);
        context.registerUrlTarget(result, true);

        Utils.forEachChild(node, function (child: Node) {
            switch (child.nodeName) {
                case "input":
                    result.inputs.push(ColladaInput.parse(child, false, context));
                    break;
                default:
                    context.reportUnexpectedChild(child);
            }
        });

        return result;
    }

}