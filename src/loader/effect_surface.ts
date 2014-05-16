/// <reference path="context.ts" />
/// <reference path="element.ts" />

/**
*   A <surface> element.
*
*/
class ColladaEffectSurface extends ColladaElement {
    type: string;
    initFrom: Link;
    format: string;
    size: Float32Array;
    viewportRatio: Float32Array;
    mipLevels: number;
    mipmapGenerate: boolean;

    constructor() {
        super();
        this.type = null;
        this.initFrom = null;
        this.format = null;
        this.size = null;
        this.viewportRatio = null;
        this.mipLevels = null;
        this.mipmapGenerate = null;
    }

    static fromLink(link: Link, context: ColladaProcessingContext): ColladaEffectSurface {
        return ColladaElement._fromLink<ColladaEffectSurface>(link, ColladaEffectSurface, "ColladaEffectSurface", context);
    }

    /**
    *   Parses a <surface> element.
    */
    static parse(node: Node, parent: ColladaElement, context: ColladaParsingContext): ColladaEffectSurface {
        var result: ColladaEffectSurface = new ColladaEffectSurface();

        result.type = context.getAttributeAsString(node, "type", null, true);

        Utils.forEachChild(node, function (child: Node) {
            switch (child.nodeName) {
                case "init_from":
                    result.initFrom = context.createUrlLink(child.textContent);
                    break;
                case "format":
                    result.format = child.textContent;
                    break;
                case "size":
                    result.size = context.strToFloats(child.textContent);
                    break;
                case "viewport_ratio":
                    result.viewportRatio = context.strToFloats(child.textContent);
                    break;
                case "mip_levels":
                    result.mipLevels = parseInt(child.textContent, 10);
                    break;
                case "mipmap_generate":
                    result.mipmapGenerate = (child.textContent === "True");
                    break;
                default:
                    context.reportUnexpectedChild(child);
            }
        });

        return result;
    }
}