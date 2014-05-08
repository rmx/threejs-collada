
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
    tracks: ColladaExporterAnimationTrackJSON[];
};

interface ColladaExporterDocumentJSON {
    materials: ColladaExporterMaterialJSON[];
    geometries: ColladaExporterGeometryJSON[];
    bones: ColladaExporterBoneJSON[];
    animations: ColladaExporterAnimationJSON[];
};