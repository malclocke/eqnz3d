
var container, stats;
var camera, scene, renderer, group, particle;
var map_opacity = 20;

var map_material = new THREE.MeshBasicMaterial({
  map: THREE.ImageUtils.loadTexture('map.png'), opacity: map_opacity / 100
});

// Center position of map, and center of rotation (Cathedral Sq)
var center_lat = 43.53098;
var center_lon = 172.63674;

// Approx measure of 1 degree of latitude at map centre
var lat_to_km = 111;
// Approx measure of 1 degree of longitude at map centre
var lon_to_km = 81;

var min_date = new Date(2011,1,21);
var max_date = new Date(Date.now());
var filter_dates = {
  min: min_date,
  max: max_date
};

var mag_min = 3;
var mag_max = 6;

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
    // TODO Removed for now, not working correctly
    noPan: true,

    staticMoving: true,
    dynamicDampingFactor: 0.3,

    keys: [ 65, 83, 68 ],

    domElement: container
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
    aftershock.timestamp = new Date(aftershock.time);

    if (aftershock.timestamp < min_date) {
      min_date = aftershock.timestamp;
    }

    if (aftershock.timestamp > max_date) {
      max_date = aftershock.timestamp;
    }

    var color = colorForMag(aftershock.mag);
    particle = new THREE.Particle( new THREE.ParticleCanvasMaterial( {
      color: color, program: program 
    } ) );
    particle.position.x = kmFromLon(aftershock.lon);
    particle.position.y = kmFromLat(aftershock.lat);
    particle.position.z = aftershock.z * -1;
    particle.scale.x = particle.scale.y = (aftershock.mag / 100) * aftershock.mag;
    particle.aftershock = aftershock;
    group.addChild( particle );
  }

  renderer = new THREE.CanvasRenderer();
  renderer.setSize( canvasWidth, canvasHeight );
  container.appendChild( renderer.domElement );

  stats = new Stats();
  stats.domElement.style.position = 'absolute';
  stats.domElement.style.top = '0px';
  stats.domElement.style.display = 'none';
  container.appendChild( stats.domElement );
}

function animate() {

  requestAnimationFrame( animate );

  render();

  stats.update();
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

function hexColorForMag(magnitude) {
  if (magnitude >= 6.0) {
    // Red
    col = "#FF0000";
  } else if (magnitude >= 5) {
    // Yellow
    col = "#FFFF00";
  } else if (magnitude >= 4) {
    // Green
    col = "#00FF00";
  } else {
    // Blue
    col = "#0000FF";
  }
  return(col);
}

function filterAftershocks() {
  THREE.SceneUtils.traverseHierarchy(group, function (particle) {
    if (typeof particle.aftershock != 'undefined') {
      if (particle.aftershock.mag >= mag_min && particle.aftershock.mag < (mag_max + 1)) {
        particle.visible = true;
      } else {
        particle.visible = false;
        return;
      }

      if (particle.aftershock.timestamp < filter_dates.min || particle.aftershock.timestamp > filter_dates.max) {
        particle.visible = false;
        return;
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

(function( $ ){

  $.fn.setMagnitude = function(magnitude) {
    this.html(magnitude);
    this.css('color', hexColorForMag(magnitude));
    return this;
  };

})(jQuery);

$(function() {

  $('#opacity').slider({
    value: 20,
    min: 0,
    max: 100,
    slide: function(event, ui) {
      map_material.opacity = ui.value / 100;
      $('#opacity_value').html(ui.value);
    }
  });
  $('#opacity_value').html(map_opacity);

  $('#magnitude').slider({
    range: true,
    min: mag_min,
    max: mag_max,
    values: [mag_min,mag_max],
    slide: function(event, ui) {
      $('#mag_min').setMagnitude(ui.values[0]);
      $('#mag_max').setMagnitude(ui.values[1]);
      mag_min = ui.values[0];
      mag_max = ui.values[1];
      filterAftershocks();
    }
  });

  $('#mag_min').setMagnitude(mag_min);
  $('#mag_max').setMagnitude(mag_max);

  $('#reset_camera').click(function() {
    resetCamera();
  });

  $('#toggle_stats').click(function() {
    $(stats.domElement).toggle();
  });

  $('#date_control').dateRangeSlider({
    defaultValues: {min: min_date, max: new Date(2011,1,23)},
    bounds: {min: min_date, max: max_date},
  }).bind("valuesChanging", function(event, ui){
    filter_dates.max = ui.values.max;
    filter_dates.min = ui.values.min;
    filterAftershocks();
  });
});

