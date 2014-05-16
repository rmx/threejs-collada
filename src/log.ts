
enum LogLevel{
    Trace,
    Info,
    Warning,
    Error,
    Exception
};

function LogLevelToString(level: LogLevel): string {
    switch (level) {
        case LogLevel.Trace: return "TRACE";
        case LogLevel.Info: return "INFO";
        case LogLevel.Warning: return "WARNING";
        case LogLevel.Error: return "ERROR";
        case LogLevel.Exception: return "EXCEPTION";
        default: return "OTHER";
    }
}

interface Log {
    write: (message: string, level: LogLevel) => void;
}

class ColladaLogArray implements Log {
    messages: { message: string; level: LogLevel }[];

    constructor() {
        this.messages = [];
    }

    write(message: string, level: LogLevel) {
        this.messages.push({message:message, level:level});
    }
}

class ColladaLogConsole implements Log {

    constructor() {
    }

    write(message: string, level: LogLevel) {
        console.log(LogLevelToString(level) + ": " + message);
    }
}


class ColladaLogTextArea implements Log {
    area: HTMLTextAreaElement;

    constructor(area: HTMLTextAreaElement) {
        this.area = area;
    }

    write(message: string, level: LogLevel) {
        var line: string = LogLevelToString(level) + ": " + message;
        this.area.textContent += line + "\n";
    }
}