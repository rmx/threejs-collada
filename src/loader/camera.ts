/// <reference path="context.ts" />
/// <reference path="element.ts" />
/// <reference path="camera_param.ts" />

class ColladaCamera extends ColladaElement {
    type: string;
    params: { [s: string]: ColladaCameraParam; }

    constructor() {
        super();
        this.type = null;
        this.params = {};
    }

    /**
    *   Parses a <camera> element.
    */
    static parse(node: Node, context: ColladaParsingContext): ColladaCamera {
        var result: ColladaCamera = new ColladaCamera();

        result.id = context.getAttributeAsString(node, "id", null, true);
        result.name = context.getAttributeAsString(node, "name", null, false);
        context.registerUrlTarget(result, false);

        Utils.forEachChild(node, function (child: Node) {
            switch (child.nodeName) {
                case "asset":
                    context.reportUnhandledChild(child);
                    break;
                case "optics":
                    ColladaCamera.parseOptics(child, result, context);
                    break;
                case "imager":
                    context.reportUnhandledChild(child);
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
    *   Parses a <camera>/<optics> element.
    */
    static parseOptics(node: Node, camera: ColladaCamera, context: ColladaParsingContext) {

        Utils.forEachChild(node, function (child: Node) {
            switch (child.nodeName) {
                case "technique_common":
                    ColladaCamera.parseTechniqueCommon(child, camera, context);
                    break;
                case "technique":
                    context.reportUnhandledChild(child);
                    break;
                case "extra":
                    context.reportUnhandledChild(child);
                    break;
                default:
                    context.reportUnexpectedChild(child);
            }
        });

    }

    /**
    *   Parses a <camera>/<optics>/<technique_common> element.
    */
    static parseTechniqueCommon(node: Node, camera: ColladaCamera, context: ColladaParsingContext) {

        Utils.forEachChild(node, function (child: Node) {
            switch (child.nodeName) {
                case "orthographic":
                    ColladaCamera.parseParams(child, camera, context);
                    break;
                case "perspective":
                    ColladaCamera.parseParams(child, camera, context);
                    break;
                default:
                    context.reportUnexpectedChild(child);
            }
        });

    }

    /**
    *   Parses a <camera>/<optics>/<technique_common>/(<orthographic>|<perspective>) element.
    */
    static parseParams(node: Node, camera: ColladaCamera, context: ColladaParsingContext) {

        camera.type = node.nodeName;

        Utils.forEachChild(node, function (child: Node) {
            switch (child.nodeName) {
                case "xmag":
                case "ymag":
                case "xfov":
                case "yfov":
                case "aspect_ratio":
                case "znear":
                case "zfar":
                    var param: ColladaCameraParam = ColladaCameraParam.parse(child, context);
                    context.registerSidTarget(param, camera);
                    camera.params[param.name] = param;
                    break;
                case "extra":
                    context.reportUnhandledChild(child);
                    break;
                default:
                    context.reportUnexpectedChild(child);
            }
        });

    }
}