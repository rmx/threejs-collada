/// <reference path="../src/external/gl-matrix.d.ts" />
declare module COLLADA {
    interface Context {
        log: COLLADA.Log;
    }
}
declare module COLLADA.Loader {
    class Utils {
        static forEachChild(node: Node, fn: (child: Node) => void): void;
    }
}
declare module COLLADA.Loader {
    /**
    * Base class for all links within a collada document
    */
    class Link {
        public target: Loader.Element;
        constructor();
        public getUrl(): string;
        public resolve(context: Loader.Context): void;
    }
    /**
    *   COLLADA URL addressing
    *
    *   See chapter 3, section "Adress Syntax"
    *   Uses XML ids that are unique within the whole document.
    *   Hyperlinks to ids start with a hash.
    *   <element id="xyz">
    *   <element source="#xyz">
    */
    class UrlLink extends Link {
        public url: string;
        constructor(url: string);
        public getUrl(): string;
        public resolve(context: Loader.Context): void;
    }
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
    class FxLink extends Link {
        public url: string;
        public scope: Loader.Element;
        constructor(url: string, scope: Loader.Element);
        public getUrl(): string;
        public resolve(context: Loader.Context): void;
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
    class SidLink extends Link {
        public url: string;
        public parentId: string;
        public id: string;
        public sids: string[];
        public member: string;
        public indices: number[];
        public dotSyntax: boolean;
        public arrSyntax: boolean;
        constructor(url: string, parentId: string);
        public getUrl(): string;
        private _parseUrl;
        /**
        *   Find the SID target given by the URL (array of sid parts).
        *
        *   @param url The complete URL, for debugging only
        *   @param root Root element, where the search starts.
        *   @param sids SID parts.
        *   @returns The collada element the URL points to, or an error why it wasn't found
        */
        static findSidTarget(url: string, root: Loader.Element, sids: string[], context: COLLADA.Context): Loader.Element;
        public resolve(context: Loader.Context): void;
    }
}
declare module COLLADA.Loader {
    /**
    *   Base class for any collada element.
    *
    *   Contains members for URL, FX, and SID adressing,
    *   even if the actual element does not support those.
    */
    class Element {
        /** Collada URL adressing: identifier */
        public id: string;
        /** Collada SID/FX adressing: identifier */
        public sid: string;
        /** Collada FX adressing: parent element */
        public fxParent: Element;
        /** Collada FX adressing: child elements */
        public fxChildren: {
            [sid: string]: Element;
        };
        /** Collada SID adressing: child elements */
        public sidChildren: Element[];
        /** Name of the element. Not used for any adressing. */
        public name: string;
        /** Empty constructor */
        constructor();
        static fromLink(link: Loader.Link, context: COLLADA.Context): Element;
        static _fromLink<T extends Element>(link: Loader.Link, type: any, typeName: string, context: COLLADA.Context): T;
    }
}
declare module COLLADA.Loader {
    class Context implements COLLADA.Context {
        public ids: {
            [s: string]: Loader.Element;
        };
        public log: COLLADA.Log;
        public links: Loader.Link[];
        public totalBytes: number;
        public loadedBytes: number;
        constructor();
        public getAttributeAsFloat(el: Node, name: string, defaultValue: number, required: boolean): number;
        public getAttributeAsInt(el: Node, name: string, defaultValue: number, required: boolean): number;
        public getAttributeAsString(el: Node, name: string, defaultValue: string, required: boolean): string;
        public createUrlLink(url: string): Loader.UrlLink;
        public createSidLink(url: string, parentId: string): Loader.SidLink;
        public createFxLink(url: string, scope: Loader.Element): Loader.FxLink;
        public getAttributeAsUrlLink(el: Node, name: string, required: boolean): Loader.UrlLink;
        public getAttributeAsSidLink(el: Node, name: string, parentId: string, required: boolean): Loader.SidLink;
        public getAttributeAsFxLink(el: Node, name: string, scope: Loader.Element, required: boolean): Loader.FxLink;
        /**
        *   Splits a string into whitespace-separated strings
        */
        public strToStrings(str: string): string[];
        /**
        *   Parses a string of whitespace-separated float numbers
        */
        public strToFloats(str: string): Float32Array;
        /**
        *   Parses a string of whitespace-separated integer numbers
        */
        public strToInts(str: string): Int32Array;
        /**
        *   Parses a string of whitespace-separated booleans
        */
        public strToBools(str: string): Uint8Array;
        /**
        *   Parses a color string
        */
        public strToColor(str: string): Float32Array;
        public registerUrlTarget(object: Loader.Element, needsId: boolean): void;
        public registerFxTarget(object: Loader.Element, scope: Loader.Element): void;
        public registerSidTarget(object: Loader.Element, parent: Loader.Element): void;
        public getNodePath(node: Node): string;
        public reportUnexpectedChild(child: Node): void;
        public reportUnhandledChild(child: Node): void;
        public resolveAllLinks(): void;
    }
}
declare module COLLADA.Loader {
    class Library<T extends Loader.Element> {
        public children: T[];
        constructor();
        static parse<T extends Loader.Element>(node: Node, parser: (child: Node, context: Loader.Context) => T, childName: string, context: Loader.Context): Library<T>;
    }
}
declare module COLLADA.Loader {
    /**
    *   An <asset> element.
    */
    class Asset extends Loader.Element {
        public unit: number;
        public upAxis: string;
        constructor();
        static parse(node: Node, context: Loader.Context): Asset;
    }
}
declare module COLLADA.Loader {
    /**
    *   A <scene> element.
    */
    class Scene extends Loader.Element {
        public instance: Loader.Link;
        constructor();
        static parse(node: Node, context: Loader.Context): Scene;
    }
}
declare module COLLADA.Loader {
    /**
    *   A <surface> element.
    *
    */
    class EffectSurface extends Loader.Element {
        public type: string;
        public initFrom: Loader.Link;
        public format: string;
        public size: Float32Array;
        public viewportRatio: Float32Array;
        public mipLevels: number;
        public mipmapGenerate: boolean;
        constructor();
        static fromLink(link: Loader.Link, context: COLLADA.Context): EffectSurface;
        /**
        *   Parses a <surface> element.
        */
        static parse(node: Node, parent: Loader.Element, context: Loader.Context): EffectSurface;
    }
}
declare module COLLADA.Loader {
    /**
    *   An <newparam> element.
    */
    class EffectSampler extends Loader.Element {
        public surface: Loader.Link;
        public image: Loader.Link;
        public wrapS: string;
        public wrapT: string;
        public minFilter: string;
        public magFilter: string;
        public borderColor: Float32Array;
        public mipmapMaxLevel: number;
        public mipmapBias: number;
        constructor();
        static fromLink(link: Loader.Link, context: COLLADA.Context): EffectSampler;
        /**
        *   Parses a <newparam> element.
        */
        static parse(node: Node, parent: Loader.Element, context: Loader.Context): EffectSampler;
    }
}
declare module COLLADA.Loader {
    /**
    *   An <newparam> element.
    *
    */
    class EffectParam extends Loader.Element {
        public semantic: string;
        public surface: Loader.EffectSurface;
        public sampler: Loader.EffectSampler;
        public floats: Float32Array;
        constructor();
        static fromLink(link: Loader.Link, context: COLLADA.Context): EffectParam;
        /**
        *   Parses a <newparam> element.
        */
        static parse(node: Node, parent: Loader.Element, context: Loader.Context): EffectParam;
    }
}
declare module COLLADA.Loader {
    class ColorOrTexture extends Loader.Element {
        public color: Float32Array;
        public textureSampler: Loader.Link;
        public texcoord: string;
        public opaque: string;
        public bumptype: string;
        constructor();
        /**
        *   Parses a color or texture element  (<ambient>, <diffuse>, ...).
        */
        static parse(node: Node, parent: Loader.Element, context: Loader.Context): ColorOrTexture;
    }
}
declare module COLLADA.Loader {
    /**
    *   An <technique> element.
    *
    */
    class EffectTechnique extends Loader.Element {
        public params: Loader.EffectParam[];
        public shading: string;
        public emission: Loader.ColorOrTexture;
        public ambient: Loader.ColorOrTexture;
        public diffuse: Loader.ColorOrTexture;
        public specular: Loader.ColorOrTexture;
        public reflective: Loader.ColorOrTexture;
        public transparent: Loader.ColorOrTexture;
        public bump: Loader.ColorOrTexture;
        public shininess: number;
        public transparency: number;
        public reflectivity: number;
        public index_of_refraction: number;
        public double_sided: boolean;
        constructor();
        static fromLink(link: Loader.Link, context: COLLADA.Context): EffectTechnique;
        /**
        *   Parses a <technique> element.
        */
        static parse(node: Node, parent: Loader.Element, context: Loader.Context): EffectTechnique;
        /**
        *   Parses a <technique>/(<blinn>|<phong>|<lambert>|<constant>) element.
        *   In addition to <technique>, node may also be child of <technique>/<extra>
        */
        static parseParam(node: Node, technique: EffectTechnique, profile: string, context: Loader.Context): void;
        /**
        *   Parses a <technique>/<extra> element.
        */
        static parseExtra(node: Node, technique: EffectTechnique, context: Loader.Context): void;
    }
}
declare module COLLADA.Loader {
    /**
    *   An <effect> element.
    *
    */
    class Effect extends Loader.Element {
        public params: Loader.EffectParam[];
        public technique: Loader.EffectTechnique;
        constructor();
        static fromLink(link: Loader.Link, context: COLLADA.Context): Effect;
        /**
        *   Parses an <effect> element.
        */
        static parse(node: Node, context: Loader.Context): Effect;
        /**
        *   Parses an <effect>/<profile_COMMON> element.
        */
        static parseProfileCommon(node: Node, effect: Effect, context: Loader.Context): void;
    }
}
declare module COLLADA.Loader {
    class Material extends Loader.Element {
        public effect: Loader.Link;
        constructor();
        static fromLink(link: Loader.Link, context: COLLADA.Context): Material;
        /**
        *   Parses a <material> element.
        */
        static parse(node: Node, context: Loader.Context): Material;
    }
}
declare module COLLADA.Loader {
    interface SourceData {
        length: number;
        [index: number]: any;
    }
    class Source extends Loader.Element {
        public sourceId: string;
        public count: number;
        public stride: number;
        public offset: number;
        /** Can be one of: Float32Array, Int32Array, Uint8Array, Array<string> */
        public data: SourceData;
        public params: {
            [s: string]: string;
        };
        constructor();
        static fromLink(link: Loader.Link, context: COLLADA.Context): Source;
        /**
        *   Parses a <source> element
        */
        static parse(node: Node, context: Loader.Context): Source;
        /**
        *   Parses a <source>/<technique_common> element
        */
        static parseSourceTechniqueCommon(node: Node, source: Source, context: Loader.Context): void;
        /**
        *   Parses a <source>/<technique_common>/<accessor> element
        */
        static parseAccessor(node: Node, source: Source, context: Loader.Context): void;
        /**
        *   Parses a <source>/<technique_common>/<accessor>/<param> element
        */
        static parseAccessorParam(node: Node, source: Source, context: Loader.Context): void;
    }
}
declare module COLLADA.Loader {
    class Input extends Loader.Element {
        /** "VERTEX", "POSITION", "NORMAL", "TEXCOORD", ... */
        public semantic: string;
        /** URL of source object */
        public source: Loader.UrlLink;
        /** Offset in index array */
        public offset: number;
        /** Optional set identifier */
        public set: number;
        constructor();
        /**
        *   Parses an <input> element.
        */
        static parse(node: Node, shared: boolean, context: Loader.Context): Input;
    }
}
declare module COLLADA.Loader {
    class Triangles extends Loader.Element {
        /** "triangles", "polylist", or "polygons" */
        public type: string;
        public count: number;
        /** A material "symbol", bound by <bind_material> */
        public material: string;
        public inputs: Loader.Input[];
        public indices: Int32Array;
        public vcount: Int32Array;
        constructor();
        /**
        *   Parses a <triangles> element.
        */
        static parse(node: Node, context: Loader.Context): Triangles;
    }
}
declare module COLLADA.Loader {
    class Vertices extends Loader.Element {
        public inputs: Loader.Input[];
        constructor();
        static fromLink(link: Loader.Link, context: COLLADA.Context): Vertices;
        /**
        *   Parses a <vertices> element.
        */
        static parse(node: Node, context: Loader.Context): Vertices;
    }
}
declare module COLLADA.Loader {
    class Geometry extends Loader.Element {
        public sources: Loader.Source[];
        public vertices: Loader.Vertices[];
        public triangles: Loader.Triangles[];
        constructor();
        static fromLink(link: Loader.Link, context: COLLADA.Context): Geometry;
        /**
        *   Parses a <geometry> element
        */
        static parse(node: Node, context: Loader.Context): Geometry;
        /**
        *   Parses a <geometry>/<mesh> element
        */
        static parseMesh(node: Node, geometry: Geometry, context: Loader.Context): void;
        /**
        *   Parses a <geometry>/<extra> element
        */
        static parseGeometryExtra(node: Node, geometry: Geometry, context: Loader.Context): void;
        /**
        *   Parses a <geometry>/<extra>/<technique> element
        */
        static parseGeometryExtraTechnique(node: Node, geometry: Geometry, profile: string, context: Loader.Context): void;
    }
}
declare module COLLADA.Loader {
    class Joints extends Loader.Element {
        public joints: Loader.Input;
        public invBindMatrices: Loader.Input;
        constructor();
        /**
        *   Parses a <joints> element.
        */
        static parse(node: Node, context: Loader.Context): Joints;
        static addInput(joints: Joints, input: Loader.Input, context: Loader.Context): void;
    }
}
declare module COLLADA.Loader {
    class VertexWeights extends Loader.Element {
        public inputs: Loader.Input[];
        public vcount: Int32Array;
        public v: Int32Array;
        public joints: Loader.Input;
        public weights: Loader.Input;
        public count: number;
        constructor();
        /**
        *   Parses a <vertex_weights> element.
        */
        static parse(node: Node, context: Loader.Context): VertexWeights;
        static addInput(weights: VertexWeights, input: Loader.Input, context: Loader.Context): void;
    }
}
declare module COLLADA.Loader {
    class Skin extends Loader.Element {
        public source: Loader.UrlLink;
        public bindShapeMatrix: Float32Array;
        public sources: Loader.Source[];
        public joints: Loader.Joints;
        public vertexWeights: Loader.VertexWeights;
        constructor();
        /**
        *   Parses a <skin> element.
        */
        static parse(node: Node, context: Loader.Context): Skin;
    }
}
declare module COLLADA.Loader {
    class Morph extends Loader.Element {
        constructor();
        /**
        *   Parses a <morph> element.
        */
        static parse(node: Node, context: Loader.Context): Morph;
    }
}
declare module COLLADA.Loader {
    class Controller extends Loader.Element {
        public skin: Loader.Skin;
        public morph: Loader.Morph;
        constructor();
        static fromLink(link: Loader.Link, context: COLLADA.Context): Controller;
        /**
        *   Parses a <controller> element.
        */
        static parse(node: Node, context: Loader.Context): Controller;
    }
}
declare module COLLADA.Loader {
    class LightParam extends Loader.Element {
        public value: number;
        constructor();
        /**
        *   Parses a light parameter element.
        */
        static parse(node: Node, context: Loader.Context): LightParam;
    }
}
declare module COLLADA.Loader {
    class Light extends Loader.Element {
        public type: string;
        public color: Float32Array;
        public params: {
            [s: string]: Loader.LightParam;
        };
        constructor();
        /**
        *   Parses a <light> element.
        */
        static parse(node: Node, context: Loader.Context): Light;
        /**
        *   Parses a <light>/<technique_common> element.
        */
        static parseTechniqueCommon(node: Node, light: Light, context: Loader.Context): void;
        /**
        *   Parses a <light>/<technique_common>/(<ambient>|<directional>|<point>|<spot>) element.
        */
        static parseParams(node: Node, light: Light, profile: string, context: Loader.Context): void;
    }
}
declare module COLLADA.Loader {
    class CameraParam extends Loader.Element {
        public value: number;
        constructor();
        /**
        *   Parses a camera parameter element.
        */
        static parse(node: Node, context: Loader.Context): CameraParam;
    }
}
declare module COLLADA.Loader {
    class Camera extends Loader.Element {
        public type: string;
        public params: {
            [s: string]: Loader.CameraParam;
        };
        constructor();
        /**
        *   Parses a <camera> element.
        */
        static parse(node: Node, context: Loader.Context): Camera;
        /**
        *   Parses a <camera>/<optics> element.
        */
        static parseOptics(node: Node, camera: Camera, context: Loader.Context): void;
        /**
        *   Parses a <camera>/<optics>/<technique_common> element.
        */
        static parseTechniqueCommon(node: Node, camera: Camera, context: Loader.Context): void;
        /**
        *   Parses a <camera>/<optics>/<technique_common>/(<orthographic>|<perspective>) element.
        */
        static parseParams(node: Node, camera: Camera, context: Loader.Context): void;
    }
}
declare module COLLADA.Loader {
    class Image extends Loader.Element {
        public initFrom: string;
        constructor();
        static fromLink(link: Loader.Link, context: COLLADA.Context): Image;
        /**
        *   Parses an <image> element.
        */
        static parse(node: Node, context: Loader.Context): Image;
    }
}
declare module COLLADA.Loader {
    class InstanceCamera extends Loader.Element {
        public camera: Loader.Link;
        constructor();
        /**
        *   Parses a <instance_light> element.
        */
        static parse(node: Node, parent: Loader.VisualSceneNode, context: Loader.Context): InstanceCamera;
    }
}
declare module COLLADA.Loader {
    class BindMaterial {
        /**
        *   Parses a <bind_material> element. Can be child of <instance_geometry> or <instance_controller>
        */
        static parse(node: Node, parent: Loader.InstanceMaterialContainer, context: Loader.Context): void;
        /**
        *   Parses a <instance_geometry>/<bind_material>/<technique_common> element.
        */
        static parseTechniqueCommon(node: Node, parent: Loader.InstanceMaterialContainer, context: Loader.Context): void;
    }
}
declare module COLLADA.Loader {
    interface InstanceMaterialVertexInput {
        inputSemantic: string;
        inputSet: number;
    }
    interface InstanceMaterialParam {
        target: Loader.SidLink;
    }
    interface InstanceMaterialContainer extends Loader.Element {
        materials: InstanceMaterial[];
    }
    class InstanceMaterial extends Loader.Element {
        public material: Loader.UrlLink;
        public symbol: string;
        /** Contains uniform parameters */
        public params: {
            [s: string]: InstanceMaterialParam;
        };
        /** Contains vertex paramters */
        public vertexInputs: {
            [s: string]: InstanceMaterialVertexInput;
        };
        constructor();
        /**
        *   Parses a <instance_material> element.
        */
        static parse(node: Node, parent: InstanceMaterialContainer, context: Loader.Context): InstanceMaterial;
        /**
        *   Parses a <instance_material>/<bind_vertex_input> element.
        */
        static parseBindVertexInput(node: Node, instanceMaterial: InstanceMaterial, context: Loader.Context): void;
        /**
        *   Parses a <instance_material>/<bind> element.
        */
        static parseBind(node: Node, instanceMaterial: InstanceMaterial, context: Loader.Context): void;
    }
}
declare module COLLADA.Loader {
    interface InstanceControllerContainer extends Loader.Element {
        controllers: InstanceController[];
    }
    class InstanceController extends Loader.Element {
        public controller: Loader.Link;
        public skeletons: Loader.Link[];
        public materials: Loader.InstanceMaterial[];
        constructor();
        /**
        *   Parses a <instance_controller> element.
        */
        static parse(node: Node, parent: InstanceControllerContainer, context: Loader.Context): InstanceController;
    }
}
declare module COLLADA.Loader {
    class InstanceGeometry extends Loader.Element {
        public geometry: Loader.Link;
        public materials: Loader.InstanceMaterial[];
        constructor();
        /**
        *   Parses a <instance_geometry> element.
        */
        static parse(node: Node, parent: Loader.Element, context: Loader.Context): InstanceGeometry;
    }
}
declare module COLLADA.Loader {
    class InstanceLight extends Loader.Element {
        public light: Loader.Link;
        constructor();
        /**
        *   Parses a <instance_light> element.
        */
        static parse(node: Node, parent: Loader.VisualSceneNode, context: Loader.Context): InstanceLight;
    }
}
declare module COLLADA.Loader {
    class NodeTransform extends Loader.Element {
        public type: string;
        public data: Float32Array;
        constructor();
        /**
        *   Parses a transformation element.
        */
        static parse(node: Node, parent: Loader.VisualSceneNode, context: Loader.Context): NodeTransform;
    }
}
declare module COLLADA.Loader {
    /**
    *   A <node> element (child of <visual_scene>, <library_nodes>, or another <node>).
    */
    class VisualSceneNode extends Loader.Element {
        public type: string;
        public layer: string;
        public children: VisualSceneNode[];
        public parent: Loader.Element;
        public transformations: Loader.NodeTransform[];
        public geometries: Loader.InstanceGeometry[];
        public controllers: Loader.InstanceController[];
        public lights: Loader.InstanceLight[];
        public cameras: Loader.InstanceCamera[];
        constructor();
        static fromLink(link: Loader.Link, context: COLLADA.Context): VisualSceneNode;
        static registerParent(child: VisualSceneNode, parent: Loader.Element, context: Loader.Context): void;
        static parse(node: Node, context: Loader.Context): VisualSceneNode;
    }
}
declare module COLLADA.Loader {
    /**
    *   An <visual_scene> element.
    */
    class VisualScene extends Loader.Element {
        public children: Loader.VisualSceneNode[];
        constructor();
        static fromLink(link: Loader.Link, context: COLLADA.Context): VisualScene;
        static parse(node: Node, context: Loader.Context): VisualScene;
    }
}
declare module COLLADA.Loader {
    class Sampler extends Loader.Element {
        public input: Loader.Input;
        public outputs: Loader.Input[];
        public inTangents: Loader.Input[];
        public outTangents: Loader.Input[];
        public interpolation: Loader.Input;
        constructor();
        static fromLink(link: Loader.Link, context: COLLADA.Context): Sampler;
        /**
        *   Parses a <sampler> element.
        */
        static parse(node: Node, context: Loader.Context): Sampler;
        static addInput(sampler: Sampler, input: Loader.Input, context: Loader.Context): void;
    }
}
declare module COLLADA.Loader {
    class Channel extends Loader.Element {
        public source: Loader.UrlLink;
        public target: Loader.SidLink;
        constructor();
        /**
        *   Parses a <channel> element.
        */
        static parse(node: Node, parent: Loader.Animation, context: Loader.Context): Channel;
    }
}
declare module COLLADA.Loader {
    class Animation extends Loader.Element {
        public parent: Animation;
        public children: Animation[];
        public sources: Loader.Source[];
        public samplers: Loader.Sampler[];
        public channels: Loader.Channel[];
        constructor();
        public root(): Animation;
        /**
        *   Parses an <animation> element.
        */
        static parse(node: Node, context: Loader.Context): Animation;
    }
}
declare module COLLADA.Loader {
    class Document {
        public scene: Loader.Scene;
        public asset: Loader.Asset;
        public libEffects: Loader.Library<Loader.Effect>;
        public libMaterials: Loader.Library<Loader.Material>;
        public libGeometries: Loader.Library<Loader.Geometry>;
        public libControllers: Loader.Library<Loader.Controller>;
        public libLights: Loader.Library<Loader.Light>;
        public libCameras: Loader.Library<Loader.Camera>;
        public libImages: Loader.Library<Loader.Image>;
        public libVisualScenes: Loader.Library<Loader.VisualScene>;
        public libAnimations: Loader.Library<Loader.Animation>;
        public libNodes: Loader.Library<Loader.VisualSceneNode>;
        constructor();
        static parse(doc: XMLDocument, context: Loader.Context): Document;
        static parseCOLLADA(node: Node, context: Loader.Context): Document;
    }
}
declare module COLLADA {
    enum LogLevel {
        Trace = 1,
        Info = 2,
        Warning = 3,
        Error = 4,
        Exception = 5,
    }
    interface Log {
        write: (message: string, level: LogLevel) => void;
    }
    class LogArray implements Log {
        public messages: {
            message: string;
            level: LogLevel;
        }[];
        constructor();
        public write(message: string, level: LogLevel): void;
    }
    class LogConsole implements Log {
        constructor();
        public write(message: string, level: LogLevel): void;
    }
    class LogTextArea implements Log {
        public area: HTMLTextAreaElement;
        constructor(area: HTMLTextAreaElement);
        public write(message: string, level: LogLevel): void;
    }
}
declare module COLLADA.Loader {
    class ColladaLoader {
        public onFinished: (id: string, doc: Loader.Document) => void;
        public onProgress: (id: string, loaded: number, total: number) => void;
        public log: COLLADA.Log;
        constructor();
        private _reportError(id, context);
        private _reportSuccess(id, doc, context);
        private _reportProgress(id, context);
        public loadFromXML(id: string, doc: XMLDocument): Loader.Document;
        private _loadFromXML(id, doc, context);
        public loadFromURL(id: string, url: string): void;
    }
}
declare module COLLADA.Converter {
    class MaterialMap {
        public symbols: {
            [symbol: string]: Material;
        };
        constructor();
    }
    class Material {
        public name: string;
        public diffuse: Converter.Texture;
        public specular: Converter.Texture;
        public normal: Converter.Texture;
        constructor();
        static createDefaultMaterial(context: Converter.Context): Material;
        static createMaterial(instanceMaterial: COLLADA.Loader.InstanceMaterial, context: Converter.Context): Material;
        static getMaterialMap(instanceMaterials: COLLADA.Loader.InstanceMaterial[], context: Converter.Context): MaterialMap;
    }
}
declare var glMatrix: glMatrixStatic;
declare var mat3: Mat3Static;
declare var mat4: Mat4Static;
declare var vec2: Vec2Static;
declare var vec3: Vec3Static;
declare var vec4: Vec4Static;
declare var quat: QuatStatic;
declare module COLLADA {
    interface NumberArray {
        length: number;
        [index: number]: number;
    }
    class MathUtils {
        public contructor(): void;
        static TO_RADIANS: number;
        static round(num: number, decimals: number): number;
        static copyNumberArray(src: NumberArray, dest: NumberArray, count: number): void;
        /**
        * Calls the given function for each src[i*stride + offset]
        */
        static forEachElement(src: NumberArray, stride: number, offset: number, fn: (x: number) => void): void;
        /**
        * Extracts a 4D matrix from an array of matrices (stored as an array of numbers)
        */
        static mat4Extract(src: NumberArray, srcOff: number, dest: Mat4): void;
        static decompose(mat: Mat4, pos: Vec3, rot: Quat, scl: Vec3): void;
        static bezier(p0: number, c0: number, c1: number, p1: number, s: number): number;
        static hermite(p0: number, t0: number, t1: number, p1: number, s: number): number;
        /**
        * Given a monotonously increasing function fn and a value target_y, finds a value x with 0<=x<=1 such that fn(x)=target_y
        */
        static bisect(target_y: number, fn: (x: number) => number, tol_y: number, max_iterations: number): number;
    }
}
declare module COLLADA.Converter {
    class Utils {
        /**
        * Re-indexes data.
        * Copies srcData[srcIndices[i*srcStride + srcOffset]] to destData[destIndices[i*destStride + destOffset]]
        *
        * Used because in COLLADA, each geometry attribute (position, normal, ...) can have its own index buffer,
        * whereas for GPU rendering, there is only one index buffer for the whole geometry.
        *
        */
        static reIndex(srcData: Float32Array, srcIndices: Int32Array, srcStride: number, srcOffset: number, srcDim: number, destData: Float32Array, destIndices: Int32Array, destStride: number, destOffset: number, destDim: number): void;
        /**
        * Given a list of indices stored as indices[i*stride + offset],
        * returns a similar list of indices stored as an array of consecutive numbers.
        */
        static compactIndices(indices: Int32Array, stride: number, offset: number): Int32Array;
        /**
        * Returns the maximum element of a list of non-negative integers
        */
        static maxIndex(indices: Int32Array): number;
        static createFloatArray(source: COLLADA.Loader.Source, name: string, outDim: number, context: COLLADA.Context): Float32Array;
        static createStringArray(source: COLLADA.Loader.Source, name: string, outDim: number, context: COLLADA.Context): string[];
    }
}
declare module COLLADA.Converter {
    class Bone {
        public index: number;
        public node: Converter.Node;
        public name: string;
        public parent: Bone;
        public attachedToSkin: boolean;
        public invBindMatrix: Mat4;
        constructor(node: Converter.Node);
        public parentIndex(): number;
        public depth(): number;
        static create(node: Converter.Node): Bone;
        /**
        * Finds the visual scene node that is referenced by the joint SID.
        * The skin element contains the skeleton root nodes.
        */
        static findBoneNode(boneSid: string, skeletonRootNodes: COLLADA.Loader.VisualSceneNode[], context: Converter.Context): COLLADA.Loader.VisualSceneNode;
        /**
        * Find the parent for each bone
        * The skeleton(s) may contain more bones than referenced by the skin
        * This function also adds all bones that are not referenced but used for the skeleton transformation
        */
        static findBoneParents(bones: Bone[], context: Converter.Context): void;
        /**
        * Create all bones used in the given skin
        */
        static createSkinBones(jointSids: string[], skeletonRootNodes: COLLADA.Loader.VisualSceneNode[], bindShapeMatrix: Mat4, invBindMatrices: Float32Array, context: Converter.Context): Bone[];
        /**
        * Updates the index member for all bones of the given array
        */
        static updateIndices(bones: Bone[]): void;
        /**
        * Returns true if the two bones can safely be merged, i.e.,
        * they reference the same scene graph node and have the same inverse bind matrix
        */
        static sameBone(a: Bone, b: Bone): boolean;
        /**
        * Appends bones from src to dest, so that each bone is unique
        */
        static appendBones(dest: Bone[], src: Bone[]): void;
        /**
        * Appends src_bone to dest
        */
        static appendBone(dest: Bone[], src_bone: Bone): Bone;
        /**
        * Given two arrays a and b, such that each bone from a is contained in b,
        * compute a map that maps the old index of each bone to the new index.
        */
        static getBoneIndexMap(a: Bone[], b: Bone[]): Uint32Array;
    }
}
declare module COLLADA.Converter {
    class GeometryChunk {
        public name: string;
        public vertexCount: number;
        public triangleCount: number;
        public indices: Int32Array;
        public position: Float32Array;
        public normal: Float32Array;
        public texcoord: Float32Array;
        public boneweight: Float32Array;
        public boneindex: Uint8Array;
        public material: Converter.Material;
        public bbox_min: Vec3;
        public bbox_max: Vec3;
        public bindShapeMatrix: Mat4;
        /** Original indices, contained in <triangles>/<p> */
        public _colladaVertexIndices: Int32Array;
        /** The stride of the original indices (number of independent indices per vertex) */
        public _colladaIndexStride: number;
        /** The offset of the main (position) index in the original vertices */
        public _colladaIndexOffset: number;
        constructor();
    }
    class Geometry {
        public name: string;
        public chunks: GeometryChunk[];
        public bones: Converter.Bone[];
        constructor();
        static createStatic(instanceGeometry: COLLADA.Loader.InstanceGeometry, context: Converter.Context): Geometry;
        static createAnimated(instanceController: COLLADA.Loader.InstanceController, context: Converter.Context): Geometry;
        static createSkin(instanceController: COLLADA.Loader.InstanceController, controller: COLLADA.Loader.Controller, context: Converter.Context): Geometry;
        static createMorph(instanceController: COLLADA.Loader.InstanceController, controller: COLLADA.Loader.Controller, context: Converter.Context): Geometry;
        static createGeometry(geometry: COLLADA.Loader.Geometry, instanceMaterials: COLLADA.Loader.InstanceMaterial[], context: Converter.Context): Geometry;
        static createChunk(geometry: COLLADA.Loader.Geometry, triangles: COLLADA.Loader.Triangles, context: Converter.Context): GeometryChunk;
        /**
        * Computes the bounding box of the static (unskinned) geometry
        */
        static computeBoundingBox(chunk: GeometryChunk, context: Converter.Context): void;
        static transformGeometry(geometry: Geometry, transformMatrix: Mat4, context: Converter.Context): void;
        static addSkeleton(geometry: Geometry, node: Converter.Node, context: Converter.Context): void;
        /**
        * Moves all data from given geometries into one merged geometry.
        * The original geometries will be empty after this operation (lazy design to avoid data duplication).
        */
        static mergeGeometries(geometries: Geometry[], context: Converter.Context): Geometry;
        /**
        * Change all vertex bone indices so that they point to the given new_bones array, instead of the current geometry.bones array
        */
        static adaptBoneIndices(geometry: Geometry, new_bones: Converter.Bone[], context: Converter.Context): void;
    }
}
declare module COLLADA.Converter {
    interface AnimationTarget {
        applyAnimation(channel: Converter.AnimationChannel, time: number, context: COLLADA.Context): void;
        registerAnimation(channel: Converter.AnimationChannel): void;
        getTargetDataRows(): number;
        getTargetDataColumns(): number;
    }
    class AnimationTimeStatistics {
        /** Start of the time line */
        public minTime: number;
        /** End of the time line */
        public maxTime: number;
        /** Minimum average fps among all animation tracks */
        public minAvgFps: number;
        /** Maximum average fps among all animation tracks */
        public maxAvgFps: number;
        /** Sum of average fps of all tracks */
        public sumAvgFps: number;
        /** Number of data points */
        public count: number;
        constructor();
        public avgFps(): number;
        public addDataPoint(minTime: number, maxTime: number, avgFps: number): void;
    }
    class Animation {
        public id: string;
        public name: string;
        public channels: Converter.AnimationChannel[];
        constructor();
        static create(animation: COLLADA.Loader.Animation, context: Converter.Context): Animation;
        static addChannelsToAnimation(collada_animation: COLLADA.Loader.Animation, converter_animation: Animation, context: Converter.Context): void;
        /**
        * Returns the time and fps statistics of this animation
        */
        static getTimeStatistics(animation: Animation, index_begin: number, index_end: number, result: AnimationTimeStatistics, context: Converter.Context): void;
    }
}
declare module COLLADA.Converter {
    interface AnimationChannelIndices {
        /** left index */
        i0: number;
        /** right index */
        i1: number;
    }
    class AnimationChannel {
        public target: Converter.AnimationTarget;
        public interpolation: string[];
        public input: Float32Array;
        public output: Float32Array;
        public inTangent: Float32Array;
        public outTangent: Float32Array;
        public dataOffset: number;
        public dataCount: number;
        constructor();
        public findInputIndices(t: number, context: COLLADA.Context): AnimationChannelIndices;
        static createInputData(input: COLLADA.Loader.Input, inputName: string, dataDim: number, context: Converter.Context): Float32Array;
        static createInputDataFromArray(inputs: COLLADA.Loader.Input[], inputName: string, dataDim: number, context: Converter.Context): Float32Array;
        static create(channel: COLLADA.Loader.Channel, context: Converter.Context): AnimationChannel;
        static interpolateLinear(time: number, t0: number, t1: number, i0: number, i1: number, dataCount: number, dataOffset: number, channel: AnimationChannel, destData: Float32Array): void;
        static interpolateBezier(time: number, t0: number, t1: number, i0: number, i1: number, dataCount: number, dataOffset: number, channel: AnimationChannel, destData: Float32Array): void;
        static interpolateHermite(time: number, t0: number, t1: number, i0: number, i1: number, dataCount: number, dataOffset: number, channel: AnimationChannel, destData: Float32Array): void;
        static applyToData(channel: AnimationChannel, destData: Float32Array, time: number, context: Converter.Context): void;
    }
}
declare module COLLADA.Converter {
    enum TransformType {
        Translation = 1,
        Rotation = 2,
        Scale = 3,
    }
    class Transform {
        public data: Float32Array;
        public original_data: Float32Array;
        public rows: number;
        public colums: number;
        public channels: Converter.AnimationChannel[];
        constructor(transform: COLLADA.Loader.NodeTransform, rows: number, columns: number);
        public getTargetDataRows(): number;
        public getTargetDataColumns(): number;
        public applyAnimation(channel: Converter.AnimationChannel, time: number, context: Converter.Context): void;
        public registerAnimation(channel: Converter.AnimationChannel): void;
        public isAnimated(): boolean;
        public isAnimatedBy(animation: Converter.Animation): boolean;
        public resetAnimation(): void;
        public applyTransformation(mat: Mat4): void;
        public updateFromData(): void;
        public hasTransformType(type: TransformType): boolean;
    }
    class TransformMatrix extends Transform implements Converter.AnimationTarget {
        public matrix: Mat4;
        constructor(transform: COLLADA.Loader.NodeTransform);
        public updateFromData(): void;
        public applyTransformation(mat: Mat4): void;
        public hasTransformType(type: TransformType): boolean;
    }
    class TransformRotate extends Transform implements Converter.AnimationTarget {
        /** Source data: axis */
        public axis: Vec3;
        /** Source data: angle */
        public radians: number;
        constructor(transform: COLLADA.Loader.NodeTransform);
        public updateFromData(): void;
        public applyTransformation(mat: Mat4): void;
        public hasTransformType(type: TransformType): boolean;
    }
    class TransformTranslate extends Transform implements Converter.AnimationTarget {
        /** Source data: translation */
        public pos: Vec3;
        constructor(transform: COLLADA.Loader.NodeTransform);
        public updateFromData(): void;
        public applyTransformation(mat: Mat4): void;
        public hasTransformType(type: TransformType): boolean;
    }
    class TransformScale extends Transform implements Converter.AnimationTarget {
        /** Source data: scaling */
        public scl: Vec3;
        constructor(transform: COLLADA.Loader.NodeTransform);
        public updateFromData(): void;
        public applyTransformation(mat: Mat4): void;
        public hasTransformType(type: TransformType): boolean;
    }
}
declare module COLLADA.Converter {
    class Node {
        public name: string;
        public parent: Node;
        public children: Node[];
        public geometries: Converter.Geometry[];
        public transformations: Converter.Transform[];
        public matrix: Mat4;
        public worldMatrix: Mat4;
        constructor();
        /**
        * Returns the world transformation matrix of this node
        */
        public getWorldMatrix(): Mat4;
        /**
        * Returns the local transformation matrix of this node
        */
        public getLocalMatrix(): Mat4;
        /**
        * Returns true if this node contains any scene graph items (geometry, lights, cameras, ...)
        */
        public containsSceneGraphItems(): boolean;
        /**
        * Returns whether there exists any animation that targets the transformation of this node
        */
        public isAnimated(recursive: boolean): boolean;
        /**
        * Returns whether there the given animation targets the transformation of this node
        */
        public isAnimatedBy(animation: Converter.Animation, recursive: boolean): boolean;
        public resetAnimation(): void;
        /**
        * Removes all nodes from that list that are not relevant for the scene graph
        */
        static pruneNodes(nodes: Node[], context: COLLADA.Context): void;
        /**
        * Recursively creates a converter node tree from the given collada node root node
        */
        static createNode(node: COLLADA.Loader.VisualSceneNode, context: Converter.Context): Node;
        static createNodeData(converter_node: Node, context: Converter.Context): void;
        /**
        * Calls the given function for all given nodes and their children (recursively)
        */
        static forEachNode(nodes: Node[], fn: (node: Node) => void): void;
        /**
        * Extracts all geometries in the given scene and merges them into a single geometry.
        * The geometries are detached from their original nodes in the process.
        */
        static extractGeometries(scene_nodes: Node[], context: Converter.Context): Converter.Geometry[];
    }
}
declare module COLLADA.Converter {
    class Texture {
        public id: string;
        public url: string;
        constructor(img: COLLADA.Loader.Image);
        static createTexture(colorOrTexture: COLLADA.Loader.ColorOrTexture, context: Converter.Context): Texture;
    }
}
declare module COLLADA.Converter {
    /**
    * A map that maps various COLLADA objects to converter objects
    *
    * The converter does not store direct references to COLLADA objects,
    * so that the old COLLADA document can be garbage collected.
    */
    class ObjectMap<ColladaType, ConverterType> {
        public collada: ColladaType[];
        public converter: ConverterType[];
        constructor();
        public register(collada: ColladaType, converter: ConverterType): void;
        public findConverter(collada: ColladaType): ConverterType;
        public findCollada(converter: ConverterType): ColladaType;
    }
    class Context implements COLLADA.Context {
        public materials: ObjectMap<COLLADA.Loader.Material, Converter.Material>;
        public textures: ObjectMap<COLLADA.Loader.Image, Converter.Texture>;
        public nodes: ObjectMap<COLLADA.Loader.VisualSceneNode, Converter.Node>;
        public animationTargets: ObjectMap<COLLADA.Loader.Element, Converter.AnimationTarget>;
        public log: COLLADA.Log;
        public options: Converter.Options;
        constructor(log: COLLADA.Log, options: Converter.Options);
    }
}
declare module COLLADA.Converter {
    class OptionBool {
        public value: boolean;
        public description: string;
        constructor(defaultValue: boolean, description: string);
    }
    class OptionFloat {
        public value: number;
        public min: number;
        public max: number;
        public description: string;
        constructor(defaultValue: number, min: number, max: number, description: string);
    }
    class OptionArray<T> {
        public value: T[];
        public description: string;
        constructor(defaultValue: T[], description: string);
    }
    class Options {
        public singleAnimation: OptionBool;
        public singleGeometry: OptionBool;
        public enableAnimations: OptionBool;
        public useAnimationLabels: OptionBool;
        public enableExtractGeometry: OptionBool;
        public enableResampledAnimations: OptionBool;
        public animationLabels: OptionArray<Converter.AnimationLabel>;
        public animationFps: OptionFloat;
        public removeConstAnimationTracks: OptionBool;
        constructor();
    }
}
declare module COLLADA.Converter {
    interface AnimationLabel {
        name: string;
        begin: number;
        end: number;
        fps: number;
    }
    class AnimationDataTrack {
        /** Position (relative to parent) */
        public pos: Float32Array;
        /** Rotation (relative to parent) */
        public rot: Float32Array;
        /** Scale (relative to parent) */
        public scl: Float32Array;
        /** Position (relative to rest pose) */
        public rel_pos: Float32Array;
        /** Rotation (relative to rest pose) */
        public rel_rot: Float32Array;
        /** Scale (relative to rest pose) */
        public rel_scl: Float32Array;
        constructor();
    }
    class AnimationData {
        public name: string;
        public duration: number;
        public keyframes: number;
        public fps: number;
        public tracks: AnimationDataTrack[];
        constructor();
        static create(bones: Converter.Bone[], animation: Converter.Animation, index_begin: number, index_end: number, fps: number, context: Converter.Context): AnimationData;
        static createFromLabels(bones: Converter.Bone[], animation: Converter.Animation, labels: AnimationLabel[], context: Converter.Context): AnimationData[];
    }
}
declare module COLLADA.Converter {
    class Document {
        /** The scene graph */
        public nodes: Converter.Node[];
        /** Animations (all original animation curves) */
        public animations: Converter.Animation[];
        /** Animations (resampled node animations) */
        public resampled_animations: Converter.AnimationData[];
        /** Geometries (detached from the scene graph) */
        public geometries: Converter.Geometry[];
        constructor();
    }
}
declare module COLLADA.Converter {
    class ColladaConverter {
        public log: COLLADA.Log;
        public options: Converter.Options;
        constructor();
        public convert(doc: COLLADA.Loader.Document): Converter.Document;
        static createScene(doc: COLLADA.Loader.Document, context: Converter.Context): Converter.Node[];
        static createAnimations(doc: COLLADA.Loader.Document, context: Converter.Context): Converter.Animation[];
        static createResampledAnimations(doc: COLLADA.Loader.Document, file: Converter.Document, context: Converter.Context): Converter.AnimationData[];
    }
}
declare module COLLADA.Exporter {
    interface InfoJSON {
        bbox_min: number[];
        bbox_max: number[];
    }
    interface DataChunkJSON {
        type: string;
        byte_offset: number;
        stride: number;
        count: number;
    }
    interface MaterialJSON {
        name: string;
        diffuse?: string;
        specular?: string;
        normal?: string;
    }
    interface GeometryJSON {
        name: string;
        material: number;
        vertex_count: number;
        triangle_count: number;
        bbox_min: number[];
        bbox_max: number[];
        bind_shape_mat?: number[];
        indices: DataChunkJSON;
        position: DataChunkJSON;
        normal?: DataChunkJSON;
        texcoord?: DataChunkJSON;
        boneweight?: DataChunkJSON;
        boneindex?: DataChunkJSON;
    }
    interface BoneJSON {
        name: string;
        parent: number;
        skinned: boolean;
        inv_bind_mat: number[];
        pos: number[];
        rot: number[];
        scl: number[];
    }
    interface AnimationTrackJSON {
        bone: number;
        pos?: DataChunkJSON;
        rot?: DataChunkJSON;
        scl?: DataChunkJSON;
    }
    interface AnimationJSON {
        name: string;
        frames: number;
        fps: number;
        tracks: AnimationTrackJSON[];
    }
    interface DocumentJSON {
        info: InfoJSON;
        materials: MaterialJSON[];
        geometries: GeometryJSON[];
        bones: BoneJSON[];
        animations: AnimationJSON[];
        /** Base64 encoded binary data */
        data?: string;
    }
}
declare module COLLADA.Exporter {
    class Utils {
        static stringToBuffer(str: string): Uint8Array;
        static bufferToString(buf: Uint8Array): string;
        static bufferToDataURI(buf: Uint8Array, mime: string): string;
        static bufferToBlobURI(buf: Uint8Array): string;
        static jsonToDataURI(json: any, mime: string): string;
    }
}
declare module COLLADA.Exporter {
    class Document {
        public json: Exporter.DocumentJSON;
        public data: Uint8Array;
        constructor();
    }
}
declare module COLLADA.Exporter {
    class DataChunk {
        public data: any;
        public type: string;
        public byte_offset: number;
        public stride: number;
        public count: number;
        public bytes_per_element: number;
        constructor();
        public getDataView(): Uint8Array;
        public getBytesCount(): number;
        public toJSON(): Exporter.DataChunkJSON;
        static create(data: any, stride: number, context: Exporter.Context): DataChunk;
    }
}
declare module COLLADA.Exporter {
    class Context implements COLLADA.Context {
        public log: COLLADA.Log;
        public chunks: Exporter.DataChunk[];
        public bytes_written: number;
        constructor(log: COLLADA.Log);
        public registerChunk(chunk: Exporter.DataChunk): void;
        public assembleData(): Uint8Array;
    }
}
declare module COLLADA.Exporter {
    class Material {
        public name: string;
        public diffuse: string;
        public specular: string;
        public normal: string;
        constructor();
        static create(material: COLLADA.Converter.Material, context: Exporter.Context): Material;
        public toJSON(): Exporter.MaterialJSON;
    }
}
declare module COLLADA.Exporter {
    class Geometry {
        public name: string;
        public material: number;
        public vertex_count: number;
        public triangle_count: number;
        public bbox_min: number[];
        public bbox_max: number[];
        public bind_shape_mat: number[];
        public indices: Exporter.DataChunk;
        public position: Exporter.DataChunk;
        public normal: Exporter.DataChunk;
        public texcoord: Exporter.DataChunk;
        public boneweight: Exporter.DataChunk;
        public boneindex: Exporter.DataChunk;
        constructor();
        static create(chunk: COLLADA.Converter.GeometryChunk, context: Exporter.Context): Geometry;
        public toJSON(): Exporter.GeometryJSON;
    }
}
declare module COLLADA.Exporter {
    class Bone {
        public name: string;
        public parent: number;
        public skinned: boolean;
        public inv_bind_mat: number[];
        public pos: number[];
        public rot: number[];
        public scl: number[];
        constructor();
        static create(bone: COLLADA.Converter.Bone, context: Exporter.Context): Bone;
        public toJSON(): Exporter.BoneJSON;
    }
}
declare module COLLADA.Exporter {
    class AnimationTrack {
        public pos: Exporter.DataChunk;
        public rot: Exporter.DataChunk;
        public scl: Exporter.DataChunk;
        public bone: number;
        constructor();
        static create(track: COLLADA.Converter.AnimationDataTrack, bone: number, context: Exporter.Context): AnimationTrack;
        public toJSON(): Exporter.AnimationTrackJSON;
    }
}
declare module COLLADA.Exporter {
    class Animation {
        public name: string;
        public frames: number;
        public fps: number;
        public tracks: Exporter.AnimationTrack[];
        constructor();
        static create(animation: COLLADA.Converter.AnimationData, context: Exporter.Context): Animation;
        public toJSON(): Exporter.AnimationJSON;
    }
}
declare module COLLADA.Exporter {
    class ColladaExporter {
        public log: COLLADA.Log;
        constructor();
        public export(doc: COLLADA.Converter.Document): Exporter.Document;
    }
}
