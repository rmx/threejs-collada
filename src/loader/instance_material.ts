/// <reference path="context.ts" />
/// <reference path="element.ts" />
/// <reference path="utils.ts" />

module COLLADA.Loader {

    export interface InstanceMaterialVertexInput {
        inputSemantic: string;
        inputSet: number;
    }

    export interface InstanceMaterialParam {
        target: SidLink;
    }

    export interface InstanceMaterialContainer extends COLLADA.Loader.Element {
        materials: COLLADA.Loader.InstanceMaterial[];
    }

    export class InstanceMaterial extends COLLADA.Loader.Element {
        material: UrlLink;
        symbol: string;
        /** Contains uniform parameters */
        params: { [s: string]: COLLADA.Loader.InstanceMaterialParam; }
    /** Contains vertex paramters */
    vertexInputs: { [s: string]: COLLADA.Loader.InstanceMaterialVertexInput; }

    constructor() {
            super();
            this.material = null;
            this.symbol = null;
            this.params = {};
            this.vertexInputs = {};
        }

        /**
        *   Parses a <instance_material> element.
        */
        static parse(node: Node, parent: COLLADA.Loader.InstanceMaterialContainer, context: COLLADA.Loader.Context): COLLADA.Loader.InstanceMaterial {
            var result: COLLADA.Loader.InstanceMaterial = new COLLADA.Loader.InstanceMaterial();

            result.symbol = context.getAttributeAsString(node, "symbol", null, false);
            result.material = context.getAttributeAsUrlLink(node, "target", true);
            context.registerSidTarget(result, parent);

            Utils.forEachChild(node, function (child: Node) {
                switch (child.nodeName) {
                    case "bind_vertex_input":
                        COLLADA.Loader.InstanceMaterial.parseBindVertexInput(child, result, context);
                        break;
                    case "bind":
                        COLLADA.Loader.InstanceMaterial.parseBind(child, result, context);
                        break;
                    default:
                        context.reportUnexpectedChild(child);
                }
            });

            return result;
        }

        /**
        *   Parses a <instance_material>/<bind_vertex_input> element.
        */
        static parseBindVertexInput(node: Node, instanceMaterial: COLLADA.Loader.InstanceMaterial, context: COLLADA.Loader.Context) {
            var semantic: string = context.getAttributeAsString(node, "semantic", null, true);
            var inputSemantic: string = context.getAttributeAsString(node, "input_semantic", null, true);
            var inputSet: number = context.getAttributeAsInt(node, "input_set", null, false);

            if ((semantic != null) && (inputSemantic != null)) {
                instanceMaterial.vertexInputs[semantic] = {
                    inputSemantic: inputSemantic,
                    inputSet: inputSet
                };
            } else {
                context.log.write("Skipped a material vertex binding because of missing semantics.", LogLevel.Warning);
            }
        }

        /**
        *   Parses a <instance_material>/<bind> element.
        */
        static parseBind(node: Node, instanceMaterial: COLLADA.Loader.InstanceMaterial, context: COLLADA.Loader.Context) {
            var semantic: string = context.getAttributeAsString(node, "semantic", null, false);
            var target: SidLink = context.getAttributeAsSidLink(node, "target", null, true);

            if (semantic != null) {
                instanceMaterial.params[semantic] = {
                    target: target
                };
            } else {
                context.log.write("Skipped a material uniform binding because of missing semantics.", LogLevel.Warning);
            }
        }
    }
}