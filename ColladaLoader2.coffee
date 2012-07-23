
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
        if url.charAt(0) is "#"
            id = url.substr 1, url.length - 1
            return lib[id]
        else
            @log "Non-local URL #{url} is not supported", ColladaLoader2.messageWarning
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


class ColladaAsset

#   Creates a new, empty collada asset
#
#>  constructor :: () ->
    constructor : () ->
        @unit = 1
        @upAxis = "Z"


class ColladaImage

#   Creates a new, empty collada image
#
#>  constructor :: () ->
    constructor : () ->
        @id = null
        @init_from = null


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
        effect = file.findElementByUrl file.dae.libEffects, @effect_url
        if not effect?
            log "Could not link effect #{@effect_url} for material #{@id}", ColladaLoader2.messageError
        return

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
    
    _parseLibEffect : (el) =>
        @log "Parsing effect.", ColladaLoader2.messageTrace

#   Parses an <material> element.
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

#   Parses an <material> element child.
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
        material.link(@file, @log) for id, material of @file.dae.libMaterials
        return