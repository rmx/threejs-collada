
class ColladaConverterContext implements ColladaProcessingContext {
    materials: { [id: string]: ColladaConverterMaterial };
    textures: { [id: string]: ColladaConverterTexture };
    log: Log;

    constructor() {
        this.log = null;
        this.materials = {};
        this.textures = {};
    }

    registerMaterial(mat: ColladaConverterMaterial) {
        this.materials[mat.id] = mat;
    }
    findMaterial(id: string): ColladaConverterMaterial {
        if (this.materials[id]) {
            return this.materials[id];
        } else {
            return null;
        }
    }

    registerTexture(tex: ColladaConverterTexture) {
        this.textures[tex.id] = tex;
    }
    findTexture(id: string): ColladaConverterTexture {
        if (this.textures[id]) {
            return this.textures[id];
        } else {
            return null;
        }
    }
}