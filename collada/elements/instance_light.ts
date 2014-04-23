
class ColladaInstanceLight extends ColladaElement {
    light: Link;

    constructor() {
        super();
        this.light = null;
    }

    /**
    *   Parses a <instance_light> element.
    */
    static parse(node: Node, parent:ColladaVisualSceneNode, context: ColladaParsingContext): ColladaInstanceLight {
        var result: ColladaInstanceLight = new ColladaInstanceLight();

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