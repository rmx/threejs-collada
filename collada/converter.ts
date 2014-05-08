/// <reference path="log.ts" />
/// <reference path="converter/context.ts" />
/// <reference path="converter/options.ts" />
/// <reference path="converter/file.ts" />
/// <reference path="converter/node.ts" />
/// <reference path="converter/geometry.ts" />
/// <reference path="converter/animation.ts" />
/// <reference path="converter/animation_data.ts" />

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

        // Geometries
        if (context.options.enableExtractGeometry.value === true) {
            result.geometries = ColladaConverterNode.extractGeometries(result.nodes, context);
        }

        // Original animations curves
        if (context.options.enableAnimations.value === true) {
            result.animations = ColladaConverter.createAnimations(doc, context);
        }

        // Resampled animations
        if (context.options.enableResampledAnimations.value === true) {
            result.resampled_animations = ColladaConverter.createResampledAnimations(doc, result, context);
        }

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

        // Create data (geometries, ...) for the converted nodes
        for (var i: number = 0; i < result.length; ++i) {
            var node: ColladaConverterNode = result[i];
            ColladaConverterNode.createNodeData(node, context);
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

            // Steal all channels from previous animations
            for (var i: number = 0; i < result.length; ++i) {
                var child: ColladaConverterAnimation = result[i];
                topLevelAnimation.channels = topLevelAnimation.channels.concat(child.channels);
                child.channels = [];
            }
            result = [topLevelAnimation];
        }

        return result;
    }

    static createResampledAnimations(doc: ColladaDocument, file: ColladaConverterFile, context: ColladaConverterContext): ColladaConverterAnimationData[] {
        var result: ColladaConverterAnimationData[] = [];
        if (file.animations.length === 0) {
            context.log.write("No original animations available, no resampled animations generated.", LogLevel.Warning);
            return [];
        }

        // Get the geometry
        if (file.geometries.length > 1) {
            context.log.write("Converted document contains multiple geometries, resampled animations are only generated for single geometries.", LogLevel.Warning);
            return [];
        }
        if (file.geometries.length === 0) {
            context.log.write("Converted document does not contain any geometries, no resampled animations generated.", LogLevel.Warning);
            return [];
        }
        var geometry: ColladaConverterGeometry = file.geometries[0];

        // Process all animations in the document
        var labels: ColladaConverterAnimationLabel[] = context.options.animationLabels.value;
        var fps: number = context.options.animationFps.value;
        for (var i: number = 0; i < file.animations.length; ++i) {
            var animation: ColladaConverterAnimation = file.animations[i];

            if (context.options.useAnimationLabels.value === true) {
                var datas: ColladaConverterAnimationData[] = ColladaConverterAnimationData.createFromLabels(geometry.bones, animation, labels, context);
                result = result.concat(datas);
            } else {
                var data: ColladaConverterAnimationData = ColladaConverterAnimationData.create(geometry.bones, animation, null, null, fps, context);
                if (data !== null) {
                    result.push(data);
                }
            }
        }

        return result;
    }
}