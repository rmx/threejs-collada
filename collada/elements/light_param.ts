
class ColladaLightParam extends ColladaElement {
    value: number;

    constructor() {
        super();
        this.value = null;
    }

    /**
    *   Parses a light parameter element.
    */
    static parse(node: Node, context: ColladaParsingContext): ColladaLightParam {
        var result: ColladaLightParam = new ColladaLightParam();

        result.sid = context.getAttributeAsString(node, "sid", null, false);
        result.name = node.nodeName;
        result.value = parseFloat(node.textContent);

        return result;
    }

}