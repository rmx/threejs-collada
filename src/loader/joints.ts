/// <reference path="context.ts" />
/// <reference path="element.ts" />
/// <reference path="input.ts" />
/// <reference path="utils.ts" />

module COLLADA.Loader {

    export class Joints extends COLLADA.Loader.Element {
        joints: COLLADA.Loader.Input;
        invBindMatrices: COLLADA.Loader.Input;

        constructor() {
            super();
            this.joints = null;
            this.invBindMatrices = null;
        }

        /**
        *   Parses a <joints> element.
        */
        static parse(node: Node, context: COLLADA.Loader.Context): COLLADA.Loader.Joints {
            var result: COLLADA.Loader.Joints = new COLLADA.Loader.Joints();

            var inputs: COLLADA.Loader.Input[] = [];

            Utils.forEachChild(node, function (child: Node) {
                switch (child.nodeName) {
                    case "input":
                        var input: COLLADA.Loader.Input = COLLADA.Loader.Input.parse(child, false, context);
                        COLLADA.Loader.Joints.addInput(result, input, context);
                        inputs.push();
                        break;
                    default:
                        context.reportUnexpectedChild(child);
                }
            });

            return result;
        }

        static addInput(joints: COLLADA.Loader.Joints, input: COLLADA.Loader.Input, context: COLLADA.Loader.Context) {
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
}