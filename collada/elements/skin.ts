
class ColladaSkin extends ColladaElement {
    source: UrlLink;
    bindShapeMatrix: Float32Array;
    sources: ColladaSource[];
    joints: ColladaSkinJoints;
    vertexWeights: ColladaVertexWeights;

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
    static parse(node: Node, context: ColladaParsingContext): ColladaSkin {
        var result: ColladaSkin = new ColladaSkin();

        result.source = context.getAttributeAsUrlLink(node, "source", true);

        Utils.forEachChild(node, function (child: Node) {
            switch (child.nodeName) {
                case "bind_shape_matrix":
                    result.bindShapeMatrix = context.strToFloats(child.textContent);
                    break;
                case "source":
                    result.sources.push(ColladaSource.parse(child, context));
                    break;
                case "joints":
                    result.joints = ColladaSkinJoints.parse(child, context);
                    break;
                case "vertex_weights":
                    result.vertexWeights = ColladaVertexWeights.parse(child, context);
                    break;
                default:
                    context.reportUnexpectedChild(child);
            }
        });

        return result;
    }

}