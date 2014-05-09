var elements = {};
var loader_objects = {};
var gl_objects = {
    extensions: {},
    attribs: {},
    uniforms: {},
    geometries: [],
    matrices: {},
    camera: {},
    shader: null
};
var gl = null;
var time = 0;
var last_timestamp = null;

function writeProgress(msg) {
    elements.log_progress.textContent += msg + "\n";
    console.log(msg);
}

function clearInput() {
    elements.input.textContent = "";
    clearOutput();
}

function clearOutput() {
    clearBuffers();
    elements.log_loader.textContent = "";
    elements.log_converter.textContent = "";
    elements.log_exporter.textContent = "";
    elements.output.textContent = "";
}

function onFileDrag(ev) {
    ev.preventDefault();
}

function onFileDrop(ev) {
    clearInput();
    writeProgress("Something dropped.");
    ev.preventDefault();
    var dt = ev.dataTransfer;
    var files = dt.files;
    if (files.length == 0) {
        writeProgress("You did not drop a file. Try dragging and dropping a file instead.");
        return;
    }
    if (files.length > 1) {
        writeProgress("You dropped multiple files. Please only drop a single file.");
        return;
    }
    var file = files[0];
    var reader = new FileReader();
    reader.onload = onFileLoaded;
    reader.onerror = onFileError;
    writeProgress("Reading dropped file...");
    reader.readAsText(file);
}

function onFileError() {
    writeProgress("Error reading file.");
}

function onFileLoaded(ev) {
    writeProgress("File reading finished.");
    var data = this.result;
    elements.input.textContent = data;
}

function onConvertClick() {
    clearOutput();

    // Input
    var input = elements.input.textContent;

    // Parse
    writeProgress("Starting XML parsing.");
    var parseStart = performance.now();
    var xmlDoc = loader_objects.parser.parseFromString(input, "text/xml");
    var parseEnd = performance.now();
    writeProgress("Finished XML parsing (" + (parseEnd - parseStart).toFixed(2) + "ms).");

    // Load
    writeProgress("Starting COLLADA parsing.");
    var loadStart = performance.now();
    var loadData = loader_objects.loader.loadFromXML("id", xmlDoc);
    var loadEnd = performance.now();
    writeProgress("Finished COLLADA parsing (" + (loadEnd - loadStart).toFixed(2) + "ms).");
    console.log(loadData);

    // Convert
    writeProgress("Starting COLLADA conversion.");
    var convertStart = performance.now();
    var convertData = loader_objects.converter.convert(loadData);
    var convertEnd = performance.now();
    writeProgress("Finished COLLADA conversion (" + (convertEnd - convertStart).toFixed(2) + "ms).");
    console.log(convertData);

    // Export
    writeProgress("Starting COLLADA export.");
    var exportStart = performance.now();
    var exportData = loader_objects.exporter.export(convertData);
    var exportEnd = performance.now();
    writeProgress("Finished COLLADA export (" + (exportEnd - exportStart).toFixed(2) + "ms).");
    console.log(exportData);

    // Output
    elements.output.textContent = JSON.stringify(exportData.json, null, 2);
    fillBuffers(exportData.json, exportData.data);
    tick(null);
}

function onColladaProgress(id, loaded, total) {
    writeLog("Collada loading progress", "progress");
}

function init() {
    // Find elements
    elements.input = document.getElementById("input");
    elements.log_progress = document.getElementById("log_progress");
    elements.log_loader = document.getElementById("log_loader");
    elements.log_converter = document.getElementById("log_converter");
    elements.log_exporter = document.getElementById("log_exporter");
    elements.output = document.getElementById("output");
    elements.convert = document.getElementById("convert");
    elements.canvas = document.getElementById("canvas");

    // Create COLLADA converter chain
    loader_objects.parser = new DOMParser();
    loader_objects.loader = new ColladaLoader();
    loader_objects.loader.log = new ColladaLogTextArea(elements.log_loader);
    loader_objects.converter = new ColladaConverter();
    loader_objects.converter.log = new ColladaLogTextArea(elements.log_converter);
    loader_objects.exporter = new ColladaExporter();
    loader_objects.exporter.log = new ColladaLogTextArea(elements.log_exporter);

    // Initialize WebGL
    initGL();

    // Register events
    elements.input.ondragover = onFileDrag;
    elements.input.ondrop = onFileDrop;
    elements.convert.onclick = onConvertClick;

    // Animation
    tick(null);
}


function initGL(canvas) {
    // Get context
    try {
        gl = elements.canvas.getContext("webgl");
        gl.viewportWidth = elements.canvas.width;
        gl.viewportHeight = elements.canvas.height;
    } catch (e) {
    }

    if (!gl) {
        alert("Could not initialise WebGL, sorry :-(");
        return;
    }

    console.log("WebGL extensions: "+ gl.getSupportedExtensions().join(", "))

    // Extensions
    gl_objects.extensions.vertex_array_object = gl.getExtension('OES_vertex_array_object');
    gl_objects.extensions.element_index_uint = gl.getExtension('OES_element_index_uint');

    // Background color
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.enable(gl.DEPTH_TEST);
    gl.disable(gl.CULL_FACE);

    // Other resources
    initShaders();
    initMatrices();
    clearBuffers();
}

function getShaderSource(id) {
    var shaderScript = document.getElementById(id);
    if (!shaderScript) {
        return null;
    }

    var str = "";
    var k = shaderScript.firstChild;
    while (k) {
        if (k.nodeType == 3) {
            str += k.textContent;
        }
        k = k.nextSibling;
    }

    return str;
}

function getShader(str, type) {

    var shader = gl.createShader(type);

    gl.shaderSource(shader, str);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        alert(gl.getShaderInfoLog(shader));
        return null;
    }

    return shader;
}

function initShaders() {
    var fragmentShader = getShader(getShaderSource("shader-fs"), gl.FRAGMENT_SHADER);
    var vertexShader = getShader(getShaderSource("shader-vs"), gl.VERTEX_SHADER);

    var shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);
    gl.linkProgram(shaderProgram);

    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
        alert("Could not initialise shaders");
    }

    gl.useProgram(shaderProgram);

    gl_objects.attribs.position = gl.getAttribLocation(shaderProgram, "va_position");
    gl.enableVertexAttribArray(gl_objects.attribs.position);

    gl_objects.attribs.normal = gl.getAttribLocation(shaderProgram, "va_normal");
    gl.enableVertexAttribArray(gl_objects.attribs.normal);

    gl_objects.attribs.texcoord = gl.getAttribLocation(shaderProgram, "va_texcoord");
    gl.enableVertexAttribArray(gl_objects.attribs.texcoord);

    gl_objects.uniforms.projection_matrix = gl.getUniformLocation(shaderProgram, "u_projection_matrix");
    gl_objects.uniforms.modelview_matrix = gl.getUniformLocation(shaderProgram, "u_modelview_matrix");
    gl_objects.uniforms.normal_matrix = gl.getUniformLocation(shaderProgram, "u_normal_matrix");
    
    gl_objects.uniforms.ambient_color = gl.getUniformLocation(shaderProgram, "u_ambient_color");
    gl_objects.uniforms.light_direction = gl.getUniformLocation(shaderProgram, "u_light_direction");
    gl_objects.uniforms.light_color = gl.getUniformLocation(shaderProgram, "u_light_color");

    gl_objects.shader = shaderProgram;
}

function initMatrices() {
    gl_objects.matrices.modelview = mat4.create();
    gl_objects.matrices.projection = mat4.create();
    gl_objects.matrices.normal = mat3.create();

    gl_objects.camera.up = vec3.fromValues(0, 0, 1);
    gl_objects.camera.eye = vec3.fromValues(2, -10, 1);
    gl_objects.camera.center = vec3.fromValues(0, 0, 0);
}

function setUniforms() {
    // Matrices
    var matrices = gl_objects.matrices;
    gl.uniformMatrix4fv(gl_objects.uniforms.projection_matrix, false, matrices.projection);
    gl.uniformMatrix4fv(gl_objects.uniforms.modelview_matrix, false, matrices.modelview);

    mat3.fromMat4(matrices.normal, matrices.modelview);
    mat3.invert(matrices.normal, matrices.normal);
    mat3.transpose(matrices.normal, matrices.normal);
    gl.uniformMatrix3fv(gl_objects.uniforms.normal_matrix, false, matrices.normal);

    // Lighting
    gl.uniform3f(gl_objects.uniforms.ambient_color, 0.2, 0.2, 0.2);
    gl.uniform3f(gl_objects.uniforms.light_direction, 1, 1, 1);
    gl.uniform3f(gl_objects.uniforms.light_color, 1, 1, 1);
}

function clearBuffers() {
    gl_objects.geometries = [];
}

function fillBuffers(json, data) {
    for (var i = 0; i < json.geometries.length; ++i) {
        var json_geometry = json.geometries[i];

        var geometry = {};
        geometry.triangle_count = json_geometry.triangle_count;
        geometry.vertex_count = json_geometry.vertex_count;

        // Data views
        var data_position = new Float32Array(data, json_geometry.position.byte_offset, geometry.vertex_count * 3);
        var data_normal = new Float32Array(data, json_geometry.normal.byte_offset, geometry.vertex_count * 3);
        var data_texcoord = new Float32Array(data, json_geometry.texcoord.byte_offset, geometry.vertex_count * 2);
        var data_indices = new Uint32Array(data, json_geometry.indices.byte_offset, geometry.triangle_count * 3);

        // Create, fill, and link buffers
        geometry.position = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, geometry.position);
        gl.bufferData(gl.ARRAY_BUFFER, data_position, gl.STATIC_DRAW);

        geometry.normal = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, geometry.normal);
        gl.bufferData(gl.ARRAY_BUFFER, data_normal, gl.STATIC_DRAW);

        geometry.texcoord = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, geometry.texcoord);
        gl.bufferData(gl.ARRAY_BUFFER, data_texcoord, gl.STATIC_DRAW);

        geometry.indices = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, geometry.indices);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, data_indices, gl.STATIC_DRAW);

        gl_objects.geometries.push(geometry)
    }
}

function drawScene() {
    gl.viewportWidth = elements.canvas.width;
    gl.viewportHeight = elements.canvas.height;

    gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    mat4.perspective(gl_objects.matrices.projection, 45, gl.viewportWidth / gl.viewportHeight, 0.1, 100.0);
    mat4.lookAt(gl_objects.matrices.modelview, gl_objects.camera.eye, gl_objects.camera.center, gl_objects.camera.up);

    setUniforms();
    for(var i=0; i<gl_objects.geometries.length; ++i) {
        var geometry = gl_objects.geometries[i];

        gl.bindBuffer(gl.ARRAY_BUFFER, geometry.position);
        gl.vertexAttribPointer(gl_objects.attribs.position, 3, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ARRAY_BUFFER, geometry.normal);
        gl.vertexAttribPointer(gl_objects.attribs.normal, 3, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ARRAY_BUFFER, geometry.texcoord);
        gl.vertexAttribPointer(gl_objects.attribs.texcoord, 2, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, geometry.indices);
        gl.drawElements(gl.TRIANGLES, geometry.triangle_count * 3, gl.UNSIGNED_INT, 0);
    }
}

function animate(delta_time) {
    time += delta_time / (1000);

    var r = 10;
    var x = r * Math.sin(time);
    var y = r * Math.cos(time);
    var z = r/2 * Math.sin(time / 5);
    vec3.set(gl_objects.camera.eye, x, y, z);
}

function tick(timestamp) {
    if (last_timestamp === null) last_timestamp = timestamp;
    var delta_time = timestamp - last_timestamp;
    last_timestamp = timestamp;

    if (gl_objects.geometries.length > 0) {
        requestAnimationFrame(tick);
    }
    drawScene();
    animate(delta_time);
}