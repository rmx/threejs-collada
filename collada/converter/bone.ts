interface ColladaConverterJSONBone {
    name: string;
    parent: number;
    attachedToSkin: boolean;
    invBindMatrix: number[];
}


class ColladaConverterBone {
    index: number;
    name: string;
    parent: ColladaConverterBone;
    attachedToSkin: boolean;
    invBindMatrix: number[];

    constructor() {
        this.index = -1;
        this.name = "";
        this.parent = null;
        this.attachedToSkin = false;
        this.invBindMatrix = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
    }

    parentIndex(): number {
        return this.parent === null ? -1 : this.parent.index;
    }

    toJSON(): ColladaConverterJSONBone {
        return {
            name: this.name,
            parent: this.parentIndex(),
            attachedToSkin: this.attachedToSkin,
            invBindMatrix: this.invBindMatrix
        }
    }
}