interface ColladaConverterAnimationLabel {
    name: string;
    begin: number;
    end: number;
    fps: number;
}

class ColladaConverterAnimationDataTrack {
    /** Position (relative to parent) */
    pos: Float32Array;
    /** Rotation (relative to parent) */
    rot: Float32Array;
    /** Scale (relative to parent) */
    scl: Float32Array;
    /** Position (relative to rest pose) */
    rel_pos: Float32Array;
    /** Rotation (relative to rest pose) */
    rel_rot: Float32Array;
    /** Scale (relative to rest pose) */
    rel_scl: Float32Array;

    constructor() {
        this.pos = null;
        this.rot = null;
        this.scl = null;
        this.rel_pos = null;
        this.rel_rot = null;
        this.rel_scl = null;
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

            track.rel_pos = new Float32Array(keyframes * 3);
            track.rel_rot = new Float32Array(keyframes * 4);
            track.rel_scl = new Float32Array(keyframes * 3);

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

                var mat: Mat4 = bone.node.getLocalMatrix();
                ColladaMath.decompose(mat, pos, rot, scl);

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
        var output_relative: boolean = false;
        var pos0: Vec3 = vec3.create();
        var inv_pos0: Vec3 = vec3.create();
        var rot0: Quat = quat.create();
        var inv_rot0: Quat = quat.create();
        var scl0: Vec3 = vec3.create();
        var inv_scl0: Vec3 = vec3.create();
        for (var b: number = 0; b < bones.length; ++b) {
            var bone: ColladaConverterBone = bones[b];
            var track: ColladaConverterAnimationDataTrack = result_tracks[b];

            // Get rest pose transformation of the current bone
            var mat0: Mat4 = bone.node.getLocalMatrix();
            ColladaMath.decompose(mat0, pos0, rot0, scl0);

            quat.invert(inv_rot0, rot0);
            vec3.negate(inv_pos0, pos0);
            vec3.set(inv_scl0, 1 / scl0[0], 1 / scl0[1], 1 / scl0[2]);

            // Check whether there are any changes to the rest pose
            var pos_change: number = 0;
            var rot_change: number = 0;
            var scl_change: number = 0;
            var max_pos_change: number = 0; // max length
            var max_rot_change: number = 0; // max rotation angle (in radians)
            var max_scl_change: number = 0; // max scale along any axis

            for (var k: number = 0; k < keyframes; ++k) {

                // Relative position
                pos[0] = track.pos[k * 3 + 0];
                pos[1] = track.pos[k * 3 + 1];
                pos[2] = track.pos[k * 3 + 2];
                vec3.add(pos, inv_pos0, pos0);
                pos_change = vec3.length(pos);
                max_pos_change = Math.max(max_pos_change, pos_change);

                // Relative rotation
                rot[0] = track.rot[k * 4 + 0];
                rot[1] = track.rot[k * 4 + 1];
                rot[2] = track.rot[k * 4 + 2];
                rot[3] = track.rot[k * 4 + 3];
                quat.multiply(rot, inv_rot0, rot);
                rot_change = 2 * Math.acos(Math.min(Math.max(rot[3], -1), 1));
                max_rot_change = Math.max(max_rot_change, rot_change);

                // Relative scale
                scl[0] = track.scl[k * 3 + 0];
                scl[1] = track.scl[k * 3 + 1];
                scl[2] = track.scl[k * 3 + 2];
                vec3.multiply(scl, inv_scl0, scl);
                scl_change = Math.max(Math.abs(1 - scl[0]), Math.abs(1 - scl[1]), Math.abs(1 - scl[2]));
                max_scl_change = Math.max(max_scl_change, scl_change);

                // Store relative transformations
                track.rel_pos[k * 3 + 0] = pos[0];
                track.rel_pos[k * 3 + 1] = pos[1];
                track.rel_pos[k * 3 + 2] = pos[2];

                track.rel_scl[k * 3 + 0] = scl[0];
                track.rel_scl[k * 3 + 1] = scl[1];
                track.rel_scl[k * 3 + 2] = scl[2];

                track.rel_rot[k * 4 + 0] = rot[0];
                track.rel_rot[k * 4 + 1] = rot[1];
                track.rel_rot[k * 4 + 2] = rot[2];
                track.rel_rot[k * 4 + 3] = rot[3];
            }

            // Delete tracks that do not contain any animation
            if (context.options.removeConstAnimationTracks.value === true) {
                // TODO: This needs better tolerances.
                // TODO: Maybe use relative instead of absolute tolerances?
                // TODO: For COLLADA files that use matrix animations, the decomposition will have low precision
                // TODO: and scale will have an absolute error of >1e-2 even if the scale never changes in the original modelling application.
                var tol_pos: number = 1e-4;
                var tol_rot: number = 0.05; // 0.05 radians (2.86 degrees) rotation
                var tol_scl: number = 0.01; // 1% scaling
                if (max_pos_change < tol_pos) {
                    track.pos = null;
                    track.rel_pos = null;
                }
                if (max_rot_change < tol_rot) {
                    track.rot = null;
                    track.rel_rot = null;
                }
                if (max_scl_change < tol_scl) {
                    track.scl = null;
                    track.rel_scl = null;
                }
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