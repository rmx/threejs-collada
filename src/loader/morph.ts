/// <reference path="context.ts" />
/// <reference path="element.ts" />

module COLLADA.Loader {

    export class Morph extends COLLADA.Loader.Element {

        constructor() {
            super();
        }

        /**
        *   Parses a <morph> element.
        */
        static parse(node: Node, context: COLLADA.Loader.Context): COLLADA.Loader.Morph {
            var result: COLLADA.Loader.Morph = new COLLADA.Loader.Morph();

            context.log.write("Morph controllers not implemented", LogLevel.Error);

            return result;
        }

    }
}