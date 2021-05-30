import * as THREE from "https://cdn.skypack.dev/three";

import { GLTFLoader } from "https://cdn.skypack.dev/three/examples/jsm/loaders/GLTFLoader.js";
import { DRACOLoader } from "https://cdn.skypack.dev/three/examples/jsm/loaders/DRACOLoader.js";

import { OrbitControls } from "https://cdn.skypack.dev/three/examples/jsm/controls/OrbitControls.js";

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

// loader
const loader = new GLTFLoader();

const dl = new DRACOLoader();
dl.setDecoderPath("/scripts/decoder/");
loader.setDRACOLoader(dl);

init();

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

  camera = new THREE.PerspectiveCamera(75, ww / wh, 0.01, 2500);
  addOrbitControl();

  changeOrientation();

  addAmbientLight();
  addDirLight();

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

    controls.update();
  }
}

function render() {
  requestAnimationFrame(render);

  carousel.children.forEach((ch) => {
    ch.rotation.x += 0.01;
    ch.rotation.z += 0.01;
  });

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

    renderTxt();
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
      const { x, y } = carousel.rotation;
      carousel.rotation.set(x, y, Math.PI / 2);
    }
    carousel.position.y = 0;
    camera.position.y = 90;
  } else {
    {
      const { x, y } = carousel.rotation;
      carousel.rotation.set(x, y, 0);
    }
    carousel.position.y = 200;

    camera.position.set(0, 660, 1500);
  }
  controls.update();
}

function slowRot(axis, dir) {
  const original = carousel.rotation[axis];

  let lim = original + Math.PI / 2;
  if (dir === "-") lim = original - Math.PI / 2;

  animate();

  function animate() {
    const id = requestAnimationFrame(animate);

    let rotVal = carousel.rotation[axis];
    rotVal += dir === "+" ? 0.08 : -0.08;

    if ((dir === "-" && rotVal <= lim) || (dir === "+" && rotVal >= lim))
      rotVal = lim;

    carousel.rotation[axis] = rotVal;

    if ((dir === "-" && rotVal <= lim) || (dir === "+" && rotVal >= lim))
      cancelAnimationFrame(id);

    controls.update();
  }
}

function rotateLeft() {
  const toBeRemoved = carousel.children[prevA];
  carousel.remove(toBeRemoved);

  if (store.orientation === "vertical") {
    slowRot("x", "+");
  } else {
    slowRot("y", "-");
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
  if (store.orientation === "vertical") slowRot("x", "-");
  else slowRot("y", "+");

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
    } else if (className === "cNext") store.removeOne(nxtA);
    else if (className === "cPrev") store.removeOne(prevA);

    store[className]();

    if (className === "cNext") {
      rotateRight();
    } else if (className === "cPrev") {
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
