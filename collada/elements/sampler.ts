
class ColladaSampler extends ColladaElement {
    input: ColladaInput;
    outputs: ColladaInput[];
    inTangents: ColladaInput[];
    outTangents: ColladaInput[];
    interpolation: ColladaInput;

    constructor() {
        super();
        this.input = null;
        this.outputs = [];
        this.inTangents = [];
        this.outTangents = [];
        this.interpolation = null;
    }

    /**
    *   Parses a <sampler> element.
    */
    static parse(node: Node, context: ColladaParsingContext): ColladaSampler {
        var result: ColladaSampler = new ColladaSampler();

        result.id = context.getAttributeAsString(node, "id", null, false);
        context.registerUrlTarget(result, false);

        Utils.forEachChild(node, function (child: Node) {
            switch (child.nodeName) {
                case "input":
                    var input: ColladaInput = ColladaInput.parse(child, true, context);
                    ColladaSampler.addInput(result, input, context);
                default:
                    context.reportUnexpectedChild(child);
            }
        });

        return result;
    }

    static addInput(sampler: ColladaSampler, input: ColladaInput, context: ColladaParsingContext) {
        switch (input.semantic) {
            case "INPUT":
                sampler.input = input;
                break;
            case "OUTPUT":
                sampler.outputs.push(input);
                break;
            case "INTERPOLATION":
                sampler.interpolation = input;
                break;
            case "IN_TANGENT":
                sampler.inTangents.push(input);
                break;
            case "OUT_TANGENT":
                sampler.outTangents.push(input);
                break;
            default:
                context.log.write("Unknown sampler input semantic " + input.semantic, LogLevel.Error);
        }
    }

}