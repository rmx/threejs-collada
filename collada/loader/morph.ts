
class ColladaMorph extends ColladaElement {

    constructor() {
        super();
    }

    /**
    *   Parses a <morph> element.
    */
    static parse(node: Node, context: ColladaParsingContext): ColladaMorph {
        var result: ColladaMorph = new ColladaMorph();

        context.log.write("Morph controllers not implemented", LogLevel.Error);

        return result;
    }

}