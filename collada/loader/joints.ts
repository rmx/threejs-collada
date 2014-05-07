/// <reference path="context.ts" />
/// <reference path="element.ts" />
/// <reference path="input.ts" />

class ColladaSkinJoints extends ColladaElement {
    joints: ColladaInput;
    invBindMatrices: ColladaInput;

    constructor() {
        super();
        this.joints = null;
        this.invBindMatrices = null;
    }

    /**
    *   Parses a <joints> element.
    */
    static parse(node: Node, context: ColladaParsingContext): ColladaSkinJoints {
        var result: ColladaSkinJoints = new ColladaSkinJoints();

        var inputs: ColladaInput[] = [];

        Utils.forEachChild(node, function (child: Node) {
            switch (child.nodeName) {
                case "input":
                    var input: ColladaInput = ColladaInput.parse(child, false, context);
                    ColladaSkinJoints.addInput(result, input, context);
                    inputs.push();
                    break;
                default:
                    context.reportUnexpectedChild(child);
            }
        });

        return result;
    }

    static addInput(joints: ColladaSkinJoints, input: ColladaInput, context: ColladaParsingContext) {
        switch (input.semantic) {
            case "JOINT":
                joints.joints = input;
                break;
            case "INV_BIND_MATRIX":
                joints.invBindMatrices = input;
                break;
            default:
                context.log.write("Unknown joints input semantic " + input.semantic, LogLevel.Error);
        }
    }

}