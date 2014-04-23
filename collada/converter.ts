/// <reference path="./document.ts" />
/// <reference path="./converter/file.ts" />

class ColladaConverter {
    log: Log;

    constructor() {
        this.log = new ColladaLogConsole();
    }

    convert(doc: ColladaDocument): ColladaConverterFile {
        var context: ColladaConverterContext = new ColladaConverterContext();
        context.log = this.log;

        var result: ColladaConverterFile = new ColladaConverterFile();

        var scene: ColladaVisualScene = ColladaVisualScene.fromLink(doc.scene.instance, context);
        if (scene === null) {
            return result;
        }

        return result;
    }

    static createScene(scene: ColladaVisualScene, context: ColladaConverterContext): ColladaConverterNode {
        var result: ColladaConverterNode = new ColladaConverterNode;
        for (var i: number = 0; i < scene.children.length; ++i) {

        }
        return result;
    }
}