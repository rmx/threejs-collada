interface ColladaSourceData {
    length: number;
    [index: number]: any;
}

class ColladaSource extends ColladaElement {
    sourceId: string;
    count: number;
    stride: number;
    offset: number;
    /** Can be one of: Float32Array, Int32Array, Uint8Array, Array<string> */
    data: ColladaSourceData;
    params: { [s: string]: string; }

    constructor() {
        super();
        this.sourceId = null;
        this.count = null;
        this.stride = null;
        this.offset = null;
        this.data = null;
        this.params = {};
    }

    /**
    *   Parses a <source> element
    */
    static parse(node: Node, context: ColladaParsingContext): ColladaSource {
        var result: ColladaSource = new ColladaSource();

        result.id = context.getAttributeAsString(node, "id", null, true);
        result.name = context.getAttributeAsString(node, "name", null, false);
        context.registerUrlTarget(result, true);

        Utils.forEachChild(node, function (child: Node) {
            switch (child.nodeName) {
                case "bool_array":
                    result.sourceId = context.getAttributeAsString(child, "id", null, false);
                    result.data = context.strToBools(child.textContent);
                    break;
                case "float_array":
                    result.sourceId = context.getAttributeAsString(child, "id", null, false);
                    result.data = context.strToFloats(child.textContent);
                    break;
                case "int_array":
                    result.sourceId = context.getAttributeAsString(child, "id", null, false);
                    result.data = context.strToInts(child.textContent);
                    break;
                case "IDREF_array":
                case "Name_array":
                    result.sourceId = context.getAttributeAsString(child, "id", null, false);
                    result.data = context.strToStrings(child.textContent);
                    break;
                case "technique_common":
                    ColladaSource.parseSourceTechniqueCommon(child, result, context);
                    break;
                case "technique":
                    context.reportUnhandledChild(child);
                    break;
                default:
                    context.reportUnexpectedChild(child);
            }
        });

        return result;
    }

    /**
    *   Parses a <source>/<technique_common> element
    */
    static parseSourceTechniqueCommon(node: Node, source: ColladaSource, context: ColladaParsingContext) {
        Utils.forEachChild(node, function (child: Node) {
            switch (child.nodeName) {
                case "accessor":
                    ColladaSource.parseAccessor(child, source, context);
                    break;
                default:
                    context.reportUnexpectedChild(child);
            }
        });
    }

    /**
    *   Parses a <source>/<technique_common>/<accessor> element
    */
    static parseAccessor(node: Node, source: ColladaSource, context: ColladaParsingContext) {

        var sourceId: string = context.getAttributeAsString(node, "source", null, true);
        source.count = context.getAttributeAsInt(node, "count", 0, true);
        source.stride = context.getAttributeAsInt(node, "stride", 1, false);
        source.offset = context.getAttributeAsInt(node, "offset", 0, false);
        if (sourceId !== "#" + source.sourceId) {
            context.log.write("Source " + source.id + "uses a non-local data source, this is not supported", LogLevel.Error);
        }

        Utils.forEachChild(node, function (child: Node) {
            switch (child.nodeName) {
                case "param":
                    ColladaSource.parseAccessorParam(child, source, context);
                    break;
                default:
                    context.reportUnexpectedChild(child);
            }
        });
    }

    /**
    *   Parses a <source>/<technique_common>/<accessor>/<param> element
    */
    static parseAccessorParam(node: Node, source: ColladaSource, context: ColladaParsingContext) {

        var name: string = context.getAttributeAsString(node, "name", null, false);
        var semantic: string = context.getAttributeAsString(node, "semantic", null, false);
        var type: string = context.getAttributeAsString(node, "type", null, true);
        var sid: string = context.getAttributeAsString(node, "sid", null, false);

        if ((name != null) && (type != null)) {
            source.params[name] = type;
        } else if ((semantic != null) && (type != null)) {
            source.params[semantic] = type;
        } else {
            context.log.write("Accessor param for source " + source.id + " ignored due to missing type, name, or semantic", LogLevel.Warning);
        }
    }
}