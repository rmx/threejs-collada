interface ColladaExporterInfoJSON {
    bbox_min: number[];
    bbox_max: number[];
};

interface ColladaExporterDataChunkJSON {
    type: string;
    byte_offset: number;
    stride: number;
    count: number;
};

interface ColladaExporterMaterialJSON {
    name: string;
    diffuse?: string;
    specular?: string;
    normal?: string;
};

interface ColladaExporterGeometryJSON {
    name: string;
    material: number;
    vertex_count: number;
    triangle_count: number;
    bbox_min: number[];
    bbox_max: number[];
    indices: ColladaExporterDataChunkJSON;
    position: ColladaExporterDataChunkJSON;
    normal?: ColladaExporterDataChunkJSON;
    texcoord?: ColladaExporterDataChunkJSON;
    boneweight?: ColladaExporterDataChunkJSON;
    boneindex?: ColladaExporterDataChunkJSON;
};

interface ColladaExporterBoneJSON {
    name: string;
    parent: number;
    skinned: boolean;
    inv_bind_mat: number[];
    pos: number[]; 
    rot: number[];
    scl: number[];
};

interface ColladaExporterAnimationTrackJSON {
    bone: number;
    pos?: ColladaExporterDataChunkJSON;
    rot?: ColladaExporterDataChunkJSON;
    scl?: ColladaExporterDataChunkJSON;
};

interface ColladaExporterAnimationJSON {
    name: string;
    frames: number;
    fps: number;
    tracks: ColladaExporterAnimationTrackJSON[];
};

interface ColladaExporterDocumentJSON {
    info: ColladaExporterInfoJSON;
    materials: ColladaExporterMaterialJSON[];
    geometries: ColladaExporterGeometryJSON[];
    bones: ColladaExporterBoneJSON[];
    animations: ColladaExporterAnimationJSON[];
    /** Base64 encoded binary data */
    data?: string;
};