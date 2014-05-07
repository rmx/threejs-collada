/// <reference path="context.ts" />
/// <reference path="element.ts" />
/// <reference path="instance_material.ts" />

class ColladaInstanceGeometry extends ColladaElement {
    geometry: Link;
    materials: ColladaInstanceMaterial[];

    constructor() {
        super();
        this.geometry = null;
        this.materials = [];
    }

    /**
    *   Parses a <instance_geometry> element.
    */
    static parse(node: Node, parent: ColladaElement, context: ColladaParsingContext): ColladaInstanceGeometry {
        var result: ColladaInstanceGeometry = new ColladaInstanceGeometry();

        result.geometry = context.getAttributeAsUrlLink(node, "url", true);
        result.sid = context.getAttributeAsString(node, "sid", null, false);

        Utils.forEachChild(node, function (child: Node) {
            switch (child.nodeName) {
                case "bind_material":
                    ColladaBindMaterial.parse(child, result, context);
                    break;
                default:
                    context.reportUnexpectedChild(child);
            }
        });

        return result;
    }

   
};