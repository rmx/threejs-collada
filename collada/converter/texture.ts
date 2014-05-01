
class ColladaConverterTexture {
    id: string;
    url: string;

    constructor(img: ColladaImage) {
        this.id = img.id;
        this.url = "";
    }

    static createTexture(colorOrTexture: ColladaColorOrTexture, context: ColladaConverterContext): ColladaConverterTexture {
        if (colorOrTexture === null) {
            return null;
        }
        if (colorOrTexture.textureSampler === null) {
            return null;
        }
        var textureSamplerParam: ColladaEffectParam = ColladaEffectParam.fromLink(colorOrTexture.textureSampler, context);
        if (textureSamplerParam === null) {
            context.log.write("Texture sampler not found, texture will be missing", LogLevel.Warning);
            return null;
        }
        var textureSampler: ColladaEffectSampler = textureSamplerParam.sampler;
        if (textureSampler === null) {
            context.log.write("Texture sampler param has no sampler, texture will be missing", LogLevel.Warning);
            return null;
        }
        var textureImage: ColladaImage = null;
        if (textureSampler.image != null) {
            // Collada 1.5 path: texture -> sampler -> image
            textureImage = ColladaImage.fromLink(textureSampler.image, context);
            if (textureImage === null) {
                context.log.write("Texture image not found, texture will be missing", LogLevel.Warning);
                return null;
            }
        } else if (textureSampler.surface != null) {
            // Collada 1.4 path: texture -> sampler -> surface -> image
            var textureSurfaceParam: ColladaEffectParam = ColladaEffectParam.fromLink(textureSampler.surface, context);
            if (textureSurfaceParam === null) {
                context.log.write("Texture surface not found, texture will be missing", LogLevel.Warning);
                return null;
            }
            var textureSurface: ColladaEffectSurface = textureSurfaceParam.surface;
            if (textureSurface === null) {
                context.log.write("Texture surface param has no surface, texture will be missing", LogLevel.Warning);
                return null;
            }
            textureImage = ColladaImage.fromLink(textureSurface.initFrom, context);
            if (textureImage === null) {
                context.log.write("Texture image not found, texture will be missing", LogLevel.Warning);
                return null;
            }
        }

        var result: ColladaConverterTexture = context.findTexture(textureImage);
        if (result) return result;

        result = new ColladaConverterTexture(textureImage);
        result.url = textureImage.initFrom;
        context.registerTexture(textureImage, result);

        return result;
    }
}