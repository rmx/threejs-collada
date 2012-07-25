#==============================================================================
# COLLADA file loader for three.js
#
# [1] https://github.com/mrdoob/three.js/
# [2] http://www.khronos.org/files/collada_spec_1_4.pdf
# [3] http://www.khronos.org/files/collada_spec_1_5.pdf
#
# Limitations by design:
# - Only supports triangle primitives
#==============================================================================



#==============================================================================
# COLLADA URL addressing
#   See chapter 3, section "Adress Syntax"
#   Uses XML ids that are unique within the whole document.
#   Hyperlinks to ids start with a hash.
#   <element id="xyz">
#   <element source="#xyz">
#==============================================================================
class ColladaUrlLink

    constructor : (url) ->
        @url = url.replace /^#/, ""
        @object = null

#==============================================================================
# COLLADA FX parameter addressing
#   See chapter 7, section "About Parameters"
#   Uses scoped ids that are unique within the given scope.
#   If the target is not defined within the same scope,
#   the search continues in the parent scope
#   <element sid="xyz">
#   <element texture="xyz">
#==============================================================================
class ColladaFxLink

    constructor : (url, scope) ->
        @url = url
        @scope = scope
        @object = null

#==============================================================================
# COLLADA SID addressing
#   See chapter 3, section "Adress Syntax"
#   Uses scoped ids that are unique within the parent element.
#   Adresses are anchored at a globally unique id and have a path of scoped ids.
#   <elementA id="xyz"><elementB sid="abc"></elementB></elementA>
#   <element target="xyz/abc">
#==============================================================================
class ColladaSidLink

    constructor : (parentId, url) ->
        @url = url
        @object = null
        @id = null
        @sids = []
        @member = null
        @indices = null
        @dotSyntax = false
        @arrSyntax = false

        parts = url.split "/"

        # Part 1: element id
        @id = parts.shift()
        if @id is "." then @id = parentId
        
        # Part 2: list of sids
        while parts.length > 1
            @sids.push parts.shift()

        # Part 3: last sid
        if parts.length > 0
            lastSid = parts[0]
            dotSyntax = lastSid.indexOf(".") >= 0
            arrSyntax = astSid.indexOf("(") >= 0
            if dotSyntax
                parts = sid.split "."
                @sids.push parts.shift()
                @member = parts.shift()
                @dotSyntax = true
            else if arrSyntax
                arrIndices = lastSid.split "("
                @sids.push arrIndices.shift()
                @indices = []
                @indices.push parseInt(index.replace(/\)/, ""), 10) for index in arrIndices
                @arrSyntax = true
            else
                @sids.push lastSid

#==============================================================================
#   ColladaFile
#==============================================================================
class ColladaFile

#   Creates a new, empty collada file
#
#>  constructor :: () ->
    constructor : () ->
        @url = null
        @baseUrl = null

        @dae = {}
        @dae.ids = {}
        @dae.libEffects = {}
        @dae.libMaterials = {}
        @dae.libGeometries = {}
        @dae.libControllers = {}
        @dae.libLights = {}
        @dae.libImages = {}
        @dae.libVisualScenes = {}
        @dae.libAnimations = {}
        @dae.asset = null
        @dae.scene = null

        @threejs = {}
        @threejs.scene = null
        @threejs.images = []
        @threejs.geometries = []
        @threejs.materials = []

#   Sets the file URL
#
#>  setUrl :: (String) ->
    setUrl : (url) ->
        if url?
            @url = url
            parts = url.split "/" 
            parts.pop()
            @baseUrl = ( parts.length < 1 ? "." : parts.join "/" ) + "/"
        else
            @url = ""
            @baseUrl = ""
        return

#==============================================================================
#   ColladaAsset
#==============================================================================
class ColladaAsset

#   Creates a new, empty collada asset
#
#>  constructor :: () ->
    constructor : () ->
        @unit = 1
        @upAxis = "Z"

#==============================================================================
#   ColladaVisualScene
#==============================================================================
class ColladaVisualScene

#   Creates a new, empty collada scene
#
#>  constructor :: () ->
    constructor : () ->
        @id = null
        @children = []
        @sidChildren = []

#==============================================================================
#   ColladaVisualSceneNode
#==============================================================================
class ColladaVisualSceneNode

#   Creates a new, empty collada scene node
#
#>  constructor :: () ->
    constructor : () ->
        @id = null
        @sid  = null
        @name = null
        @type = null
        @layer = null
        @children = []
        @sidChildren = []
        @transformations = []
        @geometries = []

#==============================================================================
#   ColladaNodeTransform
#==============================================================================
class ColladaNodeTransform

#   Creates a new, empty collada scene node transformation
#
#>  constructor :: () ->
    constructor : () ->
        @sid = null
        @type = null
        @matrix = null
        @vector = null
        @number = null

#==============================================================================
#   ColladaInstanceGeometry
#==============================================================================
class ColladaInstanceGeometry

#   Creates a new, empty collada geometry instance
#
#>  constructor :: () ->
    constructor : () ->
        @geometry = null
        @materials = []
        
#==============================================================================
#   ColladaImage
#==============================================================================
class ColladaInstanceMaterial

#   Creates a new, empty collada material instance
#
#>  constructor :: () ->
    constructor : () ->
        @sid = null
        @symbol = null
        @material = null
        @name = null
        @vertexInputs = {}
        @params = {}

#==============================================================================
#   ColladaImage
#==============================================================================
class ColladaImage

#   Creates a new, empty collada image
#
#>  constructor :: () ->
    constructor : () ->
        @id = null
        @initFrom = null

#==============================================================================
#   ColladaEffect
#==============================================================================
class ColladaEffect

#   Creates a new, empty collada effect
#
#>  constructor :: () ->
    constructor : () ->
        @id = null
        @sids = {}
        @technique = new ColladaEffectTechnique()
        @technique.parentFxScope = @

#==============================================================================
#   ColladaEffectTechnique
#==============================================================================
class ColladaEffectTechnique

#   Creates a new, empty collada effect technique
#
#>  constructor :: () ->
    constructor : () ->
        @sids = {}
        @parentFxScope = null
        # Shading type (phong, blinn, ...)
        @shading = null
        # Color channels
        @emission = null
        @ambient = null
        @diffuse = null
        @specular = null
        @shininess = null
        @reflective = null
        @transparent = null
        @bump = null
        # Float parameters
        @reflectivity = null
        @transparency = null
        @index_of_refraction = null

#==============================================================================
#   ColladaEffectSurface
#==============================================================================
class ColladaEffectSurface

#   Creates a new, empty collada effect surface
#
#>  constructor :: () ->
    constructor : () ->
        @sid = null
        @type = null
        @initFrom = null

#==============================================================================
#   ColladaEffectSampler
#==============================================================================
class ColladaEffectSampler

#   Creates a new, empty collada effect sampler
#
#>  constructor :: () ->
    constructor : () ->
        @sid = null
        @surface = null
        @image = null

#==============================================================================
#   ColladaColorOrTexture
#==============================================================================
class ColladaColorOrTexture

#   Creates a new, empty collada color/texture
#
#>  constructor :: () ->
    constructor : () ->
        @color = null
        @textureSampler = null
        @texcoord = null
        @opaque = null
        @bumptype = null

#==============================================================================
#   ColladaMaterial
#==============================================================================
class ColladaMaterial

#   Creates a new, empty collada material
#
#>  constructor :: () ->
    constructor : () ->
        @id = null
        @name = null
        @effect = null

#==============================================================================
#   ColladaGeometry
#==============================================================================
class ColladaGeometry

#   Creates a new, empty collada geometry
#
#>  constructor :: () ->
    constructor : () ->
        @id = null
        @name = null
        @sources = {}
        @vertices = {}
        @triangles = []

#==============================================================================
#   ColladaSource
#==============================================================================
class ColladaSource

#   Creates a new, empty collada source
#
#>  constructor :: () ->
    constructor : () ->
        @id = null
        @name = null
        @sourceId = null
        @count = null
        @stride = null
        @data = null
        @params = {}

#==============================================================================
#   ColladaVertices
#==============================================================================
class ColladaVertices

#   Creates a new, empty collada vertices
#
#>  constructor :: () ->
    constructor : () ->
        @id = null
        @name = null
        @inputs = []

#==============================================================================
#   ColladaTriangles
#==============================================================================
class ColladaTriangles

#   Creates a new, empty collada vertices
#
#>  constructor :: () ->
    constructor : () ->
        @name = null
        @count = null
        @material = null
        @inputs = []
        @indices = null

#==============================================================================
#   ColladaInput
#==============================================================================
class ColladaInput

#   Creates a new, empty collada input
#
#>  constructor :: () ->
    constructor : () ->
        @semantic = null
        @source = null
        @offset = null
        @set = null

#==============================================================================
#   ThreejsMaterialMap
#==============================================================================
class ThreejsMaterialMap

#   Creates a new, empty three.js material map
#
#>  constructor :: () ->
    constructor : () ->

#==============================================================================
#   ColladaLoader
#==============================================================================
class ColladaLoader2

    @messageTrace   = 0
    @messageInfo    = 1
    @messageWarning = 2
    @messageError   = 3
    @messageTypes   = [ "TRACE", "INFO", "WARNING", "ERROR" ]

#   Creates a new collada loader.
#
#>  constructor :: () -> THREE.ColladaLoader2
    constructor : ->
        @log = @logConsole
        @readyCallback = null
        @progressCallback = null
        @file = null
        @upConversion = null
        @TO_RADIANS = Math.PI / 180.0
        @imageCache = {}
        @options = {
            # Force Geometry to always be centered at the local origin of the
            # containing Mesh.
            centerGeometry: false,

            # Axis conversion is done for geometries, animations, and controllers.
            # If we ever pull cameras or lights out of the COLLADA file, they'll
            # need extra work.
            convertUpAxis: false,

            subdivideFaces: true,

            upAxis: "Y",

            useLocalTextureLoading: true
        }

#   Default log message callback.
#
#>  logConsole :: (String, Number) ->
    @logConsole : (msg, type) ->
        console.log "ColladaLoader2 " + ColladaLoader2.messageTypes[type] + ": " + msg;
        return

#   Sets a new callback for log messages.
#
#>  setLog :: (Function) ->
    setLog : (logCallback) ->
        @log = logCallback or @logConsole
        return

#   Loads a collada file from a URL.
#
#>  load :: (String, Function, Function) -> THREE.ColladaFile
    load : (url, readyCallback, progressCallback) ->
        @readyCallback = readyCallback
        length = 0
        if document.implementation and document.implementation.createDocument
            req = new XMLHttpRequest()
            req.overrideMimeType? "text/xml"

            req.onreadystatechange = () =>
                if req.readyState is 4
                    if req.status is 0 or req.status is 200
                        if req.responseXML
                            @parse req.responseXML, readyCallback, url
                        else
                            @log "Empty or non-existing file #{url}.", ColladaLoader2.messageError
                else if req.readyState is 3
                    if progressCallback 
                        if length is 0
                            length = req.getResponseHeader "Content-Length"
                        progressCallback { total: length, loaded: req.responseText.length }

            req.open "GET", url, true
            req.send null
            return
        else
            @log "Don't know how to parse XML!", ColladaLoader2.messageError
            return

#   Parses a COLLADA XML document.
#
#>  parse :: (XMLDocument, Function, String) -> THREE.ColladaFile
    parse : (doc, readyCallback, url) ->
        @readyCallback = readyCallback

        # Create an empty collada file
        @file = new ColladaFile
        @file.setUrl url

        # Step 1: Parse the XML
        @_parseXml doc

        # Step 2: Create three.js objects
        @_createSceneGraph()

        # Return the finished collada file
        result = @file
        @file = null

        if @readyCallback
            @readyCallback result

        return result

#==============================================================================
#   ColladaLoader private methods: parsing XML elements into Javascript objects
#==============================================================================

#   Report an unexpected child element
#
#>  _reportUnexpectedChild :: (String, String) ->
    _reportUnexpectedChild : (parent, child) ->
        @log "Skipped unknown <#{parent}> child <#{child}>.", ColladaLoader2.messageWarning
        return

#   Parses the COLLADA XML document
#
#>  _parseXml :: (XMLDocument) ->
    _parseXml : (doc) ->
        if doc.childNodes[0]?.nodeName?.toUpperCase() is "COLLADA"
            colladaElement = doc.childNodes[0]
            @_parseColladaChild child for child in colladaElement.childNodes when child.nodeType is 1
        else
            @log "Can not parse document, top level element is not <COLLADA>.", ColladaLoader2.messageError
        return

#   Parses a <collada> element child.
#
#>  _parseColladaChild :: (XMLElement) ->
    _parseColladaChild : (el) ->
        switch el.nodeName
            when "asset"                 then @_parseAssetChild          child for child in el.childNodes when child.nodeType is 1
            when "scene"                 then @_parseSceneChild          child for child in el.childNodes when child.nodeType is 1
            when "library_effects"       then @_parseLibEffectChild      child for child in el.childNodes when child.nodeType is 1
            when "library_materials"     then @_parseLibMaterialChild    child for child in el.childNodes when child.nodeType is 1
            when "library_geometries"    then @_parseLibGeometryChild    child for child in el.childNodes when child.nodeType is 1
            when "library_images"        then @_parseLibImageChild       child for child in el.childNodes when child.nodeType is 1
            when "library_visual_scenes" then @_parseLibVisualSceneChild child for child in el.childNodes when child.nodeType is 1
            else @_reportUnexpectedChild "COLLADA", el.nodeName
        return

#   Parses an <asset> element child.
#
#>  _parseAssetChild :: (XMLElement) ->
    _parseAssetChild : (el) ->
        if not @file.dae.asset then @file.dae.asset = new ColladaAsset()
        switch el.nodeName
            when "unit"
                meter = el.getAttribute "meter"
                if meter? then @file.dae.asset.unit = parseFloat meter
            when "up_axis"
                @file.dae.asset.upAxis = el.textContent.toUpperCase().charAt(0)
                @_setUpConversion @file.dae.asset.upAxis, @options.upAxis
            when "contributor", "created", "modified"
                # Known elements that can be safely ignored
            else @_reportUnexpectedChild "asset", el.nodeName
        return

#   Parses an <scene> element child.
#
#>  _parseSceneChild :: (XMLElement) ->
    _parseSceneChild : (el) ->
        switch el.nodeName
            when "instance_visual_scene" then @file.dae.scene = new ColladaUrlLink el.getAttribute("url")
            else @_reportUnexpectedChild "scene", el.nodeName
        return

#   Parses an <library_visual_scenes> element child.
#
#>  _parseLibVisualSceneChild :: (XMLElement) ->
    _parseLibVisualSceneChild : (el) ->
        switch el.nodeName
            when "visual_scene"
                scene = new ColladaVisualScene
                scene.id = el.getAttribute "id"
                @_addUrlTarget scene, @file.dae.libVisualScenes
                @_parseVisualSceneChild(scene, child) for child in el.childNodes when child.nodeType is 1
            else @_reportUnexpectedChild "library_visual_scenes", el.nodeName
        return

#   Parses an <visual_scene> element child.
#
#>  _parseVisualSceneChild :: (ColladaScene, XMLElement) ->
    _parseVisualSceneChild : (scene, el) ->
        switch el.nodeName
            when "node"
                @_parseSceneNode scene, el
            else @_reportUnexpectedChild "visual_scene", el.nodeName
        return

#   Parses an <node> element.
#
#>  _parseSceneNode :: (ColladaVisualScene|ColladaVisualSceneNode, XMLElement) ->    
    _parseSceneNode : (parent, el) ->
        node = new ColladaVisualSceneNode
        node.id    = el.getAttribute "id"
        node.sid   = el.getAttribute "sid"
        node.name  = el.getAttribute "name"
        node.type  = el.getAttribute "type"
        node.layer = el.getAttribute "layer"
        parent.children.push node
        @_addUrlTarget node if node.id?
        @_addSidTarget node, parent
        @_parseSceneNodeChild(node, child) for child in el.childNodes when child.nodeType is 1
        return

#   Parses an <node> element child.
#
#>  _parseSceneNodeChild :: (ColladaVisualSceneNode, XMLElement) -> 
    _parseSceneNodeChild : (node, el) ->
        switch el.nodeName
            # when "instance_light"
            # when "instance_controller"
            when "instance_geometry"
                @_parseInstanceGeometry node, el
            when "matrix", "rotate", "translate", "scale"
                @_parseTransformElement node, el
            when "node"
                @_parseSceneNode node, el
            else @_reportUnexpectedChild "node", el.nodeName
        return

#   Parses an <instance_geometry> element.
#
#>  _parseInstanceGeometry :: (ColladaVisualSceneNode, XMLElement) -> 
    _parseInstanceGeometry : (node, el) ->
        geometry = new ColladaInstanceGeometry()
        geometry.geometry = new ColladaUrlLink el.getAttribute("url")
        node.geometries.push geometry
        @_parseInstanceGeometryChild(node, geometry, child) for child in el.childNodes when child.nodeType is 1
        return

#   Parses an <instance_geometry> element child.
#
#>  _parseInstanceGeometryChild :: (ColladaVisualSceneNode, ColladaInstanceGeometry, XMLElement) -> 
    _parseInstanceGeometryChild : (node, geometry, el) ->
        switch el.nodeName
            when "bind_material"
                material = new ColladaInstanceMaterial
                geometry.materials.push material
                @_addSidTarget material, node
                @_parseBindMaterialChild(material, child) for child in el.childNodes when child.nodeType is 1
            else @_reportUnexpectedChild "instance_geometry", el.nodeName
        return

#   Parses an <bind_material> element child.
#
#>  _parseBindMaterialChild :: (ColladaBindMaterial, XMLElement) -> 
    _parseBindMaterialChild : (material, el) ->
        switch el.nodeName
            when "technique_common"
                @_parseBindMaterialChild(material, child) for child in el.childNodes when child.nodeType is 1
            when "instance_material"  
                material.symbol   = el.getAttribute "symbol"
                material.material = new ColladaUrlLink el.getAttribute("target")
                @_parseInstanceMaterialChild(material, child) for child in el.childNodes when child.nodeType is 1
            else @_reportUnexpectedChild "bind_material", el.nodeName
        return

#   Parses an <instance_material> element child.
#
#>  _parseInstanceMaterialChild :: (ColladaBindMaterial, XMLElement) -> 
    _parseInstanceMaterialChild : (material, el) ->
        switch el.nodeName
            when "bind_vertex_input"
                semantic      = el.getAttribute "semantic"
                inputSemantic = el.getAttribute "input_semantic"
                inputSet      = el.getAttribute "input_set"
                if inputSet? then inputSet = parseInt inputSet
                material.vertexInputs[semantic] = {inputSemantic:inputSemantic, inputSet:inputSet}
            when "bind"
                semantic = el.getAttribute "semantic"
                target   = new ColladaSidLink el.getAttribute("target")
                material.params[semantic] = {target:target}
            else @_reportUnexpectedChild "instance_material", el.nodeName
        return

#   Parses a transformation element.
#
#>  _parseTransformElement :: (ColladaVisualSceneNode, XMLElement) -> 
    _parseTransformElement : (parent, el) ->
        transform = new ColladaNodeTransform
        transform.sid  = el.getAttribute "sid"
        transform.type = el.nodeName
        parent.transformations.push transform
        @_addSidTarget transform, parent
        
        data = @_strToFloats el.textContent
        switch el.nodeName
            when "matrix"
                transform.matrix = @_floatsToMatrix4 data
            when "rotate"
                transform.number = data[3] * @TO_RADIANS
                transform.vector = @_floatsToVector3 data, 0, -1
            when "translate"
                transform.vector = @_floatsToVector3 data, 0, -1
            when "scale"
                transform.vector = @_floatsToVector3 data, 0, +1
            else @log "Unknown transformation type #{el.nodeName}.", ColladaLoader2.messageError
        return

#   Parses an <library_effects> element child.
#
#>  _parseLibEffectChild :: (XMLElement) ->
    _parseLibEffectChild : (el) ->
        switch el.nodeName
            when "effect"
                effect = new ColladaEffect
                effect.id = el.getAttribute "id"
                @_addUrlTarget effect, @file.dae.libEffects
                @_parseEffectChild(effect, child) for child in el.childNodes when child.nodeType is 1
            else
                @_reportUnexpectedChild "library_effects", el.nodeName
        return

#   Parses an <effect> element child.
#
#>  _parseEffectChild :: (XMLElement) ->
    _parseEffectChild : (effect, el) ->
        switch el.nodeName
            when "profile_COMMON"
                @_parseEffectProfileCommonChild(effect, child) for child in el.childNodes when child.nodeType is 1
            when "profile"
                @log "Skipped non-common effect profile for effect #{effect.id}.", ColladaLoader2.messageWarning
            else
                @_reportUnexpectedChild "effect", el.nodeName
        return

#   Parses an <effect>/<profile_COMMON> element child.
#
#>  _parseEffectProfileCommonChild :: (ColladaEffect, XMLElement) ->
    _parseEffectProfileCommonChild : (effect, el) ->
        sid = el.getAttribute "sid"
        switch el.nodeName
            when "newparam"
                @_parseEffectNewparamChild(effect, sid, child) for child in el.childNodes when child.nodeType is 1
            when "technique"
                @_parseEffectTechniqueChild(effect, sid, child) for child in el.childNodes when child.nodeType is 1
            else
                @_reportUnexpectedChild "profile_COMMON", el.nodeName
        return

#   Parses an <newparam> child element.
#
#>  _parseEffectNewparamChild :: (ColladaEffect|ColladaTechnique, String, XMLElement) ->
    _parseEffectNewparamChild : (scope, sid, el) ->
        switch el.nodeName
            when "surface"
                surface = new ColladaEffectSurface
                surface.type = el.getAttribute "type"
                surface.sid = sid
                @_addFxTarget surface, scope
                @_parseEffectSurfaceChild(scope, surface, sid, child) for child in el.childNodes when child.nodeType is 1
            when "sampler2D"
                sampler = new ColladaEffectSampler
                sampler.sid = sid
                @_addFxTarget sampler, scope
                @_parseEffectSamplerChild(scope, sampler, sid, child) for child in el.childNodes when child.nodeType is 1
            else @_reportUnexpectedChild "newparam", el.nodeName
        return  

#   Parses a <surface> child element.
#
#>  _parseEffectSurfaceChild :: (ColladaEffect|ColladaTechnique, ColladaEffectSurface, String, XMLElement) ->
    _parseEffectSurfaceChild : (scope, surface, sid, el) ->
        switch el.nodeName
            when "init_from" then surface.initFrom = new ColladaUrlLink el.textContent
            else @_reportUnexpectedChild "surface", el.nodeName
        return

#   Parses an <newparam><sampler> child element.
#
#>  _parseEffectSamplerChild :: (ColladaEffect|ColladaTechnique, ColladaEffectSampler, String, XMLElement) ->
    _parseEffectSamplerChild : (scope, sampler, sid, el) ->
        switch el.nodeName
            when "source"         then sampler.surface     = new ColladaFxLink el.textContent, scope
            when "instance_image" then sampler.image       = new ColladaUrlLink el.getAttribute("url")
            else @_reportUnexpectedChild "sampler*", el.nodeName
        return

#   Parses an <technique> child element.
#
#>  _parseEffectTechniqueChild :: (ColladaEffect, String, XMLElement) ->
    _parseEffectTechniqueChild : (effect, sid, el) ->
        switch el.nodeName
            when "blinn", "phong", "lambert", "constant"
                effect.technique.shading = el.nodeName
                @_parseTechniqueParam(effect.technique, "", child) for child in el.childNodes when child.nodeType is 1
            when "extra"
                @_parseTechniqueExtraChild(effect.technique, "", child) for child in el.childNodes when child.nodeType is 1
            else @_reportUnexpectedChild "technique", el.nodeName
        return

#   Parses an <technique>/<blinn|phong|lambert|constant> child element.
#
#>  _parseTechniqueParam :: (ColladaTechnique, String, XMLElement) ->
    _parseTechniqueParam : (technique, profile, el) ->
        firstChild = el.childNodes[1]
        switch el.nodeName
            when "newparam"
                @_parseEffectNewparamChild(technique, sid, child) for child in el.childNodes when child.nodeType is 1
            when "emission", "ambient", "diffuse", "specular", "reflective"
                @_parseEffectColorOrTexture technique, el.nodeName, firstChild
            when "shininess", "reflectivity", "transparency", "index_of_refraction"
                technique[el.nodeName] = parseFloat firstChild.textContent
            when "transparent"
                @_parseEffectColorOrTexture technique, "transparent", firstChild
                technique.transparent.opaque = el.getAttribute "opaque"
            when "bump"
                # OpenCOLLADA extension: bump mapping
                @_parseEffectColorOrTexture technique, "bump", firstChild
                technique.bump.bumptype = el.getAttribute "bumptype"
            else @log "Skipped unknown technique shading property #{el.nodeName}.", ColladaLoader2.messageInfo
        return
        
#   Parses an <technique>/<extra> child element.
#
#>  _parseTechniqueExtraChild :: (ColladaEffect, String, XMLElement) ->
    _parseTechniqueExtraChild : (technique, profile, el) ->
        switch el.nodeName
            when "technique"
                profile = el.getAttribute "profile"
                @_parseTechniqueParam technique, profile, child for child in el.childNodes when child.nodeType is 1
            else @_reportUnexpectedChild "technique/extra", el.nodeName
        return

#   Parses an color or texture element.
#
#>  _parseEffectColorOrTexture :: (ColladaTechnique, String, XMLElement) ->
    _parseEffectColorOrTexture : (technique, name, el) ->
        colorOrTexture = technique[name]
        if not colorOrTexture?
            colorOrTexture = new ColladaColorOrTexture()
            technique[name] = colorOrTexture
        switch el.nodeName
            when "color"
                rgba = @_strToFloats el.textContent
                colorOrTexture.color = new THREE.Color
                colorOrTexture.color.setRGB rgba[0], rgba[1], rgba[2]
                colorOrTexture.color.a = rgba[3]
            when "texture"
                colorOrTexture.textureSampler = new ColladaFxLink el.getAttribute("texture"), technique
                colorOrTexture.texcoord = el.getAttribute "texcoord"
            else @_reportUnexpectedChild "_color_or_texture_type", el.nodeName
        return

#   Parses a <lib_materials> child element.
#
#>  _parseLibMaterialChild :: (XMLElement) ->
    _parseLibMaterialChild : (el) ->
        switch el.nodeName
            when "material"
                material = new ColladaMaterial
                material.id   = el.getAttribute "id"
                material.name = el.getAttribute "name"
                @_addUrlTarget material, @file.dae.libMaterials
                @_parseMaterialChild(material, child) for child in el.childNodes when child.nodeType is 1
            else
                @_reportUnexpectedChild "library_materials", el.nodeName
        return

#   Parses a <material> element child.
#
#>  _parseMaterialChild :: (ColladaMaterial, XMLElement) ->
    _parseMaterialChild : (material, el) ->
        switch el.nodeName
            when "instance_effect" then material.effect = new ColladaUrlLink el.getAttribute("url")
            else @_reportUnexpectedChild "material", el.nodeName
        return

#   Parses a <library_geometries> element child.
#
#>  _parseLibGeometryChild :: (XMLElement) ->
    _parseLibGeometryChild : (el) ->
        switch el.nodeName
            when "geometry"
                geometry = new ColladaGeometry()
                geometry.id   = el.getAttribute "id"
                geometry.name = el.getAttribute "name"
                @_addUrlTarget geometry, @file.dae.libGeometries
                @_parseGeometryChild(geometry, child) for child in el.childNodes when child.nodeType is 1
            else @_reportUnexpectedChild "library_geometries", el.nodeName
        return

#   Parses a <geometry> element child.
#
#>  _parseGeometryChild :: (ColladaGeometry, XMLElement) ->
    _parseGeometryChild : (geometry, el) ->
        switch el.nodeName
            # other geometry types like "spline" or "convex_mesh" are ignored
            when "mesh" then @_parseMeshChild(geometry, child) for child in el.childNodes when child.nodeType is 1
            else @_reportUnexpectedChild "library_geometries", el.nodeName
        return
        
#   Parses a <mesh> element child.
#
#>  _parseMeshChild :: (ColladaGeometry, XMLElement) ->
    _parseMeshChild : (geometry, el) ->
        switch el.nodeName
            when "source"    then @_parseSource    geometry, el
            when "vertices"  then @_parseVertices  geometry, el
            when "triangles" then @_parseTriangles geometry, el
            when "polygons", "polylist", "lines", "linestrips", "trifans", "tristrips"
                @log "Geometry primitive type #{el.nodeName} not supported.", ColladaLoader2.messageError
            else @_reportUnexpectedChild "library_geometries", el.nodeName
        return

#   Parses a <source> element.
#
#>  _parseSource :: (XMLElement) ->
    _parseSource : (geometry, el) ->
        source = new ColladaSource
        source.id   = el.getAttribute "id"
        source.name = el.getAttribute "name"
        @_addUrlTarget source, geometry.sources
        @_parseSourceChild(source, child) for child in el.childNodes when child.nodeType is 1
        return source

#   Parses a <vertices> element.
#
#>  _parseVertices :: (XMLElement) ->
    _parseVertices : (geometry, el) ->
        vertices = new ColladaVertices
        vertices.id   = el.getAttribute "id"
        vertices.name = el.getAttribute "name"
        @_addUrlTarget vertices, geometry.vertices
        @_parseVerticesChild(vertices, child) for child in el.childNodes when child.nodeType is 1
        return vertices

#   Parses a <triangles> element.
#
#>  _parseTriangles :: (XMLElement) ->
    _parseTriangles : (geometry, el) ->
        triangles = new ColladaTriangles
        triangles.name = el.getAttribute "name"
        triangles.material = el.getAttribute "material"
        count = el.getAttribute "count"
        if count? then triangles.count = parseInt count, 10
        geometry.triangles.push triangles
        @_parseTrianglesChild(triangles, child) for child in el.childNodes when child.nodeType is 1
        return triangles

#   Parses a <source> element child.
#
#>  _parseSourceChild :: (ColladaSource, XMLElement) ->
    _parseSourceChild : (source, el) ->
        switch el.nodeName
            when "bool_array" 
                source.sourceId = el.getAttribute "id"
                source.data = @_strToBools el.textContent
            when "float_array"
                source.sourceId = el.getAttribute "id"
                source.data = @_strToFloats el.textContent
            when "int_array"
                source.sourceId = el.getAttribute "id"
                source.data = @_strToInts el.textContent
            when "IDREF_array", "Name_array"
                source.sourceId = el.getAttribute "id"
                source.data = @_strToStrings el.textContent
            when "technique_common"
                @_parseSourceTechniqueCommonChild(source, child) for child in el.childNodes when child.nodeType is 1
            else @_reportUnexpectedChild "source", el.nodeName
        return

#   Parses a <source>/<technique_common> element child.
#
#>  _parseSourceTechniqueCommonChild :: (ColladaSource, XMLElement) ->
    _parseSourceTechniqueCommonChild : (source, el) ->
        switch el.nodeName
            when "accessor"
                sourceId = el.getAttribute "source"
                source.count  = el.getAttribute "count"
                source.stride = el.getAttribute "stride"
                if sourceId isnt "#"+source.sourceId
                    @log "Non-local sources not supported, source data will be empty", ColladaLoader2.messageError
                @_parseTechniqueAccessorChild(source, child) for child in el.childNodes when child.nodeType is 1
            else @_reportUnexpectedChild "library_geometries", el.nodeName
        return
        
#   Parses a <accessor> element child.
#
#>  _parseTechniqueAccessorChild :: (ColladaSource, XMLElement) ->
    _parseTechniqueAccessorChild : (source, el) ->
        switch el.nodeName
            when "param"
                name = el.getAttribute "name"
                type = el.getAttribute "type"
                source.params[name] = type
            else @_reportUnexpectedChild "accessor", el.nodeName
        return
        
#   Creates a ColladaInput object from an <input> element.
#
#>  _parseInput :: (XMLElement) -> ColladaInput
    _parseInput : (el) ->
        input = new ColladaInput
        input.semantic = el.getAttribute "semantic"
        input.source   = new ColladaUrlLink el.getAttribute "source"
        offset = el.getAttribute "offset"
        if offset? then input.offset = parseInt offset, 10
        set = el.getAttribute "set"
        if set? then input.set = parseInt set, 10
        return input

#   Parses a <vertices> element child.
#
#>  _parseVerticesChild :: (ColladaVertices, XMLElement) ->
    _parseVerticesChild : (vertices, el) ->
        switch el.nodeName
            when "input"
                vertices.inputs.push @_parseInput el
            else @_reportUnexpectedChild "vertices", el.nodeName
        return
        
#   Parses a <triangles> element child.
#
#>  _parseTrianglesChild :: (ColladaTriangles, XMLElement) ->
    _parseTrianglesChild : (triangles, el) ->
        switch el.nodeName
            when "input"
                triangles.inputs.push @_parseInput el
            when "p"
                triangles.indices = @_strToInts el.textContent
            else @_reportUnexpectedChild "triangles", el.nodeName
        return

    
#   Parses an <library_images> element child.
#
#>  _parseLibImageChild :: (XMLElement) ->
    _parseLibImageChild : (el) ->
        switch el.nodeName
            when "image"
                image = new ColladaImage
                image.id = el.getAttribute "id"
                @_addUrlTarget image, @file.dae.libImages
                @_parseImageChild image, child for child in el.childNodes when child.nodeType is 1
            else
                @_reportUnexpectedChild "library_images", el.nodeName
        return

#   Parses an <image> element child.
#
#>  _parseImageChild :: (ColladaImage, XMLElement) ->
    _parseImageChild : (image, el) ->
        switch el.nodeName
            when "init_from" then image.initFrom = el.textContent
            else @_reportUnexpectedChild "image", el.nodeName
        return

#==============================================================================
#   ColladaLoader private methods: hyperlink management
#==============================================================================

#   Inserts a new URL link target
#
#>  _addUrlTarget :: (ColladaObject, String) ->
    _addUrlTarget : (object, lib) ->
        id = object.id
        if not id?
            @log "Object has no ID.", ColladaLoader2.messageError
            return
        if @file.dae.ids[id]?
            @log "There is already an object with ID #{id}.", ColladaLoader2.messageError
            return
        @file.dae.ids[id] = object
        if lib? then lib[id] = object
        return

#   Resolves a URL link
#
#>  _resolveUrlLink :: (ColladaUrlLink) -> Boolean
    _resolveUrlLink : (link) ->
        link.object = @file.dae.ids[link.url]
        if not link.object?
            @log "Could not resolve URL ##{link.url}", ColladaLoader2.messageError
            return false
        return true

#   Inserts a new FX link target
#
#>  _addFxTarget :: (ColladaObject, ColladaObject) ->
    _addFxTarget : (object, scope) ->
        sid = object.sid
        if not sid?
            @log "Cannot add a FX target: object has no SID.", ColladaLoader2.messageError
            return
        if scope.sids[sid]?
            @log "There is already an FX target with SID #{sid}.", ColladaLoader2.messageError
            return
        scope.sids[sid] = object
        return

#   Resolves an FX link
#
#>  _resolveFxLink :: (ColladaFxLink) -> Boolean
    _resolveFxLink : (link) ->
        scope = link.scope

        link.object = scope.sids[link.url]
        while not link.object? and scope?
            scope = scope.parentFxScope
            link.object = scope.sids[link.url]

        if not link.object?
            log "Could not resolve FX parameter ##{link.url}", ColladaLoader2.messageError
            return false
        return true

#   Inserts a new SID link target
#
#>  _addSidTarget :: (ColladaObject, ColladaObject) ->
    _addSidTarget : (object, parent) ->
        if not parent.sidChildren? then parent.sidChildren = []
        parent.sidChildren.push object
        return

#   Resolves an SID link
#
#>  _resolveSidLink :: (ColladaSidLink) -> Boolean
    _resolveSidLink : (link) ->
        # Step 1: Find the base URL target
        baseObject = @file.dae.ids[link.id]
        if not baseObject?
            log "Could not resolve SID ##{link.url}, missing base ID #{link.id}", ColladaLoader2.messageError
            return false

        # Step 2: For each element in the SID path, perform a breadth-first search
        parentObject = baseObject
        childObject = null
        for sid in link.sids
            queue = [parentObject]
            while queue.length isnt 0
                front = queue.shift()
                if front.sid is sid
                    childObject = front
                    break
                queue.push sidChild for sidChild in front.sidChildren
            if not childObject?
                log "Could not resolve SID ##{link.url}, missing SID part #{sid}", ColladaLoader2.messageError
                return false
            parentObject = childObject
        link.object = childObject
        
        # Step 3: Resolve member and array access
        # TODO

        return true

#   Returns the link target
#
#>  _getLinkTarget :: (ColladaUrlLink|ColladaFxLink|ColladaSidLink, Type) ->
    _getLinkTarget : (link, type) ->
        if not link? then return null
        if not link.object?
            if link instanceof ColladaUrlLink then @_resolveUrlLink link
            if link instanceof ColladaSidLink then @_resolveSidLink link
            if link instanceof ColladaFxLink  then @_resolveFxLink  link
        if type? and link.object? and not (link.object instanceof type)
            @log "Link #{link.url} does not link to a #{type.name}", ColladaLoader2.messageError
        return link.object

#==============================================================================
#   ColladaLoader private methods: parsing vector data
#==============================================================================

#   Splits a string into whitespace-separated strings
#
#>  _strToStrings :: (String) -> [String]
    _strToStrings : (str) ->
        if str.length > 0
            trimmed = str.trim()
            trimmed.split( /\s+/ )
        else
            []

#   Parses a string of whitespace-separated float numbers
#
#>  _strToFloats :: (String) -> [Number]
    _strToFloats : (str) ->
        strings = @_strToStrings str
        data = new Array(strings.length)
        data[i] = parseFloat(string) for string, i in strings
        return data

#   Parses a string of whitespace-separated int numbers
#
#>  _strToInts :: (String) -> [Number]
    _strToInts : (str) ->
        strings = @_strToStrings str
        data = new Array(strings.length)
        data[i] = parseInt(string, 10) for string, i in strings
        return data

#   Parses a string of whitespace-separated boolean values
#
#>  _strToBools :: (String) -> [Boolean]
    _strToBools : (str) ->
        strings = @_strToStrings str
        data = new Array(strings.length)
        data[i] = ( string is "true" or string is "1" ? true : false ) for string, i in strings
        return data

#   Converts an array of floats to a 4D matrix
#   Also applies the up vector conversion
#
#>  _floatsToMatrix4 :: ([Number]) -> THREE.Matrix4
    _floatsToMatrix4 : (data) ->
        if @options.convertUpAxis
            # First fix rotation and scale

            # Columns first
            arr = [ data[ 0 ], data[ 4 ], data[ 8 ] ]
            @_applyUpConversion arr, -1
            data[ 0 ] = arr[ 0 ]
            data[ 4 ] = arr[ 1 ]
            data[ 8 ] = arr[ 2 ]
            arr = [ data[ 1 ], data[ 5 ], data[ 9 ] ];
            @_applyUpConversion arr, -1
            data[ 1 ] = arr[ 0 ]
            data[ 5 ] = arr[ 1 ]
            data[ 9 ] = arr[ 2 ]
            arr = [ data[ 2 ], data[ 6 ], data[ 10 ] ];
            @_applyUpConversion arr, -1
            data[ 2 ] = arr[ 0 ]
            data[ 6 ] = arr[ 1 ]
            data[ 10 ] = arr[ 2 ]
            
            # Rows second
            arr = [ data[ 0 ], data[ 1 ], data[ 2 ] ]
            @_applyUpConversion arr, -1
            data[ 0 ] = arr[ 0 ]
            data[ 1 ] = arr[ 1 ]
            data[ 2 ] = arr[ 2 ]
            arr = [ data[ 4 ], data[ 5 ], data[ 6 ] ];
            @_applyUpConversion arr, -1
            data[ 4 ] = arr[ 0 ]
            data[ 5 ] = arr[ 1 ]
            data[ 6 ] = arr[ 2 ]
            arr = [ data[ 8 ], data[ 9 ], data[ 10 ] ]
            @_applyUpConversion arr, -1
            data[ 8 ] = arr[ 0 ]
            data[ 9 ] = arr[ 1 ]
            data[ 10 ] = arr[ 2 ]

            # Now fix translation
            arr = [ data[ 3 ], data[ 7 ], data[ 11 ] ];
            @_applyUpConversion arr, -1
            data[ 3 ] = arr[ 0 ]
            data[ 7 ] = arr[ 1 ]
            data[ 11 ] = arr[ 2 ]

        return new THREE.Matrix4(
            data[0], data[1], data[2], data[3],
            data[4], data[5], data[6], data[7],
            data[8], data[9], data[10], data[11],
            data[12], data[13], data[14], data[15]
            )

#   Converts an array of floats to a 3D vector
#   Also applies the up vector conversion
#
#>  _floatsToVec3 :: ([Number]) -> THREE.Vector3
    _floatsToVec3 : ( data, offset, sign ) ->
        arr = [ data[ offset ], data[ offset + 1 ], data[ offset + 2 ] ]
        @_applyUpConversion arr, sign
        return new THREE.Vector3( arr[ 0 ], arr[ 1 ], arr[ 2 ] )

#==============================================================================
#   ColladaLoader private methods: up axis conversion
#==============================================================================

#   Sets up the axis conversion between the source and destination axis.
#
#>  _setUpConversion :: (String, String) ->
    _setUpConversion: (axisSrc, axisDest) ->
        if not @options.convertUpAxis or axisSrc is axisDest
            @upConversion = null
        else
            switch axisSrc
                when "X" then @upConversion = axisDest is "Y" ? "XtoY" : "XtoZ"
                when "Y" then @upConversion = axisDest is "X" ? "YtoX" : "YtoZ"
                when "Z" then @upConversion = axisDest is "X" ? "ZtoX" : "ZtoY"
        return

#   Modifies (in-place) the coordinates of a 3D vector
#   to apply the up vector conversion (if any)
#
#>  _applyUpConversion :: ([Number], Number) ->
    _applyUpConversion : ( data, sign ) ->

        if not @upConversion?
            return

        switch @upConversion
            when "XtoY"
                tmp = data[ 0 ]
                data[ 0 ] = sign * data[ 1 ]
                data[ 1 ] = tmp
            when "XtoZ"
                tmp = data[ 2 ]
                data[ 2 ] = data[ 1 ]
                data[ 1 ] = data[ 0 ]
                data[ 0 ] = tmp
            when "YtoX"
                tmp = data[ 0 ]
                data[ 0 ] = data[ 1 ]
                data[ 1 ] = sign * tmp
            when "YtoZ"
                tmp = data[ 1 ]
                data[ 1 ] = sign * data[ 2 ]
                data[ 2 ] = tmp
            when "ZtoX"
                tmp = data[ 0 ]
                data[ 0 ] = data[ 1 ]
                data[ 1 ] = data[ 2 ]
                data[ 2 ] = tmp
            when "ZtoY"
                tmp = data[ 1 ]
                data[ 1 ] = data[ 2 ]
                data[ 2 ] = sign * tmp
        return

#==============================================================================
#   ColladaLoader private methods: create the three.js scene graph
#==============================================================================

#   Creates the three.js scene graph
#
#>  _createSceneGraph :: () ->
    _createSceneGraph : () ->
        daeScene = @_getLinkTarget @file.dae.scene, ColladaVisualScene
        if not daeScene? then return

        threejsScene = new THREE.Object3D()
        @file.threejs.scene = threejsScene
        @_createSceneGraphNode(daeChild, threejsScene) for daeChild in daeScene.children
        
        # Old loader compatibility
        @file.scene = threejsScene
        return

#   Creates a three.js scene graph node
#
#>  _createSceneGraphNode :: (ColladaVisualSceneNode, THREE.Object3D) ->
    _createSceneGraphNode : (daeNode, threejsParent) ->
        threejsChildren = []
        
        # Geometries
        for daeGeometry in daeNode.geometries
            threejsMesh = @_createMesh daeGeometry
            threejsChildren.push threejsMesh

        # Lights

        # Create a three.js node and add it to the scene graph
        if threejsChildren.length > 1
            threejsNode = new THREE.Object3D()
            threejsNode.add threejsChild for threejsChild in threejsChildren
            threejsParent.add threejsNode
        else if threejsChildren.length is 1
            threejsParent.add threejsChildren[0]

        # Scene graph subtree
        @_crateSceneGraphNode(daeChild, threejsNode) for daeChild in daeNode.children
        return

#   Creates a three.js mesh
#
#>  _createMesh :: (ColladaInstanceGeometry) -> THREE.Geometry
    _createMesh : (daeInstanceGeometry) ->
        # Create new geometry and material objects for each mesh
        # Figuring out when they can be shared is too complex
        threejsGeometry = @_createGeometry daeInstanceGeometry
        threejsMaterials = @_createMaterials daeInstanceGeometry

#   Creates a three.js geometry
#
#>  _createGeometry :: (ColladaGeometry) -> THREE.Geometry
    _createGeometry : (daeInstanceGeometry) ->
        daeGeometry = @_getLinkTarget daeInstanceGeometry.geometry, ColladaGeometry
        threejsGeometry = new THREE.Geometry()
        return threejsGeometry

#   Creates a map of three.js materials
#
#>  _createMaterials :: (ColladaInstanceGeometry) -> ThreejsMaterialMap
    _createMaterials : (daeInstanceGeometry) ->
        result = new ThreejsMaterialMap
        for daeInstanceMaterial in daeInstanceGeometry.materials
            if not daeInstanceMaterial.symbol? then continue
            threejsMaterial = @_createMaterial daeInstanceMaterial
            @file.threejs.materials.push threejsMaterial
            result[daeInstanceMaterial.symbol] = threejsMaterial
        return result

#   Creates a three.js material
#
#>  _createMaterial :: (ColladaInstanceMaterial) -> THREE.Material
    _createMaterial : (daeInstanceMaterial) ->
        daeMaterial = @_getLinkTarget daeInstanceMaterial.material, ColladaMaterial
        if not daeMaterial? then return @_createDefaultMaterial
        daeEffect   = @_getLinkTarget daeMaterial.effect, ColladaEffect
        if not daeEffect? then return @_createDefaultMaterial

        params = {}
        # HACK: Three.js only supports one texture per material.
        # HACK: Just use the emissive/ambient/diffuse/specular map as the texture.
        @_setThreejsMaterialParam params, daeEffect.technique.emission, "emissive", "map"
        @_setThreejsMaterialParam params, daeEffect.technique.ambient,  "ambient",  "map"
        @_setThreejsMaterialParam params, daeEffect.technique.diffuse,  "diffuse",  "map"
        @_setThreejsMaterialParam params, daeEffect.technique.specular, "specular", "map"

        switch daeEffect.technique.shading
            when "blinn", "phong"
                params.color = params.diffuse
                return new THREE.MeshPhongMaterial params
            when "lambert"
                params.color = params.diffuse
                return new THREE.MeshLambertMaterial params
            when "constant"
                params.color = params.emission
                return new THREE.MeshBasicMaterial params
            else
                return @_createDefaultMaterial

#   Sets a three.js material parameter
#
#>  _setThreejsMaterialParam :: (Object, ColladaColorOrTexture, String, String) ->
    _setThreejsMaterialParam : (params, colorOrTexture, nameColor, nameTexture) ->
        if not colorOrTexture? then return
        if colorOrTexture.color?
            params[nameColor] = colorOrTexture.color.getHex()
        else if colorOrTexture.textureSampler?
            threejsTexture = @_loadThreejsTexture colorOrTexture
            if threejsTexture? then params[nameTexture] = threejsTexture
        return

#   Loads a three.js texture
#
#>  _loadThreejsTexture :: (ColladaColorOrTexture) -> THREE.Texture
    _loadThreejsTexture : (colorOrTexture) ->
        if not colorOrTexture.textureSampler? then return null

        textureSampler = @_getLinkTarget colorOrTexture.textureSampler, ColladaEffectSampler
        if not textureSampler? then return null

        textureImage = null
        if textureSampler.image?
            # COLLADA 1.5 path: texture -> sampler -> image
            textureImage = @_getLinkTarget textureSampler.image, ColladaImage
        else if textureSampler.surface?
            # COLLADA 1.4 path: texture -> sampler -> surface -> image
            textureSurface = @_getLinkTarget textureSampler.surface, ColladaEffectSurface
            textureImage = @_getLinkTarget textureSurface.initFrom, ColladaImage
        if not textureImage? then return null

        imageURL = @file.baseUrl + textureImage.initFrom
        cachedImage = @imageCache[imageURL]
        if cachedImage? then return cachedImage
        return @_loadTextureFromURL imageURL

#   Loads a three.js texture from a URL
#
#>  _loadTextureFromURL :: (String) -> THREE.Texture
    _loadTextureFromURL : (imageURL) ->
        if @options.useLocalTextureLoading
            image = document.createElement "img"
            image.src = imageURL
            texture = new THREE.Texture image
            texture.needsUpdate = true
            return texture
        else
            return THREE.ImageUtils.loadTexture imageURL

#   Creates a default three.js material
#   This is used if the material definition is somehow invalid
#
#>  _createDefaultMaterial :: () -> THREE.Material
    _createDefaultMaterial : () ->
        new THREE.MeshLambertMaterial { color: 0xdddddd, shading: THREE.FlatShading }

if window? then window.ColladaLoader2 = ColladaLoader2
else if module? then module.export = ColladaLoader2