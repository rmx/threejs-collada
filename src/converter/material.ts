class ColladaConverterMaterialMap {
    symbols: { [symbol: string]: ColladaConverterMaterial };

    constructor() {
        this.symbols = {};
    }
}

class ColladaConverterMaterial {
    name: string;
    diffuse: ColladaConverterTexture;
    specular: ColladaConverterTexture;
    normal: ColladaConverterTexture;

    constructor() {
        this.name = null;
        this.diffuse = null;
        this.specular = null;
        this.normal = null;
    }

    static createDefaultMaterial(context: ColladaConverterContext): ColladaConverterMaterial {
        var result: ColladaConverterMaterial = context.materials.findConverter(null);
        if (result) {
            return result;
        } else {
            result = new ColladaConverterMaterial();
            context.materials.register(null, result);
            return result;
        }
    }

    static createMaterial(instanceMaterial: ColladaInstanceMaterial, context: ColladaConverterContext): ColladaConverterMaterial {

        var material: ColladaMaterial = ColladaMaterial.fromLink(instanceMaterial.material, context);
        if (material === null) {
            context.log.write("Material not found, material skipped.", LogLevel.Warning);
            return ColladaConverterMaterial.createDefaultMaterial(context);
        }

        var effect: ColladaEffect = ColladaEffect.fromLink(material.effect, context);
        if (effect === null) {
            context.log.write("Material effect not found, using default material", LogLevel.Warning);
            return ColladaConverterMaterial.createDefaultMaterial(context);
        }

        var technique: ColladaEffectTechnique = effect.technique;
        if (technique === null) {
            context.log.write("Material effect not found, using default material", LogLevel.Warning);
            return ColladaConverterMaterial.createDefaultMaterial(context);
        }

        if (technique.diffuse.color !== null || technique.specular.color !== null) {
            context.log.write("Material " + material.id + " contains constant colors, colors ignored", LogLevel.Warning);
        }

        var result: ColladaConverterMaterial = context.materials.findConverter(material);
        if (result) return result;

        result = new ColladaConverterMaterial();
        result.name = material.id;
        result.diffuse = ColladaConverterTexture.createTexture(technique.diffuse, context);
        result.specular = ColladaConverterTexture.createTexture(technique.specular, context);
        result.normal = ColladaConverterTexture.createTexture(technique.bump, context);
        context.materials.register(material, result);

        return result;
    }

    static getMaterialMap(instanceMaterials: ColladaInstanceMaterial[], context: ColladaConverterContext): ColladaConverterMaterialMap {
        var result: ColladaConverterMaterialMap = new ColladaConverterMaterialMap();

        var numMaterials: number = 0;
        for (var i: number = 0; i < instanceMaterials.length; i++) {
            var instanceMaterial: ColladaInstanceMaterial = instanceMaterials[i];

            var symbol: string = instanceMaterial.symbol;
            if (symbol === null) {
                context.log.write("Material instance has no symbol, material skipped.", LogLevel.Warning);
                continue;
            }

            if (result.symbols[symbol] != null) {
                context.log.write("Material symbol " + symbol + " used multiple times", LogLevel.Error);
                continue;
            }

            result.symbols[symbol] = ColladaConverterMaterial.createMaterial(instanceMaterial, context);
        }
        return result;
    }
}