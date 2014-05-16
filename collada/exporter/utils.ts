
class ColladaExporterUtils {

    static stringToBuffer(str: string): Uint8Array {
        // Get ASCII string with non-printable characters using base64 decoding
        var ascii: string = atob(str);

        // Convert ASCII string to Uint8Array
        var result: Uint8Array = new Uint8Array(ascii.length);
        for (var i: number = 0, len: number = ascii.length; i < len; ++i) {
            result[i] = ascii.charCodeAt(i);
        }
        return result;
    }

    static bufferToString(buf: Uint8Array): string {
        // Convert Uint8Array to ASCII string
        var ascii: string = "";
        for (var i: number = 0, len: number = buf.length; i < len; ++i) {
            ascii += String.fromCharCode(buf[i]);
        }

        // Remove non-printable characters using base64 encoding
        return btoa(ascii);
    }

    static bufferToDataURI(buf: Uint8Array, mime: string): string {
        var base64: string = ColladaExporterUtils.bufferToString(buf);

        if (!mime) {
            mime = "application/octet-stream";
        }

        return "data:" + mime + ";base64," + base64;
    }

    static bufferToBlobURI(buf: Uint8Array): string {
        var blob: Blob = new Blob([buf]);
        return URL.createObjectURL(blob);
    }

    static jsonToDataURI(json: any, mime: string): string {
        var json_str = JSON.stringify(json);

        if (!mime) {
            mime = "application/json";
        }

        return "data:" + mime + "," + json_str;
    }
}