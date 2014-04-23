
class ColladaInput extends ColladaElement {
    /** "VERTEX", "POSITION", "NORMAL", "TEXCOORD", ... */
    semantic: string;
    /** URL of source object */
    source: UrlLink;
    /** Offset in index array */
    offset: number;
    /** Optional set identifier */
    set: number;

    constructor() {
        super();
        this.semantic = null;
        this.source = null;
        this.offset = null;
        this.set = null;
    }

    /**
    *   Parses an <input> element.
    */
    static parse(node: Node, shared: boolean, context: ColladaParsingContext): ColladaInput {
        var result: ColladaInput = new ColladaInput();

        result.semantic = context.getAttributeAsString(node, "semantic", null, true);
        result.source = context.getAttributeAsUrlLink(node, "source", true);

        if (shared) {
            result.offset = context.getAttributeAsInt(node, "offset", 0, true);
            result.set = context.getAttributeAsInt(node, "set", null, false);
        }

        return result;
    }

}