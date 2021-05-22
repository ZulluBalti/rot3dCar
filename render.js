import * as THREE from "https://cdn.skypack.dev/three";

import { GLTFLoader } from "https://cdn.skypack.dev/three/examples/jsm/loaders/GLTFLoader.js";

import { OrbitControls } from "https://cdn.skypack.dev/three/examples/jsm/controls/OrbitControls.js";

import { GUI } from "./build/dat.gui.module.js";
const gui = new GUI();

import store from "./store.js";
import cloneDeep from "https://cdn.skypack.dev/clonedeep";

let renderer, scene, camera;
let controls;

let objects = {
  left: null,
  right: null,
  back: null,
  front: null,

  length: 0,
  add() {
    this.length++;
  },
  removeBack() {
    scene.remove(this.back);
    this.back = null;
  },
  nxtMove() {
    const tmpB = { ...this.back.position };
    delete tmpB.y;
    const tmpBF = this.back.userData.file;

    const tmpF = { ...this.front.position };
    delete tmpF.y;
    const tmpFF = this.front.userData.file;

    const tmpL = { ...this.left.position };
    delete tmpL.y;
    const tmpLF = this.left.userData.file;

    this.front.position.x = this.right.position.x;
    this.front.position.z = this.right.position.z;
    this.front.userData.file = this.right.userData.file;

    this.right.position.x = tmpB.x;
    this.right.position.z = tmpB.z;
    this.right.userData.file = tmpBF;

    this.back.position.x = tmpL.x;
    this.back.position.z = tmpL.z;
    this.back.userData.file = tmpLF;

    this.left.position.x = tmpF.x;
    this.left.position.z = tmpF.z;
    this.left.userData.file = tmpFF;
  },

  adjust() {
    const tF = cloneDeep(this.front);
    const tB = cloneDeep(this.back);

    console.log(tF);
    console.log(this.front);
    debugger;

    this.front = cloneDeep(this.left);
    this.right = tF;
    this.left = tB;
  },

  replaceModel() {
    const model = store.models[store.active];
    const loader = new GLTFLoader();

    const renderFile = (gltf) => {
      gltf.scene.traverse((child) => {
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

      // position
      {
        const { x, z } = this.back.position;
        gltf.scene.position.x = x;
        gltf.scene.position.z = z;
      }

      gltf.scene.userData.file = model.file;

      // removing the prev
      this.removeBack();
      this.adjust();

      objects.back = gltf.scene;
      scene.add(objects.back);

      renderTxt();
      render();
    };

    loader.load(model.file, renderFile, loading, error);
    function loading(xhr) {
      console.log((xhr.loaded / xhr.total) * 100 + "% loaded");
    }

    function error(err) {
      console.log("An error happened", err);
    }
  },
  nxt() {
    this.nxtMove();
    this.replaceModel();
  },
};

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
  camera.position.set(0, 0, 1500);

  // debugging
  debuggers();

  addAmbientLight();
  addDirLight();
  addOrbitControl();

  //Load the Models
  loadModels();

  function debuggers() {
    const cameraP = gui.addFolder("Camera Position");
    cameraP.add(camera.position, "x", 0).step(0.1).min(0).max(500);
    cameraP.add(camera.position, "y", 200).step(0.1).min(0).max(500);
    cameraP.add(camera.position, "z", 0).step(0.1).min(0).max(500);

    const cameraR = gui.addFolder("Camera Rotation");
    cameraR.add(camera.rotation, "x", 0).step(0.1).min(0).max(Math.PI);
    cameraR.add(camera.rotation, "y", 0).step(0.1).min(0).max(Math.PI);
    cameraR.add(camera.rotation, "z", 0).step(0.1).min(0).max(Math.PI);

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
    // controls.autoRotate = true;
    // controls.autoRotateSpeed = 1.5;

    controls.update();
  }
}

function render() {
  requestAnimationFrame(render);
  renderer.render(scene, camera);
  controls.update();
}

function loadModels() {
  if (objects.length >= 4) return;
  const model = store.models[objects.length];

  const loader = new GLTFLoader();
  loader.load(model.file, renderFile, loading, error);

  function renderFile(gltf) {
    const radius = 800;
    const slice = (2 * Math.PI) / 4;

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

    gltf.scene.userData.file = model.file;

    scene.add(gltf.scene);
    let side = "right";

    if (objects.length === 1) side = "front";
    else if (objects.length === 2) side = "left";
    else if (objects.length === 3) {
      side = "back";
      renderTxt();
    }

    objects[side] = gltf.scene;
    objects.add();
    render();
    loadModels();
  }

  function loading(xhr) {
    if ((xhr.loaded / xhr.total) * 100 === 100) {
      console.log(xhr.currentTarget.responseURL, objects.length);
      console.log((xhr.loaded / xhr.total) * 100 + "% loaded");
    }
  }

  function error(err) {
    console.log("An error happened", err);
  }
}

function controlHandler(e) {
  const { className } = e.target.parentElement;
  if (e.target.matches(".control-con *, .control-con *")) {
    store[className]();
    if (className === "next") {
      // objects.nxtMove();
      // addModel(store.models[store.active]);
      objects.nxt();
    }
    // Todo
    function prevMove() {
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
        }
      }
    }

    function nxtMove() {
      const { x, z } = objects[objects.length - 1].position;

      for (let i = objects.length - 1; i >= 0; i--) {
        let prev = i - 1;
        if (i === 0) {
          objects[i].position.x = x;
          objects[i].position.z = z;
        } else {
          const { x, z } = objects[prev].position;
          objects[i].position.x = x;
          objects[i].position.z = z;
        }
      }
    }
  }
}

function renderTxt() {
  const txtEl = document.querySelector(".txt p");
  const linkTxt = objects.front.userData.file;
  const index = store.active || objects.front.userData.index;

  txtEl.innerHTML = `<a href="./singleModel.html?active=${index}" target="_blank">${linkTxt}</a>`;
}

window.scene = scene;
window.objects = objects;

export { scene, objects };
