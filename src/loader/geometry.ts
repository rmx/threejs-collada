/// <reference path="context.ts" />
/// <reference path="element.ts" />
/// <reference path="source.ts" />
/// <reference path="triangles.ts" />
/// <reference path="vertices.ts" />
/// <reference path="utils.ts" />

module COLLADA.Loader {

    export class Geometry extends COLLADA.Loader.Element {
        sources: COLLADA.Loader.Source[];
        vertices: COLLADA.Loader.Vertices[];
        triangles: COLLADA.Loader.Triangles[];

        constructor() {
            super();
            this.sources = [];
            this.vertices = [];
            this.triangles = [];
        }

        static fromLink(link: Link, context: COLLADA.Context): COLLADA.Loader.Geometry {
            return COLLADA.Loader.Element._fromLink<COLLADA.Loader.Geometry>(link, COLLADA.Loader.Geometry, "COLLADA.Loader.Geometry", context);
        }

        /**
        *   Parses a <geometry> element
        */
        static parse(node: Node, context: COLLADA.Loader.Context): COLLADA.Loader.Geometry {
            var result: COLLADA.Loader.Geometry = new COLLADA.Loader.Geometry();

            result.id = context.getAttributeAsString(node, "id", null, true);
            result.name = context.getAttributeAsString(node, "name", null, false);
            context.registerUrlTarget(result, true);

            Utils.forEachChild(node, function (child: Node) {
                switch (child.nodeName) {
                    case "mesh":
                        COLLADA.Loader.Geometry.parseMesh(child, result, context);
                        break;
                    case "convex_mesh":
                    case "spline":
                        context.log.write("Geometry type " + child.nodeName + " not supported.", LogLevel.Error);
                        break;
                    case "extra":
                        COLLADA.Loader.Geometry.parseGeometryExtra(child, result, context);
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
        static parseMesh(node: Node, geometry: COLLADA.Loader.Geometry, context: COLLADA.Loader.Context) {
            Utils.forEachChild(node, function (child: Node) {
                switch (child.nodeName) {
                    case "source":
                        geometry.sources.push(COLLADA.Loader.Source.parse(child, context));
                        break;
                    case "vertices":
                        geometry.vertices.push(COLLADA.Loader.Vertices.parse(child, context));
                        break;
                    case "triangles":
                    case "polylist":
                    case "polygons":
                        geometry.triangles.push(COLLADA.Loader.Triangles.parse(child, context));
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
        static parseGeometryExtra(node: Node, geometry: COLLADA.Loader.Geometry, context: COLLADA.Loader.Context) {
            Utils.forEachChild(node, function (child: Node) {
                switch (child.nodeName) {
                    case "technique":
                        var profile: string = context.getAttributeAsString(child, "profile", null, true);
                        COLLADA.Loader.Geometry.parseGeometryExtraTechnique(child, geometry, profile, context);
                        break;
                    default:
                        context.reportUnexpectedChild(child);
                }
            });
        }

        /**
        *   Parses a <geometry>/<extra>/<technique> element
        */
        static parseGeometryExtraTechnique(node: Node, geometry: COLLADA.Loader.Geometry, profile: string, context: COLLADA.Loader.Context) {
            Utils.forEachChild(node, function (child: Node) {
                switch (child.nodeName) {
                    default:
                        context.reportUnhandledChild(child);
                }
            });
        }
    };
}