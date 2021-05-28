import * as THREE from "https://cdn.skypack.dev/three";

import { GLTFLoader } from "https://cdn.skypack.dev/three/examples/jsm/loaders/GLTFLoader.js";
import { DRACOLoader } from "https://cdn.skypack.dev/three/examples/jsm/loaders/DRACOLoader.js";

import { OrbitControls } from "https://cdn.skypack.dev/three/examples/jsm/controls/OrbitControls.js";

import store from "./store.js";

let renderer, scene, camera;
let controls, currentModel;

let ww = window.innerWidth;
let wh = window.innerHeight;

function init() {
  let pixelRatio = window.devicePixelRatio;

  let AA = true;
  if (pixelRatio > 1) AA = false;

  renderer = new THREE.WebGLRenderer({
    antialis: AA,
    powerPreference: "high-performance",
  });

  document.querySelector(".scene").appendChild(renderer.domElement);
  renderer.setSize(ww, wh);

  scene = new THREE.Scene();

  camera = new THREE.PerspectiveCamera(50, ww / wh, 0.01, 2000);
  camera.position.set(0, 0, 1000);

  addAmbientLight();
  addDirLight();
  addOrbitControl();

  //Load the Model
  loadModel();

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
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.2;

    controls.update();
  }
}

const render = function () {
  requestAnimationFrame(render);

  currentModel.rotation.x += 0.01;
  currentModel.rotation.z += 0.01;

  renderer.render(scene, camera);
  controls.update();
};

function loadModel() {
  const queries = window.location.search.slice(1).split("&");
  const active = queries[0].split("=")[1];

  const model = store.models[active];
  const loader = new GLTFLoader();

  const dl = new DRACOLoader();
  dl.setDecoderPath("/scripts/decoder/");
  loader.setDRACOLoader(dl);

  loader.load(model.file, renderFile, loading, error);

  function renderFile(gltf) {
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
    // Position
    gltf.scene.position.set(0, 0, 0);

    currentModel = gltf.scene;

    scene.add(gltf.scene);
    render();
  }

  function loading(xhr) {
    console.log((xhr.loaded / xhr.total) * 100 + "% loaded");
  }

  function error(err) {
    console.log("An error happened", err);
  }
}

init();
