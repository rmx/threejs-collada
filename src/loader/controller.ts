/// <reference path="context.ts" />
/// <reference path="element.ts" />
/// <reference path="skin.ts" />
/// <reference path="morph.ts" />
/// <reference path="utils.ts" />

module COLLADA.Loader {

    export class Controller extends COLLADA.Loader.Element {
        skin: COLLADA.Loader.Skin;
        morph: COLLADA.Loader.Morph;

        constructor() {
            super();
            this.skin = null;
            this.morph = null;
        }

        static fromLink(link: Link, context: COLLADA.Context): COLLADA.Loader.Controller {
            return COLLADA.Loader.Element._fromLink<COLLADA.Loader.Controller>(link, COLLADA.Loader.Controller, "COLLADA.Loader.Controller", context);
        }

        /**
        *   Parses a <controller> element.
        */
        static parse(node: Node, context: COLLADA.Loader.Context): COLLADA.Loader.Controller {
            var result: COLLADA.Loader.Controller = new COLLADA.Loader.Controller();

            result.id = context.getAttributeAsString(node, "id", null, true);
            result.name = context.getAttributeAsString(node, "name", null, false);
            context.registerUrlTarget(result, true);

            Utils.forEachChild(node, function (child: Node) {
                switch (child.nodeName) {
                    case "skin":
                        if (result.skin != null) {
                            context.log.write("Controller " + result.id + " has multiple skins", LogLevel.Error);
                        }
                        result.skin = COLLADA.Loader.Skin.parse(child, context);
                        break;
                    case "morph":
                        if (result.morph != null) {
                            context.log.write("Controller " + result.id + " has multiple morphs", LogLevel.Error);
                        }
                        result.morph = COLLADA.Loader.Morph.parse(child, context);
                        break;
                    default:
                        context.reportUnexpectedChild(child);
                }
            });

            return result;
        }

    }
}