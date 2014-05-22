/// <reference path="context.ts" />
/// <reference path="data_chunk.ts" />
/// <reference path="format.ts" />
/// <reference path="../math.ts" />

module COLLADA.Exporter {

    export class Geometry {
        name: string;
        material: number;
        vertex_count: number;
        triangle_count: number;
        bbox_min: number[];
        bbox_max: number[];
        bind_shape_mat: number[];
        indices: COLLADA.Exporter.DataChunk;
        position: COLLADA.Exporter.DataChunk;
        normal: COLLADA.Exporter.DataChunk;
        texcoord: COLLADA.Exporter.DataChunk;
        boneweight: COLLADA.Exporter.DataChunk;
        boneindex: COLLADA.Exporter.DataChunk;

        constructor() {
            this.name = null;
            this.material = null;
            this.vertex_count = null;
            this.triangle_count = null;
            this.bbox_min = null;
            this.bbox_max = null;
            this.bind_shape_mat = null;
            this.indices = null;
            this.position = null;
            this.normal = null;
            this.texcoord = null;
            this.boneweight = null;
            this.boneindex = null;
        }

        static create(chunk: COLLADA.Converter.GeometryChunk, context: COLLADA.Exporter.Context): COLLADA.Exporter.Geometry {
            var result: COLLADA.Exporter.Geometry = new COLLADA.Exporter.Geometry();
            result.name = chunk.name;
            result.material = null;
            result.vertex_count = chunk.vertexCount;
            result.triangle_count = chunk.triangleCount;
            result.bbox_min = [chunk.bbox_min[0], chunk.bbox_min[1], chunk.bbox_min[2]];
            result.bbox_max = [chunk.bbox_max[0], chunk.bbox_max[1], chunk.bbox_max[2]];
            result.indices = COLLADA.Exporter.DataChunk.create(chunk.indices, 3, context);
            result.position = COLLADA.Exporter.DataChunk.create(chunk.position, 3, context);
            result.normal = COLLADA.Exporter.DataChunk.create(chunk.normal, 3, context);
            result.texcoord = COLLADA.Exporter.DataChunk.create(chunk.texcoord, 2, context);
            result.boneweight = COLLADA.Exporter.DataChunk.create(chunk.boneweight, 4, context);
            result.boneindex = COLLADA.Exporter.DataChunk.create(chunk.boneindex, 4, context);

            if (chunk.bindShapeMatrix !== null) {
                result.bind_shape_mat = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
                COLLADA.MathUtils.copyNumberArray(chunk.bindShapeMatrix, result.bind_shape_mat, 16);
            }

            return result;
        }

        toJSON(): COLLADA.Exporter.GeometryJSON {
            // Required properties
            var result: COLLADA.Exporter.GeometryJSON = {
                name: this.name,
                material: this.material,
                vertex_count: this.vertex_count,
                triangle_count: this.triangle_count,
                bbox_min: this.bbox_min,
                bbox_max: this.bbox_max,
                indices: this.indices.toJSON(),
                position: this.position.toJSON()
            }

        // Optional properties
        if (this.normal !== null) {
                result.normal = this.normal.toJSON();
            }
            if (this.texcoord !== null) {
                result.texcoord = this.texcoord.toJSON();
            }
            if (this.boneweight !== null) {
                result.boneweight = this.boneweight.toJSON();
            }
            if (this.boneindex !== null) {
                result.boneindex = this.boneindex.toJSON();
            }
            if (this.bind_shape_mat !== null) {
                result.bind_shape_mat = this.bind_shape_mat;
            }

            return result;
        }
    }
}