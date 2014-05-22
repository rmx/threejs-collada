/// <reference path="context.ts" />
/// <reference path="element.ts" />

module COLLADA.Loader {

    export class NodeTransform extends COLLADA.Loader.Element {
        type: string;
        data: Float32Array;

        constructor() {
            super();
            this.type = null;
            this.data = null;
        }

        /**
        *   Parses a transformation element.
        */
        static parse(node: Node, parent: COLLADA.Loader.VisualSceneNode, context: COLLADA.Loader.Context): COLLADA.Loader.NodeTransform {
            var result: COLLADA.Loader.NodeTransform = new COLLADA.Loader.NodeTransform();

            result.sid = context.getAttributeAsString(node, "sid", null, false);
            result.type = node.nodeName;

            context.registerSidTarget(result, parent);
            result.data = context.strToFloats(node.textContent);

            var expectedDataLength: number = 0;
            switch (result.type) {
                case "matrix":
                    expectedDataLength = 16;
                    break;
                case "rotate":
                    expectedDataLength = 4;
                    break;
                case "translate":
                    expectedDataLength = 3;
                    break;
                case "scale":
                    expectedDataLength = 3;
                    break;
                case "skew":
                    expectedDataLength = 7;
                    break;
                case "lookat":
                    expectedDataLength = 9;
                    break;
                default:
                    context.log.write("Unknown transformation type " + result.type + ".", LogLevel.Error);
            }

            if (result.data.length !== expectedDataLength) {
                context.log.write("Wrong number of elements for transformation type '" + result.type + "': expected " +
                    expectedDataLength + ", found " + result.data.length, LogLevel.Error);
            }

            return result;
        }
    }
}