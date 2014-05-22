/// <reference path="context.ts" />
/// <reference path="format.ts" />
/// <reference path="../math.ts" />

module COLLADA.Exporter {

    export class Bone {
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

        static create(bone: COLLADA.Converter.Bone, context: COLLADA.Exporter.Context): COLLADA.Exporter.Bone {
            var result: COLLADA.Exporter.Bone = new COLLADA.Exporter.Bone();
            result.name = bone.name;
            result.parent = (bone.parent !== null) ? (bone.parent.index) : -1;
            result.skinned = bone.attachedToSkin;

            var mat: Mat4 = bone.node.getLocalMatrix();
            COLLADA.MathUtils.decompose(mat, result.pos, result.rot, result.scl);

            COLLADA.MathUtils.copyNumberArray(bone.invBindMatrix, result.inv_bind_mat, 16);

            return result;
        }

        toJSON(): COLLADA.Exporter.BoneJSON {
            // TODO: options for this
            var mat_tol: number = 5;
            var pos_tol: number = 4;
            var scl_tol: number = 3;
            var rot_tol: number = 4;
            return {
                name: this.name,
                parent: this.parent,
                skinned: this.skinned,
                inv_bind_mat: this.inv_bind_mat.map((x) => COLLADA.MathUtils.round(x, mat_tol)),
                pos: this.pos.map((x) => COLLADA.MathUtils.round(x, pos_tol)),
                rot: this.rot.map((x) => COLLADA.MathUtils.round(x, rot_tol)),
                scl: this.scl.map((x) => COLLADA.MathUtils.round(x, scl_tol))
            };
        }
    }
}