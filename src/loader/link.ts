/// <reference path="context.ts" />
/// <reference path="element.ts" />
/// <reference path="utils.ts" />


module COLLADA.Loader {

    /**
    * Base class for all links within a collada document
    */
    export class Link {
        target: COLLADA.Loader.Element;

        constructor() {
            this.target = null;
        }

        getUrl(): string {
            throw new Error("not implemented");
        }

        resolve(context: COLLADA.Loader.Context) {
            throw new Error("not implemented");
        }

    };

    /**
    *   COLLADA URL addressing
    *
    *   See chapter 3, section "Adress Syntax"
    *   Uses XML ids that are unique within the whole document.
    *   Hyperlinks to ids start with a hash.
    *   <element id="xyz">
    *   <element source="#xyz">
    */
    export class UrlLink extends Link {
        url: string;

        constructor(url: string) {
            super();
            this.url = url.trim().replace(/^#/, "");
        }

        getUrl(): string {
            return this.url;
        }

        resolve(context: COLLADA.Loader.Context) {
            // IDs are globally unique
            var object: COLLADA.Loader.Element = context.ids[this.url];
            if (object != null) {
                this.target = object;
            } else {
                context.log.write("Could not find URL target with URL " + this.url, LogLevel.Warning);
            }
        }
    };

    /**
    *   COLLADA FX parameter addressing
    *
    *   See chapter 7, section "About Parameters"
    *   Uses scoped ids that are unique within the given scope.
    *   If the target is not defined within the same scope,
    *   the search continues in the parent scope
    *   <element sid="xyz">
    *   <element texture="xyz">
    */
    export class FxLink extends Link {
        url: string;
        scope: COLLADA.Loader.Element;

        constructor(url: string, scope: COLLADA.Loader.Element) {
            super();
            this.url = url;
            this.scope = scope;
        }

        getUrl(): string {
            return this.url;
        }

        resolve(context: COLLADA.Loader.Context) {
            var scope: COLLADA.Loader.Element = this.scope;
            var object: COLLADA.Loader.Element = null;
            // FX targets have a unique SID within a scope
            // If the target is not found in the current scope,
            // continue searching in the parent scope.
            while ((object == null) && (scope != null)) {
                object = scope.fxChildren[this.url];
                scope = scope.fxParent;
            }
            if (object != null) {
                this.target = object;
            } else {
                context.log.write("Could not find FX target with URL " + this.url, LogLevel.Warning);
            };
        }
    }

    /**
    *   COLLADA SID addressing
    *
    *   See chapter 3, section "Adress Syntax"
    *   Uses scoped ids that are unique within the parent element.
    *   Adresses are anchored at a globally unique id and have a path of scoped ids.
    *   <elementA id="xyz"><elementB sid="abc"></elementB></elementA>
    *   <element target="xyz/abc">
    */
    export class SidLink extends Link {
        url: string;
        parentId: string;
        id: string;
        sids: string[];
        member: string;
        indices: number[];
        dotSyntax: boolean;
        arrSyntax: boolean;

        constructor(url: string, parentId: string) {
            super();
            this.url = url;
            this.id = null;
            this.parentId = parentId;
            this.sids = [];
            this.member = null;
            this.indices = [];
            this.dotSyntax = false;
            this.arrSyntax = false;
            this._parseUrl();
        }

        getUrl(): string {
            return this.url;
        }

        private _parseUrl = function () {
            var parts: string[] = this.url.split("/");

            // Part 1: element id
            this.id = parts.shift();
            if (this.id === ".") {
                this.id = this.parentId;
            }

            // Part 2: list of sids
            while (parts.length > 1) {
                this.sids.push(parts.shift());
            }

            // Part 3: last sid
            if (parts.length > 0) {
                var lastSid: string = parts[0];
                var dotSyntax: boolean = lastSid.indexOf(".") >= 0;
                var arrSyntax: boolean = lastSid.indexOf("(") >= 0;
                if (dotSyntax) {
                    parts = lastSid.split(".");
                    this.sids.push(parts.shift());
                    this.member = parts.shift();
                    this.dotSyntax = true;
                } else if (arrSyntax) {
                    var arrIndices: string[] = lastSid.split("(");
                    this.sids.push(arrIndices.shift());
                    this.indices = [];
                    var index: string;
                    for (var i: number = 0, len: number = arrIndices.length; i < len; i++) {
                        index = arrIndices[i];
                        this.indices.push(parseInt(index.replace(/\)/, ""), 10));
                    }
                    this.arrSyntax = true;
                } else {
                    this.sids.push(lastSid);
                }
            }
        };

        /**
        *   Find the SID target given by the URL (array of sid parts).
        *
        *   @param url The complete URL, for debugging only
        *   @param root Root element, where the search starts.
        *   @param sids SID parts.
        *   @returns The collada element the URL points to, or an error why it wasn't found
        */
        static findSidTarget(url: string, root: COLLADA.Loader.Element, sids: string[], context: COLLADA.Context): COLLADA.Loader.Element {
            if (root == null) {
                context.log.write("Could not resolve SID target " + sids.join("/") + ", missing root element", LogLevel.Warning);
                return null;
            }
            var parentObject: COLLADA.Loader.Element = root;
            var childObject: COLLADA.Loader.Element = null;
            // For each SID part, perform a depth-first search
            for (var i: number = 0, ilen: number = sids.length; i < ilen; i++) {
                var sid: string = sids[i];
                // Initialize a queue for the search
                var queue: COLLADA.Loader.Element[] = [parentObject];
                // Dept-first search
                while (queue.length !== 0) {
                    // Get front of search queue
                    var front: COLLADA.Loader.Element = queue.shift();
                    // Stop if we found the target
                    if (front.sid === sid) {
                        childObject = front;
                        break;
                    }
                    // Add all children to the back of the queue
                    var frontChildren: COLLADA.Loader.Element[] = front.sidChildren;
                    if (frontChildren != null) {
                        for (var j: number = 0, jlen: number = frontChildren.length; j < jlen; j++) {
                            var sidChild: COLLADA.Loader.Element = frontChildren[j];
                            queue.push(sidChild);
                        }
                    }
                }
                // Abort if the current SID part was not found
                if (childObject == null) {
                    context.log.write("Could not resolve SID target " + sids.join("/") + ", missing SID part " + sid, LogLevel.Warning);
                    return null;
                }
                parentObject = childObject;
            }
            // All parts processed, return the final target
            return childObject;
        }

        resolve(context: COLLADA.Loader.Context) {
            var object: COLLADA.Loader.Element = null;
            if (this.id == null) {
                context.log.write("Could not resolve SID #" + this.url + ", link has no root ID", LogLevel.Warning);
                return;
            }
            object = context.ids[this.id];
            if (object == null) {
                context.log.write("Could not resolve SID #" + this.url + ", could not find root element " + this.id, LogLevel.Warning);
                return;
            }
            this.target = SidLink.findSidTarget(this.url, object, this.sids, context);
        }
    }
}