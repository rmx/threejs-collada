/// <reference path="context.ts" />
/// <reference path="animation_track.ts" />
/// <reference path="format.ts" />

module COLLADA.Exporter {

    export class Animation {
        name: string;
        frames: number;
        fps: number;
        tracks: COLLADA.Exporter.AnimationTrack[];

        constructor() {
            this.name = null;
            this.frames = null;
            this.fps = null;
            this.tracks = [];
        }

        static create(animation: COLLADA.Converter.AnimationData, context: COLLADA.Exporter.Context): COLLADA.Exporter.Animation {
            var result: COLLADA.Exporter.Animation = new COLLADA.Exporter.Animation();
            result.name = animation.name;
            result.frames = animation.keyframes;
            result.fps = animation.fps;

            for (var i: number = 0; i < animation.tracks.length; ++i) {
                var converter_track: COLLADA.Converter.AnimationDataTrack = animation.tracks[i];
                var track: COLLADA.Exporter.AnimationTrack = COLLADA.Exporter.AnimationTrack.create(converter_track, i, context);
                result.tracks.push(track);
            }
            return result;
        }

        toJSON(): COLLADA.Exporter.AnimationJSON {
            return {
                name: this.name,
                frames: this.frames,
                fps: this.fps,
                tracks: this.tracks.map((e) => e.toJSON())
            };
        }
    }
}