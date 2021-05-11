import * as THREE from "https://cdn.skypack.dev/three";

import { OrbitControls } from "https://cdn.skypack.dev/three/examples/jsm/controls/OrbitControls.js";
import { OBJLoader } from "https://cdn.skypack.dev/three/examples/jsm/loaders/OBJLoader.js";
import { MTLLoader } from "https://cdn.skypack.dev/three/examples/jsm/loaders/MTLLoader.js";
import assests from "./assests/data.js";

var renderer, scene, camera;
let controls;
let objects = [];
let raycaster, mouse;

var ww = window.innerWidth,
  wh = window.innerHeight;

function init() {
  renderer = new THREE.WebGLRenderer({ antialis: true });
  document.querySelector(".scene").appendChild(renderer.domElement);
  renderer.setSize(ww, wh);
  raycaster = new THREE.Raycaster();
  mouse = new THREE.Vector3();

  scene = new THREE.Scene();

  camera = new THREE.PerspectiveCamera(50, ww / wh, 0.1, 2000);
  camera.position.set(0, 200, 0);

  scene.add(camera);

  {
    const color = 0xb97a20; // brownish orange
    const intensity = 1;
    const hLight = new THREE.AmbientLight(color, intensity);
    scene.add(hLight);
  }

  {
    const color = 0xffffff;
    const intensity = 1;
    const light = new THREE.DirectionalLight(color, intensity);
    light.position.set(5, 10, 2);
    scene.add(light);
    scene.add(light.target);
  }

  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.rotateSpeed = 0.5;
  controls.autoRotate = true;
  controls.autoRotateSpeed = 0.2;

  controls.update();

  //Load the obj file
  loadOBJ();
}

var loadOBJ = function () {
  assests.forEach((assest) => {
    if (assest.m) addObj_N_MTL(assest);
    else addObj(assest);
  });

  function addObj_N_MTL(assest) {
    const mtLoader = new MTLLoader();

    mtLoader.load(assest.m, function (materials) {
      materials.preload();

      const obLoader = new OBJLoader();
      obLoader.setMaterials(materials);
      loadObject(obLoader, assest);
    });
  }

  function addObj(assest) {
    const obLoader = new OBJLoader();
    loadObject(obLoader, assest);
  }

  function loadObject(loader, assest) {
    loader.load(assest.o, function (object) {
      object.traverse(function (child) {
        if (child instanceof THREE.Mesh) {
          if (assest.color) child.material.color = new THREE.Color(assest.c);
          child.geometry.computeVertexNormals();
        }
      });

      // Adding text
      addTxt(object, assest);
      render();
    });
  }
  function addTxt(root, assest) {
    const load2 = new THREE.FontLoader();

    load2.load("fonts/helvetiker_regular.typeface.json", function (font) {
      const textGeo = new THREE.TextGeometry(assest.txt, {
        font: font,
        size: 2,
        height: 1,
        curveSegments: 21,
        bevelEnabled: false,
      });

      const textMaterial = new THREE.MeshPhongMaterial({ color: 0xdddddd });
      const mesh = new THREE.Mesh(textGeo, textMaterial);

      // Text Rotation
      const { txtR } = assest;
      mesh.rotation.set(txtR.x, txtR.y, txtR.z);

      // Text Position
      const { txtP } = assest;
      mesh.position.set(txtP.x, txtP.y, txtP.z);

      // Object Scaling
      const { oS } = assest;
      root.scale.set(oS.x, oS.y, oS.z);

      // Object Rotation
      const { oR } = assest;
      root.rotation.set(oR.x, oR.y, oR.z);

      // Adding the link
      const group = new THREE.Group();
      group.userData.link = assest.link;
      root.userData.link = assest.link;
      mesh.userData.link = assest.link;

      group.add(root);
      group.add(mesh);

      const radius = 50;
      const slice = (2 * Math.PI) / assests.length;

      const angle = slice * objects.length;
      group.position.x = Math.cos(angle) * radius;
      group.position.z = Math.sin(angle) * radius;

      scene.add(group);
      objects.push(group);
    });
  }
};

function loadTexture(textureUrl) {
  const Tloader = new THREE.TextureLoader();
  const map = Tloader.load(textureUrl);
  const material = new THREE.MeshPhongMaterial({ map: map });
  return material;
}

function onMouseClick(event) {
  mouse.set(
    (event.clientX / window.innerWidth) * 2 - 1,
    -(event.clientY / window.innerHeight) * 2 + 1,
    0.5
  ); // z = 0.5 important!

  mouse.unproject(camera);
  raycaster.set(camera.position, mouse.sub(camera.position).normalize());

  const intersects = raycaster.intersectObjects(scene.children, true);

  for (let i = 0; i < intersects.length; i++) {
    openLink(intersects[i].object);
  }
}
window.addEventListener("click", onMouseClick, false);

function openLink(obj) {
  let url;
  if (obj.userData && obj.userData.link) {
    // open link
    url = obj.userData.link;
  } else if (obj.parent && obj.parent.userData && obj.parent.userData.link) {
    // open link
    url = obj.parent.userData.link;
  }
  if (url) window.open(url, "_blank");
}
const render = function () {
  requestAnimationFrame(render);

  // Rotate the objects
  for (let object of objects) {
    object.rotation.z += 0.005;
    object.rotation.x += 0.002;
  }

  renderer.render(scene, camera);
  controls.update();
};

init();
