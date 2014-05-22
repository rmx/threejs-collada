/// <reference path="log.ts" />
/// <reference path="exporter/document.ts" />
/// <reference path="exporter/context.ts" />
/// <reference path="exporter/material.ts" />
/// <reference path="exporter/geometry.ts" />
/// <reference path="exporter/bone.ts" />
/// <reference path="exporter/animation.ts" />
/// <reference path="exporter/animation_track.ts" />

class ColladaExporter {
    log: Log;

    constructor() {
        this.log = new ColladaLogConsole();
    }

    export(doc: ColladaConverterFile): ColladaExporterDocument {
        var context: ColladaExporterContext = new ColladaExporterContext(this.log);

        var info: ColladaExporterInfoJSON = {
            bbox_min: [Infinity, Infinity, Infinity],
            bbox_max: [-Infinity, -Infinity, -Infinity]
        };
        var converter_materials: ColladaConverterMaterial[] = [];
        var materials: ColladaExporterMaterial[] = [];
        var geometries: ColladaExporterGeometry[] = [];
        var bones: ColladaExporterBone[] = [];
        var animations: ColladaExporterAnimation[] = [];

        // Geometries
        for (var g: number = 0; g < doc.geometries.length; ++g) {
            var converter_geometry: ColladaConverterGeometry = doc.geometries[g];

            // Chunks
            for (var c: number = 0; c < converter_geometry.chunks.length; ++c) {
                var chunk: ColladaConverterGeometryChunk = converter_geometry.chunks[c];

                // Create the material, if it does not exist yet
                var material_index: number = converter_materials.indexOf(chunk.material);
                if (material_index === -1) {
                    var material: ColladaExporterMaterial = ColladaExporterMaterial.create(chunk.material, context);
                    material_index = materials.length;

                    converter_materials.push(chunk.material);
                    materials.push(material);
                }

                // Create the geometry
                var geometry: ColladaExporterGeometry = ColladaExporterGeometry.create(chunk, context);
                geometry.material = material_index;
                geometries.push(geometry);

                // Bounding box
                for (var d: number = 0; d < 3; ++d) {
                    info.bbox_min[d] = Math.min(info.bbox_min[d], chunk.bbox_min[d]);
                    info.bbox_max[d] = Math.max(info.bbox_max[d], chunk.bbox_max[d]);
                }
            }

            // Bones
            for (var b: number = 0; b < converter_geometry.bones.length; ++b) {
                var converter_bone: ColladaConverterBone = converter_geometry.bones[b];
                var bone: ColladaExporterBone = ColladaExporterBone.create(converter_bone, context);
                bones.push(bone);
            }
        }

        // Animations
        for (var a: number = 0; a < doc.resampled_animations.length; ++a) {
            var converter_animation: ColladaConverterAnimationData = doc.resampled_animations[a];
            var animation: ColladaExporterAnimation = ColladaExporterAnimation.create(converter_animation, context);
            animations.push(animation);
        }

        // Result
        var result: ColladaExporterDocument = new ColladaExporterDocument();

        // Assemble result: JSON part
        result.json = {
            info: info,
            materials: materials.map((e) => e.toJSON()),
            geometries: geometries.map((e) => e.toJSON()),
            bones: bones.map((e) => e.toJSON()),
            animations: animations.map((e) => e.toJSON())
        };

        // Assemble result: Binary data part
        result.data = context.assembleData();
        //result.json.data = ColladaExporterUtils.bufferToString(result.data);

        return result;
    }
}