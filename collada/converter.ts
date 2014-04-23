/// <reference path="./document.ts" />
/// <reference path="./converter/file.ts" />

class ColladaConverter {
    log: Log;

    constructor() {
        this.log = new ColladaLogConsole();
    }

    convert(doc: ColladaDocument): ColladaConverterFile {
        var result: ColladaConverterFile = new ColladaConverterFile();

        return result;
    }
}