/// <reference path="../src/external/gl-matrix.d.ts" />

declare var glMatrix: glMatrixStatic;
declare var mat3: Mat3Static;
declare var mat4: Mat4Static;
declare var vec2: Vec2Static;
declare var vec3: Vec3Static;
declare var vec4: Vec4Static;
declare var quat: QuatStatic;

interface i_elements {
    input?: HTMLInputElement;
    log_progress?: HTMLTextAreaElement;
    log_loader?: HTMLTextAreaElement;
    log_converter?: HTMLTextAreaElement;
    log_exporter?: HTMLTextAreaElement;
    output?: HTMLTextAreaElement;
    convert?: HTMLButtonElement;
    canvas?: HTMLCanvasElement;
    download_json?: HTMLAnchorElement;
    download_data?: HTMLAnchorElement;
    mesh_parts_checkboxes?: HTMLInputElement[];
    mesh_parts_labels?: HTMLLabelElement[];
};
var elements: i_elements = {};

interface i_loader_objects {
    parser?: DOMParser;
    loader?: ColladaLoader;
    converter?: ColladaConverter;
    exporter?: ColladaExporter;
};
var loader_objects: i_loader_objects = {};

var gl_objects = {
    extensions: {
        vao: null,
        euint: null
    },
    geometries: [],
    animation: null,
    tracks: [],
    bones: [],
    bone_matrices: null,
    matrices: {
        modelview: null,
        projection: null,
        normal: null
    },
    camera: {
        radius: null,
        eye: null,
        center: null,
        up: null
    },
    shader: {
        program: null,
        vao: null,
        uniforms: {},
        attribs: {
            position: null,
            normal: null,
            texcoord: null,
        }
    },
    skin_shader: {
        program: null,
        vao: null,
        uniforms: {},
        attribs: {
            position: null,
            normal: null,
            texcoord: null,
            boneweight: null,
            boneindex: null
        }
    },
};
var timestamps: {[name: string]:number} = {};
var input_data: string = "";
var gl: WebGLRenderingContext = null;
var gl_vao = null;
var time: number = 0;
var last_timestamp: number = null;

function writeProgress(msg) {
    elements.log_progress.textContent += msg + "\n";
    console.log(msg);
}

function timeStart(name: string) {
    timestamps[name] = performance.now();
}

function timeEnd(name: string) {
    var endTime = performance.now();
    var startTime = timestamps[name];
    writeProgress(name + " finished (" + (endTime - startTime).toFixed(2) + "ms)"); 
}

function clearInput() {
    elements.input.textContent = "";
    clearOutput();
}

function clearOutput() {
    clearBuffers();
    resetCheckboxes([]);
    elements.log_progress.textContent = "";
    elements.log_loader.textContent = "";
    elements.log_converter.textContent = "";
    elements.log_exporter.textContent = "";
    elements.output.textContent = "";
    elements.download_json.textContent = "No file converted";
    elements.download_json.href = "javascript:void(0)";
    elements.download_data.textContent = "No file converted";
    elements.download_data.href = "javascript:void(0)";
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
    timeStart("Reading file");
    reader.readAsText(file);
}

function onFileError() {
    writeProgress("Error reading file.");
}

function onFileLoaded(ev) {
    timeEnd("Reading file");
    var data = this.result;
    input_data = data;
    elements.input.textContent = "COLLADA loaded (" + (data.length/1024).toFixed(1) + " kB)";
}

function onConvertClick() {
    clearOutput();

    // Input
    var input = input_data;

    // Parse
    timeStart("XML parsing");
    var xmlDoc = loader_objects.parser.parseFromString(input, "text/xml");
    timeEnd("XML parsing");

    // Load
    timeStart("COLLADA parsing");
    var loadData = loader_objects.loader.loadFromXML("id", xmlDoc);
    timeEnd("COLLADA parsing");
    // console.log(loadData);

    // Convert
    timeStart("COLLADA conversion");
    var convertData = loader_objects.converter.convert(loadData);
    timeEnd("COLLADA conversion");
    //console.log(convertData);

    // Export
    timeStart("COLLADA export");
    var exportData = loader_objects.exporter.export(convertData);
    timeEnd("COLLADA export");
    // console.log(exportData);

    // Download links
    elements.download_json.href = ColladaExporterUtils.jsonToDataURI(exportData.json);
    elements.download_json.textContent = "Download (" + (JSON.stringify(exportData.json).length / 1024).toFixed(1) + " kB)";
    elements.download_data.href = ColladaExporterUtils.bufferToBlobURI(exportData.data);
    elements.download_data.textContent = "Download (" + (exportData.data.length / 1024).toFixed(1) + " kB)";

    // Output
    elements.output.textContent = JSON.stringify(exportData.json, null, 2);
    resetCheckboxes(exportData.json.geometries);

    // Start rendering
    timeStart("WebGL loading");
    fillBuffers(exportData.json, exportData.data.buffer);
    setupCamera(exportData.json);
    timeEnd("WebGL loading");

    timeStart("WebGL rendering");
    tick(null);
    timeEnd("WebGL rendering");
}

function onColladaProgress(id, loaded, total) {
    writeProgress("Collada loading progress");
}

function init() {
    // Find elements
    elements.input = <HTMLInputElement> document.getElementById("input");
    elements.log_progress = <HTMLTextAreaElement> document.getElementById("log_progress");
    elements.log_loader = <HTMLTextAreaElement> document.getElementById("log_loader");
    elements.log_converter = <HTMLTextAreaElement> document.getElementById("log_converter");
    elements.log_exporter = <HTMLTextAreaElement> document.getElementById("log_exporter");
    elements.output = <HTMLTextAreaElement> document.getElementById("output");
    elements.convert = <HTMLButtonElement> document.getElementById("convert");
    elements.canvas = <HTMLCanvasElement> document.getElementById("canvas");
    elements.download_json = <HTMLAnchorElement> document.getElementById("download_json");
    elements.download_data = <HTMLAnchorElement> document.getElementById("download_data");
    elements.mesh_parts_checkboxes = [];
    elements.mesh_parts_labels = [];
    for (var i: number = 0; i < 18; ++i) {
        var id: string = "part_" + ("0" + (i+1)).slice(-2);
        elements.mesh_parts_checkboxes[i] = <HTMLInputElement> document.getElementById(id);
        elements.mesh_parts_labels[i] = <HTMLLabelElement> document.getElementById(id + "_label");
    }

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

    //
    clearOutput();
}

function resetCheckboxes(geometries: any[]) {
    for (var i: number = 0; i < elements.mesh_parts_checkboxes.length; ++i) {
        var checkbox: HTMLInputElement = elements.mesh_parts_checkboxes[i];
        var label: HTMLLabelElement = elements.mesh_parts_labels[i];
        checkbox.checked = true;
        if (geometries.length <= i) {
            checkbox.style.setProperty("display", "none");
            label.style.setProperty("display", "none");
        } else {
            checkbox.style.removeProperty("display");
            label.style.removeProperty("display");
            label.textContent = geometries[i].name;
        }
    }
}


function initGL() {
    // Get context
    try {
        gl = elements.canvas.getContext("webgl");
    } catch (e) {
    }

    if (!gl) {
        alert("Could not initialise WebGL, sorry :-(");
        return;
    }

    console.log("WebGL extensions: "+ gl.getSupportedExtensions().join(", "))

    // Extensions
    gl_objects.extensions.vao = gl.getExtension('OES_vertex_array_object');
    gl_objects.extensions.euint = gl.getExtension('OES_element_index_uint');
    gl_vao = gl_objects.extensions.vao;

    // Background color
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.enable(gl.DEPTH_TEST);
    gl.disable(gl.CULL_FACE);

    // Other resources
    initShader(gl_objects.shader, "shader-vs", "shader-fs");
    initShader(gl_objects.skin_shader, "shader-skinning-vs", "shader-fs");
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

function initShader(shader, vs_name, fs_name) {
    var fragmentShader = getShader(getShaderSource(fs_name), gl.FRAGMENT_SHADER);
    var vertexShader = getShader(getShaderSource(vs_name), gl.VERTEX_SHADER);

    shader.program = gl.createProgram();

    gl.attachShader(shader.program, vertexShader);
    gl.attachShader(shader.program, fragmentShader);
    gl.linkProgram(shader.program);

    if (!gl.getProgramParameter(shader.program, gl.LINK_STATUS)) {
        alert("Could not initialise shaders");
    }

    gl.useProgram(shader.program);

    shader.attribs.position = gl.getAttribLocation(shader.program, "va_position");
    shader.attribs.normal = gl.getAttribLocation(shader.program, "va_normal");
    shader.attribs.texcoord = gl.getAttribLocation(shader.program, "va_texcoord");
    shader.attribs.boneweight = gl.getAttribLocation(shader.program, "va_boneweight");
    shader.attribs.boneindex = gl.getAttribLocation(shader.program, "va_boneindex");

    shader.uniforms.projection_matrix = gl.getUniformLocation(shader.program, "u_projection_matrix");
    shader.uniforms.modelview_matrix = gl.getUniformLocation(shader.program, "u_modelview_matrix");
    shader.uniforms.normal_matrix = gl.getUniformLocation(shader.program, "u_normal_matrix");
    shader.uniforms.ambient_color = gl.getUniformLocation(shader.program, "u_ambient_color");
    shader.uniforms.light_direction = gl.getUniformLocation(shader.program, "u_light_direction");
    shader.uniforms.light_color = gl.getUniformLocation(shader.program, "u_light_color");
    shader.uniforms.bind_shape_matrix = gl.getUniformLocation(shader.program, "u_bind_shape_matrix");
    shader.uniforms.bone_matrix = gl.getUniformLocation(shader.program, "u_bone_matrix");

    gl.useProgram(null);
}

function initMatrices() {
    gl_objects.matrices.modelview = mat4.create();
    gl_objects.matrices.projection = mat4.create();
    gl_objects.matrices.normal = mat3.create();

    gl_objects.camera.up = vec3.fromValues(0, 0, 1);
    gl_objects.camera.eye = vec3.fromValues(2, -10, 1);
    gl_objects.camera.center = vec3.fromValues(0, 0, 0);
}

function setupCamera(json) {
    var bmin = vec3.clone(json.info.bbox_min);
    var bmax = vec3.clone(json.info.bbox_max);
    var diag = vec3.create();
    vec3.subtract(diag, bmax, bmin);
    gl_objects.camera.up = vec3.fromValues(0, 0, 1);
    gl_objects.camera.radius = 1.0 * vec3.length(diag);
    vec3.scaleAndAdd(gl_objects.camera.center, bmin, diag, 0.5);
}

function setUniforms(shader) {
    // Matrices
    var matrices = gl_objects.matrices;
    gl.uniformMatrix4fv(shader.uniforms.projection_matrix, false, matrices.projection);
    gl.uniformMatrix4fv(shader.uniforms.modelview_matrix, false, matrices.modelview);

    mat3.fromMat4(matrices.normal, matrices.modelview);
    mat3.invert(matrices.normal, matrices.normal);
    mat3.transpose(matrices.normal, matrices.normal);
    gl.uniformMatrix3fv(shader.uniforms.normal_matrix, false, matrices.normal);

    // Bone matrices
    if (shader.uniforms.bone_matrix) {
        gl.uniformMatrix4fv(shader.uniforms.bone_matrix, false, gl_objects.bone_matrices);
    }

    // Lighting
    gl.uniform3f(shader.uniforms.ambient_color, 0.2, 0.2, 0.2);
    gl.uniform3f(shader.uniforms.light_direction, 0.57735, 0.57735, 0.57735);
    gl.uniform3f(shader.uniforms.light_color, 0.8, 0.8, 0.8);
}

function setChunkUniforms(shader, geometry) {
    if (geometry.bind_shape_matrix && shader.uniforms.bind_shape_matrix) {
        gl.uniformMatrix4fv(shader.uniforms.bind_shape_matrix, false, geometry.bind_shape_matrix);
    }
}

function clearBuffers() {
    gl_objects.animation = null;
    gl_objects.tracks = [];
    gl_objects.geometries = [];
    gl_objects.bones = [];
    gl_objects.bone_matrices = null;
}

function fillBuffers(json, data) {
    var shader: any = (json.bones.length > 0) ? gl_objects.skin_shader : gl_objects.shader;

    for (var i = 0; i < json.geometries.length; ++i) {
        var json_geometry: any = json.geometries[i];

        var geometry: any = {};
        geometry.name = json_geometry.name;
        geometry.triangle_count = json_geometry.triangle_count;
        geometry.vertex_count = json_geometry.vertex_count;
        if (json_geometry.bind_shape_mat) {
            geometry.bind_shape_matrix = mat4.clone(json_geometry.bind_shape_mat);
        }

        // Data views
        var data_position = new Float32Array(data, json_geometry.position.byte_offset, geometry.vertex_count * 3);
        var data_normal = new Float32Array(data, json_geometry.normal.byte_offset, geometry.vertex_count * 3);
        var data_texcoord = new Float32Array(data, json_geometry.texcoord.byte_offset, geometry.vertex_count * 2);
        var data_indices = new Uint32Array(data, json_geometry.indices.byte_offset, geometry.triangle_count * 3);

        geometry.vao = gl_vao.createVertexArrayOES();
        gl_vao.bindVertexArrayOES(geometry.vao);

        // Create, fill, and link buffers
        geometry.position = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, geometry.position);
        gl.bufferData(gl.ARRAY_BUFFER, data_position, gl.STATIC_DRAW);
        if (shader.attribs.position >= 0) {
            gl.vertexAttribPointer(shader.attribs.position, 3, gl.FLOAT, false, 0, 0);
            gl.enableVertexAttribArray(shader.attribs.position);
        }

        geometry.normal = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, geometry.normal);
        gl.bufferData(gl.ARRAY_BUFFER, data_normal, gl.STATIC_DRAW);
        if (shader.attribs.normal >= 0) {
            gl.vertexAttribPointer(shader.attribs.normal, 3, gl.FLOAT, false, 0, 0);
            gl.enableVertexAttribArray(shader.attribs.normal);
        }

        geometry.texcoord = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, geometry.texcoord);
        gl.bufferData(gl.ARRAY_BUFFER, data_texcoord, gl.STATIC_DRAW);
        if (shader.attribs.texcoord >= 0) {
            gl.vertexAttribPointer(shader.attribs.texcoord, 2, gl.FLOAT, false, 0, 0);
            gl.enableVertexAttribArray(shader.attribs.texcoord);
        }

        if (json_geometry.boneweight) {
            var data_boneweight = new Float32Array(data, json_geometry.boneweight.byte_offset, geometry.vertex_count * 4);

            geometry.boneweight = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, geometry.boneweight);
            gl.bufferData(gl.ARRAY_BUFFER, data_boneweight, gl.STATIC_DRAW);
            gl.vertexAttribPointer(shader.attribs.boneweight, 4, gl.FLOAT, false, 0, 0);
            gl.enableVertexAttribArray(shader.attribs.boneweight);
        }

        if (json_geometry.boneindex) {
            var data_boneindex = new Uint8Array(data, json_geometry.boneindex.byte_offset, geometry.vertex_count * 4);

            geometry.boneindex = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, geometry.boneindex);
            gl.bufferData(gl.ARRAY_BUFFER, data_boneindex, gl.STATIC_DRAW);
            gl.vertexAttribPointer(shader.attribs.boneindex, 4, gl.UNSIGNED_BYTE, false, 0, 0);
            gl.enableVertexAttribArray(shader.attribs.boneindex);
        }

        geometry.indices = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, geometry.indices);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, data_indices, gl.STATIC_DRAW);

        gl_vao.bindVertexArrayOES(null);

        gl_objects.geometries.push(geometry)
    }

    if (json.bones.length > 0 && json.animations.length > 0) {
        gl_objects.animation = json.animations[0];
        gl_objects.bones = json.bones;
        var maxbones = 100;
        gl_objects.bone_matrices = new Float32Array(16 * maxbones);
        gl_objects.tracks = [];
        for (var i = 0; i < json.animations[0].tracks.length; ++i) {
            var json_track = json.animations[0].tracks[i];
            var track: any = {};
            if (json_track.pos) {
                track.pos = new Float32Array(data, json_track.pos.byte_offset, json_track.pos.count * 3);
            }
            if (json_track.rot) {
                track.rot = new Float32Array(data, json_track.rot.byte_offset, json_track.rot.count * 4);
            }
            if (json_track.scl) {
                track.scl = new Float32Array(data, json_track.scl.byte_offset, json_track.scl.count * 3);
            }
            gl_objects.tracks.push(track);
        }
    }
}

function drawScene() {

    // Recompute view matrices
    var viewportWidth: number = elements.canvas.width;
    var viewportHeight: number = elements.canvas.height;

    gl.viewport(0, 0, viewportWidth, viewportHeight);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    mat4.perspective(gl_objects.matrices.projection, 45, viewportWidth / viewportHeight, 0.1, 1000.0);
    mat4.lookAt(gl_objects.matrices.modelview, gl_objects.camera.eye, gl_objects.camera.center, gl_objects.camera.up);

    // Set the shader
    if (gl_objects.bones.length > 0) {
        gl.useProgram(gl_objects.skin_shader.program);
        setUniforms(gl_objects.skin_shader);
    } else {
        gl.useProgram(gl_objects.shader.program);
        setUniforms(gl_objects.shader);
    }

    // Render all VOAs
    for (var i = 0; i < gl_objects.geometries.length; ++i) {
        if (elements.mesh_parts_checkboxes[i] && !elements.mesh_parts_checkboxes[i].checked) {
            continue;
        }

        var geometry = gl_objects.geometries[i];
        setChunkUniforms(gl_objects.skin_shader, geometry);
        gl_vao.bindVertexArrayOES(geometry.vao);
        gl.drawElements(gl.TRIANGLES, geometry.triangle_count * 3, gl.UNSIGNED_INT, 0);
    }
    gl_vao.bindVertexArrayOES(null);
}

function animate(delta_time) {
    time += delta_time / (1000);

    var rotation_speed = 0.5;
    var r = 1.5 * gl_objects.camera.radius || 10;
    var x = r * Math.sin(rotation_speed * time) + gl_objects.camera.center[0];
    var y = r * Math.cos(rotation_speed * time) + gl_objects.camera.center[1];
    //var z = r / 2 * Math.sin(time / 5) + gl_objects.camera.center[2];
    var z = r / 2 + gl_objects.camera.center[2];
    vec3.set(gl_objects.camera.eye, x, y, z);

    if (gl_objects.bones.length > 0) {
        animate_skeleton(time);
    }
}

function tick(timestamp) {
    var delta_time = 0;
    if (timestamp === null) {
        last_timestamp = null
    } else if (last_timestamp === null) {
        time = 0
        last_timestamp = timestamp;
    } else {
        delta_time = timestamp - last_timestamp;
        last_timestamp = timestamp;
    }

    if (gl_objects.geometries.length > 0) {
        requestAnimationFrame(tick);
    }
    drawScene();
    animate(delta_time);
}

function animate_skeleton(time) {
    var bones = gl_objects.bones;
    var animation = gl_objects.animation;
    var tracks = gl_objects.tracks;
    var matrices = gl_objects.bone_matrices;

    var world_matrix = mat4.create();
    var bone_matrix = mat4.create();
    var pos = vec3.create();
    var rot = quat.create();
    var rot2 = quat.create();
    var scl = vec3.create();
    var local_matrices = new Array(bones.length);

    var duration = (animation.frames - 1) / animation.fps;
    var i = (time % duration) / duration * (animation.frames - 1);

    // for debugging
    // i = 0;

    var i0 = Math.floor(i);
    var i1 = Math.ceil(i);
    var s = i - Math.floor(i);

    for (var i = 0; i < bones.length; ++i) {
        var bone = bones[i];
        var track = tracks[i];
        local_matrices[i] = mat4.create();
        var local_matrix = local_matrices[i];

        if (track.pos) {
            pos[0] = (1 - s) * track.pos[i0 * 3 + 0] + s * track.pos[i1 * 3 + 0];
            pos[1] = (1 - s) * track.pos[i0 * 3 + 1] + s * track.pos[i1 * 3 + 1];
            pos[2] = (1 - s) * track.pos[i0 * 3 + 2] + s * track.pos[i1 * 3 + 2];
        } else {
            vec3.copy(pos, bone.pos);
        }

        if (track.rot) {
            rot[0] = track.rot[i0 * 4 + 0];
            rot[1] = track.rot[i0 * 4 + 1];
            rot[2] = track.rot[i0 * 4 + 2];
            rot[3] = track.rot[i0 * 4 + 3];

            rot2[0] = track.rot[i1 * 4 + 0];
            rot2[1] = track.rot[i1 * 4 + 1];
            rot2[2] = track.rot[i1 * 4 + 2];
            rot2[3] = track.rot[i1 * 4 + 3];

            quat.slerp(rot, rot, rot2, s);
        } else {
            quat.copy(rot, bone.rot);
        }

        if (track.scl) {
            scl[0] = track.scl[i0 * 3 + 0];
            scl[1] = track.scl[i0 * 3 + 1];
            scl[2] = track.scl[i0 * 3 + 2];
        } else {
            vec3.copy(scl, bone.scl);
        }

        mat4.fromRotationTranslation(local_matrix, rot, pos);
        mat4.scale(local_matrix, local_matrix, scl);
    }

    for (var i = 0; i < bones.length; ++i) {
        var bone = bones[i];
        var local_matrix = local_matrices[i];
        mat4.copy(world_matrix, local_matrix);

        var parent_bone = bone;
        while (parent_bone.parent != null && parent_bone.parent >= 0) {
            mat4.multiply(world_matrix, local_matrices[parent_bone.parent], world_matrix);
            parent_bone = bones[parent_bone.parent];
        }

        mat4.multiply(bone_matrix, world_matrix, bone.inv_bind_mat);
        for (var j = 0; j < 16; ++j) {
            matrices[i * 16 + j] = bone_matrix[j];
        }
    }
}