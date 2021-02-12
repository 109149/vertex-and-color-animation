import * as THREE from "three";
import { TrackballControls } from "three/examples/jsm/controls/TrackballControls";

let controls, scene, renderer, camera, axes;

let canvas;

let geometry, material;

let COLOR_TYPES = {
  NoColor: "NoColor", // 0, THREE.NoColors
  OnePerFace: "OnePerFace", // 1, THREE.FaceColors
  ThreePerFace: "ThreePerFace", // 2, THREE.VertexColors
  OnePerVertex: "OnePerVertex", // 3
};

let colorType = COLOR_TYPES.OnePerFace;

let faceColors; // COLOR_TYPES.OnePerFace
let faceColorsVelocities = []; // array of velocities at which COLOR_TYPES.OnePerFace changes

let faceVertexColors; // COLOR_TYPES.ThreePerFace
let faceVertexColorsVelocities = []; // array of velocities at which COLOR_TYPES.ThreePerFace changes

let vertexColors; // COLOR_TYPES.OnePerVertex
let vertexColorsVelocities = []; // array of velocities at which COLOR_TYPES.OnePerVertex changes

let vertexAnimData = [];

let wireSphere;

let colorAnimation = true; // for saving state of colorAnimationCheckbox when it is disabled

let clock;
let animating = false;

function render() {
  renderer.render(scene, camera);
}

function createWorld() {
  axes = new THREE.AxesHelper(10);
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(
    50,
    canvas.width / canvas.height,
    0.1,
    100
  );
  camera.position.set(0, 0, 40);

  let light = new THREE.DirectionalLight();
  light.position.set(0, 0, 1);
  camera.add(light);

  scene.add(camera);
  scene.add(new THREE.AmbientLight(0x222222));

  geometry = new THREE.IcosahedronGeometry(10, 2);

  vertexColors = [];
  vertexColorsVelocities = [];
  initVertexColorsAndVelocities();

  faceColors = [];
  faceColorsVelocities = [];
  initFaceColorsAndVelocities();

  faceVertexColors = [];
  faceVertexColorsVelocities = [];
  initFaceVertexColorsAndVelocities();

  material = new THREE.MeshLambertMaterial({
    polygonOffset: true,
    polygonOffsetUnits: 1,
    polygonOffsetFactor: 1,
    color: "white", // will only be used when vertexColors is set to THREE.NoColors, for "No Colors" option.
    vertexColors: THREE.FaceColors, // initially, face colors come from geometry, one color per face
  });

  for (let i = 0; i < geometry.faces.length; i++) {
    geometry.faces[i].color = faceColors[i];
  }

  let sphere = new THREE.Mesh(geometry, material);
  wireSphere = new THREE.Mesh(
    geometry,
    new THREE.MeshBasicMaterial({ color: 0, wireframe: true })
  );

  scene.add(sphere);
  sphere.add(wireSphere);
}

/* Create the random colors and velocities for "One Color Per Vertex" COLOR_TYPES.OnePerVertex */
function initVertexColorsAndVelocities() {
  for (let i = 0; i < geometry.vertices.length; i++) {
    let c = new THREE.Color();
    c.setHSL(Math.random(), 0.7, 0.4);
    vertexColors.push(c);
    let v = 0.001 + 0.002 * Math.random();
    vertexColorsVelocities.push(v);
  }
}

/* Create the random colors and color velocities for "One color per face" COLOR_TYPES.OnePerFace */
function initFaceColorsAndVelocities() {
  for (let i = 0; i < geometry.faces.length; i++) {
    let c = new THREE.Color();
    c.setHSL(Math.random(), 0.7, 0.4);
    let v = 0.001 + 0.002 * Math.random();
    faceColors.push(c);
    faceVertexColorsVelocities.push(v);
  }
}

/* Create individual colors and velocities for each vertex of each face, for "Three colors per face" COLOR_TYPES.ThreePerFace */
function initFaceVertexColorsAndVelocities() {
  for (let i = 0; i < geometry.faces.length; i++) {
    let colors = [];
    let vs = [];
    for (let j = 0; j < 3; j++) {
      let c = new THREE.Color();
      c.setHSL(Math.random(), 0.7, 0.5);
      colors.push(c);
      let v = 0.001 + 0.002 * Math.random();
      vs.push(v);
    }
    faceVertexColors.push(colors);
    faceVertexColorsVelocities.push(vs);
  }
}

function updateFrame() {
  let c = {
    h: 0,
    s: 0,
    l: 0,
  };
  if (document.querySelector("#colorAnimationCheckbox").checked) {
    switch (colorType) {
      case COLOR_TYPES.OnePerFace: {
        for (let i = 0; i < faceColorsVelocities.length; i++) {
          geometry.faces[i].color.getHSL(c);
          c.h += faceColorsVelocities[c];
          if (c.h > 1) {
            c.h -= 1;
          }
          geometry.faces[i].color.seHSL(c.h, c.s, c.l);
        }
        break;
      }
      case COLOR_TYPES.ThreePerFace: {
        for (let i = 0; i < geometry.faces.length; i++) {
          let f = geometry.faces[i];
          for (let j = 0; j < 3; j++) {
            f.vertexColors[j].getHSL(c);
            c.h += faceVertexColorsVelocities[i][j];
            if (c.h > 1) {
              c.h -= 1;
            }
            f.vertexColors[j].setHSL(c.h, c.s, c.l);
          }
        }
        break;
      }
      case COLOR_TYPES.OnePerVertex: {
        for (let i = 0; i < vertexColors.length; i++) {
          vertexColors[i].getHSL(c);
          c.h += vertexColorsVelocities[i];
          if (c.h > 1) {
            c.h -= 1;
          }
          vertexColors[i].setHSL(c.h, c.s, c.l);
        }
        break;
      }
      default:
        break;
    }
    geometry.colorsNeedUpdate = true;
  }

  if (document.querySelector("#vertexAnimationCheckbox").checked) {
    if (
      vertexAnimData.length == 0 ||
      (vertexAnimData.length < 12 && Math.random() < 0.1)
    ) {
      let ad = {};

      while (true) {
        ad.vertexNum = Math.floor(geometry.vertices.length * Math.random());
        let used = false;
        for (let i = 0; i < vertexAnimData; i++) {
          if (ad.vertexNum == vertexAnimData.vertexNum) {
            used = true;
            break;
          }
        }
        if (!used) break;
      }

      ad.length = 10; // This is the initial length of the vector of vertex coords.
      ad.direction = 0; // 0 says vertex is moving away from the center; 1 says it's moving back.
      ad.maxLength = 12 + 8 * Math.random(); // The length at which it will start moving back.
      ad.velocity = 0.03 + 0.1 * Math.random(); // Amount added to length in each frame.
      vertexAnimData.push(ad); // Add item to the array of vertex animation data.
    }

    for (let i = vertexAnimData.length - 1; i >= 0; i--) {
      let ad = vertexAnimData[i];
      let vertex = geometry.vertices[ad.vertexNum];
      if (ad.direction == 0) {
        ad.length += ad.velocity;
        if (ad.length > ad.maxLength) ad.direction = 1;
      } else {
        ad.length -= ad.velocity;
        if (ad.length < 10) {
          ad.length = 10;
          vertexAnimData.splice(i, 1);
        }
      }
      vertex.setLength(ad.length);
    }
    geometry.verticesNeedUpdate = true;
  }
}

function resetVertices() {
  for (let i = 0; i < vertexAnimData.length; i++) {
    geometry.vertices[vertexAnimData[i].vertexNum].setLength(10);
    geometry.verticesNeedUpdate = true;
  }
  vertexAnimData = [];

  if (!animating) render();
}

function doShowWireframeCheckbox() {
  wireSphere.material.visible = document.querySelector(
    "#showWireframeCheckbox"
  ).checked;

  if (!animating) render();
}

function doColorTypeSelect() {
  let i;
  let animCheck = document.querySelector("#colorAnimationCheckbox");
  if (colorType == COLOR_TYPES.NoColor) {
    animCheck.checked = colorAnimation;
    animCheck.disabled = false;
  }

  if (colorType == COLOR_TYPES.OnePerFace) {
    for (let i = 0; i < geometry.faces.length; i++) {
      geometry.faces[i].color = new THREE.Color(0xffffff);
    }
  } else if (
    colorType == COLOR_TYPES.ThreePerFace ||
    colorType == COLOR_TYPES.OnePerVertex
  ) {
    for (let i = 0; i < geometry.faces.length; i++) {
      geometry.faces[i].vertexColors = [];
    }
  }

  colorType = document.querySelector("#colorTypeSelect").value;
  if (colorType == COLOR_TYPES.NoColor) {
    colorAnimation = animCheck.checked;
    animCheck.disabled = true;
    animCheck.checked = false;
  } else if (colorType == COLOR_TYPES.OnePerFace) {
    for (let i = 0; i < geometry.faces.length; i++) {
      geometry.faces[i].color = faceColors[i];
    }
  } else if (colorType == COLOR_TYPES.ThreePerFace) {
    for (let i = 0; i < geometry.faces.length; i++) {
      geometry.faces[i].vertexColors = faceVertexColors[i];
    }
  }

  if (colorType == COLOR_TYPES.OnePerVertex) {
    for (let i = 0; i < geometry.faces.length; i++) {
      let f = geometry.faces[i];
      f.vertexColors = [
        vertexColors[f.a], // color for first vertex (f.a) of this face
        vertexColors[f.b], // color for second vertex (f.b) of this face
        vertexColors[f.c], // color for third vertex (f.c) of this face
      ];
    }
  }

  if (colorType == COLOR_TYPES.NoColor) material.vertexColors = THREE.NoColors;
  else if (colorType == COLOR_TYPES.OnePerFace)
    material.vertexColors = THREE.FaceColors;
  else material.vertexColors = THREE.VertexColors;

  material.needsUpdate = true;
  geometry.colorsNeedUpdate = true;
  geometry.elementsNeedUpdate = true;
  doAnimationCheckbox();
  if (!animating) render();

  document.querySelector("#resetVertices").focus();
}

function doFrame() {
  if (animating) {
    clock.frameNumber++;
    updateFrame();
    requestAnimationFrame(doFrame);
  }
}

function startAnimation() {
  if (!animating) {
    if (!clock) {
      clock = new THREE.Clock(false);
      clock.frameNumber = 0;
      clock.getFrameNumber = function () {
        return this.frameNumber;
      };
    }
    clock.start();
    animating = true;
    requestAnimationFrame(doFrame);
  }
}

function pauseAnimation() {
  if (animating) {
    clock.stop();
    animating = false;
  }
}

function doAnimationCheckbox() {
  if (
    document.querySelector("#colorAnimationCheckbox").checked ||
    document.querySelector("#vertexAnimationCheckbox").checked
  ) {
    startAnimation();
  } else {
    pauseAnimation();
  }
}

function installTrackballControls() {
  controls = new TrackballControls(camera, canvas);
  controls.noPan = true;
  controls.noZoom = true;
  controls.staticMoving = true;
  function move() {
    controls.update();
    if (!animating) {
      render();
    }
  }
  function down() {
    document.addEventListener("mousemove", move, false);
  }
  function up() {
    document.removeEventListener("mousemove", move, false);
  }
  function touch(event) {
    if (event.touches.length == 1) {
      move();
    }
  }
  canvas.addEventListener("mousedown", down, false);
  canvas.addEventListener("touchmove", touch, false);
}

function init() {
  try {
    canvas = document.querySelector("#scene");
    renderer = new THREE.WebGLRenderer({
      antialias: true,
      canvas,
    });
  } catch (e) {
    document.getElementById("canvas-holder").innerHTML =
      "<p><b>Sorry, an error occurred:<br>" + e + "</b></p>";
    return;
  }

  document.querySelector("#colorTypeSelect").onchange = doColorTypeSelect;
  document.querySelector(
    "#colorAnimationCheckbox"
  ).onchange = doAnimationCheckbox;
  document.querySelector(
    "#vertexAnimationCheckbox"
  ).onchange = doAnimationCheckbox;
  document.querySelector("#resetVertices").onclick = resetVertices;
  document.querySelector(
    "#showWireframeCheckbox"
  ).onchange = doShowWireframeCheckbox;

  document.getElementById("colorAnimationCheckbox").checked = false;
  document.getElementById("colorAnimationCheckbox").disabled = false;
  document.getElementById("vertexAnimationCheckbox").checked = false;
  document.getElementById("showWireframeCheckbox").checked = true;
  document.getElementById("colorTypeSelect").value = COLOR_TYPES.OnePerFace;

  createWorld();
  installTrackballControls();
  animate();
}

function animate() {
  controls.update();
  render();
  requestAnimationFrame(animate);
}

export default init;
