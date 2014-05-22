/// <reference path="context.ts" />
/// <reference path="element.ts" />
/// <reference path="instance_material.ts" />
/// <reference path="utils.ts" />

module COLLADA.Loader {

    export class InstanceGeometry extends COLLADA.Loader.Element {
        geometry: Link;
        materials: COLLADA.Loader.InstanceMaterial[];

        constructor() {
            super();
            this.geometry = null;
            this.materials = [];
        }

        /**
        *   Parses a <instance_geometry> element.
        */
        static parse(node: Node, parent: COLLADA.Loader.Element, context: COLLADA.Loader.Context): COLLADA.Loader.InstanceGeometry {
            var result: COLLADA.Loader.InstanceGeometry = new COLLADA.Loader.InstanceGeometry();

            result.geometry = context.getAttributeAsUrlLink(node, "url", true);
            result.sid = context.getAttributeAsString(node, "sid", null, false);

            Utils.forEachChild(node, function (child: Node) {
                switch (child.nodeName) {
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