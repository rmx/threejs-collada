/// <reference path="context.ts" />
/// <reference path="element.ts" />
/// <reference path="sampler.ts" />
/// <reference path="source.ts" />
/// <reference path="channel.ts" />
/// <reference path="utils.ts" />

class ColladaAnimation extends ColladaElement {
    parent: ColladaAnimation;
    children: ColladaAnimation[];
    sources: ColladaSource[];
    samplers: ColladaSampler[];
    channels: ColladaChannel[];

    constructor() {
        super();
        this.parent = null;
        this.children = [];
        this.sources = [];
        this.samplers = [];
        this.channels = [];
    }

    root(): ColladaAnimation {
        if (this.parent != null) {
            return this.parent.root();
        } else {
            return this;
        }
    }

    /**
    *   Parses an <animation> element.
    */
    static parse(node: Node, context: ColladaParsingContext): ColladaAnimation {
        var result: ColladaAnimation = new ColladaAnimation();

        result.id = context.getAttributeAsString(node, "id", null, false);
        result.name = context.getAttributeAsString(node, "name", null, false);

        context.registerUrlTarget(result, false);

        Utils.forEachChild(node, function (child: Node) {
            switch (child.nodeName) {
                case "animation":
                    var animation: ColladaAnimation = ColladaAnimation.parse(child, context);
                    animation.parent = result;
                    result.children.push(animation);
                    break;
                case "source":
                    result.sources.push(ColladaSource.parse(child, context));
                    break;
                case "sampler":
                    result.samplers.push(ColladaSampler.parse(child, context));
                    break;
                case "channel":
                    result.channels.push(ColladaChannel.parse(child, result, context));
                    break;
                default:
                    context.reportUnexpectedChild(child);
            }
        });

        return result;
    }

};