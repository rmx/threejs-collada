// three.js global variables
var logElement;
var scene;
var renderer;
var camera;
var controls;
var model;
var gridLines;
var light;
var lastTimestamp;
var keyframesPerSecond = 20;
var timers = {};
var imageCache = {};

// implementation
function initApplication() {
    document.getElementById( 'view_container' ).ondragover = onDragOver;
    document.getElementById( 'view_container' ).ondrop = onMeshDrop;
    document.getElementById( 'images' ).ondragover = onDragOver;
    document.getElementById( 'images' ).ondrop = onImageDrop;
    logElement = document.getElementById( 'log' );
    initCanvas();
    animateCanvas(Date.now());
}
function logMessage(msg) {
    console.log(msg);
    logElement.value += msg;
    logElement.value += "\n";
}
function logActionStart(action) {
    logMessage("TRACE: " + action + " started.");
    timers[action] = Date.now();
}
function logActionEnd(action) {
    var start = timers[action];
    var duration = Date.now() - start;
    logMessage("TRACE: " + action + " finished (" + duration + "ms).");
}
function onDragOver(ev) {
    //ev.stopPropagation();
    ev.preventDefault();
    //ev.dataTransfer.dropEffect = 'copy'; // Explicitly show this is a copy.
}
function onMeshDrop(ev) {
    ev.preventDefault();
    var dt    = ev.dataTransfer;
    var files = dt.files;
    if (files.length == 0) {
        logMessage("ERROR: You did not drop a file. Try dragging and dropping a file instead.");
        return;
    }
    if (files.length > 1) {
        logMessage("ERROR: You dropped multiple files. Please only drop a single file.");
        return;
    }
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
function onFileLoaded(ev) {
    console.profile("onFileLoaded");
    var data = this.result;
    logActionEnd("File reading");
    var selectElement = document.getElementById("loader_type");
    var loader;
    switch (selectElement.selectedIndex) {
        case 0:
            loader = new THREE.ColladaLoader();
            break;
        case 1:
            loader = new ColladaLoader2();
            loader.options.imageLoadType = ColladaLoader2.loadTypeCache
            loader.addChachedTextures(imageCache)
            loader.setLog(function(msg, type) {logMessage(ColladaLoader2.messageTypes[type] + ": " + msg); } );
            break;
        default:
            throw new Error("Unknown loader type");
    }
    var parser = new DOMParser();
    logActionStart("XML parsing");
    var xmlDoc = parser.parseFromString(data,"text/xml");
    logActionEnd("XML parsing");
    logActionStart("COLLADA parsing");
    loader.parse( xmlDoc, function ( collada ) {
        console.log(collada);
        logActionEnd("COLLADA parsing");
        setModel(findMesh(collada));
        console.profileEnd();
        parseProfiles();
    });
}
function parseProfiles(node, depth) {
    if (depth > 10) {
        return;
    }
    if (node===undefined) {
        var head = console.profiles[0].head;
        if (head != undefined) {
            profileData = [];
            parseProfiles(head, 0);
            var profileDataStr     = profileData.join("\n");
            document.getElementById( 'profile' ).value = profileDataStr;
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
    texture.needsUpdate = true;
    imageCache[name] = texture;
    imagesLog = document.getElementById( 'images' );
    imagesLog.value += name;
    imagesLog.value += "\n";
}
function findMesh(collada) {
    if (collada.skins && collada.skins.length == 1) {
        return collada.skins[0];
    } else if (collada.morphs && collada.morphs.length == 1) {
        return collada.morphs[0];
    } else if (collada.scene.children && collada.scene.children.length > 0) {
        for(var i=0; i<collada.scene.children.length; ++i) {
            var child = collada.scene.children[i];
            if (child.geometry) {
                return child;
            }
        }
    }
    logMessage("ERROR: File loaded, but could not find any mesh inside the collada scene.");
    return;
}
function onFileError(ev) {
    logMessage("ERROR: Can not read the file. Most likely, reading of files is disabled in your browser for security reasons. Error code: " + this.error.code);
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

    // Light
    scene.add( new THREE.AmbientLight( 0x303030 ) );
    light = new THREE.PointLight( 0xeeeeee );
    light.position.set( 5, 2, 3 );
    scene.add( light );

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

    // Renderer
    renderer = new THREE.WebGLRenderer( { antialias: true } );
    renderer.setSize( container.clientWidth, container.clientHeight );

    container.appendChild( renderer.domElement );
    logActionEnd("WebGL initialization");
}
function updateAnimation(timestamp) {
    if (!model) return;
    if (!model.morphTargetInfluences) return;
    
    var morphTargets = model.morphTargetInfluences.length;
    var frameTime = ( timestamp - lastTimestamp ) * 0.001; // seconds

    for ( var i = 0; i < morphTargets; i++ ) {
        model.morphTargetInfluences[ i ] = 0;
    }

    progress_l = Math.floor( progress );
    progress_h = progress_l + 1;
    progress_f = progress - progress_l;
    
    model.morphTargetInfluences[ progress_l % morphTargets] = 1 - progress_f;
    model.morphTargetInfluences[ progress_h % morphTargets] = progress_f;

    progress += frameTime * keyframesPerSecond;

    var maxProgress = morphTargets;
    while (progress >= maxProgress) {
        progress -= maxProgress;
    }
    
    lastTimestamp = timestamp;
}
function setModel(m) {
    if (model) {
        scene.remove( model );
        model = null;
    }
    if (m) {
        var statisticsElement = document.getElementById("statistics");
        statisticsElement.value = "";
        var vertexCount = m.geometry.vertices.length;
        var faceCount = m.geometry.faces.length;
        statisticsElement.value += "Size:\n"
        statisticsElement.value += "Radius="+m.geometry.boundingSphere.radius.toFixed(3)+"\n";
        statisticsElement.value += "\n";
        statisticsElement.value += "Vertices:\n"
        statisticsElement.value += "N="+vertexCount+"\n";
        statisticsElement.value += "\n";
        statisticsElement.value += "Faces:\n"
        statisticsElement.value += "N="+faceCount+"\n";
        statisticsElement.value += "\n";
        
        
        if (m.geometry.morphTargets && m.geometry.morphTargets.length > 0) {
            model = new THREE.MorphAnimMesh(m.geometry, m.material);
            var keyframeCount = m.geometry.morphTargets.length;
            keyframesPerSecond = keyframeCount > 1 ? keyframeCount / 10 : 1;
            statisticsElement.value += "Animations:\n"
            statisticsElement.value += "Type: morph\n";
            statisticsElement.value += "Keyframes: "+keyframeCount+"\n";
            statisticsElement.value += "Frames/sec: "+keyframesPerSecond+"\n";
            statisticsElement.value += "\n";
        } else {
            model = new THREE.Mesh(m.geometry, m.material);
            statisticsElement.value += "Animations:\n"
            statisticsElement.value += "none";
            statisticsElement.value += "\n";
        }
        console.log( model );
        scene.add( model );

        var r = model.boundRadius;
        if (r < 0.001) r = 1.0;
        camera.position.set( -7.0*r, 3.0*r, 5.0*r );
        camera.lookAt( new THREE.Vector3( 0, 0, 0 ) );
        light.position.set( -7.0*r, 3.0*r, 5.0*r );
        gridLines.scale.x = 0.2*r;
        gridLines.scale.y = 0.2*r;
        gridLines.scale.z = 0.2*r;

        lastTimestamp = Date.now();
        progress = 0;
    }
}
function animateCanvas(timestamp) {
    controls.update();
    updateAnimation(timestamp);
    renderer.render( scene, camera );
    requestAnimationFrame( animateCanvas );
}