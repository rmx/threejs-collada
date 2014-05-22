/// <reference path="format.ts" />

module COLLADA.Exporter {

    export class Document {
        json: COLLADA.Exporter.DocumentJSON;
        data: Uint8Array;

        constructor() {
            this.json = null;
            this.data = null;
        }
    }
}