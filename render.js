import * as THREE from "https://cdn.skypack.dev/three";

import { GLTFLoader } from "https://cdn.skypack.dev/three/examples/jsm/loaders/GLTFLoader.js";

import { OrbitControls } from "https://cdn.skypack.dev/three/examples/jsm/controls/OrbitControls.js";

import { GUI } from "./build/dat.gui.module.js";
const gui = new GUI();

import store from "./store.js";

let renderer, scene, camera;
let controls;
let carousel = new THREE.Group();

const loadingCon = document.querySelector(".loading");
const loadingP = document.querySelector(".loading p:last-child");
const controlBtns = document.querySelector(".control-con");
controlBtns.addEventListener("click", controlHandler, false);

let ww = window.innerWidth;
let wh = window.innerHeight;

init();

function init() {
  renderer = new THREE.WebGLRenderer({ antialis: true });
  document.querySelector(".scene").appendChild(renderer.domElement);
  renderer.setSize(ww, wh);

  scene = new THREE.Scene();

  camera = new THREE.PerspectiveCamera(75, ww / wh, 0.01, 2500);
  addOrbitControl();

  changeOrientation();

  // debugging
  debuggers();

  addAmbientLight();
  addDirLight();

  //Load the Models
  loadModels();

  function debuggers() {
    const cameraP = gui.addFolder("Camera Position");
    cameraP.add(camera.position, "x", 0).step(0.1).min(-1000).max(1000);
    cameraP.add(camera.position, "y", 200).step(0.1).min(-1000).max(1000);
    cameraP.add(camera.position, "z", 0).step(0.1).min(-1000).max(1500);

    const grpR = gui.addFolder("Carousel Rotation");
    grpR
      .add(carousel.rotation, "x", 0)
      .step(0.1)
      .min(-Math.PI * 2)
      .max(Math.PI * 2);
    grpR
      .add(carousel.rotation, "y", 0)
      .step(0.1)
      .min(-Math.PI * 2)
      .max(Math.PI * 2);
    grpR
      .add(carousel.rotation, "z", 0)
      .step(0.1)
      .min(-Math.PI * 2)
      .max(Math.PI * 2);

    const carP = gui.addFolder("Carousel Position");
    carP.add(carousel.position, "x", 0).step(0.1).min(-100).max(1000);
    carP.add(carousel.position, "y", 0).step(0.1).min(-1000).max(1000);
    carP.add(carousel.position, "z", 0).step(0.1).min(-100).max(1000);

    const gridHelper = new THREE.GridHelper(2000, 50);
    scene.add(gridHelper);
  }

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

    controls.update();
  }
}

function render() {
  // requestAnimationFrame(render);
  renderer.render(scene, camera);
  controls.update();
}

function loadModels() {
  if (carousel.children.length >= 4) {
    scene.add(carousel);
    renderTxt();
    render();
    return;
  }
  const model = store.models[carousel.children.length];
  setLoading();
  btnsDisable();

  const loader = new GLTFLoader();
  loader.load(model.file, renderFile, loading, error);

  function renderFile(gltf) {
    const radius = 800;
    const slice = (2 * Math.PI) / 4;

    const angle = slice * carousel.children.length;
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
    // Position
    {
      if (model.oPy) gltf.scene.position.y = model.oPy;
      if (model.oPz) gltf.scene.position.z = model.oPz;
    }

    gltf.scene.userData.file = model.file;
    carousel.add(gltf.scene);
    loadModels();
  }

  function error(err) {
    console.log("An error happened", err);
  }
}

function nxtModel(pX, pZ, modelIndex) {
  const model = store.models[modelIndex];
  setLoading();
  btnsDisable();

  const loader = new GLTFLoader();
  loader.load(model.file, renderFile, loading, error);

  function renderFile(gltf) {
    gltf.scene.position.x = pX;
    gltf.scene.position.z = pZ;

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
    {
      if (model.oPy) gltf.scene.position.y = model.oPy;
      if (model.oPz) gltf.scene.position.z = model.oPz;
    }

    gltf.scene.userData.file = model.file;
    carousel.add(gltf.scene);

    render();
    loadModels();
  }

  function error(err) {
    console.log("An error happened", err);
  }
}

let prevA = 2;
let nxtA = 0;
let dir = "nxt";

function loading(xhr) {
  const percent = parseFloat((xhr.loaded / xhr.total) * 100).toFixed(2);
  const percentTxt = percent + "% loaded";

  if (percent >= 100) {
    removeLoading();
    resetBtnsDisable();
  }

  console.log(percentTxt);
  loadingP.textContent = percentTxt;
}

function changeOrientation() {
  if (store.orientation === "vertical") {
    {
      const {x, y} = carousel.rotation;
      carousel.rotation.set(x, y, Math.PI/2);
    }
    carousel.position.y = 0;
    camera.position.y = 90;
  } else {
    {
      const {x, y} = carousel.rotation
      carousel.rotation.set(x, y, 0);
    }
    carousel.position.y = 200;

    camera.position.set(0, 660, 1500);
  }
  render();
}

function rotateLeft() {
  const toBeRemoved = carousel.children[prevA];
  carousel.remove(toBeRemoved);

  if (store.orientation === "vertical") {
    carousel.rotation.x += Math.PI / 2;
  } else {
    carousel.rotation.y -= Math.PI / 2;
  }

  const { x, z } = toBeRemoved.position;
  nxtModel(x, z, store.prevA);

  if (prevA !== 0) prevA--;
  if (nxtA < 2) nxtA++;

  dir = "prev";
}

function rotateRight() {
  const toBeRemoved = carousel.children[nxtA];

  carousel.remove(toBeRemoved);
  if (store.orientation === "vertical") {
    carousel.rotation.x -= Math.PI / 2;
  } else {
    carousel.rotation.y += Math.PI / 2;
  }
  const { x, z } = toBeRemoved.position;
  nxtModel(x, z, store.nxtA);

  if (nxtA !== 0) nxtA--;
  if (prevA < 2) prevA++;

  dir = "nxt";
}

function controlHandler(e) {
  const { className } = e.target.parentElement;
  if (e.target.matches(".control-con *, .control-con *")) {
    if (className === "vertical") {
      store.toggleOrientation();
      changeOrientation();
      return;
    } else if (className === "next") store.removeOne(nxtA);
    else if (className === "prev") store.removeOne(prevA);

    store[className]();

    if (className === "next") {
      rotateRight();
    } else if (className === "prev") {
      rotateLeft();
    }
  }
}

function removeLoading() {
  loadingCon.classList.remove("active");
}

function setLoading() {
  loadingCon.classList.add("active");
  loadingP.textContent = "0 % loaded";
}

function resetBtnsDisable() {
  Array.from(controlBtns.children).forEach((btn) =>
    btn.removeAttribute("disabled", false)
  );
  document.body.style.cursor = "default";
}

function btnsDisable() {
  Array.from(controlBtns.children).forEach((btn) =>
    btn.setAttribute("disabled", true)
  );
  document.body.style.cursor = "wait";
}

function renderTxt() {
  const txtEl = document.querySelector(".txt p");
  let indexC = 1;
  if ((dir === "nxt" && nxtA !== 0) || (dir === "prev" && prevA !== 0))
    indexC = 0;

  const linkTxt = carousel.children[indexC].userData.file;
  const index = store.models.findIndex((m) => m.file === linkTxt);

  txtEl.innerHTML = `<a href="./singleModel.html?active=${index}" target="_blank">${linkTxt}</a>`;
}

window.scene = scene;
window.carousel = carousel;
window.store = store;

export { scene, carousel, store };
