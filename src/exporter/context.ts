/// <reference path="../context.ts" />
/// <reference path="data_chunk.ts" />

module COLLADA.Exporter {

    export class Context implements COLLADA.Context {
        log: Log;
        chunks: COLLADA.Exporter.DataChunk[];
        bytes_written: number;

        constructor(log: Log) {
            this.log = log;
            this.chunks = [];
            this.bytes_written = 0;
        }

        registerChunk(chunk: COLLADA.Exporter.DataChunk) {
            this.chunks.push(chunk);
            chunk.byte_offset = this.bytes_written;
            this.bytes_written += chunk.getBytesCount();
        }

        assembleData(): Uint8Array {
            // Allocate result
            var buffer: ArrayBuffer = new ArrayBuffer(this.bytes_written);
            var result: Uint8Array = new Uint8Array(buffer);

            // Copy data from all chunks
            for (var i: number = 0; i < this.chunks.length; ++i) {
                var chunk: COLLADA.Exporter.DataChunk = this.chunks[i];
                var chunk_data: Uint8Array = chunk.getDataView();
                var chunk_data_length: number = chunk_data.length;
                var chunk_data_offet: number = chunk.byte_offset;

                for (var j: number = 0; j < chunk_data_length; ++j) {
                    result[j + chunk_data_offet] = chunk_data[j];
                }
            }

            return result;
        }
    }
}