/// <reference path="log.ts" />
/// <reference path="converter/context.ts" />
/// <reference path="converter/options.ts" />
/// <reference path="converter/file.ts" />
/// <reference path="converter/node.ts" />
/// <reference path="converter/geometry.ts" />
/// <reference path="converter/animation.ts" />
/// <reference path="converter/animation_data.ts" />

module COLLADA.Converter {

    export class ColladaConverter {
        log: Log;
        options: COLLADA.Converter.Options;

        constructor() {
            this.log = new LogConsole();
            this.options = new COLLADA.Converter.Options();
        }

        convert(doc: COLLADA.Loader.Document): COLLADA.Converter.Document {
            var context: COLLADA.Converter.Context = new COLLADA.Converter.Context(this.log, this.options);

            var result: COLLADA.Converter.Document = new COLLADA.Converter.Document();

            // Scene nodes
            result.nodes = ColladaConverter.createScene(doc, context);

            // Geometries
            if (context.options.enableExtractGeometry.value === true) {
                result.geometries = COLLADA.Converter.Node.extractGeometries(result.nodes, context);
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

        static createScene(doc: COLLADA.Loader.Document, context: COLLADA.Converter.Context): COLLADA.Converter.Node[] {
            var result: COLLADA.Converter.Node[] = [];

            // Get the COLLADA scene
            var scene: COLLADA.Loader.VisualScene = COLLADA.Loader.VisualScene.fromLink(doc.scene.instance, context);
            if (scene === null) {
                context.log.write("Collada document has no scene", LogLevel.Warning);
                return result;
            }

            // Create converted nodes
            for (var i: number = 0; i < scene.children.length; ++i) {
                var topLevelNode: COLLADA.Loader.VisualSceneNode = scene.children[i];
                result.push(COLLADA.Converter.Node.createNode(topLevelNode, context));
            }

            // Create data (geometries, ...) for the converted nodes
            for (var i: number = 0; i < result.length; ++i) {
                var node: COLLADA.Converter.Node = result[i];
                COLLADA.Converter.Node.createNodeData(node, context);
            }

            return result;
        }

        static createAnimations(doc: COLLADA.Loader.Document, context: COLLADA.Converter.Context): COLLADA.Converter.Animation[] {
            var result: COLLADA.Converter.Animation[] = [];

            // Create converted animations
            for (var i: number = 0; i < doc.libAnimations.children.length; ++i) {
                var animation: COLLADA.Loader.Animation = doc.libAnimations.children[i];
                result.push(COLLADA.Converter.Animation.create(animation, context));
            }

            // If requested, create a single animation
            if (context.options.singleAnimation.value === true && result.length > 1) {
                var topLevelAnimation = new COLLADA.Converter.Animation();
                topLevelAnimation.id = "";
                topLevelAnimation.name = "animation";

                // Steal all channels from previous animations
                for (var i: number = 0; i < result.length; ++i) {
                    var child: COLLADA.Converter.Animation = result[i];
                    topLevelAnimation.channels = topLevelAnimation.channels.concat(child.channels);
                    child.channels = [];
                }
                result = [topLevelAnimation];
            }

            return result;
        }

        static createResampledAnimations(doc: COLLADA.Loader.Document, file: COLLADA.Converter.Document, context: COLLADA.Converter.Context): COLLADA.Converter.AnimationData[] {
            var result: COLLADA.Converter.AnimationData[] = [];
            if (file.animations.length === 0) {
                // context.log.write("No original animations available, no resampled animations generated.", LogLevel.Warning);
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
            var geometry: COLLADA.Converter.Geometry = file.geometries[0];

            // Process all animations in the document
            var labels: COLLADA.Converter.AnimationLabel[] = context.options.animationLabels.value;
            var fps: number = context.options.animationFps.value;
            for (var i: number = 0; i < file.animations.length; ++i) {
                var animation: COLLADA.Converter.Animation = file.animations[i];

                if (context.options.useAnimationLabels.value === true) {
                    var datas: COLLADA.Converter.AnimationData[] = COLLADA.Converter.AnimationData.createFromLabels(geometry.bones, animation, labels, context);
                    result = result.concat(datas);
                } else {
                    var data: COLLADA.Converter.AnimationData = COLLADA.Converter.AnimationData.create(geometry.bones, animation, null, null, fps, context);
                    if (data !== null) {
                        result.push(data);
                    }
                }
            }

            return result;
        }
    }
}