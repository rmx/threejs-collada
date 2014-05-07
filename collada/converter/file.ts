class ColladaConverterFile {
    /** The scene graph */
    nodes: ColladaConverterNode[];
    /** Animations (all original animation curves) */
    animations: ColladaConverterAnimation[];
    /** Animations (resampled node animations) */
    resampled_animations: ColladaConverterAnimationData[];
    /** Geometries (detached from the scene graph) */
    geometries: ColladaConverterGeometry[];

    constructor() {
        this.nodes = [];
        this.animations = [];
        this.geometries = [];
        this.resampled_animations = [];
    }
    
}