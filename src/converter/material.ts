/// <reference path="context.ts" />

module COLLADA.Converter {

    export class MaterialMap {
        symbols: { [symbol: string]: COLLADA.Converter.Material };

        constructor() {
            this.symbols = {};
        }
    }

    export class Material {
        name: string;
        diffuse: COLLADA.Converter.Texture;
        specular: COLLADA.Converter.Texture;
        normal: COLLADA.Converter.Texture;

        constructor() {
            this.name = null;
            this.diffuse = null;
            this.specular = null;
            this.normal = null;
        }

        static createDefaultMaterial(context: COLLADA.Converter.Context): COLLADA.Converter.Material {
            var result: COLLADA.Converter.Material = context.materials.findConverter(null);
            if (result) {
                return result;
            } else {
                result = new COLLADA.Converter.Material();
                context.materials.register(null, result);
                return result;
            }
        }

        static createMaterial(instanceMaterial: COLLADA.Loader.InstanceMaterial, context: COLLADA.Converter.Context): COLLADA.Converter.Material {

            var material: COLLADA.Loader.Material = COLLADA.Loader.Material.fromLink(instanceMaterial.material, context);
            if (material === null) {
                context.log.write("Material not found, material skipped.", LogLevel.Warning);
                return COLLADA.Converter.Material.createDefaultMaterial(context);
            }

            var effect: COLLADA.Loader.Effect = COLLADA.Loader.Effect.fromLink(material.effect, context);
            if (effect === null) {
                context.log.write("Material effect not found, using default material", LogLevel.Warning);
                return COLLADA.Converter.Material.createDefaultMaterial(context);
            }

            var technique: COLLADA.Loader.EffectTechnique = effect.technique;
            if (technique === null) {
                context.log.write("Material effect not found, using default material", LogLevel.Warning);
                return COLLADA.Converter.Material.createDefaultMaterial(context);
            }

            if (technique.diffuse.color !== null || technique.specular.color !== null) {
                context.log.write("Material " + material.id + " contains constant colors, colors ignored", LogLevel.Warning);
            }

            var result: COLLADA.Converter.Material = context.materials.findConverter(material);
            if (result) return result;

            result = new COLLADA.Converter.Material();
            result.name = material.id;
            result.diffuse = COLLADA.Converter.Texture.createTexture(technique.diffuse, context);
            result.specular = COLLADA.Converter.Texture.createTexture(technique.specular, context);
            result.normal = COLLADA.Converter.Texture.createTexture(technique.bump, context);
            context.materials.register(material, result);

            return result;
        }

        static getMaterialMap(instanceMaterials: COLLADA.Loader.InstanceMaterial[], context: COLLADA.Converter.Context): COLLADA.Converter.MaterialMap {
            var result: COLLADA.Converter.MaterialMap = new COLLADA.Converter.MaterialMap();

            var numMaterials: number = 0;
            for (var i: number = 0; i < instanceMaterials.length; i++) {
                var instanceMaterial: COLLADA.Loader.InstanceMaterial = instanceMaterials[i];

                var symbol: string = instanceMaterial.symbol;
                if (symbol === null) {
                    context.log.write("Material instance has no symbol, material skipped.", LogLevel.Warning);
                    continue;
                }

                if (result.symbols[symbol] != null) {
                    context.log.write("Material symbol " + symbol + " used multiple times", LogLevel.Error);
                    continue;
                }

                result.symbols[symbol] = COLLADA.Converter.Material.createMaterial(instanceMaterial, context);
            }
            return result;
        }
    }
}