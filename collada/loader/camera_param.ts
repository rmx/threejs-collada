/// <reference path="context.ts" />
/// <reference path="element.ts" />

class ColladaCameraParam extends ColladaElement {
    value: number;

    constructor() {
        super();
        this.value = null;
    }

    /**
    *   Parses a camera parameter element.
    */
    static parse(node: Node, context: ColladaParsingContext): ColladaCameraParam {
        var result: ColladaCameraParam = new ColladaCameraParam();

        result.sid = context.getAttributeAsString(node, "sid", null, false);
        result.name = node.nodeName;
        result.value = parseFloat(node.textContent);

        return result;
    }

}