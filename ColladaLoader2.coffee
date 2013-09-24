###
# ==============================================================================
# COLLADA file loader for three.js
#
# [1] https://github.com/mrdoob/three.js/
# [2] http://www.khronos.org/files/collada_spec_1_4.pdf
# [3] http://www.khronos.org/files/collada_spec_1_5.pdf
#
# Limitations by design:
# - Non-triangle primitives are not supported
# - Loading of geometry data from other documents is not supported
# ==============================================================================
###

#==============================================================================
#   ColladaLoader2
#==============================================================================
###*
*   @constructor
*   @struct
###
`var ColladaLoader2 = function() {this._init()}`

#==============================================================================
# GENERIC PRETTY-PRINTING FUNCTIONS
#==============================================================================

###*
*   Indents a string
*
*   @param {!number} count
*   @param {!string} str
*   @return {!string}
*   @private
###
ColladaLoader2.indentString = (count, str) ->
    output = ""
    for i in [1..count] by 1
        output += "    "
    output += str
    return output

###*
*   Returns one line of an ascii-art tree visualization
*
*   @param {!number} indent
*   @param {!string} str
*   @return {!string}
*   @private
###
ColladaLoader2.graphNodeString = (indent, str) ->
    return ColladaLoader2.indentString indent, "|-" + str

###*
*   Returns one line of an ascii-art tree visualization
* 
*   @param {string|number|boolean|Object|null} node
*   @param {!number} indent
*   @param {!string} prefix
*   @return {!string}
*   @private
###
ColladaLoader2.getNodeInfo = (node, indent, prefix) ->
    if not node? then return ""
    if typeof node is "string"  then return ColladaLoader2.graphNodeString indent, prefix + "'#{node}'\n"
    if typeof node is "number"  then return ColladaLoader2.graphNodeString indent, prefix + "#{node}\n"
    if typeof node is "boolean" then return ColladaLoader2.graphNodeString indent, prefix + "#{node}\n"
    if node.getInfo? then return node.getInfo indent, prefix
    return ColladaLoader2.graphNodeString indent, prefix + "<unknown data type>\n"

#==============================================================================
# Interfaces
#==============================================================================
###* @interface ###
ColladaLoader2.FxTarget = () ->
###* @type {?string} ###
ColladaLoader2.FxTarget::sid
###* @type {?ColladaLoader2.FxScope} ###
ColladaLoader2.FxTarget::fxScope

###* @interface ###
ColladaLoader2.FxScope = () ->
###* @type {!Object.<!string, !ColladaLoader2.FxTarget>} ###
ColladaLoader2.FxScope::sids

###* @interface ###
ColladaLoader2.UrlTarget = () ->
###* @type {?string} ###
ColladaLoader2.UrlTarget::id

###* @interface ###
ColladaLoader2.SidTarget = () ->
###* @type {?string} ###
ColladaLoader2.SidTarget::sid

###* @interface ###
ColladaLoader2.SidScope = () ->
###* @type {!Array.<!ColladaLoader2.SidTarget|!ColladaLoader2.SidScope>} ###
ColladaLoader2.SidScope::sidChildren

###* @interface ###
ColladaLoader2.Link = () ->
###* @type {!string} ###
ColladaLoader2.Link::url

#==============================================================================
# ColladaLoader2.UrlLink
#==============================================================================
###*
*   COLLADA URL addressing
*
*   See chapter 3, section "Adress Syntax"
*   Uses XML ids that are unique within the whole document.
*   Hyperlinks to ids start with a hash.
*   <element id="xyz">
*   <element source="#xyz">
*
*   @constructor
*   @struct
*   @implements {ColladaLoader2.Link}
*   @param {!string} url
*   @param {!ColladaLoader2.File} file
###
ColladaLoader2.UrlLink = (url, file) ->
    ###* @type {!ColladaLoader2.File} ###
    @file = file
    ###* @type {!string} ###
    @url = url.trim().replace /^#/, ""
    ###* @type {?ColladaLoader2.UrlTarget} ###
    @object = null
    return @

###*
*   Resolves the link
*
*   @return {?ColladaLoader2.UrlTarget}
###
ColladaLoader2.UrlLink::_resolve = () ->
    object = @file.dae.ids[@url]
    if not object?
        ColladaLoader2._log "Could not resolve URL ##{@url}", ColladaLoader2.messageError
    return object

###*
*   Returns the link target
*
*   @return {?ColladaLoader2.UrlTarget}
###
ColladaLoader2.UrlLink::getTarget = () ->
    if not @object?
        @object = @_resolve()
    return @object

###*
*   @param {!number} indent
*   @param {!string} prefix
*   @return {!string}
###
ColladaLoader2.UrlLink::getInfo = (indent, prefix) ->
    return ColladaLoader2.graphNodeString indent, prefix + "<urlLink url='#{@url}'>\n"

#==============================================================================
# ColladaLoader2.FxLink
#==============================================================================
###*
*   COLLADA FX parameter addressing
*
*   See chapter 7, section "About Parameters"
*   Uses scoped ids that are unique within the given scope.
*   If the target is not defined within the same scope,
*   the search continues in the parent scope
*   <element sid="xyz">
*   <element texture="xyz">
*
*   @constructor
*   @struct
*   @implements {ColladaLoader2.Link}
*   @param {!string} url
*   @param {!ColladaLoader2.FxScope} scope
*   @param {!ColladaLoader2.File} file
###
ColladaLoader2.FxLink = (url, scope, file) ->
    ###* @type {!ColladaLoader2.File} ###
    @file = file
    ###* @type {!string} ###
    @url = url
    ###* @type {!ColladaLoader2.FxScope} ###
    @scope = scope
    ###* @type {?ColladaLoader2.FxTarget} ###
    @object = null
    return @

###*
*   Resolves the link
*
*   @return {?ColladaLoader2.FxTarget}
###
ColladaLoader2.FxLink::_resolve = () ->
    scope  = @scope
    object = null

    # Search for the sid in the current scope
    # If not found, recursively search in the parent scope
    while not object? and scope?
        object = scope.sids[@url]
        scope = scope.fxScope

    if not object?
        ColladaLoader2._log "Could not resolve FX parameter ##{@url}", ColladaLoader2.messageError
    return object

###*
*   Returns the link target
*
*   @return {?ColladaLoader2.FxTarget}
###
ColladaLoader2.FxLink::getTarget = () ->
    if not @object?
        @object = @_resolve()
    return @object

###*
*   @param {!number} indent
*   @param {!string} prefix
*   @return {!string}
###
ColladaLoader2.FxLink::getInfo = (indent, prefix) ->
    return ColladaLoader2.graphNodeString indent, prefix + "<fxLink url='#{@url}'>\n"

#==============================================================================
# ColladaLoader2.SidLink
#==============================================================================
###*
*   COLLADA SID addressing
*
*   See chapter 3, section "Adress Syntax"
*   Uses scoped ids that are unique within the parent element.
*   Adresses are anchored at a globally unique id and have a path of scoped ids.
*   <elementA id="xyz"><elementB sid="abc"></elementB></elementA>
*   <element target="xyz/abc">
*
*   @constructor
*   @struct
*   @implements {ColladaLoader2.Link}
*   @param {!string} url
*   @param {?string} parentId
*   @param {!ColladaLoader2.File} file
###
ColladaLoader2.SidLink = (parentId, url, file) ->
    ###* @type {!ColladaLoader2.File} ###
    @file = file
    ###* @type {!string} ###
    @url = url
    ###* @type {?string} ###
    @parentId = parentId
    ###* @type {?ColladaLoader2.SidTarget} ###
    @object = null
    ###* @type {?string} ###
    @id = null
    ###* @type {!Array.<!string>} ###
    @sids = []
    ###* @type {?string} ###
    @member = null
    ###* @type {?Array.<!number>} ###
    @indices = null
    ###* @type {!boolean} ###
    @dotSyntax = false
    ###* @type {!boolean} ###
    @arrSyntax = false
    # Parse the URL into its components
    @_parseUrl()
    return @

###*
*   Parses the URL into its components
###
ColladaLoader2.SidLink::_parseUrl = () ->
    parts = @url.split "/"

    # Part 1: element id
    @id = parts.shift()
    if @id is "." then @id = @parentId
    
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
    return

###*
*   Performs a breadth-first search for an sid, starting with the root node
*
*   @param {!string} url
*   @param {!ColladaLoader2.SidScope} root
*   @param {!Array.<!string>} sids
*   @return {?ColladaLoader2.SidTarget}
###
ColladaLoader2.SidLink.findSidTarget = (url, root, sids) ->
    # For each element in the SID path, perform a breadth-first search
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
            ColladaLoader2._log "Could not resolve SID ##{url}, missing SID part #{sid}", ColladaLoader2.messageError
            return null
        parentObject = childObject
    return childObject

###*
*   Resolves the link
*
*   @return {?ColladaLoader2.SidTarget}
###
ColladaLoader2.SidLink::_resolve = () ->
    # Step 1: Find the base URL target
    if not @id?
        ColladaLoader2._log "Could not resolve SID ##{@url}, link has no ID", ColladaLoader2.messageError
        return null
    root = @file.dae.ids[@id]
    if not root?
        ColladaLoader2._log "Could not resolve SID ##{@url}, missing base ID #{@id}", ColladaLoader2.messageError
        return null

    # Step 2: For each element in the SID path, perform a breadth-first search
    object = ColladaLoader2.SidLink.findSidTarget @url, root, @sids
    
    # Step 3: Resolve member and array access
    # TODO: Currently, this is solved in _linkAnimationChannels()
    # TODO: There might be a more elegant solution for this

    return object

###*
*   Returns the link target
*
*   @return {?ColladaLoader2.SidTarget}
###
ColladaLoader2.SidLink::getTarget = () ->
    if not @object?
        @object = @_resolve()
    return @object

###*
*   @param {!number} indent
*   @param {!string} prefix
*   @return {!string}
###
ColladaLoader2.SidLink::getInfo = (indent, prefix) ->
    str = "<sidLink id='#{@id}'"
    if @sids.length > 0
        str += ", sids='["
        str += @sids.join ","
        str += "]'"
    str += ">\n"
    output = ColladaLoader2.graphNodeString indent, prefix + str
    
###*
*   Returns the target of a link if the target has the correct type
*
*   @param {?ColladaLoader2.UrlLink|?ColladaLoader2.FxLink|?ColladaLoader2.SidLink|undefined} link
*   @param {!function(...)} type
*   @return {?ColladaLoader2.UrlTarget|?ColladaLoader2.FxTarget|?ColladaLoader2.SidTarget}
###
ColladaLoader2._getLinkTarget = (link, type) ->
    if not link? then return null
    object = link.getTarget()
    if object instanceof type
        return object
    else
        if object? then ColladaLoader2._reportInvalidTargetType link, type
        return null

#==============================================================================
# ColladaLoader2.AnimationTarget
#==============================================================================
###*
*   ColladaLoader2.AnimationTarget
*   This is used as a base class for every object that can be animated
*   To use an animation target, first select an animation by name, id, or index
*   After that, apply keyframes of the selected animation
*
*   @constructor
*   @struct
*   @implements {ColladaLoader2.SidTarget}
###
ColladaLoader2.AnimationTarget = () ->
    ###* @type {?string} ###
    @sid = null
    ###* @struct ###
    @animTarget =
        ###* @type {!Array.<!ColladaLoader2.ThreejsAnimationChannel>} ###
        channels : []       # All ColladaLoader2.ThreejsAnimationChannels that target this object
        ###* @type {!Array.<!ColladaLoader2.ThreejsAnimationChannel>} ###
        activeChannels : [] # The currently selected animation channels (zero or more)
        ###* @type {?number} ###
        dataRows : null
        ###* @type {?number} ###
        dataColumns : null
    return @

###*
*   Selects an animation using a custom filter
*   @param {!function(ColladaLoader2.ThreejsAnimationChannel, number):boolean} filter
###
ColladaLoader2.AnimationTarget::selectAnimation = (filter) ->
    @animTarget.activeChannels = []
    for channel, i in @animTarget.channels
        if filter channel, i
            @animTarget.activeChannels.push channel
    return

###*
*   Selects an animation by id
*   @param {!string} id
###
ColladaLoader2.AnimationTarget::selectAnimationById = (id) ->
    @selectAnimation (channel, i) -> channel.animation.id is id
    return

###*
*   Selects an animation by name
*   @param {!string} name
###
ColladaLoader2.AnimationTarget::selectAnimationByName = (name) ->
    @selectAnimation (channel, i) -> channel.animation.name is name
    return

###*
*   Selects all animations
###
ColladaLoader2.AnimationTarget::selectAllAnimations = () ->
    @selectAnimation (channel, i) -> true
    return

###*
*   Applies the given keyframe of the previously selected animation
*   @param {!number} keyframe
###
ColladaLoader2.AnimationTarget::applyAnimationKeyframe = (keyframe) ->
    throw new Error "applyAnimationKeyframe() not implemented"

###*
*   Saves the non-animated state of this object
###
ColladaLoader2.AnimationTarget::initAnimationTarget = () ->
    throw new Error "initAnimationTarget() not implemented"

###*
*   Resets this object to the non-animated state 
###
ColladaLoader2.AnimationTarget::resetAnimation = () ->
    throw new Error "resetAnimation() not implemented"

###*
*   @param {?ColladaLoader2.UrlLink|?ColladaLoader2.FxLink|?ColladaLoader2.SidLink|undefined} link
*   @return {?ColladaLoader2.AnimationTarget}
###
ColladaLoader2.AnimationTarget.fromLink = (link) ->
    `/** @type{ColladaLoader2.AnimationTarget} */ (ColladaLoader2._getLinkTarget(link, ColladaLoader2.AnimationTarget))`

#==============================================================================
#   ColladaLoader2.Asset
#==============================================================================
###*
*   @constructor
*   @struct
###
ColladaLoader2.Asset = () ->
    @unit = 1
    @upAxis = null
    return @

###*
*   @param {!number} indent
*   @param {!string} prefix
*   @return {!string}
###
ColladaLoader2.Asset::getInfo = (indent, prefix) ->
    return ColladaLoader2.graphNodeString indent, prefix + "<asset>\n"

#==============================================================================
#   ColladaLoader2.VisualScene
#==============================================================================
###*
*   @constructor
*   @struct
*   @implements {ColladaLoader2.UrlTarget}
*   @implements {ColladaLoader2.SidScope}
###
ColladaLoader2.VisualScene = () ->
    ###* @type {?string} ###
    @id = null
    ###* @type {!Array.<!ColladaLoader2.VisualSceneNode>} ###
    @children = []
    ###* @type {!Array.<!ColladaLoader2.SidScope|!ColladaLoader2.SidTarget>} ###
    @sidChildren = []
    return @

###*
*   @param {!number} indent
*   @param {!string} prefix
*   @return {!string}
###
ColladaLoader2.VisualScene::getInfo = (indent, prefix) ->
    output = ColladaLoader2.graphNodeString indent, prefix + "<visualScene id='#{@id}'>\n"
    if @children? then for child in @children
        output += ColladaLoader2.getNodeInfo child, indent+1, "child "
    return output

###*
*   @param {?ColladaLoader2.UrlLink|?ColladaLoader2.FxLink|?ColladaLoader2.SidLink|undefined} link
*   @return {?ColladaLoader2.VisualScene}
###
ColladaLoader2.VisualScene.fromLink = (link) ->
    `/** @type{ColladaLoader2.VisualScene} */ (ColladaLoader2._getLinkTarget(link, ColladaLoader2.VisualScene))`

#==============================================================================
#   ColladaLoader2.VisualSceneNode
#==============================================================================
###*
*   @constructor
*   @struct
*   @implements {ColladaLoader2.UrlTarget}
*   @implements {ColladaLoader2.SidTarget}
*   @implements {ColladaLoader2.SidScope}
###
ColladaLoader2.VisualSceneNode = () ->
    ###* @type {?string} ###
    @id = null
    ###* @type {?string} ###
    @sid  = null
    ###* @type {?string} ###
    @name = null
    ###* @type {?string} ###
    @type = null
    ###* @type {?string} ###
    @layer = null
    ###* @type {?ColladaLoader2.VisualSceneNode|ColladaLoader2.VisualScene} ###
    @parent = null
    ###* @type {!Array.<!ColladaLoader2.VisualSceneNode>} ###
    @children = []
    ###* @type {!Array.<!ColladaLoader2.VisualSceneNode>} ###
    @sidChildren = []
    ###* @type {!Array.<!ColladaLoader2.NodeTransform>} ###
    @transformations = []
    ###* @type {!Array.<!ColladaLoader2.InstanceGeometry>} ###
    @geometries = []
    ###* @type {!Array.<!ColladaLoader2.InstanceController>} ###
    @controllers = []
    ###* @type {!Array.<!ColladaLoader2.InstanceLight>} ###
    @lights = []
    ###* @type {!Array.<!ColladaLoader2.InstanceCamera>} ###
    @cameras = []
    return @

###*
*   @param {!number} indent
*   @param {!string} prefix
*   @return {!string}
###
ColladaLoader2.VisualSceneNode::getInfo = (indent, prefix) ->
    output = ColladaLoader2.graphNodeString indent, prefix + "<visualSceneNode id='#{@id}', sid='#{@sid}', name='#{@name}'>\n"
    if @geometries? then for child in @geometries
        output += ColladaLoader2.getNodeInfo child, indent+1, "geometry "
    if @controllers? then for child in @controllers
        output += ColladaLoader2.getNodeInfo child, indent+1, "controller "
    if @lights? then for child in @lights
        output += ColladaLoader2.getNodeInfo child, indent+1, "light "
    if @cameras? then for child in @cameras
        output += ColladaLoader2.getNodeInfo child, indent+1, "camera "
    if @children? then for child in @children
        output += ColladaLoader2.getNodeInfo child, indent+1, "child "
    return output

###*
*   Returns a three.js transformation matrix for this node
*   @param {!THREE.Matrix4} result
###
ColladaLoader2.VisualSceneNode::getTransformMatrix = (result) ->
    temp = new THREE.Matrix4
    result.identity()
    for transform in @transformations
        transform.getTransformMatrix temp
        result.multiplyMatrices result, temp
    return

###*
*   @param {?ColladaLoader2.UrlLink|?ColladaLoader2.FxLink|?ColladaLoader2.SidLink|undefined} link
*   @return {?ColladaLoader2.VisualSceneNode}
###
ColladaLoader2.VisualSceneNode.fromLink = (link) ->
    `/** @type{ColladaLoader2.VisualSceneNode} */ (ColladaLoader2._getLinkTarget(link, ColladaLoader2.VisualSceneNode))`

#==============================================================================
#   ColladaLoader2.NodeTransform
#==============================================================================
###*
*   @constructor
*   @struct
*   @extends {ColladaLoader2.AnimationTarget}
*   @implements {ColladaLoader2.SidTarget}
###
ColladaLoader2.NodeTransform = () ->
    ColladaLoader2.AnimationTarget.call @
    ###* @type {?string} ###
    @sid = null
    ###* @type {?string} ###
    @type = null
    ###* @type {?Float32Array} ###
    @data = null
    ###* @type {?Float32Array} ###
    @originalData = null
    ###* @type {?ColladaLoader2.VisualSceneNode} ###
    @node = null
    return @
   
# Inheritance
ColladaLoader2.NodeTransform.prototype = new ColladaLoader2.AnimationTarget()

###*
*   Computes the three.js transformation matrix for this node
*
*   @param {!THREE.Matrix4} result
###
ColladaLoader2.NodeTransform::getTransformMatrix = (result) ->
    if not @data?
        ColladaLoader2._log "Transform data not defined, using identity transform", ColladaLoader2.messageWarning
        result.identity()
        return
    switch @type
        when "matrix"
            ColladaLoader2._fillMatrix4RowMajor @data, 0, result
        when "rotate"
            axis = new THREE.Vector3 @data[0], @data[1], @data[2]
            result.makeRotationAxis axis, @data[3] * ColladaLoader2.TO_RADIANS
        when "translate"
            result.makeTranslation @data[0], @data[1], @data[2]
        when "scale"
            result.makeScale @data[0], @data[1], @data[2]
        else
            ColladaLoader2._log "Transform type '#{@type}' not implemented, using identity transform", ColladaLoader2.messageWarning
            result.identity()
    return

###*
*   Applies the given keyframe of the previously selected animation
*   @param {!number} keyframe
###
ColladaLoader2.NodeTransform::applyAnimationKeyframe = (keyframe) ->
    for channel in @animTarget.activeChannels
        outputData = channel.outputData
        for i in [0..channel.count-1] by 1
            @data[channel.offset+i] = outputData[keyframe * channel.stride + i]
    return

###*
*   Saves the non-animated state of this object
###
ColladaLoader2.NodeTransform::initAnimationTarget = () ->
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
            @animTarget.dataColumns = null
            @animTarget.dataRows = null
            ColladaLoader2._log "Transform type '#{@type}' not implemented, animation will be broken", ColladaLoader2.messageWarning
    return

###*
*   Resets this object to the non-animated state 
###
ColladaLoader2.NodeTransform::resetAnimation = () ->
    for x,i in @originalData
        @data[i] = @originalData[i]
    return

###*
*   @param {?ColladaLoader2.UrlLink|?ColladaLoader2.FxLink|?ColladaLoader2.SidLink|undefined} link
*   @return {?ColladaLoader2.NodeTransform}
###
ColladaLoader2.NodeTransform.fromLink = (link) ->
    `/** @type{ColladaLoader2.NodeTransform} */ (ColladaLoader2._getLinkTarget(link, ColladaLoader2.NodeTransform))`

#==============================================================================
#   ColladaLoader2.InstanceGeometry
#==============================================================================
###*
*   @constructor
*   @struct
*   @implements {ColladaLoader2.SidScope}
*   @implements {ColladaLoader2.SidTarget}
###
ColladaLoader2.InstanceGeometry = () ->
    ###* @type {?string} ###
    @sid = null
    ###* @type {?ColladaLoader2.UrlLink} ###
    @geometry = null
    ###* @type {!Array.<!ColladaLoader2.InstanceMaterial>} ###
    @materials = []
    ###* @type {!Array.<!ColladaLoader2.SidScope|!ColladaLoader2.SidTarget>} ###
    @sidChildren = []
    return @

###*
*   @param {!number} indent
*   @param {!string} prefix
*   @return {!string}
###
ColladaLoader2.InstanceGeometry::getInfo = (indent, prefix) ->
    output = ColladaLoader2.graphNodeString indent, prefix + "<instanceGeometry>\n"
    output += ColladaLoader2.getNodeInfo @geometry, indent+1, "geometry "
    for material in @materials
        output += ColladaLoader2.getNodeInfo material, indent+1, "material "
    return output

###*
*   @param {?ColladaLoader2.UrlLink|?ColladaLoader2.FxLink|?ColladaLoader2.SidLink|undefined} link
*   @return {?ColladaLoader2.InstanceGeometry}
###
ColladaLoader2.InstanceGeometry.fromLink = (link) ->
    `/** @type{ColladaLoader2.InstanceGeometry} */ (ColladaLoader2._getLinkTarget(link, ColladaLoader2.InstanceGeometry))`

#==============================================================================
#   ColladaLoader2.InstanceController
#==============================================================================
###*
*   @constructor
*   @struct
*   @implements {ColladaLoader2.SidScope}
*   @implements {ColladaLoader2.SidTarget}
###
ColladaLoader2.InstanceController = () ->
    ###* @type {?string} ###
    @sid = null
    ###* @type {?string} ###
    @name = null
    ###* @type {?ColladaLoader2.UrlLink} ###
    @controller = null
    ###* @type {!Array.<!ColladaLoader2.UrlLink>} ###
    @skeletons = []
    ###* @type {!Array.<!ColladaLoader2.InstanceMaterial>} ###
    @materials = []
    ###* @type {!Array.<!ColladaLoader2.SidScope|!ColladaLoader2.SidTarget>} ###
    @sidChildren = []
    return @

###*
*   @param {!number} indent
*   @param {!string} prefix
*   @return {!string}
###
ColladaLoader2.InstanceController::getInfo = (indent, prefix) ->
    output = ColladaLoader2.graphNodeString indent, prefix + "<instanceController>\n"
    output += ColladaLoader2.getNodeInfo @controller, indent+1, "controller "
    for skeleton in @skeletons
        output += ColladaLoader2.getNodeInfo skeleton, indent+1, "skeleton "
    for material in @materials
        output += ColladaLoader2.getNodeInfo material, indent+1, "material "
    return output

###*
*   @param {?ColladaLoader2.UrlLink|?ColladaLoader2.FxLink|?ColladaLoader2.SidLink|undefined} link
*   @return {?ColladaLoader2.InstanceController}
###
ColladaLoader2.InstanceController.fromLink = (link) ->
    `/** @type{ColladaLoader2.InstanceController} */ (ColladaLoader2._getLinkTarget(link, ColladaLoader2.InstanceController))`

#==============================================================================
#   ColladaLoader2.Image
#==============================================================================
###*
*   @constructor
*   @struct
*   @implements {ColladaLoader2.SidTarget}
###
ColladaLoader2.InstanceMaterial = () ->
    ###* @type {?string} ###
    @sid = null
    ###* @type {?string} ###
    @symbol = null
    ###* @type {?ColladaLoader2.UrlLink} ###
    @material = null
    ###* @type {?string} ###
    @name = null
    ###* @type {!Object.<string, Object>} ###
    @vertexInputs = {}
    ###* @type {!Object.<string, Object>} ###
    @params = {}
    return @

###*
*   @param {!number} indent
*   @param {!string} prefix
*   @return {!string}
###
ColladaLoader2.InstanceMaterial::getInfo = (indent, prefix) ->
    output = ColladaLoader2.graphNodeString indent, prefix + "<instanceMaterial sid='#{@sid}'>\n"
    output += ColladaLoader2.getNodeInfo @material, indent+1, "material "
    return output

###*
*   @param {?ColladaLoader2.UrlLink|?ColladaLoader2.FxLink|?ColladaLoader2.SidLink|undefined} link
*   @return {?ColladaLoader2.InstanceMaterial}
###
ColladaLoader2.InstanceMaterial.fromLink = (link) ->
    `/** @type{ColladaLoader2.InstanceMaterial} */ (ColladaLoader2._getLinkTarget(link, ColladaLoader2.InstanceMaterial))`

#==============================================================================
#   ColladaLoader2.InstanceLight
#==============================================================================
###*
*   @constructor
*   @struct
*   @implements {ColladaLoader2.SidTarget}
*   @implements {ColladaLoader2.SidScope}
###
ColladaLoader2.InstanceLight = () ->
    ###* @type {?string} ###
    @sid = null
    ###* @type {?ColladaLoader2.UrlLink} ###
    @light = null
    ###* @type {?string} ###
    @name = null
    ###* @type {!Array.<!ColladaLoader2.SidScope|!ColladaLoader2.SidTarget>} ###
    @sidChildren = []
    return @

###*
*   @param {!number} indent
*   @param {!string} prefix
*   @return {!string}
###
ColladaLoader2.InstanceLight::getInfo = (indent, prefix) ->
    output = ColladaLoader2.graphNodeString indent, prefix + "<instanceLight>\n"
    output += ColladaLoader2.getNodeInfo @light, indent+1, "light "
    return output

###*
*   @param {?ColladaLoader2.UrlLink|?ColladaLoader2.FxLink|?ColladaLoader2.SidLink|undefined} link
*   @return {?ColladaLoader2.InstanceLight}
###
ColladaLoader2.InstanceLight.fromLink = (link) ->
    `/** @type{ColladaLoader2.InstanceLight} */ (ColladaLoader2._getLinkTarget(link, ColladaLoader2.InstanceLight))`

#==============================================================================
#   ColladaLoader2.InstanceCamera
#==============================================================================
###*
*   @constructor
*   @struct
*   @implements {ColladaLoader2.SidTarget}
*   @implements {ColladaLoader2.SidScope}
###
ColladaLoader2.InstanceCamera = () ->
    ###* @type {?string} ###
    @sid = null
    ###* @type {?ColladaLoader2.UrlLink} ###
    @camera = null
    ###* @type {?string} ###
    @name = null
    ###* @type {!Array.<!ColladaLoader2.SidScope|!ColladaLoader2.SidTarget>} ###
    @sidChildren = []
    return @

###*
*   @param {!number} indent
*   @param {!string} prefix
*   @return {!string}
###
ColladaLoader2.InstanceCamera::getInfo = (indent, prefix) ->
    output = ColladaLoader2.graphNodeString indent, prefix + "<instanceCamera>\n"
    output += ColladaLoader2.getNodeInfo @camera, indent+1, "camera "
    return output

###*
*   @param {?ColladaLoader2.UrlLink|?ColladaLoader2.FxLink|?ColladaLoader2.SidLink|undefined} link
*   @return {?ColladaLoader2.InstanceCamera}
###
ColladaLoader2.InstanceCamera.fromLink = (link) ->
    `/** @type{ColladaLoader2.InstanceCamera} */ (ColladaLoader2._getLinkTarget(link, ColladaLoader2.InstanceCamera))`

#==============================================================================
#   ColladaLoader2.Image
#==============================================================================
###*
*   @constructor
*   @struct
*   @implements {ColladaLoader2.UrlTarget}
###
ColladaLoader2.Image = () ->
    ###* @type {?string} ###
    @id = null
    ###* @type {?string} ###
    @initFrom = null
    return @

###*
*   @param {!number} indent
*   @param {!string} prefix
*   @return {!string}
###
ColladaLoader2.Image::getInfo = (indent, prefix) ->
    output = ColladaLoader2.graphNodeString indent, prefix + "<image id='#{@id}'>\n"
    output += ColladaLoader2.getNodeInfo @initFrom, indent+1, "initFrom "
    return output

###*
*   @param {?ColladaLoader2.UrlLink|?ColladaLoader2.FxLink|?ColladaLoader2.SidLink|undefined} link
*   @return {?ColladaLoader2.Image}
###
ColladaLoader2.Image.fromLink = (link) ->
    `/** @type{ColladaLoader2.Image} */ (ColladaLoader2._getLinkTarget(link, ColladaLoader2.Image))`

#==============================================================================
#   ColladaLoader2.Effect
#==============================================================================
###*
*   @constructor
*   @struct
*   @implements {ColladaLoader2.UrlTarget}
*   @implements {ColladaLoader2.FxScope}
###
ColladaLoader2.Effect = () ->
    ###* @type {?string} ###
    @id = null
    ###* @type {!Object.<string, !ColladaLoader2.FxTarget>} ###
    @sids = {}
    ###* @type {!Array.<!ColladaLoader2.EffectParam>} ###
    @params = []
    ###* @type {?ColladaLoader2.EffectTechnique} ###
    @technique = null
    return @

###*
*   @param {!number} indent
*   @param {!string} prefix
*   @return {!string}
###
ColladaLoader2.Effect::getInfo = (indent, prefix) ->
    output = ColladaLoader2.graphNodeString indent, prefix + "<effect id='#{@id}'>\n"
    output += ColladaLoader2.getNodeInfo @technique, indent+1, "technique "
    return output

###*
*   @param {?ColladaLoader2.UrlLink|?ColladaLoader2.FxLink|?ColladaLoader2.SidLink|undefined} link
*   @return {?ColladaLoader2.Effect}
###
ColladaLoader2.Effect.fromLink = (link) ->
    `/** @type{ColladaLoader2.Effect} */ (ColladaLoader2._getLinkTarget(link, ColladaLoader2.Effect))`

#==============================================================================
#   ColladaLoader2.EffectTechnique
#==============================================================================
###*
*   @constructor
*   @struct
*   @implements {ColladaLoader2.FxTarget}
*   @implements {ColladaLoader2.FxScope}
###
ColladaLoader2.EffectTechnique = () ->
    ###* @type {?string} ###
    @sid = null
    ###* @type {!Object.<string, !ColladaLoader2.FxTarget>} ###
    @sids = {}
    ###* @type {?ColladaLoader2.FxScope} ###
    @fxScope = null
    ###* @type {!Array.<!ColladaLoader2.EffectParam>} ###
    @params = []
    ###* @type {?string} ###
    @shading = null     # Shading type (phong, blinn, ...)
    ###* @type {?ColladaLoader2.ColorOrTexture} ###
    @emission    = null # Light emitted by this material
    ###* @type {?ColladaLoader2.ColorOrTexture} ###
    @ambient     = null # Reflectivity for ambient light
    ###* @type {?ColladaLoader2.ColorOrTexture} ###
    @diffuse     = null # Reflectivity for diffuse light
    ###* @type {?ColladaLoader2.ColorOrTexture} ###
    @specular    = null # Reflectivity for specular light
    ###* @type {?ColladaLoader2.ColorOrTexture} ###
    @reflective  = null # Reflectivity for perfect mirror reflections
    ###* @type {?ColladaLoader2.ColorOrTexture} ###
    @transparent = null # Filter for refracted light
    ###* @type {?ColladaLoader2.ColorOrTexture} ###
    @bump        = null # Bump or normal map (extension, not part of the COLLADA spec)
    ###* @type {?number} ###
    @shininess    = null # Specular exponent
    ###* @type {?number} ###
    @transparency = null # Amount of refracted light added to reflected light (between 0.0 and 1.0)
    ###* @type {?number} ###
    @reflectivity = null # Amount of perfect mirror reflection added to reflected light (between 0.0 and 1.0)
    ###* @type {?number} ###
    @index_of_refraction = null
    ###* @type {?boolean} ###
    @double_sided = null # Not part of COLLADA, but used by GOOGLEEARTH and MAX3D profiles
    return @

###*
*   @param {!number} indent
*   @param {!string} prefix
*   @return {!string}
###
ColladaLoader2.EffectTechnique::getInfo = (indent, prefix) ->
    output = ColladaLoader2.graphNodeString indent, prefix + "<technique sid='#{@sid}'>\n"
    return output

###*
*   @param {?ColladaLoader2.UrlLink|?ColladaLoader2.FxLink|?ColladaLoader2.SidLink|undefined} link
*   @return {?ColladaLoader2.EffectTechnique}
###
ColladaLoader2.EffectTechnique.fromLink = (link) ->
    `/** @type{ColladaLoader2.EffectTechnique} */ (ColladaLoader2._getLinkTarget(link, ColladaLoader2.EffectTechnique))`

#==============================================================================
#   ColladaLoader2.EffectParam
#==============================================================================
###*
*   @constructor
*   @struct
*   @implements {ColladaLoader2.FxTarget}
###
ColladaLoader2.EffectParam = () ->
    ###* @type {?string} ###
    @sid = null
    ###* @type {?ColladaLoader2.FxScope} ###
    @fxScope = null
    ###* @type {?string} ###
    @semantic = null
    ###* @type {?ColladaLoader2.EffectSurface} ###
    @surface  = null
    ###* @type {?ColladaLoader2.EffectSampler} ###
    @sampler  = null
    ###* @type {?Float32Array} ###
    @floats   = null
    return @

###*
*   @param {!number} indent
*   @param {!string} prefix
*   @return {!string}
###
ColladaLoader2.EffectParam::getInfo = (indent, prefix) ->
    output = ColladaLoader2.graphNodeString indent, prefix + "<newparam sid='#{@sid}'>\n"
    output += ColladaLoader2.getNodeInfo @surface, indent+1, "surface "
    output += ColladaLoader2.getNodeInfo @sampler, indent+1, "sampler "
    output += ColladaLoader2.getNodeInfo @floats,  indent+1, "floats "
    return output

###*
*   @param {?ColladaLoader2.UrlLink|?ColladaLoader2.FxLink|?ColladaLoader2.SidLink|undefined} link
*   @return {?ColladaLoader2.EffectParam}
###
ColladaLoader2.EffectParam.fromLink = (link) ->
    `/** @type{ColladaLoader2.EffectParam} */ (ColladaLoader2._getLinkTarget(link, ColladaLoader2.EffectParam))`

#==============================================================================
#   ColladaLoader2.EffectSurface
#==============================================================================
###*
*   @constructor
*   @struct
###
ColladaLoader2.EffectSurface = () ->
    ###* @type {?string} ###
    @type = null
    ###* @type {?ColladaLoader2.UrlLink} ###
    @initFrom = null
    ###* @type {?string} ###
    @format = null
    ###* @type {?Float32Array} ###
    @size = null
    ###* @type {?Float32Array} ###
    @viewportRatio = null
    ###* @type {?number} ###
    @mipLevels = null
    ###* @type {?boolean} ###
    @mipmapGenerate = null
    return @

###*
*   @param {!number} indent
*   @param {!string} prefix
*   @return {!string}
###
ColladaLoader2.EffectSurface::getInfo = (indent, prefix) ->
    output = ColladaLoader2.graphNodeString indent, prefix + "<surface>\n"
    output += ColladaLoader2.getNodeInfo @initFrom, indent+1, "initFrom "
    return output

#==============================================================================
#   ColladaLoader2.EffectSampler
#==============================================================================
###*
*   @constructor
*   @struct
###
ColladaLoader2.EffectSampler = () ->
    ###* @type {?ColladaLoader2.FxLink} ###
    @surface = null
    ###* @type {?ColladaLoader2.UrlLink} ###
    @image = null
    ###* @type {?string} ###
    @wrapS = null
    ###* @type {?string} ###
    @wrapT = null
    ###* @type {?string} ###
    @minfilter = null
    ###* @type {?string} ###
    @magfilter = null
    ###* @type {?Float32Array} ###
    @borderColor = null
    ###* @type {?number} ###
    @mipmapMaxLevel = null
    ###* @type {?number} ###
    @mipmapBias = null
    return @

###*
*   @param {!number} indent
*   @param {!string} prefix
*   @return {!string}
###
ColladaLoader2.EffectSampler::getInfo = (indent, prefix) ->
    output = ColladaLoader2.graphNodeString indent, prefix + "<sampler>\n"
    output += ColladaLoader2.getNodeInfo @image, indent+1, "image "
    output += ColladaLoader2.getNodeInfo @surface, indent+1, "surface "
    return output

#==============================================================================
#   ColladaLoader2.ColorOrTexture
#==============================================================================
###*
*   @constructor
*   @struct
###
ColladaLoader2.ColorOrTexture = () ->
    ###* @type {?Float32Array} ###
    @color = null
    ###* @type {?ColladaLoader2.FxLink} ###
    @textureSampler = null
    ###* @type {?string} ###
    @texcoord = null
    ###* @type {?string} ###
    @opaque = null           # Only valid for <transparent> elements
    ###* @type {?string} ###
    @bumptype = null         # Only valid for <bump> elements
    return @

#==============================================================================
#   ColladaLoader2.Material
#==============================================================================
###*
*   @constructor
*   @struct
*   @implements {ColladaLoader2.UrlTarget}
###
ColladaLoader2.Material = () ->
    ###* @type {?string} ###
    @id = null
    ###* @type {?string} ###
    @name = null
    ###* @type {?ColladaLoader2.UrlLink} ###
    @effect = null
    return @

###*
*   @param {!number} indent
*   @param {!string} prefix
*   @return {!string}
###
ColladaLoader2.Material::getInfo = (indent, prefix) ->
    output = ColladaLoader2.graphNodeString indent, prefix + "<material id='#{@id}' name='#{@name}'>\n"
    output += ColladaLoader2.getNodeInfo @effect, indent+1, "effect "
    return output

###*
*   @param {?ColladaLoader2.UrlLink|?ColladaLoader2.FxLink|?ColladaLoader2.SidLink|undefined} link
*   @return {?ColladaLoader2.Material}
###
ColladaLoader2.Material.fromLink = (link) ->
    `/** @type{ColladaLoader2.Material} */ (ColladaLoader2._getLinkTarget(link, ColladaLoader2.Material))`

#==============================================================================
#   ColladaLoader2.Geometry
#==============================================================================
###*
*   @constructor
*   @struct
*   @implements {ColladaLoader2.UrlTarget}
###
ColladaLoader2.Geometry = () ->
    ###* @type {?string} ###
    @id = null
    ###* @type {?string} ###
    @name = null
    ###* @type {!Array.<!ColladaLoader2.Source>} ###
    @sources = []        # 0..N sources, indexed by globally unique ID
    ###* @type {?ColladaLoader2.Vertices} ###
    @vertices = null     # 1 vertices object
    ###* @type {!Array.<!ColladaLoader2.Triangles>} ###
    @triangles = []      # 0..N triangle objects
    return @

###*
*   @param {!number} indent
*   @param {!string} prefix
*   @return {!string}
###
ColladaLoader2.Geometry::getInfo = (indent, prefix) ->
    output = ColladaLoader2.graphNodeString indent, prefix + "<geometry id='#{@id}' name='#{@name}'>\n"
    for source in @sources
        output += ColladaLoader2.getNodeInfo source, indent+1, "source "
    output += ColladaLoader2.getNodeInfo @vertices, indent+1, "vertices "
    for tri in @triangles
        output += ColladaLoader2.getNodeInfo tri, indent+1, "triangles "
    return output

###*
*   @param {?ColladaLoader2.UrlLink|?ColladaLoader2.FxLink|?ColladaLoader2.SidLink|undefined} link
*   @return {?ColladaLoader2.Geometry}
###
ColladaLoader2.Geometry.fromLink = (link) ->
    `/** @type{ColladaLoader2.Geometry} */ (ColladaLoader2._getLinkTarget(link, ColladaLoader2.Geometry))`

#==============================================================================
#   ColladaLoader2.Source
#==============================================================================
###*
*   @constructor
*   @struct
*   @implements {ColladaLoader2.UrlTarget}
###
ColladaLoader2.Source = () ->
    ###* @type {?string} ###
    @id = null
    ###* @type {?string} ###
    @name = null
    ###* @type {?string} ###
    @sourceId = null
    ###* @type {?number} ###
    @count = null
    ###* @type {?number} ###
    @stride = null
    ###* @type {?number} ###
    @offset = null
    ###* @type {Int32Array|Uint8Array|Float32Array|Array.<!string>|null} ###
    @data = null
    ###* @type {!Object.<string, string>} ###
    @params = {}         # 0..N named parameters
    return @

###*
*   @param {!number} indent
*   @param {!string} prefix
*   @return {!string}
###
ColladaLoader2.Source::getInfo = (indent, prefix) ->
    output = ColladaLoader2.graphNodeString indent, prefix + "<source id='#{@id}' name='#{@name}'>\n"
    output += ColladaLoader2.getNodeInfo @sourceId, indent+1, "sourceId "
    return output

###*
*   @param {?ColladaLoader2.UrlLink|?ColladaLoader2.FxLink|?ColladaLoader2.SidLink|undefined} link
*   @return {?ColladaLoader2.Source}
###
ColladaLoader2.Source.fromLink = (link) ->
    `/** @type{ColladaLoader2.Source} */ (ColladaLoader2._getLinkTarget(link, ColladaLoader2.Source))`

#==============================================================================
#   ColladaLoader2.Vertices
#==============================================================================
###*
*   @constructor
*   @struct
*   @implements {ColladaLoader2.UrlTarget}
###
ColladaLoader2.Vertices = () ->
    ###* @type {?string} ###
    @id = null
    ###* @type {?string} ###
    @name = null
    ###* @type {!Array.<!ColladaLoader2.Input>} ###
    @inputs = []         # 0..N optional inputs with a non-unique semantic
    return @

###*
*   @param {!number} indent
*   @param {!string} prefix
*   @return {!string}
###
ColladaLoader2.Vertices::getInfo = (indent, prefix) ->
    output = ColladaLoader2.graphNodeString indent, prefix + "<vertices id='#{@id}' name='#{@name}'>\n"
    for input in @inputs
        output += ColladaLoader2.getNodeInfo input, indent+1, "input "
    return output

###*
*   @param {?ColladaLoader2.UrlLink|?ColladaLoader2.FxLink|?ColladaLoader2.SidLink|undefined} link
*   @return {?ColladaLoader2.Vertices}
###
ColladaLoader2.Vertices.fromLink = (link) ->
    `/** @type{ColladaLoader2.Vertices} */ (ColladaLoader2._getLinkTarget(link, ColladaLoader2.Vertices))`

#==============================================================================
#   ColladaLoader2.Triangles
#==============================================================================
###*
*   @constructor
*   @struct
###
ColladaLoader2.Triangles = () ->
    ###* @type {?string} ###
    @name = null
    ###* @type {?string} ###
    @type = null         # "triangles", "polylist", or "polygons"
    ###* @type {?number} ###
    @count = null
    ###* @type {?string} ###
    @material = null     # A material "symbol", bound by <bind_material>
    ###* @type {!Array.<!ColladaLoader2.Input>} ###
    @inputs = []         # 0..N optional inputs with a non-unique semantic
    ###* @type {?Int32Array} ###
    @indices = null
    ###* @type {?Int32Array} ###
    @vcount = null       # Number of vertices per primitive (for polylist/polygons)
    return @

###*
*   @param {!number} indent
*   @param {!string} prefix
*   @return {!string}
###
ColladaLoader2.Triangles::getInfo = (indent, prefix) ->
    output = ColladaLoader2.graphNodeString indent, prefix + "<triangles name='#{@name}'>\n"
    output += ColladaLoader2.getNodeInfo @material, indent+1, "material "
    for input in @inputs
        output += ColladaLoader2.getNodeInfo input, indent+1, "input "
    return output

#==============================================================================
#   ColladaLoader2.Input
#==============================================================================
###*
*   @constructor
*   @struct
###
ColladaLoader2.Input = () ->
    ###* @type {?string} ###
    @semantic = null     # "VERTEX", "POSITION", "NORMAL", "TEXCOORD", ...
    ###* @type {?ColladaLoader2.UrlLink} ###
    @source = null       # URL of source object
    ###* @type {?number} ###
    @offset = null       # Offset in index array
    ###* @type {?number} ###
    @set = null          # Optional set identifier
    return @

###*
*   @param {!number} indent
*   @param {!string} prefix
*   @return {!string}
###
ColladaLoader2.Input::getInfo = (indent, prefix) ->
    output = ColladaLoader2.graphNodeString indent, prefix + "<input semantic=#{@semantic}>\n"
    output += ColladaLoader2.getNodeInfo @source, indent+1, "source "
    return output

#==============================================================================
#   ColladaLoader2.Controller
#==============================================================================
###*
*   @constructor
*   @struct
*   @implements {ColladaLoader2.UrlTarget}
###
ColladaLoader2.Controller = () ->
    ###* @type {?string} ###
    @id = null
    ###* @type {?string} ###
    @name = null
    ###* @type {?ColladaLoader2.Skin} ###
    @skin = null
    ###* @type {?ColladaLoader2.Morph} ###
    @morph = null
    return @

###*
*   @param {!number} indent
*   @param {!string} prefix
*   @return {!string}
###
ColladaLoader2.Controller::getInfo = (indent, prefix) ->
    output = ColladaLoader2.graphNodeString indent, prefix + "<controller id='#{@id}', name='#{@name}'>\n"
    output += ColladaLoader2.getNodeInfo @skin, indent+1, "skin "
    output += ColladaLoader2.getNodeInfo @morph, indent+1, "morph "
    return output

###*
*   @param {?ColladaLoader2.UrlLink|?ColladaLoader2.FxLink|?ColladaLoader2.SidLink|undefined} link
*   @return {?ColladaLoader2.Controller}
###
ColladaLoader2.Controller.fromLink = (link) ->
    `/** @type{ColladaLoader2.Controller} */ (ColladaLoader2._getLinkTarget(link, ColladaLoader2.Controller))`

#==============================================================================
#   ColladaLoader2.Skin
#==============================================================================
###*
*   @constructor
*   @struct
###
ColladaLoader2.Skin = () ->
    ###* @type {?ColladaLoader2.UrlLink} ###
    @source = null
    ###* @type {?Float32Array} ###
    @bindShapeMatrix = null
    ###* @type {!Array.<!ColladaLoader2.Source>} ###
    @sources = []
    ###* @type {?ColladaLoader2.Joints} ###
    @joints = null
    ###* @type {?ColladaLoader2.VertexWeights} ###
    @vertexWeights = null
    return @

###*
*   @param {!number} indent
*   @param {!string} prefix
*   @return {!string}
###
ColladaLoader2.Skin::getInfo = (indent, prefix) ->
    output = ColladaLoader2.graphNodeString indent, prefix + "<skin source='#{@source}'>\n"
    output += ColladaLoader2.getNodeInfo @bindShapeMatrix, indent+1, "bind_shape_matrix "
    for source in @sources
        output += ColladaLoader2.getNodeInfo source, indent+1, "source "
    output += ColladaLoader2.getNodeInfo @joints, indent+1, "joints "
    output += ColladaLoader2.getNodeInfo @vertexWeights, indent+1, "vertex_weights "
    return output

#==============================================================================
#   ColladaLoader2.Morph
#==============================================================================
###*
*   @constructor
*   @struct
###
ColladaLoader2.Morph = () ->
    return @

#==============================================================================
#   ColladaLoader2.Joints
#==============================================================================
###*
*   @constructor
*   @struct
###
ColladaLoader2.Joints = () ->
    ###* @type {?ColladaLoader2.Input} ###
    @joints = null
    ###* @type {?ColladaLoader2.Input} ###
    @invBindMatrices = null
    return @

###*
*   @param {!number} indent
*   @param {!string} prefix
*   @return {!string}
###
ColladaLoader2.Joints::getInfo = (indent, prefix) ->
    output = ColladaLoader2.graphNodeString indent, prefix + "<joints>\n"
    output += ColladaLoader2.getNodeInfo @joints, indent+1, "joints "
    output += ColladaLoader2.getNodeInfo @invBindMatrices, indent+1, "invBindMatrices "
    return output

#==============================================================================
#   ColladaLoader2.VertexWeights
#==============================================================================
###*
*   @constructor
*   @struct
###
ColladaLoader2.VertexWeights = () ->
    ###* @type {!Array.<!ColladaLoader2.Input>} ###
    @inputs = []
    ###* @type {?Int32Array} ###
    @vcount = null
    ###* @type {?Int32Array} ###
    @v = null
    ###* @type {?ColladaLoader2.Input} ###
    @joints = null
    ###* @type {?ColladaLoader2.Input} ###
    @weights = null
    ###* @type {?number} ###
    @count = null
    return @

###*
*   @param {!number} indent
*   @param {!string} prefix
*   @return {!string}
###
ColladaLoader2.VertexWeights::getInfo = (indent, prefix) ->
    output = ColladaLoader2.graphNodeString indent, prefix + "<vertex_weights>\n"
    output += ColladaLoader2.getNodeInfo @joints, indent+1, "joints "
    output += ColladaLoader2.getNodeInfo @weights, indent+1, "weights "
    return output

#==============================================================================
#   ColladaLoader2.Animation
#==============================================================================
###*
*   @constructor
*   @struct
*   @implements {ColladaLoader2.UrlTarget}
###
ColladaLoader2.Animation = () ->
    ###* @type {?string} ###
    @id = null
    ###* @type {?string} ###
    @name = null
    ###* @type {?ColladaLoader2.Animation} ###
    @parent = null
    ###* @type {?string} ###
    @rootId = null   # Id of the root animation
    ###* @type {?string} ###
    @rootName = null # Name of the root animation
    ###* @type {!Array.<!ColladaLoader2.Animation>} ###
    @animations = []
    ###* @type {!Array.<!ColladaLoader2.UrlLink>} ###
    @sources = []
    ###* @type {!Array.<!ColladaLoader2.UrlLink>} ###
    @samplers = []
    ###* @type {!Array.<!ColladaLoader2.Channel>} ###
    @channels = []
    return @

###*
*   @param {!number} indent
*   @param {!string} prefix
*   @return {!string}
###
ColladaLoader2.Animation::getInfo = (indent, prefix) ->
    output = ColladaLoader2.graphNodeString indent, prefix + "<animation id='#{@id}', name='#{@name}'>\n"
    for animation in @animations
        output += ColladaLoader2.getNodeInfo animation, indent+1, "animation "
    for source in @sources
        output += ColladaLoader2.getNodeInfo source, indent+1, "source "
    for sampler in @samplers
        output += ColladaLoader2.getNodeInfo sampler, indent+1, "sampler "
    for channel in @channels
        output += ColladaLoader2.getNodeInfo channel, indent+1, "channel "
    return output

###*
*   @param {?ColladaLoader2.UrlLink|?ColladaLoader2.FxLink|?ColladaLoader2.SidLink|undefined} link
*   @return {?ColladaLoader2.Animation}
###
ColladaLoader2.Animation.fromLink = (link) ->
    `/** @type{ColladaLoader2.Animation} */ (ColladaLoader2._getLinkTarget(link, ColladaLoader2.Animation))`

#==============================================================================
#   ColladaLoader2.Sampler
#==============================================================================
###*
*   @constructor
*   @struct
*   @implements {ColladaLoader2.UrlTarget}
###
ColladaLoader2.Sampler = () ->
    ###* @type {?string} ###
    @id = null
    ###* @type {?ColladaLoader2.Input} ###
    @input = null
    ###* @type {!Array.<!ColladaLoader2.Input>} ###
    @outputs = []
    ###* @type {!Array.<!ColladaLoader2.Input>} ###
    @inTangents = []
    ###* @type {!Array.<!ColladaLoader2.Input>} ###
    @outTangents = []
    ###* @type {?string} ###
    @interpolation = null
    return @

###*
*   @param {!number} indent
*   @param {!string} prefix
*   @return {!string}
###
ColladaLoader2.Sampler::getInfo = (indent, prefix) ->
    output = ColladaLoader2.graphNodeString indent, prefix + "<sampler id='#{@id}'>\n"
    output += ColladaLoader2.getNodeInfo @input, indent+1, "input "
    for o in @outputs
        output += ColladaLoader2.getNodeInfo o, indent+1, "output "
    for t in @inTangents
        output += ColladaLoader2.getNodeInfo t, indent+1, "inTangent "
    for t in @outTangents
        output += ColladaLoader2.getNodeInfo t, indent+1, "outTangent "
    output += ColladaLoader2.getNodeInfo @interpolation, indent+1, "interpolation "
    return output

###*
*   @param {?ColladaLoader2.UrlLink|?ColladaLoader2.FxLink|?ColladaLoader2.SidLink|undefined} link
*   @return {?ColladaLoader2.Sampler}
###
ColladaLoader2.Sampler.fromLink = (link) ->
    `/** @type{ColladaLoader2.Sampler} */ (ColladaLoader2._getLinkTarget(link, ColladaLoader2.Sampler))`

#==============================================================================
#   ColladaLoader2.Channel
#==============================================================================
###*
*   @constructor
*   @struct
###
ColladaLoader2.Channel = () ->
    ###* @type {?ColladaLoader2.Animation} ###
    @animation = null
    ###* @type {?ColladaLoader2.UrlLink} ###
    @source = null
    ###* @type {?ColladaLoader2.SidLink} ###
    @target = null
    return @

###*
*   @param {!number} indent
*   @param {!string} prefix
*   @return {!string}
###
ColladaLoader2.Channel::getInfo = (indent, prefix) ->
    output = ColladaLoader2.graphNodeString indent, prefix + "<channel>\n"
    output += ColladaLoader2.getNodeInfo @source, indent+1, "source "
    output += ColladaLoader2.getNodeInfo @target, indent+1, "target "
    return output

#==============================================================================
#   ColladaLoader2.Light
#==============================================================================
###*
*   @constructor
*   @struct
*   @implements {ColladaLoader2.UrlTarget}
*   @implements {ColladaLoader2.SidScope}
###
ColladaLoader2.Light = () ->
    ###* @type {?string} ###
    @id = null
    ###* @type {?string} ###
    @name = null
    ###* @type {?string} ###
    @type = null
    ###* @type {?Float32Array} ###
    @color = null
    ###* @type {!Object.<!string, !ColladaLoader2.LightParam>} ###
    @params = {} # Parameters may have SIDs
    ###* @type {!Array.<!ColladaLoader2.SidScope|!ColladaLoader2.SidTarget>} ###
    @sidChildren = []
    return @

###*
*   @param {!number} indent
*   @param {!string} prefix
*   @return {!string}
###
ColladaLoader2.Light::getInfo = (indent, prefix) ->
    return ColladaLoader2.graphNodeString indent, prefix + "<light>\n"

###*
*   @param {?ColladaLoader2.UrlLink|?ColladaLoader2.FxLink|?ColladaLoader2.SidLink|undefined} link
*   @return {?ColladaLoader2.Light}
###
ColladaLoader2.Light.fromLink = (link) ->
    `/** @type{ColladaLoader2.Light} */ (ColladaLoader2._getLinkTarget(link, ColladaLoader2.Light))`

#==============================================================================
#   ColladaLoader2.LightParam
#==============================================================================
###*
*   @constructor
*   @struct
*   @implements {ColladaLoader2.SidTarget}
###
ColladaLoader2.LightParam = () ->
    ###* @type {?string} ###
    @sid = null
    ###* @type {?string} ###
    @name = null
    ###* @type {?number} ###
    @value = null
    return @

###*
*   @param {?ColladaLoader2.UrlLink|?ColladaLoader2.FxLink|?ColladaLoader2.SidLink|undefined} link
*   @return {?ColladaLoader2.LightParam}
###
ColladaLoader2.LightParam.fromLink = (link) ->
    `/** @type{ColladaLoader2.LightParam} */ (ColladaLoader2._getLinkTarget(link, ColladaLoader2.LightParam))`

#==============================================================================
#   ColladaLoader2.Camera
#==============================================================================
###*
*   @constructor
*   @struct
*   @implements {ColladaLoader2.UrlTarget}
*   @implements {ColladaLoader2.SidScope}
###
ColladaLoader2.Camera = () ->
    ###* @type {?string} ###
    @id = null
    ###* @type {?string} ###
    @name = null
    ###* @type {?string} ###
    @type = null
    ###* @type {!Object.<!string, !ColladaLoader2.CameraParam>} ###
    @params = {} # Parameters may have SIDs
    ###* @type {!Array.<!ColladaLoader2.SidScope|!ColladaLoader2.SidTarget>} ###
    @sidChildren = []
    return @

###*
*   @param {!number} indent
*   @param {!string} prefix
*   @return {!string}
###
ColladaLoader2.Camera::getInfo = (indent, prefix) ->
    return ColladaLoader2.graphNodeString indent, prefix + "<camera>\n"

###*
*   @param {?ColladaLoader2.UrlLink|?ColladaLoader2.FxLink|?ColladaLoader2.SidLink|undefined} link
*   @return {?ColladaLoader2.Camera}
###
ColladaLoader2.Camera.fromLink = (link) ->
    `/** @type{ColladaLoader2.Camera} */ (ColladaLoader2._getLinkTarget(link, ColladaLoader2.Camera))`

#==============================================================================
#   ColladaLoader2.CameraParam
#==============================================================================
###*
*   @constructor
*   @struct
*   @implements {ColladaLoader2.SidTarget}
###
ColladaLoader2.CameraParam = () ->
    ###* @type {?string} ###
    @sid = null
    ###* @type {?string} ###
    @name = null
    ###* @type {?number} ###
    @value = null
    return @

###*
*   @param {?ColladaLoader2.UrlLink|?ColladaLoader2.FxLink|?ColladaLoader2.SidLink|undefined} link
*   @return {?ColladaLoader2.CameraParam}
###
ColladaLoader2.CameraParam.fromLink = (link) ->
    `/** @type{ColladaLoader2.CameraParam} */ (ColladaLoader2._getLinkTarget(link, ColladaLoader2.CameraParam))`

#==============================================================================
#   ColladaLoader2.ThreejsAnimationChannel
#==============================================================================
###*
*   @constructor
*   @struct
###
ColladaLoader2.ThreejsAnimationChannel = () ->
    ###* @type {?Float32Array} ###
    @inputData = null
    ###* @type {Array.<string>|Float32Array|Int32Array|Uint8Array|null} ###
    @outputData = null
    ###* @type {?number} ###
    @offset = null
    ###* @type {?number} ###
    @stride = null
    ###* @type {?number} ###
    @count = null
    ###* @type {?string} ###
    @semantic = null  # E.g., "X" or "ANGLE"
    ###* @type {?ColladaLoader2.Animation} ###
    @animation = null
    return @

#==============================================================================
#   ColladaLoader2.ThreejsSkeletonBone
#==============================================================================
###*
*   @constructor
*   @struct
###
ColladaLoader2.ThreejsSkeletonBone = () ->
    ###* @type {?number} ###
    @index = null
    ###* @type {?ColladaLoader2.VisualSceneNode} ###
    @node = null
    ###* @type {?string} ###
    @sid = null
    ###* @type {?ColladaLoader2.ThreejsSkeletonBone} ###
    @parent = null
    ###* @type {?boolean} ###
    @isAnimated = null
    ###* @type {!THREE.Matrix4} ###
    @matrix = new THREE.Matrix4          # Local object transformation (relative to parent bone)
    ###* @type {!THREE.Matrix4} ###
    @worldMatrix = new THREE.Matrix4     # Local bone space to world space (includes all parent bone transformations)
    ###* @type {!THREE.Matrix4} ###
    @invBindMatrix = new THREE.Matrix4   # Skin world space to local bone space
    ###* @type {!THREE.Matrix4} ###
    @skinMatrix = new THREE.Matrix4      # Total transformation for skin vertices
    ###* @type {!boolean} ###
    @worldMatrixDirty = true
    return @

###*
*   Computes the world transformation matrix
*   @return {!THREE.Matrix4}
###
ColladaLoader2.ThreejsSkeletonBone::getWorldMatrix = () ->
    if @worldMatrixDirty        
        if @parent?
            @worldMatrix.multiplyMatrices @parent.getWorldMatrix(), @matrix
        else
            @worldMatrix.copy @matrix
        @worldMatrixDirty = false
    return @worldMatrix

###*
*   Applies the transformation from the associated animation channel (if any)
*   @param {!number} frame
###
ColladaLoader2.ThreejsSkeletonBone::applyAnimation = (frame) ->
    if @isAnimated
        for transform in @node.transformations
            transform.applyAnimationKeyframe frame
        @node.getTransformMatrix @matrix
    # Updating the matrix invalidates the transform of all child nodes
    # Instead, flag all nodes as dirty so all of them get updated
    @worldMatrixDirty = true
    return null

###*
*   Updates the skin matrix
*   @param {!THREE.Matrix4} bindShapeMatrix
###
ColladaLoader2.ThreejsSkeletonBone::updateSkinMatrix = (bindShapeMatrix) ->
    worldMatrix = @getWorldMatrix()
    @skinMatrix.multiplyMatrices worldMatrix, @invBindMatrix
    @skinMatrix.multiplyMatrices @skinMatrix, bindShapeMatrix
    return null

#==============================================================================
#   ColladaLoader2.ThreejsMaterialMap
#==============================================================================
###*
*   @constructor
*   @struct
###
ColladaLoader2.ThreejsMaterialMap = () ->
    ###* @type {!Array.<!THREE.Material>} ###
    @materials = []
    ###* @type {!Object.<string, number>} ###
    @indices = {}
    ###* @type {!boolean} ###
    @needTangents = false
    return @

#==============================================================================
#   ColladaLoader2.File
#==============================================================================
###*
*   This class contains all state needed for parsing a COLLADA file
*
*   @constructor
*   @struct
*   @param {!ColladaLoader2} loader
###
ColladaLoader2.File = (loader) ->
    blockCommentWorkaround = null
    # Internal data
    ###* @type {?string} ###
    @_url = null
    ###* @type {!string} ###
    @_baseUrl = ""
    ###* @type {!ColladaLoader2} ###
    @_loader = loader
    # Files may be loaded asynchronously.
    # Copy options at the time this object was created.
    ###* @dict ###
    @_options = {}
    for key, value of loader.options
        @_options[key] = value
    ###* @type {?function(ColladaLoader2.File)} ###
    @_readyCallback = null
    ###* @type {?function(ColladaLoader2.File, number)} ###
    @_progressCallback = null

    # Parsed collada objects
    ###* @struct ###
    @dae =
        ###* @type {!Object.<!string, !ColladaLoader2.UrlTarget>} ###
        ids : {}
        ###* @type {!Array.<!ColladaLoader2.AnimationTarget>} ###
        animationTargets : []
        ###* @type {!Array.<!ColladaLoader2.Effect>} ###
        libEffects : []
        ###* @type {!Array.<!ColladaLoader2.Material>} ###
        libMaterials : []
        ###* @type {!Array.<!ColladaLoader2.Geometry>} ###
        libGeometries : []
        ###* @type {!Array.<!ColladaLoader2.Controller>} ###
        libControllers : []
        ###* @type {!Array.<!ColladaLoader2.Light>} ###
        libLights : []
        ###* @type {!Array.<!ColladaLoader2.Camera>} ###
        libCameras : []
        ###* @type {!Array.<!ColladaLoader2.Image>} ###
        libImages : []
        ###* @type {!Array.<!ColladaLoader2.VisualScene>} ###
        libVisualScenes : []
        ###* @type {!Array.<!ColladaLoader2.Animation>} ###
        libAnimations : []
        ###* @type {?ColladaLoader2.Asset} ###
        asset : null
        ###* @type {?ColladaLoader2.UrlLink} ###
        scene : null

    # Created three.js objects
    ###* @struct ###
    @threejs =
        ###* @type {?THREE.Object3D} ###
        scene : null         # The root element of the loaded scene
        ###* @type {!Array.<!THREE.Texture>} ###
        images : []
        ###* @type {!Array.<!THREE.Geometry>} ###
        geometries : []
        ###* @type {!Array.<!THREE.Material>} ###
        materials : []

    # Convenience
    ###*
    * @type {?THREE.Object3D}
    * @expose
    ###
    @scene = null  # A shortcut to @threejs.scene for compatibility with the three.js collada loader

    return @

###*
*   Sets the file URL
*   @param {!string} url
###
ColladaLoader2.File::setUrl = (url) ->
    if url?
        @_url = url
        parts = url.split "/" 
        parts.pop()
        @_baseUrl = (if parts.length < 1 then "." else parts.join "/") + "/"
    else
        @_url = ""
        @_baseUrl = ""
    return

###*
*   Returns a string describing the contents of a COLLADA lib
*   @param {?Object} lib
*   @param {!number} indent
*   @param {!string} libname
*   @return {!string}
###
ColladaLoader2.File::getLibInfo = (lib, indent, libname) ->
    return "" unless lib?
    output = ColladaLoader2.graphNodeString indent, libname + " <#{libname}>\n"
    numElements = 0
    for child in lib
        output += ColladaLoader2.getNodeInfo child, indent+1, ""
        numElements += 1
    if numElements > 0 then return output else return ""

###*
*   @param {!number} indent
*   @param {!string} prefix
*   @return {!string}
###
ColladaLoader2.File::getInfo = (indent, prefix) ->
    output = "<collada url='#{@_url}'>\n"
    output += ColladaLoader2.getNodeInfo @dae.asset, indent+1, "asset "
    output += ColladaLoader2.getNodeInfo @dae.scene, indent+1, "scene "
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
# ColladaLoader2.File: PRIVATE METHODS - EXTRACTING ELEMENT DATA
#==============================================================================

###*
*   Returns the value of an attribute as a float
*
*   @param {!Node} el
*   @param {!string} name
*   @param {?number} defaultValue
*   @param {!boolean} required
*   @return {?number}
###
ColladaLoader2.File::_getAttributeAsFloat = (el, name, defaultValue, required) ->
    data = el.getAttribute name
    if data?
        return parseFloat data
    else if not required
        return defaultValue
    else
        ColladaLoader2._log "Element #{el.nodeName} is missing required attribute #{name}. Using default value #{defaultValue}.", ColladaLoader2.messageError
        return defaultValue

###*
*   Returns the value of an attribute as an integer
*
*   @param {!Node} el
*   @param {!string} name
*   @param {?number} defaultValue
*   @param {!boolean} required
*   @return {?number}
###
ColladaLoader2.File::_getAttributeAsInt = (el, name, defaultValue, required) ->
    data = el.getAttribute name
    if data?
        return parseInt data, 10
    else if not required
        return defaultValue
    else
        ColladaLoader2._log "Element #{el.nodeName} is missing required attribute #{name}. Using default value #{defaultValue}.", ColladaLoader2.messageError
        return defaultValue

###*
*   Returns the value of an attribute as a string
*
*   @param {!Node} el
*   @param {!string} name
*   @param {?string} defaultValue
*   @param {!boolean} required
*   @return {?string}
###
ColladaLoader2.File::_getAttributeAsString = (el, name, defaultValue, required) ->
    data = el.getAttribute name
    if data?
        return data
    else if not required
        return defaultValue
    else
        ColladaLoader2._log "Element #{el.nodeName} is missing required attribute #{name}. Using default value #{defaultValue}.", ColladaLoader2.messageError
        return defaultValue

###*
*   Returns the value of an attribute as a URL link
*
*   @param {!Node} el
*   @param {!string} name
*   @param {!boolean} required
*   @return {?ColladaLoader2.UrlLink}
###
ColladaLoader2.File::_getAttributeAsUrlLink = (el, name, required) ->
    data = el.getAttribute name
    if data?
        return new ColladaLoader2.UrlLink data, @
    else
        if required
            ColladaLoader2._log "Element #{el.nodeName} is missing required attribute #{name}.", ColladaLoader2.messageError
        return null

###*
*   Returns the value of an attribute as a sid link
*
*   @param {!Node} el
*   @param {!string} name
*   @param {?string} parentId
*   @param {!boolean} required
*   @return {?ColladaLoader2.SidLink}
###
ColladaLoader2.File::_getAttributeAsSidLink = (el, name, parentId, required) ->
    data = el.getAttribute name
    if data?
        return new ColladaLoader2.SidLink parentId, data, @
    else
        if required
            ColladaLoader2._log "Element #{el.nodeName} is missing required attribute #{name}.", ColladaLoader2.messageError
        return null

###*
*   Returns the value of an attribute as a fx link
*
*   @param {!Node} el
*   @param {!string} name
*   @param {!ColladaLoader2.FxScope} scope
*   @param {!boolean} required
*   @return {?ColladaLoader2.FxLink}
###
ColladaLoader2.File::_getAttributeAsFxLink = (el, name, scope, required) ->
    data = el.getAttribute name
    if data?
        return new ColladaLoader2.FxLink data, scope, @
    else
        if required
            ColladaLoader2._log "Element #{el.nodeName} is missing required attribute #{name}.", ColladaLoader2.messageError
        return null

#==============================================================================
# ColladaLoader2.File: PRIVATE METHODS - HYPERLINK MANAGEMENT
#==============================================================================

###*
*   Inserts a new URL link target
*
*   @param {!ColladaLoader2.UrlTarget} object
*   @param {?Object} lib
*   @param {!boolean} needsId
###
ColladaLoader2.File::_addUrlTarget = (object, lib, needsId) ->
    if lib? then lib.push object

    id = object.id
    if not id?
        if needsId then ColladaLoader2._log "Object has no ID.", ColladaLoader2.messageError
        return
    if @dae.ids[id]?
        ColladaLoader2._log "There is already an object with ID #{id}.", ColladaLoader2.messageError
        return
    @dae.ids[id] = object
    return

###*
*   Inserts a new FX link target
*
*   @param {!ColladaLoader2.FxTarget} object
*   @param {!ColladaLoader2.FxScope} scope
###
ColladaLoader2.File::_addFxTarget = (object, scope) ->
    sid = object.sid
    if not sid?
        ColladaLoader2._log "Cannot add a FX target: object has no SID.", ColladaLoader2.messageError
        return
    if scope.sids[sid]?
        ColladaLoader2._log "There is already an FX target with SID #{sid}.", ColladaLoader2.messageError
        return
    object.fxScope = scope
    scope.sids[sid] = object
    return

###*
*   Inserts a new SID link target
*
*   @param {!ColladaLoader2.SidTarget} object
*   @param {!ColladaLoader2.SidScope} parent
###
ColladaLoader2.File::_addSidTarget = (object, parent) ->
    if not parent.sidChildren? then parent.sidChildren = []
    parent.sidChildren.push object
    return

#==============================================================================
# ColladaLoader2.File: PRIVATE METHODS - PARSING XML ELEMENTS
#==============================================================================

###*
*   Parses the COLLADA XML document
*
*   @param {!XMLDocument} doc
###
ColladaLoader2.File::_parseXml = (doc) ->
    if not doc.childNodes?
        ColladaLoader2._log "Cannot parse document, no 'childNodes' property (not an XML document?).", ColladaLoader2.messageError
    if doc.childNodes.length is 0
        ColladaLoader2._log "Cannot parse document, document is empty.", ColladaLoader2.messageError
    else
        colladaFound = false
        for child in doc.childNodes when child.nodeType is 1
            switch child.nodeName
                when "COLLADA"
                    if colladaFound
                        ColladaLoader2._log "Ignoring unexpected second top level COLLADA element.", ColladaLoader2.messageWarning
                    else
                        colladaFound = true
                        @_parseCollada child
                else ColladaLoader2._reportUnexpectedChild child
        if not colladaFound then ColladaLoader2._log "Cannot parse document, no COLLADA element.", ColladaLoader2.messageError
    return

###*
*   Parses a <COLLADA> element
*
*   @param {!Node} el
###
ColladaLoader2.File::_parseCollada = (el) ->
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
            else ColladaLoader2._reportUnexpectedChild child
    return

###*
*   Parses an <asset> element.
*
*   @param {!Node} el
###
ColladaLoader2.File::_parseAsset = (el) ->
    if not @dae.asset then @dae.asset = new ColladaLoader2.Asset()
    for child in el.childNodes when child.nodeType is 1
        switch child.nodeName
            when "unit"
                @dae.asset.unit = @_getAttributeAsFloat child, "meter", 1, false
            when "up_axis"
                @dae.asset.upAxis = child.textContent.toUpperCase().charAt(0)
            when "contributor", "created", "modified", "revision", "title", "subject", "keywords"
                # Known elements that can be safely ignored
                ColladaLoader2._reportUnhandledExtra child
            else ColladaLoader2._reportUnexpectedChild child
    return

###*
*   Parses a <scene> element.
*
*   @param {!Node} el
###
ColladaLoader2.File::_parseScene = (el) ->
    for child in el.childNodes when child.nodeType is 1
        switch child.nodeName
            when "instance_visual_scene"
                @dae.scene = @_getAttributeAsUrlLink child, "url", true
            else ColladaLoader2._reportUnexpectedChild child
    return

###*
*   Parses a <library_visual_scenes> element.
*
*   @param {!Node} el
###
ColladaLoader2.File::_parseLibVisualScene = (el) ->
    for child in el.childNodes when child.nodeType is 1
        switch child.nodeName
            when "visual_scene" then @_parseVisualScene child
            else ColladaLoader2._reportUnexpectedChild child
    return

###*
*   Parses a <visual_scene> element.
*
*   @param {!Node} el
###
ColladaLoader2.File::_parseVisualScene = (el) ->
    scene = new ColladaLoader2.VisualScene
    scene.id = @_getAttributeAsString el, "id", null, false
    @_addUrlTarget scene, @dae.libVisualScenes, true

    for child in el.childNodes when child.nodeType is 1
        switch child.nodeName
            when "node" then @_parseSceneNode scene, child
            else ColladaLoader2._reportUnexpectedChild child
    return

###*
*   Parses a <node> element.
*
*   @param {!ColladaLoader2.VisualScene|!ColladaLoader2.VisualSceneNode} parent
*   @param {!Node} el
###
ColladaLoader2.File::_parseSceneNode = (parent, el) ->
    node = new ColladaLoader2.VisualSceneNode
    node.id    = @_getAttributeAsString el, "id",    null, false
    node.sid   = @_getAttributeAsString el, "sid",   null, false
    node.name  = @_getAttributeAsString el, "name",  null, false
    node.type  = @_getAttributeAsString el, "type",  null, false
    node.layer = @_getAttributeAsString el, "layer", null, false
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
            else ColladaLoader2._reportUnexpectedChild child
    return

###*
*   Parses an <instance_geometry> element.
*
*   @param {!ColladaLoader2.VisualSceneNode} parent
*   @param {!Node} el
###
ColladaLoader2.File::_parseInstanceGeometry = (parent, el) ->
    geometry = new ColladaLoader2.InstanceGeometry()
    geometry.geometry = @_getAttributeAsUrlLink el, "url",       true
    geometry.sid      = @_getAttributeAsString  el, "sid", null, false
    parent.geometries.push geometry
    @_addSidTarget geometry, parent

    for child in el.childNodes when child.nodeType is 1
        switch child.nodeName
            when "bind_material" then @_parseBindMaterial geometry, child
            else ColladaLoader2._reportUnexpectedChild child
    return

###*
*   Parses an <instance_controller> element.
*
*   @param {!ColladaLoader2.VisualSceneNode} parent
*   @param {!Node} el
###
ColladaLoader2.File::_parseInstanceController = (parent, el) ->
    controller = new ColladaLoader2.InstanceController()
    controller.controller  = @_getAttributeAsUrlLink el, "url",        true
    controller.sid         = @_getAttributeAsString  el, "sid",  null, false
    controller.name        = @_getAttributeAsString  el, "name", null, false
    parent.controllers.push controller
    @_addSidTarget controller, parent

    for child in el.childNodes when child.nodeType is 1
        switch child.nodeName
            when "skeleton" then controller.skeletons.push new ColladaLoader2.UrlLink child.textContent, @
            when "bind_material" then @_parseBindMaterial controller, child
            else ColladaLoader2._reportUnexpectedChild child
    return

###*
*   Parses a <bind_material> element.
*
*   @param {!ColladaLoader2.InstanceGeometry|!ColladaLoader2.InstanceController} parent
*   @param {!Node} el
###
ColladaLoader2.File::_parseBindMaterial = (parent, el) ->
    for child in el.childNodes when child.nodeType is 1
        switch child.nodeName
            when "technique_common" then @_parseBindMaterialTechnique parent, child
            else ColladaLoader2._reportUnexpectedChild child
    return

###*
*   Parses a <bind_material>/<technique_common> element.
*
*   @param {!ColladaLoader2.InstanceGeometry|!ColladaLoader2.InstanceController} parent
*   @param {!Node} el
###
ColladaLoader2.File::_parseBindMaterialTechnique = (parent, el) ->
    for child in el.childNodes when child.nodeType is 1
        switch child.nodeName
            when "instance_material" then @_parseInstanceMaterial parent, child
            else ColladaLoader2._reportUnexpectedChild child
    return

###*
*   Parses an <instance_material> element.
*
*   @param {!ColladaLoader2.InstanceGeometry|!ColladaLoader2.InstanceController} parent
*   @param {!Node} el
###
ColladaLoader2.File::_parseInstanceMaterial = (parent, el) ->
    material = new ColladaLoader2.InstanceMaterial
    material.symbol   = @_getAttributeAsString  el, "symbol",  null, false
    material.material = @_getAttributeAsUrlLink el, "target",        true
    parent.materials.push material
    @_addSidTarget material, parent

    for child in el.childNodes when child.nodeType is 1
        switch child.nodeName
            when "bind_vertex_input" then @_parseInstanceMaterialBindVertex material, child
            when "bind"              then @_parseInstanceMaterialBind       material, child
            else ColladaLoader2._reportUnexpectedChild child
    return

###*
*   Parses an <instance_material>/<bind_vertex_input> element.
*
*   @param {!ColladaLoader2.InstanceMaterial} material
*   @param {!Node} el
###
ColladaLoader2.File::_parseInstanceMaterialBindVertex = (material, el) ->
    semantic      = @_getAttributeAsString el, "semantic",        null, true
    inputSemantic = @_getAttributeAsString el, "input_semantic",  null, true
    inputSet      = @_getAttributeAsInt    el, "input_set",       null, false
    if semantic? and inputSemantic?
        material.vertexInputs[semantic] = {inputSemantic:inputSemantic, inputSet:inputSet}
    else
        ColladaLoader2._log "Skipped a material vertex binding because of missing semantics.", ColladaLoader2.messageWarning
    return

###*
*   Parses an <instance_material>/<bind> element.
*
*   @param {!ColladaLoader2.InstanceMaterial} material
*   @param {!Node} el
###
ColladaLoader2.File::_parseInstanceMaterialBind = (material, el) ->
    semantic = @_getAttributeAsString  el, "semantic", null, false
    target   = @_getAttributeAsSidLink el, "target",   null, true
    if semantic?
        material.params[semantic] = {target:target}
    else
        ColladaLoader2._log "Skipped a material uniform binding because of missing semantics.", ColladaLoader2.messageWarning
    return

###*
*   Parses a transformation element.
*
*   @param {!ColladaLoader2.VisualSceneNode} parent
*   @param {!Node} el
###
ColladaLoader2.File::_parseTransformElement = (parent, el) ->
    transform = new ColladaLoader2.NodeTransform
    transform.sid  = @_getAttributeAsString el, "sid", null, false
    transform.type = el.nodeName
    transform.node = parent
    parent.transformations.push transform
    @_addSidTarget transform, parent
    @dae.animationTargets.push transform
    
    transform.data = ColladaLoader2._strToFloats el.textContent
    expectedDataLength = 0
    switch transform.type
        when "matrix"    then expectedDataLength = 16
        when "rotate"    then expectedDataLength = 4
        when "translate" then expectedDataLength = 3
        when "scale"     then expectedDataLength = 3
        when "skew"      then expectedDataLength = 7
        when "lookat"    then expectedDataLength = 9
        else ColladaLoader2._log "Unknown transformation type #{transform.type}.", ColladaLoader2.messageError
    if transform.data.length isnt expectedDataLength
        ColladaLoader2._log "Wrong number of elements for transformation type '#{transform.type}': expected #{expectedDataLength}, found #{transform.data.length}", ColladaLoader2.messageError
    return

###*
*   Parses an <instance_light> element.
*
*   @param {!ColladaLoader2.VisualSceneNode} parent
*   @param {!Node} el
###
ColladaLoader2.File::_parseInstanceLight = (parent, el) ->
    light = new ColladaLoader2.InstanceLight()
    light.light = @_getAttributeAsUrlLink el, "url",        true
    light.sid   = @_getAttributeAsString  el, "sid",  null, false
    light.name  = @_getAttributeAsString  el, "name", null, false
    parent.lights.push light
    @_addSidTarget light, parent

    for child in el.childNodes when child.nodeType is 1
        switch child.nodeName
            when "extra" then ColladaLoader2._reportUnhandledExtra child
            else ColladaLoader2._reportUnexpectedChild child
    return

###*
*   Parses an <instance_camera> element.
*
*   @param {!ColladaLoader2.VisualSceneNode} parent
*   @param {!Node} el
###
ColladaLoader2.File::_parseInstanceCamera = (parent, el) ->
    camera = new ColladaLoader2.InstanceCamera()
    camera.camera = @_getAttributeAsUrlLink el, "url",        true
    camera.sid    = @_getAttributeAsString  el, "sid",  null, false
    camera.name   = @_getAttributeAsString  el, "name", null, false
    parent.cameras.push camera
    @_addSidTarget camera, parent

    for child in el.childNodes when child.nodeType is 1
        switch child.nodeName
            when "extra" then ColladaLoader2._reportUnhandledExtra child
            else ColladaLoader2._reportUnexpectedChild child
    return

###*
*   Parses a <library_effects> element.
*
*   @param {!Node} el
###
ColladaLoader2.File::_parseLibEffect = (el) ->
    for child in el.childNodes when child.nodeType is 1
        switch child.nodeName
            when "effect" then @_parseEffect child
            else ColladaLoader2._reportUnexpectedChild child
    return

###*
*   Parses an <effect> element.
*
*   @param {!Node} el
###
ColladaLoader2.File::_parseEffect = (el) ->
    effect = new ColladaLoader2.Effect
    effect.id = @_getAttributeAsString el, "id", null, true
    @_addUrlTarget effect, @dae.libEffects, true

    for child in el.childNodes when child.nodeType is 1
        switch child.nodeName
            when "profile_COMMON"
                @_parseEffectProfileCommon effect, child
            when "profile"
                ColladaLoader2._log "Skipped non-common effect profile for effect #{effect.id}.", ColladaLoader2.messageWarning
            when "extra"
                @_parseTechniqueExtra effect.technique, child
            else ColladaLoader2._reportUnexpectedChild child
    return

###*
*   Parses an <effect>/<profile_COMMON> element.
*
*   @param {!Node} el
*   @param {!ColladaLoader2.Effect} effect
###
ColladaLoader2.File::_parseEffectProfileCommon = (effect, el) ->
    for child in el.childNodes when child.nodeType is 1
        switch child.nodeName
            when "newparam"  then @_parseEffectNewparam  effect, child
            when "technique" then @_parseEffectTechnique effect, child
            when "extra"     then @_parseTechniqueExtra  effect.technique, child
            else ColladaLoader2._reportUnexpectedChild child
    return

###*
*   Parses a <newparam> element.
*
*   @param {!Node} el
*   @param {!ColladaLoader2.Effect|!ColladaLoader2.EffectTechnique} scope
###
ColladaLoader2.File::_parseEffectNewparam = (scope, el) ->
    param = new ColladaLoader2.EffectParam
    param.sid = @_getAttributeAsString el, "sid", null, false
    @_addFxTarget param, scope
    scope.params.push param

    for child in el.childNodes when child.nodeType is 1
        switch child.nodeName
            when "semantic"  then param.semantic = child.textContent
            when "float"     then param.floats   = ColladaLoader2._strToFloats child.textContent
            when "float2"    then param.floats   = ColladaLoader2._strToFloats child.textContent
            when "float3"    then param.floats   = ColladaLoader2._strToFloats child.textContent
            when "float4"    then param.floats   = ColladaLoader2._strToFloats child.textContent
            when "surface"   then param.surface  = @_parseEffectSurface scope, child
            when "sampler2D" then param.sampler  = @_parseEffectSampler scope, child
            else ColladaLoader2._reportUnexpectedChild child
    return

###*
*   Parses a <newparam>/<surface> element.
*
*   @param {!Node} el
*   @return {!ColladaLoader2.EffectSurface}
*   @param {!ColladaLoader2.Effect|!ColladaLoader2.EffectTechnique} scope
###
ColladaLoader2.File::_parseEffectSurface = (scope, el) ->
    surface = new ColladaLoader2.EffectSurface
    surface.type = @_getAttributeAsString el, "type", null, true

    for child in el.childNodes when child.nodeType is 1
        switch child.nodeName
            when "init_from"       then surface.initFrom       = new ColladaLoader2.UrlLink child.textContent, @
            when "format"          then surface.format         = child.textContent
            when "size"            then surface.size           = ColladaLoader2._strToFloats child.textContent
            when "viewport_ratio"  then surface.viewportRatio  = ColladaLoader2._strToFloats child.textContent
            when "mip_levels"      then surface.mipLevels      = parseInt child.textContent, 10
            when "mipmap_generate" then surface.mipmapGenerate = child.textContent
            else ColladaLoader2._reportUnexpectedChild child
    return surface

###*
*   Parses a <newparam>/<sampler> element.
*
*   @param {!Node} el
*   @return {!ColladaLoader2.EffectSampler}
*   @param {!ColladaLoader2.Effect|!ColladaLoader2.EffectTechnique} scope
###
ColladaLoader2.File::_parseEffectSampler = (scope, el) ->
    sampler = new ColladaLoader2.EffectSampler

    for child in el.childNodes when child.nodeType is 1
        switch child.nodeName
            when "source"          then sampler.surface        = new ColladaLoader2.FxLink child.textContent, scope, @
            when "instance_image"  then sampler.image          = @_getAttributeAsUrlLink child, "url", true
            when "wrap_s"          then sampler.wrapS          = child.textContent
            when "wrap_t"          then sampler.wrapT          = child.textContent
            when "minfilter"       then sampler.minfilter      = child.textContent
            when "magfilter"       then sampler.magfilter      = child.textContent
            when "border_color"    then sampler.borderColor    = ColladaLoader2._strToFloats child.textContent
            when "mipmap_maxlevel" then sampler.mipmapMaxLevel = parseInt   child.textContent, 10
            when "mipmap_bias"     then sampler.mipmapBias     = parseFloat child.textContent
            else ColladaLoader2._reportUnexpectedChild child
    return sampler

###*
*   Parses a <technique> element.
*
*   @param {!Node} el
*   @param {!ColladaLoader2.Effect} effect
###
ColladaLoader2.File::_parseEffectTechnique = (effect, el) ->
    technique = new ColladaLoader2.EffectTechnique
    technique.sid = @_getAttributeAsString el, "sid", null, false
    @_addFxTarget technique, effect
    effect.technique = technique

    for child in el.childNodes when child.nodeType is 1
        switch child.nodeName
            when "blinn", "phong", "lambert", "constant"
                technique.shading = child.nodeName
                @_parseTechniqueParam technique, "COMMON", child
            when "extra"
                @_parseTechniqueExtra technique, child
            else ColladaLoader2._reportUnexpectedChild child
    return

###*
*   Parses a <technique>/<blinn|phong|lambert|constant> element.
*
*   @param {!Node} el
*   @param {!ColladaLoader2.EffectTechnique} technique
*   @param {?string} profile
###
ColladaLoader2.File::_parseTechniqueParam = (technique, profile, el) ->
    for child in el.childNodes when child.nodeType is 1
        switch child.nodeName
            # Surfaces/samplers
            when "newparam" then @_parseEffectNewparam technique, child
            # Color channels
            when "emission"    then technique.emission    = @_parseEffectColorOrTexture technique, child
            when "ambient"     then technique.ambient     = @_parseEffectColorOrTexture technique, child
            when "diffuse"     then technique.diffuse     = @_parseEffectColorOrTexture technique, child
            when "specular"    then technique.specular    = @_parseEffectColorOrTexture technique, child
            when "reflective"  then technique.reflective  = @_parseEffectColorOrTexture technique, child
            when "transparent" then technique.transparent = @_parseEffectColorOrTexture technique, child
            when "bump"        then technique.bump        = @_parseEffectColorOrTexture technique, child
            # Float parameters
            when "shininess"           then technique.shininess           = parseFloat child.childNodes[1].textContent
            when "reflectivity"        then technique.reflectivity        = parseFloat child.childNodes[1].textContent
            when "transparency"        then technique.transparency        = parseFloat child.childNodes[1].textContent
            when "index_of_refraction" then technique.index_of_refraction = parseFloat child.childNodes[1].textContent
            # Extensions
            when "double_sided" then technique.double_sided = (parseFloat child.textContent) > 0
            else ColladaLoader2._reportUnexpectedChild child unless profile isnt "COMMON"
    return

###*
*   Parses a <technique>/<extra> element.
*
*   @param {!Node} el
*   @param {?ColladaLoader2.EffectTechnique} technique
###
ColladaLoader2.File::_parseTechniqueExtra = (technique, el) ->
    if not technique?
        ColladaLoader2._log "Ignored element <extra>, because there is no <technique>.", ColladaLoader2.messageWarning
        return
    for child in el.childNodes when child.nodeType is 1
        switch child.nodeName
            when "technique"
                profile = @_getAttributeAsString child, "profile", null, true
                @_parseTechniqueParam technique, profile, child
            else ColladaLoader2._reportUnhandledExtra child
    return

###*
*   Parses a color or texture element.
*
*   @param {!Node} el
*   @param {!ColladaLoader2.EffectTechnique} technique
*   @return {!ColladaLoader2.ColorOrTexture}
###
ColladaLoader2.File::_parseEffectColorOrTexture = (technique, el) ->
    colorOrTexture = new ColladaLoader2.ColorOrTexture()
    # Only for <transparent> elements:
    colorOrTexture.opaque   = @_getAttributeAsString el, "opaque", null, false
    # Only for <bump> elements (OpenCOLLADA extension):
    colorOrTexture.bumptype = @_getAttributeAsString el, "bumptype", null, false

    for child in el.childNodes when child.nodeType is 1
        switch child.nodeName
            when "color"
                colorOrTexture.color = ColladaLoader2._strToColor child.textContent
            when "texture"
                colorOrTexture.textureSampler = @_getAttributeAsFxLink child, "texture",  technique, true
                colorOrTexture.texcoord       = @_getAttributeAsString child, "texcoord", null,      true
            else ColladaLoader2._reportUnexpectedChild child
    return colorOrTexture

###*
*   Parses a <lib_materials> element.
*
*   @param {!Node} el
###
ColladaLoader2.File::_parseLibMaterial = (el) ->
    for child in el.childNodes when child.nodeType is 1
        switch child.nodeName
            when "material" then @_parseMaterial child
            else ColladaLoader2._reportUnexpectedChild child
    return

###*
*   Parses a <material> element.
*
*   @param {!Node} el
###
ColladaLoader2.File::_parseMaterial = (el) ->
    material = new ColladaLoader2.Material
    material.id   = @_getAttributeAsString el, "id",   null, true
    material.name = @_getAttributeAsString el, "name", null, false
    @_addUrlTarget material, @dae.libMaterials, true

    for child in el.childNodes when child.nodeType is 1
        switch child.nodeName
            when "instance_effect"
                material.effect = @_getAttributeAsUrlLink child, "url", true
            else ColladaLoader2._reportUnexpectedChild child
    return

###*
*   Parses a <library_geometries> element.
*
*   @param {!Node} el
###
ColladaLoader2.File::_parseLibGeometry = (el) ->
    for child in el.childNodes when child.nodeType is 1
        switch child.nodeName
            when "geometry" then @_parseGeometry child
            else ColladaLoader2._reportUnexpectedChild child
    return

###*
*   Parses a <geometry> element.
*
*   @param {!Node} el
###
ColladaLoader2.File::_parseGeometry = (el) ->
    geometry = new ColladaLoader2.Geometry()
    geometry.id   = @_getAttributeAsString el, "id",   null, true
    geometry.name = @_getAttributeAsString el, "name", null, false
    @_addUrlTarget geometry, @dae.libGeometries, true

    for child in el.childNodes when child.nodeType is 1
        switch child.nodeName
            when "mesh" then @_parseMesh geometry, child
            when "convex_mesh", "spline"
                ColladaLoader2._log "Geometry type #{child.nodeName} not supported.", ColladaLoader2.messageError
            when "extra" then @_parseGeometryExtra geometry, child
            else ColladaLoader2._reportUnexpectedChild child
    return

###*
*   Parses a <mesh> element.
*
*   @param {!Node} el
*   @param {!ColladaLoader2.Geometry} geometry
###
ColladaLoader2.File::_parseMesh = (geometry, el) ->
    for child in el.childNodes when child.nodeType is 1
        switch child.nodeName
            when "source"    then @_parseSource    geometry, child
            when "vertices"  then @_parseVertices  geometry, child
            when "triangles", "polylist", "polygons" then @_parseTriangles geometry, child
            when "lines", "linestrips", "trifans", "tristrips"
                ColladaLoader2._log "Geometry primitive type #{child.nodeName} not supported.", ColladaLoader2.messageError
            else ColladaLoader2._reportUnexpectedChild child
    return

###*
*   Parses a <geometry>/<extra> element.
*
*   @param {!Node} el
*   @param {!ColladaLoader2.Geometry} geometry
###
ColladaLoader2.File::_parseGeometryExtra = (geometry, el) ->
    for child in el.childNodes when child.nodeType is 1
        switch child.nodeName
            when "technique"
                profile = @_getAttributeAsString child, "profile", null, true
                @_parseGeometryExtraTechnique geometry, profile, child
            else ColladaLoader2._reportUnexpectedChild child
    return

###*
*   Parses a <geometry>/<extra>/<technique> element.
*
*   @param {!Node} el
*   @param {!ColladaLoader2.Geometry} geometry
*   @param {?string} profile
###
ColladaLoader2.File::_parseGeometryExtraTechnique = (geometry, profile, el) ->
    for child in el.childNodes when child.nodeType is 1
        # Note: Blender puts a "double_sided" property here,
        # under the profile "MAYA".
        # According to the spirit of COLLADA, <geometry> should
        # only contain the shape, not the appearance of an object.
        # Therefore, we won't handle this.
        ColladaLoader2._reportUnhandledExtra child
    return

###*
*   Parses a <source> element.
*
*   @param {!Node} el
*   @param {!ColladaLoader2.Geometry|!ColladaLoader2.Animation|!ColladaLoader2.Skin} parent
###
ColladaLoader2.File::_parseSource = (parent, el) ->
    source = new ColladaLoader2.Source
    source.id   = @_getAttributeAsString el, "id",   null, true
    source.name = @_getAttributeAsString el, "name", null, false
    @_addUrlTarget source, parent.sources, true

    for child in el.childNodes when child.nodeType is 1
        switch child.nodeName
            when "bool_array" 
                source.sourceId = @_getAttributeAsString child, "id", null, false
                source.data = ColladaLoader2._strToBools child.textContent
            when "float_array"
                source.sourceId = @_getAttributeAsString child, "id", null, false
                source.data = ColladaLoader2._strToFloats child.textContent
            when "int_array"
                source.sourceId = @_getAttributeAsString child, "id", null, false
                source.data = ColladaLoader2._strToInts child.textContent
            when "IDREF_array", "Name_array"
                source.sourceId = @_getAttributeAsString child, "id", null, false
                source.data = ColladaLoader2._strToStrings child.textContent
            when "technique_common"
                @_parseSourceTechniqueCommon source, child
            when "technique"
                # This element contains non-standard information 
                ColladaLoader2._reportUnhandledExtra child
            else ColladaLoader2._reportUnexpectedChild child
    return

###*
*   Parses a <vertices> element.
*
*   @param {!Node} el
*   @param {!ColladaLoader2.Geometry} geometry
###
ColladaLoader2.File::_parseVertices = (geometry, el) ->
    vertices = new ColladaLoader2.Vertices
    vertices.id   = @_getAttributeAsString el, "id",   null, true
    vertices.name = @_getAttributeAsString el, "name", null, false
    @_addUrlTarget vertices, null, true
    geometry.vertices = vertices

    for child in el.childNodes when child.nodeType is 1
        switch child.nodeName
            when "input" then vertices.inputs.push @_parseInput child, false
            else ColladaLoader2._reportUnexpectedChild child
    return

###*
*   Parses a <triangles> element.
*
*   @param {!Node} el
*   @param {!ColladaLoader2.Geometry} geometry
###
ColladaLoader2.File::_parseTriangles = (geometry, el) ->
    triangles = new ColladaLoader2.Triangles
    triangles.name     = @_getAttributeAsString el, "name",     null, false
    triangles.material = @_getAttributeAsString el, "material", null, false
    triangles.count    = @_getAttributeAsInt    el, "count",    0,    true
    triangles.type     = el.nodeName
    geometry.triangles.push triangles

    for child in el.childNodes when child.nodeType is 1
        switch child.nodeName
            when "input"  then triangles.inputs.push @_parseInput child, true
            when "vcount" then triangles.vcount  = ColladaLoader2._strToInts child.textContent
            when "p"      then triangles.indices = ColladaLoader2._strToInts child.textContent
            else ColladaLoader2._reportUnexpectedChild child
    return triangles

###*
*   Parses a <source>/<technique_common> element.
*
*   @param {!Node} el
*   @param {!ColladaLoader2.Source} source
###
ColladaLoader2.File::_parseSourceTechniqueCommon = (source, el) ->
    for child in el.childNodes when child.nodeType is 1
        switch child.nodeName
            when "accessor" then @_parseAccessor source, child
            else ColladaLoader2._reportUnexpectedChild child
    return

###*
*   Parses an <accessor> element.
*
*   @param {!Node} el
*   @param {!ColladaLoader2.Source} source
###
ColladaLoader2.File::_parseAccessor = (source, el) ->
    sourceId      = @_getAttributeAsString el, "source", null, true
    source.count  = @_getAttributeAsInt    el, "count",  0,    true
    source.stride = @_getAttributeAsInt    el, "stride", 1,    false
    source.offset = @_getAttributeAsInt    el, "offset", 0,    false
    if sourceId isnt "#"+source.sourceId
        ColladaLoader2._log "Non-local sources not supported, source data will be empty", ColladaLoader2.messageError

    for child in el.childNodes when child.nodeType is 1
        switch child.nodeName
            when "param" then @_parseAccessorParam source, child
            else ColladaLoader2._reportUnexpectedChild child
    return

###*
*   Parses an <accessor>/<param> element.
*
*   @param {!Node} el
*   @param {!ColladaLoader2.Source} source
###
ColladaLoader2.File::_parseAccessorParam = (source, el) ->
    name     = @_getAttributeAsString el, "name",     null, false
    semantic = @_getAttributeAsString el, "semantic", null, false
    type     = @_getAttributeAsString el, "type",     null, true
    sid      = @_getAttributeAsString el, "sid",      null, false

    # TODO: The params are not used at the moment, the code below is a bit hacky
    if name? and type?
        source.params[name] = type
    else if semantic? and type?
        source.params[semantic] = type
    else
        ColladaLoader2._log "Accessor param ignored due to missing type, name, or semantic", ColladaLoader2.messageWarning
    return

###*
*   Creates a ColladaLoader2.Input object from an <input> element.
*
*   @param {!Node} el
*   @param {!boolean} shared
*   @return {!ColladaLoader2.Input}
###
ColladaLoader2.File::_parseInput = (el, shared) ->
    input = new ColladaLoader2.Input
    input.semantic = @_getAttributeAsString  el, "semantic", null, true
    input.source   = @_getAttributeAsUrlLink el, "source",         true

    if shared
        input.offset = @_getAttributeAsInt    el, "offset",   0,    true
        input.set    = @_getAttributeAsInt    el, "set",      null, false
    return input

###*
*   Parses an <library_images> element.
*
*   @param {!Node} el
###
ColladaLoader2.File::_parseLibImage = (el) ->
    for child in el.childNodes when child.nodeType is 1
        switch child.nodeName
            when "image" then @_parseImage child
            else ColladaLoader2._reportUnexpectedChild child
    return

###*
*   Parses an <iimage> element.
*
*   @param {!Node} el
###
ColladaLoader2.File::_parseImage = (el) ->
    image = new ColladaLoader2.Image
    image.id = @_getAttributeAsString el, "id", null, true
    @_addUrlTarget image, @dae.libImages, true

    for child in el.childNodes when child.nodeType is 1
        switch child.nodeName
            when "init_from" then image.initFrom = child.textContent
            else ColladaLoader2._reportUnexpectedChild child
    return

###*
*   Parses an <library_controllers> element.
*
*   @param {!Node} el
###
ColladaLoader2.File::_parseLibController = (el) ->
    for child in el.childNodes when child.nodeType is 1
        switch child.nodeName
            when "controller" then @_parseController child
            else ColladaLoader2._reportUnexpectedChild child
    return

###*
*   Parses a <controller> element.
*
*   @param {!Node} el
###
ColladaLoader2.File::_parseController = (el) ->
    controller = new ColladaLoader2.Controller
    controller.id   = @_getAttributeAsString el, "id",   null, true
    controller.name = @_getAttributeAsString el, "name", null, false
    @_addUrlTarget controller, @dae.libControllers, true

    for child in el.childNodes when child.nodeType is 1
        switch child.nodeName
            when "skin" then @_parseSkin controller, child
            when "morph" then @_parseMorph controller, child
            else ColladaLoader2._reportUnexpectedChild child
    return

###*
*   Parses a <morph> element.
*
*   @param {!Node} el
*   @param {!ColladaLoader2.Controller} parent
###
ColladaLoader2.File::_parseMorph = (parent, el) ->
    ColladaLoader2._log "Morph controllers not implemented", ColladaLoader2.messageError
    return

###*
*   Parses a <skin> element.
*
*   @param {!Node} el
*   @param {!ColladaLoader2.Controller} parent
###
ColladaLoader2.File::_parseSkin = (parent, el) ->
    skin = new ColladaLoader2.Skin
    skin.source = @_getAttributeAsUrlLink el, "source", true
    if parent.skin? or parent.morph?
        ColladaLoader2._log "Controller already has a skin or morph", ColladaLoader2.messageError
    parent.skin = skin

    for child in el.childNodes when child.nodeType is 1
        switch child.nodeName
            when "bind_shape_matrix" then @_parseBindShapeMatrix skin, child
            when "source" then @_parseSource skin, child
            when "joints" then @_parseJoints skin, child
            when "vertex_weights" then @_parseVertexWeights skin, child
            else ColladaLoader2._reportUnexpectedChild child
    return

###*
*   Parses a <bind_shape_matrix> element.
*
*   @param {!Node} el
*   @param {!ColladaLoader2.Skin} parent
###
ColladaLoader2.File::_parseBindShapeMatrix = (parent, el) ->
    parent.bindShapeMatrix = ColladaLoader2._strToFloats el.textContent
    return

###*
*   Parses a <joints> element.
*
*   @param {!Node} el
*   @param {!ColladaLoader2.Skin} parent
###
ColladaLoader2.File::_parseJoints = (parent, el) ->
    joints = new ColladaLoader2.Joints
    if parent.joints?
        ColladaLoader2._log "Skin already has a joints array", ColladaLoader2.messageError
    parent.joints = joints

    inputs = []
    for child in el.childNodes when child.nodeType is 1
        switch child.nodeName
            when "input" then inputs.push @_parseInput child, false
            else ColladaLoader2._reportUnexpectedChild child

    for input in inputs
        switch input.semantic
            when "JOINT" then joints.joints = input
            when "INV_BIND_MATRIX" then joints.invBindMatrices = input
            else ColladaLoader2._log "Unknown joints input semantic #{input.semantic}", ColladaLoader2.messageError
    return

###*
*   Parses a <vertex_weights> element.
*
*   @param {!Node} el
*   @param {!ColladaLoader2.Skin} parent
###
ColladaLoader2.File::_parseVertexWeights = (parent, el) ->
    weights = new ColladaLoader2.VertexWeights
    weights.count = @_getAttributeAsInt el, "count", 0, true
    if parent.vertexWeights?
        ColladaLoader2._log "Skin already has a vertex weight array", ColladaLoader2.messageError
    parent.vertexWeights = weights

    inputs = []
    for child in el.childNodes when child.nodeType is 1
        switch child.nodeName
            when "input"  then inputs.push @_parseInput child, true
            when "vcount" then weights.vcount = ColladaLoader2._strToInts child.textContent
            when "v"      then weights.v = ColladaLoader2._strToInts child.textContent
            else ColladaLoader2._reportUnexpectedChild child

    for input in inputs
        switch input.semantic
            when "JOINT" then weights.joints = input
            when "WEIGHT" then weights.weights = input
            else ColladaLoader2._log "Unknown vertex weight input semantic #{input.semantic}" , ColladaLoader2.messageError
    return

###*
*   Parses a <library_animations> element.
*
*   @param {!Node} el
###
ColladaLoader2.File::_parseLibAnimation = (el) ->
    for child in el.childNodes when child.nodeType is 1
        switch child.nodeName
            when "animation" then @_parseAnimation null, child
            else ColladaLoader2._reportUnexpectedChild child
    return

###*
*   Parses an <animation> element.
*
*   @param {!Node} el
*   @param {?ColladaLoader2.Animation} parent
###
ColladaLoader2.File::_parseAnimation = (parent, el) ->
    animation = new ColladaLoader2.Animation
    animation.id   = @_getAttributeAsString el, "id",   null, false
    animation.name = @_getAttributeAsString el, "name", null, false
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
            when "source"    then @_parseSource    animation, child
            when "sampler"   then @_parseSampler   animation, child
            when "channel"   then @_parseChannel   animation, child
            else ColladaLoader2._reportUnexpectedChild child
    return

###*
*   Parses a <sampler> element.
*
*   @param {!Node} el
*   @param {!ColladaLoader2.Animation} parent
###
ColladaLoader2.File::_parseSampler = (parent, el) ->
    sampler = new ColladaLoader2.Sampler
    sampler.id = @_getAttributeAsString el, "id", null, false
    if sampler.id? then @_addUrlTarget sampler, parent.samplers, false

    inputs = []
    for child in el.childNodes when child.nodeType is 1
        switch child.nodeName
            when "input" then inputs.push @_parseInput child, false
            else ColladaLoader2._reportUnexpectedChild child

    for input in inputs
        switch input.semantic
            when "INPUT"         then sampler.input = input
            when "OUTPUT"        then sampler.outputs.push input
            when "INTERPOLATION" then sampler.interpolation = input
            when "IN_TANGENT"    then sampler.inTangents.push input
            when "OUT_TANGENT"   then sampler.outTangents.push input
            else ColladaLoader2._log "Unknown sampler input semantic #{input.semantic}" , ColladaLoader2.messageError
    return

###*
*   Parses a <channel> element.
*
*   @param {!Node} el
*   @param {!ColladaLoader2.Animation} parent
###
ColladaLoader2.File::_parseChannel = (parent, el) ->
    channel = new ColladaLoader2.Channel
    channel.source = @_getAttributeAsUrlLink el, "source", true
    channel.target = @_getAttributeAsSidLink el, "target", parent.id, true
    parent.channels.push channel
    channel.animation = parent

    for child in el.childNodes when child.nodeType is 1
        ColladaLoader2._reportUnexpectedChild child
    return

###*
*   Parses a <library_lights> element.
*
*   @param {!Node} el
###
ColladaLoader2.File::_parseLibLight = (el) ->
    for child in el.childNodes when child.nodeType is 1
        switch child.nodeName
            when "light" then @_parseLight child
            else ColladaLoader2._reportUnexpectedChild child
    return

###*
*   Parses a <light> element.
*
*   @param {!Node} el
###
ColladaLoader2.File::_parseLight = (el) ->
    light = new ColladaLoader2.Light()
    light.id   = @_getAttributeAsString el, "id",   null, true
    light.name = @_getAttributeAsString el, "name", null, false
    if light.id? then @_addUrlTarget light, @dae.libLights, true  

    for child in el.childNodes when child.nodeType is 1
        switch child.nodeName
            when "technique_common" then @_parseLightTechniqueCommon child, light
            when "extra"            then ColladaLoader2._reportUnhandledExtra child
            else ColladaLoader2._reportUnexpectedChild child
    return

###*
*   Parses a <light>/<technique_common> element.
*
*   @param {!Node} el
*   @param {!ColladaLoader2.Light} light
###
ColladaLoader2.File::_parseLightTechniqueCommon = (el, light) ->
    for child in el.childNodes when child.nodeType is 1
        switch child.nodeName
            when "ambient"     then @_parseLightParams child, "COMMON", light
            when "directional" then @_parseLightParams child, "COMMON", light
            when "point"       then @_parseLightParams child, "COMMON", light
            when "spot"        then @_parseLightParams child, "COMMON", light
            else ColladaLoader2._reportUnexpectedChild child
    return

###*
*   Parses a <light>/<technique_common>/<...> element.
*
*   @param {!Node} el
*   @param {!string} profile
*   @param {!ColladaLoader2.Light} light
###
ColladaLoader2.File::_parseLightParams = (el, profile, light) ->
    light.type = el.nodeName
    for child in el.childNodes when child.nodeType is 1
        switch child.nodeName
            when "color"                 then @_parseLightColor child, profile, light
            when "constant_attenuation"  then @_parseLightParam child, profile, light
            when "linear_attenuation"    then @_parseLightParam child, profile, light
            when "quadratic_attenuation" then @_parseLightParam child, profile, light
            when "falloff_angle"         then @_parseLightParam child, profile, light
            when "falloff_exponent"      then @_parseLightParam child, profile, light
            else ColladaLoader2._reportUnexpectedChild child
    return

###*
*   Parses a <light>/<...>/<...>/<color> element.
*
*   @param {!Node} el
*   @param {!string} profile
*   @param {!ColladaLoader2.Light} light
###
ColladaLoader2.File::_parseLightColor = (el, profile, light) ->
    light.color = ColladaLoader2._strToFloats el.textContent
    return

###*
*   Parses a <light>/<...>/<...>/<...> element.
*
*   @param {!Node} el
*   @param {!string} profile
*   @param {!ColladaLoader2.Light} light
###
ColladaLoader2.File::_parseLightParam = (el, profile, light) ->
    param = new ColladaLoader2.LightParam()
    param.sid  = @_getAttributeAsString el, "sid", null, false
    param.name = el.nodeName     
    light.params[param.name] = param
    @_addSidTarget param, light
    param.value = parseFloat el.textContent
    return

###*
*   Parses a <library_cameras> element.
*
*   @param {!Node} el
###
ColladaLoader2.File::_parseLibCamera = (el) ->
    for child in el.childNodes when child.nodeType is 1
        switch child.nodeName
            when "camera" then @_parseCamera child
            when "extra"  then ColladaLoader2._reportUnhandledExtra child
            else ColladaLoader2._reportUnexpectedChild child
    return

###*
*   Parses a <camera> element.
*
*   @param {!Node} el
###
ColladaLoader2.File::_parseCamera = (el) ->
    camera = new ColladaLoader2.Camera
    camera.id = @_getAttributeAsString el, "id", null, true
    if camera.id? then @_addUrlTarget camera, @dae.libCameras, true  
    camera.name = el.getAttribute "name"

    for child in el.childNodes when child.nodeType is 1
        switch child.nodeName
            when "asset"   then ColladaLoader2._reportUnhandledExtra child
            when "optics"  then @_parseCameraOptics child, camera
            when "imager"  then ColladaLoader2._reportUnhandledExtra child
            when "extra"   then ColladaLoader2._reportUnhandledExtra child
            else ColladaLoader2._reportUnexpectedChild child
    return

###*
*   Parses a <camera>/<optics> element.
*
*   @param {!Node} el
*   @param {!ColladaLoader2.Camera} camera
###
ColladaLoader2.File::_parseCameraOptics = (el, camera) ->
    for child in el.childNodes when child.nodeType is 1
        switch child.nodeName
            when "technique_common" then @_parseCameraTechniqueCommon child, camera
            when "technique"        then ColladaLoader2._reportUnhandledExtra child
            when "extra"            then ColladaLoader2._reportUnhandledExtra child
            else ColladaLoader2._reportUnexpectedChild child
    return

###*
*   Parses a <camera>/<optics>/<technique_common> element.
*
*   @param {!Node} el
*   @param {!ColladaLoader2.Camera} camera
###
ColladaLoader2.File::_parseCameraTechniqueCommon = (el, camera) ->
    for child in el.childNodes when child.nodeType is 1
        switch child.nodeName
            when "orthographic" then @_parseCameraParams child, camera
            when "perspective"  then @_parseCameraParams child, camera
            else ColladaLoader2._reportUnexpectedChild child
    return

###*
*   Parses a <camera>/<optics>/<technique_common>/<...> element.
*
*   @param {!Node} el
*   @param {!ColladaLoader2.Camera} camera
###
ColladaLoader2.File::_parseCameraParams = (el, camera) ->
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
            when "extra"        then ColladaLoader2._reportUnhandledExtra child
            else ColladaLoader2._reportUnexpectedChild child
    return

###*
*   Parses a <camera>/<optics>/<technique_common>/<...>/<...> element.
*   @param {!Node} el
*   @param {!ColladaLoader2.Camera} camera
###
ColladaLoader2.File::_parseCameraParam = (el, camera) ->
    param = new ColladaLoader2.CameraParam()
    param.sid = @_getAttributeAsString el, "sid", null, false
    param.name = el.nodeName     
    camera.params[param.name] = param
    @_addSidTarget param, camera
    param.value = parseFloat el.textContent
    return

#==============================================================================
# ColladaLoader2.File: PRIVATE METHODS - CREATING THREE.JS OBJECTS
#==============================================================================

###*
*   Links all ColladaLoader2.Channels with their AnimationTargets
###
ColladaLoader2.File::_linkAnimations = () ->
    for target in @dae.animationTargets
        target.initAnimationTarget()
    for animation in @dae.libAnimations
        @_linkAnimationChannels animation
    return

###*
*   Links a ColladaLoader2.Channel with its AnimationTarget
*
*   @param {!ColladaLoader2.Animation} animation
###
ColladaLoader2.File::_linkAnimationChannels = (animation) ->
    for channel in animation.channels
        # Find the animation target
        # The animation target is for example the translation of a scene graph node
        target = ColladaLoader2.AnimationTarget.fromLink channel.target
        if not target?
            ColladaLoader2._log "Animation channel has an invalid target '#{channel.target.url}', animation ignored", ColladaLoader2.messageWarning
            continue

        # Find the animation sampler
        # The sampler defines the animation curve. The animation curve maps time values to target values.
        sampler = ColladaLoader2.Sampler.fromLink channel.source
        if not sampler?
            ColladaLoader2._log "Animation channel has an invalid sampler '#{channel.source.url}', animation ignored", ColladaLoader2.messageWarning
            continue

        # Find the animation input
        # The input defines the values on the X axis of the animation curve (the time values)
        input = sampler.input
        if not input?
            ColladaLoader2._log "Animation channel has no input, animation ignored", ColladaLoader2.messageWarning
            continue
        inputSource = ColladaLoader2.Source.fromLink input.source
        if not inputSource?
            ColladaLoader2._log "Animation channel has no input data, animation ignored", ColladaLoader2.messageWarning
            continue

        # Find the animation outputs
        # The output defines the values on the Y axis of the animation curve (the target values)
        # For some reason, outputs can have more than one dimension, even though the animation target is a single object.
        if sampler.outputs.length > 1
            ColladaLoader2._log "Animation channel has more than one output, using only the first output", ColladaLoader2.messageWarning
        output = sampler.outputs[0]
        if not output?
            ColladaLoader2._log "Animation channel has no output, animation ignored", ColladaLoader2.messageWarning
            continue
        outputSource = ColladaLoader2.Source.fromLink output.source
        if not outputSource?
            ColladaLoader2._log "Animation channel has no output data, animation ignored", ColladaLoader2.messageWarning
            continue

        # Create a convenience object
        threejsChannel = new ColladaLoader2.ThreejsAnimationChannel
        threejsChannel.outputData = outputSource.data
        if inputSource.data instanceof Float32Array 
            threejsChannel.inputData  = inputSource.data
        else
            ColladaLoader2._log "Animation channel has non-float input data, animation ignored", ColladaLoader2.messageWarning
            continue
        threejsChannel.stride     = outputSource.stride
        threejsChannel.animation  = animation

        # Resolve the sub-component syntax
        targetLink = channel.target
        if targetLink.dotSyntax
            # Member access syntax: A single data element is addressed by name
            # Translate semantic names to offsets (spec chapter 3.7, "Common glossary")
            # Note: the offsets might depend on the type of the target
            threejsChannel.semantic = targetLink.member
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
                    ColladaLoader2._log "Unknown semantic for '#{targetLink.url}', animation ignored", ColladaLoader2.messageWarning
                    continue
        else if channel.target.arrSyntax
            # Array access syntax: A single data element is addressed by index
            switch targetLink.indices.length
                when 1 then threejsChannel.offset = targetLink.indices[0]
                when 2 then threejsChannel.offset = targetLink.indices[0] * target.animTarget.dataRows + targetLink.indices[1]
                else
                    ColladaLoader2._log "Invalid number of indices for '#{targetLink.url}', animation ignored", ColladaLoader2.messageWarning
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

###*
*   Creates the three.js scene graph
###
ColladaLoader2.File::_createSceneGraph = () ->
    daeScene = ColladaLoader2.VisualScene.fromLink @dae.scene
    if not daeScene? then return

    threejsScene = new THREE.Object3D()
    @threejs.scene = threejsScene
    @_createSceneGraphNode(daeChild, threejsScene) for daeChild in daeScene.children
    
    # Old loader compatibility
    @scene = threejsScene
    return

###*
*   Sets the transformation of a scene node
*
*   @param {!ColladaLoader2.VisualSceneNode} daeNode
*   @param {!THREE.Object3D} threejsNode
###
ColladaLoader2.File::_setNodeTransformation = (daeNode, threejsNode) ->
    # Set the node transformation.
    daeNode.getTransformMatrix threejsNode.matrix
    # ColladaLoader2. nodes may have any number of transformations in any order.
    # The above transformation matrix is composed of all those transformations.
    # The only way to extract position, rotation, and scale is to decompose the node matrix.
    threejsNode.matrix.decompose threejsNode.position, threejsNode.quaternion, threejsNode.scale
    # Convert quaternion into euler angles
    threejsNode.rotation.setEulerFromQuaternion threejsNode.quaternion
    # This function sets the transformation in several redundant ways: 
    # The composed matrix and the decomposed position/rotation/scale with both quaternion and euler angle rotations.
    # It should therefore be independent of the node.matrixAutoUpdate and node.useQuaternion options.
    return

###*
*   Creates a three.js scene graph node
*
*   @param {!ColladaLoader2.VisualSceneNode} daeNode
*   @param {!THREE.Object3D} threejsParent
###
ColladaLoader2.File::_createSceneGraphNode = (daeNode, threejsParent) ->
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
        if daeNode.type isnt "JOINT" then ColladaLoader2._log "Collada node #{daeNode.name} did not produce any threejs nodes", ColladaLoader2.messageWarning
        # This node does not generate any renderable objects, but may still contain transformations
        threejsNode = new THREE.Object3D()
        threejsParent.add threejsNode

    # Set the node transformation
    @_setNodeTransformation daeNode, threejsNode

    # Scene graph subtree
    @_createSceneGraphNode(daeChild, threejsNode) for daeChild in daeNode.children
    return

###*
*   Creates a three.js light
*
*   @param {!ColladaLoader2.InstanceLight} daeInstanceLight
*   @return {?THREE.Light}
###
ColladaLoader2.File::_createLight = (daeInstanceLight) ->
    light = ColladaLoader2.Light.fromLink daeInstanceLight.light
    if not light?
        ColladaLoader2._log "Light instance has no light, light ignored", ColladaLoader2.messageWarning
        return null

    if not light.color?
        ColladaLoader2._log "Light has no color, using white", ColladaLoader2.messageWarning
        colorHex = 0xffffff
    else
        colorHex = ColladaLoader2._colorToHex light.color
    attConst = light.params["constant_attenuation"]?.value
    attLin   = light.params["linear_attenuation"]?.value
    attQuad  = light.params["quadratic_attenuation"]?.value
    foAngle  = light.params["falloff_angle"]?.value
    foExp    = light.params["falloff_exponent"]?.value

    threejslight = null
    switch light.type
        when "ambient"     then threejslight = new THREE.AmbientLight colorHex
        when "directional" then threejslight = new THREE.DirectionalLight colorHex, 1
        when "point"       then threejslight = new THREE.PointLight colorHex, attConst, attLin
        when "spot"        then threejslight = new THREE.SpotLight colorHex, attConst, attLin, foAngle, foExp
        else ColladaLoader2._log "Unknown light type #{light.type}, light ignored.", ColladaLoader2.messageError
    return threejslight

###*
*   Creates a three.js camera
*
*   @param {!ColladaLoader2.InstanceCamera} daeInstanceCamera
*   @return {?THREE.Camera}
###
ColladaLoader2.File::_createCamera = (daeInstanceCamera) ->
    camera = ColladaLoader2.Camera.fromLink daeInstanceCamera.camera
    if not camera?
        ColladaLoader2._log "Camera instance has no camera, camera ignored", ColladaLoader2.messageWarning
        return null

    x_mag  = camera.params["xmag"]?.value
    y_mag  = camera.params["ymag"]?.value
    x_fov  = camera.params["xfov"]?.value
    y_fov  = camera.params["yfov"]?.value
    aspect = camera.params["aspect_ratio"]?.value
    z_min  = camera.params["znear"]?.value
    z_max  = camera.params["zfar"]?.value

    threejscamera = null
    switch camera.type
        when "orthographic"
            if      x_mag? and y_mag?  then aspect = x_mag / y_mag
            else if y_mag? and aspect? then x_mag  = y_mag * aspect
            else if x_mag? and aspect? then y_mag  = x_mag / aspect
            else if x_mag?             then aspect = 1; y_mag = x_mag # Spec doesn't really say what to do here...
            else if y_mag?             then aspect = 1; x_mag = y_mag # Spec doesn't really say what to do here...
            else
                ColladaLoader2._log "Not enough field of view parameters for an orthographic camera.", ColladaLoader2.messageError
                return null
            # Spec is ambiguous whether x_mag is the width or half width of the camera, just pick one.
            threejscamera = new THREE.OrthographicCamera -x_mag, +x_mag, -y_mag, +y_mag, z_min, z_max
        when "perspective"
            if      x_fov? and y_fov?  then aspect = x_fov / y_fov
            else if y_fov? and aspect? then x_fov  = y_fov * aspect
            else if x_fov? and aspect? then y_fov  = x_fov / aspect
            else if x_fov?             then aspect = 1; y_fov = x_fov # Spec doesn't really say what to do here...
            else if y_fov?             then aspect = 1; x_fov = y_fov # Spec doesn't really say what to do here...
            else
                ColladaLoader2._log "Not enough field of view parameters for a perspective camera.", ColladaLoader2.messageError
                return null
            threejscamera = new THREE.PerspectiveCamera y_fov, aspect, z_min, z_max
        else ColladaLoader2._log "Unknown camera type #{camera.type}, camera ignored.", ColladaLoader2.messageError
    return threejscamera

###*
*   Creates a three.js static mesh
*
*   @param {!ColladaLoader2.InstanceGeometry} daeInstanceGeometry
*   @return {?THREE.Mesh}
###
ColladaLoader2.File::_createStaticMesh = (daeInstanceGeometry) ->
    daeGeometry = ColladaLoader2.Geometry.fromLink daeInstanceGeometry.geometry 
    if not daeGeometry?
        ColladaLoader2._log "Geometry instance has no geometry, mesh ignored", ColladaLoader2.messageWarning
        return null

    gnm = @_createGeometryAndMaterial daeGeometry, daeInstanceGeometry.materials
    threejsGeometry = gnm.geometry
    threejsMaterial = gnm.material

    mesh = new THREE.Mesh threejsGeometry, threejsMaterial
    return mesh

###*
*   Creates a threejs geometry and a material
*
*   @param {!ColladaLoader2.Geometry} daeGeometry
*   @param {!Array.<!ColladaLoader2.InstanceMaterial>} daeInstanceMaterials
*   @return {{geometry:!THREE.Geometry,material:(!THREE.Material|!THREE.MeshFaceMaterial)}}
###
ColladaLoader2.File::_createGeometryAndMaterial = (daeGeometry, daeInstanceMaterials) ->
    # Create new geometry and material objects for each mesh
    # TODO: Figure out when and if they can be shared?
    threejsMaterials = @_createMaterials daeInstanceMaterials
    threejsGeometry = @_createGeometry daeGeometry, threejsMaterials

    # Handle multi-material meshes
    threejsMaterial = null
    if threejsMaterials.materials.length > 1
        threejsMaterial = new THREE.MeshFaceMaterial()
        threejsMaterial.materials.push material for material in threejsMaterials.materials
    else if threejsMaterials.materials.length > 0
        threejsMaterial = threejsMaterials.materials[0]
    else
        threejsMaterial = @_createDefaultMaterial()

    return {geometry:threejsGeometry, material:threejsMaterial}

###*
*   Creates a three.js animated mesh
*
*   @param {!ColladaLoader2.InstanceController} daeInstanceController
*   @return {?THREE.Mesh}
###
ColladaLoader2.File::_createAnimatedMesh = (daeInstanceController) ->
    daeController = ColladaLoader2.Controller.fromLink daeInstanceController.controller
    if not daeController?
        ColladaLoader2._log "Controller not found, mesh ignored", ColladaLoader2.messageWarning
        return null

    # Create a skinned or morph-animated mesh, depending on the controller type
    if daeController.skin?
        return @_createSkinMesh daeInstanceController, daeController
    if daeController.morph?
        return @_createMorphMesh daeInstanceController, daeController

    # Unknown animation type
    ColladaLoader2._log "Controller has neither a skin nor a morph, mesh ignored", ColladaLoader2.messageWarning
    return null

###*
*   Creates a three.js skin animated mesh
*
*   @param {!ColladaLoader2.InstanceController} daeInstanceController
*   @param {!ColladaLoader2.Controller} daeController
*   @return {?THREE.Mesh}
###
ColladaLoader2.File::_createSkinMesh = (daeInstanceController, daeController) ->
    # Get the skin that is attached to the skeleton
    daeSkin = daeController.skin
    if not daeSkin?
        ColladaLoader2._log "Controller for a skinned mesh has no skin, mesh ignored", ColladaLoader2.messageError
        return null

    # Get the geometry that is used by the skin
    daeSkinGeometry = ColladaLoader2.Geometry.fromLink daeSkin.source
    if not daeSkinGeometry?
        ColladaLoader2._log "Skin for a skinned mesh has no geometry, mesh ignored", ColladaLoader2.messageError
        return null

    # Skip all the skeleton processing if no animation is requested
    if not @_options["useAnimations"]
        gnm = @_createGeometryAndMaterial daeSkinGeometry, daeInstanceController.materials
        threejsGeometry = gnm.geometry
        threejsMaterial = gnm.material
        return new THREE.Mesh threejsGeometry, threejsMaterial

    # Get the scene subgraph that represents the mesh skeleton.
    # This is where we'll start searching for skeleton bones.
    skeletonRootNodes = []
    for skeletonLink in daeInstanceController.skeletons
        skeleton = ColladaLoader2.VisualSceneNode.fromLink skeletonLink
        if not skeleton?
            ColladaLoader2._log "Controller instance for a skinned mesh uses unknown skeleton #{skeleton}, skeleton ignored", ColladaLoader2.messageError
            continue
        skeletonRootNodes.push skeleton
    if skeletonRootNodes.length is 0
        ColladaLoader2._log "Controller instance for a skinned mesh has no skeleton, mesh ignored", ColladaLoader2.messageError
        return null

    # Find all bones that the skin references.
    # Bones (a.k.a. joints) are referenced via id's which are relative to the skeleton root node found above.
    joints = daeSkin.joints
    if not joints?
        ColladaLoader2._log "Skin has no joints, mesh ignored", ColladaLoader2.messageError
        return null
    daeJointsSource = ColladaLoader2.Source.fromLink joints.joints?.source
    if not daeJointsSource? or not daeJointsSource.data?
        ColladaLoader2._log "Skin has no joints source, mesh ignored", ColladaLoader2.messageError
        return null
    daeInvBindMatricesSource = ColladaLoader2.Source.fromLink joints.invBindMatrices?.source
    if not daeInvBindMatricesSource? or not daeInvBindMatricesSource.data?
        ColladaLoader2._log "Skin has no inverse bind matrix source, mesh ignored", ColladaLoader2.messageError
        return null
    if daeJointsSource.data.length*16 isnt daeInvBindMatricesSource.data.length
        ColladaLoader2._log "Skin has an inconsistent length of joint data sources, mesh ignored", ColladaLoader2.messageError
        return null
    if not (daeInvBindMatricesSource.data instanceof Float32Array)
        ColladaLoader2._log "Skin inverse bind matrices use a non-numeric data source, mesh ignored", ColladaLoader2.messageError
        return null

    # Create a custom bone object for each referenced bone
    bones = []
    for jointSid in daeJointsSource.data
        jointNode = @_findJointNode jointSid, skeletonRootNodes
        if not jointNode?
            ColladaLoader2._log "Joint #{jointSid} not found for skin with skeletons #{(skeletonRootNodes.map (node)->node.id).join ', '}, mesh ignored", ColladaLoader2.messageError
            return null
        bone = @_createBone jointNode, jointSid, bones
        ColladaLoader2._fillMatrix4RowMajor daeInvBindMatricesSource.data, bone.index*16, bone.invBindMatrix
    if @_options["verboseMessages"] then ColladaLoader2._log "Skin contains #{bones.length} bones", ColladaLoader2.messageInfo

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
        if bone.node.parent? and bone.node.parent instanceof ColladaLoader2.VisualSceneNode and not bone.parent?
            bone.parent = @_createBone bone.node.parent, "", bones
    if @_options["verboseMessages"] then ColladaLoader2._log "Skeleton contains #{bones.length} bones", ColladaLoader2.messageInfo

    # Get the joint weights for all vertices
    if not daeSkin.vertexWeights?
        ColladaLoader2._log "Skin has no vertex weight data, mesh ignored", ColladaLoader2.messageError
        return null
    if daeSkin.vertexWeights.joints.source.url isnt daeSkin.joints.joints.source.url
        # Holy crap, how many indirections does this stupid format have?!?
        # If the data sources differ, we would have to reorder the elements of the "bones" array.
        ColladaLoader2._log "Skin uses different data sources for joints in <joints> and <vertex_weights>, this is not supported by this loader, mesh ignored", ColladaLoader2.messageError
        return null

    # Create threejs geometry and material objects
    gnm = @_createGeometryAndMaterial daeSkinGeometry, daeInstanceController.materials
    threejsGeometry = gnm.geometry
    threejsMaterial = gnm.material

    # Process animations and create a corresponding threejs mesh object
    # If something goes wrong during the animation processing, return a static mesh object
    if @_options["convertSkinsToMorphs"]
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

###*
*   Finds a node that is referenced by the given joint sid
*
*   @param {!string} jointSid
*   @param {!Array.<!ColladaLoader2.VisualSceneNode>} skeletonRootNodes
*   @return {?ColladaLoader2.VisualSceneNode}
###
ColladaLoader2.File::_findJointNode = (jointSid, skeletonRootNodes) ->
    # Find the visual scene node that is referenced by the joint SID
    # The spec is inconsistent here.
    # The joint ids do not seem to be real scoped identifiers (chapter 3.3, "COLLADA Target Addressing"), since they lack the first part (the anchor id)
    # The skin element (chapter 5, "skin" element) *implies* that the joint ids are scoped identifiers relative to the skeleton root node,
    # so perform a sid-like breadth-first search.
    jointNode = null
    for skeleton in skeletonRootNodes
        sids = jointSid.split "/"
        jointNode = ColladaLoader2.SidLink.findSidTarget jointSid, skeleton, sids
        if jointNode? then break
    if jointNode instanceof ColladaLoader2.VisualSceneNode
        return jointNode
    else
        return null

###*
*   Creates a bone object
*
*   @param {!ColladaLoader2.VisualSceneNode} boneNode
*   @param {!string} jointSid
*   @param {!Array.<!ColladaLoader2.ThreejsSkeletonBone>} bones
*   @return {!ColladaLoader2.ThreejsSkeletonBone}
###
ColladaLoader2.File::_createBone = (boneNode, jointSid, bones) ->
    bone = new ColladaLoader2.ThreejsSkeletonBone
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

###*
*   Handle animations (morph target output)
*
*   @param {!THREE.Geometry} threejsGeometry
*   @param {!ColladaLoader2.Skin} daeSkin
*   @param {!Array.<!ColladaLoader2.ThreejsSkeletonBone>} bones
*   @param {!THREE.Material|!THREE.MeshFaceMaterial} threejsMaterial
*   @return {!boolean} true if succeeded
###
ColladaLoader2.File::_addSkinMorphTargets = (threejsGeometry, daeSkin, bones, threejsMaterial) ->
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
    if not timesteps > 0 then return false

    # Get all source data
    sourceVertices = threejsGeometry.vertices
    vertexCount = sourceVertices.length
    vwV = daeSkin.vertexWeights.v
    vwVcount = daeSkin.vertexWeights.vcount
    vwJointsSource  = ColladaLoader2.Source.fromLink daeSkin.vertexWeights.joints.source
    vwWeightsSource = ColladaLoader2.Source.fromLink daeSkin.vertexWeights.weights.source
    vwJoints = vwJointsSource?.data
    vwWeights = vwWeightsSource?.data
    if not vwWeights?
        ColladaLoader2._log "Skin has no weights data, no morph targets added for mesh", ColladaLoader2.messageError
        return false
    bindShapeMatrix = new THREE.Matrix4
    if daeSkin.bindShapeMatrix?
        bindShapeMatrix = ColladaLoader2._floatsToMatrix4RowMajor daeSkin.bindShapeMatrix, 0
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
                    ColladaLoader2._log "Skinned vertex not influenced by any bone, some vertices will be unskinned", ColladaLoader2.messageWarning
                    enableWarningNoBones = false
            else if not (0.01 < totalWeight < 1e6)
                # This is an invalid collada file, as vertex weights should be normalized.
                # But we'll be forgiving and just copy the unskinned position instead.
                vertex.copy sourceVertex
                if enableWarningInvalidWeight
                    ColladaLoader2._log "Zero or infinite total weight for skinned vertex, some vertices will be unskinned", ColladaLoader2.messageWarning
                    enableWarningInvalidWeight = false
            else
                vertex.multiplyScalar 1 / totalWeight

        if vindex isnt vwV.length
            ColladaLoader2._log "Skinning did not consume all weights", ColladaLoader2.messageError

        # Add the new morph target
        threejsGeometry.morphTargets.push {name:"target", vertices:vertices}

    # Compute morph normals
    threejsGeometry.computeMorphNormals()

    # Enable morph targets
    @_materialEnableMorphing threejsMaterial
    return true

###*
*   Enables morph animations on a material
*
*   @param {!THREE.Material|THREE.MeshFaceMaterial} threejsMaterial
###
ColladaLoader2.File::_materialEnableMorphing = (threejsMaterial) ->
    if threejsMaterial instanceof THREE.MeshFaceMaterial
        for material in threejsMaterial.materials
            material.morphTargets = true
            material.morphNormals = true
    else
        threejsMaterial.morphTargets = true
        threejsMaterial.morphNormals = true
    return

###*
*   Enables skin animations on a material
*
*   @param {!THREE.Material|THREE.MeshFaceMaterial} threejsMaterial
###
ColladaLoader2.File::_materialEnableSkinning = (threejsMaterial) ->
    if threejsMaterial instanceof THREE.MeshFaceMaterial
        for material in threejsMaterial.materials
            material.skinning = true
    else
        threejsMaterial.skinning = true 
    return

###*
*   Prepares the given skeleton for animation
*
*   @param {!Array.<!ColladaLoader2.ThreejsSkeletonBone>} bones
*   @return {?number} The number of keyframes of the animation
###
ColladaLoader2.File::_prepareAnimations = (bones) ->
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
                    ColladaLoader2._log "Inconsistent number of time steps, no morph targets added for mesh. Resample all animations to fix this.", ColladaLoader2.messageError
                    return null
                timesteps = channelTimesteps
        if @_options["verboseMessages"] and not hasAnimation
            ColladaLoader2._log "Joint '#{bone.sid}' has no animation channel", ColladaLoader2.messageWarning
    return timesteps

###*
*   Updates the skinning matrices for the given skeleton, using the given animation keyframe
*
*   @param {!Array.<!ColladaLoader2.ThreejsSkeletonBone>} bones
*   @param {!THREE.Matrix4} bindShapeMatrix
*   @param {!number} keyframe
###
ColladaLoader2.File::_updateSkinMatrices = (bones, bindShapeMatrix, keyframe) ->
    for bone in bones
        bone.applyAnimation keyframe
    for bone in bones
        bone.updateSkinMatrix bindShapeMatrix
    return

###*
*   Handle animations (skin output)
*
*   @param {!THREE.Geometry} threejsGeometry
*   @param {!ColladaLoader2.Skin} daeSkin
*   @param {!Array.<!ColladaLoader2.ThreejsSkeletonBone>} bones
*   @param {!THREE.Material|!THREE.MeshFaceMaterial} threejsMaterial
*   @return {!boolean} true if succeeded
###
ColladaLoader2.File::_addSkinBones = (threejsGeometry, daeSkin, bones, threejsMaterial) ->
    # Outline:
    #   for each animation
    #     convert animation to the JSON loader format
    #   for each skeleton bone
    #     convert skeleton bone to the JSON loader format
    #   pass converted animations and bones to the THREE.SkinnedMesh constructor

    # Prepare the animations for all bones
    timesteps = @_prepareAnimations bones
    if not timesteps > 0 then return false

    # Get all source data
    sourceVertices = threejsGeometry.vertices
    vertexCount = sourceVertices.length
    vwV = daeSkin.vertexWeights.v
    vwVcount = daeSkin.vertexWeights.vcount
    vwJointsSource  = ColladaLoader2.Source.fromLink daeSkin.vertexWeights.joints.source
    vwWeightsSource = ColladaLoader2.Source.fromLink daeSkin.vertexWeights.weights.source
    vwJoints = vwJointsSource?.data
    vwWeights = vwWeightsSource?.data
    if not vwWeights?
        ColladaLoader2._log "Skin has no weights data, no skin added for mesh", ColladaLoader2.messageError
        return false
    bindShapeMatrix = new THREE.Matrix4
    if daeSkin.bindShapeMatrix?
        bindShapeMatrix = ColladaLoader2._floatsToMatrix4RowMajor daeSkin.bindShapeMatrix, 0

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
                ColladaLoader2._log "Too many bones influence a vertex, some influences will be discarded. Threejs supports only #{bonesPerVertex} bones per vertex.", ColladaLoader2.messageWarning
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
                ColladaLoader2._log "Zero or infinite total weight for skinned vertex, skin will be broken", ColladaLoader2.messageWarning
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
            threejsBone["parent"] = bone.parent.index
        else
            threejsBone["parent"] = -1
        bone.matrix.decompose pos, rot, scl
        threejsBone["name"] = bone.node.name
        threejsBone["pos"]  = [pos.x, pos.y, pos.z]
        threejsBone["scl"]  = [scl.x, scl.y, scl.z]
        threejsBone["rotq"] = [rot.x, rot.y, rot.z, rot.w]
        threejsBone["rot"]  = null # Euler rotation, doesn't seem to be used by three.js
        # Three.js has a simplified skinning equation, compute the bone inverses on our own
        # Collada  equation: boneWeight*boneMatrix*invBindMatrix*bindShapeMatrix*vertex (see chapter 4: "Skin Deformation (or Skinning) in COLLADA")
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
    threejsAnimation =
        "name"      : "animation"   # TODO
        "hierarchy" : []            # Filled below
        "fps"       : 30            # TODO
        "length"    : timesteps - 1 # TODO
    threejsGeometry.animation = threejsAnimation

    for bone in bones
        threejsBoneAnimation =
            "parent" : bone.index
            "keys"   : []
        threejsAnimation["hierarchy"].push threejsBoneAnimation

        for keyframe in [0..timesteps-1] by 1
            bone.applyAnimation keyframe
            bone.updateSkinMatrix bindShapeMatrix
            bone.matrix.decompose pos, rot, scl
            key =
                "time" : keyframe # TODO
                "pos"  : [pos.x, pos.y, pos.z]
                "scl"  : [scl.x, scl.y, scl.z]
                "rot"  : [rot.x, rot.y, rot.z, rot.w]
            threejsBoneAnimation["keys"].push key

    # Enable skinning
    @_materialEnableSkinning threejsMaterial

    return true

###*
*   Creates a three.js morph animated mesh
*
*   @param {!ColladaLoader2.InstanceController} daeInstanceController
*   @param {!ColladaLoader2.Controller} daeController
*   @return {?THREE.Mesh}
###
ColladaLoader2.File::_createMorphMesh = (daeInstanceController, daeController) ->
    ColladaLoader2._log "Morph animated meshes not supported, mesh ignored", ColladaLoader2.messageError
    return null

###*
*   Creates a three.js geometry
*
*   @param {!ColladaLoader2.Geometry} daeGeometry
*   @param {!ColladaLoader2.ThreejsMaterialMap} materials
*   @return {!THREE.Geometry}
###
ColladaLoader2.File::_createGeometry = (daeGeometry, materials) ->
    threejsGeometry = new THREE.Geometry()

    for triangles in daeGeometry.triangles
        if triangles.material?
            materialIndex = materials.indices[triangles.material]
            if not materialIndex?
                ColladaLoader2._log "Material symbol #{triangles.material} has no bound material instance, using material with index 0", ColladaLoader2.messageError
                materialIndex = 0
        else
            ColladaLoader2._log "Missing material index, using material with index 0", ColladaLoader2.messageError
            materialIndex = 0
        @_addTrianglesToGeometry daeGeometry, triangles, materialIndex, threejsGeometry

    # Compute missing data.
    # TODO: Figure out when this needs to be recomputed and when not
    threejsGeometry.computeFaceNormals()
    threejsGeometry.computeCentroids()
    if materials.needTangents then threejsGeometry.computeTangents()
    threejsGeometry.computeBoundingBox()
    return threejsGeometry

###*
*   Adds primitives to a threejs geometry
*
*   @param {!ColladaLoader2.Geometry} daeGeometry
*   @param {!ColladaLoader2.Triangles} triangles
*   @param {!number} materialIndex
*   @param {!THREE.Geometry} threejsGeometry
###
ColladaLoader2.File::_addTrianglesToGeometry = (daeGeometry, triangles, materialIndex, threejsGeometry) ->
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
            else ColladaLoader2._log "Unknown triangles input semantic #{input.semantic} ignored", ColladaLoader2.messageWarning

    srcTriVertices = ColladaLoader2.Vertices.fromLink inputTriVertices.source
    if not srcTriVertices?
        ColladaLoader2._log "Geometry #{daeGeometry.id} has no vertices", ColladaLoader2.messageError
        return

    srcTriNormal   = ColladaLoader2.Source.fromLink inputTriNormal?.source
    srcTriColor    = ColladaLoader2.Source.fromLink inputTriColor?.source
    srcTriTexcoord = inputTriTexcoord.map (x) => ColladaLoader2.Source.fromLink x?.source

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
            else ColladaLoader2._log "Unknown vertices input semantic #{input.semantic} ignored", ColladaLoader2.messageWarning

    srcVertPos = ColladaLoader2.Source.fromLink inputVertPos.source
    if not srcVertPos?
        ColladaLoader2._log "Geometry #{daeGeometry.id} has no vertex positions", ColladaLoader2.messageError
        return

    srcVertNormal   = ColladaLoader2.Source.fromLink inputVertNormal?.source
    srcVertColor    = ColladaLoader2.Source.fromLink inputVertColor?.source
    srcVertTexcoord = inputVertTexcoord.map (x) => ColladaLoader2.Source.fromLink x?.source

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
    numExistingFaces = threejsGeometry.faces.length
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
                ColladaLoader2._log "Geometry #{daeGeometry.id} has non-triangle polygons, geometry ignored", ColladaLoader2.messageError
                return

    # Step 5: Fill in faces
    # A face stores vertex positions by reference (index into the above array).
    # A face stores vertex normals, and colors by value.
    # Vertex texture coordinates are stored inside the geometry object.
    indices = triangles.indices
    triangleStride = indices.length / triangles.count
    vertexStride = triangleStride / 3
    for triangleIndex in [0..triangles.count-1] by 1
        triangleBaseOffset = triangleIndex*triangleStride

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
                threejsGeometry.faceVertexUvs[i].push 'abv'
                threejsGeometry.faceVertexUvs[i].push [new THREE.Vector2(0,0), new THREE.Vector2(0,0), new THREE.Vector2(0,0)]
            else
                texcoord = [data[v0], data[v1], data[v2]]
                threejsGeometry.faceVertexUvs[i].push texcoord
        for data, i in dataTriTexcoord
            if not data?
                threejsGeometry.faceVertexUvs[i].push [new THREE.Vector2(0,0), new THREE.Vector2(0,0), new THREE.Vector2(0,0)]
            else
                t0 = indices[baseOffset0 + inputTriTexcoord[i].offset]
                t1 = indices[baseOffset1 + inputTriTexcoord[i].offset]
                t2 = indices[baseOffset2 + inputTriTexcoord[i].offset]
                texcoord = [data[t0], data[t1], data[t2]]
                threejsGeometry.faceVertexUvs[i].push texcoord
    return

###*
*   Adds zero UVs to an existing array of UVs
*
*   @param {!Array.<!THREE.Vector2>} faceVertexUvs
*   @param {!number} count
###
ColladaLoader2.File::_addEmptyUVs = (faceVertexUvs, count) ->
    faceVertexUvs.push new THREE.Vector2(0,0) for i in [0..count-1] by 1
    return

###*
*   Creates an array of 3D vectors
*
*   @param {?ColladaLoader2.Source} source
*   @return {?Array.<!THREE.Vector3>}
###
ColladaLoader2.File::_createVector3Array = (source) ->
    if not source? then return null
    if source.stride isnt 3
        ColladaLoader2._log "Vector source data does not contain 3D vectors", ColladaLoader2.messageError
        return null
    data = []
    srcData = source.data
    i0 = source.offset
    i1 = source.offset + source.count*source.stride
    if i1 > source.data.length
        ColladaLoader2._log "Vector source tries to access too many elements", ColladaLoader2.messageError
        return null
    for i in [i0..i1] by 3
        data.push new THREE.Vector3 srcData[i], srcData[i+1], srcData[i+2]
    return data

###*
*   Creates an array of color vectors
*
*   @param {?ColladaLoader2.Source} source
*   @return {?Array.<!THREE.Color>}
###
ColladaLoader2.File::_createColorArray = (source) ->
    if not source? then return null
    if source.stride < 3
        ColladaLoader2._log "Color source data does not contain 3D vectors", ColladaLoader2.messageError
        return null
    data = []
    srcData = source.data
    i0 = source.offset
    i1 = source.offset + source.count*source.stride
    if i1 > source.data.length
        ColladaLoader2._log "Color source tries to access too many elements", ColladaLoader2.messageError
        return null
    for i in [i0..i1] by source.stride
        data.push new THREE.Color().setRGB srcData[i], srcData[i+1], srcData[i+2]
    return data

###*
*   Creates an array of UV vectors
*
*   @param {?ColladaLoader2.Source} source
*   @return {?Array.<!THREE.Vector2>}
###
ColladaLoader2.File::_createUVArray = (source) ->
    if not source? then return null
    if source.stride < 2
        ColladaLoader2._log "UV source data does not contain 2D vectors", ColladaLoader2.messageError
        return null
    data = []
    srcData = source.data
    i0 = source.offset
    i1 = source.offset + source.count*source.stride
    if i1 > source.data.length
        ColladaLoader2._log "UV source tries to access too many elements", ColladaLoader2.messageError
        return null
    for i in [i0..i1] by source.stride
        data.push new THREE.Vector2 srcData[i], 1.0 - srcData[i+1]
    return data

###*
*   Creates a map of three.js materials
*
*   @param {!Array.<!ColladaLoader2.InstanceMaterial>} daeInstanceMaterials
*   @return {!ColladaLoader2.ThreejsMaterialMap}
###
ColladaLoader2.File::_createMaterials = (daeInstanceMaterials) ->
    result = new ColladaLoader2.ThreejsMaterialMap
    numMaterials = 0
    for daeInstanceMaterial in daeInstanceMaterials
        symbol = daeInstanceMaterial.symbol
        if not symbol?
            ColladaLoader2._log "Material instance has no symbol, material skipped.", ColladaLoader2.messageError
            continue
        if result.indices[symbol]?
            ColladaLoader2._log "Geometry instance tried to map material symbol #{symbol} multiple times", ColladaLoader2.messageError
            continue
        threejsMaterial = @_createMaterial daeInstanceMaterial

        # If the material contains a bump or normal map, compute tangents
        if threejsMaterial.bumpMap? or threejsMaterial.normalMap? then result.needTangents = true

        @threejs.materials.push threejsMaterial
        result.materials.push threejsMaterial
        result.indices[symbol] = numMaterials++
    return result

###*
*   Creates a three.js material
*
*   @param {!ColladaLoader2.InstanceMaterial} daeInstanceMaterial
*   @return {!THREE.Material}
###
ColladaLoader2.File::_createMaterial = (daeInstanceMaterial) ->
    daeMaterial = ColladaLoader2.Material.fromLink daeInstanceMaterial.material
    if not daeMaterial?
        ColladaLoader2._log "Material not found, using default material", ColladaLoader2.messageWarning
        return @_createDefaultMaterial()
    daeEffect   = ColladaLoader2.Effect.fromLink daeMaterial.effect
    if not daeEffect?
        ColladaLoader2._log "Material effect not found, using default material", ColladaLoader2.messageWarning
        return @_createDefaultMaterial()

    return @_createBuiltInMaterial daeEffect

###*
*   Creates a three.js shader material
*
*   @param {!ColladaLoader2.Effect} daeEffect
*   @return {!THREE.ShaderMaterial}
###
ColladaLoader2.File::_createShaderMaterial = (daeEffect) ->
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

    @_setUniformColor uniforms, "uDiffuseColor",  technique.diffuse
    @_setUniformColor uniforms, "uSpecularColor", technique.specular
    @_setUniformColor uniforms, "uAmbientColor",  technique.ambient

    if technique.shininess?        then uniforms[ "uShininess" ].value = technique.shininess
    if @_hasTransparency daeEffect then uniforms[ "uOpacity" ].value   = @_getOpacity daeEffect

    materialNormalMap = new THREE.ShaderMaterial({
        fragmentShader: shader.fragmentShader,
        vertexShader: shader.vertexShader,
        uniforms: uniforms,
        lights: true
    })
    return materialNormalMap

###*
*   Sets the value of a uniform color
*
*   @param {!Object.<!string, Object>} uniformMap
*   @param {!string} uniformName
*   @param {?ColladaLoader2.ColorOrTexture} color
###
ColladaLoader2.File::_setUniformColor = (uniformMap, uniformName, color) ->
    if color? and color.color?
        uniformMap[uniformName].value.setHex ColladaLoader2._colorToHex color.color
    return

###*
*   Returns the surface opacity of an effect
*   Opacity of 1.0 means the object is fully opaque
*   Opacity of 0.0 means the object is fully transparent
*   See section "Determining Transparency (Opacity)" in the COLLADA spec
*
*   @param {!ColladaLoader2.Effect} daeEffect
*   @return {!number}
###
ColladaLoader2.File::_getOpacity = (daeEffect) ->
    technique = daeEffect.technique
    transparent = technique.transparent
    opacityMode = transparent?.opaque
    if opacityMode? and opacityMode isnt "A_ONE"
        ColladaLoader2._log "Opacity mode #{opacityMode} not supported, transparency will be broken", ColladaLoader2.messageWarning

    if transparent?.textureSampler?
        ColladaLoader2._log "Separate transparency texture not supported, transparency will be broken", ColladaLoader2.messageWarning

    transparentA = transparent?.color?[3] or 1
    transparency = technique.transparency or 1
    return transparentA*transparency

###*
*   Returns true if the effect has any transparency information
*
*   @param {!ColladaLoader2.Effect} daeEffect
*   @return {!boolean}
###
ColladaLoader2.File::_hasTransparency = (daeEffect) ->
    technique = daeEffect.technique
    transparent  = technique.transparent
    transparency = technique.transparency
    return transparent?.textureSampler? or (transparency? and transparency isnt 1)

###*
*   Returns true if the effect requests double-sided rendering
*
*   @param {!ColladaLoader2.Effect} daeEffect
*   @return {!boolean}
###
ColladaLoader2.File::_isDoubleSided = (daeEffect) ->
    technique = daeEffect.technique

    # First, handle extensions that set the property directly
    if technique.double_sided? then return technique.double_sided
    
    # Look for the parameter in the effect
    double_sided = @_getDoubleSidedParam daeEffect.params
    if double_sided? then return double_sided

    # Look for the parameter in the technique
    double_sided = @_getDoubleSidedParam daeEffect.technique.params
    if double_sided? then return double_sided

    return false

###*
*   Returns the value of the param with the DOUBLE_SIDED semantic
*
*   @param {!Array.<!ColladaLoader2.EffectParam>} params
*   @return {?boolean}
###
ColladaLoader2.File::_getDoubleSidedParam = (params) ->
    for param in params
        if param.semantic is "DOUBLE_SIDED"
            if param.floats?
                return param.floats[0] > 0
            else
                ColladaLoader2._log "Missing value for DOUBLE_SIDED parameter, assuming 'true'", ColladaLoader2.messageWarning
                return true
    return null

###*
*   Creates a three.js built-in material
*
*   @param {!ColladaLoader2.Effect} daeEffect
*   @return {!THREE.Material}
###
ColladaLoader2.File::_createBuiltInMaterial = (daeEffect) ->
    technique = daeEffect.technique
    params = {}

    # Initialize color/texture parameters
    @_setThreejsMaterialColor params, technique.diffuse,  "diffuse",  "map",         false
    @_setThreejsMaterialColor params, technique.emission, "emissive", null,          false
    @_setThreejsMaterialColor params, technique.ambient,  "ambient",  "lightMap",    false
    @_setThreejsMaterialColor params, technique.specular, "specular", "specularMap", false
    @_setThreejsMaterialColor params, technique.bump,     null      , "normalMap",   false

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
    if @_isDoubleSided daeEffect
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
            return @_createDefaultMaterial()

###*
*   Creates a default three.js material
*
*   This is used if the material definition is somehow invalid
*   @return {!THREE.Material}
###
ColladaLoader2.File::_createDefaultMaterial = () ->
    new THREE.MeshLambertMaterial { color: 0xdddddd, shading: THREE.FlatShading }

###*
*   Sets a three.js material parameter
*
*   @param {!Object} params
*   @param {?ColladaLoader2.ColorOrTexture} colorOrTexture
*   @param {?string} nameColor
*   @param {?string} nameTexture
*   @param {!boolean} replace
###
ColladaLoader2.File::_setThreejsMaterialColor = (params, colorOrTexture, nameColor, nameTexture, replace) ->
    if not colorOrTexture? then return
    if colorOrTexture.color? and nameColor?
        if not replace and params[nameColor]? then return
        params[nameColor] = ColladaLoader2._colorToHex colorOrTexture.color
    else if colorOrTexture.textureSampler? and nameTexture?
        if not replace and params[nameTexture]? then return
        threejsTexture = @_loadThreejsTexture colorOrTexture
        if threejsTexture? then params[nameTexture] = threejsTexture
    return

###*
*   Loads a three.js texture
*
*   @param {ColladaLoader2.ColorOrTexture} colorOrTexture
*   @return {THREE.Texture|null}
###
ColladaLoader2.File::_loadThreejsTexture = (colorOrTexture) ->
    if not colorOrTexture.textureSampler? then return null

    textureSampler = ColladaLoader2.EffectParam.fromLink colorOrTexture.textureSampler
    if not textureSampler?
        ColladaLoader2._log "Texture sampler not found, texture will be missing", ColladaLoader2.messageWarning
        return null
    textureSampler = textureSampler.sampler
    if not textureSampler?
        ColladaLoader2._log "Texture sampler param has no sampler, texture will be missing", ColladaLoader2.messageWarning
        return null

    # TODO: Currently, all texture parameters (filtering, wrapping) are ignored
    # TODO: Read the parameters from the sampler and figure out
    # TODO: when textures can be shared (if they have the same parameters).
    textureImage = null
    if textureSampler.image?
        # COLLADA 1.5 path: texture -> sampler -> image
        textureImage = ColladaLoader2.Image.fromLink textureSampler.image
        if not textureImage?
            ColladaLoader2._log "Texture image not found, texture will be missing", ColladaLoader2.messageWarning
            return null
    else if textureSampler.surface?
        # COLLADA 1.4 path: texture -> sampler -> surface -> image
        textureSurface = ColladaLoader2.EffectParam.fromLink textureSampler.surface
        if not textureSurface?
            ColladaLoader2._log "Texture surface not found, texture will be missing", ColladaLoader2.messageWarning
            return null
        textureSurface = textureSurface.surface
        if not textureSurface?
            ColladaLoader2._log "Texture surface param has no surface, texture will be missing", ColladaLoader2.messageWarning
            return null
        textureImage   = ColladaLoader2.Image.fromLink textureSurface.initFrom
        if not textureImage?
            ColladaLoader2._log "Texture image not found, texture will be missing", ColladaLoader2.messageWarning
            return null
    if not textureImage.initFrom?
        ColladaLoader2._log "Texture image has no source url, texture will be missing", ColladaLoader2.messageWarning
        return null
    imageURL = @_baseUrl + textureImage.initFrom
    texture = @_loader._loadTextureFromURL imageURL

    return texture

#==============================================================================
# ColladaLoader2: PUBLIC INTERFACE
#==============================================================================

###*
*   Texture cache
*
*   @type {!Object.<!string, !THREE.Texture>}
*   @private
###
ColladaLoader2::_imageCache

###*
*   Loader options
*
*   @type {!Object}
*   @expose
###
ColladaLoader2::options

###*
*   Initializes the loader
*
*   @private
###
ColladaLoader2::_init = () ->
    @_imageCache = {}
    @options =
        # Output animated meshes, if animation data is available
        "useAnimations": true
        # Convert skinned meshes to morph animated meshes
        "convertSkinsToMorphs": false
        # Verbose message output
        "verboseMessages": false
        # Search for images in the image cache using different variations of the file name
        "localImageMode": false

###*
*   Sets a new callback for log messages.
*   This is just an alias for ColladaLoader2.setLog().
*
*   @param {?function(string, number)} logCallback
*   @expose
###
ColladaLoader2::setLog = (logCallback) -> ColladaLoader2.setLog logCallback

###*
*   Adds images to the texture cache
*
*   @param {Array.<!THREE.Texture>} textures
*   @expose
###
ColladaLoader2::addCachedTextures = (textures) ->
    for key, value of textures
        @_imageCache[key] = value
    return

###*
*   Loads a collada file from a URL.
*
*   @param {!string} url
*   @param {?function(ColladaLoader2.File)} readyCallback
*   @param {?function(Object)} progressCallback
*   @expose
###
ColladaLoader2::load = (url, readyCallback, progressCallback) ->
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
                        ColladaLoader2._log "Empty or non-existing file #{url}.", ColladaLoader2.messageError
            else if req.readyState is 3
                if progressCallback
                    if length is 0
                        length = req.getResponseHeader "Content-Length"
                    progressCallback { total: length, loaded: req.responseText.length }

        req.open "GET", url, true
        req.send null
        return
    else
        ColladaLoader2._log "Don't know how to parse XML!", ColladaLoader2.messageError
        return

###*
*   Parses a COLLADA XML document.
*
*   @param {!XMLDocument} doc
*   @param {?function(ColladaLoader2.File)} readyCallback
*   @param {!string} url
*   @return {ColladaLoader2.File}
*   @expose
###
ColladaLoader2::parse = (doc, readyCallback, url) ->
    # Create an empty collada file
    file = new ColladaLoader2.File @
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
# ColladaLoader2: PRIVATE HELPER FUNCTIONS FOR IMAGE LOADING
#==============================================================================

###*
*   Loads a three.js texture from a URL
*
*   @param {!string} imageURL
*   @return {!THREE.Texture}
*   @private
###
ColladaLoader2::_loadTextureFromURL = (imageURL) ->
    # Look in the image cache first
    texture = @_imageCache[imageURL]
    if texture? then return texture

    # Load the image
    if @options.localImageMode then texture = @_loadImageLocal imageURL
    if not texture? then texture = @_loadImageSimple imageURL

    # Add the image to the cache
    if texture? then @_imageCache[imageURL] = texture
    else ColladaLoader2._log "Texture #{imageURL} could not be loaded, texture will be ignored.", ColladaLoader2.messageError
    return texture

###*
*   Loads an image using a the threejs image loader
*
*   @param {!string} imageURL
*   @return {!THREE.Texture}
*   @private
###
ColladaLoader2::_loadImageThreejs = (imageURL) ->
    texture = THREE.ImageUtils.loadTexture imageURL
    texture.flipY = false
    return texture

###*
*   Loads an image using a very simple approach
*
*   @param {!string} imageURL
*   @return {!THREE.Texture}
*   @private
###
ColladaLoader2::_loadImageSimple = (imageURL) ->
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

###*
*   Loads an image from the cache, trying different variations of the file name
*
*   @param {!string} imageURL
*   @return {?THREE.Texture}
*   @private
###
ColladaLoader2::_loadImageLocal = (imageURL) ->
    texture = null
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

###*
*   Removes the file extension from a string
*
*   @param {!string} filePath
*   @return {!string}
*   @private
###
ColladaLoader2::_removeFileExtension = (filePath) -> filePath.substr(0, filePath.lastIndexOf ".") or filePath

###*
*   Removes the the pattern "./" from a string
*
*   @param {!string} filePath
*   @return {!string}
*   @private
###
ColladaLoader2::_removeSameDirectoryPath = (filePath) -> filePath.replace /^.\//, ""

#==============================================================================
# SECTION: GLOBAL HELPER FUNCTIONS FOR LOGGING
#==============================================================================

###*
*   @const
*   @type {!number}
*   @expose
###
ColladaLoader2.messageTrace   = 0
###*
*   @const
*   @type {!number}
*   @expose
###
ColladaLoader2.messageInfo    = 1
###*
*   @const
*   @type {!number}
*   @expose
###
ColladaLoader2.messageWarning = 2
###*
*   @const
*   @type {!number}
*   @expose
###
ColladaLoader2.messageError   = 3
###*
*   @const
*   @type {!Array.<!string>}
*   @expose
###
ColladaLoader2.messageTypes   = [ "TRACE", "INFO", "WARNING", "ERROR" ]

###*
*   Sets a new callback for log messages.
*
*   @param {?function(string, number)} logCallback
*   @expose
###
ColladaLoader2.setLog = (logCallback) ->
    ColladaLoader2._log = logCallback or ColladaLoader2._colladaLogConsole
    return

###*
*   Default log message callback.
*
*   @param {!string} msg
*   @param {!number} type
*   @private
###
ColladaLoader2._colladaLogConsole = (msg, type) ->
    console.log "ColladaLoader2 " + ColladaLoader2.messageTypes[type] + ": " + msg;
    return

###*
*   Global log output function pointer
*
*   @type{!function(string, number)}
*   @private
###
ColladaLoader2._log = ColladaLoader2._colladaLogConsole

###*
*   Report an unexpected child element
*
*   @param {!Node} child
*   @private
###
ColladaLoader2._reportUnexpectedChild = (child) ->
    ColladaLoader2._log "Skipped unknown element #{ColladaLoader2._getNodePath(child)}.", ColladaLoader2.messageWarning
    return

###*
*   Report an unhandled extra element
*
*   @param {!Node} child
*   @private
###
ColladaLoader2._reportUnhandledExtra = (child) ->
    ColladaLoader2._log "Skipped element #{ColladaLoader2._getNodePath(child)}. Element is legal, but not handled by this loader.", ColladaLoader2.messageWarning
    return

###*
*   Report an unhandled extra element
*
*   @param {!ColladaLoader2.UrlLink|!ColladaLoader2.FxLink|!ColladaLoader2.SidLink} link
*   @param {!function(...)} type
*   @private
###
ColladaLoader2._reportInvalidTargetType = (link, type) ->
    ColladaLoader2._log "Link #{link.url} does not point to a #{type.name}", ColladaLoader2.messageError
    return

###*
*   Returns the path of a XML node
*
*   @param {!Node} node
*   @return {!string}
*   @private
###
ColladaLoader2._getNodePath = (node) ->
    path   = "<#{node.nodeName}>"
    len    = 1
    maxLen = 10
    while node.parentNode?
        node = node.parentNode
        if node.nodeName.toUpperCase() is "COLLADA"
            break
        else if len >= maxLen
            path = ".../" + path
            break
        else
            path = "<#{node.nodeName}>/" + path
            len += 1
    return path

#==============================================================================
# SECTION: GLOBAL HELPER FUNCTIONS FOR DATA PARSING
#==============================================================================

###*
*   Splits a string into whitespace-separated strings
*
*   @param {!string} str
*   @return {!Array.<!string>}
*   @private
###
ColladaLoader2._strToStrings = (str) ->
    if str.length > 0
        trimmed = str.trim()
        trimmed.split( /\s+/ )
    else
        []

###*
*   Parses a string of whitespace-separated float numbers
*
*   A very minor speedup could be achieved by iterating over characters of the string
*   and parsing substrings on the fly.
*   Using Float32Array does not seem to give any speedup, but could save memory.
*
*   @param {!string} str
*   @return {!Float32Array}
*   @private
###
ColladaLoader2._strToFloats = (str) ->
    strings = ColladaLoader2._strToStrings str
    data = new Float32Array(strings.length)
    data[i] = parseFloat(string) for string, i in strings
    return data

###*
*   Parses a string of whitespace-separated int numbers
*
*   @param {!string} str
*   @return {!Int32Array}
*   @private
###
ColladaLoader2._strToInts = (str) ->
    strings = ColladaLoader2._strToStrings str
    data = new Int32Array(strings.length)
    data[i] = parseInt(string, 10) for string, i in strings
    return data

###*
*   Parses a string of whitespace-separated boolean values
*
*   @param {!string} str
*   @return {!Uint8Array}
*   @private
###
ColladaLoader2._strToBools = (str) ->
    strings = ColladaLoader2._strToStrings str
    data = new Uint8Array(strings.length)
    data[i] = ( string is "true" or string is "1" ? 1 : 0 ) for string, i in strings
    return data

###*
*   Parses a string (consisting of four floats) into a RGBA color
*
*   @param {!string} str
*   @return {?Float32Array}
*   @private
###
ColladaLoader2._strToColor = (str) ->
    rgba = ColladaLoader2._strToFloats str
    if rgba.length is 4
        return rgba
    else
        return null

###*
*   Converts a 4D array to a hex number
*
*   @param {!Array.<!number>|!Float32Array} rgba
*   @return {!number}
*   @private
###
ColladaLoader2._colorToHex = (rgba) ->
    Math.floor( rgba[0] * 255 ) << 16 ^ Math.floor( rgba[1] * 255 ) << 8 ^ Math.floor( rgba[2] * 255 )

###*
*   Converts an array of floats to a 4D matrix
*
*   @param {!Array.<!number>|!Float32Array} data
*   @param {!number} offset
*   @return {!THREE.Matrix4}
*   @private
###
ColladaLoader2._floatsToMatrix4ColumnMajor = (data, offset) ->
    new THREE.Matrix4 data[0+offset], data[4+offset], data[8+offset], data[12+offset],
    data[1+offset], data[5+offset], data[9+offset], data[13+offset],
    data[2+offset], data[6+offset], data[10+offset], data[14+offset],
    data[3+offset], data[7+offset], data[11+offset], data[15+offset]

###*
*   Converts an array of floats to a 4D matrix
*
*   @param {!Array.<!number>|!Float32Array} data
*   @param {!number} offset
*   @return {!THREE.Matrix4}
*   @private
###
ColladaLoader2._floatsToMatrix4RowMajor = (data, offset) ->
    new THREE.Matrix4 data[0+offset], data[1+offset], data[2+offset], data[3+offset],
    data[4+offset], data[5+offset], data[6+offset], data[7+offset],
    data[8+offset], data[9+offset], data[10+offset], data[11+offset],
    data[12+offset], data[13+offset], data[14+offset], data[15+offset]

###*
*   Copies an array of floats to a 4D matrix (row major order)
*
*   Note: THREE.Matrix4 has a constructor that takes elements in column-major order.
*   Since this function takes elements in column-major order as well, they are passed in order.
*
*   @param {!Array.<!number>|!Float32Array} data
*   @param {!number} offset
*   @param {!THREE.Matrix4} matrix
*   @private
###
ColladaLoader2._fillMatrix4ColumnMajor = (data, offset, matrix) ->
    matrix.set data[0+offset], data[4+offset], data[8+offset], data[12+offset],
    data[1+offset], data[5+offset], data[9+offset], data[13+offset],
    data[2+offset], data[6+offset], data[10+offset], data[14+offset],
    data[3+offset], data[7+offset], data[11+offset], data[15+offset]
    return

###*
*   Copies an array of floats to a 4D matrix
*
*   Note: THREE.Matrix4 has a constructor that takes elements in column-major order.
*   Since this function takes elements in row-major order, they are swizzled.
*
*   @param {!Array.<!number>|!Float32Array} data
*   @param {!number} offset
*   @param {!THREE.Matrix4} matrix
*   @private
###
ColladaLoader2._fillMatrix4RowMajor = (data, offset, matrix) ->
    matrix.set data[0+offset], data[1+offset], data[2+offset], data[3+offset],
    data[4+offset], data[5+offset], data[6+offset], data[7+offset],
    data[8+offset], data[9+offset], data[10+offset], data[11+offset],
    data[12+offset], data[13+offset], data[14+offset], data[15+offset]
    return

###*
*   Checks the matrix
*
*   @param {!THREE.Matrix4} matrix
*   @private
###
ColladaLoader2._checkMatrix4 = (matrix) ->
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
    return

###*
*    Converts an array of floats to a 3D vector
*
*   @param {!Array.<!number>|!Float32Array} data
*   @return {!THREE.Vector3}
*   @private
###
ColladaLoader2._floatsToVec3 = (data) ->
    new THREE.Vector3 data[0], data[1], data[2]

###*
*   Conversion factor from degrees to radians
*
*   @const
*   @type {!number}
*   @private
###
ColladaLoader2.TO_RADIANS = Math.PI / 180.0

#==============================================================================
# SECTION: API EXPORT
#==============================================================================

# The following code makes sure the ColladaLoader2 class is visible outside of this file
if module? then module['exports'] = ColladaLoader2
else if window? then window['ColladaLoader2'] = ColladaLoader2
