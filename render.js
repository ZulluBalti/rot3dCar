import * as THREE from "https://cdn.skypack.dev/three";

import { GLTFLoader } from "https://cdn.skypack.dev/three/examples/jsm/loaders/GLTFLoader.js";

import { OrbitControls } from "https://cdn.skypack.dev/three/examples/jsm/controls/OrbitControls.js";

import { GUI } from "./build/dat.gui.module.js";
const gui = new GUI();

import store from "./store.js";

let renderer, scene, camera;
let controls;
let objects = [];

const controlBtns = document.querySelector(".control-con");
controlBtns.addEventListener("click", controlHandler, false);

let ww = window.innerWidth;
let wh = window.innerHeight;

function init() {
  renderer = new THREE.WebGLRenderer({ antialis: true });
  document.querySelector(".scene").appendChild(renderer.domElement);
  renderer.setSize(ww, wh);

  scene = new THREE.Scene();

  camera = new THREE.PerspectiveCamera(50, ww / wh, 0.01, 2000);
  camera.position.set(0, 0, 2000);

  const cameraP = gui.addFolder("Camera Position");
  cameraP.add(camera.position, "x", 0).step(0.1).min(0).max(500);
  cameraP.add(camera.position, "y", 200).step(0.1).min(0).max(500);
  cameraP.add(camera.position, "z", 0).step(0.1).min(0).max(500);

  const cameraR = gui.addFolder("Camera Rotation");
  cameraR.add(camera.rotation, "x", 0).step(0.1).min(0).max(Math.PI);
  cameraR.add(camera.rotation, "y", 0).step(0.1).min(0).max(Math.PI);
  cameraR.add(camera.rotation, "z", 0).step(0.1).min(0).max(Math.PI);

  addAmbientLight();
  addDirLight();
  addOrbitControl();

  //Load the Models
  loadModels();

  function addAmbientLight() {
    const color = 0xb97a20; // brownish orange
    const intensity = 1;
    const hLight = new THREE.AmbientLight(color, intensity);
    scene.add(hLight);
  }

  function addDirLight() {
    const color = 0xffffff;
    const intensity = 1;
    const light = new THREE.DirectionalLight(color, intensity);
    light.position.set(5, 10, 2);
    scene.add(light);
    scene.add(light.target);
  }

  function addOrbitControl() {
    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.rotateSpeed = 0.5;
    // controls.autoRotate = true;
    // controls.autoRotateSpeed = 1.5;

    controls.update();
  }
}

const render = function () {
  requestAnimationFrame(render);

  // Rotate the objects
  for (let object of objects) {
    // object.rotation.z += 0.005;
    // object.rotation.x += 0.002;
  }

  renderer.render(scene, camera);
  controls.update();
};

function loadModels() {
  console.log(store);
  store.models.forEach((model) => {
    loadModel(model);
  });
}

function loadModel(model) {
  const loader = new GLTFLoader();
  loader.load(model.file, renderFile, loading, error);

  function renderFile(gltf) {
    const radius = 1000;
    const slice = (2 * Math.PI) / store.models.length;

    const angle = slice * objects.length;
    gltf.scene.position.x = Math.cos(angle) * radius;
    gltf.scene.position.z = Math.sin(angle) * radius;

    gltf.scene.traverse(function (child) {
      if (child instanceof THREE.Mesh) {
        if (model.color) child.material.color = new THREE.Color(model.color);
        child.geometry.computeVertexNormals();
      }
    });

    // Scaling
    {
      const { x, y, z } = model.oS;
      gltf.scene.scale.set(x, y, z);
    }

    // Rotation
    {
      const { x, y, z } = model.oR;
      gltf.scene.rotation.set(x, y, z);
    }

    scene.add(gltf.scene);
    objects.push(gltf.scene);
    render();
  }

  function loading(xhr) {
    console.log((xhr.loaded / xhr.total) * 100 + "% loaded");
  }

  function error(err) {
    console.log("An error happened", err);
  }
}

function controlHandler(e) {
  const { className } = e.target.parentElement;
  if (e.target.matches(".control-con *, .control-con *")) {
    store[className]();
    renderTxt();
    // Todo

    const { x, z } = objects[0].position;

    for (let i = 0; i < objects.length; i++) {
      let nxt = i + 1;
      if (nxt === objects.length) {
        objects[i].position.x = x;
        objects[i].position.z = z;
      } else {
        const { x, z } = objects[nxt].position;
        objects[i].position.x = x;
        objects[i].position.z = z;
        // moveIt(objects[i], x, z)
      }
    }
  }

  function moveIt(el, x, z) {
    const frX = x / el.position.x;
    const frZ = z / el.position.z;

    const moverTimers = setInterval(() => {
      el.position.z += 0.0001;
      el.position.x += 0.0001;
      if (el.position.x >= x || el.position.z >= z) {
        clearInterval(moverTimers);
        el.position.z = z;
        el.position.x = x;
      }
    }, 10);
  }
}

function renderTxt() {
  const txtEl = document.querySelector(".txt p");
  const linkTxt = store.models[store.active].file;
  txtEl.innerHTML = `<a href="./singleModel.html?active=${store.active}" target="_blank">${linkTxt}</a>`;
}

init();
renderTxt();
