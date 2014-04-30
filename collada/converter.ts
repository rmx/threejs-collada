/// <reference path="loader/document.ts" />
/// <reference path="converter/file.ts" />

class ColladaConverter {
    log: Log;

    constructor() {
        this.log = new ColladaLogConsole();
    }

    convert(doc: ColladaDocument): ColladaConverterFile {
        var context: ColladaConverterContext = new ColladaConverterContext();
        context.log = this.log;

        var result: ColladaConverterFile = new ColladaConverterFile();

        // Scene nodes
        var scene: ColladaVisualScene = ColladaVisualScene.fromLink(doc.scene.instance, context);
        if (scene === null) {
            context.log.write("Collada document has no scene", LogLevel.Warning);
            return result;
        }
        result.nodes = ColladaConverter.createScene(scene, context);

        return result;
    }

    static createScene(scene: ColladaVisualScene, context: ColladaConverterContext): ColladaConverterNode[] {
        var result: ColladaConverterNode[] = [];
        for (var i: number = 0; i < scene.children.length; ++i) {
            var child: ColladaVisualSceneNode = scene.children[i];
            result.push(ColladaConverter.createSceneNode(child, context));
        }
        return result;
    }

    static createSceneNode(node: ColladaVisualSceneNode, context: ColladaConverterContext): ColladaConverterNode {
        var result: ColladaConverterNode = new ColladaConverterNode;

        // Static geometries: <instance_geometry>
        for (var i: number = 0; i < node.geometries.length; ++i) {
            var colladaGeometry: ColladaInstanceGeometry = node.geometries[i];
            var converterGeometry: ColladaConverterGeometry = ColladaConverterGeometry.createStatic(colladaGeometry, context);
            result.geometries.push(converterGeometry);
        }

        // Animated geometries: <instance_controller>
        for (var i: number = 0; i < node.controllers.length; ++i) {
            var colladaController: ColladaInstanceController = node.controllers[i];
            var converterGeometry: ColladaConverterGeometry = ColladaConverterGeometry.createAnimated(colladaController, context);
            result.geometries.push(converterGeometry);
        }

        // Child nodes
        for (var i: number = 0; i < node.children.length; ++i) {
            var colladaChild: ColladaVisualSceneNode = node.children[i];
            var converterChild = ColladaConverter.createSceneNode(colladaChild, context);
            result.children.push(converterChild);
            converterChild.parent = result;
        }
        return result;
    }
}