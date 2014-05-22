/// <reference path="context.ts" />
/// <reference path="element.ts" />
/// <reference path="source.ts" />
/// <reference path="triangles.ts" />
/// <reference path="vertices.ts" />
/// <reference path="utils.ts" />

class ColladaGeometry extends ColladaElement {
    sources: ColladaSource[];
    vertices: ColladaVertices[];
    triangles: ColladaTriangles[];

    constructor() {
        super();
        this.sources = [];
        this.vertices = [];
        this.triangles = [];
    }

    static fromLink(link: Link, context: ColladaProcessingContext): ColladaGeometry {
        return ColladaElement._fromLink<ColladaGeometry>(link, ColladaGeometry, "ColladaGeometry", context);
    }

    /**
    *   Parses a <geometry> element
    */
    static parse(node: Node, context: ColladaParsingContext): ColladaGeometry {
        var result: ColladaGeometry = new ColladaGeometry();

        result.id = context.getAttributeAsString(node, "id", null, true);
        result.name = context.getAttributeAsString(node, "name", null, false);
        context.registerUrlTarget(result, true);

        Utils.forEachChild(node, function (child: Node) {
            switch (child.nodeName) {
                case "mesh":
                    ColladaGeometry.parseMesh(child, result, context);
                    break;
                case "convex_mesh":
                case "spline":
                    context.log.write("Geometry type " + child.nodeName + " not supported.", LogLevel.Error);
                    break;
                case "extra":
                    ColladaGeometry.parseGeometryExtra(child, result, context);
                    break;
                default:
                    context.reportUnexpectedChild(child);
            }
        });

        return result;
    }

    /**
    *   Parses a <geometry>/<mesh> element
    */
    static parseMesh(node: Node, geometry: ColladaGeometry, context: ColladaParsingContext) {
        Utils.forEachChild(node, function (child: Node) {
            switch (child.nodeName) {
                case "source":
                    geometry.sources.push(ColladaSource.parse(child, context));
                    break;
                case "vertices":
                    geometry.vertices.push(ColladaVertices.parse(child, context));
                    break;
                case "triangles":
                case "polylist":
                case "polygons":
                    geometry.triangles.push(ColladaTriangles.parse(child, context));
                    break;
                case "lines":
                case "linestrips":
                case "trifans":
                case "tristrips":
                    context.log.write("Geometry primitive type " + child.nodeName + " not supported.", LogLevel.Error);
                    break;
                default:
                    context.reportUnexpectedChild(child);
            }
        });
    }

    /**
    *   Parses a <geometry>/<extra> element
    */
    static parseGeometryExtra(node: Node, geometry: ColladaGeometry, context: ColladaParsingContext) {
        Utils.forEachChild(node, function (child: Node) {
            switch (child.nodeName) {
                case "technique":
                    var profile: string = context.getAttributeAsString(child, "profile", null, true);
                    ColladaGeometry.parseGeometryExtraTechnique(child, geometry, profile, context);
                    break;
                default:
                    context.reportUnexpectedChild(child);
            }
        });
    }

    /**
    *   Parses a <geometry>/<extra>/<technique> element
    */
    static parseGeometryExtraTechnique(node: Node, geometry: ColladaGeometry, profile:string, context: ColladaParsingContext) {
        Utils.forEachChild(node, function (child: Node) {
            switch (child.nodeName) {
                default:
                    context.reportUnhandledChild(child);
            }
        });
    }
};