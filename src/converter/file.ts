/// <reference path="node.ts" />
/// <reference path="animation.ts" />
/// <reference path="animation_data.ts" />
/// <reference path="geometry.ts" />

module COLLADA.Converter {

    export class Document {
        /** The scene graph */
        nodes: COLLADA.Converter.Node[];
        /** Animations (all original animation curves) */
        animations: COLLADA.Converter.Animation[];
        /** Animations (resampled node animations) */
        resampled_animations: COLLADA.Converter.AnimationData[];
        /** Geometries (detached from the scene graph) */
        geometries: COLLADA.Converter.Geometry[];

        constructor() {
            this.nodes = [];
            this.animations = [];
            this.geometries = [];
            this.resampled_animations = [];
        }
    }
}