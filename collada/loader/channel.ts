
class ColladaChannel extends ColladaElement {
    source: UrlLink;
    target: SidLink;

    constructor() {
        super();
        this.source = null;
        this.target = null;
    }

    /**
    *   Parses a <channel> element.
    */
    static parse(node: Node, parent: ColladaAnimation, context: ColladaParsingContext): ColladaChannel {
        var result: ColladaChannel = new ColladaChannel();

        result.source = context.getAttributeAsUrlLink(node, "source", true);
        result.target = context.getAttributeAsSidLink(node, "target", parent.id, true);

        Utils.forEachChild(node, function (child: Node) {
            switch (child.nodeName) {
                default:
                    context.reportUnexpectedChild(child);
            }
        });

        return result;
    }

}