/**
*   Base class for any collada element.
*
*   Contains members for URL, FX, and SID adressing,
*   even if the actual element does not support those.
*/
class ColladaElement {
    /** Collada URL adressing: identifier */
    id: string;
    /** Collada SID/FX adressing: identifier */
    sid: string;
    /** Collada FX adressing: parent element */
    fxParent: ColladaElement;
    /** Collada FX adressing: child elements */
    fxChildren: { [sid: string]: ColladaElement; };
    /** Collada SID adressing: child elements */
    sidChildren: ColladaElement[];
    /** Name of the element. Not used for any adressing. */
    name: string;

    /** Empty constructor */
    constructor() {
        this.name = null;
        this.id = null;
        this.sid = null;
        this.fxParent = null;
        this.fxChildren = {};
        this.sidChildren = [];
    }

    static fromLink<T extends ColladaElement>(link: Link, type: any, typeName: string, context: ColladaProcessingContext): T {
        if (link.target === null) {
            return null;
        } else if (link.target instanceof type) {
            return <T> link.target;
        } else {
            context.log.write("Link with url " + link.getUrl() + " does not point to a " + typeName + ", link target ignored", LogLevel.Error);
            return null;
        }
    }
};