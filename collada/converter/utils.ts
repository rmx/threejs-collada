class ColladaConverterUtils {

    /**
    * Re-indexes data.
    * Copies srcData[srcIndices[i*srcStride + srcOffset]] to destData[destIndices[i*destStride + destOffset]]
    *
    * Used because in COLLADA, each geometry attribute (position, normal, ...) can have its own index buffer,
    * whereas for GPU rendering, there is only one index buffer for the whole geometry.
    *
    */
    static reIndex(
        srcData: Float32Array, srcIndices: Int32Array, srcStride: number, srcOffset: number, srcDim: number,
        destData: Float32Array, destIndices: Int32Array, destStride: number, destOffset: number, destDim: number) {

        var dim: number = Math.min(srcDim, destDim);
        var srcIndexCount: number = srcIndices.length;

        // Index in the "indices" array at which the next index can be found
        var srcIndexIndex: number = srcOffset;
        var destIndexIndex: number = destOffset;

        while (srcIndexIndex < srcIndexCount) {

            // Index in the "data" array at which the vertex data can be found
            var srcIndex: number = srcIndices[srcIndexIndex];
            srcIndexIndex += srcStride;
            var destIndex: number = destIndices[destIndexIndex];
            destIndexIndex += destStride;

            // Copy vertex data (one value for each dimension)
            for (var d: number = 0; d < dim; ++d) {
                destData[srcDim * destIndex + d] = srcData[destDim * srcIndex + d];
            }
        }
    }

    /**
    * Given a list of indices stored as indices[i*stride + offset],
    * returns a similar list of indices stored as an array of consecutive numbers.
    */
    static compactIndices(indices: Int32Array, stride: number, offset: number): Int32Array {
        var uniqueCount: number = 0;
        var indexCount = indices.length / stride;
        var uniqueMap: Int32Array = new Int32Array(indexCount);

        // Find out which indices are unique and which appeared previously
        for (var i: number = 0; i < indexCount; ++i) {

            var previousIndex: number = -1;
            for (var j: number = 0; j < i; ++j) {
                if (indices[j * stride + offset] === indices[i * stride + offset]) {
                    previousIndex = j;
                    break;
                }
            }

            uniqueMap[i] = previousIndex;
            if (previousIndex !== -1) {
                uniqueCount++;
            }
        }

        // Create new indices
        var result: Int32Array = new Int32Array(uniqueCount);
        var nextIndex = 0;
        for (var i: number = 0; i < indices.length; ++i) {
            var previousIndex = uniqueMap[i];
            if (previousIndex === -1) {
                result[i] = nextIndex;
                nextIndex++;
            } else {
                result[i] = result[previousIndex];
            }
        }

        return result;
    }

    /**
    * Returns the maximum element of a list of non-negative integers
    */
    static maxIndex(indices: Int32Array): number {
        if (indices === null) {
            return null;
        }
        var result: number = -1;
        var length: number = indices.length
        for (var i: number = 0; i < length; ++i) {
            if (indices[i] > result) result = indices[i];
        }
        return result;
    }

    static createFloatArray(source: ColladaSource, name: string, outDim: number, context: ColladaProcessingContext): Float32Array {
        if (source === null) {
            return null;
        }
        if (source.stride > outDim) {
            context.log.write("Source data for " + name + " contains too many dimensions, " + (source.stride - outDim) + " dimensions will be ignored", LogLevel.Warning);
        } else if (source.stride < outDim) {
            context.log.write("Source data for " + name + " does not contain enough dimensions, " + (outDim - source.stride) +" dimensions will be zero", LogLevel.Warning);
        }

        // Start and end index
        var iBegin: number = source.offset;
        var iEnd: number = source.offset + source.count * source.stride;
        if (iEnd > source.data.length) {
            context.log.write("Source for " + name + " tries to access too many elements, data ignored", LogLevel.Warning);
            return null;
        }

        // Get source raw data
        if (!(source.data instanceof Float32Array)) {
            context.log.write("Source for " + name + " does not contain floating point data, data ignored", LogLevel.Warning);
            return null;
        }
        var srcData: Float32Array = <Float32Array>source.data;

        // Copy data
        var result = new Float32Array(source.count * outDim);
        for (var i: number = iBegin; i < iEnd; i += outDim) {
            for (var j: number = 0; j < outDim; ++j) {
                result[i - iBegin + j] = srcData[i + j];
            }
        }
        return result;
    }

    static createStringArray(source: ColladaSource, name:string, outDim: number, context: ColladaProcessingContext): string[] {
        if (source === null) {
            return null;
        }
        if (source.stride > outDim) {
            context.log.write("Source data for " + name + " contains too many dimensions, " + (source.stride - outDim) + " dimensions will be ignored", LogLevel.Warning);
        } else if (source.stride < outDim) {
            context.log.write("Source data for " + name + " does not contain enough dimensions, " + (outDim - source.stride) +" dimensions will be zero", LogLevel.Warning);
        }

        // Start and end index
        var iBegin: number = source.offset;
        var iEnd: number = source.offset + source.count * source.stride;
        if (iEnd > source.data.length) {
            context.log.write("Source for " + name + " tries to access too many elements, data ignored", LogLevel.Warning);
            return null;
        }

        // Get source raw data
        if (!(source.data instanceof Array)) {
            context.log.write("Source for " + name + " does not contain string data, data ignored", LogLevel.Warning);
            return null;
        }
        var srcData: string[] = <string[]> source.data;

        // Copy data
        var result: string[] = new Array(source.count * outDim);
        for (var i: number = iBegin; i < iEnd; i += outDim) {
            for (var j: number = 0; j < outDim; ++j) {
                result[i - iBegin + j] = srcData[i + j];
            }
        }
        return result;
    }
}