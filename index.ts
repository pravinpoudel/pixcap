import {
  Engine,
  Scene,
  ArcRotateCamera,
  HemisphericLight,
  Vector3,
  MeshBuilder,
  HighlightLayer,
  Quaternion,
  OimoJSPlugin,
  PhysicsImpostor,
  StandardMaterial,
  Color3,
  Camera,
  AbstractMesh,
  Mesh,
} from "babylonjs";

import cannon from "cannon";
window.CANNON = cannon;

import "babylonjs-loaders";

const canvas = document.getElementById("canvas");
if (!(canvas instanceof HTMLCanvasElement))
  throw new Error("Couldn't find a canvas. Aborting the demo");
canvas.addEventListener("pointermove", onPointerMove, false);
canvas.addEventListener("dblclick", selectMesh, false);
const engine = new Engine(canvas, true, {});
const scene = new Scene(engine);
scene.enablePhysics();
interface Position2D {
  x: number;
  y: number;
}
let mousePointer = {} as Position2D;
let highLightLayer: HighlightLayer;
let camera: ArcRotateCamera;
let selectedMesh: AbstractMesh | null;
let sceneObjects: Array<Mesh> = [];
let icosphere: Mesh;

function prepareScene() {
  // Camera
  camera = new ArcRotateCamera(
    "camera",
    Math.PI / 2,
    Math.PI / 2.5,
    4,
    new Vector3(0, 0, 0),
    scene
  );
  camera.attachControl(canvas, true);

  // Light
  new HemisphericLight("light", new Vector3(0.5, 1, 0.8).normalize(), scene);

  // Objects
  const plane = MeshBuilder.CreateBox("Plane", {}, scene);
  plane.rotationQuaternion = Quaternion.FromEulerAngles(0, Math.PI, 0);
  sceneObjects.push(plane);

  icosphere = MeshBuilder.CreateIcoSphere("IcoSphere", {}, scene);
  icosphere.position.set(-2, 15, 0);
  sceneObjects.push(icosphere);
  icosphere.physicsImpostor = new PhysicsImpostor(
    icosphere,
    BABYLON.PhysicsImpostor.SphereImpostor,
    { mass: 2, restitution: 0.9 },
    scene
  );

  const cylinder = MeshBuilder.CreateCylinder("Cylinder", {}, scene);
  cylinder.position.set(2, 0, 0);
  sceneObjects.push(cylinder);
  addGround();
}

function addGround() {
  const ground = MeshBuilder.CreateGround(
    "ground",
    { width: 2000, height: 200, subdivisions: 1000 },
    scene
  );
  // var ground = new Mesh("ground", scene);
  const myMaterial = new StandardMaterial("myMaterial", scene);
  myMaterial.diffuseColor = new Color3(1, 0, 1);
  ground.material = myMaterial;
  ground.position.y = -5;
  ground.physicsImpostor = new PhysicsImpostor(
    ground,
    BABYLON.PhysicsImpostor.BoxImpostor,
    { mass: 0, restitution: 0.9 },
    scene
  );
}

function init() {
  highLightLayer = new HighlightLayer("highlight", scene);
}

function onPointerMove(e: MouseEvent) {
  mousePointer.x = scene.pointerX;
  mousePointer.y = scene.pointerY;
}

function clearUI() {
  (document.getElementsByClassName("menu-UI")[0] as HTMLElement).style.display =
    "none";
}

function showPlaneUI(
  selectedMesh: AbstractMesh,
  dimension: { x: number; y: number; z: number }
) {
  let mainMenu = document.getElementsByClassName("menu-UI")[0] as HTMLElement;
  mainMenu.style.display = "block";
  console.log(mousePointer);
  mainMenu.style.left = mousePointer.x + "px";
  mainMenu.style.top = mousePointer.y + "px";

  let attributeDiv = document.getElementById("attributes_div") as HTMLElement;
  attributeDiv.innerHTML = "";
  type dimType = keyof typeof dimension;
  type attrType = keyof typeof selectedMesh.scaling;
  for (let key in dimension) {
    let element = `<label for="${key}"> ${key}: </label>  <input type="number" class="dimensionInput" id=${key} value="${
      dimension[key as dimType]
    }" min="0.2" max="2.0"  data-attr=${key} > <hr />`;
    attributeDiv.innerHTML += element;
  }
  let inputElements = document.getElementsByClassName("dimensionInput");
  for (let i = 0; i < inputElements.length; i++) {
    inputElements[i].addEventListener("input", (event) => {
      let inputValue = (event.target as HTMLInputElement).value;
      let value = Math.min(2.0, +inputValue) as number;
      value = Math.max(0.2, value);
      let changedAttr = (event.target as HTMLInputElement).dataset.attr;
      console.log(selectedMesh.scaling);
      if (changedAttr == "x") {
        selectedMesh.scaling.x = value;
        selectedMesh.computeWorldMatrix(true);
        selectedMesh.refreshBoundingInfo();
      }
      if (changedAttr == "y") {
        selectedMesh.scaling.y = value;
        selectedMesh.computeWorldMatrix(true);
        selectedMesh.refreshBoundingInfo();
      }

      if (changedAttr == "z") {
        selectedMesh.scaling.z = value;
        selectedMesh.computeWorldMatrix(true);
        selectedMesh.refreshBoundingInfo();
      }
    });
  }
}

function createSphere(subdivisionRatio: number) {
  icosphere = MeshBuilder.CreateIcoSphere(
    "icosphere",
    { radius: 0.5, flat: true, subdivisions: subdivisionRatio * 32 },
    scene
  );
  icosphere.position.set(-2, 0, 0);
}

function showSphereUI(radius: number) {
  console.log(radius);
}

function showCylinderUI(height: number, radius: number) {
  console.log(height, radius);
}

function showUI(selectedMesh: Mesh) {
  let name = selectedMesh.name;
  name = name.toLowerCase();
  switch (name) {
    case "plane":
      var boundingBox = selectedMesh.getBoundingInfo().boundingBox;
      console.log(boundingBox);
      let dimension = {
        x: boundingBox.maximumWorld.x - boundingBox.minimumWorld.x,
        y: boundingBox.maximumWorld.y - boundingBox.minimumWorld.y,
        z: boundingBox.maximumWorld.z - boundingBox.minimumWorld.y,
      };
      showPlaneUI(selectedMesh, dimension);
      break;
    case "icosphere":
      let radius = selectedMesh.getBoundingInfo().boundingSphere.radius;
      showSphereUI(radius);
      break;
    case "cylinder":
      var boundingBox = selectedMesh.getBoundingInfo().boundingBox;
      let height = boundingBox.maximum.y - boundingBox.minimum.y;
      let cyRadius = boundingBox.maximum.x;
      showCylinderUI(height, cyRadius);
      break;
    default:
      console.log("name is not detected");
  }
}

function selectMesh() {
  let intersection = scene.pick(
    mousePointer.x,
    mousePointer.y,
    undefined,
    undefined,
    camera
  );
  //  right now we only have three mesh in scene
  if (intersection?.hit && intersection.pickedMesh) {
    // check if selected elements are expected elements
    if (selectedMesh != intersection.pickedMesh) {
      console.log("selected for first time");
      selectedMesh = intersection.pickedMesh;
      console.log(selectedMesh);
      highLightLayer.removeAllMeshes();
      highLightLayer.addMesh(selectedMesh as Mesh, BABYLON.Color3.Red());
      showUI(selectedMesh as Mesh);
    }
  } else {
    highLightLayer.removeAllMeshes();
    selectedMesh = null;
    clearUI();
  }
}

prepareScene();
init();

engine.runRenderLoop(() => {
  scene.render();
});

window.addEventListener("resize", () => {
  engine.resize();
});
