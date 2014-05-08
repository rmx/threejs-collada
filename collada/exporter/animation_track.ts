class ColladaExporterAnimationTrack {
    pos: ColladaExporterDataChunk;
    rot: ColladaExporterDataChunk;
    scl: ColladaExporterDataChunk;
    bone: number;

    constructor() {
        this.pos = null;
        this.rot = null;
        this.scl = null;
        this.bone = null;
    }

    static create(track: ColladaConverterAnimationDataTrack, bone:number, context: ColladaExporterContext): ColladaExporterAnimationTrack {
        var result: ColladaExporterAnimationTrack = new ColladaExporterAnimationTrack();
        result.bone = bone;
        result.pos = ColladaExporterDataChunk.create(track.pos, 3, context);
        result.rot = ColladaExporterDataChunk.create(track.rot, 4, context);
        result.scl = ColladaExporterDataChunk.create(track.scl, 3, context);

        return result;
    }

    toJSON(): ColladaExporterAnimationTrackJSON {
        // Required properties
        var result: ColladaExporterAnimationTrackJSON = {
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