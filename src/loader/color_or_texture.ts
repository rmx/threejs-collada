/// <reference path="context.ts" />
/// <reference path="element.ts" />
/// <reference path="utils.ts" />

class ColladaColorOrTexture extends ColladaElement {
    color: Float32Array;
    textureSampler: Link;
    texcoord: string;
    opaque: string;
    bumptype: string;

    constructor() {
        super();
        this.color = null;
        this.textureSampler = null;
        this.texcoord = null;
        this.opaque = null;
        this.bumptype = null;
    }

    /**
    *   Parses a color or texture element  (<ambient>, <diffuse>, ...).
    */
    static parse(node: Node, parent: ColladaElement, context: ColladaParsingContext): ColladaColorOrTexture {
        var result: ColladaColorOrTexture = new ColladaColorOrTexture();

        result.opaque = context.getAttributeAsString(node, "opaque", null, false);
        result.bumptype = context.getAttributeAsString(node, "bumptype", null, false);

        Utils.forEachChild(node, function (child: Node) {
            switch (child.nodeName) {
                case "color":
                    result.color = context.strToColor(child.textContent);
                    break;
                case "texture":
                    result.textureSampler = context.getAttributeAsFxLink(child, "texture", parent, true);
                    result.texcoord = context.getAttributeAsString(child, "texcoord", null, true);
                    break;
                default:
                    context.reportUnexpectedChild(child);
            }
        });

        return result;
    }
}