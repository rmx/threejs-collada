/// <reference path="context.ts" />
/// <reference path="utils.ts" />

class ColladaBindMaterial {

    /**
       *   Parses a <bind_material> element. Can be child of <instance_geometry> or <instance_controller>
       */
    static parse(node: Node, parent: ColladaInstanceMaterialContainer, context: ColladaParsingContext) {
        Utils.forEachChild(node, function (child: Node) {
            switch (child.nodeName) {
                case "technique_common":
                    ColladaBindMaterial.parseTechniqueCommon(child, parent, context);
                    break;
                default:
                    context.reportUnexpectedChild(child);
            }
        });
    }

    /**
    *   Parses a <instance_geometry>/<bind_material>/<technique_common> element.
    */
    static parseTechniqueCommon(node: Node, parent: ColladaInstanceMaterialContainer, context: ColladaParsingContext) {
        Utils.forEachChild(node, function (child: Node) {
            switch (child.nodeName) {
                case "instance_material":
                    parent.materials.push(ColladaInstanceMaterial.parse(child, parent, context));
                    break;
                default:
                    context.reportUnexpectedChild(child);
            }
        });
    }
}