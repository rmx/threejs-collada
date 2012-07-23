
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
        @dae.libEffects = {}
        @dae.libMaterials = {}
        @dae.libGeometries = {}
        @dae.libControllers = {}
        @dae.libLights = {}
        @dae.libImages = {}
        @dae.libScenes = {}
        @dae.libAnimations = {}
        @dae.asset = new ColladaAsset()

    findElementByUrl: (lib, url) ->
        # First try the original URL
        if lib[url]? then return lib[url]

        # Next try removing a #-prefix, if any
        if url.charAt(0) is "#"
            id = url.substr 1, url.length - 1
            if lib[id]? then return lib[id]

        return null

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


    link : (log) ->
        effect.link(@, @log)   for id, effect   of @dae.libEffects
        material.link(@, @log) for id, material of @dae.libMaterials
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
        @surfaces = {}
        @samplers = {}
        @technique = new ColladaEffectTechnique()

    link : (file, log) ->
        surface.link(file, @, log) for id, surface of @surfaces
        sampler.link(file, @, log) for id, sampler of @samplers
        @technique.link(file, @, log)

#==============================================================================
#   ColladaEffectTechnique
#==============================================================================
class ColladaEffectTechnique

#   Creates a new, empty collada effect technique
#
#>  constructor :: () ->
    constructor : () ->
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
        
    link : (file, effect, log) ->
        colorOrTexture.link(file, effect, log) for name, colorOrTexture of @ when colorOrTexture instanceof ColladaColorOrTexture
        return

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
        @initFrom_url = null
        @initFrom = null

    link : (file, effect, log) ->
        @initFrom = file.findElementByUrl file.dae.libImages, @initFrom_url
        if not @initFrom?
            log "Could not link image #{@initFrom_url} for effect surface #{@sid}", ColladaLoader2.messageError
        return

#==============================================================================
#   ColladaEffectSampler
#==============================================================================
class ColladaEffectSampler

#   Creates a new, empty collada effect surface
#
#>  constructor :: () ->
    constructor : () ->
        @sid = null
        @surface_sid = null
        @surface = null
        @image_url = null
        @image = null

    link : (file, effect, log) ->
        if @image_url?
            # COLLADA 1.5 path
            @image = file.findElementByUrl file.dae.libImages, @image_url
            if not @image?
                log "Could not link image #{@init_from_url} for effect sampler #{@sid}", ColladaLoader2.messageError
        else if @surface_sid?
            # COLLADA 1.4 path
            @surface = effect.surfaces[@surface_sid]
            if not @surface?
                log "Could not link surface #{@surface_sid} for effect sampler #{@sid}", ColladaLoader2.messageError
            @image = @surface.initFrom
        return

#==============================================================================
#   ColladaColorOrTexture
#==============================================================================
class ColladaColorOrTexture

#   Creates a new, empty collada color/texture
#
#>  constructor :: () ->
    constructor : (hex) ->
        @color = new THREE.Color(hex)
        @texture_sampler_sid = null
        @texture_sampler = null
        @texture_image = null
        @texcoord = null
        @opaque = null
        @bump = null
        
    link : (file, effect, log) ->
        if @texture_sampler_sid?
            @texture_sampler = effect.samplers[@texture_sampler_sid]
            @texture_image = @texture_sampler?.image
            if not @texture_image?
                log "Could not link effect texture #{@texture_sampler_sid}", ColladaLoader2.messageError
        return

#==============================================================================
#   ColladaMaterial
#==============================================================================
class ColladaMaterial

#   Creates a new, empty collada image
#
#>  constructor :: () ->
    constructor : () ->
        @id = null
        @name = null
        @effect = null
        @effect_url = null

    link : (file, log) ->
        @effect = file.findElementByUrl file.dae.libEffects, @effect_url
        if not @effect?
            log "Could not link effect #{@effect_url} for material #{@id}", ColladaLoader2.messageError
        return

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

#   Report an unexpected child element
#
#>  reportUnexpectedChild :: (String, String) ->
    reportUnexpectedChild : (parent, child) ->
        @log "Skipped unknown <#{parent}> child <#{child}>.", ColladaLoader2.messageWarning

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
        
        # Step 2: Resolve hyperlinks
        @_resolveLinks()

        # Step 3: Create three.js objects

        # Return the finished collada file
        result = @file
        @file = null

        if @readyCallback
            @readyCallback result

        return result

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
            when "scene"                 then @_parseScene              child for child in el.childNodes when child.nodeType is 1
            when "library_effects"       then @_parseLibEffectChild     child for child in el.childNodes when child.nodeType is 1
            when "library_materials"     then @_parseLibMaterialChild   child for child in el.childNodes when child.nodeType is 1
            when "library_geometries"    then @_parseLibGeometry        child for child in el.childNodes when child.nodeType is 1
            when "library_controllers"   then @_parseLibController      child for child in el.childNodes when child.nodeType is 1
            when "library_lights"        then @_parseLibLight           child for child in el.childNodes when child.nodeType is 1
            when "library_images"        then @_parseLibImageChild      child for child in el.childNodes when child.nodeType is 1
            when "library_visual_scenes" then @_parseLibScene           child for child in el.childNodes when child.nodeType is 1
            when "library_animations"    then @_parseLibAnimation       child for child in el.childNodes when child.nodeType is 1
            else @reportUnexpectedChild "COLLADA", el.nodeName
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
            else @reportUnexpectedChild "asset", el.nodeName
        return

    _parseScene : (el) ->
        @log "Parsing scene.", ColladaLoader2.messageTrace
  
#   Parses an <library_effects> element child.
#
#>  _parseLibEffectChild :: (XMLElement) ->
    _parseLibEffectChild : (el) ->
        switch el.nodeName
            when "effect"
                effect = new ColladaEffect
                effect.id = el.getAttribute "id"
                @_parseEffectChild(effect, child) for child in el.childNodes when child.nodeType is 1
                @file.dae.libEffects[effect.id] = effect
            else
                @reportUnexpectedChild "library_effects", el.nodeName
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
                @reportUnexpectedChild "effect", el.nodeName

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
                @reportUnexpectedChild "profile_COMMON", el.nodeName
        return

#   Parses an <newparam> child element.
#
#>  _parseEffectNewparamChild :: (ColladaEffect, String, XMLElement) ->
    _parseEffectNewparamChild : (effect, sid, el) ->
        switch el.nodeName
            when "surface"
                surface = new ColladaEffectSurface
                surface.type = el.getAttribute "type"
                surface.sid = sid
                @_parseEffectSurfaceChild(effect, surface, sid, child) for child in el.childNodes when child.nodeType is 1
                effect.surfaces[sid] = surface
            when "sampler2D"
                sampler = new ColladaEffectSampler
                sampler.sid = sid
                @_parseEffectSamplerChild(effect, sampler, sid, child) for child in el.childNodes when child.nodeType is 1
                effect.samplers[sid] = sampler
            else @reportUnexpectedChild "newparam", el.nodeName
        return  

#   Parses a <surface> child element.
#
#>  _parseEffectSurfaceChild :: (ColladaEffect, ColladaEffectSurface, String, XMLElement) ->
    _parseEffectSurfaceChild : (effect, surface, sid, el) ->
        switch el.nodeName
            when "init_from" then surface.initFrom_url = el.textContent
            else @reportUnexpectedChild "surface", el.nodeName
        return

#   Parses an <newparam><sampler> child element.
#
#>  _parseEffectSamplerChild :: (ColladaEffect, ColladaEffectSampler, String, XMLElement) ->
    _parseEffectSamplerChild : (effect, sampler, sid, el) ->
        switch el.nodeName
            when "source"         then sampler.surface_sid = el.textContent
            when "instance_image" then sampler.image_url   = el.getAttribute "url"
            else @reportUnexpectedChild "sampler*", el.nodeName
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
            else @reportUnexpectedChild "technique", el.nodeName
        return

#   Parses an <technique>/<blinn|phong|lambert|constant> child element.
#
#>  _parseTechniqueParam :: (ColladaEffect, String, XMLElement) ->
    _parseTechniqueParam : (effect, profile, el) ->
        firstChild = el.childNodes[1]
        switch el.nodeName
            when "emission", "ambient", "diffuse", "specular", "reflective"
                @_parseEffectColorOrTexture effect, el.nodeName,   firstChild
            when "shininess", "reflectivity", "transparency", "index_of_refraction"
                effect.technique[el.nodeName] = parseFloat firstChild.textContent
            when "transparent"
                @_parseEffectColorOrTexture effect, "transparent",  firstChild
                effect.technique.transparent.opaque = firstChild.getAttribute "opaque"
            when "bump"
                # OpenCOLLADA extension: bump mapping
                @_parseEffectColorOrTexture effect, "bump",         firstChild
                effect.technique.bump.bumptype = firstChild.getAttribute "bumptype"
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
            else @reportUnexpectedChild "technique/extra", el.nodeName
        return

#   Parses an color or texture element.
#
#>  _parseEffectColorOrTexture :: (ColladaEffect, String, XMLElement) ->
    _parseEffectColorOrTexture : (effect, name, el) ->
        colorOrTexture = effect.technique[name]
        if not colorOrTexture?
            colorOrTexture = new ColladaColorOrTexture(0xffffff)
            effect.technique[name] = colorOrTexture
        switch el.nodeName
            when "color"
                rgba = @_strToFloats el.textContent
                colorOrTexture.color.setRGB rgba[0], rgba[1], rgba[2]
                colorOrTexture.color.a = rgba[3]
            when "texture"
                colorOrTexture.texture_sampler_sid = el.getAttribute "texture"
                colorOrTexture.texcoord = el.getAttribute "texcoord"
            else @reportUnexpectedChild "_color_or_texture_type", el.nodeName

#   Parses a <lib_materials> child element.
#
#>  _parseLibMaterialChild :: (XMLElement) ->
    _parseLibMaterialChild : (el) ->
        switch el.nodeName
            when "material"
                material = new ColladaMaterial
                material.id = el.getAttribute "id"
                material.name = el.getAttribute "name"
                @_parseMaterialChild(material, child) for child in el.childNodes when child.nodeType is 1
                @file.dae.libMaterials[material.id] = material
            else
                @reportUnexpectedChild "library_materials", el.nodeName
        return

#   Parses a <material> element child.
#
#>  _parseMaterialChild :: (ColladaMaterial, XMLElement) ->
    _parseMaterialChild : (material, el) ->
        switch el.nodeName
            when "instance_effect" then material.effect_url = el.getAttribute "url"
            else @reportUnexpectedChild "material", el.nodeName
        return

    _parseLibGeometry : (el) ->
        @log "Parsing geometry.", ColladaLoader2.messageTrace
    
    _parseLibController : (el) ->
        @log "Parsing controller.", ColladaLoader2.messageTrace
    
    _parseLibLight : (el) ->
        @log "Parsing light.", ColladaLoader2.messageTrace

#   Parses an <library_images> element child.
#
#>  _parseLibImageChild :: (XMLElement) ->
    _parseLibImageChild : (el) ->
        switch el.nodeName
            when "image"
                image = new ColladaImage
                image.id = el.getAttribute "id"
                @_parseImageChild image, child for child in el.childNodes when child.nodeType is 1
                @file.dae.libImages[image.id] = image
            else
                @reportUnexpectedChild "library_images", el.nodeName
        return

#   Parses an <image> element child.
#
#>  _parseImageChild :: (ColladaImage, XMLElement) ->
    _parseImageChild : (image, el) ->
        switch el.nodeName
            when "init_from" then image.init_from = el.textContent
            else @reportUnexpectedChild "image", el.nodeName
        return

    _parseLibScene : (el) ->
        @log "Parsing scene.", ColladaLoader2.messageTrace
    
    _parseLibAnimation : (el) ->
        @log "Parsing animation.", ColladaLoader2.messageTrace
        
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

#   Resolves all hyperlinks in the collada file.
#
#>  _resolveLinks :: () ->
    _resolveLinks : () ->
        @file.link @log
        return

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