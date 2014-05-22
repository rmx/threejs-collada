/// <reference path="context.ts" />
/// <reference path="element.ts" />
/// <reference path="light_param.ts" />
/// <reference path="utils.ts" />

module COLLADA.Loader {

    export class Light extends COLLADA.Loader.Element {
        type: string;
        color: Float32Array;
        params: { [s: string]: COLLADA.Loader.LightParam; }

    constructor() {
            super();
            this.type = null;
            this.color = null;
            this.params = {};
        }

        /**
        *   Parses a <light> element.
        */
        static parse(node: Node, context: COLLADA.Loader.Context): COLLADA.Loader.Light {
            var result: COLLADA.Loader.Light = new COLLADA.Loader.Light();

            result.id = context.getAttributeAsString(node, "id", null, true);
            result.name = context.getAttributeAsString(node, "name", null, false);
            context.registerUrlTarget(result, false);

            Utils.forEachChild(node, function (child: Node) {
                switch (child.nodeName) {
                    case "technique_common":
                        COLLADA.Loader.Light.parseTechniqueCommon(child, result, context);
                        break;
                    case "extra":
                        context.reportUnhandledChild(child);
                        break;
                    default:
                        context.reportUnexpectedChild(child);
                }
            });

            return result;
        }

        /**
        *   Parses a <light>/<technique_common> element.
        */
        static parseTechniqueCommon(node: Node, light: COLLADA.Loader.Light, context: COLLADA.Loader.Context) {

            Utils.forEachChild(node, function (child: Node) {
                switch (child.nodeName) {
                    case "ambient":
                    case "directional":
                    case "point":
                    case "spot":
                        COLLADA.Loader.Light.parseParams(child, light, "COMMON", context);
                        break;
                    default:
                        context.reportUnexpectedChild(child);
                }
            });

        }

        /**
        *   Parses a <light>/<technique_common>/(<ambient>|<directional>|<point>|<spot>) element.
        */
        static parseParams(node: Node, light: COLLADA.Loader.Light, profile: string, context: COLLADA.Loader.Context) {

            light.type = node.nodeName;

            Utils.forEachChild(node, function (child: Node) {
                switch (child.nodeName) {
                    case "color":
                        light.color = context.strToFloats(child.textContent);
                        break;
                    case "constant_attenuation":
                    case "linear_attenuation":
                    case "quadratic_attenuation":
                    case "falloff_angle":
                    case "falloff_exponent":
                        var param: COLLADA.Loader.LightParam = COLLADA.Loader.LightParam.parse(child, context);
                        context.registerSidTarget(param, light);
                        light.params[param.name] = param;
                        break;
                    default:
                        context.reportUnexpectedChild(child);
                }
            });

        }

    }
}