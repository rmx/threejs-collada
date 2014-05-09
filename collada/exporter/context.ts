
class ColladaExporterContext implements ColladaProcessingContext {
    log: Log;
    chunks: ColladaExporterDataChunk[];
    bytes_written: number;

    constructor(log: Log) {
        this.log = log;
        this.chunks = [];
        this.bytes_written = 0;
    }

    registerChunk(chunk: ColladaExporterDataChunk) {
        this.chunks.push(chunk);
        chunk.byte_offset = this.bytes_written;
        this.bytes_written += chunk.getBytesCount();
    }

    assembleData(): ArrayBuffer {
        // Allocate result
        var buffer: ArrayBuffer = new ArrayBuffer(this.bytes_written);
        var result: Uint8Array = new Uint8Array(buffer);

        // Copy data from all chunks
        for (var i: number = 0; i < this.chunks.length; ++i) {
            var chunk: ColladaExporterDataChunk = this.chunks[i];
            var chunk_data: Uint8Array = chunk.getDataView();
            var chunk_data_length: number = chunk_data.length;
            var chunk_data_offet: number = chunk.byte_offset;

            for (var j: number = 0; j < chunk_data_length; ++j) {
                result[j + chunk_data_offet] = chunk_data[j];
            }
        }

        return buffer;
    }
}