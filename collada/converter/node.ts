
class ColladaConverterNode {
    parent: ColladaConverterNode;
    geometry: ColladaConverterGeometry;
    skin: ColladaConverterSkin;

    constructor() {
        this.parent = null;
        this.geometry = null;
        this.skin = null;
    }
}