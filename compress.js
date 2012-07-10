function CACConvert() {
    var inputStr = CACGetInputString();
    var keyframes = CACGetKeyframeMap();
    var outputStr = CACCompressDocument(inputStr, keyframes);

    CACSetOutputString(outputStr);
}
function CACGetKeyframeMap() {
    var keyframesElement = $("#keyframes");
    var keyframes_str = keyframesElement.val().trim();
    var keyframes = [];
    keyframes_str.split(" ").forEach(function(val) {
        if (val=="1" || val=="true") {
            keyframes.push(true);
        } else {
            keyframes.push(false);
        }
    });
    return keyframes;
}
function CACGetInputString() {
    var inputElement = $("#input");
    return inputElement.val();
}
function CACSetOutputString(str) {
    var outputElement = $("#output")
    var xmlPreface = "<?xml version=\"1.0\" encoding=\"utf-8\"?>";
    outputElement.text(xmlPreface + str);
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
    var inputElement = $("#input");
    inputElement.text(this.result);
}
function CACFileError(ev) {
    if (this.error.code == 2) {
        alert("Can not read local file. Error code: " + this.error.code);
    } else {
        alert("Can not read local file due to security reasons. Try enabling --allow-file-access-from-files for Chrome.");
    }
}
function CACSetupEvents() {
    var compressButton = $("#compress");
    var inputElement = $("#input");
    compressButton.click(CACConvert);
    inputElement[0].ondragover = CACDragOver;
    inputElement[0].ondrop = CACDrop;
}
