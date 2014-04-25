
class ColladaImage extends ColladaElement {
    initFrom: string;

    constructor() {
        super();
        this.initFrom = null;
    }

    /**
    *   Parses an <image> element.
    */
    static parse(node: Node, context: ColladaParsingContext): ColladaImage {
        var result: ColladaImage = new ColladaImage();

        result.id = context.getAttributeAsString(node, "id", null, true);
        context.registerUrlTarget(result, true);

        Utils.forEachChild(node, function (child: Node) {
            switch (child.nodeName) {
                case "init_from":
                    result.initFrom = child.textContent;
                    break;
                default:
                    context.reportUnexpectedChild(child);
            }
        });

        return result;
    }

}