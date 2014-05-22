/// <reference path="context.ts" />
/// <reference path="element.ts" />
/// <reference path="utils.ts" />

module COLLADA.Loader {

    export class LightParam extends COLLADA.Loader.Element {
        value: number;

        constructor() {
            super();
            this.value = null;
        }

        /**
        *   Parses a light parameter element.
        */
        static parse(node: Node, context: COLLADA.Loader.Context): COLLADA.Loader.LightParam {
            var result: COLLADA.Loader.LightParam = new COLLADA.Loader.LightParam();

            result.sid = context.getAttributeAsString(node, "sid", null, false);
            result.name = node.nodeName;
            result.value = parseFloat(node.textContent);

            return result;
        }

    }
}