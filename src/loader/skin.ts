/// <reference path="context.ts" />
/// <reference path="element.ts" />
/// <reference path="source.ts" />
/// <reference path="joints.ts" />
/// <reference path="vertex_weights.ts" />
/// <reference path="utils.ts" />

module COLLADA.Loader {

    export class Skin extends COLLADA.Loader.Element {
        source: UrlLink;
        bindShapeMatrix: Float32Array;
        sources: COLLADA.Loader.Source[];
        joints: COLLADA.Loader.Joints;
        vertexWeights: COLLADA.Loader.VertexWeights;

        constructor() {
            super();
            this.source = null;
            this.bindShapeMatrix = null;
            this.sources = [];
            this.joints = null;
            this.vertexWeights = null;
        }

        /**
        *   Parses a <skin> element.
        */
        static parse(node: Node, context: COLLADA.Loader.Context): COLLADA.Loader.Skin {
            var result: COLLADA.Loader.Skin = new COLLADA.Loader.Skin();

            result.source = context.getAttributeAsUrlLink(node, "source", true);

            Utils.forEachChild(node, function (child: Node) {
                switch (child.nodeName) {
                    case "bind_shape_matrix":
                        result.bindShapeMatrix = context.strToFloats(child.textContent);
                        break;
                    case "source":
                        result.sources.push(COLLADA.Loader.Source.parse(child, context));
                        break;
                    case "joints":
                        result.joints = COLLADA.Loader.Joints.parse(child, context);
                        break;
                    case "vertex_weights":
                        result.vertexWeights = COLLADA.Loader.VertexWeights.parse(child, context);
                        break;
                    default:
                        context.reportUnexpectedChild(child);
                }
            });

            return result;
        }

    }
}