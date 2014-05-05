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
        result.nodes = ColladaConverter.createScene(doc, context);
        result.animations = ColladaConverter.createAnimations(doc, context);

        return result;
    }

    static createScene(doc: ColladaDocument, context: ColladaConverterContext): ColladaConverterNode[] {
        var result: ColladaConverterNode[] = [];

        // Get the COLLADA scene
        var scene: ColladaVisualScene = ColladaVisualScene.fromLink(doc.scene.instance, context);
        if (scene === null) {
            context.log.write("Collada document has no scene", LogLevel.Warning);
            return result;
        }

        // Create converted nodes
        for (var i: number = 0; i < scene.children.length; ++i) {
            var topLevelNode: ColladaVisualSceneNode = scene.children[i];
            result.push(ColladaConverterNode.createNode(topLevelNode, context));
        }

        return result;
    }

    static createAnimations(doc: ColladaDocument, context: ColladaConverterContext): ColladaConverterAnimation[] {
        var result: ColladaConverterAnimation[] = [];

        // Create converted animations
        for (var i: number = 0; i < doc.libAnimations.children.length; ++i) {
            var animation: ColladaAnimation = doc.libAnimations.children[i];
            result.push(ColladaConverterAnimation.create(animation, context));
        }

        return result;
    }

    
}