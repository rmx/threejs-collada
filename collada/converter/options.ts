
class ColladaConverterOptionBool {
    value: boolean;
    description: string;

    constructor(defaultValue: boolean, description: string) {
        this.value = defaultValue;
        this.description = description;
    }
}

class ColladaConverterOptions {
    singleAnimation: ColladaConverterOptionBool;
    enableAnimations: ColladaConverterOptionBool;

    constructor() {
        this.singleAnimation = new ColladaConverterOptionBool(true, "If enabled, all animations are merged into a single animation. Enable if each bone has a separate top level animation.");
        this.enableAnimations = new ColladaConverterOptionBool(true, "If enabled, animations are exported. Otherwise, static geometry is exported.");
    }

}