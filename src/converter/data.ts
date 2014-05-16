
class ColladaConverterData {
    data: Uint8Array;
    offset: number;
    length: number;

    constructor(input: ArrayBuffer) {
        this.data = new Uint8Array(input);
        this.length = null;
        this.offset = null;
    }

}