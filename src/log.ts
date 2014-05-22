module COLLADA {

    export enum LogLevel {
        Trace = 1,
        Info = 2,
        Warning = 3,
        Error = 4,
        Exception = 5
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

    export interface Log {
        write: (message: string, level: LogLevel) => void;
    }

    export class LogArray implements Log {
        messages: { message: string; level: LogLevel }[];

        constructor() {
            this.messages = [];
        }

        write(message: string, level: LogLevel) {
            this.messages.push({ message: message, level: level });
        }
    }

    export class LogConsole implements Log {

        constructor() {
        }

        write(message: string, level: LogLevel) {
            console.log(LogLevelToString(level) + ": " + message);
        }
    }


    export class LogTextArea implements Log {
        area: HTMLTextAreaElement;

        constructor(area: HTMLTextAreaElement) {
            this.area = area;
        }

        write(message: string, level: LogLevel) {
            var line: string = LogLevelToString(level) + ": " + message;
            this.area.textContent += line + "\n";
        }
    }
}