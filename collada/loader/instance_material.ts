/// <reference path="../element.ts" />
/// <reference path="../context.ts" />

interface ColladaInstanceMaterialVertexInput {
    inputSemantic: string;
    inputSet: number;
}

interface ColladaInstanceMaterialParam {
    target: SidLink;
}

interface ColladaInstanceMaterialContainer extends ColladaElement{
    materials: ColladaInstanceMaterial[];
}

class ColladaInstanceMaterial extends ColladaElement {
    material: UrlLink;
    symbol: string;
    /** Contains uniform parameters */
    params: { [s: string]: ColladaInstanceMaterialParam; }
    /** Contains vertex paramters */
    vertexInputs: { [s: string]: ColladaInstanceMaterialVertexInput; }

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
    static parse(node: Node, parent: ColladaInstanceMaterialContainer, context: ColladaParsingContext): ColladaInstanceMaterial {
        var result: ColladaInstanceMaterial = new ColladaInstanceMaterial();

        result.symbol = context.getAttributeAsString(node, "symbol", null, false);
        result.material = context.getAttributeAsUrlLink(node, "target", true);
        context.registerSidTarget(result, parent);

        Utils.forEachChild(node, function (child: Node) {
            switch (child.nodeName) {
                case "bind_vertex_input":
                    ColladaInstanceMaterial.parseBindVertexInput(child, result, context);
                    break;
                case "bind":
                    ColladaInstanceMaterial.parseBind(child, result, context);
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
    static parseBindVertexInput(node: Node, instanceMaterial: ColladaInstanceMaterial, context: ColladaParsingContext) {
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
    static parseBind(node: Node, instanceMaterial: ColladaInstanceMaterial, context: ColladaParsingContext) {
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