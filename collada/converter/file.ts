class ColladaConverterFile {
    data: Uint8Array;

    bones: ColladaConverterBone[];
    geometries: ColladaConverterGeometry[];
    materials: ColladaConverterMaterial[];
    nodes: ColladaConverterNode[];

    constructor() {
        this.data = null;
        this.bones = [];
        this.geometries = [];
        this.materials = [];
        this.nodes = [];
    }

    static collectGeometriesAndMaterials(node: ColladaConverterNode, geometries: ColladaConverterGeometry[], materials: ColladaConverterMaterial[]) {
        for (var i: number = 0; i < node.geometries.length; ++i) {
            // Geometry
            var geo: ColladaConverterGeometry = node.geometries[i];
            if (geo !== null && geometries.indexOf(geo) !== -1) {
                geometries.push(geo);
            }

            // Geometry chunks (each having a material)
            for (var j: number = 0; j < geo.chunks.length; ++j) {
                var mat: ColladaConverterMaterial = geo.chunks[j].material;
                if (mat !== null && materials.indexOf(mat) !== -1) {
                    materials.push(mat);
                }
            }
        }

        // Recursively process child nodes
        for (var i: number = 0; i < node.children.length; ++i) {
            ColladaConverterFile.collectGeometriesAndMaterials(node.children[i], geometries, materials);
        }
    }

    toJSON(): any {
        var result = {};
    }

    toString(): string {
        var json = this.toJSON();
        return JSON.stringify(json);
    }
}