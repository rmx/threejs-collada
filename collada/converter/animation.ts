
interface ColladaConverterAnimationTarget {
    applyAnimation(channel: ColladaConverterAnimationChannel, time: number, context: ColladaProcessingContext): void;
    registerAnimation(channel: ColladaConverterAnimationChannel): void;
    getTargetDataRows(): number;
    getTargetDataColumns(): number;
}

class ColladaConverterAnimationTimeStatistics {
    /** Start of the time line */
    minTime: number;
    /** End of the time line */
    maxTime: number;
    /** Minimum average fps among all animation tracks */
    minAvgFps: number;
    /** Maximum average fps among all animation tracks */
    maxAvgFps: number;
    /** Sum of average fps of all tracks */
    sumAvgFps: number;
    /** Number of data points */
    count: number;

    constructor() {
        this.minTime = Infinity;
        this.maxTime = -Infinity;
        this.minAvgFps = Infinity;
        this.maxAvgFps = -Infinity;
        this.sumAvgFps = 0;
        this.count = 0;
    }

    avgFps(): number {
        return (this.count > 0) ? (this.sumAvgFps / this.count) : null;
    }

    addDataPoint(minTime: number, maxTime: number, avgFps: number) {
        this.count++;
        this.minTime = Math.min(this.minTime, minTime);
        this.maxTime = Math.min(this.maxTime, maxTime);
        this.minAvgFps = Math.min(this.minAvgFps, avgFps);
        this.maxAvgFps = Math.min(this.maxAvgFps, avgFps);
        this.sumAvgFps += avgFps;
    }
}

class ColladaConverterAnimation {
    id: string;
    name: string;
    channels: ColladaConverterAnimationChannel[];

    constructor() {
        this.id = null;
        this.name = null;
        this.channels = [];
    }

    static create(animation: ColladaAnimation, context: ColladaConverterContext): ColladaConverterAnimation {
        var result: ColladaConverterAnimation = new ColladaConverterAnimation();
        result.id = animation.id;
        result.name = animation.name;

        ColladaConverterAnimation.addChannelsToAnimation(animation, result, context);
        
        return result;
    }

    static addChannelsToAnimation(collada_animation: ColladaAnimation, converter_animation: ColladaConverterAnimation, context: ColladaConverterContext) {
        // Channels
        for (var i: number = 0; i < collada_animation.channels.length; ++i) {
            var channel: ColladaConverterAnimationChannel = ColladaConverterAnimationChannel.create(collada_animation.channels[i], context);
            converter_animation.channels.push(channel);
        }

        // Children
        for (var i: number = 0; i < collada_animation.children.length; ++i) {
            var child: ColladaAnimation = collada_animation.children[i];
            ColladaConverterAnimation.addChannelsToAnimation(child, converter_animation, context);
        }
    }

    /**
    * Returns the time and fps statistics of this animation
    */
    static getTimeStatistics(animation: ColladaConverterAnimation, index_begin: number, index_end: number, result: ColladaConverterAnimationTimeStatistics, context: ColladaConverterContext) {
        // Channels
        for (var i: number = 0; i < animation.channels.length; ++i) {
            var channel: ColladaConverterAnimationChannel = animation.channels[i];
            var channelMinTime: number = channel.input[(index_begin !== null) ? index_begin : 0];
            var channelMaxTime: number = channel.input[(index_end !== null) ? index_end : (channel.input.length - 1)];
            var channelAvgFps: number = channel.input.length / (channelMaxTime - channelMinTime);

            result.addDataPoint(channelMinTime, channelMaxTime, channelAvgFps);
        }
    }
}