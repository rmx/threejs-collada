/// <reference path="context.ts" />
/// <reference path="element.ts" />
/// <reference path="instance_material.ts" />

interface ColladaControllerContainer extends ColladaElement {
    controllers: ColladaInstanceController[];
}

class ColladaInstanceController extends ColladaElement {
    controller: Link;
    skeletons: Link[];
    materials: ColladaInstanceMaterial[];

    constructor() {
        super();
        this.controller = null;
        this.skeletons = [];
        this.materials = [];
    }

    /**
    *   Parses a <instance_controller> element.
    */
    static parse(node: Node, parent: ColladaControllerContainer, context: ColladaParsingContext): ColladaInstanceController {
        var result: ColladaInstanceController = new ColladaInstanceController();

        result.controller = context.getAttributeAsUrlLink(node, "url", true);
        result.sid = context.getAttributeAsString(node, "sid", null, false);
        result.name = context.getAttributeAsString(node, "name", null, false);
        context.registerSidTarget(result, parent);

        Utils.forEachChild(node, function (child: Node) {
            switch (child.nodeName) {
                case "skeleton":
                    result.skeletons.push(context.createUrlLink(child.textContent));
                    break;
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