/// <reference path="context.ts" />
/// <reference path="data_chunk.ts" />
/// <reference path="format.ts" />

module COLLADA.Exporter {

    export class AnimationTrack {
        pos: COLLADA.Exporter.DataChunk;
        rot: COLLADA.Exporter.DataChunk;
        scl: COLLADA.Exporter.DataChunk;
        bone: number;

        constructor() {
            this.pos = null;
            this.rot = null;
            this.scl = null;
            this.bone = null;
        }

        static create(track: COLLADA.Converter.AnimationDataTrack, bone: number, context: COLLADA.Exporter.Context): COLLADA.Exporter.AnimationTrack {
            var result: COLLADA.Exporter.AnimationTrack = new COLLADA.Exporter.AnimationTrack();
            result.bone = bone;
            result.pos = COLLADA.Exporter.DataChunk.create(track.pos, 3, context);
            result.rot = COLLADA.Exporter.DataChunk.create(track.rot, 4, context);
            result.scl = COLLADA.Exporter.DataChunk.create(track.scl, 3, context);

            return result;
        }

        toJSON(): COLLADA.Exporter.AnimationTrackJSON {
            // Required properties
            var result: COLLADA.Exporter.AnimationTrackJSON = {
                bone: this.bone
            };

            // Optional properties
            if (this.pos !== null) {
                result.pos = this.pos.toJSON();
            }
            if (this.rot !== null) {
                result.rot = this.rot.toJSON();
            }
            if (this.scl !== null) {
                result.scl = this.scl.toJSON();
            }

            return result;
        }
    }
}