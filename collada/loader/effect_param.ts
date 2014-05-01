
/**
*   An <newparam> element.
*
*/
class ColladaEffectParam extends ColladaElement {
    semantic: string;
    surface: ColladaEffectSurface;
    sampler: ColladaEffectSampler;
    floats: Float32Array;

    constructor() {
        super();
        this.semantic = null;
        this.surface = null;
        this.sampler = null;
        this.floats = null;
    }

    static fromLink(link: Link, context: ColladaProcessingContext): ColladaEffectParam {
        return ColladaElement._fromLink<ColladaEffectParam>(link, ColladaEffectParam, "ColladaEffectParam", context);
    }

    /**
    *   Parses a <newparam> element.
    */
    static parse(node: Node, parent:ColladaElement, context: ColladaParsingContext): ColladaEffectParam {
        var result: ColladaEffectParam = new ColladaEffectParam();

        result.sid = context.getAttributeAsString(node, "sid", null, false);
        context.registerFxTarget(result, parent);

        Utils.forEachChild(node, function (child: Node) {
            switch (child.nodeName) {
                case "semantic":
                    result.semantic = child.textContent;
                    break;
                case "float":
                    result.floats = context.strToFloats(child.textContent);
                    break;
                case "float2":
                    result.floats = context.strToFloats(child.textContent);
                    break;
                case "float3":
                    result.floats = context.strToFloats(child.textContent);
                    break;
                case "float4":
                    result.floats = context.strToFloats(child.textContent);
                    break;
                case "surface":
                    result.surface = ColladaEffectSurface.parse(child, result, context);
                    break;
                case "sampler2D":
                    result.sampler = ColladaEffectSampler.parse(child, result, context);
                    break;
                default:
                    context.reportUnexpectedChild(child);
            }
        });

        return result;
    }
}