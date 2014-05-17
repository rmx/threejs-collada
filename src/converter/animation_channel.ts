interface ColladaConverterAnimationChannelIndices {
    /** left index */
    i0: number;
    /** right index */
    i1: number;
}

class ColladaConverterAnimationChannel {
    target: ColladaConverterAnimationTarget;
    interpolation: string[];
    input: Float32Array;
    output: Float32Array;
    inTangent: Float32Array;
    outTangent: Float32Array;
    dataOffset: number;
    dataCount: number;

    constructor() {
        this.target = null;
        this.interpolation = null;
        this.input = null;
        this.output = null;
        this.inTangent = null;
        this.outTangent = null;
        this.dataOffset = null;
        this.dataCount = null;
    }

    findInputIndices(t: number, context: ColladaProcessingContext): ColladaConverterAnimationChannelIndices {
        var input: Float32Array = this.input;

        // Handle borders
        if (t < input[0]) {
            context.log.write("Invalid time for resampling: t=" + t + ", t_begin=" + input[0] + ", using first keyframe", LogLevel.Warning);
            return { i0: 0, i1: 1};
        } else if (t > input[input.length - 1]) {
            context.log.write("Invalid time for resampling: t=" + t + ", t_end=" + input[input.length - 1] + ", using last keyframe", LogLevel.Warning);
            return { i0: input.length - 2, i1: input.length - 1};
        }

        // Find correct keyframes
        for (var i = 0; i < input.length - 1; ++i) {
            var t0: number = input[i];
            var t1: number = input[i + 1];
            if (t0 <= t && t <= t1) {
                return { i0: i, i1: i + 1};
            }
        }

        // Should never get to this
        context.log.write("Keyframes for time " + t + "not found, using first keyframe", LogLevel.Warning);
        return { i0: 0, i1: 1 };
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
        if (dataDim != source.stride) {
            context.log.write("Animation channel has a nonstandard dimensionality for " + inputName + ", data ignored", LogLevel.Warning);
            return null;
        }
        return ColladaConverterUtils.createFloatArray(source, inputName, dataDim, context);
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
        var result: ColladaConverterAnimationChannel = new ColladaConverterAnimationChannel();

        // Element
        var element: ColladaElement = ColladaElement.fromLink(channel.target, context);
        if (element === null) {
            context.log.write("Animation channel has an invalid target '" + channel.target.url + "', animation ignored", LogLevel.Warning);
            return null;
        }

        // Target
        var target: ColladaConverterAnimationTarget = context.animationTargets.findConverter(element);
        if (target === null) {
            context.log.write("Animation channel has no converter target '" + channel.target.url + "', animation ignored", LogLevel.Warning);
            return null;
        }
        result.target = target;

        // Sampler
        var sampler: ColladaSampler = ColladaSampler.fromLink(channel.source, context);
        if (sampler === null) {
            context.log.write("Animation channel has an invalid sampler '" + channel.source.url + "', animation ignored", LogLevel.Warning);
            return null;
        }

        // Target dimensionality
        var targetDataRows: number = target.getTargetDataRows();
        var targetDataColumns: number = target.getTargetDataColumns();
        var targetDataDim: number = targetDataRows * targetDataColumns;

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

        
        // Interpolation data
        result.input = ColladaConverterAnimationChannel.createInputData(sampler.input, "input", 1, context);
        result.output = ColladaConverterAnimationChannel.createInputDataFromArray(sampler.outputs, "output", result.dataCount, context);
        result.inTangent = ColladaConverterAnimationChannel.createInputDataFromArray(sampler.inTangents, "intangent", result.dataCount + 1, context);
        result.outTangent = ColladaConverterAnimationChannel.createInputDataFromArray(sampler.outTangents, "outtangent", result.dataCount + 1, context);

        if (result.input === null) {
            context.log.write("Animation channel has no input data, animation ignored", LogLevel.Warning);
            return null;
        }
        if (result.output === null) {
            context.log.write("Animation channel has no output data, animation ignored", LogLevel.Warning);
            return null;
        }

        // Interpolation type
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
        result.interpolation = ColladaConverterUtils.createStringArray(interpolationSource, "interpolation type", 1, context);
 
        target.registerAnimation(result);
        return result;
    }

    static interpolateLinear(time: number, t0: number, t1: number, i0: number, i1: number, dataCount: number, dataOffset: number,
        channel: ColladaConverterAnimationChannel, destData: Float32Array) {

        // Find s
        var s: number = (time - t0) / (t1 - t0);

        // Evaluate
        for (var i = 0; i < dataCount; ++i) {
            var p0: number = channel.output[i0 * dataCount + i];
            var p1: number = channel.output[i1 * dataCount + i];
            destData[dataOffset + i] = p0 + s * (p1 - p0);
        }
    }

    static interpolateBezier(time: number, t0: number, t1: number, i0: number, i1: number, dataCount: number, dataOffset: number,
        channel: ColladaConverterAnimationChannel, destData: Float32Array) {

        // Find s
        var tc0: number = channel.outTangent[i0 * (dataCount + 1)];
        var tc1: number = channel.inTangent[i1 * (dataCount + 1)];
        var tol: number = Math.abs(t1 - t0) * 1e-4;
        var s: number = ColladaMath.bisect(time, (s) => ColladaMath.bezier(t0, tc0, tc1, t1, s), tol, 100);
        var t_err: number = Math.abs(time - ColladaMath.bezier(t0, tc0, tc1, t1, s));

        // Evaluate bezier
        for (var i = 0; i < dataCount; ++i) {
            var p0: number = channel.output[i0 * dataCount + i];
            var p1: number = channel.output[i1 * dataCount + i];
            var c0: number = channel.outTangent[i0 * (dataCount + 1) + i + 1];
            var c1: number = channel.inTangent[i1 * (dataCount + 1) + i + 1];
            destData[dataOffset + i] = ColladaMath.bezier(p0, c0, c1, p1, s);
        }
    }

    static interpolateHermite(time: number, t0: number, t1: number, i0: number, i1: number, dataCount: number, dataOffset: number,
        channel: ColladaConverterAnimationChannel, destData: Float32Array) {

        // Find s
        var tt0: number = channel.outTangent[i0 * (dataCount + 1)];
        var tt1: number = channel.inTangent[i1 * (dataCount + 1)];
        var tol: number = Math.abs(t1 - t0) * 1e-5;
        var s: number = ColladaMath.bisect(time, (s) => ColladaMath.hermite(t0, tt0, tt1, t1, s), tol, 100);

        // Evaluate hermite
        for (var i = 0; i < dataCount; ++i) {
            var p0: number = channel.output[i0 * dataCount + i];
            var p1: number = channel.output[i1 * dataCount + i];
            var t0: number = channel.outTangent[i0 * (dataCount + 1) + i + 1];
            var t1: number = channel.inTangent[i1 * (dataCount + 1) + i + 1];
            destData[dataOffset + i] = ColladaMath.hermite(p0, t0, t1, p1, s);
        }
    }

    static applyToData(channel: ColladaConverterAnimationChannel, destData: Float32Array, time: number, context: ColladaConverterContext) {
        // Do nothing if the channel does not contain a minimum of information
        if (channel.input === null || channel.output === null) {
            return;
        }

        var indices: ColladaConverterAnimationChannelIndices = channel.findInputIndices(time, context);
        var i0: number = indices.i0;
        var i1: number = indices.i1;
        var t0: number = channel.input[i0];
        var t1: number = channel.input[i1];
        var dataCount: number = channel.dataCount;
        var dataOffset: number = channel.dataOffset;

        var interpolation = channel.interpolation[indices.i0];
        switch (interpolation) {
            case "STEP": 
                for (var i = 0; i < dataCount; ++i) {
                    destData[dataOffset + i] = channel.output[i0 * dataCount + i];
                }
                break;
            case "LINEAR":
                ColladaConverterAnimationChannel.interpolateLinear(time, t0, t1, i0, i1, dataCount, dataOffset, channel, destData);
                break;
            case "BEZIER":
                if (channel.inTangent !== null && channel.outTangent !== null) {
                    ColladaConverterAnimationChannel.interpolateBezier(time, t0, t1, i0, i1, dataCount, dataOffset, channel, destData);
                } else {
                    ColladaConverterAnimationChannel.interpolateLinear(time, t0, t1, i0, i1, dataCount, dataOffset, channel, destData);
                }
                break;
            case "HERMITE":
                if (channel.inTangent !== null && channel.outTangent !== null) {
                    ColladaConverterAnimationChannel.interpolateHermite(time, t0, t1, i0, i1, dataCount, dataOffset, channel, destData);
                } else {
                    ColladaConverterAnimationChannel.interpolateLinear(time, t0, t1, i0, i1, dataCount, dataOffset, channel, destData);
                }
                break;
            case "CARDINAL":
            case "BSPLINE":
                context.log.write("Interpolation type " + interpolation + " not supported, using STEP", LogLevel.Warning);
                for (var i = 0; i < dataCount; ++i) {
                    destData[dataOffset + i] = channel.input[i0 * dataCount + i];
                }
                break;
            default:
                context.log.write("Unknown interpolation type " + interpolation + " at time " + time + ", using STEP", LogLevel.Warning);
                for (var i = 0; i < dataCount; ++i) {
                    destData[dataOffset + i] = channel.input[i0 * dataCount + i];
                }
        }
    }
}

