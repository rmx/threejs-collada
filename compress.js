var CACCanvases = [];
var CACModels = new Array(2);
function CACConvert() {
    var inputStr = CACGetInputString();
    var keyframeMap = CACGetKeyframeMap();
    var outputStr = CACCompressDocument(inputStr, keyframeMap.keyframes);

    CACSetOutputString(outputStr);
    CACSetOutputKeyframes(keyframeMap.animNames);
}
function CACGetKeyframeMap() {
    var keyframesElement = $("#keyframes");
    var keyframes_str = keyframesElement.val().trim();
    var animNames = {};
    var currentFrame = 0;
    
    // Parse the user string to determine which keyframes to keep
    var keyframe_indices = [];
    var pattern = /(\d+)\s*-\s*(\d+)\s*@\s*(\d+)\s*(\w*)/
    keyframes_str.split("\n").forEach(function(val) {
        var keyframe_str = val.trim();
        if (pattern.test(keyframe_str)) {
            var match = pattern.exec(keyframe_str);
            
            var firstframe = Number(match[1]);
            var lastframe = Number(match[2]);
            var sampleCountRequested = Number(match[3]);
            var animName = match[4];
            
            var samples = CACSampleRange(firstframe, lastframe, sampleCountRequested);
            var sampleCount = samples.length;
            
            animNames[animName] = {offset:currentFrame, count:sampleCount, duration: 0};
            currentFrame += sampleCount;
            
            keyframe_indices = keyframe_indices.concat(samples);
        }
    });

    // Create a new array, filled with false values
    var max_index = -1;
    keyframe_indices.forEach(function(val) { if (val > max_index) max_index = val; });
    var keyframes = new Array(max_index + 1);
    for(var i=0; i<max_index; i++) {
        keyframes[i] = false;
    }
    
    // Set the requested keyframe indices to true
    keyframe_indices.forEach(function(val) { keyframes[val] = true; });
    return { keyframes:keyframes, animNames:animNames };
}
function CACSampleRange(xmin, xmax, samples) {
    if (samples <= 0)
    {
        return [];
    }
    var range = xmax - xmin;
    var dx = range / samples;
    var x = xmin;
    var result = [];
    for (var i=xmin; i<xmax; i++) {
        if (i >= x) {
            result.push(i);
            while (i >= x) {
                x += dx;
            }
        }
    }
    var forceLastKeyFrame = false;
    if (forceLastKeyFrame) {
        if (result[result.length - 1] != xmax) {
            result.push(xmax);
        }
    }
    return result;
}
function CACGetInputString() {
    var inputElement = $("#input");
    return inputElement.val();
}
function CACGetSizeString(size) {
    var K = 1024;
    var M = 1024*1024;
    var G = 1024*1024*1024;
    
    if (size < K) {
        return "" + size + " B";
    } else if (size < M) {
        return "" + (size / K).toFixed(2) + " KiB";
    } else if (size < G) {
        return "" + (size / M).toFixed(2) + " MiB";
    } else {
        return "" + size.toExponential() + " Bytes";
    }
}
function CACSetInputString(str) {
    var inputElement = $("#input")
    inputElement.text(str);
    
    var sizeInput = document.getElementById( 'input_size' );
    sizeInput.value = CACGetSizeString(str.length);
    
    var downloadInput = document.getElementById( 'input_download' );
    downloadInput.href = "data:text/xml;charset=utf-8," + str;
    
    CACLoadMesh(str, CACCanvases[0]);
}
function CACSetOutputString(str) {
    var outputElement = $("#output")
    var xmlPreface = "<?xml version=\"1.0\" encoding=\"utf-8\"?>";
    var str2 = xmlPreface + str;
    outputElement.text(str);
    
    var sizeOutput = document.getElementById( 'output_size' );
    sizeOutput.value = CACGetSizeString(str2.length);
    
    var downloadOutput = document.getElementById( 'output_download' );
    downloadOutput.href = "data:text/xml;charset=utf-8," + str;
    
    CACLoadMesh(str, CACCanvases[1]);
}
function CACSetOutputKeyframes(animNames) {
    var outputKeyframes = document.getElementById( 'output_keyframes' );
    
    keyframesPerSecond = CACCanvases[1].getKps();
    Object.keys(animNames).forEach(function(key) {
        animNames[key].duration = animNames[key].count / keyframesPerSecond;
    })
    
    outputKeyframes.value = JSON.stringify(animNames);
}
function CACCompressDocument(inputStr, keyframes) {
    var xmlDoc = CACStringToXmlDoc(inputStr);
    var xml = $(xmlDoc);
    
    var elem_collada = xml.find("COLLADA");
    console.log("Number of COLLADA nodes: " + elem_collada.length);
    var elem_lib = elem_collada.find("library_animations");
    console.log("Number of library_animation nodes: " + elem_lib.length);
    var elem_anim = elem_lib.find("animation");
    console.log("Number of animation nodes: " + elem_anim.length);
    var elem_source = elem_anim.find("source");
    console.log("Number of source nodes: " + elem_source.length);

    elem_source.each(function() { CACCompressElement($(this), keyframes); });
    
    var serializer = new XMLSerializer();
    return serializer.serializeToString(xmlDoc);
}
function CACCompressElement(elem_source, keyframes) {
    var elem_accessor = elem_source.find("technique_common").find("accessor");
    var elem_array = elem_source.children().eq(0);
    
    var stride = Number(elem_accessor.attr("stride"));
    var count_in = Number(elem_accessor.attr("count"));
    
    var data_in_str = elem_array.text().trim();
    var data_in = data_in_str.split(" ");
    var data_out = [];
    
    if (data_in.length != stride*count_in) {
        throw new Error("inconsistent size");
    }
    
    var count_out = 0;
    for(var i=0; i<count_in; i++) {
        if (keyframes[i]) {
            count_out++;
            for(var j=0; j<stride; j++) {
                data_out.push(data_in[i*stride + j]);
            }
        }
    }
    
    var data_out_str = data_out.join(" ");
    
    elem_array.text(data_out_str);
    elem_array.attr("count", count_out);
    elem_accessor.attr("count", count_out);
}
function CACStringToXmlDoc(str) {
    var xmlDoc = $.parseXML(str);
    return xmlDoc;
}
function CACDragOver(ev) {
    ev.preventDefault();
}
function CACDrop(ev) {
    ev.preventDefault();
    var dt    = ev.dataTransfer;
    var files = dt.files;
    for (var i=0; i<files.length; i++) {
        var file = files[i];
        var reader = new FileReader();
        reader.onload = CACFileLoaded;
        reader.onerror = CACFileError;
        var data = reader.readAsText(file);
    }    
}
function CACFileLoaded(ev) {
    CACSetInputString(this.result);
}
function CACFileError(ev) {
    if (this.error.code != 2) {
        alert("Can not read local file. Error code: " + this.error.code);
    } else {
        alert("Can not read local file due to security reasons. Try enabling --allow-file-access-from-files for Chrome.");
    }
}
function CACSetKeyframesPerSecond() {
    var kpsInput = document.getElementById( 'input_kps' );
    var kpsOutput = document.getElementById( 'output_kps' );
    
    CACCanvases[ 0 ].setKps(parseInt(kpsInput.value));
    CACCanvases[ 1 ].setKps(parseInt(kpsOutput.value));
}
function CACInitCanvases() {
    CACCanvases = [];
    CACCanvases.push( new CACCanvas( document.getElementById( 'input_view' ) ));
    CACCanvases.push( new CACCanvas( document.getElementById( 'output_view' ) ));
    CACSetKeyframesPerSecond();
}
function CACAnimateCanvases(timestamp) {
    for ( var i = 0; i < CACCanvases.length; ++i ) {
        CACCanvases[ i ].animate(timestamp);
    }
    requestAnimationFrame( CACAnimateCanvases );
}
function CACCanvas(_container) {

    var container;
    var scene;
    var camera;
    var controls;
    var pointLight;
    var renderer;
    var gridLines;
    var model;
    var timestamp;
    var lastTimestamp;
    var progress;
    var keyframesPerSecond;
    
    init(_container);
    
    function init(_container) {
        container = _container;
        keyframesPerSecond = 40;
        
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
        //controls.addEventListener( 'change', render );

        // Light
        pointLight = new THREE.PointLight( 0xffffff, 0.75 );
        pointLight.position = camera.position;
        pointLight.rotation = camera.rotation;
        pointLight.scale = camera.scale;
        scene.add( pointLight );

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
        
        gridLines = new THREE.Line( geometry, material, THREE.LinePieces );
        scene.add( gridLines );
        
        // Renderer
        renderer = new THREE.WebGLRenderer( { antialias: true } );
        renderer.setSize( container.clientWidth, container.clientHeight );

        container.appendChild( renderer.domElement );
    }
    
    function updateAnimation(timestamp) {
        if (!model) return;
        
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

    this.animate = function(timestamp) {
        controls.update();
        updateAnimation(timestamp);
        render();
    };
    
    this.setModel = function(m) {
        if (model) {
            scene.remove( model );
        }
        model = m;
        if (model) {
            scene.add( model );
            lastTimestamp = Date.now();
            progress = 0;
        }
    };
    
    this.setKps = function(kps) {
        keyframesPerSecond = kps;
    }
    
    this.getKps = function(kps) {
        return keyframesPerSecond;
    }
    
    function render() {
        renderer.render( scene, camera );
    }
    
}
function CACLoadMesh(data, canvas) {
    var loader = new THREE.ColladaLoader();    
    
    var XHTTPRequestWorksWithDataUri = false;
    if (XHTTPRequestWorksWithDataUri) {
        var uri = 'data:text/xml;charset=utf-8,' + data;
        loader.load( uri, function ( collada ) { 
            canvas.setModel(collada.skins[0]);
        } );
    } else {
        var parser = new DOMParser();
        var xmlDoc = parser.parseFromString(data,"text/xml");
        loader.parse( xmlDoc, function ( collada ) {        
            canvas.setModel(collada.skins[0]);
        });
    }
}
function CACSetupEvents() {
    var compressButton = document.getElementById( 'compress' );
    var inputElement = document.getElementById( 'input' );
    var kpsInput = document.getElementById( 'input_kps' );
    var kpsOutput = document.getElementById( 'output_kps' );
    
    compressButton.onclick = CACConvert;
    inputElement.ondragover = CACDragOver;
    inputElement.ondrop = CACDrop;
    kpsInput.onchange = CACSetKeyframesPerSecond;
    kpsOutput.onchange = CACSetKeyframesPerSecond;
}
function CACSetInitialValues() {
    var str = "";
    str += "000 - 100 @ 10    idle\n";
    str += "220 - 260 @ 10    walk\n";
    str += "270 - 290 @ 10    run\n";
    str += "291 - 350 @ 10    attack1\n";
    str += "350 - 410 @ 10    attack2\n";
    str += "971 - 1045 @ 10   attack3 \n";
    str += "410 - 465 @ 10    death1\n";
    str += "1600 - 1700 @ 10  spellcast1\n";
    str += "1700 - 1900 @ 10  spellcast2\n";
    str += "1900 - 2000 @ 10  spellcast3\n";
    
    $("#keyframes").text(str);
}
function CACDocumentReady() {
    CACSetInitialValues();
    CACInitCanvases();
    CACAnimateCanvases();
    CACSetupEvents();
}
