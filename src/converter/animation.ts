/// <reference path="../math.ts" />
/// <reference path="context.ts" />
/// <reference path="utils.ts" />
/// <reference path="animation_channel.ts" />

module COLLADA.Converter {

    export interface AnimationTarget {
        applyAnimation(channel: COLLADA.Converter.AnimationChannel, time: number, context: COLLADA.Context): void;
        registerAnimation(channel: COLLADA.Converter.AnimationChannel): void;
        getTargetDataRows(): number;
        getTargetDataColumns(): number;
    }

    export class AnimationTimeStatistics {
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
            this.maxTime = Math.max(this.maxTime, maxTime);
            this.minAvgFps = Math.min(this.minAvgFps, avgFps);
            this.maxAvgFps = Math.max(this.maxAvgFps, avgFps);
            this.sumAvgFps += avgFps;
        }
    }

    export class Animation {
        id: string;
        name: string;
        channels: COLLADA.Converter.AnimationChannel[];

        constructor() {
            this.id = null;
            this.name = null;
            this.channels = [];
        }

        static create(animation: COLLADA.Loader.Animation, context: COLLADA.Converter.Context): COLLADA.Converter.Animation {
            var result: COLLADA.Converter.Animation = new COLLADA.Converter.Animation();
            result.id = animation.id;
            result.name = animation.name;

            COLLADA.Converter.Animation.addChannelsToAnimation(animation, result, context);

            return result;
        }

        static addChannelsToAnimation(collada_animation: COLLADA.Loader.Animation, converter_animation: COLLADA.Converter.Animation, context: COLLADA.Converter.Context) {
            // Channels
            for (var i: number = 0; i < collada_animation.channels.length; ++i) {
                var channel: COLLADA.Converter.AnimationChannel = COLLADA.Converter.AnimationChannel.create(collada_animation.channels[i], context);
                converter_animation.channels.push(channel);
            }

            // Children
            for (var i: number = 0; i < collada_animation.children.length; ++i) {
                var child: COLLADA.Loader.Animation = collada_animation.children[i];
                COLLADA.Converter.Animation.addChannelsToAnimation(child, converter_animation, context);
            }
        }

        /**
        * Returns the time and fps statistics of this animation
        */
        static getTimeStatistics(animation: COLLADA.Converter.Animation, index_begin: number, index_end: number, result: COLLADA.Converter.AnimationTimeStatistics, context: COLLADA.Converter.Context) {
            // Channels
            for (var i: number = 0; i < animation.channels.length; ++i) {
                var channel: COLLADA.Converter.AnimationChannel = animation.channels[i];
                var channelMinTime: number = channel.input[(index_begin !== null) ? index_begin : 0];
                var channelMaxTime: number = channel.input[(index_end !== null) ? index_end : (channel.input.length - 1)];
                var channelAvgFps: number = channel.input.length / (channelMaxTime - channelMinTime);

                result.addDataPoint(channelMinTime, channelMaxTime, channelAvgFps);
            }
        }
    }
}