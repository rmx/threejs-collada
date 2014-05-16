class ColladaExporterMaterial {
    name: string;
    diffuse: string;
    specular: string;
    normal: string;

    constructor() {
        this.name = null;
        this.diffuse = null;
        this.specular = null;
        this.normal = null;
    }

    static create(material: ColladaConverterMaterial, context: ColladaExporterContext): ColladaExporterMaterial {
        var result: ColladaExporterMaterial = new ColladaExporterMaterial();
        result.name = material.name || "material";
        result.diffuse = (material.diffuse !== null) ? (material.diffuse.url) : null;
        result.specular = (material.specular !== null) ? (material.specular.url) : null;
        result.normal = (material.normal !== null) ? (material.normal.url) : null;
        return result;
    }

    toJSON(): ColladaExporterMaterialJSON {
        // Required properties
        var result: ColladaExporterMaterialJSON = {
            name: this.name,
        };

        // Optional properties
        if (this.diffuse !== null) {
            result.diffuse = this.diffuse;
        }
        if (this.specular !== null) {
            result.specular = this.specular;
        }
        if (this.normal !== null) {
            result.normal = this.normal;
        }
        return result;
    }
};