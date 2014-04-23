
class ColladaVertexWeights extends ColladaElement {
    inputs: ColladaInput[];
    vcount: Int32Array;
    v: Int32Array;
    joints: ColladaInput;
    weights: ColladaInput;
    count: number;

    constructor() {
        super();
        this.inputs = [];
        this.vcount = null;
        this.v = null;
        this.joints = null;
        this.weights = null;
        this.count = null;
    }

    /**
    *   Parses a <vertex_weights> element.
    */
    static parse(node: Node, context: ColladaParsingContext): ColladaVertexWeights {
        var result: ColladaVertexWeights = new ColladaVertexWeights();

        result.count = context.getAttributeAsInt(node, "count", 0, true);

        Utils.forEachChild(node, function (child: Node) {
            switch (child.nodeName) {
                case "input":
                    var input: ColladaInput = ColladaInput.parse(child, true, context);
                    ColladaVertexWeights.addInput(result, input, context);
                    break;
                case "vcount":
                    result.vcount = context.strToInts(child.textContent);
                    break;
                case "v":
                    result.v = context.strToInts(child.textContent);
                    break;
                default:
                    context.reportUnexpectedChild(child);
            }
        });

        return result;
    }

    static addInput(weights: ColladaVertexWeights, input: ColladaInput, context: ColladaParsingContext) {
        switch (input.semantic) {
            case "JOINT":
                weights.joints = input;
                break;
            case "WEIGHT":
                weights.weights = input;
                break;
            default:
                context.log.write("Unknown vertex weights input semantic " + input.semantic, LogLevel.Error);
        }
    }
}