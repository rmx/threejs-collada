/// <reference path="log.ts" />
/// <reference path="exporter/document.ts" />
/// <reference path="exporter/context.ts" />
/// <reference path="exporter/material.ts" />
/// <reference path="exporter/geometry.ts" />
/// <reference path="exporter/bone.ts" />
/// <reference path="exporter/animation.ts" />
/// <reference path="exporter/animation_track.ts" />

module COLLADA.Exporter {

    export class ColladaExporter {
        log: Log;

        constructor() {
            this.log = new LogConsole();
        }

        export(doc: COLLADA.Converter.Document): COLLADA.Exporter.Document {
            var context: COLLADA.Exporter.Context = new COLLADA.Exporter.Context(this.log);

            var info: COLLADA.Exporter.InfoJSON = {
                bbox_min: [Infinity, Infinity, Infinity],
                bbox_max: [-Infinity, -Infinity, -Infinity]
            };
            var converter_materials: COLLADA.Converter.Material[] = [];
            var materials: COLLADA.Exporter.Material[] = [];
            var geometries: COLLADA.Exporter.Geometry[] = [];



            var bones: COLLADA.Exporter.Bone[] = [];
            var animations: COLLADA.Exporter.Animation[] = [];

            // Geometries
            for (var g: number = 0; g < doc.geometries.length; ++g) {
                var converter_geometry: COLLADA.Converter.Geometry = doc.geometries[g];

                // Chunks
                for (var c: number = 0; c < converter_geometry.chunks.length; ++c) {
                    var chunk: COLLADA.Converter.GeometryChunk = converter_geometry.chunks[c];

                    // Create the material, if it does not exist yet
                    var material_index: number = converter_materials.indexOf(chunk.material);
                    if (material_index === -1) {
                        var material: COLLADA.Exporter.Material = COLLADA.Exporter.Material.create(chunk.material, context);
                        material_index = materials.length;

                        converter_materials.push(chunk.material);
                        materials.push(material);
                    }

                    // Create the geometry
                    var geometry: COLLADA.Exporter.Geometry = COLLADA.Exporter.Geometry.create(chunk, context);
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
                    var converter_bone: COLLADA.Converter.Bone = converter_geometry.bones[b];
                    var bone: COLLADA.Exporter.Bone = COLLADA.Exporter.Bone.create(converter_bone, context);
                    bones.push(bone);
                }
            }

            // Animations
            for (var a: number = 0; a < doc.resampled_animations.length; ++a) {
                var converter_animation: COLLADA.Converter.AnimationData = doc.resampled_animations[a];
                var animation: COLLADA.Exporter.Animation = COLLADA.Exporter.Animation.create(converter_animation, context);
                animations.push(animation);
            }

            // Result
            var result: COLLADA.Exporter.Document = new COLLADA.Exporter.Document();

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
            //result.json.data = COLLADA.Exporter.Utils.bufferToString(result.data);

            return result;
        }
    }
}