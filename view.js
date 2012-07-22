// three.js global variables
var logElement;
var scene;
var renderer;
var camera;
var controls;
var model;
var lastTimestamp;
var keyframesPerSecond = 20;
var timers = {};

// implementation
function initApplication() {
    document.getElementById( 'view_container' ).ondragover = onDragOver;
    document.getElementById( 'view_container' ).ondrop = onDrop;
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
    ev.preventDefault();
}
function onDrop(ev) {
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
    var data = reader.readAsText(file);
}
function onFileLoaded(ev) {
    var data = this.result;
    logActionEnd("File reading");
    var loader = new THREE.ColladaLoader();    
    var parser = new DOMParser();
    logActionStart("XML parsing");
    var xmlDoc = parser.parseFromString(data,"text/xml");
    logActionEnd("XML parsing");
    logActionStart("COLLADA parsing");
    loader.parse( xmlDoc, function ( collada ) {
        logActionEnd("COLLADA parsing");
        setModel(findMesh(collada));
    });
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
    camera = new THREE.PerspectiveCamera( 20, container.clientWidth / container.clientHeight, 1, 10000 );
    camera.position.set( -7, 4, 5 );
    camera.up.set( 0, 0, 1 );
    camera.lookAt( new THREE.Vector3( 0, 0, 1.5 ) );
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
    var light = new THREE.DirectionalLight( 0xeeeeee );
    light.position.set( 5, 2, 3 );
    scene.add( light );

    // Grid
    var material = new THREE.LineBasicMaterial( { color: 0xcccccc, opacity: 0.2 } );
    var geometry = new THREE.Geometry();
    var floor = -0.04, step = 1, size = 14;

    for ( var i = 0; i <= size / step * 2; i ++ ) {
        geometry.vertices.push( new THREE.Vector3( - size, i * step - size, floor ) );
        geometry.vertices.push( new THREE.Vector3(   size, i * step - size, floor ) );
        geometry.vertices.push( new THREE.Vector3( i * step - size, -size, floor ) );
        geometry.vertices.push( new THREE.Vector3( i * step - size, size, floor ) );
    }
    
    var gridLines = new THREE.Line( geometry, material, THREE.LinePieces );
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
        var vertexCount = m.geometry.vertices.length;
        var faceCount = m.geometry.faces.length;
        logMessage("INFO: Model has " + vertexCount + " vertices and " + faceCount + " faces.");
        logMessage("INFO: Model bounding sphere radius is " + m.geometry.boundingSphere.radius.toFixed(3));
        if (m.geometry.morphTargets && m.geometry.morphTargets.length > 0) {
            model = new THREE.MorphAnimMesh(m.geometry, m.material);
            var keyframeCount = m.geometry.morphTargets.length;
            logMessage("INFO: Model has " + keyframeCount + " morph animation key frames.");
        } else {
            model = new THREE.Mesh(m.geometry, m.material);
            logMessage("INFO: Model has no animation.");
        }
        scene.add( model );
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