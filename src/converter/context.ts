/// <reference path="../context.ts" />
/// <reference path="material.ts" />
/// <reference path="node.ts" />
/// <reference path="texture.ts" />
/// <reference path="animation.ts" />

module COLLADA.Converter {

    /**
    * A map that maps various COLLADA objects to converter objects
    * 
    * The converter does not store direct references to COLLADA objects,
    * so that the old COLLADA document can be garbage collected.
    */
    export class ObjectMap<ColladaType, ConverterType> {
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

    export class Context implements COLLADA.Context {
        materials: COLLADA.Converter.ObjectMap<COLLADA.Loader.Material, COLLADA.Converter.Material>;
        textures: COLLADA.Converter.ObjectMap<COLLADA.Loader.Image, COLLADA.Converter.Texture>;
        nodes: COLLADA.Converter.ObjectMap<COLLADA.Loader.VisualSceneNode, COLLADA.Converter.Node>;
        animationTargets: COLLADA.Converter.ObjectMap<COLLADA.Loader.Element, COLLADA.Converter.AnimationTarget>;
        log: Log;
        options: COLLADA.Converter.Options;

        constructor(log: Log, options: COLLADA.Converter.Options) {
            this.log = log;
            this.options = options;
            this.materials = new COLLADA.Converter.ObjectMap<COLLADA.Loader.Material, COLLADA.Converter.Material>();
            this.textures = new COLLADA.Converter.ObjectMap<COLLADA.Loader.Image, COLLADA.Converter.Texture>();
            this.nodes = new COLLADA.Converter.ObjectMap<COLLADA.Loader.VisualSceneNode, COLLADA.Converter.Node>();
            this.animationTargets = new COLLADA.Converter.ObjectMap<COLLADA.Loader.Element, COLLADA.Converter.AnimationTarget>();
        }
    }
}