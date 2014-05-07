/// <reference path="context.ts" />
/// <reference path="element.ts" />
/// <reference path="effect_param.ts" />
/// <reference path="effect_technique.ts" />

/**
*   An <effect> element.
*
*/
class ColladaEffect extends ColladaElement {
    params: ColladaEffectParam[];
    technique: ColladaEffectTechnique;

    constructor() {
        super();
        this.params = [];
        this.technique = null;
    }

    static fromLink(link: Link, context: ColladaProcessingContext): ColladaEffect {
        return ColladaElement._fromLink<ColladaEffect>(link, ColladaEffect, "ColladaEffect", context);
    }

    /**
    *   Parses an <effect> element.
    */
    static parse(node: Node, context: ColladaParsingContext): ColladaEffect {
        var result: ColladaEffect = new ColladaEffect();

        result.id = context.getAttributeAsString(node, "id", null, true);
        context.registerUrlTarget(result, true);

        Utils.forEachChild(node, function (child: Node) {
            switch (child.nodeName) {
                case "profile_COMMON":
                    ColladaEffect.parseProfileCommon(child, result, context);
                    break;
                case "profile":
                    context.log.write("Skipped non-common effect profile for effect " + result.id + ".", LogLevel.Warning);
                    break;
                case "extra":
                    ColladaEffectTechnique.parseExtra(child, result.technique, context);
                    break;
                default:
                    context.reportUnexpectedChild(child);
            }
        });

        return result;
    }

    /**
    *   Parses an <effect>/<profile_COMMON> element.
    */
    static parseProfileCommon(node: Node, effect: ColladaEffect, context: ColladaParsingContext) {
        Utils.forEachChild(node, function (child: Node) {
            switch (child.nodeName) {
                case "newparam":
                    effect.params.push(ColladaEffectParam.parse(child, effect, context));
                    break;
                case "technique":
                    effect.technique = ColladaEffectTechnique.parse(child, effect, context);
                    break;
                case "extra":
                    ColladaEffectTechnique.parseExtra(child, effect.technique, context);
                    break;
                default:
                    context.reportUnexpectedChild(child);
            }
        });
    }
};