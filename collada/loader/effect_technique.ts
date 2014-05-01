
/**
*   An <technique> element.
*
*/
class ColladaEffectTechnique extends ColladaElement {
    params: ColladaEffectParam[];
    shading: string;
    emission: ColladaColorOrTexture;
    ambient: ColladaColorOrTexture;
    diffuse: ColladaColorOrTexture;
    specular: ColladaColorOrTexture;
    reflective: ColladaColorOrTexture;
    transparent: ColladaColorOrTexture;
    bump: ColladaColorOrTexture;
    shininess: number;
    transparency: number;
    reflectivity: number;
    index_of_refraction: number;
    double_sided: boolean;

    constructor() {
        super();
        this.params = [];
        this.shading = null;
        this.emission = null;
        this.ambient = null;
        this.diffuse = null;
        this.specular = null;
        this.reflective = null;
        this.transparent = null;
        this.bump = null;
        this.shininess = null;
        this.transparency = null;
        this.reflectivity = null;
        this.index_of_refraction = null;
        this.double_sided = null;
    }

    static fromLink(link: Link, context: ColladaProcessingContext): ColladaEffectTechnique {
        return ColladaElement._fromLink<ColladaEffectTechnique>(link, ColladaEffectTechnique, "ColladaEffectTechnique", context);
    }

    /**
    *   Parses a <technique> element.
    */
    static parse(node: Node, parent: ColladaElement, context: ColladaParsingContext): ColladaEffectTechnique {
        var result: ColladaEffectTechnique = new ColladaEffectTechnique();

        result.sid = context.getAttributeAsString(node, "sid", null, false);
        context.registerFxTarget(result, parent);

        Utils.forEachChild(node, function (child: Node) {
            switch (child.nodeName) {
                case "blinn":
                case "phong":
                case "lambert":
                case "constant":
                    result.shading = child.nodeName;
                    ColladaEffectTechnique.parseParam(child, result, "COMMON", context);
                    break;
                case "extra":
                    ColladaEffectTechnique.parseExtra(child, result, context);
                    break;
                default:
                    context.reportUnexpectedChild(child);
            }
        });

        return result;
    }

    /**
    *   Parses a <technique>/(<blinn>|<phong>|<lambert>|<constant>) element.
    *   In addition to <technique>, node may also be child of <technique>/<extra>
    */
    static parseParam(node: Node, technique: ColladaEffectTechnique, profile: string, context: ColladaParsingContext) {
        Utils.forEachChild(node, function (child: Node) {
            switch (child.nodeName) {
                case "newparam":
                    technique.params.push(ColladaEffectParam.parse(child, technique, context));
                    break;
                case "emission":
                    technique.emission = ColladaColorOrTexture.parse(child, technique, context);
                    break;
                case "ambient":
                    technique.ambient = ColladaColorOrTexture.parse(child, technique, context);
                    break;
                case "diffuse":
                    technique.diffuse = ColladaColorOrTexture.parse(child, technique, context);
                    break;
                case "specular":
                    technique.specular = ColladaColorOrTexture.parse(child, technique, context);
                    break;
                case "reflective":
                    technique.reflective = ColladaColorOrTexture.parse(child, technique, context);
                    break;
                case "transparent":
                    technique.transparent = ColladaColorOrTexture.parse(child, technique, context);
                    break;
                case "bump":
                    technique.bump = ColladaColorOrTexture.parse(child, technique, context);
                    break;
                case "shininess":
                    technique.shininess = parseFloat(child.childNodes[1].textContent);
                    break;
                case "reflectivity":
                    technique.reflectivity = parseFloat(child.childNodes[1].textContent);
                    break;
                case "transparency":
                    technique.transparency = parseFloat(child.childNodes[1].textContent);
                    break;
                case "index_of_refraction":
                    technique.index_of_refraction = parseFloat(child.childNodes[1].textContent);
                    break;
                case "double_sided":
                    technique.double_sided = (parseFloat(child.textContent)) > 0;
                    break;
                default:
                    if (profile === "COMMON") {
                        context.reportUnexpectedChild(child);
                    }
            }
        });
    }

    /**
    *   Parses a <technique>/<extra> element.
    */
    static parseExtra(node: Node, technique: ColladaEffectTechnique, context: ColladaParsingContext) {
        if (technique == null) {
            context.log.write("Ignored element <extra>, because there is no <technique>.", LogLevel.Warning);
            return;
        }

        Utils.forEachChild(node, function (child: Node) {
            switch (child.nodeName) {
                case "technique":
                    var profile: string = context.getAttributeAsString(child, "profile", null, true);
                    ColladaEffectTechnique.parseParam(child, technique, profile, context);
                    break;
                default:
                    context.reportUnexpectedChild(child);
            }
        });
    }
}