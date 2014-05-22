/// <reference path="context.ts" />
/// <reference path="format.ts" />

module COLLADA.Exporter {

    export class DataChunk {
        data: any;
        type: string;
        byte_offset: number;
        stride: number;
        count: number;
        bytes_per_element: number;

        constructor() {
            this.data = null;
            this.stride = null;
            this.count = null;
            this.byte_offset = null;
            this.bytes_per_element = null;
        }

        getDataView(): Uint8Array {
            return new Uint8Array(this.data.buffer, 0, this.stride * this.count * this.bytes_per_element);
        }

        getBytesCount(): number {
            return this.data.length * this.bytes_per_element;
        }

        toJSON(): COLLADA.Exporter.DataChunkJSON {
            var result: COLLADA.Exporter.DataChunkJSON = {
                type: this.type,
                byte_offset: this.byte_offset,
                stride: this.stride,
                count: this.count
            }

        return result;
        }

        static create(data: any, stride: number, context: COLLADA.Exporter.Context): COLLADA.Exporter.DataChunk {
            if (data === null) {
                return null;
            }

            var result: COLLADA.Exporter.DataChunk = new COLLADA.Exporter.DataChunk();
            result.data = data;
            result.stride = stride;
            result.count = data.length / stride;

            if (data instanceof Float32Array) {
                result.type = "float";
                result.bytes_per_element = 4;
            } else if (data instanceof Float64Array) {
                result.type = "double";
                result.bytes_per_element = 8;
            } else if (data instanceof Uint8Array) {
                result.type = "uint8";
                result.bytes_per_element = 1;
            } else if (data instanceof Uint16Array) {
                result.type = "uint16";
                result.bytes_per_element = 2;
            } else if (data instanceof Uint32Array) {
                result.type = "uint32";
                result.bytes_per_element = 4;
            } else if (data instanceof Int8Array) {
                result.type = "int8";
                result.bytes_per_element = 1;
            } else if (data instanceof Int16Array) {
                result.type = "int16";
                result.bytes_per_element = 2;
            } else if (data instanceof Int32Array) {
                result.type = "int32";
                result.bytes_per_element = 4;
            } else {
                context.log.write("Unknown data type, data chunk ignored", LogLevel.Warning);
                return null;
            }

            context.registerChunk(result);
            return result;
        }
    };
}