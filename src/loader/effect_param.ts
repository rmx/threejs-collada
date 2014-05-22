/// <reference path="context.ts" />
/// <reference path="element.ts" />
/// <reference path="effect_surface.ts" />
/// <reference path="effect_sampler.ts" />
/// <reference path="utils.ts" />


module COLLADA.Loader {

    /**
    *   An <newparam> element.
    *
    */
    export class EffectParam extends COLLADA.Loader.Element {
        semantic: string;
        surface: COLLADA.Loader.EffectSurface;
        sampler: COLLADA.Loader.EffectSampler;
        floats: Float32Array;

        constructor() {
            super();
            this.semantic = null;
            this.surface = null;
            this.sampler = null;
            this.floats = null;
        }

        static fromLink(link: Link, context: COLLADA.Context): COLLADA.Loader.EffectParam {
            return COLLADA.Loader.Element._fromLink<COLLADA.Loader.EffectParam>(link, COLLADA.Loader.EffectParam, "COLLADA.Loader.EffectParam", context);
        }

        /**
        *   Parses a <newparam> element.
        */
        static parse(node: Node, parent: COLLADA.Loader.Element, context: COLLADA.Loader.Context): COLLADA.Loader.EffectParam {
            var result: COLLADA.Loader.EffectParam = new COLLADA.Loader.EffectParam();

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
                        result.surface = COLLADA.Loader.EffectSurface.parse(child, result, context);
                        break;
                    case "sampler2D":
                        result.sampler = COLLADA.Loader.EffectSampler.parse(child, result, context);
                        break;
                    default:
                        context.reportUnexpectedChild(child);
                }
            });

            return result;
        }
    }
}