
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

    constructor() {
        this.singleAnimation = new ColladaConverterOptionBool(true, "Combines all animations into a single animation. Enable if each bone has a separate animation.");
    }

}