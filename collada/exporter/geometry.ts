class ColladaExporterGeometry {
    name: string;
    material: number;
    vertex_count: number;
    triangle_count: number;
    indices: ColladaExporterDataChunk;
    position: ColladaExporterDataChunk;
    normal: ColladaExporterDataChunk;
    texcoord: ColladaExporterDataChunk;
    boneweight: ColladaExporterDataChunk;
    boneindex: ColladaExporterDataChunk;

    constructor() {
        this.name = null;
        this.material = null;
        this.vertex_count = null;
        this.triangle_count = null;
        this.indices = null;
        this.position = null;
        this.normal = null;
        this.texcoord = null;
        this.boneweight = null;
        this.boneindex = null;
    }

    static create(geometry: ColladaConverterGeometryChunk, context: ColladaExporterContext): ColladaExporterGeometry {
        var result: ColladaExporterGeometry = new ColladaExporterGeometry();
        result.name = geometry.name;
        result.material = null;
        result.vertex_count = geometry.vertexCount;
        result.triangle_count = geometry.triangleCount;
        result.indices = ColladaExporterDataChunk.create(geometry.indices, 3, context);
        result.position = ColladaExporterDataChunk.create(geometry.position, 3, context);
        result.normal = ColladaExporterDataChunk.create(geometry.normal, 3, context);
        result.texcoord = ColladaExporterDataChunk.create(geometry.texcoord, 2, context);
        result.boneweight = ColladaExporterDataChunk.create(geometry.boneweight, 4, context);
        result.boneindex = ColladaExporterDataChunk.create(geometry.boneindex, 4, context);

        return result;
    }

    toJSON(): ColladaExporterGeometryJSON {
        // Required properties
        var result: ColladaExporterGeometryJSON = {
            name: this.name,
            material: this.material,
            vertex_count: this.vertex_count,
            triangle_count: this.triangle_count,
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

        return result;
    }
}