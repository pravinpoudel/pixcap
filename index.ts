import {
  Engine,
  Scene,
  ArcRotateCamera,
  HemisphericLight,
  Vector3,
  MeshBuilder,
  HighlightLayer,
  Quaternion,
  Camera,
  AbstractMesh,
  Mesh,
} from "babylonjs";

import "babylonjs-loaders";

const canvas = document.getElementById("canvas");
if (!(canvas instanceof HTMLCanvasElement))
  throw new Error("Couldn't find a canvas. Aborting the demo");
canvas.addEventListener("pointermove", onPointerMove, false);
canvas.addEventListener("dblclick", selectMesh, false);
const engine = new Engine(canvas, true, {});
const scene = new Scene(engine);
interface Position2D {
  x: number;
  y: number;
}
let mousePointer = {} as Position2D;
let highLightLayer: HighlightLayer;
let camera: ArcRotateCamera;
let selectedMesh: AbstractMesh;
let sceneObjects: Array<Mesh> = [];

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

  const icosphere = MeshBuilder.CreateIcoSphere("IcoSphere", {}, scene);
  icosphere.position.set(-2, 0, 0);
  sceneObjects.push(icosphere);

  const cylinder = MeshBuilder.CreateCylinder("Cylinder", {}, scene);
  cylinder.position.set(2, 0, 0);
  sceneObjects.push(cylinder);

  highLightLayer = new HighlightLayer("highlight", scene);
}

function onPointerMove(e: MouseEvent) {
  mousePointer.x = scene.pointerX;
  mousePointer.y = scene.pointerY;
}

function clearUI() {}

function showUI(selectedMesh: Mesh) {
  selectedMesh.scaling.x = 2;
  selectedMesh.computeWorldMatrix();
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
    if (selectedMesh != intersection.pickedMesh) {
      console.log("selected for first time");
      selectedMesh = intersection.pickedMesh;
      highLightLayer.removeAllMeshes();
      highLightLayer.addMesh(selectedMesh as Mesh, BABYLON.Color3.Red());
      showUI(selectedMesh as Mesh);
    }
  } else {
    highLightLayer.removeAllMeshes();
    clearUI();
  }
}

prepareScene();

engine.runRenderLoop(() => {
  scene.render();
});

window.addEventListener("resize", () => {
  engine.resize();
});
