class ColladaExporterAnimation {
    name: string;
    frames: number;
    fps: number;
    tracks: ColladaExporterAnimationTrack[];

    constructor() {
        this.name = null;
        this.frames = null;
        this.fps = null;
        this.tracks = [];
    }

    static create(animation: ColladaConverterAnimationData, context: ColladaExporterContext): ColladaExporterAnimation {
        var result: ColladaExporterAnimation = new ColladaExporterAnimation();
        result.name = animation.name;
        result.frames = animation.keyframes;
        result.fps = animation.fps;

        for (var i: number = 0; i < animation.tracks.length; ++i) {
            var converter_track: ColladaConverterAnimationDataTrack = animation.tracks[i];
            var track: ColladaExporterAnimationTrack = ColladaExporterAnimationTrack.create(converter_track, i, context);
            result.tracks.push(track);
        }
        return result;
    }

    toJSON(): ColladaExporterAnimationJSON {
        return {
            name: this.name,
            frames: this.frames,
            fps: this.fps,
            tracks: this.tracks.map((e)=>e.toJSON())
        }
    }
}