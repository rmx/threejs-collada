/// <reference path="context.ts" />
/// <reference path="element.ts" />
/// <reference path="input.ts" />
/// <reference path="utils.ts" />

class ColladaTriangles extends ColladaElement {
    /** "triangles", "polylist", or "polygons" */
    type: string;
    count: number;
    /** A material "symbol", bound by <bind_material> */
    material: string;
    inputs: ColladaInput[];
    indices: Int32Array;
    vcount: Int32Array;

    constructor() {
        super();
        this.type = null;
        this.count = null;
        this.material = null;
        this.inputs = [];
        this.indices = null;
        this.vcount = null;
    }

    /**
    *   Parses a <triangles> element.
    */
    static parse(node: Node, context: ColladaParsingContext): ColladaTriangles {
        var result: ColladaTriangles = new ColladaTriangles();

        result.name = context.getAttributeAsString(node, "name", null, false);
        result.material = context.getAttributeAsString(node, "material", null, false);
        result.count = context.getAttributeAsInt(node, "count", 0, true);
        result.type = node.nodeName;

        Utils.forEachChild(node, function (child: Node) {
            switch (child.nodeName) {
                case "input":
                    result.inputs.push(ColladaInput.parse(child, true, context));
                    break;
                case "vcount":
                    result.vcount = context.strToInts(child.textContent);
                    break;
                case "p":
                    result.indices = context.strToInts(child.textContent);
                    break;
                default:
                    context.reportUnexpectedChild(child);
            }
        });

        return result;
    }

}