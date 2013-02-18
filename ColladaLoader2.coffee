#==============================================================================
# COLLADA file loader for three.js
#
# [1] https://github.com/mrdoob/three.js/
# [2] http://www.khronos.org/files/collada_spec_1_4.pdf
# [3] http://www.khronos.org/files/collada_spec_1_5.pdf
#
# Limitations by design:
# - Non-triangle primitives are not supported
# - Loading of geometry data from other documents is not supported
#==============================================================================


#==============================================================================
# SECTION: GENERIC PRETTY-PRINTING FUNCTIONS
#==============================================================================

indentString = (count, str) ->
    output = ""
    for i in [1..count] by 1
        output += "    "
    output += str
    return output

graphNodeString = (indent, str) ->
    return indentString indent, "|-" + str

getNodeInfo = (node, indent, prefix) ->
    if not node? then return ""
    if typeof node is "string"  then return graphNodeString indent, prefix + "'#{node}'\n"
    if typeof node is "number"  then return graphNodeString indent, prefix + "#{node}\n"
    if typeof node is "boolean" then return graphNodeString indent, prefix + "#{node}\n"
    if node.getInfo? then return node.getInfo indent, prefix
    return graphNodeString indent, prefix + "<unknown data type>\n"

#==============================================================================
# SECTION: CLASSES FOR COLLADA ADRESSING
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
        @url = url.trim().replace /^#/, ""
        @object = null

    getInfo : (indent, prefix) ->
        return graphNodeString indent, prefix + "<urlLink url='#{@url}'>\n"

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

    getInfo : (indent, prefix) ->
        return graphNodeString indent, prefix + "<fxLink url='#{@url}'>\n"

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
            arrSyntax = lastSid.indexOf("(") >= 0
            if dotSyntax
                parts = lastSid.split "."
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

    getInfo : (indent, prefix) ->
        str = "<sidLink id='#{@id}'"
        if @sids.length > 0
            str += ", sids='["
            str += @sids.join ","
            str += "]'"
        str += ">\n"
        output = graphNodeString indent, prefix + str

#==============================================================================
# SECTION: CLASSES FOR COLLADA ELEMENTS
#==============================================================================

#==============================================================================
#   ColladaAnimationTarget
#
#   This is used as a base class for every object that can be animated
#   To use an animation target, first select an animation by name, id, or index
#   After that, apply keyframes of the selected animation
#==============================================================================
class ColladaAnimationTarget

    constructor : () ->
        @animTarget = {}
        @animTarget.channels = []       # All ThreejsAnimationChannels that target this object
        @animTarget.activeChannels = [] # The currently selected animation channels (zero or more)
        @animTarget.dataRows = null
        @animTarget.dataColumns = null

#   Selects an animation using a custom filter
#
#>  selectAnimation :: ((ThreejsAnimationChannel, Number) -> Boolean) ->
    selectAnimation : (filter) ->
        @animTarget.activeChannels = []
        for channel, i in @animTarget.channels
            if filter channel, i
                @animTarget.activeChannels.push channel
        return

#   Selects an animation by id
#
#>  selectAnimationById :: (String) ->
    selectAnimationById : (id) ->
        @selectAnimation (channel, i) -> channel.animation.id is id
        return

#   Selects an animation by name
#
#>  selectAnimationByName :: (String) -> Boolean
    selectAnimationByName : (name) ->
        @selectAnimation (channel, i) -> channel.animation.name is name
        return

#   Selects all animations
#
#>  selectAllAnimations :: (Number) -> Boolean
    selectAllAnimations : (index) ->
        @selectAnimation (channel, i) -> true
        return

#   Applies the given keyframe of the previously selected animation
#
#>  applyAnimationKeyframe :: (Number) ->
    applyAnimationKeyframe : (keyframe) ->
        throw new Error "applyAnimationKeyframe() not implemented"

#  Saves the non-animated state of this object
#
#>  initAnimationTarget :: () ->
    initAnimationTarget: () ->
        throw new Error "initAnimationTarget() not implemented"

#   Resets this object to the non-animated state 
#
#>  resetAnimation :: () ->
    resetAnimation: () ->
        throw new Error "resetAnimation() not implemented"

#==============================================================================
#   ColladaAsset
#==============================================================================
class ColladaAsset

#   Creates a new, empty collada asset
#
#>  constructor :: () ->
    constructor : () ->
        @unit = 1
        @upAxis = null

    getInfo : (indent, prefix) ->
        return graphNodeString indent, prefix + "<asset>\n"

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

    getInfo : (indent, prefix) ->
        output = graphNodeString indent, prefix + "<visualScene id='#{@id}'>\n"
        if @children? then for child in @children
            output += getNodeInfo child, indent+1, "child "
        return output
 
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
        @parent = null
        @children = []
        @sidChildren = []
        @transformations = []
        @geometries = []
        @controllers = []
        @lights = []
        @cameras = []

    getInfo : (indent, prefix) ->
        output = graphNodeString indent, prefix + "<visualSceneNode id='#{@id}', sid='#{@sid}', name='#{@name}'>\n"
        if @geometries? then for child in @geometries
            output += getNodeInfo child, indent+1, "geometry "
        if @controllers? then for child in @controllers
            output += getNodeInfo child, indent+1, "controller "
        if @lights? then for child in @lights
            output += getNodeInfo child, indent+1, "light "
        if @cameras? then for child in @cameras
            output += getNodeInfo child, indent+1, "camera "
        if @children? then for child in @children
            output += getNodeInfo child, indent+1, "child "
        return output

#   Returns a three.js transformation matrix for this node
#
#>  getTransformMatrix :: (THREE.Matrix4) -> 
    getTransformMatrix : (result) ->
        temp = new THREE.Matrix4
        result.identity()
        for transform in @transformations
            transform.getTransformMatrix temp
            result.multiplyMatrices result, temp
        return

#==============================================================================
#   ColladaNodeTransform
#==============================================================================
class ColladaNodeTransform extends ColladaAnimationTarget

#   Creates a new, empty collada scene node transformation
#
#>  constructor :: () ->
    constructor : () ->
        super()
        @sid = null
        @type = null
        @data = null
        @originalData = null
        @node = null

#   Returns a three.js transformation matrix for this transform
#
#>  getTransformMatrix :: (THREE.Matrix4)
    getTransformMatrix : (result) ->
        switch @type
            when "matrix"
                _fillMatrix4RowMajor @data, 0, result
            when "rotate"
                axis = new THREE.Vector3 @data[0], @data[1], @data[2]
                result.makeRotationAxis axis, @data[3] * TO_RADIANS
            when "translate"
                result.makeTranslation @data[0], @data[1], @data[2]
            when "scale"
                result.makeScale @data[0], @data[1], @data[2]
            else
                throw new Error "transform type '#{@type}' not implemented"
        return

#   Applies the given keyframe of the previously selected animation
#
#>  applyAnimationKeyframe :: (Number) ->
    applyAnimationKeyframe : (keyframe) ->
        for channel in @animTarget.activeChannels
            outputData = channel.outputData
            for i in [0..channel.count-1] by 1
                @data[channel.offset+i] = outputData[keyframe * channel.stride + i]
        return

#  Saves the non-animated state of this object
#
#>  initAnimationTarget :: () ->
    initAnimationTarget: () ->
        @originalData = new Float32Array(@data.length)
        for x,i in @data
            @originalData[i] = @data[i]
        switch @type
            when "matrix"
                @animTarget.dataColumns = 4
                @animTarget.dataRows = 4
            when "rotate"
                @animTarget.dataColumns = 4
                @animTarget.dataRows = 1
            when "translate", "scale"
                @animTarget.dataColumns = 3
                @animTarget.dataRows = 1
            else
                throw new Error "transform type '#{@type}' not implemented"
        return

#   Resets this object to the non-animated state 
#
#>  resetAnimation :: () ->
    resetAnimation: () ->
        for x,i in @originalData
            @data[i] = @originalData[i]
        return

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
        @sidChildren = []

    getInfo : (indent, prefix) ->
        output = graphNodeString indent, prefix + "<instanceGeometry>\n"
        output += getNodeInfo @geometry, indent+1, "geometry "
        for material in @materials
            output += getNodeInfo material, indent+1, "material "
        return output

#==============================================================================
#   ColladaInstanceController
#==============================================================================
class ColladaInstanceController

#   Creates a new, empty collada geometry instance
#
#>  constructor :: () ->
    constructor : () ->
        @controller = null
        @skeletons = []
        @materials = []
        @sidChildren = []

    getInfo : (indent, prefix) ->
        output = graphNodeString indent, prefix + "<instanceController>\n"
        output += getNodeInfo @controller, indent+1, "controller "
        for skeleton in @skeletons
            output += getNodeInfo skeleton, indent+1, "skeleton "
        for material in @materials
            output += getNodeInfo material, indent+1, "material "
        return output

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

    getInfo : (indent, prefix) ->
        output = graphNodeString indent, prefix + "<instanceMaterial sid='#{@sid}'>\n"
        output += getNodeInfo @material, indent+1, "material "
        return output

#==============================================================================
#   ColladaInstanceLight
#==============================================================================
class ColladaInstanceLight

#   Creates a new, empty collada light instance
#
#>  constructor :: () ->
    constructor : () ->
        @sid = null
        @light = null
        @name = null
        @sidChildren = []

    getInfo : (indent, prefix) ->
        output = graphNodeString indent, prefix + "<instanceLight>\n"
        output += getNodeInfo @light, indent+1, "light "
        return output

#==============================================================================
#   ColladaInstanceCamera
#==============================================================================
class ColladaInstanceCamera

#   Creates a new, empty collada light instance
#
#>  constructor :: () ->
    constructor : () ->
        @sid = null
        @camera = null
        @name = null
        @sidChildren = []

    getInfo : (indent, prefix) ->
        output = graphNodeString indent, prefix + "<instanceCamera>\n"
        output += getNodeInfo @light, indent+1, "camera "
        return output

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

    getInfo : (indent, prefix) ->
        output = graphNodeString indent, prefix + "<image id='#{@id}'>\n"
        output += getNodeInfo @initFrom, indent+1, "initFrom "
        return output

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
        @technique = null

    getInfo : (indent, prefix) ->
        output = graphNodeString indent, prefix + "<effect id='#{@id}'>\n"
        output += getNodeInfo @technique, indent+1, "technique "
        return output
        
#==============================================================================
#   ColladaEffectTechnique
#==============================================================================
class ColladaEffectTechnique

#   Creates a new, empty collada effect technique
#
#>  constructor :: () ->
    constructor : () ->
        @sid = null
        @sids = {}
        @fxScope = null
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

    getInfo : (indent, prefix) ->
        output = graphNodeString indent, prefix + "<technique sid='#{@sid}'>\n"
        return output

#==============================================================================
#   ColladaEffectSurface
#==============================================================================
class ColladaEffectSurface

#   Creates a new, empty collada effect surface
#
#>  constructor :: () ->
    constructor : () ->
        @sid = null
        @fxScope = null
        @type = null
        @initFrom = null
        @format = null
        @size = null
        @viewportRatio = null
        @mipLevels = null
        @mipmapGenerate = null

    getInfo : (indent, prefix) ->
        output = graphNodeString indent, prefix + "<surface sid='#{@sid}'>\n"
        output += getNodeInfo @initFrom, indent+1, "initFrom "
        return output

#==============================================================================
#   ColladaEffectSampler
#==============================================================================
class ColladaEffectSampler

#   Creates a new, empty collada effect sampler
#
#>  constructor :: () ->
    constructor : () ->
        @sid = null
        @fxScope = null
        @surface = null
        @image = null
        @wrapS = null
        @wrapT = null
        @minfilter = null
        @magfilter = null
        @borderColor = null
        @mipmapMaxLevel = null
        @mipmapBias = null

    getInfo : (indent, prefix) ->
        output = graphNodeString indent, prefix + "<sampler sid='#{@sid}'>\n"
        output += getNodeInfo @image, indent+1, "image "
        output += getNodeInfo @surface, indent+1, "surface "
        return output

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

    getInfo : (indent, prefix) ->
        output = graphNodeString indent, prefix + "<material id='#{@id}' name='#{@name}'>\n"
        output += getNodeInfo @effect, indent+1, "effect "
        return output
        
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
        @sources = []        # 0..N sources, indexed by globally unique ID
        @vertices = null     # 1 vertices object
        @triangles = []      # 0..N triangle objects

    getInfo : (indent, prefix) ->
        output = graphNodeString indent, prefix + "<geometry id='#{@id}' name='#{@name}'>\n"
        for source in @sources
            output += getNodeInfo source, indent+1, "source "
        output += getNodeInfo @vertices, indent+1, "vertices "
        for tri in @triangles
            output += getNodeInfo tri, indent+1, "triangles "
        return output

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
        @params = {}         # 0..N named parameters

    getInfo : (indent, prefix) ->
        output = graphNodeString indent, prefix + "<source id='#{@id}' name='#{@name}'>\n"
        output += getNodeInfo @sourceId, indent+1, "sourceId "
        return output

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
        @inputs = []         # 0..N optional inputs with a non-unique semantic

    getInfo : (indent, prefix) ->
        output = graphNodeString indent, prefix + "<vertices id='#{@id}' name='#{@name}'>\n"
        for input in @inputs
            output += getNodeInfo input, indent+1, "input "
        return output

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
        @inputs = []         # 0..N optional inputs with a non-unique semantic
        @indices = null

    getInfo : (indent, prefix) ->
        output = graphNodeString indent, prefix + "<triangles name='#{@name}'>\n"
        output += getNodeInfo @material, indent+1, "material "
        for input in @inputs
            output += getNodeInfo input, indent+1, "input "
        return output

#==============================================================================
#   ColladaInput
#==============================================================================
class ColladaInput

#   Creates a new, empty collada input
#
#>  constructor :: () ->
    constructor : () ->
        @semantic = null     # "VERTEX", "POSITION", "NORMAL", "TEXCOORD", ...
        @source = null       # URL of source object
        @offset = null       # Offset in index array
        @set = null          # Optional set identifier

    getInfo : (indent, prefix) ->
        output = graphNodeString indent, prefix + "<input semantic=#{@semantic}>\n"
        output += getNodeInfo @source, indent+1, "source "
        return output

#==============================================================================
#   ColladaController
#==============================================================================
class ColladaController

#   Creates a new, empty collada controller
#
#>  constructor :: () ->
    constructor : () ->
        @id = null
        @name = null
        @skin = null
        @morph = null

    getInfo : (indent, prefix) ->
        output = graphNodeString indent, prefix + "<controller id='#{@id}', name='#{@name}'>\n"
        output += getNodeInfo @skin, indent+1, "skin "
        output += getNodeInfo @morph, indent+1, "morph "
        return output

#==============================================================================
#   ColladaSkin
#==============================================================================
class ColladaSkin

#   Creates a new, empty collada skin
#
#>  constructor :: () ->
    constructor : () ->
        @source = null
        @bindShapeMatrix = null
        @sources = []
        @joints = null
        @vertexWeights = null

    getInfo : (indent, prefix) ->
        output = graphNodeString indent, prefix + "<skin source='#{@source}'>\n"
        output += getNodeInfo @bindShapeMatrix, indent+1, "bind_shape_matrix "
        for source in @sources
            output += getNodeInfo source, indent+1, "source "
        output += getNodeInfo @joints, indent+1, "joints "
        output += getNodeInfo @vertexWeights, indent+1, "vertex_weights "
        return output

#==============================================================================
#   ColladaJoints
#==============================================================================
class ColladaJoints

#   Creates a new, empty collada joints
#
#>  constructor :: () ->
    constructor : () ->
        @joints = null
        @invBindMatrices = null

    getInfo : (indent, prefix) ->
        output = graphNodeString indent, prefix + "<joints>\n"
        output += getNodeInfo @joints, indent+1, "joints "
        output += getNodeInfo @invBindMatrices, indent+1, "invBindMatrices "
        return output

#==============================================================================
#   ColladaVertexWeights
#==============================================================================
class ColladaVertexWeights

#   Creates a new, empty collada vertex weights
#
#>  constructor :: () ->
    constructor : () ->
        @inputs = []
        @vcount = null
        @v = null
        @joints = null
        @weights = null
        

    getInfo : (indent, prefix) ->
        output = graphNodeString indent, prefix + "<vertex_weights>\n"
        output += getNodeInfo @joints, indent+1, "joints "
        output += getNodeInfo @weights, indent+1, "weights "
        return output

#==============================================================================
#   ColladaAnimation
#==============================================================================
class ColladaAnimation

#   Creates a new, empty collada animation
#
#>  constructor :: () ->
    constructor : () ->
        @id = null
        @name = null
        @parent = null
        @rootId = null   # Id of the root animation
        @rootName = null # Name of the root animation
        @animations = []
        @sources = []
        @samplers = []
        @channels = []

    getInfo : (indent, prefix) ->
        output = graphNodeString indent, prefix + "<animation id='#{@id}', name='#{name}'>\n"
        for animation in @animations
            output += getNodeInfo animation, indent+1, "animation "
        for source in @sources
            output += getNodeInfo source, indent+1, "source "
        for sampler in @samplers
            output += getNodeInfo sampler, indent+1, "sampler "
        for channel in @channels
            output += getNodeInfo channel, indent+1, "channel "
        return output

#==============================================================================
#   ColladaSampler
#==============================================================================
class ColladaSampler

#   Creates a new, empty collada sampler
#
#>  constructor :: () ->
    constructor : () ->
        @id = null
        @input = null
        @outputs = []
        @inTangents = []
        @outTangents = []
        @interpolation = null

    getInfo : (indent, prefix) ->
        output = graphNodeString indent, prefix + "<sampler id='#{@id}'>\n"
        output += getNodeInfo @input, indent+1, "input "
        for o in @outputs
            output += getNodeInfo o, indent+1, "output "
        for t in @inTangents
            output += getNodeInfo t, indent+1, "inTangent "
        for t in @outTangents
            output += getNodeInfo t, indent+1, "outTangent "
        output += getNodeInfo @interpolation, indent+1, "interpolation "
        return output

#==============================================================================
#   ColladaChannel
#==============================================================================
class ColladaChannel

#   Creates a new, empty collada channel
#
#>  constructor :: () ->
    constructor : () ->
        @animation = null
        @source = null
        @target = null

    getInfo : (indent, prefix) ->
        output = graphNodeString indent, prefix + "<channel>\n"
        output += getNodeInfo @source, indent+1, "source "
        output += getNodeInfo @target, indent+1, "target "
        return output

#==============================================================================
#   ColladaLight
#==============================================================================
class ColladaLight

#   Creates a new, empty collada light
#
#>  constructor :: () ->
    constructor : () ->
        @id = null
        @name = null
        @type = null
        @color = null
        @params = {} # Parameters may have SIDs
        @sidChildren = []

    getInfo : (indent, prefix) ->
        return graphNodeString indent, prefix + "<light>\n"

#==============================================================================
#   ColladaLightParam
#==============================================================================
class ColladaLightParam

#   Creates a new, empty collada light parameter
#
#>  constructor :: () ->
    constructor : () ->
        @sid = null
        @name = null
        @value = null

#==============================================================================
#   ColladaCamera
#==============================================================================
class ColladaCamera

#   Creates a new, empty collada light
#
#>  constructor :: () ->
    constructor : () ->
        @id = null
        @name = null
        @type = null
        @params = {} # Parameters may have SIDs
        @sidChildren = []

    getInfo : (indent, prefix) ->
        return graphNodeString indent, prefix + "<camera>\n"

#==============================================================================
#   ColladaCameraParam
#==============================================================================
class ColladaCameraParam

#   Creates a new, empty collada light parameter
#
#>  constructor :: () ->
    constructor : () ->
        @sid = null
        @name = null
        @value = null

#==============================================================================
# SECTION: CLASSES FOR INTERMEDIATE THREEJS-RELATED OBJECTS
#==============================================================================

#==============================================================================
#   ThreejsAnimationChannel
#==============================================================================
class ThreejsAnimationChannel

#   Creates a new, empty three.js animation channel
#
#>  constructor :: () ->
    constructor : () ->
        @inputData = null
        @outputData = null
        @offset = null
        @stride = null
        @count = null
        @animation = null

#==============================================================================
#   ThreejsSkeletonBone
#==============================================================================
class ThreejsSkeletonBone

#   Creates a new, empty three.js skeleton bone
#
#>  constructor :: () ->
    constructor : () ->
        @index = null
        @node = null
        @sid = null
        @parent = null
        @isAnimated = null
        @matrix = new THREE.Matrix4          # Local object transformation (relative to parent bone)
        @worldMatrix = new THREE.Matrix4     # Local bone space to world space (includes all parent bone transformations)
        @invBindMatrix = new THREE.Matrix4   # Skin world space to local bone space
        @skinMatrix = new THREE.Matrix4      # Total transformation for skin vertices
        @worldMatrixDirty = true

#   Computes the world transformation matrix
#
#>  getWorldMatrix :: () -> THREE.Matrix4
    getWorldMatrix : () ->
        if @worldMatrixDirty        
            if @parent?
                @worldMatrix.multiplyMatrices @parent.getWorldMatrix(), @matrix
            else
                @worldMatrix.copy @matrix
            @worldMatrixDirty = false
        return @worldMatrix

#   Applies the transformation from the associated animation channel (if any)
#
#>  applyAnimation :: () ->
    applyAnimation : (frame) ->
        if @isAnimated
            for transform in @node.transformations
                transform.applyAnimationKeyframe frame
            @node.getTransformMatrix @matrix
        # Updating the matrix invalidates the transform of all child nodes
        # Instead, flag all nodes as dirty so all of them get updated
        @worldMatrixDirty = true
        return null

#   Updates the skin matrix
#
#>  updateSkinMatrix :: () ->
    updateSkinMatrix : (bindShapeMatrix) ->
        worldMatrix = @getWorldMatrix()
        @skinMatrix.multiplyMatrices worldMatrix, @invBindMatrix
        @skinMatrix.multiplyMatrices @skinMatrix, bindShapeMatrix
        return null

#==============================================================================
#   ThreejsMaterialMap
#==============================================================================
class ThreejsMaterialMap

#   Creates a new, empty three.js material map
#
#>  constructor :: () ->
    constructor : () ->
        @materials = []
        @indices = {}
        @needTangents = false

#==============================================================================
# SECTION: CLASSES FOR INTERMEDIATE THREEJS-RELATED OBJECTS
#==============================================================================

#==============================================================================
#   ColladaFile
#==============================================================================
class ColladaFile

#   Creates a new, empty collada file
#
#>  constructor :: (ColladaLoader2) ->
    constructor : (loader) ->

        # Internal data
        @_url = null
        @_baseUrl = null
        @_loader = loader
        # Files may be loaded asynchronously.
        # Copy options at the time this object was created.
        @_options = {}
        for key, value of loader.options
            @_options[key] = value
        @_log = loader.log
        @_readyCallback = null
        @_progressCallback = null

        # Parsed collada objects
        @dae = {}
        @dae.ids = {}
        @dae.animationTargets = []
        @dae.libEffects = []
        @dae.libMaterials = []
        @dae.libGeometries = []
        @dae.libControllers = []
        @dae.libLights = []
        @dae.libCameras = []
        @dae.libImages = []
        @dae.libVisualScenes = []
        @dae.libAnimations = []
        @dae.asset = null
        @dae.scene = null

        # Created three.js objects
        @threejs = {}
        @threejs.scene = null
        @threejs.images = []
        @threejs.geometries = []
        @threejs.materials = []

        # Convenience
        @scene = null  # A shortcut to @threejs.scene for compatibility with the three.js collada loader

#   Sets the file URL
#
#>  setUrl :: (String) ->
    setUrl : (url) ->
        if url?
            @_url = url
            parts = url.split "/" 
            parts.pop()
            @_baseUrl = (if parts.length < 1 then "." else parts.join "/") + "/"
        else
            @_url = ""
            @_baseUrl = ""
        return

    getLibInfo : (lib, indent, libname) ->
        return "" unless lib?
        output = graphNodeString indent, libname + " <#{libname}>\n"
        numElements = 0
        for child in lib
            output += getNodeInfo child, indent+1, ""
            numElements += 1
        if numElements > 0 then return output else return ""

    getInfo : (indent, prefix) ->
        output = "<collada url='#{@url}'>\n"
        output += getNodeInfo @dae.asset, indent+1, "asset "
        output += getNodeInfo @dae.scene, indent+1, "scene "
        output += @getLibInfo @dae.libEffects,      indent+1, "library_effects"
        output += @getLibInfo @dae.libMaterials,    indent+1, "library_materials"
        output += @getLibInfo @dae.libGeometries,   indent+1, "library_geometries"
        output += @getLibInfo @dae.libControllers,  indent+1, "library_controllers"
        output += @getLibInfo @dae.libLights,       indent+1, "library_lights"
        output += @getLibInfo @dae.libCameras,      indent+1, "library_cameras"
        output += @getLibInfo @dae.libImages,       indent+1, "library_images"
        output += @getLibInfo @dae.libVisualScenes, indent+1, "library_visual_scenes"
        output += @getLibInfo @dae.libAnimations  , indent+1, "library_animations"
        return output

#==============================================================================
# SECTION: PRIVATE METHODS - LOG OUTPUT
#==============================================================================

#   Report an unexpected child element
#
#>  _reportUnexpectedChild :: (XMLElement, XMLElement) ->
    _reportUnexpectedChild : (parent, child) ->
        @_log "Skipped unknown <#{parent.nodeName}> child <#{child.nodeName}>.", ColladaLoader2.messageWarning
        return

#   Report an unhandled extra element
#
#>  _reportUnhandledExtra :: (XMLElement, XMLElement) ->
    _reportUnhandledExtra : (parent, child) ->
        @_log "Skipped element <#{parent.nodeName}>/<#{child.nodeName}>. Element is legal, but not handled by this loader.", ColladaLoader2.messageWarning
        return

#==============================================================================
# SECTION: PRIVATE METHODS - EXTRACTING ELEMENT DATA
#==============================================================================

#   Returns the value of an attribute as a float
#
#>  _getAttributeAsFloat :: (XMLElement, String, Number) -> Number
    _getAttributeAsFloat : (el, name, defaultValue) ->
        data = el.getAttribute name
        if data? then return parseFloat data
        else return defaultValue

#   Returns the value of an attribute as an integer
#
#>  _getAttributeAsInt :: (XMLElement, String, Number) -> Number
    _getAttributeAsInt : (el, name, defaultValue) ->
        data = el.getAttribute name
        if data? then return parseInt data, 10
        else return defaultValue

#==============================================================================
# SECTION: PRIVATE METHODS - HYPERLINK MANAGEMENT
#==============================================================================

#   Inserts a new URL link target
#
#>  _addUrlTarget :: (ColladaObject, String, Boolean) ->
    _addUrlTarget : (object, lib, needsId) ->
        if lib? then lib.push object

        id = object.id
        if not id?
            if needsId then @_log "Object has no ID.", ColladaLoader2.messageError
            return
        if @dae.ids[id]?
            @_log "There is already an object with ID #{id}.", ColladaLoader2.messageError
            return
        @dae.ids[id] = object
        return

#   Resolves a URL link
#
#>  _resolveUrlLink :: (ColladaUrlLink) -> Boolean
    _resolveUrlLink : (link) ->
        link.object = @dae.ids[link.url]
        if not link.object?
            @_log "Could not resolve URL ##{link.url}", ColladaLoader2.messageError
            return false
        return true

#   Inserts a new FX link target
#
#>  _addFxTarget :: (ColladaObject, ColladaObject) ->
    _addFxTarget : (object, scope) ->
        sid = object.sid
        if not sid?
            @_log "Cannot add a FX target: object has no SID.", ColladaLoader2.messageError
            return
        if scope.sids[sid]?
            @_log "There is already an FX target with SID #{sid}.", ColladaLoader2.messageError
            return
        object.fxScope = scope
        scope.sids[sid] = object
        return

#   Resolves an FX link
#
#>  _resolveFxLink :: (ColladaFxLink) -> Boolean
    _resolveFxLink : (link) ->
        scope = link.scope

        while not link.object? and scope?
            link.object = scope.sids[link.url]
            scope = scope.fxScope

        if not link.object?
            @_log "Could not resolve FX parameter ##{link.url}", ColladaLoader2.messageError
            return false
        return true

#   Inserts a new SID link target
#
#>  _addSidTarget :: (ColladaObject, ColladaObject) ->
    _addSidTarget : (object, parent) ->
        if not parent.sidChildren? then parent.sidChildren = []
        parent.sidChildren.push object
        return

#   Performs a breadth-first search for an sid, starting with the root node
#
#>  _findSidTarget :: (Object, String) -> Object
    _findSidTarget: (root, sidString) ->
        # Step 1: find all sid parts
        sids = sidString.split "/"

        # Step 2: For each element in the SID path, perform a breadth-first search
        parentObject = root
        childObject = null
        for sid in sids
            queue = [parentObject]
            while queue.length isnt 0
                front = queue.shift()
                if front.sid is sid
                    childObject = front
                    break
                if front.sidChildren?
                    queue.push sidChild for sidChild in front.sidChildren
            if not childObject?
                return null
            parentObject = childObject
        return childObject

#   Resolves an SID link
#
#>  _resolveSidLink :: (ColladaSidLink) -> Boolean
    _resolveSidLink : (link) ->
        # Step 1: Find the base URL target
        baseObject = @dae.ids[link.id]
        if not baseObject?
            @_log "Could not resolve SID ##{link.url}, missing base ID #{link.id}", ColladaLoader2.messageError
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
                if front.sidChildren?
                    queue.push sidChild for sidChild in front.sidChildren
            if not childObject?
                @_log "Could not resolve SID ##{link.url}, missing SID part #{sid}", ColladaLoader2.messageError
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
            else if link instanceof ColladaSidLink then @_resolveSidLink link
            else if link instanceof ColladaFxLink  then @_resolveFxLink  link
            else @_log "Trying to resolve an object that is not a link", ColladaLoader2.messageError
        if type? and link.object? and not (link.object instanceof type)
            @_log "Link #{link.url} does not link to a #{type.name}", ColladaLoader2.messageError
        return link.object

#==============================================================================
# SECTION: PRIVATE METHODS - PARSING XML ELEMENTS
#==============================================================================

#   Parses the COLLADA XML document
#
#>  _parseXml :: (XMLDocument) ->
    _parseXml : (doc) ->
        colladaElement = doc.childNodes[0]
        if colladaElement?.nodeName?.toUpperCase() is "COLLADA"
            @_parseCollada colladaElement
        else
            @_log "Can not parse document, top level element is not <COLLADA>.", ColladaLoader2.messageError
        return

#   Parses a <COLLADA> element
#
#>  _parseCollada :: (XMLElement) ->
    _parseCollada : (el) ->
        for child in el.childNodes when child.nodeType is 1
            switch child.nodeName
                when "asset"                 then @_parseAsset child
                when "scene"                 then @_parseScene child
                when "library_effects"       then @_parseLibEffect child
                when "library_materials"     then @_parseLibMaterial child
                when "library_geometries"    then @_parseLibGeometry child
                when "library_images"        then @_parseLibImage child
                when "library_visual_scenes" then @_parseLibVisualScene child
                when "library_controllers"   then @_parseLibController child
                when "library_animations"    then @_parseLibAnimation child
                when "library_lights"        then @_parseLibLight child
                when "library_cameras"       then @_parseLibCamera child
                else @_reportUnexpectedChild el, child
        return

#   Parses an <asset> element.
#
#>  _parseAsset :: (XMLElement) ->
    _parseAsset : (el) ->
        if not @dae.asset then @dae.asset = new ColladaAsset()
        for child in el.childNodes when child.nodeType is 1
            switch child.nodeName
                when "unit"
                    @dae.asset.unit = @_getAttributeAsFloat child, "meter"
                when "up_axis"
                    @dae.asset.upAxis = child.textContent.toUpperCase().charAt(0)
                when "contributor", "created", "modified", "revision", "title", "subject", "keywords"
                    # Known elements that can be safely ignored
                else @_reportUnexpectedChild el, child
        return

#   Parses an <scene> element.
#
#>  _parseScene :: (XMLElement) ->
    _parseScene : (el) ->
        for child in el.childNodes when child.nodeType is 1
            switch child.nodeName
                when "instance_visual_scene" then @dae.scene = new ColladaUrlLink child.getAttribute "url"
                else @_reportUnexpectedChild el, child
        return

#   Parses an <library_visual_scenes> element.
#
#>  _parseLibVisualScene :: (XMLElement) ->
    _parseLibVisualScene : (el) ->
        for child in el.childNodes when child.nodeType is 1
            switch child.nodeName
                when "visual_scene" then @_parseVisualScene child
                else @_reportUnexpectedChild el, child
        return

#   Parses an <visual_scene> element 
#
#>  _parseVisualScene :: (XMLElement) ->
    _parseVisualScene : (el) ->
        scene = new ColladaVisualScene
        scene.id = el.getAttribute "id"
        @_addUrlTarget scene, @dae.libVisualScenes, true

        for child in el.childNodes when child.nodeType is 1
            switch child.nodeName
                when "node" then @_parseSceneNode scene, child
                else @_reportUnexpectedChild el, child
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
        node.parent = parent
        parent.children.push node
        @_addUrlTarget node, null, false
        @_addSidTarget node, parent

        for child in el.childNodes when child.nodeType is 1
            switch child.nodeName
                when "instance_geometry"
                    @_parseInstanceGeometry node, child
                when "instance_controller"
                    @_parseInstanceController node, child
                when "instance_light"
                    @_parseInstanceLight node, child
                when "instance_camera"
                    @_parseInstanceCamera node, child
                when "matrix", "rotate", "translate", "scale"
                    @_parseTransformElement node, child
                when "node"
                    @_parseSceneNode node, child
                else @_reportUnexpectedChild el, child
        return

#   Parses an <instance_geometry> element.
#
#>  _parseInstanceGeometry :: (ColladaVisualSceneNode, XMLElement) -> 
    _parseInstanceGeometry : (parent, el) ->
        geometry = new ColladaInstanceGeometry()
        geometry.geometry = new ColladaUrlLink el.getAttribute "url"
        geometry.sid = el.getAttribute "sid"
        parent.geometries.push geometry
        @_addSidTarget geometry, parent

        for child in el.childNodes when child.nodeType is 1
            switch child.nodeName
                when "bind_material" then @_parseBindMaterial geometry, child
                else @_reportUnexpectedChild el, child
        return

#   Parses an <instance_controller> element.
#
#>  _parseInstanceController :: (ColladaVisualSceneNode, XMLElement) -> 
    _parseInstanceController : (parent, el) ->
        controller = new ColladaInstanceController()
        controller.controller = new ColladaUrlLink el.getAttribute "url"
        controller.sid = el.getAttribute "sid"
        controller.name  = el.getAttribute "name"
        parent.controllers.push controller
        @_addSidTarget controller, parent

        for child in el.childNodes when child.nodeType is 1
            switch child.nodeName
                when "skeleton" then controller.skeletons.push new ColladaUrlLink child.textContent
                when "bind_material" then @_parseBindMaterial controller, child
                else @_reportUnexpectedChild el, child
        return
        
#   Parses an <bind_material> element.
#
#>  _parseBindMaterial :: (ColladaInstanceGeometry, XMLElement) -> 
    _parseBindMaterial : (parent, el) ->
        for child in el.childNodes when child.nodeType is 1
            switch child.nodeName
                when "technique_common" then @_parseBindMaterialTechnique parent, child
                else @_reportUnexpectedChild el, child
        return

#   Parses an <bind_material>/<technique_common> element.
#
#>  _parseBindMaterialTechnique :: (ColladaInstanceGeometry, XMLElement) -> 
    _parseBindMaterialTechnique : (parent, el) ->
        for child in el.childNodes when child.nodeType is 1
            switch child.nodeName
                when "instance_material" then @_parseInstanceMaterial parent, child
                else @_reportUnexpectedChild el, child
        return

#   Parses an <instance_material> element child.
#
#>  _parseInstanceMaterial :: (ColladaInstanceGeometry, XMLElement) -> 
    _parseInstanceMaterial : (parent, el) ->
        material = new ColladaInstanceMaterial
        material.symbol   = el.getAttribute "symbol"
        material.material = new ColladaUrlLink el.getAttribute "target"
        parent.materials.push material
        @_addSidTarget material, parent

        for child in el.childNodes when child.nodeType is 1
            switch child.nodeName
                when "bind_vertex_input"
                    semantic      = child.getAttribute "semantic"
                    inputSemantic = child.getAttribute "input_semantic"
                    inputSet      = child.getAttribute "input_set"
                    if inputSet? then inputSet = parseInt inputSet, 10
                    material.vertexInputs[semantic] = {inputSemantic:inputSemantic, inputSet:inputSet}
                when "bind"
                    semantic = child.getAttribute "semantic"
                    target   = new ColladaSidLink null, child.getAttribute "target"
                    material.params[semantic] = {target:target}
                else @_reportUnexpectedChild el, child
        return

#   Parses a transformation element.
#
#>  _parseTransformElement :: (ColladaVisualSceneNode, XMLElement) -> 
    _parseTransformElement : (parent, el) ->
        transform = new ColladaNodeTransform
        transform.sid  = el.getAttribute "sid"
        transform.type = el.nodeName
        transform.node = parent
        parent.transformations.push transform
        @_addSidTarget transform, parent
        @dae.animationTargets.push transform
        
        transform.data = _strToFloats el.textContent
        expectedDataLength = 0
        switch transform.type
            when "matrix"    then expectedDataLength = 16
            when "rotate"    then expectedDataLength = 4
            when "translate" then expectedDataLength = 3
            when "scale"     then expectedDataLength = 3
            when "skew"      then expectedDataLength = 7
            when "lookat"    then expectedDataLength = 9
            else @_log "Unknown transformation type #{transform.type}.", ColladaLoader2.messageError
        if transform.data.length isnt expectedDataLength
            @_log "Wrong number of elements for transformation type '#{transform.type}': expected #{expectedDataLength}, found #{transform.data.length}", ColladaLoader2.messageError
        return
        
#   Parses a <instance_light> element.
#
#>  _parseInstanceLight :: (ColladaVisualSceneNode, XMLElement) -> 
    _parseInstanceLight : (parent, el) ->
        light = new ColladaInstanceLight()
        light.light = new ColladaUrlLink el.getAttribute "url"
        light.sid = el.getAttribute "sid"
        light.name  = el.getAttribute "name"
        parent.lights.push light
        @_addSidTarget light, parent

        for child in el.childNodes when child.nodeType is 1
            switch child.nodeName
                when "extra" then @_reportUnhandledExtra el, child
                else @_reportUnexpectedChild el, child
        return

#   Parses a <instance_camera> element.
#
#>  _parseInstanceCamera :: (ColladaVisualSceneNode, XMLElement) -> 
    _parseInstanceCamera : (parent, el) ->
        camera = new ColladaInstanceCamera()
        camera.camera = new ColladaUrlLink el.getAttribute "url"
        camera.sid = el.getAttribute "sid"
        camera.name  = el.getAttribute "name"
        parent.cameras.push camera
        @_addSidTarget camera, parent

        for child in el.childNodes when child.nodeType is 1
            switch child.nodeName
                when "extra" then @_reportUnhandledExtra el, child
                else @_reportUnexpectedChild el, child
        return

#   Parses an <library_effects> element.
#
#>  _parseLibEffect :: (XMLElement) ->
    _parseLibEffect : (el) ->
        for child in el.childNodes when child.nodeType is 1
            switch child.nodeName
                when "effect" then @_parseEffect child
                else @_reportUnexpectedChild el, child
        return

#   Parses an <effect> element.
#
#>  _parseEffect :: (XMLElement) ->
    _parseEffect : (el) ->
        effect = new ColladaEffect
        effect.id = el.getAttribute "id"
        @_addUrlTarget effect, @dae.libEffects, true

        for child in el.childNodes when child.nodeType is 1
            switch child.nodeName
                when "profile_COMMON"
                    @_parseEffectProfileCommon effect, child
                when "profile"
                    @_log "Skipped non-common effect profile for effect #{effect.id}.", ColladaLoader2.messageWarning
                when "extra"
                    # Do nothing, many exporters put here non-interesting data
                else @_reportUnexpectedChild el, child
        return

#   Parses an <effect>/<profile_COMMON> element.
#
#>  _parseEffectProfileCommon :: (ColladaEffect, XMLElement) ->
    _parseEffectProfileCommon : (effect, el) ->
        
        for child in el.childNodes when child.nodeType is 1
            switch child.nodeName
                when "newparam" then @_parseEffectNewparam effect, child
                when "technique" then @_parseEffectTechnique effect, child
                when "extra" then @_parseTechniqueExtra effect.technique, "COMMON", child
                else @_reportUnexpectedChild el, child
        return

#   Parses an <newparam> child element.
#
#>  _parseEffectNewparam :: (ColladaEffect|ColladaTechnique, XMLElement) ->
    _parseEffectNewparam : (scope, el) ->
        sid = el.getAttribute "sid"
        for child in el.childNodes when child.nodeType is 1
            switch child.nodeName
                when "surface" then @_parseEffectSurface scope, sid, child
                when "sampler2D" then @_parseEffectSampler scope, sid, child
                else @_reportUnexpectedChild el, child
        return  

#   Parses a <surface> element.
#
#>  _parseEffectSurface :: (ColladaEffect|ColladaTechnique, String, XMLElement) ->
    _parseEffectSurface : (scope, sid, el) ->
        surface = new ColladaEffectSurface
        surface.type = el.getAttribute "type"
        surface.sid = sid
        @_addFxTarget surface, scope

        for child in el.childNodes when child.nodeType is 1
            switch child.nodeName
                when "init_from"       then surface.initFrom       = new ColladaUrlLink child.textContent
                when "format"          then surface.format         = child.textContent
                when "size"            then surface.size           = _strToFloats child.textContent
                when "viewport_ratio"  then surface.viewportRatio  = _strToFloats child.textContent
                when "mip_levels"      then surface.mipLevels      = parseInt child.textContent, 10
                when "mipmap_generate" then surface.mipmapGenerate = child.textContent
                else @_reportUnexpectedChild el, child
        return

#   Parses an <newparam><sampler> element.
#
#>  _parseEffectSampler :: (ColladaEffect|ColladaTechnique, String, XMLElement) ->
    _parseEffectSampler : (scope, sid, el) ->
        sampler = new ColladaEffectSampler
        sampler.sid = sid
        @_addFxTarget sampler, scope

        for child in el.childNodes when child.nodeType is 1
            switch child.nodeName
                when "source"          then sampler.surface        = new ColladaFxLink child.textContent, scope
                when "instance_image"  then sampler.image          = new ColladaUrlLink child.getAttribute "url"
                when "wrap_s"          then sampler.wrapS          = child.textContent
                when "wrap_t"          then sampler.wrapT          = child.textContent
                when "minfilter"       then sampler.minfilter      = child.textContent
                when "magfilter"       then sampler.magfilter      = child.textContent
                when "border_color"    then sampler.borderColor    = _strToFloats child.textContent
                when "mipmap_maxlevel" then sampler.mipmapMaxLevel = parseInt   child.textContent, 10
                when "mipmap_bias"     then sampler.mipmapBias     = parseFloat child.textContent
                else @_reportUnexpectedChild el, child
        return

#   Parses an <technique> element.
#
#>  _parseEffectTechnique :: (ColladaEffect, XMLElement) ->
    _parseEffectTechnique : (effect, el) ->
        technique = new ColladaEffectTechnique
        technique.sid = el.getAttribute "sid"
        @_addFxTarget technique, effect
        effect.technique = technique

        for child in el.childNodes when child.nodeType is 1
            switch child.nodeName
                when "blinn", "phong", "lambert", "constant"
                    technique.shading = child.nodeName
                    @_parseTechniqueParam technique, "COMMON", child
                when "extra"
                    @_parseTechniqueExtra technique, "COMMON", child
                else @_reportUnexpectedChild el, child
        return

#   Parses an <technique>/<blinn|phong|lambert|constant> element.
#
#>  _parseTechniqueParam :: (ColladaTechnique, String, XMLElement) ->
    _parseTechniqueParam : (technique, profile, el) ->
        for child in el.childNodes when child.nodeType is 1
            switch child.nodeName
                when "newparam"
                    @_parseEffectNewparam technique, child
                when "emission", "ambient", "diffuse", "specular", "reflective"
                    @_parseEffectColorOrTexture technique, child
                when "shininess", "reflectivity", "transparency", "index_of_refraction"
                    technique[child.nodeName] = parseFloat child.childNodes[1].textContent
                when "transparent"
                    @_parseEffectColorOrTexture technique, child
                    technique.transparent.opaque = child.getAttribute "opaque"
                when "bump"
                    # OpenCOLLADA extension: bump mapping
                    @_parseEffectColorOrTexture technique, child
                    technique.bump.bumptype = child.getAttribute "bumptype"
                when "double_sided"
                    technique.doubleSided = if parseInt(child.textContent, 10) is 1 then true else false
                else @_reportUnexpectedChild el, child unless profile isnt "COMMON"
        return

#   Parses an <technique>/<extra> element.
#
#>  _parseTechniqueExtra :: (ColladaTechnique, String, XMLElement) ->
    _parseTechniqueExtra : (technique, profile, el) ->
        for child in el.childNodes when child.nodeType is 1
            switch child.nodeName
                when "technique"
                    profile = child.getAttribute "profile"
                    @_parseTechniqueParam technique, profile, child
                else @_reportUnexpectedChild el, child
        return
        
#   Parses an color or texture element.
#
#>  _parseEffectColorOrTexture :: (ColladaTechnique, XMLElement) ->
    _parseEffectColorOrTexture : (technique, el) ->
        name = el.nodeName
        colorOrTexture = technique[name]
        if not colorOrTexture?
            colorOrTexture = new ColladaColorOrTexture()
            technique[name] = colorOrTexture

        for child in el.childNodes when child.nodeType is 1
            switch child.nodeName
                when "color"
                    colorOrTexture.color = _strToColor child.textContent
                when "texture"
                    texture = child.getAttribute "texture"
                    colorOrTexture.textureSampler = new ColladaFxLink texture, technique
                    colorOrTexture.texcoord = child.getAttribute "texcoord"
                else @_reportUnexpectedChild el, child
        return

#   Parses a <lib_materials> element.
#
#>  _parseLibMaterial :: (XMLElement) ->
    _parseLibMaterial : (el) ->
        for child in el.childNodes when child.nodeType is 1
            switch child.nodeName
                when "material" then @_parseMaterial child
                else @_reportUnexpectedChild el, child
        return

#   Parses a <material> element.
#
#>  _parseMaterial :: (XMLElement) ->
    _parseMaterial : (el) ->
        material = new ColladaMaterial
        material.id   = el.getAttribute "id"
        material.name = el.getAttribute "name"
        @_addUrlTarget material, @dae.libMaterials, true

        for child in el.childNodes when child.nodeType is 1
            switch child.nodeName
                when "instance_effect" then material.effect = new ColladaUrlLink child.getAttribute "url"
                else @_reportUnexpectedChild el, child
        return

#   Parses a <library_geometries> element.
#
#>  _parseLibGeometry :: (XMLElement) ->
    _parseLibGeometry : (el) ->
        for child in el.childNodes when child.nodeType is 1
            switch child.nodeName
                when "geometry" then @_parseGeometry child
                else @_reportUnexpectedChild el, child
        return

#   Parses a <geometry> element.
#
#>  _parseGeometry :: (XMLElement) ->
    _parseGeometry : (el) ->
        geometry = new ColladaGeometry()
        geometry.id   = el.getAttribute "id"
        geometry.name = el.getAttribute "name"
        @_addUrlTarget geometry, @dae.libGeometries, true

        for child in el.childNodes when child.nodeType is 1
            switch child.nodeName
                when "mesh" then @_parseMesh geometry, child
                when "convex_mesh", "spline"
                    @_log "Geometry type #{child.nodeName} not supported.", ColladaLoader2.messageError
                when "extra" then @_parseGeometryExtra geometry, child
                else @_reportUnexpectedChild el, child
        return
        
#   Parses a <mesh> element child.
#
#>  _parseMesh :: (ColladaGeometry, XMLElement) ->
    _parseMesh : (geometry, el) ->
        for child in el.childNodes when child.nodeType is 1
            switch child.nodeName
                when "source"    then @_parseSource    geometry, child
                when "vertices"  then @_parseVertices  geometry, child
                when "triangles", "polylist", "polygons" then @_parseTriangles geometry, child
                when "lines", "linestrips", "trifans", "tristrips"
                    @_log "Geometry primitive type #{child.nodeName} not supported.", ColladaLoader2.messageError
                else @_reportUnexpectedChild el, child
        return

#   Parses an <geometry>/<extra> element.
#
#>  _parseGeometryExtra :: (ColladaGeometry, XMLElement) ->
    _parseGeometryExtra : (geometry, el) ->
        for child in el.childNodes when child.nodeType is 1
            switch child.nodeName
                when "technique"
                    profile = child.getAttribute "profile"
                    @_parseGeometryExtraTechnique geometry, profile, child
                else @_reportUnexpectedChild el, child
        return

#   Parses an <geometry>/<extra>/<technique> element.
#
#>  _parseGeometryExtraTechnique :: (ColladaGeometry, XMLElement) ->
    _parseGeometryExtraTechnique : (geometry, profile, el) ->
        for child in el.childNodes when child.nodeType is 1
            switch child.nodeName
                when "double_sided"
                    geometry.doubleSided = el.textContent is "1"
        return

#   Parses a <source> element.
#
#>  _parseSource :: (XMLElement) ->
    _parseSource : (parent, el) ->
        source = new ColladaSource
        source.id   = el.getAttribute "id"
        source.name = el.getAttribute "name"
        @_addUrlTarget source, parent.sources, true

        for child in el.childNodes when child.nodeType is 1
            switch child.nodeName
                when "bool_array" 
                    source.sourceId = child.getAttribute "id"
                    source.data = _strToBools child.textContent
                when "float_array"
                    source.sourceId = child.getAttribute "id"
                    source.data = _strToFloats child.textContent
                when "int_array"
                    source.sourceId = child.getAttribute "id"
                    source.data = _strToInts child.textContent
                when "IDREF_array", "Name_array"
                    source.sourceId = child.getAttribute "id"
                    source.data = _strToStrings child.textContent
                when "technique_common"
                    @_parseSourceTechniqueCommon source, child
                when "technique"
                    # This element contains non-standard information 
                    ;
                else @_reportUnexpectedChild el, child
        return

#   Parses a <vertices> element.
#
#>  _parseVertices :: (XMLElement) ->
    _parseVertices : (geometry, el) ->
        vertices = new ColladaVertices
        vertices.id   = el.getAttribute "id"
        vertices.name = el.getAttribute "name"
        @_addUrlTarget vertices, null, true
        geometry.vertices = vertices

        for child in el.childNodes when child.nodeType is 1
            switch child.nodeName
                when "input" then vertices.inputs.push @_parseInput child
                else @_reportUnexpectedChild el, child
        return

#   Parses a <triangles> element.
#
#>  _parseTriangles :: (XMLElement) ->
    _parseTriangles : (geometry, el) ->
        triangles = new ColladaTriangles
        triangles.name = el.getAttribute "name"
        triangles.material = el.getAttribute "material"
        triangles.count = @_getAttributeAsInt el, "count"
        triangles.type = el.nodeName
        geometry.triangles.push triangles

        for child in el.childNodes when child.nodeType is 1
            switch child.nodeName
                when "input"  then triangles.inputs.push @_parseInput child
                when "vcount" then triangles.vcount = _strToInts child.textContent
                when "p"      then triangles.indices = _strToInts child.textContent
                else @_reportUnexpectedChild el, child
        return triangles


#   Parses a <source>/<technique_common> element child.
#
#>  _parseSourceTechniqueCommon :: (ColladaSource, XMLElement) ->
    _parseSourceTechniqueCommon : (source, el) ->
        for child in el.childNodes when child.nodeType is 1
            switch child.nodeName
                when "accessor" then @_parseAccessor source, child
                else @_reportUnexpectedChild el, child
        return

#   Parses an <accessor> element.
#
#>  _parseAccessor :: (ColladaSource, XMLElement) ->
    _parseAccessor : (source, el) ->
        sourceId = el.getAttribute "source"
        source.count  = el.getAttribute "count"
        source.stride = @_getAttributeAsInt el, "stride", 1
        if sourceId isnt "#"+source.sourceId
            @_log "Non-local sources not supported, source data will be empty", ColladaLoader2.messageError

        for child in el.childNodes when child.nodeType is 1
            switch child.nodeName
                when "param"
                    name = child.getAttribute "name"
                    type = child.getAttribute "type"
                    source.params[name] = type
                else @_reportUnexpectedChild el, child
        return

#   Creates a ColladaInput object from an <input> element.
#
#>  _parseInput :: (XMLElement) -> ColladaInput
    _parseInput : (el) ->
        input = new ColladaInput
        input.semantic = el.getAttribute "semantic"
        input.source   = new ColladaUrlLink el.getAttribute "source"
        input.offset   = @_getAttributeAsInt el, "offset"
        input.set      = @_getAttributeAsInt el, "set"
        return input

#   Parses an <library_images> element.
#
#>  _parseLibImage :: (XMLElement) ->
    _parseLibImage : (el) ->
        for child in el.childNodes when child.nodeType is 1
            switch child.nodeName
                when "image" then @_parseImage child
                else @_reportUnexpectedChild el, child
        return

#   Parses an <image> element.
#
#>  _parseImage :: (XMLElement) ->
    _parseImage : (el) ->
        image = new ColladaImage
        image.id = el.getAttribute "id"
        @_addUrlTarget image, @dae.libImages, true

        for child in el.childNodes when child.nodeType is 1
            switch child.nodeName
                when "init_from" then image.initFrom = child.textContent
                else @_reportUnexpectedChild el, child
        return

#   Parses an <library_controllers> element.
#
#>  _parseLibController :: (XMLElement) ->
    _parseLibController : (el) ->
        for child in el.childNodes when child.nodeType is 1
            switch child.nodeName
                when "controller" then @_parseController child
                else @_reportUnexpectedChild el, child
        return

#   Parses a <controller> element.
#
#>  _parseController :: (XMLElement) ->
    _parseController : (el) ->
        controller = new ColladaController
        controller.id = el.getAttribute "id"
        controller.name = el.getAttribute "name"
        @_addUrlTarget controller, @dae.libControllers, true

        for child in el.childNodes when child.nodeType is 1
            switch child.nodeName
                when "skin" then @_parseSkin controller, child
                when "morph" then @_parseMorph controller, child
                else @_reportUnexpectedChild el, child
        return

#   Parses a <morph> element.
#
#>  _parseMorph :: (XMLElement) ->
    _parseMorph : (parent, el) ->
        @_log "Morph controllers not implemented", ColladaLoader2.messageError
        return

#   Parses a <skin> element.
#
#>  _parseSkin :: (XMLElement) ->
    _parseSkin : (parent, el) ->
        skin = new ColladaSkin
        skin.source = new ColladaUrlLink el.getAttribute "source"
        if parent.skin? or parent.morph?
            @_log "Controller already has a skin or morph", ColladaLoader2.messageError
        parent.skin = skin

        for child in el.childNodes when child.nodeType is 1
            switch child.nodeName
                when "bind_shape_matrix" then @_parseBindShapeMatrix skin, child
                when "source" then @_parseSource skin, child
                when "joints" then @_parseJoints skin, child
                when "vertex_weights" then @_parseVertexWeights skin, child
                else @_reportUnexpectedChild el, child
        return

#   Parses a <bind_shape_matrix> element.
#
#>  _parseBindShapeMatrix :: (ColladaSkin, XMLElement) ->
    _parseBindShapeMatrix: (parent, el) ->
        parent.bindShapeMatrix = _strToFloats el.textContent
        return

#   Parses a <joints> element.
#
#>  _parseJoints :: (XMLElement) ->
    _parseJoints : (parent, el) ->
        joints = new ColladaJoints
        if parent.joints?
            @_log "Skin already has a joints array", ColladaLoader2.messageError
        parent.joints = joints

        inputs = []
        for child in el.childNodes when child.nodeType is 1
            switch child.nodeName
                when "input" then inputs.push @_parseInput child
                else @_reportUnexpectedChild el, child

        for input in inputs
            switch input.semantic
                when "JOINT" then joints.joints = input
                when "INV_BIND_MATRIX" then joints.invBindMatrices = input
                else @_log "Unknown joints input semantic #{input.semantic}", ColladaLoader2.messageError
        return

#   Parses a <vertex_weights> element.
#
#>  _parseVertexWeights :: (XMLElement) ->
    _parseVertexWeights : (parent, el) ->
        weights = new ColladaVertexWeights
        weights.count = parseInt el.getAttribute("count"), 10
        if parent.vertexWeights?
            @_log "Skin already has a vertex weight array", ColladaLoader2.messageError
        parent.vertexWeights = weights

        inputs = []
        for child in el.childNodes when child.nodeType is 1
            switch child.nodeName
                when "input"  then inputs.push @_parseInput child
                when "vcount" then weights.vcount = _strToInts child.textContent
                when "v"      then weights.v = _strToInts child.textContent
                else @_reportUnexpectedChild el, child

        for input in inputs
            switch input.semantic
                when "JOINT" then weights.joints = input
                when "WEIGHT" then weights.weights = input
                else @_log "Unknown vertex weight input semantic #{input.semantic}" , ColladaLoader2.messageError
        return

#   Parses an <library_animations> element.
#
#>  _parseLibAnimation :: (XMLElement) ->
    _parseLibAnimation : (el) ->
        for child in el.childNodes when child.nodeType is 1
            switch child.nodeName
                when "animation" then @_parseAnimation null, child
                else @_reportUnexpectedChild el, child
        return

#   Parses an <animation> element.
#
#>  _parseAnimation :: (XMLElement) ->
    _parseAnimation : (parent, el) ->
        animation = new ColladaAnimation
        animation.id = el.getAttribute "id"
        animation.name = el.getAttribute "name"
        animation.parent = parent
        if parent?
            animation.rootId = parent.rootId
            animation.rootName = parent.rootName
        else
            animation.rootId = animation.id
            animation.rootName = animation.name

        @_addUrlTarget animation, parent?.animations or @dae.libAnimations, false

        for child in el.childNodes when child.nodeType is 1
            switch child.nodeName
                when "animation" then @_parseAnimation animation, child
                when "source" then @_parseSource animation, child
                when "sampler" then @_parseSampler animation, child
                when "channel" then @_parseChannel animation, child
                else @_reportUnexpectedChild el, child
        return

#   Parses an <sampler> element.
#
#>  _parseSampler :: (XMLElement) ->
    _parseSampler : (parent, el) ->
        sampler = new ColladaSampler
        sampler.id = el.getAttribute "id"
        if sampler.id? then @_addUrlTarget sampler, parent.samplers, false

        inputs = []
        for child in el.childNodes when child.nodeType is 1
            switch child.nodeName
                when "input" then inputs.push @_parseInput child
                else @_reportUnexpectedChild el, child

        for input in inputs
            switch input.semantic
                when "INPUT" then sampler.input = input
                when "OUTPUT" then sampler.outputs.push input
                when "INTERPOLATION" then sampler.interpolation = input
                when "IN_TANGENT" then sampler.inTangents.push input
                when "OUT_TANGENT" then sampler.outTangents.push input
                else @_log "Unknown sampler input semantic #{input.semantic}" , ColladaLoader2.messageError
        return

#   Parses an <channel> element.
#
#>  _parseChannel :: (XMLElement) ->
    _parseChannel : (parent, el) ->
        channel = new ColladaChannel
        channel.source = new ColladaUrlLink el.getAttribute "source"
        channel.target = new ColladaSidLink parent.id, el.getAttribute "target"
        parent.channels.push channel
        channel.animation = parent

        for child in el.childNodes when child.nodeType is 1
            @_reportUnexpectedChild el, child
        return

#   Parses a <library_lights> element.
#
#>  _parseLibLight :: (XMLElement) ->
    _parseLibLight : (el) ->
        for child in el.childNodes when child.nodeType is 1
            switch child.nodeName
                when "light" then @_parseLight child
                else @_reportUnexpectedChild el, child
        return

#   Parses a <light> element.
#
#>  _parseLight :: (XMLElement) ->
    _parseLight : (el) ->
        light = new ColladaLight()
        light.id = el.getAttribute "id"
        light.name = el.getAttribute "name"
        if light.id? then @_addUrlTarget light, @dae.libLights, true  

        for child in el.childNodes when child.nodeType is 1
            switch child.nodeName
                when "technique_common" then @_parseLightTechniqueCommon child, light
                when "extra"            then @_reportUnhandledExtra el, child
                else @_reportUnexpectedChild el, child
        return

#   Parses a <light>/<technique_common> element.
#
#>  _parseLightTechniqueCommon :: (XMLElement, ColladaLight) ->
    _parseLightTechniqueCommon : (el, light) ->
        for child in el.childNodes when child.nodeType is 1
            switch child.nodeName
                when "ambient"     then @_parseLightParams child, "COMMON", light
                when "directional" then @_parseLightParams child, "COMMON", light
                when "point"       then @_parseLightParams child, "COMMON", light
                when "spot"        then @_parseLightParams child, "COMMON", light
                else @_reportUnexpectedChild el, child
        return

#   Parses a <light>/<technique_common>/<...> element.
#
#>  _parseLightParam :: (XMLElement, String, ColladaLight) ->
    _parseLightParams : (el, profile, light) ->
        light.type = el.nodeName
        for child in el.childNodes when child.nodeType is 1
            switch child.nodeName
                when "color"                 then @_parseLightColor child, profile, light
                when "constant_attenuation"  then @_parseLightParam child, profile, light
                when "linear_attenuation"    then @_parseLightParam child, profile, light
                when "quadratic_attenuation" then @_parseLightParam child, profile, light
                when "falloff_angle"         then @_parseLightParam child, profile, light
                when "falloff_exponent"      then @_parseLightParam child, profile, light
                else @_reportUnexpectedChild el, child
        return

#   Parses a <light>/<...>/<...>/<color> element.
#
#>  _parseLightColor :: (XMLElement, String, ColladaLight) ->
    _parseLightColor : (el, profile, light) ->
        light.color = _strToFloats el.textContent
        return

#   Parses a <light>/<...>/<...>/<...> element.
#
#>  _parseLightParam :: (XMLElement, String, ColladaLight) ->
    _parseLightParam : (el, profile, light) ->
        param = new ColladaLightParam()
        param.sid = el.getAttribute "sid"
        param.name = el.nodeName     
        light.params[param.name] = param
        @_addSidTarget param, light
        param.value = parseFloat el.textContent
        return

#   Parses a <library_cameras> element.
#
#>  _parseLibCamera :: (XMLElement) ->
    _parseLibCamera : (el) ->
        for child in el.childNodes when child.nodeType is 1
            switch child.nodeName
                when "camera" then @_parseCamera child
                when "extra"  then @_reportUnhandledExtra el, child
                else @_reportUnexpectedChild el, child
        return

#   Parses a <camera> element.
#
#>  _parseCamera :: (XMLElement) ->
    _parseCamera : (el) ->
        camera = new ColladaCamera
        camera.id = el.getAttribute "id"
        if camera.id? then @_addUrlTarget camera, @dae.libCameras, true  
        camera.name = el.getAttribute "name"

        for child in el.childNodes when child.nodeType is 1
            switch child.nodeName
                when "asset"   then @_reportUnhandledExtra el, child
                when "optics"  then @_parseCameraOptics child, camera
                when "imager"  then @_reportUnhandledExtra el, child
                when "extra"   then @_reportUnhandledExtra el, child
                else @_reportUnexpectedChild el, child
        return

#   Parses a <camera>/<optics> element.
#
#>  _parseCameraOptics :: (XMLElement, ColladaCamera) ->
    _parseCameraOptics : (el, camera) ->
        for child in el.childNodes when child.nodeType is 1
            switch child.nodeName
                when "technique_common" then @_parseCameraTechniqueCommon child, camera
                when "technique"        then @_reportUnhandledExtra el, child
                when "extra"            then @_reportUnhandledExtra el, child
                else @_reportUnexpectedChild el, child
        return

#   Parses a <camera>/<optics>/<technique_common> element.
#
#>  _parseCameraTechniqueCommon :: (XMLElement, ColladaCamera) ->
    _parseCameraTechniqueCommon : (el, camera) ->
        for child in el.childNodes when child.nodeType is 1
            switch child.nodeName
                when "orthographic" then @_parseCameraParams child, camera
                when "perspective"  then @_parseCameraParams child, camera
                else @_reportUnexpectedChild el, child
        return

#   Parses a <camera>/<optics>/<technique_common>/<...> element.
#
#>  _parseCameraParams :: (XMLElement, ColladaCamera) ->
    _parseCameraParams : (el, camera) ->
        camera.type = el.nodeName

        for child in el.childNodes when child.nodeType is 1
            switch child.nodeName
                when "xmag"         then @_parseCameraParam child, camera
                when "ymag"         then @_parseCameraParam child, camera
                when "xfov"         then @_parseCameraParam child, camera
                when "yfov"         then @_parseCameraParam child, camera
                when "aspect_ratio" then @_parseCameraParam child, camera
                when "znear"       then @_parseCameraParam child, camera
                when "zfar"        then @_parseCameraParam child, camera
                when "extra"        then @_reportUnhandledExtra el, child
                else @_reportUnexpectedChild el, child
        return

#   Parses a <camera>/<optics>/<technique_common>/<...>/<...> element.
#
#>  _parseCameraParam :: (XMLElement, ColladaCamera) ->
    _parseCameraParam : (el, camera) ->
        param = new ColladaCameraParam()
        param.sid = el.getAttribute "sid"
        param.name = el.nodeName     
        camera.params[param.name] = param
        @_addSidTarget param, camera
        param.value = parseFloat el.textContent
        return

#==============================================================================
# SECTION: PRIVATE METHODS - CREATING THREE.JS OBJECTS
#==============================================================================

#   Links all ColladaChannels with their AnimationTargets
#
#>  _linkAnimations :: () ->
    _linkAnimations : () ->
        for target in @dae.animationTargets
            target.initAnimationTarget()
        for animation in @dae.libAnimations
            @_linkAnimationChannels animation
        return

#   Links all ColladaChannels with their AnimationTargets
#
#>  _linkAnimationChannels :: (ColladaAnimation) ->
    _linkAnimationChannels : (animation) ->
        for channel in animation.channels
            # Find the animation target
            # The animation target is for example the translation of a scene graph node
            target = @_getLinkTarget channel.target, ColladaAnimationTarget
            if not target?
                @_log "Animation channel has an invalid target '#{channel.target.url}', animation ignored", ColladaLoader2.messageWarning
                continue

            # Find the animation sampler
            # The sampler defines the animation curve. The animation curve maps time values to target values.
            sampler = @_getLinkTarget channel.source, ColladaSampler
            if not sampler?
                @_log "Animation channel has an invalid sampler '#{channel.source.url}', animation ignored", ColladaLoader2.messageWarning
                continue

            # Find the animation input
            # The input defines the values on the X axis of the animation curve (the time values)
            inputSource = @_getLinkTarget sampler.input?.source
            if not inputSource?
                @_log "Animation channel has no input data, animation ignored", ColladaLoader2.messageWarning
                continue

            # Find the animation outputs
            # The output defines the values on the Y axis of the animation curve (the target values)
            if sampler.outputs.length is 0
                @_log "Animation channel has no output, animation ignored", ColladaLoader2.messageWarning
                continue
            # For some reason, outputs can have more than one dimension, even though the animation target is a single object.
            if sampler.outputs.length > 1
                @_log "Animation channel has more than one output, using only the first output", ColladaLoader2.messageWarning
            output = sampler.outputs[0]
            outputSource = @_getLinkTarget output?.source
            if not outputSource?
                @_log "Animation channel has no output data, animation ignored", ColladaLoader2.messageWarning
                continue

            # Create a convenience object
            threejsChannel = new ThreejsAnimationChannel
            threejsChannel.outputData = outputSource.data
            threejsChannel.inputData = inputSource.data
            threejsChannel.stride = outputSource.stride
            threejsChannel.animation = animation

            # Resolve the sub-component syntax
            if channel.target.dotSyntax
                # Member access syntax: A single data element is addressed by name
                # Translate semantic names to offsets (spec chapter 3.7, "Common glossary")
                # Note: the offsets might depend on the type of the target
                threejsChannel.semantic = channel.target.member
                threejsChannel.count = 1
                switch threejsChannel.semantic
                    # Carthesian coordinates
                    when "X" then threejsChannel.offset = 0
                    when "Y" then threejsChannel.offset = 1
                    when "Z" then threejsChannel.offset = 2
                    when "W" then threejsChannel.offset = 3
                    # Color
                    when "R" then threejsChannel.offset = 0
                    when "G" then threejsChannel.offset = 1
                    when "B" then threejsChannel.offset = 2
                    # Generic parameter
                    when "U" then threejsChannel.offset = 0
                    when "V" then threejsChannel.offset = 1
                    # Texture coordinates
                    when "S" then threejsChannel.offset = 0
                    when "T" then threejsChannel.offset = 1
                    when "P" then threejsChannel.offset = 2
                    when "Q" then threejsChannel.offset = 3
                    # Other
                    when "ANGLE" then threejsChannel.offset = 3
                    else
                        @_log "Unknown semantic for '#{targetLink.url}', animation ignored", ColladaLoader2.messageWarning
                        continue
            else if channel.target.arrSyntax
                # Array access syntax: A single data element is addressed by index
                switch targetLink.indices.length
                    when 1 then threejsChannel.offset = targetLink.indices[0]
                    when 2 then threejsChannel.offset = targetLink.indices[0] * target.animTarget.dataRows + targetLink.indices[1]
                    else
                        @_log "Invalid number of indices for '#{targetLink.url}', animation ignored", ColladaLoader2.messageWarning
                        continue
                threejsChannel.count = 1
            else
                # No sub-component: all data elements are addressed
                threejsChannel.offset = 0
                threejsChannel.count = target.animTarget.dataColumns * target.animTarget.dataRows

            # Register the convenience object with the animation target
            target.animTarget.channels.push threejsChannel

        # Process all sub-animations
        for child in animation.animations
            @_linkAnimationChannels child
        return

#   Creates the three.js scene graph
#
#>  _createSceneGraph :: () ->
    _createSceneGraph : () ->
        daeScene = @_getLinkTarget @dae.scene, ColladaVisualScene
        if not daeScene? then return

        threejsScene = new THREE.Object3D()
        @threejs.scene = threejsScene
        @_createSceneGraphNode(daeChild, threejsScene) for daeChild in daeScene.children
        
        # Old loader compatibility
        @scene = threejsScene
        return

#   Sets the transformation of a scene node
#
#>  _setNodeTransformation :: (ColladaVisualSceneNode, THREE.Object3D) ->
    _setNodeTransformation : (daeNode, threejsNode) ->
        # Set the node transformation.
        # The loader sets the composed matrix.
        # Since collada nodes may have any number of transformations in any order,
        # the only way to extract position, rotation, and scale is to decompose the node matrix.
        daeNode.getTransformMatrix threejsNode.matrix
        threejsNode.matrixAutoUpdate = false
        return

#   Creates a three.js scene graph node
#
#>  _createSceneGraphNode :: (ColladaVisualSceneNode, THREE.Object3D) ->
    _createSceneGraphNode : (daeNode, threejsParent) ->
        threejsChildren = []

        # Geometries (static meshes)
        for daeGeometry in daeNode.geometries
            threejsMesh = @_createStaticMesh daeGeometry
            if threejsMesh?
                threejsMesh.name = if daeNode.name? then daeNode.name else ""
                threejsChildren.push threejsMesh

        # Controllers (animated meshes)
        for daeController in daeNode.controllers
            threejsMesh = @_createAnimatedMesh daeController
            if threejsMesh?
                threejsMesh.name = if daeNode.name? then daeNode.name else ""
                threejsChildren.push threejsMesh

        # Lights
        for daeLight in daeNode.lights
            threejsLight = @_createLight daeLight
            if threejsLight?
                threejsLight.name = if daeNode.name? then daeNode.name else ""
                threejsChildren.push threejsLight

        # Cameras
        for daeCamera in daeNode.cameras
            threejsCamera = @_createCamera daeCamera
            if threejsCamera?
                threejsCamera.name = if daeNode.name? then daeNode.name else ""
                threejsChildren.push threejsCamera

        # Create a three.js node and add it to the scene graph
        if threejsChildren.length > 1
            # Multiple renderable objects found, create a virtual scene graph node that will contain the transformation
            threejsNode = new THREE.Object3D()
            threejsNode.add threejsChild for threejsChild in threejsChildren when threejsChild?
            threejsParent.add threejsNode
        else if threejsChildren.length is 1
            # Just one renderable object found, add is as a child node
            threejsNode = threejsChildren[0]
            threejsParent.add threejsNode
        else if threejsChildren.length is 0
            # This happens a lot with skin animated meshes, since the scene graph contains lots of invisible skeleton nodes.
            if daeNode.type isnt "JOINT" then @_log "Collada node #{daeNode.name} did not produce any threejs nodes", ColladaLoader2.messageWarning
            # This node does not generate any renderable objects, but may still contain transformations
            threejsNode = new THREE.Object3D()
            threejsParent.add threejsNode

        # Set the node transformation
        @_setNodeTransformation daeNode, threejsNode

        # Scene graph subtree
        @_createSceneGraphNode(daeChild, threejsNode) for daeChild in daeNode.children
        return

#   Creates a three.js light
#
#>  _createLight :: (ColladaInstanceLight) -> THREE.Light
    _createLight : (daeInstanceLight) ->
        light = @_getLinkTarget daeInstanceLight.light, ColladaLight
        if not light?
            @_log "Light instance has no light, light ignored", ColladaLoader2.messageWarning
            return null

        color = light.color
        colorHex = ( color[0] * 255 ) << 16 ^ ( color[1] * 255 ) << 8 ^ ( color[2] * 255 ) << 0
        attConst = light.params["constant_attenuation"]?.value
        attLin = light.params["linear_attenuation"]?.value
        attQuad = light.params["quadratic_attenuation"]?.value
        foAngle = light.params["falloff_angle"]?.value
        foExp = light.params["falloff_exponent"]?.value

        switch light.type
            when "ambient"     then light = new THREE.AmbientLight colorHex
            when "directional" then light = new THREE.DirectionalLight colorHex, 1
            when "point"       then light = new THREE.PointLight colorHex, attConst, attLin
            when "spot"        then light = new THREE.SpotLight colorHex, attConst, attLin, foAngle, foExp
            else @_log "Unknown light type #{daeInstanceLight.type}, light ignored.", ColladaLoader2.messageError
        return light

#   Creates a three.js camera
#
#>  _createCamera :: (ColladaInstanceCamera) -> THREE.Camera
    _createCamera : (daeInstanceCamera) ->
        camera = @_getLinkTarget daeInstanceCamera.camera, ColladaCamera
        if not camera?
            @_log "Camera instance has no camera, camera ignored", ColladaLoader2.messageWarning
            return null

        x_mag = camera.params["xmag"]?.value
        y_mag = camera.params["ymag"]?.value
        x_fov = camera.params["xfov"]?.value
        y_fov = camera.params["yfov"]?.value
        aspect = camera.params["aspect_ratio"]?.value
        z_min = camera.params["znear"]?.value
        z_max = camera.params["zfar"]?.value

        switch camera.type
            when "orthographic"
                if      x_mag? and y_mag?  then aspect = x_mag / y_mag
                else if y_mag? and aspect? then x_mag  = y_mag * aspect
                else if x_mag? and aspect? then y_mag  = x_mag / aspect
                else if x_mag?             then aspect = 1; y_mag = x_mag # Spec doesn't really say what to do here...
                else if y_mag?             then aspect = 1; x_mag = y_mag # Spec doesn't really say what to do here...
                else @_log "Not enough field of view parameters for an orthographic camera.", ColladaLoader2.messageError
                # Spec is ambiguous whether x_mag is the width or half width of the camera, just pick one.
                camera = new THREE.OrthographicCamera -x_mag, +x_mag, -y_mag, +y_mag, z_min, z_max
            when "perspective"
                if      x_fov? and y_fov?  then aspect = x_fov / y_fov
                else if y_fov? and aspect? then x_fov  = y_fov * aspect
                else if x_fov? and aspect? then y_fov  = x_fov / aspect
                else if x_fov?             then aspect = 1; y_fov = x_fov # Spec doesn't really say what to do here...
                else if y_fov?             then aspect = 1; x_fov = y_fov # Spec doesn't really say what to do here...
                else @_log "Not enough field of view parameters for a perspective camera.", ColladaLoader2.messageError
                camera = new THREE.PerspectiveCamera y_fov, aspect, z_min, z_max
            else @_log "Unknown camera type #{daeInstanceCamera.type}, camera ignored.", ColladaLoader2.messageError
        return camera

#   Creates a three.js mesh
#
#>  _createStaticMesh :: (ColladaInstanceGeometry) -> THREE.Geometry
    _createStaticMesh : (daeInstanceGeometry) ->
        daeGeometry = @_getLinkTarget daeInstanceGeometry.geometry, ColladaGeometry
        if not daeGeometry?
            @_log "Geometry instance has no geometry, mesh ignored", ColladaLoader2.messageWarning
            return null

        [threejsGeometry, threejsMaterial] = @_createGeometryAndMaterial daeGeometry, daeInstanceGeometry.materials

        mesh = new THREE.Mesh threejsGeometry, threejsMaterial
        return mesh

#   Creates a threejs geometry and a material
#
#>  _createGeometryAndMaterial :: (ColladaGeometry, [ColladaInstanceMaterial]) -> THREE.Geometry
    _createGeometryAndMaterial : (daeGeometry, daeInstanceMaterials) ->
        # Create new geometry and material objects for each mesh
        # TODO: Figure out when and if they can be shared?
        threejsMaterials = @_createMaterials daeInstanceMaterials
        threejsGeometry = @_createGeometry daeGeometry, threejsMaterials

        # Handle multi-material meshes
        threejsMaterial = null
        if threejsMaterials.materials.length > 1
            threejsMaterial = new THREE.MeshFaceMaterial()
            threejsMaterial.materials.push material for material in threejsMaterials.materials
        else 
            threejsMaterial = threejsMaterials.materials[0]

        return [threejsGeometry, threejsMaterial]

#   Creates a three.js mesh
#
#>  _createAnimatedMesh :: (ColladaInstanceController, ColladaController) -> THREE.Geometry
    _createAnimatedMesh : (daeInstanceController, daeController) ->
        daeController = @_getLinkTarget daeInstanceController.controller, ColladaController

        # Create a skinned or morph-animated mesh, depending on the controller type
        if daeController.skin?
            return @_createSkinMesh daeInstanceController, daeController
        if daeController.morph?
            return @_createMorphMesh daeInstanceController, daeController

        # Unknown animation type
        @_log "Controller has neither a skin nor a morph, can not create a mesh", ColladaLoader2.messageError
        return null

#   Creates a three.js mesh
#
#>  _createSkinMesh :: (ColladaInstanceController, ColladaController) -> THREE.Geometry
    _createSkinMesh : (daeInstanceController, daeController) ->

        # Get the skin that is attached to the skeleton
        daeSkin = daeController.skin
        if not daeSkin? or not (daeSkin instanceof ColladaSkin)
            @_log "Controller for a skinned mesh has no skin, mesh ignored", ColladaLoader2.messageError
            return null

        # Get the geometry that is used by the skin
        daeSkinGeometry = @_getLinkTarget daeSkin.source
        if not daeSkinGeometry?
            @_log "Skin for a skinned mesh has no geometry, mesh ignored", ColladaLoader2.messageError
            return null

        # Skip all the skeleton processing if no animation is requested
        if not @_options.useAnimations
            [threejsGeometry, threejsMaterial] = @_createGeometryAndMaterial daeSkinGeometry, daeInstanceController.materials
            return new THREE.Mesh threejsGeometry, threejsMaterial

        # Get the scene subgraph that represents the mesh skeleton.
        # This is where we'll start searching for skeleton bones.
        skeletonRootNodes = []
        for skeletonLink in daeInstanceController.skeletons
            skeleton = @_getLinkTarget skeletonLink, ColladaVisualSceneNode
            if not skeleton?
                @_log "Controller instance for a skinned mesh uses unknown skeleton #{skeleton}, skeleton ignored", ColladaLoader2.messageError
                continue
            skeletonRootNodes.push skeleton
        if skeletonRootNodes.length is 0
            @_log "Controller instance for a skinned mesh has no skeleton, mesh ignored", ColladaLoader2.messageError
            return null

        # Find all bones that the skin references.
        # Bones (a.k.a. joints) are referenced via id's which are relative to the skeleton root node found above.
        if not daeSkin.joints?
            @_log "Skin has no joints, mesh ignored", ColladaLoader2.messageError
            return null
        daeJointsSource = @_getLinkTarget daeSkin.joints.joints?.source, ColladaSource
        if not daeJointsSource? or not daeJointsSource.data?
            @_log "Skin has no joints source, mesh ignored", ColladaLoader2.messageError
            return null
        daeInvBindMatricesSource = @_getLinkTarget daeSkin.joints.invBindMatrices?.source, ColladaSource
        if not daeInvBindMatricesSource? or not daeInvBindMatricesSource.data?
            @_log "Skin has no inverse bind matrix source, mesh ignored", ColladaLoader2.messageError
            return null
        if daeJointsSource.data.length*16 isnt daeInvBindMatricesSource.data.length
            @_log "Skin has an inconsistent length of joint data sources, mesh ignored", ColladaLoader2.messageError
            return null

        # Create a custom bone object for each referenced bone
        bones = []
        for jointSid in daeJointsSource.data
            jointNode = @_findJointNode jointSid, skeletonRootNodes
            if not jointNode?
                @_log "Joint #{jointSid} not found for skin with skeletons #{(skeletonRootNodes.map (node)->node.id).join ', '}, mesh ignored", ColladaLoader2.messageError
                return null
            bone = @_createBone jointNode, jointSid, bones
            _fillMatrix4RowMajor daeInvBindMatricesSource.data, bone.index*16, bone.invBindMatrix
        if @_options.verboseMessages then @_log "Skin contains #{bones.length} bones", ColladaLoader2.messageInfo

        # Find the parent for each bone
        # The skeleton(s) may contain more bones than referenced by the skin
        # The following code also adds all bones that are not referenced but used for the skeleton transformation
        # The bones array will grow during its traversal, therefore the while loop
        i = 0
        while i < bones.length
            bone = bones[i]
            i = i + 1
            # Find the parent bone
            for parentBone in bones
                if bone.node.parent is parentBone.node
                    bone.parent = parentBone
                    break
            # If the parent bone was not found, add it
            if bone.node.parent? and bone.node.parent instanceof ColladaVisualSceneNode and not bone.parent?
                bone.parent = @_createBone bone.node.parent, "", bones
        if @_options.verboseMessages then @_log "Skeleton contains #{bones.length} bones", ColladaLoader2.messageInfo

        # Get the joint weights for all vertices
        if not daeSkin.vertexWeights?
            @_log "Skin has no vertex weight data, mesh ignored", ColladaLoader2.messageError
            return null
        if daeSkin.vertexWeights.joints.source.url isnt daeSkin.joints.joints.source.url
            # Holy crap, how many indirections does this stupid format have?!?
            # If the data sources differ, we would have to reorder the elements of the "bones" array.
            @_log "Skin uses different data sources for joints in <joints> and <vertex_weights>, this is not supported by this loader, mesh ignored", ColladaLoader2.messageError
            return null

        # Create threejs geometry and material objects
        [threejsGeometry, threejsMaterial] = @_createGeometryAndMaterial daeSkinGeometry, daeInstanceController.materials

        # Process animations and create a corresponding threejs mesh object
        # If something goes wrong during the animation processing, return a static mesh object
        if @_options.convertSkinsToMorphs
            if @_addSkinMorphTargets threejsGeometry, daeSkin, bones, threejsMaterial
                return new THREE.MorphAnimMesh threejsGeometry, threejsMaterial
            else
                return new THREE.Mesh threejsGeometry, threejsMaterial
        else
            if @_addSkinBones threejsGeometry, daeSkin, bones, threejsMaterial
                mesh = new THREE.SkinnedMesh threejsGeometry, threejsMaterial
                # Overwrite bone inverse matrices
                mesh.boneInverses = []
                for bone in threejsGeometry.bones
                    mesh.boneInverses.push bone.inverse
                return mesh
            else
                return new THREE.Mesh threejsGeometry, threejsMaterial
        return null

#   Finds a node that is referenced by the given joint sid
#
#>  _findJointNode :: (String, [ColladaVisualSceneNode]) ->
    _findJointNode : (jointSid, skeletonRootNodes) ->
        # Find the visual scene node that is referenced by the joint SID
        # The spec is inconsistent here.
        # The joint ids do not seem to be real scoped identifiers (chapter 3.3, "COLLADA Target Addressing"), since they lack the first part (the anchor id)
        # The skin element (chapter 5, "skin" element) *implies* that the joint ids are scoped identifiers relative to the skeleton root node,
        # so perform a sid-like breadth-first search.
        jointNode = null
        for skeleton in skeletonRootNodes
            jointNode = @_findSidTarget skeleton, jointSid
            if jointNode? then break
        if jointNode instanceof ColladaVisualSceneNode
            return jointNode
        else
            return null

#   Creates a bone object
#
#>  _createBone :: (ColladaVisualSceneNode, [ThreejsSkeletonBone]) ->
    _createBone : (boneNode, jointSid, bones) ->
        bone = new ThreejsSkeletonBone
        bone.sid = jointSid
        bone.node = boneNode
        for transform in boneNode.transformations
            if transform.animTarget.channels.length > 0
                bone.isAnimated = true
                break
        bone.matrix = new THREE.Matrix4
        boneNode.getTransformMatrix bone.matrix
        bone.index = bones.length
        bones.push bone
        return bone
    
#   Handle animations (morph target output)
#
#>  _addSkinMorphTargets :: (THREE.Geometry, ColladaSkin, [Bone], THREE.Material) ->
    _addSkinMorphTargets : (threejsGeometry, daeSkin, bones, threejsMaterial) ->
        # Outline:
        #   for each time step
        #     for each bone
        #       apply animation to the bone
        #     add a new morph target to the mesh
        #     for each vertex
        #       compute the skinned vertex position
        #       store the new position in the current morph target

        # Prepare the animations for all bones
        timesteps = @_prepareAnimations bones
        if not timesteps > 0 then return null

        # Get all source data
        sourceVertices = threejsGeometry.vertices
        vertexCount = sourceVertices.length
        vwV = daeSkin.vertexWeights.v
        vwVcount = daeSkin.vertexWeights.vcount
        vwJointsSource = @_getLinkTarget daeSkin.vertexWeights.joints.source
        vwWeightsSource = @_getLinkTarget daeSkin.vertexWeights.weights.source
        vwJoints = vwJointsSource?.data
        vwWeights = vwWeightsSource?.data
        if not vwWeights?
            @_log "Skin has no weights data, no morph targets added for mesh", ColladaLoader2.messageError
            return null
        bindShapeMatrix = new THREE.Matrix4
        if daeSkin.bindShapeMatrix?
            bindShapeMatrix = _floatsToMatrix4RowMajor daeSkin.bindShapeMatrix, 0
        tempVertex = new THREE.Vector3

        # Prevent a spam of warnings
        enableWarningNoBones = true
        enableWarningInvalidWeight = true

        # For each time step
        for i in [0..timesteps-1] by 1
            # Update the skinning matrices for all bones
            @_updateSkinMatrices bones, bindShapeMatrix, i

            # Allocate a new array of vertices
            # How inefficient of threejs to use an array of objects...
            vertices = []
            for srcVertex in sourceVertices
                vertices.push new THREE.Vector3()
            # For each vertex
            vindex = 0
            for vertex, i in vertices
                sourceVertex = sourceVertices[i]
                weights = vwVcount[i]
                # Compute the skinned vertex position
                totalWeight = 0
                for w in [0..weights-1] by 1
                    boneIndex = vwV[vindex]
                    boneWeightIndex = vwV[vindex+1]
                    vindex += 2
                    boneWeight = vwWeights[boneWeightIndex]
                    totalWeight += boneWeight
                    if boneIndex >= 0
                        # Vertex influenced by a bone
                        bone = bones[boneIndex]
                        tempVertex.copy sourceVertex
                        tempVertex.applyMatrix4 bone.skinMatrix
                        tempVertex.multiplyScalar boneWeight
                        vertex.add tempVertex
                    else
                        # Vertex influenced by the bind shape
                        tempVertex.copy sourceVertex
                        tempVertex.applyMatrix4 bindShapeMatrix
                        tempVertex.multiplyScalar boneWeight
                        vertex.add tempVertex
                if weights is 0
                    # This is an invalid collada file, as vertices that are not influenced by any bone
                    # should be associated with the bind shape (bone index == -1).
                    # But we'll be forgiving and just copy the unskinned position instead.
                    vertex.copy sourceVertex
                    if enableWarningNoBones
                        @_log "Skinned vertex not influenced by any bone, some vertices will be unskinned", ColladaLoader2.messageWarning
                        enableWarningNoBones = false
                else if not (0.01 < totalWeight < 1e6)
                    # This is an invalid collada file, as vertex weights should be normalized.
                    # But we'll be forgiving and just copy the unskinned position instead.
                    vertex.copy sourceVertex
                    if enableWarningInvalidWeight
                        @_log "Zero or infinite total weight for skinned vertex, some vertices will be unskinned", ColladaLoader2.messageWarning
                        enableWarningInvalidWeight = false
                else
                    vertex.multiplyScalar 1 / totalWeight

            if vindex isnt vwV.length
                @_log "Skinning did not consume all weights", ColladaLoader2.messageError

            # Add the new morph target
            threejsGeometry.morphTargets.push {name:"target", vertices:vertices}

        # Enable morph targets
        threejsMaterial.morphTargets = true
        if threejsMaterial.materials?
            for material in threejsMaterial.materials
                material.morphTargets = true
        return true

#   Prepares the given skeleton for animation
#   Returns the number of keyframes of the animation
#
#>  _prepareAnimations :: ([Bone]) ->
    _prepareAnimations : (bones) ->
        timesteps = null
        for bone in bones
            hasAnimation = false
            for transform in bone.node.transformations
                transform.resetAnimation()
                # If there are more than one animations for this bone, activate all of them.
                # The animations may or may not be conflicting, depending on whether they target different properties of the bone.
                transform.selectAllAnimations()
                for channel in transform.animTarget.activeChannels
                    hasAnimation = true
                    channelTimesteps = channel.inputData.length
                    if timesteps? and channelTimesteps isnt timesteps
                        @_log "Inconsistent number of time steps, no morph targets added for mesh. Resample all animations to fix this.", ColladaLoader2.messageError
                        return null
                    timesteps = channelTimesteps
            if @_options.verboseMessages and not hasAnimation
                @_log "Joint '#{bone.sid}' has no animation channel", ColladaLoader2.messageWarning
        return timesteps

#   Updates the skinning matrices for the given skeleton, using the given animation keyframe
#
#>  _updateSkinMatrices :: ([Bone], THREE.Matrix4, Number) ->
    _updateSkinMatrices : (bones, bindShapeMatrix, keyframe) ->
        for bone in bones
            bone.applyAnimation keyframe
        for bone in bones
            bone.updateSkinMatrix bindShapeMatrix
        return null

#   Handle animations (skin output)
#
#>  _addSkinBones :: (THREE.Geometry, ColladaSkin, [Bone], THREE.Material) ->
    _addSkinBones : (threejsGeometry, daeSkin, bones, threejsMaterial) ->
        # Outline:
        #   for each animation
        #     convert animation to the JSON loader format
        #   for each skeleton bone
        #     convert skeleton bone to the JSON loader format
        #   pass converted animations and bones to the THREE.SkinnedMesh constructor

        # Prepare the animations for all bones
        timesteps = @_prepareAnimations bones
        if not timesteps > 0 then return null

        # Get all source data
        sourceVertices = threejsGeometry.vertices
        vertexCount = sourceVertices.length
        vwV = daeSkin.vertexWeights.v
        vwVcount = daeSkin.vertexWeights.vcount
        vwJointsSource = @_getLinkTarget daeSkin.vertexWeights.joints.source
        vwWeightsSource = @_getLinkTarget daeSkin.vertexWeights.weights.source
        vwJoints = vwJointsSource?.data
        vwWeights = vwWeightsSource?.data
        if not vwWeights?
            @_log "Skin has no weights data, no skin added for mesh", ColladaLoader2.messageError
            return null
        bindShapeMatrix = new THREE.Matrix4
        if daeSkin.bindShapeMatrix?
            bindShapeMatrix = _floatsToMatrix4RowMajor daeSkin.bindShapeMatrix, 0

        # Temporary data
        pos = new THREE.Vector3()
        rot = new THREE.Quaternion()
        scl = new THREE.Vector3()

        # Prevent a spam of warnings
        enableWarningTooManyBones = true
        enableWarningInvalidWeight = true
        
        # Add skin indices and skin weights to the geometry
        threejsSkinIndices = []
        threejsSkinWeights = []
        vindex = 0
        bonesPerVertex = 4 # Hard-coded in three.js, as it uses a Vector4 for the weights
        indices = [0,0,0,0]
        weights = [0,0,0,0]
        for vertex, i in sourceVertices
            weightCount = vwVcount[i]
            # Make sure the vertex does not use too many influences
            if weightCount > bonesPerVertex
                if enableWarningTooManyBones
                    @_log "Too many bones influence a vertex, some influences will be discarded. Threejs supports only #{bonesPerVertex} bones per vertex.", ColladaLoader2.messageWarning
                    enableWarningTooManyBones = false
                weightCount = bonesPerVertex
            totalWeight = 0
            # Add all actual influences of this vertex
            for w in [0..weightCount-1] by 1
                boneIndex = vwV[vindex]
                boneWeightIndex = vwV[vindex+1]
                vindex += 2
                boneWeight = vwWeights[boneWeightIndex]
                totalWeight += boneWeight
                indices[w] = boneIndex
                weights[w] = boneWeight
            # Add dummy influences if there are not enough
            for w in [weights..bonesPerVertex-1] by 1
                indices[w] = 0 # Pick any index
                weights[w] = 0
            # Normalize weights
            if not (0.01 < totalWeight < 1e6)
                # This is an invalid collada file, as vertex weights should be normalized.
                if enableWarningInvalidWeight
                    @_log "Zero or infinite total weight for skinned vertex, skin will be broken", ColladaLoader2.messageWarning
                    enableWarningInvalidWeight = false
            else
                for w in [0..bonesPerVertex-1] by 1
                    weights[w] /= totalWeight
            # Add indices/weights as threejs-vectors
            threejsSkinIndices.push new THREE.Vector4 indices[0], indices[1], indices[2], indices[3]
            threejsSkinWeights.push new THREE.Vector4 weights[0], weights[1], weights[2], weights[3]
        threejsGeometry.skinIndices = threejsSkinIndices
        threejsGeometry.skinWeights = threejsSkinWeights

        # Add bones to the geometry
        threejsBones = []
        for bone in bones
            threejsBone = {}
            if bone.parent?
                threejsBone.parent = bone.parent.index
            else
                threejsBone.parent = -1
            threejsBone.name = bone.node.name
            bone.matrix.decompose pos, rot, scl
            threejsBone.pos  = [pos.x, pos.y, pos.z]
            threejsBone.scl  = [scl.x, scl.y, scl.z]
            threejsBone.rotq = [rot.x, rot.y, rot.z, rot.w]
            threejsBone.rot  = null # Euler rotation, doesn't seem to be used by three.js
            # Three.js has a simplified skinning equation, compute the bone inverses on our own
            # Collada equation: boneWeight*boneMatrix*invBindMatrix*bindShapeMatrix*vertex (see chapter 4: "Skin Deformation (or Skinning) in COLLADA")
            # Three.js equation: boneWeight*boneMatrix*boneInverse*vertex (see THREE.SkinnedMesh.prototype.updateMatrixWorld)
            # The property THREE.Bone.inverse does not exist in three.js, it is copied to THREE.SkinnedMesh.boneInverses later
            threejsBone.inverse = new THREE.Matrix4
            threejsBone.inverse.multiplyMatrices bone.invBindMatrix, bindShapeMatrix
            threejsBones.push threejsBone
        threejsGeometry.bones = threejsBones

        # Add animations to the geometry
        # Thee.js uses one animation object per semantic animation (e.g., a "jumping" animation)
        # Collada may use one animation object per animated property (e.g., the x coordinate of a bone),
        # or one animation object per semantic animation, depending on the exporter.
        # The conversion between those two systems might be inaccurate.
        threejsAnimation = {}
        threejsAnimation.name = "animation"
        threejsAnimation.hierarchy = []

        for bone in bones
            threejsBoneAnimation = {}
            threejsBoneAnimation.parent = bone.index
            threejsBoneAnimation.keys = []

            for keyframe in [0..timesteps-1] by 1
                bone.applyAnimation keyframe
                bone.updateSkinMatrix bindShapeMatrix
                key = {}
                key.time = keyframe # TODO
                bone.matrix.decompose pos, rot, scl
                key.pos = [pos.x, pos.y, pos.z]
                key.scl = [scl.x, scl.y, scl.z]
                key.rot = [rot.x, rot.y, rot.z, rot.w]
                threejsBoneAnimation.keys.push key
            threejsAnimation.hierarchy.push threejsBoneAnimation

        threejsAnimation.fps = 30 # This does not exist in collada
        threejsAnimation.length = timesteps - 1# TODO
        threejsGeometry.animation = threejsAnimation

        # Enable skinning
        threejsMaterial.skinning = true
        if threejsMaterial.materials?
            for material in threejsMaterial.materials
                material.skinning = true

        return true

#   Creates a three.js mesh
#
#>  _createMorphMesh :: (ColladaInstanceController, ColladaController) -> THREE.Geometry
    _createMorphMesh : (daeInstanceController, daeController) ->
        @_log "Morph animated meshes not supported, mesh ignored", ColladaLoader2.messageError
        return null

#   Creates a three.js geometry
#
#>  _createGeometry :: (ColladaGeometry, ThreejsMaterialMap) -> THREE.Geometry
    _createGeometry : (daeGeometry, materials) ->
        threejsGeometry = new THREE.Geometry()

        for triangles in daeGeometry.triangles
            materialIndex = materials.indices[triangles.material]
            if not materialIndex?
                @_log "Material symbol #{triangles.material} has no bound material instance", ColladaLoader2.messageError
                materialIndex = 0
            @_addTrianglesToGeometry daeGeometry, triangles, materialIndex, threejsGeometry

        # Compute missing data.
        # TODO: Figure out when this needs to be recomputed and when not
        threejsGeometry.computeFaceNormals()
        threejsGeometry.computeCentroids()
        if materials.needtangents then threejsGeometry.computeTangents()
        threejsGeometry.computeBoundingBox()
        return threejsGeometry

#   Adds primitives to a threejs geometry
#
#>  _addTrianglesToGeometry :: (ColladaGeometry, ColladaTriangles, THREE.Geometry)
    _addTrianglesToGeometry : (daeGeometry, triangles, materialIndex, threejsGeometry) ->

        # Step 1: Extract input sources from the triangles definition
        inputTriVertices = null
        inputTriNormal = null
        inputTriColor = null
        inputTriTexcoord = []
        for input in triangles.inputs
            switch input.semantic
                when "VERTEX"   then inputTriVertices = input
                when "NORMAL"   then inputTriNormal   = input
                when "COLOR"    then inputTriColor    = input
                when "TEXCOORD" then inputTriTexcoord.push input
                else @_log "Unknown triangles input semantic #{input.semantic} ignored", ColladaLoader2.messageWarning

        srcTriVertices = @_getLinkTarget inputTriVertices.source, ColladaVertices
        if not srcTriVertices?
            @_log "Geometry #{daeGeometry.id} has no vertices", ColladaLoader2.messageError
            return

        srcTriNormal = @_getLinkTarget inputTriNormal?.source, ColladaSource
        srcTriColor  = @_getLinkTarget inputTriColor?.source, ColladaSource
        srcTriTexcoord = inputTriTexcoord.map (x) => @_getLinkTarget(x?.source, ColladaSource)

        # Step 2: Extract input sources from the vertices definition
        inputVertPos = null
        inputVertNormal = null
        inputVertColor = null
        inputVertTexcoord = []
        for input in srcTriVertices.inputs
            switch input.semantic
                when "POSITION" then inputVertPos    = input
                when "NORMAL"   then inputVertNormal = input
                when "COLOR"    then inputVertColor  = input
                when "TEXCOORD" then inputVertTexcoord.push input
                else @_log "Unknown vertices input semantic #{input.semantic} ignored", ColladaLoader2.messageWarning

        srcVertPos = @_getLinkTarget inputVertPos.source, ColladaSource
        if not srcVertPos?
            @_log "Geometry #{daeGeometry.id} has no vertex positions", ColladaLoader2.messageError
            return

        srcVertNormal = @_getLinkTarget inputVertNormal?.source, ColladaSource
        srcVertColor  = @_getLinkTarget inputVertColor?.source, ColladaSource
        srcVertTexcoord = inputVertTexcoord.map (x) => @_getLinkTarget(x?.source, ColladaSource)

        # Step 3: Convert flat float arrays into three.js object arrays
        dataVertPos      = @_createVector3Array srcVertPos
        dataVertNormal   = @_createVector3Array srcVertNormal
        dataTriNormal    = @_createVector3Array srcTriNormal
        dataVertColor    = @_createColorArray srcVertColor
        dataTriColor     = @_createColorArray srcTriColor
        dataVertTexcoord = srcVertTexcoord.map (x) => @_createUVArray x
        dataTriTexcoord  = srcTriTexcoord.map (x) => @_createUVArray x

        # Step 3: Fill in vertex positions
        threejsGeometry.vertices = dataVertPos

        # Step 4: Prepare all texture coordinate sets
        # Previous triangle sets might have had more or less texture coordinate sets
        # Fill in any missing texture coordinates with zeros
        numNewTexcoordSets = dataVertTexcoord.length + dataTriTexcoord.length
        numExistingTexcoordSets = threejsGeometry.faceVertexUvs.length
        numNewFaces = triangles.count
        numExistingFaces = threejsGeometry.faces.count
        for faceVertexUvs, i in threejsGeometry.faceVertexUvs
            if i < numNewTexcoordSets
                missingFaces = faceVertexUvs.length - threejsGeometry.faces.length
                @_addEmptyUVs faceVertexUvs, missingFaces
            else
                missingFaces = faceVertexUvs.length - threejsGeometry.faces.length + numNewFaces
                @_addEmptyUVs faceVertexUvs, missingFaces
        while threejsGeometry.faceVertexUvs.length < numNewTexcoordSets
            faceVertexUvs = []
            @_addEmptyUVs faceVertexUvs, numExistingFaces
            threejsGeometry.faceVertexUvs.push faceVertexUvs

        # If the mesh is stored as a generic list of polygons, check whether
        # they are all triangles. Otherwise the code below will fail.
        if triangles.type isnt "triangles"
            vcount  = triangles.vcount
            for c in vcount
                if c isnt 3
                    @_log "Geometry #{daeGeometry.id} has non-triangle polygons, geometry ignored", ColladaLoader2.messageError
                    return

        # Step 5: Fill in faces
        # A face stores vertex positions by reference (index into the above array).
        # A face stores vertex normals, and colors by value.
        # Vertex texture coordinates are stored inside the geometry object.
        indices = triangles.indices
        triangleStride = indices.length / triangles.count
        vertexStride = triangleStride / 3
        for _unused, triangleBaseOffset in triangles.indices by triangleStride
            # Indices in the "indices" array at which the definition of each triangle vertex start
            baseOffset0 = triangleBaseOffset + 0*vertexStride
            baseOffset1 = triangleBaseOffset + 1*vertexStride
            baseOffset2 = triangleBaseOffset + 2*vertexStride

            # Indices in the "vertices" array at which the vertex data can be found
            v0 = indices[baseOffset0 + inputTriVertices.offset]
            v1 = indices[baseOffset1 + inputTriVertices.offset]
            v2 = indices[baseOffset2 + inputTriVertices.offset]

            # Normal
            if dataVertNormal?
                normal = [dataVertNormal[v0], dataVertNormal[v1], dataVertNormal[v2]]
            else if dataTriNormal?
                n0 = indices[baseOffset0 + inputTriNormal.offset]
                n1 = indices[baseOffset1 + inputTriNormal.offset]
                n2 = indices[baseOffset2 + inputTriNormal.offset]
                normal = [dataTriNormal[n0], dataTriNormal[n1], dataTriNormal[n2]]
            else
                normal = null

            # Color
            if dataVertColor?
                color = [dataVertColor[v0], dataVertColor[v1], dataVertColor[v2]]
            else if dataTriColor?
                n0 = indices[baseOffset0 + inputTriColor.offset]
                n1 = indices[baseOffset1 + inputTriColor.offset]
                n2 = indices[baseOffset2 + inputTriColor.offset]
                color = [dataTriColor[n0], dataTriColor[n1], dataTriColor[n2]]
            else
                color = null

            # Create a new face
            face = new THREE.Face3 v0, v1, v2, normal, color
            if materialIndex? then face.materialIndex = materialIndex
            threejsGeometry.faces.push face

            # Texture coordinates
            # Texture coordinates are stored in the geometry and not in the face object
            for data, i in dataVertTexcoord
                if not data?
                    geometry.faceVertexUvs[i].push [new THREE.Vector2(0,0), new THREE.Vector2(0,0), new THREE.Vector2(0,0)]
                else
                    texcoord = [data[v0], data[v1], data[v2]]
                    geometry.faceVertexUvs[i].push texcoord
            for data, i in dataTriTexcoord
                if not data?
                    geometry.faceVertexUvs[i].push [new THREE.Vector2(0,0), new THREE.Vector2(0,0), new THREE.Vector2(0,0)]
                else
                    t0 = indices[baseOffset0 + inputTriTexcoord[i].offset]
                    t1 = indices[baseOffset1 + inputTriTexcoord[i].offset]
                    t2 = indices[baseOffset2 + inputTriTexcoord[i].offset]
                    texcoord = [data[t0], data[t1], data[t2]]
                    threejsGeometry.faceVertexUvs[i].push texcoord
        return

#   Adds zero UVs to an existing array of UVs
#
#>  _addEmptyUVs :: (Array, Number) ->
    _addEmptyUVs : (faceVertexUvs, count) ->
        faceVertexUvs.push new THREE.Vector2(0,0) for i in [0..count-1] by 1
        return

#   Creates an array of 3D vectors
#
#>  _createVector3Array :: (ColladaSource) -> [THREE.Vector3]
    _createVector3Array : (source) ->
        if not source? then return null
        if source.stride isnt 3
            @_log "Vector source data does not contain 3D vectors", ColladaLoader2.messageError
            return null

        data = []
        srcData = source.data
        for i in [0..srcData.length-1] by 3
            data.push new THREE.Vector3 srcData[i], srcData[i+1], srcData[i+2]
        return data

#   Creates an array of color vectors
#
#>  _createColorArray :: (ColladaSource) -> [THREE.Color]
    _createColorArray : (source) ->
        if not source? then return null
        if source.stride < 3
            @_log "Color source data does not contain 3+D vectors", ColladaLoader2.messageError
            return null

        data = []
        srcData = source.data
        for i in [0..srcData.length-1] by source.stride
            data.push new THREE.Color().setRGB srcData[i], srcData[i+1], srcData[i+2]
        return data

#   Creates an array of UV vectors
#
#>  _createUVArray :: (ColladaSource) -> [THREE.Vector2]
    _createUVArray : (source) ->
        if not source? then return null
        if source.stride < 2
            @_log "UV source data does not contain 2+D vectors", ColladaLoader2.messageError
            return null

        data = []
        srcData = source.data
        for i in [0..srcData.length-1] by source.stride
            data.push new THREE.Vector2 srcData[i], 1.0 - srcData[i+1]
        return data

#   Creates a map of three.js materials
#
#>  _createMaterials :: ([ColladaInstanceMaterial]) -> ThreejsMaterialMap
    _createMaterials : (daeInstanceMaterials) ->
        result = new ThreejsMaterialMap
        numMaterials = 0
        for daeInstanceMaterial in daeInstanceMaterials
            symbol = daeInstanceMaterial.symbol
            if not symbol?
                @_log "Material instance has no symbol, material skipped.", ColladaLoader2.messageError
                continue
            if result.indices[symbol]?
                @_log "Geometry instance tried to map material symbol #{symbol} multiple times", ColladaLoader2.messageError
                continue
            threejsMaterial = @_createMaterial daeInstanceMaterial

            # If the material contains a bump or normal map, compute tangents
            if threejsMaterial.bumpMap? or threejsMaterial.normalMap? then result.needtangents = true

            @threejs.materials.push threejsMaterial
            result.materials.push threejsMaterial
            result.indices[symbol] = numMaterials++
        return result

#   Creates a three.js material
#
#>  _createMaterial :: (ColladaInstanceMaterial) -> THREE.Material
    _createMaterial : (daeInstanceMaterial) ->
        daeMaterial = @_getLinkTarget daeInstanceMaterial.material, ColladaMaterial
        if not daeMaterial? then return @_createDefaultMaterial
        daeEffect   = @_getLinkTarget daeMaterial.effect, ColladaEffect
        if not daeEffect? then return @_createDefaultMaterial

        return @_createBuiltInMaterial daeEffect

#   Creates a three.js shader material
#
#>  _createShaderMaterial :: (ColladaEffect) -> THREE.Material
    _createShaderMaterial : (daeEffect) ->
        technique = daeEffect.technique

        # HACK: Use the "normal" shader from the three.js shader library
        shader = THREE.ShaderUtils.lib[ "normal" ]
        uniforms = THREE.UniformsUtils.clone shader.uniforms

        textureNormal = @_loadThreejsTexture technique.bump
        if textureNormal?
            uniforms[ "tNormal" ].texture = textureNormal
            uniforms[ "uNormalScale" ].value = 0.85

        textureDiffuse = @_loadThreejsTexture technique.diffuse
        if textureDiffuse?
            uniforms[ "tDiffuse" ].texture = textureDiffuse
            uniforms[ "enableDiffuse" ].value = true
        else
            uniforms[ "enableDiffuse" ].value = false

        textureSpecular = @_loadThreejsTexture technique.specular
        if textureSpecular?
            uniforms[ "tSpecular" ].texture = textureSpecular
            uniforms[ "enableSpecular" ].value = true
        else
            uniforms[ "enableSpecular" ].value = false

        textureLight = @_loadThreejsTexture technique.emission
        if textureLight?
            uniforms[ "tAO" ].texture = textureLight
            uniforms[ "enableAO" ].value = true
        else
            uniforms[ "enableAO" ].value = false

        # for the moment don't handle displacement texture

        if technique.diffuse?.color?  then uniforms[ "uDiffuseColor" ].value.setHex _colorToHex technique.diffuse.color
        if technique.specular?.color? then uniforms[ "uSpecularColor" ].value.setHex _colorToHex technique.specular.color
        if technique.ambient?.color?  then uniforms[ "uAmbientColor" ].value.setHex _colorToHex technique.ambient.color

        if technique.shininess?   then uniforms[ "uShininess" ].value = technique.shininess
        if technique.transparency? then uniforms[ "uOpacity" ].value   = @_getOpacity daeEffect

        materialNormalMap = new THREE.ShaderMaterial({
            fragmentShader: shader.fragmentShader,
            vertexShader: shader.vertexShader,
            uniforms: uniforms,
            lights: true
        })
        return materialNormalMap


#   Returns the surface opacity of an effect
#   Opacity of 1.0 means the object is fully opaque
#   Opacity of 0.0 means the object is fully transparent
#   See section "Determining Transparency (Opacity)" in the COLLADA spec
#
#>  _getOpacity :: (ColladaEffect) -> Number
    _getOpacity : (daeEffect) ->
        technique = daeEffect.technique
        transparent = technique.transparent
        opacityMode = transparent?.opaque
        if opacityMode? and opacityMode isnt "A_ONE"
            @_log "Opacity mode #{opacityMode} not supported, transparency will be broken", ColladaLoader2.messageWarning

        if transparent?.textureSampler?
            @_log "Separate transparency texture not supported, transparency will be broken", ColladaLoader2.messageWarning

        transparentA = transparent?.color?[3] or 1
        transparency = technique.transparency or 1
        return transparentA*transparency
        
#   Returns true if the effect has any transparency information
#
#>  _hasTransparency :: (ColladaEffect) -> Boolean
    _hasTransparency : (daeEffect) ->
        technique = daeEffect.technique
        return technique.transparent?.textureSampler? or (0 >= technique.transparency >= 1)

#   Creates a three.js built-in material
#
#>  _createBuiltInMaterial :: (ColladaEffect) -> THREE.Material
    _createBuiltInMaterial : (daeEffect) ->
        technique = daeEffect.technique
        params = {}

        # Initialize color/texture parameters
        @_setThreejsMaterialParam params, technique.diffuse,  "diffuse",  "map",         false
        @_setThreejsMaterialParam params, technique.emission, "emissive", null,          false
        @_setThreejsMaterialParam params, technique.ambient,  "ambient",  "lightMap",    false
        @_setThreejsMaterialParam params, technique.specular, "specular", "specularMap", false
        @_setThreejsMaterialParam params, technique.bump,     null      , "normalMap",   false

        # Fix for strange threejs behavior
        if params["bumpMap"]      then params["bumpScale"]   = 1.0
        if params["normalMap"]    then params["normalScale"] = new THREE.Vector2 1.0, 1.0
        if params["map"]?         then params["diffuse"]     = 0xffffff
        if params["specularMap"]? then params["specular"]    = 0xffffff
        if not params["diffuse"]? then params["diffuse"]     = 0xffffff

        # Initialize scalar parameters
        if technique.shininess?    then params["shininess"]    = technique.shininess
        if technique.reflectivity? then params["reflectivity"] = technique.reflectivity

        # Initialize transparency parameters
        hasTransparency = @_hasTransparency daeEffect
        if hasTransparency
            params["transparent"] = true
            opacity = @_getOpacity daeEffect
            params["opacity"] = opacity
            params["alphaTest"] = 0.001
        
        # Double-sided materials
        if technique.doubleSided
            params["side"] = THREE.DoubleSide

        # Hard-code smooth, per-pixel shading
        params["shading"] = THREE.SmoothShading
        params["perPixel"] = true

        # Create the threejs material based on the above parameters
        switch technique.shading
            when "blinn", "phong"
                params["color"] = params["diffuse"]
                return new THREE.MeshPhongMaterial params
            when "lambert"
                params["color"] = params["diffuse"]
                return new THREE.MeshLambertMaterial params
            when "constant"
                params["color"] = params["emission"]
                return new THREE.MeshBasicMaterial params
            else
                return @_createDefaultMaterial

#   Creates a default three.js material
#   This is used if the material definition is somehow invalid
#
#>  _createDefaultMaterial :: () -> THREE.Material
    _createDefaultMaterial : () ->
        new THREE.MeshLambertMaterial { color: 0xdddddd, shading: THREE.FlatShading }

#   Sets a three.js material parameter
#
#>  _setThreejsMaterialParam :: (Object, ColladaColorOrTexture, String, String, Boolean) ->
    _setThreejsMaterialParam : (params, colorOrTexture, nameColor, nameTexture, replace) ->
        if not colorOrTexture? then return
        if colorOrTexture.color? and nameColor?
            if not replace and params[nameColor]? then return
            params[nameColor] = _colorToHex colorOrTexture.color
        else if colorOrTexture.textureSampler? and nameTexture?
            if not replace and params[nameTexture]? then return
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

        # TODO: Currently, all texture parameters (filtering, wrapping) are ignored
        # TODO: Read the parameters from the sampler and figure out
        # TODO: when textures can be shared (if they have the same parameters).
        textureImage = null
        if textureSampler.image?
            # COLLADA 1.5 path: texture -> sampler -> image
            textureImage = @_getLinkTarget textureSampler.image, ColladaImage
        else if textureSampler.surface?
            # COLLADA 1.4 path: texture -> sampler -> surface -> image
            textureSurface = @_getLinkTarget textureSampler.surface, ColladaEffectSurface
            textureImage = @_getLinkTarget textureSurface.initFrom, ColladaImage
        if not textureImage? then return null

        imageURL = @_baseUrl + textureImage.initFrom
        texture = @_loader._loadTextureFromURL imageURL

        return texture

#==============================================================================
#   ColladaLoader
#==============================================================================
class ColladaLoader2

    @messageTrace   = 0
    @messageInfo    = 1
    @messageWarning = 2
    @messageError   = 3
    @messageTypes   = [ "TRACE", "INFO", "WARNING", "ERROR" ]

#==============================================================================
# SECTION: HIGH LEVEL INTERFACE
#==============================================================================

#   Creates a new collada loader.
#
#>  constructor :: () -> THREE.ColladaLoader2
    constructor : ->
        @log = ColladaLoader2.logConsole
        @_imageCache = {}
        @options = {
            # Output animated meshes, if animation data is available
            useAnimations: true
            # Convert skinned meshes to morph animated meshes
            convertSkinsToMorphs: false
            # Verbose message output
            verboseMessages: false
            # Search for images in the image cache using different variations of the file name
            localImageMode: false
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

#   Adds images to the texture cache
#
#>  addChachedTextures :: ([THREE.Texture]) ->
    addChachedTextures : (textures) ->
        for key, value of textures
            @_imageCache[key] = value
        return

#   Loads a collada file from a URL.
#
#>  load :: (String, Function, Function) -> THREE.ColladaFile
    load : (url, readyCallback, progressCallback) ->
        length = 0
        if document.implementation?.createDocument
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
        # Create an empty collada file
        file = new ColladaFile @
        file.setUrl url
        file._readyCallback = readyCallback

        # Step 1: Parse the XML
        file._parseXml doc

        # Step 2: Create three.js objects
        file._linkAnimations()
        file._createSceneGraph()

        if file._readyCallback
            file._readyCallback file

        return file

#==============================================================================
# SECTION: PRIVATE HELPER FUNCTIONS FOR IMAGE LOADING
#==============================================================================

#   Loads a three.js texture from a URL
#
#>  _loadTextureFromURL :: (String) -> THREE.Texture
    _loadTextureFromURL : (imageURL) ->
        # Look in the image cache first
        texture = @_imageCache[imageURL]
        if texture? then return texture

        # Load the image
        if @options.localImageMode then texture = @_loadImageLocal imageURL
        if not texture? then texture = @_loadImageSimple imageURL

        # Add the image to the cache
        if texture? then @_imageCache[imageURL] = texture
        else @log "Texture #{imageURL} could not be loaded, texture will be ignored.", ColladaLoader2.messageError
        return texture

#   Loads an image using a the threejs image loader
#
#>  _loadImageThreejs :: (String) -> THREE.Texture
    _loadImageThreejs : (imageURL) ->
        texture = THREE.ImageUtils.loadTexture imageURL
        texture.flipY = false
        return texture

#   Loads an image using a very simple approach
#
#>  _loadImageSimple :: (String) -> THREE.Texture
    _loadImageSimple : (imageURL) ->
        image = new Image()
        texture = new THREE.Texture image
        texture.flipY = false
        # HACK: Set the repeat mode to repeat
        texture.wrapS = THREE.RepeatWrapping
        texture.wrapT = THREE.RepeatWrapping
        image.onload = () -> texture.needsUpdate = true
        image.crossOrigin = 'anonymous'
        image.src = imageURL
        return texture

#   Loads an image from the cache, trying different variations of the file name
#
#>  _loadImageLocal :: (String) -> THREE.Texture
    _loadImageLocal : (imageURL) ->
        # At this point, the texture was not found in the cache.
        # Since this mode is for loading of local textures from file,
        # and the javascript FileReader won't tell you the file directory,
        # we'll try to find an image in the cache with approximately the same URL
        imageURLBase = @_removeSameDirectoryPath imageURL
        for key, value of @_imageCache
            cachedURLBase = @_removeSameDirectoryPath key
            if imageURLBase.indexOf(cachedURLBase) >=0
                texture = value
                break
        # Still no luck, try a different file extension
        imageURLBase = @_removeSameDirectoryPath @_removeFileExtension imageURL
        if not texture? then for key, value of @_imageCache
            cachedURLBase = @_removeSameDirectoryPath @_removeFileExtension key
            if imageURLBase.indexOf(cachedURLBase) >=0
                texture = value
                break
        return texture
    
#   Removes the file extension from a string
#
#>  _removeFileExtension :: (String) -> String
    _removeFileExtension : (filePath) -> filePath.substr(0, filePath.lastIndexOf ".") or filePath

#   Removes the file extension from a string
#
#>  _removeSameDirectoryPath :: (String) -> String
    _removeSameDirectoryPath : (filePath) -> filePath.replace /^.\//, ""

#==============================================================================
# SECTION: GLOBAL HELPER FUNCTIONS FOR DATA PARSING
#==============================================================================

#   Splits a string into whitespace-separated strings
#
#>  _strToStrings :: (String) -> [String]
_strToStrings = (str) ->
    if str.length > 0
        trimmed = str.trim()
        trimmed.split( /\s+/ )
    else
        []

#   Parses a string of whitespace-separated float numbers
#   A very minor speedup could be achieved by iterating over characters of the string
#   and parsing substrings on the fly.
#   Using Float32Array does not seem to give any speedup, but could save memory.
#
#>  _strToFloats :: (String) -> [Number]
_strToFloats = (str) ->
    strings = _strToStrings str
    data = new Float32Array(strings.length)
    data[i] = parseFloat(string) for string, i in strings
    return data

#   Parses a string of whitespace-separated int numbers
#
#>  _strToInts :: (String) -> [Number]
_strToInts = (str) ->
    strings = _strToStrings str
    data = new Int32Array(strings.length)
    data[i] = parseInt(string, 10) for string, i in strings
    return data

#   Parses a string of whitespace-separated boolean values
#
#>  _strToBools :: (String) -> [Boolean]
_strToBools = (str) ->
    strings = _strToStrings str
    data = new Uint8Array(strings.length)
    data[i] = ( string is "true" or string is "1" ? 1 : 0 ) for string, i in strings
    return data

#   Parses a string (consisting of four floats) into a RGBA color
#
#>  _strToColor :: (String) -> THREE.Color
_strToColor = (str) ->
    rgba = _strToFloats str
    if rgba.length is 4
        return rgba
    else
        return null
            
#   Converts a 4D array to a hex number
#
#>  _colorToHex :: ([Number,Number,Number,Number]) -> Number
_colorToHex = (rgba) ->
    if rgba?
        Math.floor( rgba[0] * 255 ) << 16 ^ Math.floor( rgba[1] * 255 ) << 8 ^ Math.floor( rgba[2] * 255 )
    else
        null

#   Converts an array of floats to a 4D matrix
#
#>  _floatsToMatrix4ColumnMajor :: ([Number], Number) -> THREE.Matrix4
_floatsToMatrix4ColumnMajor = (data, offset) ->
    new THREE.Matrix4(
        data[0+offset], data[4+offset], data[8+offset], data[12+offset],
        data[1+offset], data[5+offset], data[9+offset], data[13+offset],
        data[2+offset], data[6+offset], data[10+offset], data[14+offset],
        data[3+offset], data[7+offset], data[11+offset], data[15+offset]
        )

#   Converts an array of floats to a 4D matrix
#
#>  _floatsToMatrix4RowMajor :: ([Number], Number) -> THREE.Matrix4
_floatsToMatrix4RowMajor = (data, offset) ->
    new THREE.Matrix4(
        data[0+offset], data[1+offset], data[2+offset], data[3+offset],
        data[4+offset], data[5+offset], data[6+offset], data[7+offset],
        data[8+offset], data[9+offset], data[10+offset], data[11+offset],
        data[12+offset], data[13+offset], data[14+offset], data[15+offset]
        )

#   Copies an array of floats to a 4D matrix (row major order)
#
#   Note: THREE.Matrix4 has a constructor that takes elements in column-major order.
#   Since this function takes elements in column-major order as well, they are passed in order.
#
#>  _fillMatrix4ColumnMajor :: ([Number], Number, THREE.Matrix4) ->
_fillMatrix4ColumnMajor = (data, offset, matrix) ->
    matrix.set(
        data[0+offset], data[4+offset], data[8+offset], data[12+offset],
        data[1+offset], data[5+offset], data[9+offset], data[13+offset],
        data[2+offset], data[6+offset], data[10+offset], data[14+offset],
        data[3+offset], data[7+offset], data[11+offset], data[15+offset]
        )

#   Copies an array of floats to a 4D matrix
#
#   Note: THREE.Matrix4 has a constructor that takes elements in column-major order.
#   Since this function takes elements in row-major order, they are swizzled.
#
#>  _fillMatrix4RowMajor :: ([Number], Number, THREE.Matrix4) ->
_fillMatrix4RowMajor = (data, offset, matrix) ->
    matrix.set(
        data[0+offset], data[1+offset], data[2+offset], data[3+offset],
        data[4+offset], data[5+offset], data[6+offset], data[7+offset],
        data[8+offset], data[9+offset], data[10+offset], data[11+offset],
        data[12+offset], data[13+offset], data[14+offset], data[15+offset]
        )

_checkMatrix4 = (matrix) ->
    me = matrix.elements
    if me[3] isnt 0 or me[7] isnt 0 or me[11] isnt 0 or me[15] isnt 1
        throw new Error "Last row isnt [0,0,0,1]"
    col1len = Math.sqrt me[0]*me[0] + me[1]*me[1] + me[2]*me[2]
    col2len = Math.sqrt me[4]*me[4] + me[5]*me[5] + me[6]*me[6]
    col3len = Math.sqrt me[8]*me[8] + me[9]*me[9] + me[10]*me[10]
    if col1len < 0.9 or col1len > 1.1
        throw new Error "First column has significant scaling"
    if col2len < 0.9 or col2len > 1.1
        throw new Error "Second column has significant scaling"
    if col3len < 0.9 or col3len > 1.1
        throw new Error "Third column has significant scaling"

#   Converts an array of floats to a 3D vector
#
#>  _floatsToVec3 :: ([Number]) -> THREE.Vector3
_floatsToVec3 = (data) ->
    new THREE.Vector3 data[0], data[1], data[2]

TO_RADIANS = Math.PI / 180.0

#==============================================================================
# SECTION: API EXPORT
#==============================================================================

# The following code prevents the closure compiler from renaming public interface symbols
ColladaLoader2.prototype['setLog'] = ColladaLoader2.prototype.setLog
ColladaLoader2.prototype['addChachedTextures'] = ColladaLoader2.prototype.addChachedTextures
ColladaLoader2.prototype['load'] = ColladaLoader2.prototype.load
ColladaLoader2.prototype['parse'] = ColladaLoader2.prototype.parse

# The following code makes sure the ColladaLoader2 class is visible outside of this file
if module? then module['exports'] = ColladaLoader2
else if window? then window['ColladaLoader2'] = ColladaLoader2
