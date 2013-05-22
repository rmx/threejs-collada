// three.js global variables
var logElement;
var scene;
var renderer;
var camera;
var controls;
var loadedMeshes = [];
var loadedLights = [];
var loadedCameras = [];
var gridLines;
var light;
var lightSphere;
var lastTimestamp;
var timers = {};
var imageCache = {};
var modelRadius = 1;
var lightTime = 0;
var keyframesPerSecond = 10;
var keyframeMin = 0;
var keyframeMax = 999;
var statisticsElement;
var contentNode;
var useLights = false;
var useCamera = false;
var animations = [];
var messages = [];
var msgFilter = {};

// implementation
function initApplication() {
    // Drag and drop does not work without this
    jQuery.event.props.push('dataTransfer');

    // jQuery UI Slider
    $( "#kps" ).slider({max:100, min:1, value:10, change:onKpsChange, slide:onKpsChange});
    $( "#frameRange" ).slider({range: true, min: 0, max: 999, values: [ 0, 999 ], slide: onFrameRangeChange});

    // Events
    $( "#view_container" ).on("drop", onMeshDrop);
    $( "#view_container" ).on("dragover", onDragOver);
    $( "#images" ).on("drop", onImageDrop);
    $( "#images" ).on("dragover", onDragOver);
    $( "#use_lights" ).change( onUseCameraAndLightsChange );
    $( "#use_camera" ).change( onUseCameraAndLightsChange );
    $( "#filterErrors" ).click( onMessageFilterClicked );
    $( "#filterWarnings" ).click( onMessageFilterClicked );
    $( "#filterInfo" ).click( onMessageFilterClicked );
    $( "#filterTrace" ).click( onMessageFilterClicked );
    $( "#clearLog" ).click( clearMessageLog );
    $( "#load" ).click( loadFile );
    $( "#inputfile" ).change( readFile );

    // Pop-overs
    var popover = {
        trigger:"hover",
        placement:"left",
        delay: { show: 800, hide: 0 }
    };
    popover.title = "Load animations";
    popover.content = "If checked, animated meshes will be loaded. Otherwise, a static version of animated meshes will be loaded. Does not affect already loaded meshes.";
    $('#load_animations_label').popover(popover);
    popover.title = "Skins as morphs";
    popover.content = "If checked, all skin animated meshes will be converted to morph animated meshes upon loading. Does not affect already loaded meshes.";
    $('#skin_to_morph_label').popover(popover);
    popover.title = "Use loaded lights";
    popover.content = "If checked, lights from the collada file will be used for rendering. Otherwise, a static light setup with a moving point light will be used. Can be toggled at any time.";
    $('#use_lights_label').popover(popover);
    popover.title = "Use loaded camera";
    popover.content = "If checked, the first camera from the collada file will be used for rendering. Otherwise, a user-controlled, interactive camera will be used. Can be toggled at any time. Has no effect if there is no camera in the collada file.";
    $('#use_camera_label').popover(popover);
    
    // Misc
    statisticsElement = document.getElementById( 'statistics' );
    updateMessageFilter();
    initCanvas();
    animateCanvas(Date.now());
}
function logMessage(type, msg) {
    messages.push({type:type, desc:msg});
    console.log(msg);
    addMessageToLog(type, msg);
}
function addMessageToLog(type, msg) {
    if (msgFilter[type]) {
        // Escape HTML characters
        html = msg.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
        html = '<tr><td>' + type + '</td><td>' + html + '</td></tr>'
        $('#log > tbody:last').append(html);
    }
}
function rebuildLog() {
    $('#log tbody > tr').remove();
    for(var i=0;i<messages.length;++i) {
        msg = messages[i];
        addMessageToLog(msg.type, msg.desc);
    }
}
function clearMessageLog() {
    messages = [];
    rebuildLog();
}
function onMessageFilterClicked() {
    $(this).toggleClass("active");
    updateMessageFilter();
}
function updateMessageFilter() {
    msgFilter["ERROR"] = $( "#filterErrors" ).hasClass("active");
    msgFilter["WARNING"] = $( "#filterWarnings" ).hasClass("active");
    msgFilter["INFO"] = $( "#filterInfo" ).hasClass("active");
    msgFilter["TRACE"] = $( "#filterTrace" ).hasClass("active");
    rebuildLog();
}
function logActionStart(action) {
    logMessage("TRACE", action + " started.");
    timers[action] = Date.now();
}
function logActionEnd(action) {
    var start = timers[action];
    var duration = Date.now() - start;
    logMessage("TRACE", action + " finished (" + duration + "ms).");
}
function onKpsChange(ev, ui) {
    keyframesPerSecond = parseInt(ui.value, 10);
    $( "#kpsLabel" ).text( '' + keyframesPerSecond.toPrecision(3) + ' keyframes per second' );
}
function onFrameRangeChange(ev, ui) {
    keyframeMin = parseInt(ui.values[0], 10);
    keyframeMax = parseInt(ui.values[1], 10);
    $( "#frameRangeLabel" ).text( 'Keyframe playback range: ' + keyframeMin + ' - ' + keyframeMax + '' );
}
function onUseCameraAndLightsChange(ev) {
    useLights = $( "#use_lights" ).is(":checked");
    useCamera = $( "#use_camera" ).is(":checked");

    light.visible = !useLights;
    lightSphere.visible = !useLights;
    for(var i=0; i<loadedLights.length; i++){
        loadedLights[i].visible = useLights;
    }
    
}
function onDragOver(ev) {
    //ev.stopPropagation();
    ev.preventDefault();
    //ev.dataTransfer.dropEffect = 'copy'; // Explicitly show this is a copy.
}
function onMeshDrop(ev) {
    setModels();
    ev.preventDefault();
    var dt    = ev.dataTransfer;
    var files = dt.files;
    if (files.length == 0) {
        logMessage("ERROR", "You did not drop a file. Try dragging and dropping a file instead.");
        return;
    }
    if (files.length > 1) {
        logMessage("ERROR", "You dropped multiple files. Please only drop a single file.");
        return;
    }
    var file = files[0];
    var reader = new FileReader();
    reader.onload = onFileLoaded;
    reader.onerror = onFileError;
    logActionStart("File reading");
    reader.readAsText(file);
}
function loadFile(ev) {
    $("#inputfile").click();
}
function readFile(ev) {
    var files = ev.target.files;
    var file = files[0];
    var reader = new FileReader();
    reader.onload = onFileLoaded;
    reader.onerror = onFileError;
    logActionStart("File reading");
    reader.readAsText(file);
}
function onImageDrop(ev) {
    ev.preventDefault();
    var dt    = ev.dataTransfer;
    var files = dt.files;
    for(var i=0; i<files.length; ++i) {
        loadImage(files[i]);
    }
}
function loadImage(file) {
    var reader = new FileReader();
    reader.onload = function(ev) { onImageFileRead(reader, file); }
    reader.onerror = onFileError;
    reader.readAsDataURL(file);
}
function loadCOLLADAFile(data, loader) {
    var parser = new DOMParser();
    logActionStart("XML parsing");
    var xmlDoc = parser.parseFromString(data,"text/xml");
    logActionEnd("XML parsing");
    logActionStart("COLLADA parsing");
    loader.parse( xmlDoc, function ( collada ) {
        logActionEnd("COLLADA parsing");
        console.log(collada);
        var enableDocumentInfoOutput = false
        if (enableDocumentInfoOutput && collada.getInfo) {
            console.log(collada.getInfo(0,""));
        }
        setModels(collada.scene);
        console.profileEnd();
        parseProfiles();
    }, document.URL);
}
function loadJSONFile(data, loader) {
    logActionStart("JSON parsing");
    var json = JSON.parse( data );
    logActionEnd("JSON parsing");
    logActionStart("JSON model parsing");
    loader.createModel ( json, function( geometry ) { 
        logActionEnd("JSON model parsing");
        // Fix threejs' stupid image flipping
        var map = imageCache["map.jpg"];
        if (map != undefined) {/* map = map.clone(); */ map.flipY = true;}
        
        var bumpMap = imageCache["bumpMap.jpg"];
        if (bumpMap != undefined) {/* bumpMap = bumpMap.clone(); */ bumpMap.flipY = true;}
        
        var normalMap = imageCache["normalMap.jpg"];
        if (normalMap != undefined) {/* normalMap = normalMap.clone(); */ normalMap.flipY = true;}
        
        var specularMap = imageCache["specularMap.jpg"];
        if (specularMap != undefined) {/* specularMap = specularMap.clone(); */ specularMap.flipY = true;}
        
        var material = new THREE.MeshPhongMaterial( {
            ambient: 0x333333,
            color: 0xffffff,
            specular: 0x333333,
            shininess: 25,
            perPixel: true,
            map: map,
            bumpMap: bumpMap,
            bumpScale: 1,
            normalMap: normalMap,
            normalScale: 1,
            specularMap: specularMap,
            metal: false } );
        var mesh = new THREE.Mesh( geometry, material );
        setModels(mesh);
    });
}
function onFileLoaded(ev) {
    console.profile("onFileLoaded");
    var data = this.result;
    logActionEnd("File reading");
    var selectElement = document.getElementById("loader_type");
    switch (selectElement.selectedIndex) {
        case 0:
            var loader = new THREE.ColladaLoader();
            loadCOLLADAFile(data, loader);
            break;
        case 1:
            var loader = new ColladaLoader2();
            loader.options.localImageMode = true;
            loader.options.verboseMessages = true;
            loader.options.convertSkinsToMorphs = document.getElementById( 'skin_to_morph' ).checked;
            loader.options.useAnimations = document.getElementById( 'load_animations' ).checked;
            loader.addCachedTextures(imageCache)
            loader.setLog(function(msg, type) {logMessage(ColladaLoader2.messageTypes[type], msg); } );
            loadCOLLADAFile(data, loader);
            break;
        case 2:
            var loader = new THREE.JSONLoader();
            loadJSONFile(data, loader);
            break;
        default:
            throw new Error("Unknown loader type");
    }
}
function parseProfiles(node, depth) {
    if (depth > 10) {
        return;
    }
    if (node===undefined) {
        var profile = console.profiles[0];
        if (profile != undefined) {
            var head = profile.head;
            if (head != undefined) {
                profileData = [];
                parseProfiles(head, 0);
                var profileDataStr     = profileData.join("\n");
                //document.getElementById( 'profile' ).value = profileDataStr;
            }
        }
        return;
    }
    var functionName = node.functionName;
    for(var i=functionName.length;i<40;++i) functionName += " ";
    profileData.push(functionName + "\t" + node.selfTime.toFixed(2) + "\t" + node.totalTime.toFixed(2));
    var children = node.children();
    for(var i in children) {
        parseProfiles(children[i], depth+1);
    }
}

function onImageFileRead(reader, file) {
    var dataURI = reader.result;
    var image = new Image;
    image.name = file.name;
    image.onload = function () { onImageLoaded(image, file.name); };
    image.src = dataURI
}
function onImageLoaded(image, name) {
    var texture = new THREE.Texture( image, new THREE.UVMapping() );
    texture.flipY = false;
    // HACK: Set the repeat mode to repeat
    texture.wrapS = THREE.RepeatWrapping
    texture.wrapT = THREE.RepeatWrapping
    texture.needsUpdate = true;
    imageCache[name] = texture;
    imagesLog = document.getElementById( 'images' );
    imagesLog.value += name;
    imagesLog.value += "\n";
}

function onFileError(ev) {
    logMessage("ERROR", "Can not read the file. Most likely, reading of files is disabled in your browser for security reasons. Error code: " + this.error.code);
}
function initCanvas() {
    logActionStart("WebGL initialization");
    var webglInitStarted = Date.now();
    var container = document.getElementById( 'view_container' );
    
    // Scene
    scene = new THREE.Scene();

    // Camera
    camera = new THREE.PerspectiveCamera( 20, container.clientWidth / container.clientHeight, 0.1, 10000 );
    camera.up.set( 0, 0, 1 );
    camera.position.set( -7, 3, 5 );
    camera.lookAt( new THREE.Vector3( 0, 0, 0 ) );
    scene.add( camera );
    
    // Controller
    controls = new THREE.TrackballControls( camera, container );
    controls.rotateSpeed = 1.0;
    controls.zoomSpeed = 1.2;
    controls.panSpeed = 0.8;
    controls.noZoom = false;
    controls.noPan = false;
    controls.staticMoving = true;
    controls.dynamicDampingFactor = 0.3;
    controls.keys = [ 65, 83, 68 ];
    controls.screen = {width: container.offsetWidth, height: container.offsetHeight, offsetLeft: container.offsetLeft, offsetTop: container.offsetTop };

    // Light
    scene.add( new THREE.AmbientLight( 0x606060 ) );

    light = new THREE.PointLight( 0xeeeeee );
    light.position.set(3,2,3);
    scene.add( light );

    lightSphere = new THREE.Mesh( new THREE.SphereGeometry(0.1, 16, 16), new THREE.MeshBasicMaterial({color:0xffffff, ambient:0xffffff}));
    lightSphere.position.set(3,2,3);
    scene.add(lightSphere);

    // Grid
    var material = new THREE.LineBasicMaterial( { color: 0xcccccc, opacity: 0.2 } );
    var geometry = new THREE.Geometry();
    var floor = -0.04, step = 1, size = 10;

    for ( var i = 0; i <= size / step * 2; i ++ ) {
        geometry.vertices.push( new THREE.Vector3( - size, i * step - size, floor ) );
        geometry.vertices.push( new THREE.Vector3(   size, i * step - size, floor ) );
        geometry.vertices.push( new THREE.Vector3( i * step - size, -size, floor ) );
        geometry.vertices.push( new THREE.Vector3( i * step - size, size, floor ) );
    }

    gridLines = new THREE.Line( geometry, material, THREE.LinePieces );
    gridLines.scale.x = 0.2
    gridLines.scale.y = 0.2
    gridLines.scale.z = 0.2
    scene.add( gridLines );

    // Content root node
    contentNode = new THREE.Object3D;
    scene.add( contentNode );

    // Renderer
    renderer = new THREE.WebGLRenderer( { antialias: true } );
    renderer.setSize( container.clientWidth, container.clientHeight );

    container.appendChild( renderer.domElement );
    logActionEnd("WebGL initialization");
}
function enforceRange(value, minVal, maxVal) {
    if (value < minVal) {
        return minVal;
    }
    else if (minVal >= maxVal) {
        return minVal;
    }
    else if (value > maxVal) {
        range = maxVal - minVal
        while (value > maxVal) {
            value -= range;
        }
        return value;
    }
    else return value;
}

function updateAnimation(timestamp) {
    // Get the elapsed time
    if (!lastTimestamp) {
        lastTimestamp = timestamp;
    }
    var frameTime = ( timestamp - lastTimestamp ) * 0.001; // seconds

    // Animate all meshes
    for(var m=0; m<loadedMeshes.length; m++)
    {
        model = loadedMeshes[m];
        if (model && model.morphTargetInfluences)
        {
            model.animstate.progress += frameTime * keyframesPerSecond;

            var morphTargets = model.morphTargetInfluences.length;
            var maxProgress = Math.min(morphTargets, keyframeMax);
            model.animstate.progress = enforceRange(model.animstate.progress, keyframeMin, maxProgress);

            for ( var i = 0; i < morphTargets; i++ ) {
                model.morphTargetInfluences[ i ] = 0;
            }

            progress_l = Math.floor( model.animstate.progress );
            progress_h = progress_l + 1;
            progress_f = model.animstate.progress - progress_l;
    
            model.morphTargetInfluences[ progress_l % morphTargets] = 1 - progress_f;
            model.morphTargetInfluences[ progress_h % morphTargets] = progress_f;
        }
        else if (model && model.geometry.animation)
        {
            model.animstate.animation.currentTime += frameTime * keyframesPerSecond;
            var maxProgress = Math.min(model.geometry.animation.length, keyframeMax);

            model.animstate.animation.update(0);

            // cannot enforce the range for skinned meshes due to the implementaiton of animation.update()
            // if you mess with the animation.currentTime member, the playback will get corrupted and output wrong values
            // model.animstate.animation.currentTime = enforceRange(model.animstate.animation.currentTime, keyframeMin, maxProgress);
        }
    }

    // Animate the light
    if (modelRadius > 0)
    {
        lightTime += frameTime;
        var x0 = -1.0*modelRadius;
        var y0 =  1.0*modelRadius;
        var z0 =  1.0*modelRadius;
        
        var t = lightTime*6.2831;
        var th = t / 6.0;
        var tv = t / 15.43;
        var x =  Math.cos(th)*x0 + Math.sin(th)*y0;
        var y = -Math.sin(th)*x0 + Math.cos(th)*y0;
        var z = (2.00 + 0.0*Math.sin(tv))*z0;
        light.position.set(x,y,z);
        lightSphere.position.set(x,y,z);
    }
    
    lastTimestamp = timestamp;
}

function appendMeshStatistics(mesh, index) {
    var vertexCount = 0;
    var faceCount = 0;
    if (mesh.geometry.vertices) vertexCount = mesh.geometry.vertices.length
    else if (mesh.geometry.attributes["position"]) vertexCount = mesh.geometry.attributes["position"].array.length / 3
    if (mesh.geometry.faces) faceCount = mesh.geometry.faces.length
    else if (mesh.geometry.attributes["index"]) faceCount = mesh.geometry.attributes["index"].array.length / 3
    statisticsElement.value += "Model #" + index + "\n"
    statisticsElement.value += "=================\n"
    if (mesh instanceof THREE.MorphAnimMesh) {
        statisticsElement.value += "Class: MorphAnimMesh\n"
    } else if (mesh instanceof THREE.SkinnedMesh) {
        statisticsElement.value += "Class: SkinnedMesh\n"
    } else if (mesh instanceof THREE.Mesh) {
        statisticsElement.value += "Class: Mesh\n"
    } else {
        statisticsElement.value += "Class: Unknown\n"
    }
    statisticsElement.value += "Radius: "+mesh.geometry.boundingSphere.radius.toFixed(3)+"\n";
    statisticsElement.value += "Vertices: "+vertexCount+"\n";
    statisticsElement.value += "Faces: "+faceCount+"\n";
    statisticsElement.value += "\n";

    var morph = mesh.geometry.morphTargets;
    var bones = mesh.geometry.bones;
    var anims = mesh.geometry.animation;
    if (morph && morph.length > 0) {
        statisticsElement.value += "Morph target animation\n";
        statisticsElement.value += "Keyframes: "+morph.length+"\n";
        statisticsElement.value += "\n";
    }
    if (bones && bones.length > 0 || anims && anims.length > 0) {
        statisticsElement.value += "Skinning animation\n";
        statisticsElement.value += "Bones: "+(bones?bones.length:"none")+"\n";
        statisticsElement.value += "Animation: "+(anims?"yes":"no")+"\n";
        statisticsElement.value += "\n";
    }
}

function appendLightStatistics(light, index) {
    statisticsElement.value += "Light #" + index + "\n"
    statisticsElement.value += "=================\n"
    statisticsElement.value += "\n";
}

function appendCameraStatistics(light, index) {
    statisticsElement.value += "Camera #" + index + "\n"
    statisticsElement.value += "=================\n"
    statisticsElement.value += "\n";
}

function setModels(loadedNode) {
    // Clear the scene
    for(var i=0;i<contentNode.children.length;i++) {
        contentNode.remove( contentNode.children[i] );
    }
    for(var i=0;i<animations.length;i++) {
        animations[i].stop();
    }
    animations = [];
    // Unfortunately, there is no way to remove animations from the animation handler
    // THREE.AnimationHandler.removeAll();

    statisticsElement.value = "";
    loadedMeshes = [];
    loadedLights = [];
    loadedCameras = [];
    
    if (!loadedNode) {
        return;
    }

    // Add the new content
    contentNode.add( loadedNode );

    // Collect statistics about the content
    var r = 0;
    var i = 0;

    loadedNode.traverse( function(node) {
        if (node instanceof THREE.Mesh) {
            node.animstate = {};
            node.animstate.progress = 0;

            loadedMeshes.push( node );

            appendMeshStatistics(node, i);
            
            node.geometry.computeBoundingSphere();
            r += node.geometry.boundingSphere.radius;
        }
        if (node instanceof THREE.SkinnedMesh && node.geometry.animation) {
            THREE.AnimationHandler.add( node.geometry.animation );
            var animation = new THREE.Animation( node, node.geometry.animation.name );
            animation.JITCompile = false;
            animation.interpolationType = THREE.AnimationHandler.LINEAR;
            animation.play();
            animations.push(animation);
            node.animstate.animation = animation;
        }
        if (node instanceof THREE.Light) {
            loadedLights.push( node );
            appendLightStatistics(node, i);
        }
        if (node instanceof THREE.Camera) {
            loadedCameras.push( node );
            appendCameraStatistics(node, i);
        }
        i++;
    });

    // Scale the light, camera, and grid position/size
    if (r < 0.001 || loadedMeshes.length === 0) {
        r = 1.0;
    } else {
        r /= loadedMeshes.length;
    }

    camera.position.set( -7.0*r, 3.0*r, 5.0*r );
    camera.lookAt( new THREE.Vector3( 0, 0, 0 ) );

    gridLines.scale.x = 0.2*r;
    gridLines.scale.y = 0.2*r;
    gridLines.scale.z = 0.2*r;

    modelRadius = r;
    lightTime = 0;

    // Reset the animations
    lastTimestamp = null;
}

function animateCanvas(timestamp) {
    controls.update();
    updateAnimation(timestamp);
    if (loadedCameras.length > 0 && useCamera) {
        renderer.render( scene, loadedCameras[ 0 ] );
    } else {
        renderer.render( scene, camera );
    }
    requestAnimationFrame( animateCanvas );
}