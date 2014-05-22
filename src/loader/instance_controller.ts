/// <reference path="context.ts" />
/// <reference path="element.ts" />
/// <reference path="bind_material.ts" />
/// <reference path="instance_material.ts" />
/// <reference path="utils.ts" />

module COLLADA.Loader {

    export interface InstanceControllerContainer extends COLLADA.Loader.Element {
        controllers: COLLADA.Loader.InstanceController[];
    }

    export class InstanceController extends COLLADA.Loader.Element {
        controller: Link;
        skeletons: Link[];
        materials: COLLADA.Loader.InstanceMaterial[];

        constructor() {
            super();
            this.controller = null;
            this.skeletons = [];
            this.materials = [];
        }

        /**
        *   Parses a <instance_controller> element.
        */
        static parse(node: Node, parent: COLLADA.Loader.InstanceControllerContainer, context: COLLADA.Loader.Context): COLLADA.Loader.InstanceController {
            var result: COLLADA.Loader.InstanceController = new COLLADA.Loader.InstanceController();

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
                        COLLADA.Loader.BindMaterial.parse(child, result, context);
                        break;
                    default:
                        context.reportUnexpectedChild(child);
                }
            });

            return result;
        }
    };
}