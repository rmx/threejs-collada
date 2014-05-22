module COLLADA.Exporter {

    export interface InfoJSON {
        bbox_min: number[];
        bbox_max: number[];
    };

    export interface DataChunkJSON {
        type: string;
        byte_offset: number;
        stride: number;
        count: number;
    };

    export interface MaterialJSON {
        name: string;
        diffuse?: string;
        specular?: string;
        normal?: string;
    };

    export interface GeometryJSON {
        name: string;
        material: number;
        vertex_count: number;
        triangle_count: number;
        bbox_min: number[];
        bbox_max: number[];
        bind_shape_mat?: number[];
        indices: DataChunkJSON;
        position: DataChunkJSON;
        normal?: DataChunkJSON;
        texcoord?: DataChunkJSON;
        boneweight?: DataChunkJSON;
        boneindex?: DataChunkJSON;
    };

    export interface BoneJSON {
        name: string;
        parent: number;
        skinned: boolean;
        inv_bind_mat: number[];
        pos: number[];
        rot: number[];
        scl: number[];
    };

    export interface AnimationTrackJSON {
        bone: number;
        pos?: DataChunkJSON;
        rot?: DataChunkJSON;
        scl?: DataChunkJSON;
    };

    export interface AnimationJSON {
        name: string;
        frames: number;
        fps: number;
        tracks: AnimationTrackJSON[];
    };

    export interface DocumentJSON {
        info: InfoJSON;
        materials: MaterialJSON[];
        geometries: GeometryJSON[];
        bones: BoneJSON[];
        animations: AnimationJSON[];
        /** Base64 encoded binary data */
        data?: string;
    };
}