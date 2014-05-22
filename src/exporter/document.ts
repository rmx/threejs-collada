/// <reference path="format.ts" />

class ColladaExporterDocument {
    json: ColladaExporterDocumentJSON;
    data: Uint8Array;

    constructor() {
        this.json = null;
        this.data = null;
    }
}