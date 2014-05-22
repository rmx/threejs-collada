module COLLADA.Converter {

    export class OptionBool {
        value: boolean;
        description: string;

        constructor(defaultValue: boolean, description: string) {
            this.value = defaultValue;
            this.description = description;
        }
    }

    export class OptionFloat {
        value: number;
        min: number;
        max: number;
        description: string;

        constructor(defaultValue: number, min: number, max: number, description: string) {
            this.value = defaultValue;
            this.min = min;
            this.max = max;
            this.description = description;
        }
    }

    export class OptionArray<T> {
        value: T[];
        description: string;

        constructor(defaultValue: T[], description: string) {
            this.value = defaultValue;
            this.description = description;
        }
    }

    export class Options {
        singleAnimation: OptionBool;
        singleGeometry: OptionBool;
        enableAnimations: OptionBool;
        useAnimationLabels: OptionBool;
        enableExtractGeometry: OptionBool;
        enableResampledAnimations: OptionBool;
        animationLabels: OptionArray<COLLADA.Converter.AnimationLabel>;
        animationFps: OptionFloat;
        removeConstAnimationTracks: OptionBool;

        constructor() {
            this.singleAnimation = new OptionBool(true,
                "If enabled, all animations are merged into a single animation. Enable if each bone has a separate top level animation.");
            this.singleGeometry = new OptionBool(true,
                "If enabled, all geometries are merged into a single geometry. Only has an effect if 'extractGeometry' is enabled.");
            this.enableAnimations = new OptionBool(true,
                "If enabled, animations are exported. Otherwise, all animations are ignored.");
            this.enableExtractGeometry = new OptionBool(true,
                "If enabled, extracts all geometries from the scene and detaches them from their scene graph nodes. Otherwise, geometries remain attached to nodes.");
            this.enableResampledAnimations = new OptionBool(true,
                "If enabled, generates resampled animations for all skeleton bones.");
            this.useAnimationLabels = new OptionBool(false,
                "If enabled, animations labels are used to split the global animation into separete animations.");
            this.animationLabels = new OptionArray<COLLADA.Converter.AnimationLabel>([],
                "An array of animation labels ({name, begin, end, fps)} that describes how the global animation is split. Only has an effect if 'useAnimationLabels' is enabled.");
            this.animationFps = new OptionFloat(10, 0, 100,
                "Default FPS for resampled animations.");
            this.removeConstAnimationTracks = new OptionBool(true,
                "If enabled, animation tracks are removed if they only contain the rest pose transformation for all times.");
        }

    }
}