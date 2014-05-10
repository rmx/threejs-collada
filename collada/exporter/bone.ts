class ColladaExporterBone {
    name: string;
    parent: number;
    skinned: boolean;
    inv_bind_mat: number[];
    pos: number[];
    rot: number[];
    scl: number[];

    constructor() {
        this.name = null;
        this.parent = null;
        this.skinned = null;
        this.inv_bind_mat = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
        this.pos = [0, 0, 0];
        this.rot = [0, 0, 0, 1];
        this.scl = [1, 1, 1];
    }

    static create(bone: ColladaConverterBone, context: ColladaExporterContext): ColladaExporterBone {
        var result: ColladaExporterBone = new ColladaExporterBone();
        result.name = bone.name;
        result.parent = (bone.parent!==null) ? (bone.parent.index) : -1;
        result.skinned = bone.attachedToSkin;

        var mat: Mat4 = bone.node.getLocalMatrix();
        ColladaMath.decompose(mat, result.pos, result.rot, result.scl);

        ColladaMath.copyNumberArray(bone.invBindMatrix, result.inv_bind_mat, 16);

        return result;
    }

    toJSON(): ColladaExporterBoneJSON {
        // TODO: options for this
        var mat_tol: number = 5;
        var pos_tol: number = 4;
        var scl_tol: number = 3;
        var rot_tol: number = 4;
        return {
            name: this.name,
            parent: this.parent,
            skinned: this.skinned,
            inv_bind_mat: this.inv_bind_mat.map((x) => ColladaMath.round(x,mat_tol)),
            pos: this.pos.map((x) => ColladaMath.round(x, pos_tol)),
            rot: this.rot.map((x) => ColladaMath.round(x, rot_tol)),
            scl: this.scl.map((x) => ColladaMath.round(x, scl_tol))
        }
    }
}