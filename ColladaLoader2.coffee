#==============================================================================
# COLLADA URL addressing
#   See chapter 3, section "Adress Syntax"
#   Uses XML ids that are unique within the whole document.
#   Hyperlinks to ids start with a hash.
#   <element id="xyz">
#   <element source="#xyz">
#==============================================================================
class ColladaUrlLink

    constructor : (url, type) ->
        @url = url.replace /^#/, ""
        @object = null
        @type = type

    resolve : (file, log) ->
        @object = file.dae.ids[@url]
        if not @object?
            log "Could not resolve URL ##{@url}", ColladaLoader2.messageError
            return false
        if @type? and not @object instanceof @type
            @object = null
            log "URL ##{@url} is not linked to a #{type}", ColladaLoader2.messageError
            return false
        return true
        
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

    constructor : (url, scope, type) ->
        @url = url
        @scope = scope
        @object = null
        @type = type

    resolve : (file, log) ->
        scope = @scope

        @object = scope.sids[@url]
        while not @object? and scope?
            scope = scope.parentFxScope
            @object = scope.sids[@url]

        if not @object?
            log "Could not resolve FX parameter ##{@url}", ColladaLoader2.messageError
            return false
        if @type? and not @object instanceof @type
            @object = null
            log "FX parameter ##{@url} is not linked to a #{type}", ColladaLoader2.messageError
            return false
        return true

#==============================================================================
# COLLADA SID addressing
#   See chapter 3, section "Adress Syntax"
#   Uses scoped ids that are unique within the parent element.
#   Adresses are anchored at a globally unique id and have a path of scoped ids.
#   <elementA id="xyz"><elementB sid="abc"></elementB></elementA>
#   <element target="xyz/abc">
#==============================================================================
class ColladaSidLink

    constructor : (parentId, url, type) ->
        @url = url
        @object = null
        @type = type
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
                @indices.push parseInt(index.replace /\)/, "") for index in arrIndices
                @arrSyntax = true
            else
                @sids.push lastSid

    resolve : (file, log) ->
        @object = file.dae.ids[@id]
        if not @object?
            log "Could not resolve SID ##{@url}, missing base ID #{@id}", ColladaLoader2.messageError
            return false
 
        for sid in @sids
            @object = @object.sids[sid]
            if not @object?
                log "Could not resolve SID ##{@url}, missing SID part #{sid}", ColladaLoader2.messageError
                return false

        return true

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
        @dae.libScenes = {}
        @dae.libAnimations = {}
        @dae.asset = new ColladaAsset()

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
            @url = null
            @baseUrl = null
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
#   ColladaImage
#==============================================================================
class ColladaImage

#   Creates a new, empty collada image
#
#>  constructor :: () ->
    constructor : () ->
        @id = null
        @init_from = null
        
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
        @emission = new ColladaColorOrTexture(0xffffff)
        @ambient = new ColladaColorOrTexture(0xffffff)
        @diffuse = new ColladaColorOrTexture(0xffffff)
        @specular = new ColladaColorOrTexture(0xffffff)
        @shininess = new ColladaColorOrTexture(0xffffff)
        @reflective = new ColladaColorOrTexture(0xffffff)
        @transparent = new ColladaColorOrTexture(0xffffff)
        # Float parameters
        @reflectivity = 1
        @transparency = 1
        @index_of_refraction = 1

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
    constructor : (hex) ->
        @color = new THREE.Color(hex)
        @texture_sampler = null
        @texcoord = null
        @opaque = null
        @bump = null

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
        @vertices = {}
        @triangles = {}
        @indices = null

#==============================================================================
#   ColladaSource
#==============================================================================
class ColladaSource

#   Creates a new, empty collada source
#
#>  constructor :: () ->
    constructor : () ->
        @id = null
        @sourceId = null
        @count = null
        @stride = null
        @data = null
        @params = {}

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
        @options = {
            # Force Geometry to always be centered at the local origin of the
            # containing Mesh.
            centerGeometry: false,

            # Axis conversion is done for geometries, animations, and controllers.
            # If we ever pull cameras or lights out of the COLLADA file, they'll
            # need extra work.
            convertUpAxis: false,

            subdivideFaces: true,

            upAxis: "Y"
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
            if  req.overrideMimeType then req.overrideMimeType "text/xml"

            req.onreadystatechange = () ->
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

        # Return the finished collada file
        result = @file
        @file = null

        if @readyCallback
            @readyCallback result

        return result
        
#   Report an unexpected child element
#
#>  _reportUnexpectedChild :: (String, String) ->
    _reportUnexpectedChild : (parent, child) ->
        @log "Skipped unknown <#{parent}> child <#{child}>.", ColladaLoader2.messageWarning

#   Parses the COLLADA XML document
#
#>  _parseXml :: (XMLDocument) ->
    _parseXml : (doc) ->
        if doc.childNodes[0]?.nodeName?.toUpperCase() is "COLLADA"
            colladaElement = doc.childNodes[0]
            @_parseColladaChild child for child in colladaElement.childNodes when child.nodeType is 1
        else
            @log "Can not parse document, top level element is not <COLLADA>.", ColladaLoader2.messageError

#   Returns the first child of a given element that has a given name (if any)
#
#>  _getFirstChildByName :: (XMLElement, String) -> XMLElement
    _getFirstChildByName : (el, name) ->
        return child for child in el.childNodes when child.nodeType is 1 and child.nodeName is name
        return null

#   Parses a <collada> element child.
#
#>  _parseColladaChild :: (XMLElement) ->
    _parseColladaChild : (el) ->
        switch el.nodeName
            when "asset"                 then @_parseAssetChild         child for child in el.childNodes when child.nodeType is 1
            when "library_effects"       then @_parseLibEffectChild     child for child in el.childNodes when child.nodeType is 1
            when "library_materials"     then @_parseLibMaterialChild   child for child in el.childNodes when child.nodeType is 1
            when "library_geometries"    then @_parseLibGeometryChild   child for child in el.childNodes when child.nodeType is 1
            when "library_images"        then @_parseLibImageChild      child for child in el.childNodes when child.nodeType is 1
            else @_reportUnexpectedChild "COLLADA", el.nodeName
        return

#   Parses an <asset> element child.
#
#>  _parseAssetChild :: (ColladaAsset, XMLElement) ->
    _parseAssetChild : (el) ->
        switch el.nodeName
            when "unit"
                meter = el.getAttribute "meter"
                if meter? then @file.dae.asset.unit = parseFloat meter
            when "up_axis"
                @file.dae.asset.upAxis = el.textContent.toUpperCase().charAt(0)
                @upConversion = @_getUpConversion @file.dae.asset.upAxis, @options.upAxis
            when "contributor", "created", "modified"
                # Known elements that can be safely ignored
            else @_reportUnexpectedChild "asset", el.nodeName
        return
  
#   Parses an <library_effects> element child.
#
#>  _parseLibEffectChild :: (XMLElement) ->
    _parseLibEffectChild : (el) ->
        switch el.nodeName
            when "effect"
                effect = new ColladaEffect
                effect.id = el.getAttribute "id"
                @_addUrlTarget effect, "libEffects"
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
            when "init_from" then surface.initFrom = new ColladaUrlLink el.textContent, ColladaImage
            else @_reportUnexpectedChild "surface", el.nodeName
        return

#   Parses an <newparam><sampler> child element.
#
#>  _parseEffectSamplerChild :: (ColladaEffect|ColladaTechnique, ColladaEffectSampler, String, XMLElement) ->
    _parseEffectSamplerChild : (scope, sampler, sid, el) ->
        switch el.nodeName
            when "source"         then sampler.surface     = new ColladaFxLink el.textContent, scope, ColladaEffectSurface
            when "instance_image" then sampler.image       = new ColladaUrlLink el.getAttribute("url"), ColladaImage
            else @_reportUnexpectedChild "sampler*", el.nodeName
        return

#   Parses an <technique> child element.
#
#>  _parseEffectTechniqueChild :: (ColladaEffect, String, XMLElement) ->
    _parseEffectTechniqueChild : (effect, sid, el) ->
        switch el.nodeName
            when "blinn", "phong", "lambert", "constant"
                effect.technique.shading = el.nodeName
                @_parseTechniqueParam(effect, "", child) for child in el.childNodes when child.nodeType is 1
            when "extra"
                @_parseTechniqueExtraChild(effect, "", child) for child in el.childNodes when child.nodeType is 1
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
                technique.transparent.opaque = firstChild.getAttribute "opaque"
            when "bump"
                # OpenCOLLADA extension: bump mapping
                @_parseEffectColorOrTexture technique, "bump", firstChild
                technique.bump.bumptype = firstChild.getAttribute "bumptype"
            else @log "Skipped unknown technique shading property #{el.nodeName}.", ColladaLoader2.messageInfo
        return
        
#   Parses an <technique>/<extra> child element.
#
#>  _parseTechniqueExtraChild :: (ColladaEffect, String, XMLElement) ->
    _parseTechniqueExtraChild : (effect, profile, el) ->
        switch el.nodeName
            when "technique"
                profile = el.getAttribute "profile"
                @_parseTechniqueParam effect, profile, child for child in el.childNodes when child.nodeType is 1
            else @_reportUnexpectedChild "technique/extra", el.nodeName
        return

#   Parses an color or texture element.
#
#>  _parseEffectColorOrTexture :: (ColladaTechnique, String, XMLElement) ->
    _parseEffectColorOrTexture : (technique, name, el) ->
        colorOrTexture = technique[name]
        if not colorOrTexture?
            colorOrTexture = new ColladaColorOrTexture(0xffffff)
            technique[name] = colorOrTexture
        switch el.nodeName
            when "color"
                rgba = @_strToFloats el.textContent
                colorOrTexture.color.setRGB rgba[0], rgba[1], rgba[2]
                colorOrTexture.color.a = rgba[3]
            when "texture"
                colorOrTexture.texture_sampler = new ColladaFxLink el.getAttribute("texture"), technique, ColladaEffectSampler
                colorOrTexture.texcoord = el.getAttribute "texcoord"
            else @_reportUnexpectedChild "_color_or_texture_type", el.nodeName

#   Parses a <lib_materials> child element.
#
#>  _parseLibMaterialChild :: (XMLElement) ->
    _parseLibMaterialChild : (el) ->
        switch el.nodeName
            when "material"
                material = new ColladaMaterial
                material.id   = el.getAttribute "id"
                material.name = el.getAttribute "name"
                @_addUrlTarget material, "libMaterials"
                @_parseMaterialChild(material, child) for child in el.childNodes when child.nodeType is 1
            else
                @_reportUnexpectedChild "library_materials", el.nodeName
        return

#   Parses a <material> element child.
#
#>  _parseMaterialChild :: (ColladaMaterial, XMLElement) ->
    _parseMaterialChild : (material, el) ->
        switch el.nodeName
            when "instance_effect" then material.effect = new ColladaUrlLink el.getAttribute("url"), ColladaEffect
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
                @_addUrlTarget geometry, "libGeometries"
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
            when "source"
                id = el.getAttribute "id"
                source = new ColladaSource
                source.id = id
                @_addUrlTarget source
                @_parseSourceChild(source, child) for child in el.childNodes when child.nodeType is 1
            when "vertices"
                @_parseVerticesChild(geometry, child) for child in el.childNodes when child.nodeType is 1
            when "triangles"
                @_parseTrianglesChild(geometry, child) for child in el.childNodes when child.nodeType is 1
            when "polygons", "polylist", "lines", "linestrips", "trifans", "tristrips"
                @log "Geometry primitive type #{el.nodeName} not supported.", ColladaLoader2.messageError
            else @_reportUnexpectedChild "library_geometries", el.nodeName
        return

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
#>  _createInput :: (XMLElement) -> ColladaInput
    _createInput : (el) ->
        input = new ColladaInput
        input.semantic = el.getAttribute "semantic"
        input.source   = new ColladaUrlLink el.getAttribute "source"
        offset = el.getAttribute "offset"
        if offset? then input.offset = parseInt offset
        set = el.getAttribute "set"
        if set? then input.set = parseInt set
        return input

#   Parses a <vertices> element child.
#
#>  _parseVerticesChild :: (ColladaGeometry, XMLElement) ->
    _parseVerticesChild : (geometry, el) ->
        switch el.nodeName
            when "input"
                input = @_createInput el
                geometry.vertices[input.semantic] = input
            else @_reportUnexpectedChild "vertices", el.nodeName
        return
        
#   Parses a <triangles> element child.
#
#>  _parseTrianglesChild :: (ColladaGeometry, XMLElement) ->
    _parseTrianglesChild : (geometry, el) ->
        switch el.nodeName
            when "input"
                input = @_createInput el
                geometry.triangles[input.semantic] = input
            when "p"
                geometry.indices = @_strToInts el.textContent
            else @_reportUnexpectedChild "vertices", el.nodeName
        return

    
#   Parses an <library_images> element child.
#
#>  _parseLibImageChild :: (XMLElement) ->
    _parseLibImageChild : (el) ->
        switch el.nodeName
            when "image"
                image = new ColladaImage
                image.id = el.getAttribute "id"
                @_addUrlTarget image, "libImages"
                @_parseImageChild image, child for child in el.childNodes when child.nodeType is 1
            else
                @_reportUnexpectedChild "library_images", el.nodeName
        return

#   Parses an <image> element child.
#
#>  _parseImageChild :: (ColladaImage, XMLElement) ->
    _parseImageChild : (image, el) ->
        switch el.nodeName
            when "init_from" then image.init_from = el.textContent
            else @_reportUnexpectedChild "image", el.nodeName
        return
        
#   Computes the axis conversion between the source and destination axis.
#
#>  _getUpConversion :: () ->
    _getUpConversion: (axisSrc, axisDest) ->
        if not @options.convertUpAxis or axisSrc is axisDest
            return null
        else
            switch axisSrc
                when "X" then return axisDest is "Y" ? "XtoY" : "XtoZ"
                when "Y" then return axisDest is "X" ? "YtoX" : "YtoZ"
                when "Z" then return axisDest is "X" ? "ZtoX" : "ZtoY"

#   Inserts a new global id object
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
        if lib? then @file.dae[lib][id] = object

#   Inserts a new FX id object
#
#>  _addFxTarget :: (ColladaObject, ColladaObject) ->
    _addFxTarget : (object, scope) ->
        sid = object.sid
        if not sid?
            @log "Object has no SID.", ColladaLoader2.messageError
            return
        if scope.sids[sid]?
            @log "There is already an FX target with SID #{sid}.", ColladaLoader2.messageError
            return
        scope.sids[sid] = object

#   Returns the link target
#
#>  _getLinkTarget :: (ColladaUrlLink|ColladaFxLink|ColladaSidLink) ->
    _getLinkTarget : (link) ->
        if not link.object?
            link.resolve @file, @log
        return link.object

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
        data[i] = parseInt(string) for string, i in strings
        return data
        
#   Parses a string of whitespace-separated boolean values
#
#>  _strToBools :: (String) -> [Boolean]
    _strToBools : (str) ->
        strings = @_strToStrings str
        data = new Array(strings.length)
        data[i] = ( string is "true" or string is "1" ? true : false ) for string, i in strings
        return data