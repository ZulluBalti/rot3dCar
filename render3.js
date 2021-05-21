import * as THREE from "https://threejsfundamentals.org/threejs/resources/threejs/r127/build/three.module.js";

import { GLTFLoader } from "https://threejsfundamentals.org/threejs/resources/threejs/r127/examples/jsm/loaders/GLTFLoader.js";

import { OrbitControls } from "https://threejsfundamentals.org/threejs/resources/threejs/r127/examples/jsm/controls/OrbitControls.js";

import { GUI } from "./build/dat.gui.module.js";
import store from "./store.js";

const gui = new GUI();

const canvas = document.querySelector("#c");
const renderer = new THREE.WebGLRenderer({ canvas });

main();

function main() {
  const asp = window.innerWidth / window.innerHeight;
  const camera = new THREE.PerspectiveCamera(45, asp, 0.01, 2000);
  camera.position.z = 1000;
  const scene = new THREE.Scene();
  scene.background = new THREE.Color("black");

  addHeimLight();
  addDirLight();
  addModel();
  addOrbitControl();
  render();

  addCameraCtrl();
  function addCameraCtrl() {
    const cameraCtrl = gui.addFolder("Camera");
    cameraCtrl.add(camera.position, "x", 0).min(0).max(1500).step(1);
    cameraCtrl.add(camera.position, "y", 0).min(0).max(1500).step(1);
    cameraCtrl.add(camera.position, "z", 10).min(0).max(1500).step(1);
  }

  function addOrbitControl() {
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.rotateSpeed = 0.5;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.2;
  }

  function addModel() {
    const active = window.location.search.slice(1).split("=")[1];
    const dir = store.models[active];
    const loader = new GLTFLoader();
    loader.load(
      dir.file,
      (gltf) => {
        addModelCtrls(gltf.scene, dir);
        gltf.scene.traverse(function (child) {
          if (child instanceof THREE.Mesh) {
            if (dir.color) child.material.color = new THREE.Color(dir.color);

            child.geometry.computeVertexNormals();
          }
        });

        // Scaling
        {
          const { x, y, z } = dir.oS;
          gltf.scene.scale.set(x, y, z);
        }

        // Rotation
        {
          const { x, y, z } = dir.oR;
          gltf.scene.rotation.set(x, y, z);
        }

        scene.add(gltf.scene);
        render();
      },
      null,
      (err) => console.log(err)
    );
  }

  function addModelCtrls(model, d) {
    const modelCtrl = gui.addFolder("Model rotation");
    {
      const { x, y, z } = d.oR;

      modelCtrl.add(model.rotation, "x", x).min(0).max(Math.PI).step(0.1);
      modelCtrl.add(model.rotation, "y", y).min(0).max(Math.PI).step(0.1);
      modelCtrl.add(model.rotation, "z", z).min(0).max(Math.PI).step(0.1);
    }

    const modelS = gui.addFolder("Model scale");
    {
      const { x, y, z } = d.oS;
      modelS.add(model.scale, "x", x).min(0).max(60).step(0.01);
      modelS.add(model.scale, "y", y).min(0).max(60).step(0.01);
      modelS.add(model.scale, "z", z).min(0).max(60).step(0.01);
    }

    const modelP = gui.addFolder("Model Position");
    modelP.add(model.position, "x", 0).min(-500).max(500).step(0.01);
    modelP.add(model.position, "y", 0).min(-500).max(500).step(0.01);
    modelP.add(model.position, "z", 0).min(-500).max(500).step(0.01);
  }

  function addHeimLight() {
    const skyColor = 0xb1e1ff; // light blue
    const groundColor = 0xb97a20; // brownish orange
    const intensity = 1;
    const light = new THREE.HemisphereLight(skyColor, groundColor, intensity);
    scene.add(light);
  }

  function addDirLight() {
    const color = 0xffffff;
    const intensity = 1;
    const light = new THREE.DirectionalLight(color, intensity);
    light.position.set(5, 10, 2);
    scene.add(light);
    scene.add(light.target);
  }

  function resizeRendererToDisplaySize(renderer) {
    const canvas = renderer.domElement;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    const needResize = canvas.width !== width || canvas.height !== height;
    if (needResize) {
      renderer.setSize(width, height, false);
    }
    return needResize;
  }

  function render() {
    if (resizeRendererToDisplaySize(renderer)) {
      const canvas = renderer.domElement;
      camera.aspect = canvas.clientWidth / canvas.clientHeight;
      camera.updateProjectionMatrix();
    }

    renderer.render(scene, camera);
    requestAnimationFrame(render);
  }
}
