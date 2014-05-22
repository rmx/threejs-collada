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

class ColladaDocument {
    scene: ColladaScene;
    asset: ColladaAsset;
    libEffects: ColladaLibrary<ColladaEffect>;
    libMaterials: ColladaLibrary<ColladaMaterial>;
    libGeometries: ColladaLibrary<ColladaGeometry>;
    libControllers: ColladaLibrary<ColladaController>;
    libLights: ColladaLibrary<ColladaLight>;
    libCameras: ColladaLibrary<ColladaCamera>;
    libImages: ColladaLibrary<ColladaImage>;
    libVisualScenes: ColladaLibrary<ColladaVisualScene>;
    libAnimations: ColladaLibrary<ColladaAnimation>;
    libNodes: ColladaLibrary<ColladaVisualSceneNode>;

    constructor() {
        this.scene = null;
        this.asset = null;
        this.libEffects = new ColladaLibrary<ColladaEffect>();
        this.libMaterials = new ColladaLibrary<ColladaMaterial>();
        this.libGeometries = new ColladaLibrary<ColladaGeometry>();
        this.libControllers = new ColladaLibrary<ColladaController>();
        this.libLights = new ColladaLibrary<ColladaLight>();
        this.libCameras = new ColladaLibrary<ColladaCamera>();
        this.libImages = new ColladaLibrary<ColladaImage>();
        this.libVisualScenes = new ColladaLibrary<ColladaVisualScene>();
        this.libAnimations = new ColladaLibrary<ColladaAnimation>();
        this.libNodes = new ColladaLibrary<ColladaVisualSceneNode>();
    }

    static parse(doc: XMLDocument, context: ColladaParsingContext): ColladaDocument {

        // There should be one top level <COLLADA> element
        var colladaNodes: NodeList = doc.getElementsByTagName("COLLADA");
        if (colladaNodes.length === 0) {
            context.log.write("Cannot parse document, no top level COLLADA element.", LogLevel.Error);
            return;
        } else if (colladaNodes.length > 1) {
            context.log.write("Cannot parse document, more than one top level COLLADA element.", LogLevel.Error);
            return;
        }

        return ColladaDocument.parseCOLLADA(colladaNodes[0], context);
    }

    static parseCOLLADA(node: Node, context: ColladaParsingContext): ColladaDocument {
        var result: ColladaDocument = new ColladaDocument();

        Utils.forEachChild(node, function (child: Node) {
            switch (child.nodeName) {
                case "asset":
                    result.asset = ColladaAsset.parse(child, context);
                    break;
                case "scene":
                    result.scene = ColladaScene.parse(child, context);
                    break;
                case "library_effects":
                    result.libEffects = ColladaLibrary.parse<ColladaEffect>(child, ColladaEffect.parse, "effect", context);
                    break;
                case "library_materials":
                    result.libMaterials = ColladaLibrary.parse<ColladaMaterial>(child, ColladaMaterial.parse, "material", context);
                    break;
                case "library_geometries":
                    result.libGeometries = ColladaLibrary.parse<ColladaGeometry>(child, ColladaGeometry.parse, "geometry", context);
                    break;
                case "library_images":
                    result.libImages = ColladaLibrary.parse<ColladaImage>(child, ColladaImage.parse, "image", context);
                    break;
                case "library_visual_scenes":
                    result.libVisualScenes = ColladaLibrary.parse<ColladaVisualScene>(child, ColladaVisualScene.parse, "visual_scene", context);
                    break;
                case "library_controllers":
                    result.libControllers = ColladaLibrary.parse<ColladaController>(child, ColladaController.parse, "controller", context);
                    break;
                case "library_animations":
                    result.libAnimations = ColladaLibrary.parse<ColladaAnimation>(child, ColladaAnimation.parse, "animation", context);
                    break;
                case "library_lights":
                    result.libLights = ColladaLibrary.parse<ColladaLight>(child, ColladaLight.parse, "effect", context);
                    break;
                case "library_cameras":
                    result.libCameras = ColladaLibrary.parse<ColladaCamera>(child, ColladaCamera.parse, "camera", context);
                    break;
                case "library_nodes":
                    result.libNodes = ColladaLibrary.parse<ColladaVisualSceneNode>(child, ColladaVisualSceneNode.parse, "node", context);
                    break;
                default:
                    this.reportUnexpectedChild(child);
            }
        });

        return result;
    }
};