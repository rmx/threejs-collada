
interface ColladaExporterDataChunk {
    type: string;
    byte_offset: number;
    stride: number;
    count: number;
};

interface ColladaExporterMaterial {
    name: string;
    diffuse: string;
    specular: string;
    normal: string;
};

interface ColladaExporterGeometry {
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
};

interface ColladaExporterBone {
    name: string;
    parent: number;
    skinned: boolean;
    inv_bind_mat: number[];
    pos: number[]; 
    rot: number[];
    scl: number[];
};

interface ColladaExporterAnimationTrack {
    bone: number;
    pos: ColladaExporterDataChunk;
    rot: ColladaExporterDataChunk;
    scl: ColladaExporterDataChunk;
};

interface ColladaExporterAnimation {
    name: string;
    tracks: ColladaExporterAnimationTrack[];
};

interface ColladaExporterDocument {
    materials: ColladaExporterMaterial[];
    geometries: ColladaExporterGeometry[];
    bones: ColladaExporterBone[];
    animations: ColladaExporterAnimation[];
};