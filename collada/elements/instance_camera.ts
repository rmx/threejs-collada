
class ColladaInstanceCamera extends ColladaElement {
    camera: Link;

    constructor() {
        super();
        this.camera = null;
    }

    /**
    *   Parses a <instance_light> element.
    */
    static parse(node: Node, parent: ColladaVisualSceneNode, context: ColladaParsingContext): ColladaInstanceCamera {
        var result: ColladaInstanceCamera = new ColladaInstanceCamera();

        result.camera = context.getAttributeAsUrlLink(node, "url", true);
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