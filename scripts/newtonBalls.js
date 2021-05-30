import * as THREE from "https://cdn.skypack.dev/three";
import { OrbitControls } from "https://cdn.skypack.dev/three/examples/jsm/controls/OrbitControls.js";

var options = {
  framerate: 60,
  G: 10,
  START_SPEED: 0,
  MOVER_COUNT: 100,
  TRAILS_DISPLAY: false,
  TRAILS_LENGTH: 200,
  MIN_MASS: 100,
  MAX_MASS: 1000,
  DENSITY: 0.1,
};

var total_mass = 0;
var lerpLookAt = new THREE.Vector3();
var lookAt = new THREE.Vector3();

var MASS_FACTOR = 0.01; // for display of size

var SPHERE_SIDES = 12;

var translate = new THREE.Vector3();

var movers = [];
var now;
var then = Date.now();
var renderDelta;

var scene = new THREE.Scene({ castShadow: true });
var camera = new THREE.PerspectiveCamera(
  45,
  window.innerWidth / window.innerHeight,
  0.1,
  100000000.0
);
var renderer = new THREE.WebGLRenderer({
  preserveDrawingBuffer: true,
  antialias: true,
});

var isMoverSelected = false;

var controls = new OrbitControls(camera, renderer.domElement);

scene.castShadow = true;
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.autoClearColor = true;

document.body.appendChild(renderer.domElement);

var selectedMaterial = new THREE.MeshLambertMaterial({
  ambient: 0xaaaaaa,
  diffuse: 0xdddddd,
  specular: 0xffffff,
  shininess: 50,
  emissive: 0x000000,
});
// add subtle ambient lighting
// directional lighting
var ambientLight = new THREE.AmbientLight(0x222222);
scene.add(ambientLight);

var redLight = new THREE.DirectionalLight(0xff9922);
redLight.position.set(1, 2, 0);
scene.add(redLight);

var blueLight = new THREE.DirectionalLight(0x2288ff);
blueLight.position.set(0, -1, -1);
scene.add(blueLight);

var displayMass = false;
reset();

var pause = false;

function draw() {
  requestAnimationFrame(draw);
  now = Date.now();
  renderDelta = now - then;
  render(renderDelta);
  then = now;
}
draw();

function render(dt) {
  total_mass = 0;
  var maximum_mass = 0.0;

  if (movers && movers.length) {
    if (!pause) {
      for (var i = movers.length - 1; i >= 0; i--) {
        var m = movers[i];

        if (m.alive) {
          for (var j = movers.length - 1; j >= 0; j--) {
            var a = movers[j];
            if (movers[i].alive && movers[j].alive && i != j) {
              var distance = m.location.distanceTo(a.location);

              var radiusM =
                Math.pow(
                  (m.mass / MASS_FACTOR / MASS_FACTOR / 4) * Math.PI,
                  1 / 3
                ) / 3;
              var radiusA =
                Math.pow(
                  (a.mass / MASS_FACTOR / MASS_FACTOR / 4) * Math.PI,
                  1 / 3
                ) / 3;

              if (distance < radiusM + radiusA) {
                // merge objects
                a.eat(m);
              } else {
                a.attract(m);
              }
            }
          }
        }
      }
    }
    var selectedMover;
    var totalMassPosition = new THREE.Vector3();
    for (var i = movers.length - 1; i >= 0; i--) {
      var m = movers[i];
      if (m.alive) {
        total_mass += m.mass;
        totalMassPosition.add(m.location.clone().multiplyScalar(m.mass));

        if (m.mass > maximum_mass) maximum_mass = m.mass;

        if (!pause) {
          m.update();
        }
        m.display(displayMass);

        if (m.selected) {
          selectedMover = m;
        }
      }

      updateTrails(m);
    }

    totalMassPosition.divideScalar(total_mass);
  }

  if (prevTotalMassPosition) {
    camera.position.add(
      new THREE.Vector3().subVectors(totalMassPosition, prevTotalMassPosition)
    );
    camera.updateMatrix();
  }

  prevTotalMassPosition = totalMassPosition;
  if (isMoverSelected && selectedMover) {
    lookAt = selectedMover.location.clone();
  }
  lerpLookAt.lerp(lookAt, 0.05);
  if (isMoverSelected) {
    var lookAtDiff = controls.target.clone().sub(lerpLookAt);
    camera.position.x -= lookAtDiff.x;
    camera.position.y -= lookAtDiff.y;
    camera.position.z -= lookAtDiff.z;
    camera.updateMatrix();
    controls.target = lerpLookAt.clone();
  }

  controls.update();
  renderer.render(scene, camera);
}
var prevTotalMassPosition;
function updateTrails(m) {
  if (isMoverSelected) {
    if (m.selected) {
      if (options.TRAILS_DISPLAY) {
        m.showTrails();
      } else {
        m.hideTrails();
      }

      selectedMaterial.emissive = m.line.material.color;
      m.mesh.material = selectedMaterial;
    } else {
      m.mesh.material = m.basicMaterial;
      m.hideTrails();
    }
  } else {
    m.mesh.material = m.basicMaterial;
    if (options.TRAILS_DISPLAY) {
      m.showTrails();
    } else {
      m.hideTrails();
    }
  }
}

var theta = 0,
  phi = 0;
var currentRadius = 15000.0;
setCamera();

window.onresize = function () {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
};

function reset() {
  if (movers) {
    for (var i = 0; i < movers.length; i = i + 1) {
      scene.remove(movers[i].mesh);
      scene.remove(movers[i].line);
    }
  }

  movers = [];
  translate.x = 0.0;
  translate.y = 0.0;
  translate.z = 0.0;

  // generate N movers with random mass (N = MOVER_COUNT)
  for (var i = 0; i < parseInt(options.MOVER_COUNT); i = i + 1) {
    var mass = random(options.MIN_MASS, options.MAX_MASS);

    var max_distance = parseFloat(1000 / options.DENSITY);
    var max_speed = parseFloat(options.START_SPEED);

    var vel = new THREE.Vector3(
      random(-max_speed, max_speed),
      random(-max_speed, max_speed),
      random(-max_speed, max_speed)
    );

    var loc = new THREE.Vector3(
      random(-max_distance, max_distance),
      random(-max_distance, max_distance),
      random(-max_distance, max_distance)
    );

    movers.push(new Mover(mass, vel, loc));
  }

  if (localStorage) localStorage.setItem("options", JSON.stringify(options));
}

function random(min, max) {
  return Math.random() * (max - min) + min;
}

function Mover(m, vel, loc) {
  (this.location = loc),
    (this.velocity = vel),
    (this.acceleration = new THREE.Vector3(0.0, 0.0, 0.0)),
    (this.mass = m),
    (this.c = 0xffffff),
    (this.alive = true);
  this.geometry = new THREE.SphereGeometry(100.0, SPHERE_SIDES, SPHERE_SIDES);

  this.vertices = []; // PATH OF MOVEMENT

  this.line = new THREE.Line(); // line to display movement

  this.color = this.line.material.color;

  this.basicMaterial = new THREE.MeshPhongMaterial({
    ambient: 0x111111,
    color: this.color,
    specular: this.color,
    shininess: 10,
  });

  this.mesh = new THREE.Mesh(this.geometry, this.basicMaterial);
  this.mesh.castShadow = false;
  this.mesh.receiveShadow = true;

  this.position = this.location;

  this.index = movers.length;
  this.selected = false;

  scene.add(this.mesh);
  this.applyForce = function (force) {
    if (!this.mass) this.mass = 1.0;
    var f = force.divideScalar(this.mass);
    this.acceleration.add(f);
  };
  this.update = function () {
    this.velocity.add(this.acceleration);
    this.location.add(this.velocity);
    this.acceleration.multiplyScalar(0);

    this.mesh.position.copy(this.location);
    if (this.vertices.length > 10000) this.vertices.splice(0, 1);

    this.vertices.push(this.location.clone());
  };
  this.eat = function (m) {
    // m => other Mover object
    var newMass = this.mass + m.mass;

    var newLocation = new THREE.Vector3(
      (this.location.x * this.mass + m.location.x * m.mass) / newMass,
      (this.location.y * this.mass + m.location.y * m.mass) / newMass,
      (this.location.z * this.mass + m.location.z * m.mass) / newMass
    );
    var newVelocity = new THREE.Vector3(
      (this.velocity.x * this.mass + m.velocity.x * m.mass) / newMass,
      (this.velocity.y * this.mass + m.velocity.y * m.mass) / newMass,
      (this.velocity.z * this.mass + m.velocity.z * m.mass) / newMass
    );

    this.location = newLocation;
    this.velocity = newVelocity;
    this.mass = newMass;

    if (m.selected) this.selected = true;
    this.color.lerpHSL(m.color, m.mass / (m.mass + this.mass));

    m.kill();
  };
  this.kill = function () {
    this.alive = false;

    scene.remove(this.mesh);
  };
  this.attract = function (m) {
    // m => other Mover object
    var force = new THREE.Vector3().subVectors(this.location, m.location); // Calculate direction of force
    var d = force.lengthSq();
    if (d < 0) d *= -1;
    force = force.normalize();
    var strength = -(options.G * this.mass * m.mass) / d; // Calculate gravitional force magnitude
    force = force.multiplyScalar(strength); // Get force vector --> magnitude * direction

    this.applyForce(force);
  };
  this.display = function () {
    if (this.alive) {
      var scale = Math.pow((this.mass * MASS_FACTOR) / (4 * Math.PI), 1 / 3);
      this.mesh.scale.x = scale;
      this.mesh.scale.y = scale;
      this.mesh.scale.z = scale;

      var emissiveColor = this.color.getHex().toString(16);
      emissiveColor = 1;
      this.basicMaterial.emissive.setHex(parseInt(emissiveColor, 16));
    } else {
    }
  };

  this.showTrails = function () {
    if (!this.lineDrawn) {
      this.lineDrawn = true;
      scene.add(this.line);
    } else if (this.lineDrawn === true) {
      scene.remove(this.line);
      var newLineGeometry = new THREE.Geometry();
      newLineGeometry.vertices = this.vertices.slice();

      newLineGeometry.verticesNeedUpdate = true;
      if (!pause && !this.alive) {
        if (this.lineDrawn === true) {
          this.vertices.shift();
        }
      }
      while (
        newLineGeometry.vertices.length > parseInt(options.TRAILS_LENGTH)
      ) {
        newLineGeometry.vertices.shift();
      }
      this.line = new THREE.Line(newLineGeometry, this.line.material);
      scene.add(this.line);
    }
  };
  this.hideTrails = function () {
    if (this.lineDrawn) {
      scene.remove(this.line);
      this.lineDrawn = false;
    }
  };
}

function setCamera() {
  for (var i = 0; i < movers.length; i = i + 1) {
    updateTrails(movers[i]);
  }
  camera.position.x =
    currentRadius *
    Math.sin((theta * Math.PI) / 360) *
    Math.cos((phi * Math.PI) / 360);
  camera.position.y = currentRadius * Math.sin((phi * Math.PI) / 360);
  camera.position.z =
    currentRadius *
    Math.cos((theta * Math.PI) / 360) *
    Math.cos((phi * Math.PI) / 360);
  camera.lookAt(new THREE.Vector3(0, 0, 0));
  camera.updateMatrix();
}
