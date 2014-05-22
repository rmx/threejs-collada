/// <reference path="context.ts" />
/// <reference path="element.ts" />
/// <reference path="sampler.ts" />
/// <reference path="source.ts" />
/// <reference path="channel.ts" />
/// <reference path="utils.ts" />

module COLLADA.Loader {

    export class Animation extends COLLADA.Loader.Element {
        parent: COLLADA.Loader.Animation;
        children: COLLADA.Loader.Animation[];
        sources: COLLADA.Loader.Source[];
        samplers: COLLADA.Loader.Sampler[];
        channels: COLLADA.Loader.Channel[];

        constructor() {
            super();
            this.parent = null;
            this.children = [];
            this.sources = [];
            this.samplers = [];
            this.channels = [];
        }

        root(): COLLADA.Loader.Animation {
            if (this.parent != null) {
                return this.parent.root();
            } else {
                return this;
            }
        }

        /**
        *   Parses an <animation> element.
        */
        static parse(node: Node, context: COLLADA.Loader.Context): COLLADA.Loader.Animation {
            var result: COLLADA.Loader.Animation = new COLLADA.Loader.Animation();

            result.id = context.getAttributeAsString(node, "id", null, false);
            result.name = context.getAttributeAsString(node, "name", null, false);

            context.registerUrlTarget(result, false);

            Utils.forEachChild(node, function (child: Node) {
                switch (child.nodeName) {
                    case "animation":
                        var animation: COLLADA.Loader.Animation = COLLADA.Loader.Animation.parse(child, context);
                        animation.parent = result;
                        result.children.push(animation);
                        break;
                    case "source":
                        result.sources.push(COLLADA.Loader.Source.parse(child, context));
                        break;
                    case "sampler":
                        result.samplers.push(COLLADA.Loader.Sampler.parse(child, context));
                        break;
                    case "channel":
                        result.channels.push(COLLADA.Loader.Channel.parse(child, result, context));
                        break;
                    default:
                        context.reportUnexpectedChild(child);
                }
            });

            return result;
        }

    };
}