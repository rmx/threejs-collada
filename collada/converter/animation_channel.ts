class ColladaConverterAnimationChannel {
    interpolation: string[];
    input: Float32Array;
    output: Float32Array;
    inTangent: Float32Array;
    outTangent: Float32Array;
    dataOffset: number;
    dataCount: number;

    constructor() {
        this.interpolation = null;
        this.input = null;
        this.output = null;
        this.inTangent = null;
        this.outTangent = null;
        this.dataOffset = null;
        this.dataCount = null;
    }

    findInputIndices(t: number, context: ColladaProcessingContext): { i0: number; i1: number; s: number } {
        var input: Float32Array = this.input;

        // Handle borders
        if (t < input[0]) {
            context.log.write("Invalid time for resampling, using first keyframe", LogLevel.Warning);
            return { i0: 0, i1: 1, s: 0 };
        } else if (t > input[input.length - 1]) {
            context.log.write("Invalid time for resampling, using last keyframe", LogLevel.Warning);
            return { i0: input.length - 2, i1: input.length - 1, s: 1 };
        } else if (t === input[0]) {
            return { i0: 0, i1: 1, s: 0 };
        } else if (t === input[input.length]) {
            return { i0: input.length - 2, i1: input.length - 1, s: 1 };
        }

        // Find correct keyframes
        for (var i = 0; i < input.length - 1; ++i) {
            var t0: number = input[i];
            var t1: number = input[i + 1];
            if (t0 <= t && t < t1) {
                var s: number = (t - t0) / (t1 - t0);
                return { i0: i, i1: i + 1, s: s};
            }
        }
    }

    getInterpolatedValue() {

    }

    static createInputData(input: ColladaInput, inputName: string, dataDim: number, context: ColladaConverterContext): Float32Array {
        // Input
        if (input === null) {
            return null;
        }

        // Source
        var source: ColladaSource = ColladaSource.fromLink(input.source, context);
        if (source === null) {
            context.log.write("Animation channel has no " + inputName + " input data, data ignored", LogLevel.Warning);
            return null;
        }

        // Data
        return ColladaConverterUtils.createFloatArray(source, dataDim, context);
    }

    static createInputDataFromArray(inputs: ColladaInput[], inputName: string, dataDim: number, context: ColladaConverterContext): Float32Array {
        // Samplers can have more than one output if they describe multiple curves at once.
        // I don't understand from the spec how a single channel could describe the animation of multiple parameters,
        // since each channel references a single SID target
        if (inputs.length > 0) {
            if (inputs.length > 1) {
                context.log.write("Animation channel has more than one " + inputName + " input, using only the first one", LogLevel.Warning);
            }
            return ColladaConverterAnimationChannel.createInputData(inputs[0], inputName, dataDim, context);
        } else {
            return null;
        }
    }

    static create(channel: ColladaChannel, context: ColladaConverterContext): ColladaConverterAnimationChannel {

        var target: ColladaElement = ColladaElement.fromLink(channel.target, context);
        if (target === null) {
            context.log.write("Animation channel has an invalid target '" + channel.target.url + "', animation ignored", LogLevel.Warning);
            return null;
        }

        var targetDataRows: number =;
        var targetDataColumns: number =;
        var targetDataDim: number = targetDataRows * targetDataColumns;

        var sampler: ColladaSampler = ColladaSampler.fromLink(channel.source, context);
        if (sampler === null) {
            context.log.write("Animation channel has an invalid sampler '" + channel.source.url + "', animation ignored", LogLevel.Warning);
            return null;
        }

        // Result
        var result: ColladaConverterAnimationChannel = new ColladaConverterAnimationChannel();

        // Interpolation data (all optional)
        result.input = ColladaConverterAnimationChannel.createInputData(sampler.input, "input", 1, context);
        result.output = ColladaConverterAnimationChannel.createInputDataFromArray(sampler.outputs, "output", targetDataDim, context);
        result.inTangent = ColladaConverterAnimationChannel.createInputDataFromArray(sampler.inTangents, "intangent", targetDataDim + 1, context);
        result.outTangent = ColladaConverterAnimationChannel.createInputDataFromArray(sampler.outTangents, "outtangent", targetDataDim + 1, context);

        // Interpolation type (required)
        var interpolationInput = sampler.interpolation;
        if (interpolationInput === null) {
            context.log.write("Animation channel has no interpolation input, animation ignored", LogLevel.Warning);
            return null;
        }
        var interpolationSource: ColladaSource = ColladaSource.fromLink(interpolationInput.source, context);
        if (interpolationSource === null) {
            context.log.write("Animation channel has no interpolation source, animation ignored", LogLevel.Warning);
            return null;
        }
        result.interpolation = ColladaConverterUtils.createStringArray(interpolationSource, 1, context);

        // Destination data offset and count
        var targetLink: SidLink = channel.target;
        if (targetLink.dotSyntax) {
            // Member syntax: single named element
            result.dataCount = 1;
            switch (targetLink.member) {
                case "X":
                    result.dataOffset = 0;
                    break;
                case "Y":
                    result.dataOffset = 1;
                    break;
                case "Z":
                    result.dataOffset = 2;
                    break;
                case "W":
                    result.dataOffset = 3;
                    break;
                case "R":
                    result.dataOffset = 0;
                    break;
                case "G":
                    result.dataOffset = 1;
                    break;
                case "B":
                    result.dataOffset = 2;
                    break;
                case "U":
                    result.dataOffset = 0;
                    break;
                case "V":
                    result.dataOffset = 1;
                    break;
                case "S":
                    result.dataOffset = 0;
                    break;
                case "T":
                    result.dataOffset = 1;
                    break;
                case "P":
                    result.dataOffset = 2;
                    break;
                case "Q":
                    result.dataOffset = 3;
                    break;
                case "ANGLE":
                    result.dataOffset = 3;
                    break;
                default:
                    context.log.write("Unknown semantic for '" + targetLink.url + "', animation ignored", LogLevel.Warning);
                    return null;
            }
        } else if (channel.target.arrSyntax) {
            // Array syntax: single element at a given index
            result.dataCount = 1;
            switch (targetLink.indices.length) {
                case 1:
                    result.dataOffset = targetLink.indices[0];
                    break;
                case 2:
                    result.dataOffset = targetLink.indices[0] * targetDataRows + targetLink.indices[1];
                    break;
                default:
                    context.log.write("Invalid number of indices for '" + targetLink.url + "', animation ignored", LogLevel.Warning);
                    return null;
            }
        } else {
            // Default: data for the whole vector/array
            result.dataOffset = 0;
            result.dataCount = targetDataColumns * targetDataRows;
        }

        return result;
    }
}