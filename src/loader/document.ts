/// <reference path="library.ts" />
/// <reference path="asset.ts" />
/// <reference path="scene.ts" />
/// <reference path="context.ts" />
/// <reference path="effect.ts" />
/// <reference path="material.ts" />
/// <reference path="geometry.ts" />
/// <reference path="controller.ts" />
/// <reference path="light.ts" />
/// <reference path="camera.ts" />
/// <reference path="image.ts" />
/// <reference path="visual_scene.ts" />
/// <reference path="animation.ts" />
/// <reference path="visual_scene_node.ts" />

module COLLADA.Loader {

    export class Document {
        scene: COLLADA.Loader.Scene;
        asset: COLLADA.Loader.Asset;
        libEffects: COLLADA.Loader.Library<COLLADA.Loader.Effect>;
        libMaterials: COLLADA.Loader.Library<COLLADA.Loader.Material>;
        libGeometries: COLLADA.Loader.Library<COLLADA.Loader.Geometry>;
        libControllers: COLLADA.Loader.Library<COLLADA.Loader.Controller>;
        libLights: COLLADA.Loader.Library<COLLADA.Loader.Light>;
        libCameras: COLLADA.Loader.Library<COLLADA.Loader.Camera>;
        libImages: COLLADA.Loader.Library<COLLADA.Loader.Image>;
        libVisualScenes: COLLADA.Loader.Library<COLLADA.Loader.VisualScene>;
        libAnimations: COLLADA.Loader.Library<COLLADA.Loader.Animation>;
        libNodes: COLLADA.Loader.Library<COLLADA.Loader.VisualSceneNode>;

        constructor() {
            this.scene = null;
            this.asset = null;
            this.libEffects = new COLLADA.Loader.Library<COLLADA.Loader.Effect>();
            this.libMaterials = new COLLADA.Loader.Library<COLLADA.Loader.Material>();
            this.libGeometries = new COLLADA.Loader.Library<COLLADA.Loader.Geometry>();
            this.libControllers = new COLLADA.Loader.Library<COLLADA.Loader.Controller>();
            this.libLights = new COLLADA.Loader.Library<COLLADA.Loader.Light>();
            this.libCameras = new COLLADA.Loader.Library<COLLADA.Loader.Camera>();
            this.libImages = new COLLADA.Loader.Library<COLLADA.Loader.Image>();
            this.libVisualScenes = new COLLADA.Loader.Library<COLLADA.Loader.VisualScene>();
            this.libAnimations = new COLLADA.Loader.Library<COLLADA.Loader.Animation>();
            this.libNodes = new COLLADA.Loader.Library<COLLADA.Loader.VisualSceneNode>();
        }

        static parse(doc: XMLDocument, context: COLLADA.Loader.Context): COLLADA.Loader.Document {

            // There should be one top level <COLLADA> element
            var colladaNodes: NodeList = doc.getElementsByTagName("COLLADA");
            if (colladaNodes.length === 0) {
                context.log.write("Cannot parse document, no top level COLLADA element.", LogLevel.Error);
                return;
            } else if (colladaNodes.length > 1) {
                context.log.write("Cannot parse document, more than one top level COLLADA element.", LogLevel.Error);
                return;
            }

            return COLLADA.Loader.Document.parseCOLLADA(colladaNodes[0], context);
        }

        static parseCOLLADA(node: Node, context: COLLADA.Loader.Context): COLLADA.Loader.Document {
            var result: COLLADA.Loader.Document = new COLLADA.Loader.Document();

            Utils.forEachChild(node, function (child: Node) {
                switch (child.nodeName) {
                    case "asset":
                        result.asset = COLLADA.Loader.Asset.parse(child, context);
                        break;
                    case "scene":
                        result.scene = COLLADA.Loader.Scene.parse(child, context);
                        break;
                    case "library_effects":
                        result.libEffects = COLLADA.Loader.Library.parse<COLLADA.Loader.Effect>(child, COLLADA.Loader.Effect.parse, "effect", context);
                        break;
                    case "library_materials":
                        result.libMaterials = COLLADA.Loader.Library.parse<COLLADA.Loader.Material>(child, COLLADA.Loader.Material.parse, "material", context);
                        break;
                    case "library_geometries":
                        result.libGeometries = COLLADA.Loader.Library.parse<COLLADA.Loader.Geometry>(child, COLLADA.Loader.Geometry.parse, "geometry", context);
                        break;
                    case "library_images":
                        result.libImages = COLLADA.Loader.Library.parse<COLLADA.Loader.Image>(child, COLLADA.Loader.Image.parse, "image", context);
                        break;
                    case "library_visual_scenes":
                        result.libVisualScenes = COLLADA.Loader.Library.parse<COLLADA.Loader.VisualScene>(child, COLLADA.Loader.VisualScene.parse, "visual_scene", context);
                        break;
                    case "library_controllers":
                        result.libControllers = COLLADA.Loader.Library.parse<COLLADA.Loader.Controller>(child, COLLADA.Loader.Controller.parse, "controller", context);
                        break;
                    case "library_animations":
                        result.libAnimations = COLLADA.Loader.Library.parse<COLLADA.Loader.Animation>(child, COLLADA.Loader.Animation.parse, "animation", context);
                        break;
                    case "library_lights":
                        result.libLights = COLLADA.Loader.Library.parse<COLLADA.Loader.Light>(child, COLLADA.Loader.Light.parse, "effect", context);
                        break;
                    case "library_cameras":
                        result.libCameras = COLLADA.Loader.Library.parse<COLLADA.Loader.Camera>(child, COLLADA.Loader.Camera.parse, "camera", context);
                        break;
                    case "library_nodes":
                        result.libNodes = COLLADA.Loader.Library.parse<COLLADA.Loader.VisualSceneNode>(child, COLLADA.Loader.VisualSceneNode.parse, "node", context);
                        break;
                    default:
                        this.reportUnexpectedChild(child);
                }
            });

            return result;
        }
    };
}