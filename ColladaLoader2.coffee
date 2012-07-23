
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
        @shading = null
        @surfaces = {}
        @samplers = {}

    link : (file, log) ->
        surface.link(file, @, log) for id, surface of @surfaces
        sampler.link(file, @, log) for id, sampler of @samplers

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

    @messageTrace   = 0;
    @messageInfo    = 1;
    @messageWarning = 2;
    @messageError   = 3;
    @messageTypes   = [ "TRACE", "INFO", "WARNING", "ERROR" ];;

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
        
        @file = new ColladaFile
        @file.setUrl url

        # Step 1: Parse the XML
        @_parseDocument doc
        
        # Step 2: Resolve hyperlinks
        @_resolveLinks()

        # Step 3: Create three.js objects

        result = @file
        @file = null

        if @readyCallback
            @readyCallback result

        return result

#   Parses the COLLADA XML document
#
#>  _parseDocument :: (XMLDocument) ->
    _parseDocument : (doc) ->
        if doc.childNodes[0]?.nodeName?.toUpperCase() is "COLLADA"
            colladaElement = doc.childNodes[0]
            @_parseTopLevelElement child for child in colladaElement.childNodes when child.nodeType is 1
        else
            @log "Can not parse document, top level element is not <COLLADA>", ColladaLoader2.messageError

#   Calls a given function for all element-type children of a given element
#
#>  _parseChildElements :: (XMLElement, Function) ->
    _parseChildElements : (el, fun) ->
        fun child for child in el.childNodes when child.nodeType is 1
        return

#   Returns the first child of a given element that has a given name (if any)
#
#>  _getFirstChildByName :: (XMLElement, String) -> XMLElement
    _getFirstChildByName : (el, name) ->
        return child for child in el.childNodes when child.nodeType is 1 and child.nodeName is name
        return null

#   Parses a top level COLLADA XML element.
#
#>  _parseTopLevelElement :: (XMLElement) ->
    _parseTopLevelElement : (el) ->
        switch el.nodeName
            when "asset"                 then @_parseAsset el
            when "scene"                 then @_parseScene         child for child in el.childNodes
            when "library_effects"       then @_parseChildElements el, @_parseLibEffect
            when "library_materials"     then @_parseChildElements el, @_parseLibMaterial
            when "library_geometries"    then @_parseChildElements el, @_parseLibGeometry
            when "library_controllers"   then @_parseChildElements el, @_parseLibController
            when "library_lights"        then @_parseChildElements el, @_parseLibLight
            when "library_images"        then @_parseChildElements el, @_parseLibImage
            when "library_visual_scenes" then @_parseChildElements el, @_parseLibScene
            when "library_animations"    then @_parseChildElements el, @_parseLibAnimation
            else @log "Skipped unknown DAE element #{el.nodeName}.", ColladaLoader2.messageInfo
        return
        
#   Parses an <asset> element.
#
#>  _parseAsset :: (XMLElement) ->
    _parseAsset : (el) ->
        @log "Parsing asset.", ColladaLoader2.messageTrace
        asset = new ColladaAsset
        @_parseAssetChild asset, child for child in el.childNodes when child.nodeType is 1
        @upConversion = @_getUpConversion asset.upAxis, @options.upAxis
        @file.dae.asset = asset
        return

#   Parses an <asset> element child.
#
#>  _parseAssetChild :: (ColladaAsset, XMLElement) ->
    _parseAssetChild : (asset, el) ->
        switch el.nodeName
            when "unit"
                meter = el.getAttribute "meter"
                if meter? then asset.unit = parseFloat meter
            when "up_axis"
                asset.upAxis = el.textContent.toUpperCase().charAt(0)
            else @log "Skipped unknown asset property #{el.nodeName}.", ColladaLoader2.messageInfo
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

    _parseScene : (el) ->
        @log "Parsing scene.", ColladaLoader2.messageTrace
  
#   Parses an <effect> element.
#
#>  _parseLibEffect :: (XMLElement) ->
    _parseLibEffect : (el) =>
        @log "Parsing effect.", ColladaLoader2.messageTrace
        effect = new ColladaEffect
        effect.id = el.getAttribute "id"
        profileCommon = @_getFirstChildByName el, "profile_COMMON"
        if profileCommon?
            @_parseLibEffectProfileChild effect, child for child in profileCommon.childNodes when child.nodeType is 1
        else
            @log "Effect #{effect.id} has no common profile", ColladaLoader2.messageError
        @file.dae.libEffects[effect.id] = effect
        return

#   Parses an <effect><profile_COMMON> element child.
#
#>  _parseLibEffectProfileChild :: (ColladaEffect, XMLElement) ->
    _parseLibEffectProfileChild : (effect, el) ->
        sid = el.getAttribute "sid"
        switch el.nodeName
            when "newparam" then @_parseLibEffectNewparamChild effect, sid, child for child in el.childNodes when child.nodeType is 1
            when "technique" then @_parseLibEffectTechniqueChild effect, sid, child for child in el.childNodes when child.nodeType is 1
            else @log "Skipped unknown profile_COMMON property #{el.nodeName}.", ColladaLoader2.messageInfo
        return

#   Parses an <newparam> child element.
#
#>  _parseLibEffectNewparamChild :: (ColladaEffect, String, XMLElement) ->
    _parseLibEffectNewparamChild : (effect, sid, el) ->
        switch el.nodeName
            when "surface"
                surface = new ColladaEffectSurface
                surface.type = el.getAttribute "type"
                surface.sid = sid
                @_parseLibEffectSurfaceChild effect, surface, sid, child for child in el.childNodes when child.nodeType is 1
                effect.surfaces[sid] = surface
            when "sampler2D"
                sampler = new ColladaEffectSampler
                sampler.sid = sid
                @_parseLibEffectSamplerChild effect, sampler, sid, child for child in el.childNodes when child.nodeType is 1
                effect.samplers[sid] = sampler
            else @log "Skipped unknown newparam property #{el.nodeName}.", ColladaLoader2.messageInfo
        return  

#   Parses an <newparam><surface> child element.
#
#>  _parseLibEffectSurfaceChild :: (ColladaEffect, ColladaEffectSurface, String, XMLElement) ->
    _parseLibEffectSurfaceChild : (effect, surface, sid, el) ->
        switch el.nodeName
            when "init_from" then surface.initFrom_url = el.textContent
            else @log "Skipped unknown surface property #{el.nodeName}.", ColladaLoader2.messageInfo
        return

#   Parses an <newparam><sampler> child element.
#
#>  _parseLibEffectSamplerChild :: (ColladaEffect, ColladaEffectSampler, String, XMLElement) ->
    _parseLibEffectSamplerChild : (effect, sampler, sid, el) ->
        switch el.nodeName
            when "source"         then sampler.surface_sid = el.textContent
            when "instance_image" then sampler.image_url  = el.getAttribute "url"
            else @log "Skipped unknown sampler property #{el.nodeName}.", ColladaLoader2.messageInfo
        return

#   Parses an <technique> child element.
#
#>  _parseLibEffectTechniqueChild :: (ColladaEffect, String, XMLElement) ->
    _parseLibEffectTechniqueChild : (effect, sid, el) ->
        switch el.nodeName
            when "blinn", "phong", "lambert", "constant"
                effect.shading = el.nodeName
                @_parseTechniqueParam effect, "", child for child in el.childNodes when child.nodeType is 1
            when "extra"
                technique = @_getFirstChildByName el, "technique"
                if technique?
                    profile = technique.getAttribute "profile"
                    @_parseTechniqueParam effect, profile, child for child in technique.childNodes when child.nodeType is 1
            else @log "Skipped unknown technique property #{el.nodeName}.", ColladaLoader2.messageInfo
        return

#   Parses an <technique> child element.
#
#>  _parseTechniqueParam :: (ColladaEffect, String, XMLElement) ->
    _parseTechniqueParam : (effect, profile, el) ->
        switch el.nodeName
            when "emission" then
            when "ambient" then
            when "diffuse" then
            when "specular" then
            when "shininess" then
            when "reflective" then
            when "reflectivity" then
            when "transparent" then
            when "transparency" then
            when "index_of_refraction" then
            else @log "Skipped unknown technique shading property #{el.nodeName}.", ColladaLoader2.messageInfo
        return

#   Parses a <material> element.
#
#>  _parseLibMaterial :: (XMLElement) ->
    _parseLibMaterial : (el) =>
        @log "Parsing material.", ColladaLoader2.messageTrace
        material = new ColladaMaterial
        material.id = el.getAttribute "id"
        material.name = el.getAttribute "name"
        @_parseLibMaterialChild material, child for child in el.childNodes when child.nodeType is 1
        @file.dae.libMaterials[material.id] = material
        return

#   Parses a <material> element child.
#
#>  _parseLibMaterialChild :: (ColladaMaterial, XMLElement) ->
    _parseLibMaterialChild : (material, el) ->
        switch el.nodeName
            when "instance_effect" then material.effect_url = el.getAttribute "url"
            else @log "Skipped unknown material property #{el.nodeName}.", ColladaLoader2.messageInfo
        return

    _parseLibGeometry : (el) =>
        @log "Parsing geometry.", ColladaLoader2.messageTrace
    
    _parseLibController : (el) =>
        @log "Parsing controller.", ColladaLoader2.messageTrace
    
    _parseLibLight : (el) =>
        @log "Parsing light.", ColladaLoader2.messageTrace

#   Parses an <image> element.
#
#>  _parseLibImage :: (XMLElement) ->
    _parseLibImage : (el) =>
        @log "Parsing image.", ColladaLoader2.messageTrace
        image = new ColladaImage
        image.id = el.getAttribute "id"
        @_parseLibImageChild image, child for child in el.childNodes when child.nodeType is 1
        @file.dae.libImages[image.id] = image
        return

#   Parses an <image> element child.
#
#>  _parseLibImageChild :: (ColladaImage, XMLElement) ->
    _parseLibImageChild : (image, el) ->
        switch el.nodeName
            when "init_from" then image.init_from = el.textContent
            else @log "Skipped unknown image property #{el.nodeName}.", ColladaLoader2.messageInfo
        return

    _parseLibScene : (el) =>
        @log "Parsing scene.", ColladaLoader2.messageTrace
    
    _parseLibAnimation : (el) =>
        @log "Parsing animation.", ColladaLoader2.messageTrace

#   Resolves all hyperlinks in the collada file.
#
#>  _resolveLinks :: () ->
    _resolveLinks : () ->
        effect.link(@file, @log)   for id, effect   of @file.dae.libEffects
        material.link(@file, @log) for id, material of @file.dae.libMaterials
        return