
var container, stats;
var camera, scene, renderer, group, particle;
var enable_stats = false;

var map_material = new THREE.MeshBasicMaterial({
  map: THREE.ImageUtils.loadTexture('map.png'), opacity: 0.2
});

// Center position of map, and center of rotation (Cathedral Sq)
var center_lat = 43.53098;
var center_lon = 172.63674;

// Approx measure of 1 degree of latitude at map centre
var lat_to_km = 111;
// Approx measure of 1 degree of longitude at map centre
var lon_to_km = 81;

init();
animate();

function init() {

  container = document.createElement( 'div' );
  document.body.appendChild( container );

  var canvasWidth = window.innerWidth;
  var canvasHeight = window.innerHeight - $('#controls').height();

  camera = new THREE.TrackballCamera({

    fov: 120, 
    aspect: canvasWidth / canvasHeight,
    near: 0.1,
    far: 3000,

    rotateSpeed: 1.0,
    zoomSpeed: 5.0,
    panSpeed: 5.0,

    noZoom: false,
    noPan: false,

    staticMoving: true,
    dynamicDampingFactor: 0.3,

    keys: [ 65, 83, 68 ]

  });
  resetCamera();

  scene = new THREE.Scene();

  var PI2 = Math.PI * 2;
  var program = function ( context ) {

    context.beginPath();
    context.arc( 0, 0, 1, 0, PI2, true );
    context.closePath();
    context.fill();

  }

  group = new THREE.Object3D();
  scene.addObject( group );

  // TODO calculate the real width / height of the map
  var plane = new THREE.PlaneGeometry(50, 50, 20, 20);
  var mapmesh = new THREE.Mesh(plane, map_material);
  group.addChild(mapmesh);

  for (var i = 0; i < earthquakes.length; i++) {
    var aftershock = earthquakes[i];

    var color = colorForMag(aftershock.mag);
    particle = new THREE.Particle( new THREE.ParticleCanvasMaterial( {
      color: color, program: program 
    } ) );
    particle.position.x = kmFromLon(aftershock.lon);
    particle.position.y = kmFromLat(aftershock.lat);
    particle.position.z = aftershock.z * -1;
    particle.scale.x = particle.scale.y = aftershock.mag / 20;
    particle.aftershock = aftershock;
    group.addChild( particle );
  }

  renderer = new THREE.CanvasRenderer();
  renderer.setSize( canvasWidth, canvasHeight );
  container.appendChild( renderer.domElement );

  if (enable_stats) {
    stats = new Stats();
    stats.domElement.style.position = 'absolute';
    stats.domElement.style.top = '0px';
    container.appendChild( stats.domElement );
  }
}

function animate() {

  requestAnimationFrame( animate );

  render();

  if (stats) {
    stats.update();
  }
}

function render() {

  renderer.render( scene, camera );

}

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
  return (lon_to_km * lon_diff_from_center) * -1;
}

function colorForMag(magnitude) {
  if (magnitude >= 6.0) {
    // Red
    col = 0xFF0000;
  } else if (magnitude >= 5) {
    // Yellow
    col = 0xFFFF00;
  } else if (magnitude >= 4) {
    // Green
    col = 0x00FF00;
  } else {
    // Blue
    col = 0x0000FF;
  }
  return(col);
}

function limitMagRange(min, max) {
  THREE.SceneUtils.traverseHierarchy(group, function (particle) {
    if (typeof particle.aftershock != 'undefined') {
      if (particle.aftershock.mag >= min && particle.aftershock.mag < (max + 1)) {
        particle.visible = true;
      } else {
        particle.visible = false;
      }
    }
  });
}

function resetCamera() {
  camera.position.z = 10;
  camera.position.x = camera.position.y = 0;
  camera.up.x = camera.up.z = 0;
  camera.up.y = 1;
}

$(function() {
  $('#opacity').slider({
    value: 50,
    min: 0,
    max: 100,
    slide: function(event, ui) {
      map_material.opacity = ui.value / 100;
      $('#opacity_value').html(ui.value);
    }
  });

  $('#magnitude').slider({
    range: true,
    min: 3,
    max: 6,
    values: [3,6],
    slide: function(event, ui) {
      $('#mag_min').html(ui.values[0]);
      $('#mag_max').html(ui.values[1]);
      limitMagRange(ui.values[0], ui.values[1]);
    }
  });

  $('#reset_camera').click(function() {
    resetCamera();
  });
});

