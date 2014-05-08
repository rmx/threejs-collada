/// <reference path="loader/context.ts" />
/// <reference path="loader/document.ts" />
/// <reference path="log.ts" />

class ColladaLoader {

    onFinished: (id:string, doc: ColladaDocument) => void;
    onProgress: (id: string, loaded: number, total: number) => void;
    log: Log;

    constructor() {
        this.onFinished = null;
        this.onProgress = null;
        this.log = new ColladaLogConsole();
    }

    private _reportError(id: string, context: ColladaParsingContext) {
        if (this.onFinished) {
            this.onFinished(id, null);
        }
    }

    private _reportSuccess(id: string, doc: ColladaDocument, context: ColladaParsingContext) {
        if (this.onFinished) {
            this.onFinished(id, doc);
        }
    }

    private _reportProgress(id: string, context: ColladaParsingContext) {
        if (this.onProgress) {
            this.onProgress(id, context.loadedBytes, context.totalBytes);
        }
    }

    loadFromXML(id: string, doc: XMLDocument): ColladaDocument {
        var context: ColladaParsingContext = new ColladaParsingContext();
        context.log = this.log;
        return this._loadFromXML(id, doc, context);
    }

    private _loadFromXML(id: string, doc: XMLDocument, context: ColladaParsingContext): ColladaDocument {
        var result: ColladaDocument = null;
        try {
            result = ColladaDocument.parse(doc, context);
            context.resolveAllLinks();
        } catch (err) {
            context.log.write(err.message, LogLevel.Exception);
            this._reportError(id, context);
        }
        this._reportSuccess(id, result, context);
        return result;
    }

    loadFromURL(id:string, url: string) {
        var context: ColladaParsingContext = new ColladaParsingContext();
        context.log = this.log;
        var loader: ColladaLoader = this;

        if (document != null && document.implementation != null && document.implementation.createDocument != null) {

            var req: XMLHttpRequest = new XMLHttpRequest();
            if (typeof req.overrideMimeType === "function") {
                req.overrideMimeType("text/xml");
            }

            req.onreadystatechange = function () {
                if (req.readyState === 4) {
                    if (req.status === 0 || req.status === 200) {
                        if (req.responseXML) {
                            var result: ColladaDocument = ColladaDocument.parse(req.responseXML, context);
                            loader._reportSuccess(id, result, context);
                        } else {
                            context.log.write("Empty or non-existing file " + url + ".", LogLevel.Error);
                            loader._reportError(id, context);
                        }
                    }
                } else if (req.readyState === 3) {
                    if (!(context.totalBytes > 0)) {
                        context.totalBytes = parseInt(req.getResponseHeader("Content-Length"));
                    }
                    context.loadedBytes = req.responseText.length;
                    loader._reportProgress(id, context);
                }
            };
            req.open("GET", url, true);
            req.send(null);
        } else {
            context.log.write("Don't know how to parse XML!", LogLevel.Error);
            loader._reportError(id, context);
        }
    }
}