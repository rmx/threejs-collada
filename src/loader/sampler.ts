/// <reference path="context.ts" />
/// <reference path="element.ts" />
/// <reference path="input.ts" />
/// <reference path="utils.ts" />

module COLLADA.Loader {

    export class Sampler extends COLLADA.Loader.Element {
        input: COLLADA.Loader.Input;
        outputs: COLLADA.Loader.Input[];
        inTangents: COLLADA.Loader.Input[];
        outTangents: COLLADA.Loader.Input[];
        interpolation: COLLADA.Loader.Input;

        constructor() {
            super();
            this.input = null;
            this.outputs = [];
            this.inTangents = [];
            this.outTangents = [];
            this.interpolation = null;
        }

        static fromLink(link: Link, context: COLLADA.Context): COLLADA.Loader.Sampler {
            return COLLADA.Loader.Element._fromLink<COLLADA.Loader.Sampler>(link, COLLADA.Loader.Sampler, "COLLADA.Loader.Sampler", context);
        }

        /**
        *   Parses a <sampler> element.
        */
        static parse(node: Node, context: COLLADA.Loader.Context): COLLADA.Loader.Sampler {
            var result: COLLADA.Loader.Sampler = new COLLADA.Loader.Sampler();

            result.id = context.getAttributeAsString(node, "id", null, false);
            context.registerUrlTarget(result, false);

            Utils.forEachChild(node, function (child: Node) {
                switch (child.nodeName) {
                    case "input":
                        var input: COLLADA.Loader.Input = COLLADA.Loader.Input.parse(child, false, context);
                        COLLADA.Loader.Sampler.addInput(result, input, context);
                        break;
                    default:
                        context.reportUnexpectedChild(child);
                }
            });

            return result;
        }

        static addInput(sampler: COLLADA.Loader.Sampler, input: COLLADA.Loader.Input, context: COLLADA.Loader.Context) {
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
}