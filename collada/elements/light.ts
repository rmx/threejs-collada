
class ColladaLight extends ColladaElement {
    type: string;
    color: Float32Array;
    params: { [s: string]: ColladaLightParam; }

    constructor() {
        super();
        this.type = null;
        this.color = null;
        this.params = {};
    }

    /**
    *   Parses a <light> element.
    */
    static parse(node: Node, context: ColladaParsingContext): ColladaLight {
        var result: ColladaLight = new ColladaLight();

        result.id = context.getAttributeAsString(node, "id", null, true);
        result.name = context.getAttributeAsString(node, "name", null, false);
        context.registerUrlTarget(result, false);

        Utils.forEachChild(node, function (child: Node) {
            switch (child.nodeName) {
                case "technique_common":
                    ColladaLight.parseTechniqueCommon(child, result, context);
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
    static parseTechniqueCommon(node: Node, light: ColladaLight, context: ColladaParsingContext) {

        Utils.forEachChild(node, function (child: Node) {
            switch (child.nodeName) {
                case "ambient":
                case "directional":
                case "point":
                case "spot":
                    ColladaLight.parseParams(child, light, "COMMON", context);
                    break;
                default:
                    context.reportUnexpectedChild(child);
            }
        });

    }

    /**
    *   Parses a <light>/<technique_common>/(<ambient>|<directional>|<point>|<spot>) element.
    */
    static parseParams(node: Node, light: ColladaLight, profile: string, context: ColladaParsingContext) {

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
                    var param: ColladaLightParam = ColladaLightParam.parse(child, context);
                    context.registerSidTarget(param, light);
                    light.params[param.name] = param;
                    break;
                default:
                    context.reportUnexpectedChild(child);
            }
        });

    }

}