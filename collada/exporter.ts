
class ColladaExporter {

    constructor() {

    }

    export(doc: ColladaConverterFile): ColladaExporterDocument {
        var materials: ColladaExporterMaterial[];
        var geometries: ColladaExporterGeometry[];
        var bones: ColladaExporterBone[];
        var animations: ColladaExporterAnimation[];

        return {
            materials: materials,
            geometries: geometries,
            bones: bones,
            animations: animations
        };
    }
}