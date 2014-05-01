/**
* A map that maps various COLLADA objects to converter objects
* 
* The converter does not store direct references to COLLADA objects,
* so that the old COLLADA document can be garbage collected.
*/
class ColladaConverterObjectMap<ColladaType, ConverterType> {
    collada: ColladaType[];
    converter: ConverterType[];

    constructor() {
        this.collada = [];
        this.converter = [];
    }

    register(collada: ColladaType, converter: ConverterType) {
        this.collada.push(collada);
        this.converter.push(converter);
    }

    findConverter(collada: ColladaType): ConverterType {
        for (var i: number = 0; i < this.collada.length; ++i) {
            if (this.collada[i] === collada) return this.converter[i];
        }
        return null;
    }

    findCollada(converter: ConverterType): ColladaType {
        for (var i: number = 0; i < this.collada.length; ++i) {
            if (this.converter[i] === converter) return this.collada[i];
        }
        return null;
    }
}

class ColladaConverterContext implements ColladaProcessingContext {
    materials: ColladaConverterObjectMap<ColladaMaterial, ColladaConverterMaterial>;
    textures: ColladaConverterObjectMap<ColladaImage, ColladaConverterTexture>;
    nodes: ColladaConverterObjectMap<ColladaVisualSceneNode, ColladaConverterNode>;
    animationTargets: ColladaConverterObjectMap <ColladaElement, ColladaConverterAnimationTarget>;
    log: Log;

    constructor() {
        this.log = null;
        this.materials = new ColladaConverterObjectMap<ColladaMaterial, ColladaConverterMaterial>();
        this.textures = new ColladaConverterObjectMap<ColladaImage, ColladaConverterTexture>();
        this.nodes = new ColladaConverterObjectMap<ColladaVisualSceneNode, ColladaConverterNode>();
        this.animationTargets = new ColladaConverterObjectMap<ColladaElement, ColladaConverterAnimationTarget>();
    }
}