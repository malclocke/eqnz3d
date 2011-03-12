var gl;

// Center position of map, and center of rotation
var center_lat = 43.53098;
var center_lon = 172.63674;

// Approx measure of 1 degree of latitude at map centre
var lat_to_km = 111;
// Approx measure of 1 degree of longitude at map centre
var lon_to_km = 81;

/**
 * Returns the number of KM's from the center of the map for
 * the given latitude or longitude.
 */
function kmFromLat(lat) {
  var lat_diff_from_center = center_lat - lat;
  return lat_to_km * lat_diff_from_center;
}
function kmFromLon(lon) {
  var lon_diff_from_center = center_lon - lon;
  return lon_to_km * lon_diff_from_center;
}
 
function getShader ( gl, id ){
   var shaderScript = document.getElementById ( id );
   var str = "";
   var k = shaderScript.firstChild;
   while ( k ){
     if ( k.nodeType == 3 ) str += k.textContent;
     k = k.nextSibling;
   }
   var shader;
   if ( shaderScript.type == "x-shader/x-fragment" )
           shader = gl.createShader ( gl.FRAGMENT_SHADER );
   else if ( shaderScript.type == "x-shader/x-vertex" )
           shader = gl.createShader(gl.VERTEX_SHADER);
   else return null;
   gl.shaderSource(shader, str);
   gl.compileShader(shader);
   if (gl.getShaderParameter(shader, gl.COMPILE_STATUS) == 0)
      alert(gl.getShaderInfoLog(shader));
   return shader;
}
 
function webGLStart() {
   var canvas = document.getElementById("canvas");
   var size = Math.min(window.innerWidth, window.innerHeight) - 20;
   canvas.width =  size;   canvas.height = size;
   try { gl = canvas.getContext("experimental-webgl");
   } catch(e) {}
   if ( !gl ) {alert("Your browser does not support WebGL"); return;}
   gl.viewport(0, 0, size, size);
 
   var prog  = gl.createProgram();
   gl.attachShader(prog, getShader( gl, "shader-vs" ));
   gl.attachShader(prog, getShader( gl, "shader-fs" ));
   gl.linkProgram(prog);
   gl.useProgram(prog);
 
   var vertices = [], ind = [];
   var nPhi = 10, nTheta = 5,
     dPhi = 2*Math.PI/nPhi, dTheta = Math.PI/nTheta;
   for (var j = 0; j <= nTheta; j++ ){
      var Theta    = j * dTheta;
      var cosTheta = Math.cos ( Theta );
      var sinTheta = Math.sin ( Theta );
      for (var i = 0; i <= nPhi; i++ ){
         var Phi    = i * dPhi;
         var cosPhi = Math.cos ( Phi );
         var sinPhi = Math.sin ( Phi );
         vertices.push( cosPhi * sinTheta );
         vertices.push( -sinPhi * sinTheta );
         vertices.push( cosTheta );
      }
   }
   for (var j = 0; j < nTheta; j++ )
      for (var i = 0; i <= nPhi; i++ ){
         ind.push( j*(nPhi+1) + i );
         ind.push( (j+1)*(nPhi+1) + i );
      }
   var posLocation = gl.getAttribLocation(prog, "aPos");
   gl.enableVertexAttribArray( posLocation );
   var posBuffer = gl.createBuffer();
   gl.bindBuffer(gl.ARRAY_BUFFER, posBuffer);
   gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
   gl.vertexAttribPointer(posLocation, 3, gl.FLOAT, false, 0, 0);
 
   var indexBuffer = gl.createBuffer();
   gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
   gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(ind),
     gl.STATIC_DRAW);
 
   var prMatrix = new CanvasMatrix4();
   //prMatrix.perspective(45, 1, .1, 200);
   prMatrix.perspective(45, 1, .1, 200);
   gl.uniformMatrix4fv( gl.getUniformLocation(prog,"prMatrix"),
      false, new Float32Array(prMatrix.getAsArray()) );
   var mvMatrix = new CanvasMatrix4();
   var rotMat = new CanvasMatrix4();
   rotMat.makeIdentity();
   var mvMatLoc = gl.getUniformLocation(prog,"mvMatrix");
   var colorLoc = gl.getUniformLocation(prog,"color");
   var scaleLoc = gl.getUniformLocation(prog,"scale");
 
   gl.enable(gl.DEPTH_TEST);
   gl.depthFunc(gl.LEQUAL);
   gl.clearDepth(1.0);
   gl.clearColor(0, 0, .8, 1);
   var xOffs = yOffs = 0,  drag  = 0;
   var xRot = yRot = 0;
   //var transl = -10.5;
   var transl = -50;
   drawScene();
 
  function drawScene(){
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    rotMat.rotate(xRot/3, 1,0,0);  rotMat.rotate(yRot/3, 0,1,0);

    drawAftershock(center_lon, center_lat, 0.0, 7.0);
    drawAftershock(center_lon - .1, center_lat - .1, 0.0, 7.0);
    drawAftershock(center_lon + .1, center_lat - .1, 0.0, 7.0);
    drawAftershock(center_lon - .1, center_lat + .1, 0.0, 7.0);
    drawAftershock(center_lon + .1, center_lat + .1, 0.0, 7.0);
    for (var i = 0; i < earthquakes.length; i++) {
      aftershock = earthquakes[i];
      drawAftershock(aftershock.lon, aftershock.lat, aftershock.z, aftershock.mag);
    }

    gl.flush ();
  }
  function drawAftershock(lon, lat, depth, magnitude) {
    if (magnitude >= 6.0) {
      // Red
      col = [1,0,0];
    } else if (magnitude >= 5) {
      // Yellow
      col = [1,1,0];
    } else if (magnitude >= 4) {
      // Green
      col = [0,1,0];
    } else {
      // Blue
      col = [0,0,1];
    }
    drawBall(kmFromLon(lon), kmFromLat(lat), depth, col, magnitude / 10);
  }
  function drawBall(x,y,z, col, scale){
    r = col[0];g = col[1];b = col[2];
    mvMatrix.makeIdentity();
    mvMatrix.translate(x, y, z);
    mvMatrix.multRight( rotMat );
    mvMatrix.translate(0, 0, transl);
    gl.uniformMatrix4fv( mvMatLoc, false, new Float32Array(mvMatrix.getAsArray()) );
    gl.uniform1f( scaleLoc, scale );
    gl.uniform3f( colorLoc, r, g, b );
    for(var i=0; i < nTheta; i++)
      gl.drawElements(gl.TRIANGLE_STRIP, 2*(nPhi+1), gl.UNSIGNED_SHORT,
        4*(nPhi+1)*i);
  }
  canvas.onmousedown = function ( ev ){
     drag  = 1;
     xOffs = ev.clientX;  yOffs = ev.clientY;
  }
  canvas.onmouseup = function ( ev ){
     drag  = 0;
     xOffs = ev.clientX;  yOffs = ev.clientY;
  }
  canvas.onmousemove = function ( ev ){
     if ( drag == 0 ) return;
     yRot = - xOffs + ev.clientX;  xRot = - yOffs + ev.clientY;
     xOffs = ev.clientX;   yOffs = ev.clientY;
     drawScene();
  }
  var wheelHandler = function(ev) {
    var del = 1.1;
    if (ev.shiftKey) del = 1.01;
    var ds = ((ev.detail || ev.wheelDelta) > 0) ? del : (1 / del);
    transl *= ds;
    drawScene();
    ev.preventDefault();
  };
  canvas.addEventListener('DOMMouseScroll', wheelHandler, false);
  canvas.addEventListener('mousewheel', wheelHandler, false);
}