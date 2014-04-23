
class ColladaController extends ColladaElement {
    skin: ColladaSkin;
    morph: ColladaMorph;

    constructor() {
        super();
        this.skin = null;
        this.morph = null;
    }

    static fromLink(link: Link, context: ColladaProcessingContext): ColladaController {
        return ColladaElement.fromLink<ColladaController>(link, ColladaController, "ColladaController", context);
    }

    /**
    *   Parses a <controller> element.
    */
    static parse(node: Node, context: ColladaParsingContext): ColladaController {
        var result: ColladaController = new ColladaController();

        result.id = context.getAttributeAsString(node, "id", null, true);
        result.name = context.getAttributeAsString(node, "name", null, false);
        context.registerUrlTarget(result, true);

        Utils.forEachChild(node, function (child: Node) {
            switch (child.nodeName) {
                case "skin":
                    if (result.skin != null) {
                        context.log.write("Controller " + result.id + " has multiple skins", LogLevel.Error);
                    }
                    result.skin = ColladaSkin.parse(child, context);
                    break;
                case "morph":
                    if (result.morph != null) {
                        context.log.write("Controller " + result.id + " has multiple morphs", LogLevel.Error);
                    }
                    result.morph = ColladaMorph.parse(child, context);
                    break;
                default:
                    context.reportUnexpectedChild(child);
            }
        });

        return result;
    }

}