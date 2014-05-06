class ColladaConverterAnimationDataTrack {
    pos: Float32Array;
    rot: Float32Array;
    scl: Float32Array;

    constructor() {
        this.pos = null;
        this.rot = null;
        this.scl = null;
    }
}

class ColladaConverterAnimationData {
    name: string;
    duration: number;
    keyframes: number;
    fps: number;
    tracks: ColladaConverterAnimationDataTrack[];

    constructor() {
        this.name = "";
        this.duration = null;
        this.keyframes = null;
        this.fps = null;
        this.tracks = [];
    }


    static create(bones: ColladaConverterBone[], animation: ColladaConverterAnimation, index_begin: number, index_end: number, fps: number, context: ColladaConverterContext): ColladaConverterAnimationData {
        var result: ColladaConverterAnimationData = new ColladaConverterAnimationData();
        result.name = animation.name;

        var src_channels: ColladaConverterAnimationChannel[] = animation.channels;

        // Get timeline statistics
        var stat: ColladaConverterAnimationTimeStatistics = new ColladaConverterAnimationTimeStatistics();
        ColladaConverterAnimation.getTimeStatistics(animation, index_begin, index_end, stat, context);

        // Default fps if none give: average fps of source data
        if (fps === null) {
            fps = stat.avgFps();
        }
        if (fps === null || fps <= 0) {
            context.log.write("Could not determine FPS for animation, skipping animation", LogLevel.Warning);
        }

        // Duration (in seconds)
        var start_time: number = stat.minTime;
        var end_time: number = stat.maxTime;
        var duration: number = end_time - start_time;

        // Keyframes (always include first and last keyframe)
        var keyframes: number = Math.ceil(fps * duration) + 1;
        fps = (keyframes - 1) / duration;
        var spf: number = 1 / fps;

        // Init result
        for (var i: number = 0; i < bones.length; ++i) {
            var bone: ColladaConverterBone = bones[i];
            var track: ColladaConverterAnimationDataTrack = new ColladaConverterAnimationDataTrack();

            if (bone.node.isAnimatedBy(animation, ColladaConverterTransformType.Translation)) {
                track.pos = new Float32Array(keyframes * 3);
            }
            if (bone.node.isAnimatedBy(animation, ColladaConverterTransformType.Rotation)) {
                track.rot = new Float32Array(keyframes * 4);
            }
            if (bone.node.isAnimatedBy(animation, ColladaConverterTransformType.Scale)) {
                track.scl = new Float32Array(keyframes * 3);
            }

            result.tracks.push(track);
        }
        var result_tracks: ColladaConverterAnimationDataTrack[] = result.tracks;

        // Reset the bone poses
        for (var i: number = 0; i < bones.length; ++i) {
            var bone: ColladaConverterBone = bones[i];
            bone.node.resetAnimation();            
        }

        // Process all keyframes
        var pos: Vec3 = vec3.create();
        var rot: Quat = quat.create();
        var scl: Vec3 = vec3.create();
        for (var k: number = 0; k < keyframes; ++k) {
            var time: number = start_time + k * spf;

            // Apply all channels to the scene nodes
            // This might be expensive as it resamples the animation
            for (var c: number = 0; c < src_channels.length; ++c) {
                var channel: ColladaConverterAnimationChannel = src_channels[i];
                channel.target.applyAnimation(channel, time, context);
            }

            // Extract bone poses
            for (var b: number = 0; b < bones.length; ++b) {
                var bone: ColladaConverterBone = bones[i];
                var track: ColladaConverterAnimationDataTrack = result_tracks[b];
                bone.node.getLocalTransform(pos, rot, scl);

                if (track.pos !== null) {
                    track.pos[k * 3 + 0] = pos[0];
                    track.pos[k * 3 + 1] = pos[1];
                    track.pos[k * 3 + 2] = pos[2];
                }
                if (track.rot !== null) {
                    track.rot[k * 4 + 0] = rot[0];
                    track.rot[k * 4 + 1] = rot[1];
                    track.rot[k * 4 + 2] = rot[2];
                    track.rot[k * 4 + 3] = rot[3];
                }
                if (track.scl !== null) {
                    track.scl[k * 3 + 0] = scl[0];
                    track.scl[k * 3 + 1] = scl[1];
                    track.scl[k * 3 + 2] = scl[2];
                }
            }
        }

        return result;
    }
}