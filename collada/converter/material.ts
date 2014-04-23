interface ColladaConverterJSONMaterial {
    diffuse: string;
    specular: string;
    normal: string;
}

class ColladaConverterMaterial {
    diffuse: string;
    specular: string;
    normal: string;

    constructor() {
        this.diffuse = "";
        this.specular = "";
        this.normal = "";
    }

    toJSON(): ColladaConverterJSONMaterial {
        return {
            diffuse: this.diffuse,
            specular: this.specular,
            normal: this.normal
        };
    }
}