class ColladaConverterFile {
    nodes: ColladaConverterNode[];
    animations: ColladaConverterAnimation[];

    constructor() {
        this.nodes = [];
        this.animations = [];
    }

    /**
    * Returns the list of all geometries in the scene.
    */
    static extractGeometries(nodes: ColladaConverterNode[]): ColladaConverterGeometry[]{
        var result: ColladaConverterGeometry[] = [];

        // Process all nodes in the list
        for (var n: number = 0; n < nodes.length; ++n) {
            var node: ColladaConverterNode = nodes[n];

            // Own geometries of the current node
            for (var i: number = 0; i < node.geometries.length; ++i) {
                var geo: ColladaConverterGeometry = node.geometries[i];
                result.push(geo);
            }

            // Recursively process child nodes
            for (var i: number = 0; i < node.children.length; ++i) {
                var child_geometries: ColladaConverterGeometry[] = ColladaConverterFile.extractGeometries(node.children);
                result = result.concat(child_geometries);
            }
        }

        return result;
    }
}