
interface ColladaConverterAnimationTarget {
    applyAnimation(channel: ColladaConverterAnimationChannel, time: number, context: ColladaProcessingContext);
    getTargetDataRows(): number;
    getTargetDataColumns(): number;
}

class ColladaConverterAnimation {
    id: string;
    name: string;
    parent: ColladaConverterAnimation;
    children: ColladaConverterAnimation[];
    channels: ColladaConverterAnimationChannel[];

    constructor() {
        this.id = null;
        this.name = null;
        this.parent = null;
        this.children = [];
        this.channels = [];
    }

    static create(animation: ColladaAnimation, context: ColladaConverterContext): ColladaConverterAnimation {
        var result: ColladaConverterAnimation = new ColladaConverterAnimation();
        result.id = animation.id;
        result.name = animation.name;

        // Channels
        for (var i: number = 0; i < animation.channels.length; ++i) {
            var channel: ColladaConverterAnimationChannel = ColladaConverterAnimationChannel.create(animation.channels[i], context);
            result.channels.push(channel);
        }

        // Children
        for (var i: number = 0; i < animation.children.length; ++i) {
            var child: ColladaConverterAnimation = ColladaConverterAnimation.create(animation.children[i], context);
            result.children.push(child);
        }
        
        return result;
    }
}