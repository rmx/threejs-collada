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
        result.parent = bone.parent.index;
        result.skinned = bone.attachedToSkin;

        var pos: Vec3 = vec3.create();
        var rot: Quat = quat.create();
        var scl: Vec3 = vec3.create();
        bone.node.getLocalTransform(pos, rot, scl);

        ColladaMath.copyNumberArray(pos, result.pos, 3);
        ColladaMath.copyNumberArray(rot, result.rot, 4);
        ColladaMath.copyNumberArray(scl, result.scl, 3);

        ColladaMath.copyNumberArray(bone.invBindMatrix, result.inv_bind_mat, 16);

        return result;
    }

    toJSON(): ColladaExporterBoneJSON {
        return {
                name: this.name,
                parent: this.parent,
                skinned: this.skinned,
                inv_bind_mat: this.inv_bind_mat,
                pos: this.pos,
                rot: this.rot,
                scl: this.scl
        }
    }
}