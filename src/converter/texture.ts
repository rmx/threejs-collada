module COLLADA.Converter {

    export class Texture {
        id: string;
        url: string;

        constructor(img: COLLADA.Loader.Image) {
            this.id = img.id;
            this.url = "";
        }

        static createTexture(colorOrTexture: COLLADA.Loader.ColorOrTexture, context: COLLADA.Converter.Context): COLLADA.Converter.Texture {
            if (colorOrTexture === null) {
                return null;
            }
            if (colorOrTexture.textureSampler === null) {
                return null;
            }
            var textureSamplerParam: COLLADA.Loader.EffectParam = COLLADA.Loader.EffectParam.fromLink(colorOrTexture.textureSampler, context);
            if (textureSamplerParam === null) {
                context.log.write("Texture sampler not found, texture will be missing", LogLevel.Warning);
                return null;
            }
            var textureSampler: COLLADA.Loader.EffectSampler = textureSamplerParam.sampler;
            if (textureSampler === null) {
                context.log.write("Texture sampler param has no sampler, texture will be missing", LogLevel.Warning);
                return null;
            }
            var textureImage: COLLADA.Loader.Image = null;
            if (textureSampler.image != null) {
                // Collada 1.5 path: texture -> sampler -> image
                textureImage = COLLADA.Loader.Image.fromLink(textureSampler.image, context);
                if (textureImage === null) {
                    context.log.write("Texture image not found, texture will be missing", LogLevel.Warning);
                    return null;
                }
            } else if (textureSampler.surface != null) {
                // Collada 1.4 path: texture -> sampler -> surface -> image
                var textureSurfaceParam: COLLADA.Loader.EffectParam = COLLADA.Loader.EffectParam.fromLink(textureSampler.surface, context);
                if (textureSurfaceParam === null) {
                    context.log.write("Texture surface not found, texture will be missing", LogLevel.Warning);
                    return null;
                }
                var textureSurface: COLLADA.Loader.EffectSurface = textureSurfaceParam.surface;
                if (textureSurface === null) {
                    context.log.write("Texture surface param has no surface, texture will be missing", LogLevel.Warning);
                    return null;
                }
                textureImage = COLLADA.Loader.Image.fromLink(textureSurface.initFrom, context);
                if (textureImage === null) {
                    context.log.write("Texture image not found, texture will be missing", LogLevel.Warning);
                    return null;
                }
            }

            var result: COLLADA.Converter.Texture = context.textures.findConverter(textureImage);
            if (result) return result;

            result = new COLLADA.Converter.Texture(textureImage);
            result.url = textureImage.initFrom;
            context.textures.register(textureImage, result);

            return result;
        }
    }
}