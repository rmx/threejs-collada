/// <reference path="element.ts" />
/// <reference path="../context.ts" />

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