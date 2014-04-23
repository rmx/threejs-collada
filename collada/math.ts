interface NumberArray {
    length: number;
    [index: number]: number;
}

class ColladaMath {
    
    static mat4copy(src: NumberArray, srcOff: number, dest: NumberArray, destOff: number) {
        for (var i: number = 0; i < 16; ++i) {
                dest[destOff * 16 + i] = src[srcOff * 16 + i];
                dest[destOff * 16 + i] = src[srcOff * 16 + i];
                dest[destOff * 16 + i] = src[srcOff * 16 + i];
                dest[destOff * 16 + i] = src[srcOff * 16 + i];
                dest[destOff * 16 + i] = src[srcOff * 16 + i];
        }

    }
};