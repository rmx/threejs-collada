interface ColladaConverterAnimationLabel {
    name: string;
    begin: number;
    end: number;
    fps: number;
}

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
            return null;
        }

        // Duration (in seconds)
        var start_time: number = stat.minTime;
        var end_time: number = stat.maxTime;
        var duration: number = end_time - start_time;

        // Keyframes (always include first and last keyframe)
        var keyframes: number = Math.ceil(fps * duration) + 1;
        fps = (keyframes - 1) / duration;
        var spf: number = 1 / fps;

        // Store fps
        result.fps = fps;
        result.keyframes = keyframes;
        result.duration = duration;

        if (!(fps > 0)) {
            context.log.write("Invalid FPS: "+fps+", skipping animation", LogLevel.Warning);
        }
        if (!(duration > 0)) {
            context.log.write("Invalid duration: " + duration + ", skipping animation", LogLevel.Warning);
        }
        if (!(keyframes > 0)) {
            context.log.write("Invalid number of keyframes: " + keyframes + ", skipping animation", LogLevel.Warning);
        }

        // Init result
        for (var i: number = 0; i < bones.length; ++i) {
            var bone: ColladaConverterBone = bones[i];
            var track: ColladaConverterAnimationDataTrack = new ColladaConverterAnimationDataTrack();

            track.pos = new Float32Array(keyframes * 3);
            track.rot = new Float32Array(keyframes * 4);
            track.scl = new Float32Array(keyframes * 3);

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
                var channel: ColladaConverterAnimationChannel = src_channels[c];
                channel.target.applyAnimation(channel, time, context);
            }

            // Extract bone poses
            for (var b: number = 0; b < bones.length; ++b) {
                var bone: ColladaConverterBone = bones[b];
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

        // Reset the bone poses
        for (var i: number = 0; i < bones.length; ++i) {
            var bone: ColladaConverterBone = bones[i];
            bone.node.resetAnimation();
        }

        // Remove unnecessary tracks
        for (var b: number = 0; b < bones.length; ++b) {
            var bone: ColladaConverterBone = bones[b];
            var track: ColladaConverterAnimationDataTrack = result_tracks[b];

            // Get rest pose transformation of the current bone
            bone.node.getLocalTransform(pos, rot, scl);
            
            // Check whether there are any changes to the rest pose
            var pos_change: number = 0;
            var rot_change: number = 0;
            var scl_change: number = 0;
            for (var k: number = 0; k < keyframes; ++k) {
                pos_change = Math.max(pos_change, Math.abs(track.pos[k * 3 + 0] - pos[0]));
                pos_change = Math.max(pos_change, Math.abs(track.pos[k * 3 + 1] - pos[1]));
                pos_change = Math.max(pos_change, Math.abs(track.pos[k * 3 + 2] - pos[2]));

                rot_change = Math.max(rot_change, Math.abs(track.rot[k * 4 + 0] - rot[0]));
                rot_change = Math.max(rot_change, Math.abs(track.rot[k * 4 + 1] - rot[1]));
                rot_change = Math.max(rot_change, Math.abs(track.rot[k * 4 + 2] - rot[2]));
                rot_change = Math.max(rot_change, Math.abs(track.rot[k * 4 + 3] - rot[3]));

                scl_change = Math.max(scl_change, Math.abs(track.scl[k * 3 + 0] - scl[0]));
                scl_change = Math.max(scl_change, Math.abs(track.scl[k * 3 + 1] - scl[1]));
                scl_change = Math.max(scl_change, Math.abs(track.scl[k * 3 + 2] - scl[2]));
            }

            // Delete tracks that do not contain any animation
            // TODO: This needs better tolerances.
            // TODO: Maybe use relative instead of absolute tolerances?
            // TODO: For COLLADA files that use matrix animations, the decomposition will have low precision
            // TODO: and scale will have an absolute error of >1e-2 even if the scale never changes in the original modelling application.
            var tol_pos: number = 1e-4;
            var tol_rot: number = 1e-4;
            var tol_scl: number = 1e-4;
            if (pos_change < tol_pos) {
                track.pos = null;
            }
            if (rot_change < tol_rot) {
                track.rot = null;
            }
            if (scl_change < tol_scl) {
                track.scl = null;
            }
        }

        return result;
    }

    static createFromLabels(bones: ColladaConverterBone[], animation: ColladaConverterAnimation,
        labels: ColladaConverterAnimationLabel[], context: ColladaConverterContext): ColladaConverterAnimationData[] {

        var result: ColladaConverterAnimationData[] = [];

        for (var i: number = 0; i < labels.length; ++i) {
            var label: ColladaConverterAnimationLabel = labels[i];
            var data: ColladaConverterAnimationData = ColladaConverterAnimationData.create(bones, animation, label.begin, label.end, label.fps, context);
            if (data !== null) {
                data.name = label.name;
                result.push(data);
            }
        }

        return result;
    }
}