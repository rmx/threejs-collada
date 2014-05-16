/// <reference path="context.ts" />
/// <reference path="element.ts" />

class ColladaMaterial extends ColladaElement {
    effect: Link;

    constructor() {
        super();
        this.effect = null;
    }

    static fromLink(link: Link, context: ColladaProcessingContext): ColladaMaterial {
        return ColladaElement._fromLink<ColladaMaterial>(link, ColladaMaterial, "ColladaMaterial", context);
    }

    /**
    *   Parses a <material> element.
    */
    static parse(node: Node, context: ColladaParsingContext): ColladaMaterial {
        var result: ColladaMaterial = new ColladaMaterial();

        result.id = context.getAttributeAsString(node, "id", null, true);
        result.name = context.getAttributeAsString(node, "name", null, false);
        context.registerUrlTarget(result, true);

        Utils.forEachChild(node, function (child: Node) {
            switch (child.nodeName) {
                case "instance_effect":
                    result.effect = context.getAttributeAsUrlLink(child, "url", true);
                    break;
                default:
                    context.reportUnexpectedChild(child);
            }
        });

        return result;
    }
};