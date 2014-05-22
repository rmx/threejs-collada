/// <reference path="context.ts" />
/// <reference path="element.ts" />
/// <reference path="camera_param.ts" />
/// <reference path="utils.ts" />

module COLLADA.Loader {

    export class Camera extends COLLADA.Loader.Element {
        type: string;
        params: { [s: string]: COLLADA.Loader.CameraParam; }

    constructor() {
            super();
            this.type = null;
            this.params = {};
        }

        /**
        *   Parses a <camera> element.
        */
        static parse(node: Node, context: COLLADA.Loader.Context): COLLADA.Loader.Camera {
            var result: COLLADA.Loader.Camera = new COLLADA.Loader.Camera();

            result.id = context.getAttributeAsString(node, "id", null, true);
            result.name = context.getAttributeAsString(node, "name", null, false);
            context.registerUrlTarget(result, false);

            Utils.forEachChild(node, function (child: Node) {
                switch (child.nodeName) {
                    case "asset":
                        context.reportUnhandledChild(child);
                        break;
                    case "optics":
                        COLLADA.Loader.Camera.parseOptics(child, result, context);
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
        static parseOptics(node: Node, camera: COLLADA.Loader.Camera, context: COLLADA.Loader.Context) {

            Utils.forEachChild(node, function (child: Node) {
                switch (child.nodeName) {
                    case "technique_common":
                        COLLADA.Loader.Camera.parseTechniqueCommon(child, camera, context);
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
        static parseTechniqueCommon(node: Node, camera: COLLADA.Loader.Camera, context: COLLADA.Loader.Context) {

            Utils.forEachChild(node, function (child: Node) {
                switch (child.nodeName) {
                    case "orthographic":
                        COLLADA.Loader.Camera.parseParams(child, camera, context);
                        break;
                    case "perspective":
                        COLLADA.Loader.Camera.parseParams(child, camera, context);
                        break;
                    default:
                        context.reportUnexpectedChild(child);
                }
            });

        }

        /**
        *   Parses a <camera>/<optics>/<technique_common>/(<orthographic>|<perspective>) element.
        */
        static parseParams(node: Node, camera: COLLADA.Loader.Camera, context: COLLADA.Loader.Context) {

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
                        var param: COLLADA.Loader.CameraParam = COLLADA.Loader.CameraParam.parse(child, context);
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
}