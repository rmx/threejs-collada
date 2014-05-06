/// <reference path="loader/document.ts" />
/// <reference path="converter/file.ts" />


class ColladaConverter {
    log: Log;
    options: ColladaConverterOptions;

    constructor() {
        this.log = new ColladaLogConsole();
        this.options = new ColladaConverterOptions();
    }

    convert(doc: ColladaDocument): ColladaConverterFile {
        var context: ColladaConverterContext = new ColladaConverterContext(this.log, this.options);

        var result: ColladaConverterFile = new ColladaConverterFile();

        // Scene nodes
        result.nodes = ColladaConverter.createScene(doc, context);

        // Animations
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

        // If requested, create a single animation
        if (context.options.singleAnimation.value === true && result.length > 1) {
            var topLevelAnimation = new ColladaConverterAnimation();
            topLevelAnimation.id = "";
            topLevelAnimation.name = "animation";
            for (var i: number = 0; i < result.length; ++i) {
                var child: ColladaConverterAnimation = result[i];
                topLevelAnimation.channels = topLevelAnimation.channels.concat(child.channels);
                child.channels = [];
            }
            result = [topLevelAnimation];
        }

        return result;
    }

    
}