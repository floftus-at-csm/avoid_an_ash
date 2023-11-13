//=========================================================
// import necessary modules
import * as THREE from "https://threejsfundamentals.org/threejs/resources/threejs/r132/build/three.module.js";
export {THREE};
import { GLTFLoader } from "https://threejsfundamentals.org/threejs/resources/threejs/r132/examples/jsm/loaders/GLTFLoader.js";
import { PointerLockControls } from "https://threejsfundamentals.org/threejs/resources/threejs/r132/examples/jsm/controls/PointerLockControls.js";
import { EffectComposer } from "https://threejsfundamentals.org/threejs/resources/threejs/r132/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "https://threejsfundamentals.org/threejs/resources/threejs/r132/examples/jsm/postprocessing/RenderPass.js";
import { AfterimagePass } from "https://threejsfundamentals.org/threejs/resources/threejs/r132/examples/jsm/postprocessing/AfterimagePass.js";
import { PencilLinesPass } from "/PencilLinesPass.js";
import TouchControls from "./js/TouchControls.js";

//=========================================================
// Check Device
let os = getOS();
let debugOn = false;
if (debugOn) console.log(os);
let touchDevice = is_touch_enabled();
if (debugOn) console.log("is this a touch device? ", touchDevice);
let desktop = false;
let inRaycaster = false;
let mainAfterImageVal = 0.7;

if (os == "Windows" || os == "Mac OS" || os == "Linux") {
  desktop = true;
  if (debugOn) console.log("desktop");
} else {
  if (touchDevice) {
    if (debugOn) console.log("touch device");
  } else {
    desktop = true;
    if (debugOn) console.log("unknown device");
  }
}
//=========================================================
// set up scene
const scene = new THREE.Scene();
scene.background = new THREE.Color("rgb(153, 124, 49)");

scene.overrideMaterial = null;

//=========================================================
// set up lighting
addLights();

//=========================================================
// set up camera

const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
camera.position.z = 5;
camera.position.y = -2;

//=========================================================
// set up renderer
const renderer = new THREE.WebGLRenderer({ antialias: true });
let canvasWidth;
let canvasHeight;
let aspect;
if (desktop) {
  canvasWidth = window.innerWidth / 2;
  canvasHeight = window.innerHeight / 2;
} else {
  canvasWidth = window.innerWidth - 50;
  canvasHeight = window.innerHeight - 150;
}
renderer.setSize(canvasWidth, canvasHeight);
aspect = canvasWidth / canvasHeight;
renderer.setClearColor("#eee");
renderer.physicallyCorrectLights = true;
renderer.outputEncoding = THREE.sRGBEncoding;
renderer.toneMapping = THREE.ACESFilmicToneMapping; // originally: CineonToneMapping
renderer.toneMappingExposure = 1.75; // originall 1.75
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
if (debugOn) console.log(renderer);
var content = document.getElementsByClassName("content");
content[0].appendChild(renderer.domElement);

//=========================================================
// load 3d models
const loader = new GLTFLoader();
const collideableObjects = [];
const specialObjects = [];
let raycaster, raycaster2;
let dino;
let navmesh;
let canStart = false;
let mobileStart = false;
let loadingTrigger = false;

loader.load(
  // "https://cdn.glitch.me/3b6ae790-11fe-459a-8ac8-c2a0b10ed2b9/FullLandscape2.glb?v=1680860285362",
  // "https://cdn.glitch.me/3b6ae790-11fe-459a-8ac8-c2a0b10ed2b9/FullLandscape3.glb?v=1681247059540",
  // "https://cdn.glitch.me/3b6ae790-11fe-459a-8ac8-c2a0b10ed2b9/FullLandscapeReduced.glb?v=1682153617463",
  "content/FullLandscape3.glb",
  function (gltf) {
    scene.add(gltf.scene);
    dino = gltf.scene;
    dino.position.setY(-1);
    // dino.scale.set(2,1.5,1.5);
    dino.traverse(function (node) {
      if (node instanceof THREE.Mesh) {
        if (node.name == "allInOne_Exported_NavMesh001") {
          node.material.format = THREE.RGBAFormat;
          node.material.transparent = true;
          node.material.depthWrite = false;
          node.material.opacity = 0.0;
          navmesh = node;
          collideableObjects.push(navmesh);
        } else {
          node.castShadow = true;
          node.receiveShadow = true;
        }
      }
      var instructionsContainer = document.getElementById("instructions");
      if (desktop) {
        instructionsContainer.innerHTML =
          "<div id='instructions_container'><p >Click to play</p></div>";
      } else {
        var viewfinderContainer = document.getElementById("viewfinder");
        var blocker = document.getElementById("blocker");
        instructionsContainer.innerHTML = "";
        viewfinderContainer.innerHTML =
          "<p id='viewfinderText1'></p><img src='https://cdn.glitch.global/3b6ae790-11fe-459a-8ac8-c2a0b10ed2b9/Asset%2022frame2.svg?v=1681724178813' id='viewFinderBorderMobile'/>";
        blocker.style.backgroundColor = "transparent";
        // setTimeout(timeoutMobile(), 2000);
      }
      loadingTrigger = true;
    });
    if(!desktop){
      timeoutMobile();
        if(debugOn)console.log("calling timeout mobile");
    }
  },
  undefined,
  function (error) {
    console.error(error);
  }
);

let dinoTest = await addModel(
  loader,
  // "https://cdn.glitch.global/3b6ae790-11fe-459a-8ac8-c2a0b10ed2b9/dinotest.glb?v=1681246575590",
  "https://cdn.glitch.global/3b6ae790-11fe-459a-8ac8-c2a0b10ed2b9/dinoTiny.glb?v=1682154563386",
  -17.5,
  7,
  -5,
  0,
  null,
  "dinotest"
);
dinoTest.scale.set(5, 5, 5);

let redMarks = await addModel(
  loader,
  "https://cdn.glitch.global/3b6ae790-11fe-459a-8ac8-c2a0b10ed2b9/redMarksSmall.glb?v=1682154537923",
  -22.5,
  8,
  -15,
  0,
  null,
  "redMarks"
);
redMarks.scale.set(5, 5, 5);

let curve2 = await addModel(
  loader,
  "https://cdn.glitch.global/3b6ae790-11fe-459a-8ac8-c2a0b10ed2b9/curve2.glb?v=1681246598791",
  -21.5,
  8,
  -22,
  0,
  null,
  "curve2"
);
curve2.scale.set(5, 5, 5);

let duo = await addModel(
  loader,
  "https://cdn.glitch.global/3b6ae790-11fe-459a-8ac8-c2a0b10ed2b9/duoSmall.glb?v=1682156013186",
  -20.5,
  0,
  -15,
  0,
  null,
  "duo"
);
duo.scale.set(5, 5, 5);

let yellow = await addModel(
  loader,
  "https://cdn.glitch.global/3b6ae790-11fe-459a-8ac8-c2a0b10ed2b9/yellowSmall.glb?v=1682155256815",
  15.5,
  5,
  -15,
  0,
  null,
  "yellow"
);
yellow.scale.set(5, 5, 5);

let curve = await addModel(
  loader,
  "https://cdn.glitch.global/3b6ae790-11fe-459a-8ac8-c2a0b10ed2b9/curve.glb?v=1681246592891",
  13.5,
  7,
  -10,
  0,
  null,
  "curve"
);
curve.scale.set(5, 5, 5);

let pirate = await addModel(
  loader,
  "https://cdn.glitch.global/3b6ae790-11fe-459a-8ac8-c2a0b10ed2b9/newPirate.glb?v=1680861206114",
  -10.5,
  0,
  -1,
  0,
  specialObjects,
  "pirate"
);

let pirateTrigger = true;
let superModel = await addModel(
  loader,
  "https://cdn.glitch.global/3b6ae790-11fe-459a-8ac8-c2a0b10ed2b9/superModel.glb?v=1682154879970",
  -3,
  0,
  -5,
  0,
  specialObjects,
  "super"
);

let superTrigger = true;

let ghoul = await addModel(
  loader,
  "https://cdn.glitch.global/3b6ae790-11fe-459a-8ac8-c2a0b10ed2b9/ghoulNew.glb?v=1680861681551",
  -23,
  0,
  -10,
  0,
  specialObjects,
  "ghoul"
);

let ghoulTrigger = true;

let haunted = await addModel(
  loader,
  "https://cdn.glitch.global/3b6ae790-11fe-459a-8ac8-c2a0b10ed2b9/hauntedSmall.glb?v=1682154995485",
  -23,
  0,
  -20,
  0,
  specialObjects,
  "haunted"
);

let hauntedTrigger = true;

let haunted2 = await addModel(
  loader,
  "https://cdn.glitch.global/3b6ae790-11fe-459a-8ac8-c2a0b10ed2b9/haunted2Decimated.glb?v=1682154033192",
  3,
  0,
  -20,
  0,
  specialObjects,
  "haunted2"
);

let hauntedTrigger2 = true;

let miniGhoul = await addModel(
  loader,
  "https://cdn.glitch.global/3b6ae790-11fe-459a-8ac8-c2a0b10ed2b9/miniGhoulNew.glb?v=1680861197477",
  -23,
  0,
  -25,
  0,
  specialObjects,
  "miniGhoul"
);

let miniGhoulTrigger = true;

let bat = await addModel(
  loader,
  "https://cdn.glitch.global/3b6ae790-11fe-459a-8ac8-c2a0b10ed2b9/batGhoul.glb?v=1682154704773",
  -13,
  0,
  -20,
  0,
  specialObjects,
  "bat"
);

let batTrigger = true;

let evil = await addModel(
  loader,
  "https://cdn.glitch.global/3b6ae790-11fe-459a-8ac8-c2a0b10ed2b9/evilForestDecimated.glb?v=1681648371523",
  -13,
  0,
  -35,
  0,
  specialObjects,
  "evil"
);

let evilTrigger = true;

let ghostly = await addModel(
  loader,
  "https://cdn.glitch.global/3b6ae790-11fe-459a-8ac8-c2a0b10ed2b9/ghostlySmall.glb?v=1681764378315",
  -33,
  0,
  -45,
  0,
  specialObjects,
  "ghostly"
);
let ghostlyTrigger = true;

const geometry = new THREE.TorusKnotGeometry(0.75, 0.3, 50, 10);
const texture = new THREE.TextureLoader().load(
  "https://cdn.glitch.global/3b6ae790-11fe-459a-8ac8-c2a0b10ed2b9/Screenshot%202023-04-16%20110222.jpg?v=1681647382450"
);
const material = new THREE.MeshStandardMaterial({ map: texture });
const torus = new THREE.Mesh(geometry, material);
torus.castShadow = true;
torus.rotation.y = Math.PI / 4;
torus.scale.set(8, 8, 8);
torus.position.set(-20, 20.75, -30);
scene.add(torus);

const torus2 = new THREE.Mesh(geometry, material);
torus2.rotation.y = -Math.PI / 4;
torus2.scale.set(5, 5, 5);
torus2.position.set(10, 13.75, -20);
scene.add(torus2);

const torus3 = new THREE.Mesh(geometry, material);
torus3.scale.set(4, 4, 4);
torus3.position.set(14, 10.75, -45);
scene.add(torus3);

// plane
const texture2 = new THREE.TextureLoader().load(
  "https://cdn.glitch.global/3b6ae790-11fe-459a-8ac8-c2a0b10ed2b9/cloud-noise.png?v=1680861827995"
);
const plane = new THREE.Mesh(
  new THREE.PlaneGeometry(window.innerWidth / 10, window.innerHeight / 10),
  new THREE.MeshStandardMaterial({ map: texture2 })
);
plane.rotation.x = -Math.PI / 2;
plane.position.y = -2;
plane.receiveShadow = true;
scene.add(plane);

var backgroundSphere = new THREE.Mesh(
  new THREE.SphereGeometry(70, 10, 10),
  new THREE.MeshBasicMaterial({
    map: new THREE.TextureLoader().load(
      "https://cdn.glitch.global/3b6ae790-11fe-459a-8ac8-c2a0b10ed2b9/bg.jpg?v=1681647553732"
    ),
    side: THREE.BackSide,
  })
);
scene.add(backgroundSphere);

//=========================================================
// set up controls
// pointer lock
let controls;
if (desktop) {
  var smallCSS = document.getElementById("smallCSS");
  smallCSS.href = "style.css";
  addDesktopControls();
} else {
  addTouchControls();
}

let moveForward = false;
let moveBackward = false;
let moveLeft = false;
let moveRight = false;
let canJump = true;
let movementAllowed = false;
let numJumps = 0;
let prevTime = performance.now();
const velocity = new THREE.Vector3();
const direction = new THREE.Vector3();
let pausedV = false;
let starter_array = [
  "These woods are where I go to rest",
  "As my host sleeps I wander here",
  "But now, the woods are fading",
  "ghouls and demons have arrived",
  "They’re dead I think, <br>never speaking or moving",
  "like vampires they come and siphon <br>the colour from this place",
  "and all vibrancy is lost",
  "Now, the woods are Fading",
  "Help me gather these ghouls and demons",
  "and lead them to a place of rest",
];
let text_array = [
  "use your mouse to look around",
  "if you can't see",
  "you're moving too fast for this place",
  "use arrows or wasd to move around",
];
let text_array_mobile = [
  "use the dial on the left to move",
  "use the dial on the right to look around",
  "the slower you go",
  "the more you'll see",
  "These woods are where I go to rest",
  "As my host sleeps I wander here",
  "But now, the woods are fading",
  "ghouls and demons have arrived",
  "They’re dead I think, <br>never speaking or moving",
  "like vampires they come and siphon <br>the colour from this place",
  "and all vibrancy is lost",
  "Now, the woods are Fading",
  "Help me gather these ghouls and demons",
  "and lead them to a place of rest",
];

let story_array = [
    "that's right, <br>steal back the light",
  "someone must be killing them, <br>poor things",
  "some of the spirits who come, <br>I recognise from before",
  "but they come in different forms now, <br>shinier and brighter",
  "like they've taken in all<br> the colour from outside",
    "I feel the colour fading away, <br>act quick",
  "lost, the lot of them, <br>poor things",
  "be careful they don't incase you",
  "you could get stuck forever"
]
let text_iterator = 0;

const instructions = document.getElementById("instructions");
const viewFinderBorder = document.getElementById("viewFinderBorder");
const viewfinder = document.getElementById("viewfinder");

let startTrigger = true;
let startCounter = 0;
instructions.addEventListener("click", function () {
  // if(debugOn)console.log("inside instructions event listener");
  if (canStart && desktop) {
    controls.lock();
  } else if (loadingTrigger == true) {
    if (startCounter == 0) {
      setTimeout(function () {
        container.style.backgroundColor = "transparent";
      }, 1000);
      controls.getObject().position.y = controls.getObject().position.y + 20;
      controls.getObject().position.z = controls.getObject().position.z - 20;
      camera.rotation.y += Math.PI / 5;
      var container = document.getElementById("instructions_container");

      instructions.innerHTML =
        "<p class='introText'>" + starter_array[0] + "</p>";
    } else {
      camera.rotation.y += Math.PI / 5;
      controls.getObject().position.y = controls.getObject().position.y - 2;
      controls.getObject().position.z = controls.getObject().position.z + 2;
      instructions.innerHTML =
        "<p class='introText'>" + starter_array[startCounter] + "</p>";
    }
    if (startCounter < starter_array.length - 1) {
      startCounter++;
    } else {
      canStart = true;
      startCounter = 0;
    }
  }
});

if (desktop) {
  controls.addEventListener("lock", function () {
    setTimeout(allowMovement, 15000);
    if (pausedV == true) {
      console.log("in controls.addEventListener");
      // setAfterImage("positive", true);
    }
    pausedV = false;
    instructions.innerHTML = "<p id='viewfinderText1'></p>";

    viewFinderBorder.style.visibility = "visible";
    viewFinderBorder.style.display = "block";
    timeout();
    startTrigger = false;
  });

  controls.addEventListener("unlock", function () {
    pausedV = true;
    if (canStart && ended == false) {
      instructions.innerHTML =
        // "<p style='font-size:36px'>These woods are where I go to rest<br/>As my host sleeps I wander here<br/>But now, my woods are fading<br/>These ghouls and demons arrive here<br/>They’re dead I think, never speaking or moving<br/>And when they come they suck the energy of this place<br/>Draining the colour<br/>Now, my woods are fading<br/>Help me collect these ghouls and demons so I can help them find their way<br/><hr/></p><p>Click To Play</p>";
        "<p style='font-size:36px'>Click to play</p><p>Move: WASD<br/>Jump: SPACE<br/>Look: MOUSE</p>";

      viewFinderBorder.style.visibility = "hidden";
      startTrigger = true;
    }else{
      instructions.innerHTML ="<br> <button id ='restart'>Reset Game </button>";
    var restartButton = document.getElementById("restart");
    restartButton.onClick = () => {
      instructions.innerHTML = "";
       viewfinderText1.innerHTML ="";
      restartGame();
      
    }
    }
  });


  const onKeyDown = function (event) {
    switch (event.code) {
      case "ArrowUp":
      case "KeyW":
        // add checks in here with the pathfinder library
        if (movementAllowed) moveForward = true;
        break;

      case "ArrowLeft":
      case "KeyA":
        if (movementAllowed) moveLeft = true;
        break;

      case "ArrowDown":
      case "KeyS":
        if (movementAllowed) moveBackward = true;
        break;

      case "ArrowRight":
      case "KeyD":
        if (movementAllowed) moveRight = true;
        break;

      case "Space":
        if (movementAllowed) {
          if (canJump === true) velocity.y += 5;
          // velocity.y += 3.5;
          console.log("jump");
          numJumps++;
          if (numJumps > 5) {
            canJump = false;
            numJumps = 0;
          }
        }
        break;
    }
  };

  const onKeyUp = function (event) {
    switch (event.code) {
      case "ArrowUp":
      case "KeyW":
        if (movementAllowed) moveForward = false;
        break;
      case "ArrowLeft":
      case "KeyA":
        if (movementAllowed) moveLeft = false;
        break;
      case "ArrowDown":
      case "KeyS":
        if (movementAllowed) moveBackward = false;
        break;
      case "ArrowRight":
      case "KeyD":
        if (movementAllowed) moveRight = false;
        break;
    }
  };
  document.addEventListener("keydown", onKeyDown);
  document.addEventListener("keyup", onKeyUp);
  // end if desktop - or add sounds to mobile
}

raycaster = new THREE.Raycaster(
  new THREE.Vector3(),
  new THREE.Vector3(0, -1, 0),
  0,
  1
);
if (desktop) {
  raycaster2 = new THREE.Raycaster();

  raycaster2.setFromCamera(new THREE.Vector2(), camera);
} else {
  let vector = new THREE.Vector3(controls.mouse.x, controls.mouse.y, 1);
  vector.unproject(camera);
  raycaster2 = new THREE.Raycaster(
    controls.fpsBody.position,
    vector.sub(controls.fpsBody.position).normalize()
  );
}
window.addEventListener("resize", onWindowResize);

//=========================================================
// postprocessing
console.log("preparing composer");
let composer;
composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
console.log("added composer");

const pencilLinePass = new PencilLinesPass(
  renderer.domElement.clientWidth,
  renderer.domElement.clientHeight,
  scene,
  camera
);

const afterImagePass = new AfterimagePass(
  renderer.domElement.clientWidth,
  renderer.domElement.clientHeight,
  scene,
  camera, 0.5
);
composer.addPass(pencilLinePass);
afterImagePass.uniforms.damp.value = 0.925;
composer.addPass(afterImagePass);
console.log("created postfx");
pencilLinePass.material.uniforms.uThresh.value = 0.4;

addEventListener("mousemove", (event) => {});

//=========================================================
// handle timing
let clock = new THREE.Clock();
let delta = 0;

let interval = 1 / 8;
let ended = false;
console.log("pre animate");
animate();

function animate() {
  if (ended == false) {
    requestAnimationFrame(animate);
    delta += clock.getDelta();
  }
  
  if(afterImagePass.uniforms.damp.value >0.99){
    ended = true;
    var viewfinderText1 = document.getElementById("viewfinderText1");
    viewfinderText1.innerHTML ="Game Over";
  }

  if (delta > interval) {
    composer.render();
    delta = delta % interval;
  }

  const time = performance.now();

  if (controls.isLocked === true || desktop == false) {
    if (!desktop) {
      controls.update();
    }

    if (desktop) {
      raycaster.ray.origin.copy(controls.getObject().position);
      raycaster2.near = 1;
      raycaster2.far = 5;
      raycaster2.ray.origin.copy(controls.getObject().position);
      raycaster2.setFromCamera(new THREE.Vector2(), camera);
    } 
 
    const intersections = raycaster.intersectObjects(collideableObjects, false);
    let intersections2;
    if(desktop){
      intersections2 = raycaster2.intersectObjects(specialObjects, false);  
    }else{
      intersections2 = controls.update();
    }
    
    if (intersections2.length > 0) {
      if (debugOn) console.log("specialObjects: ", specialObjects);
      var current_val = afterImagePass.uniforms.damp.value;
      for (let i = 0; i < intersections2.length; i++) {
        intersections2[i].object.material.color.set(0xffffff);
        superTrigger = handleIntersections(intersections2[i], "super",  superTrigger);
        pirateTrigger = handleIntersections(intersections2[i], "pirate",  pirateTrigger);
        ghoulTrigger = handleIntersections(intersections2[i], "ghoul",  ghoulTrigger);
        hauntedTrigger = handleIntersections(intersections2[i], "haunted",  hauntedTrigger);
        hauntedTrigger2 = handleIntersections(intersections2[i], "haunted2",  hauntedTrigger2);
        evilTrigger = handleIntersections(intersections2[i], "evil",  evilTrigger);
        miniGhoulTrigger = handleIntersections(intersections2[i], "miniGhoul",  miniGhoulTrigger);
        batTrigger = handleIntersections(intersections2[i], "bat", batTrigger);
        ghostlyTrigger = handleIntersections(intersections2[i], "ghostly", ghostlyTrigger);
      }
    }
    const onObject = intersections.length > 0;

    var spinAmount = 0.5;
    if (superTrigger) superModel.rotation.y += spinAmount;
    if (evilTrigger) evil.rotation.y += spinAmount;
    if (batTrigger) bat.rotation.y += spinAmount;
    if (ghoulTrigger) ghoul.rotation.y += spinAmount;
    if (miniGhoulTrigger) miniGhoul.rotation.y += spinAmount;
    if (hauntedTrigger) haunted.rotation.y += spinAmount;
    if (hauntedTrigger2)haunted2.rotation.y += spinAmount;
    if (pirateTrigger)pirate.rotation.y += spinAmount;
    if (ghostlyTrigger) ghostly.rotation.y += spinAmount;

    const delta2 = (time - prevTime) / 1000;

    velocity.x -= velocity.x * 9.0 * delta2;
    velocity.z -= velocity.z * 9.0 * delta2;

    velocity.y -= 0.05 * 100.0 * delta2; // 100.0 = mass

    direction.z = Number(moveForward) - Number(moveBackward);
    direction.x = Number(moveRight) - Number(moveLeft);
    direction.normalize(); // this ensures consistent movements in all directions

    if (moveForward || moveBackward) {
      velocity.z -= direction.z * 20.0 * delta2;
    }
    if (moveLeft || moveRight) {
      velocity.x -= direction.x * 20.0 * delta2;
    }

    if (onObject === true) {
      velocity.y = Math.max(0, velocity.y);
      canJump = true;
    }
    if (desktop) {
      controls.moveRight(-velocity.x * delta2);
      controls.moveForward(-velocity.z * delta2);
      controls.getObject().position.y += velocity.y * delta2; // new behavior
      if (controls.getObject().position.y < -0.5) {
        velocity.y = 0;
        controls.getObject().position.y = -0.5;
        canJump = true;
      }
    }
  }
  prevTime = time;
  if(debugOn)console.log(afterImagePass.uniforms.damp.value)
}

//   =========================================
//   functions

function addModel(
  theLoader,
  path,
  positionX,
  positionY,
  positionZ,
  rotation,
  collideable,
  currentName
) {
  return new Promise((resolve, reject) => {
    let newModel;

    theLoader.load(
      path,
      function (gltf) {
        gltf.scene.traverse(function (node) {
          if (node instanceof THREE.Mesh) {
            node.castShadow = true;
            if (collideable != null) {
              node.name = currentName;
              collideable.push(node);
            }
          }
        });
        scene.add(gltf.scene);
        newModel = gltf.scene;
        newModel.position.set(positionX, positionY, positionZ);
        newModel.castShadow = true;
        newModel.rotation.x = rotation;
        resolve(newModel);
      },
      undefined,
      function (error) {
        console.error(error);
      }
    );
  });
}

function timeout() {
  setTimeout(function () {
    try {
      var viewfinderText1 = document.getElementById("viewfinderText1");
      if (text_iterator < text_array.length - 1) {
        viewfinderText1.innerHTML = text_array[text_iterator];
      } else {
        // text_iterator = 0;
        viewfinderText1.innerHTML = "";
      }
      // afterImagePass.uniforms.damp.value =
      //   afterImagePass.uniforms.damp.value - 0.1;
      text_iterator++;
    } catch (error) {
      //pass
    }
    if (text_iterator < text_array.length) {
      timeout();
    }
    // else {
    //   if(debugOn)console.log("exiting timeout loop and reseting afterImagePass");
    //   for(let i=0; i<20; i++){
    //     afterImagePass.uniforms.damp.value = afterImagePass.uniforms.damp.value - 0.015;
    //   }
    // }
  }, 5000);
}

function timeoutMobile() {
  if (debugOn) console.log("mobile timeout");
  setTimeout(function () {
    try {
      var viewfinderText1 = document.getElementById("viewfinderText1");
      if (text_iterator < text_array_mobile.length) {
        if (debugOn) console.log(text_array_mobile[text_iterator]);
        viewfinderText1.innerHTML = text_array_mobile[text_iterator];
      } else {
        // text_iterator = 0;
        viewfinderText1.innerHTML = "";
      }
      
    } catch (error) {
      //pass
    }
    if (text_iterator < text_array_mobile.length) {
      text_iterator++;
      timeoutMobile();
    } else {

      if (debugOn)
        console.log("exiting timeout loop and reseting afterImagePass");
      afterImagePass.uniforms.damp.value = mainAfterImageVal;
      // }
    }
  }, 5000);
} 

function allowMovement() {
  movementAllowed = true;
  // setAfterImage(null, "positive", true);
}
function resetAfterImage(val) {
  afterImagePass.uniforms.damp.value = val;
  // setAfterImage(val, "negative");
  pencilLinePass.material.uniforms.uThresh.value = 0.75;
}
function setAfterImage(val, amount, loop) {
  if (pausedV == false) {
    setTimeout(function () {
      console.log("pre change pass: ", afterImagePass.uniforms.damp.value);
      afterImagePass.uniforms.damp.value = val;
      console.log("post change pass: ", afterImagePass.uniforms.damp.value);
      pencilLinePass.material.uniforms.uThresh.value = 0.75;
      // counter.innerHTML =
      //   parseInt((1 - afterImagePass.uniforms.damp.value) * 100) + "%";
      // if (afterImagePass.uniforms.damp.value > 0.99) {
      //   ended = true;
      // }
      if (loop) setAfterImage(val, amount, true);
    }, 5000);
  }
}


function is_touch_enabled() {
  return (
    "ontouchstart" in window ||
    navigator.maxTouchPoints > 0 ||
    navigator.msMaxTouchPoints > 0
  );
}

function getOS() {
  var userAgent = window.navigator.userAgent,
    platform =
      window.navigator?.userAgentData?.platform || window.navigator.platform,
    macosPlatforms = ["Macintosh", "MacIntel", "MacPPC", "Mac68K"],
    windowsPlatforms = ["Win32", "Win64", "Windows", "WinCE"],
    iosPlatforms = ["iPhone", "iPad", "iPod"],
    os = null;

  if (macosPlatforms.indexOf(platform) !== -1) {
    os = "Mac OS";
  } else if (iosPlatforms.indexOf(platform) !== -1) {
    os = "iOS";
  } else if (windowsPlatforms.indexOf(platform) !== -1) {
    os = "Windows";
  } else if (/Android/.test(userAgent)) {
    os = "Android";
  } else if (/Linux/.test(platform)) {
    os = "Linux";
  }

  return os;
}

function addLights() {
  // hemisphere light
  {
    const skyColor = 0xb1e1ff; // light blue
    const groundColor = 0xb97a20; // brownish orange
    const intensity = 1;
    const light = new THREE.HemisphereLight(skyColor, groundColor, intensity);
    scene.add(light);
  }
  // directional light
  {
    const color = 0xffffff;
    const intensity = 2;
    const light = new THREE.DirectionalLight(color, intensity);
    light.position.set(5, 10, 2);
    scene.add(light);
    scene.add(light.target);
  }

  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.11);
  directionalLight.castShadow = true;
  directionalLight.position.set(2, 2, 2);
  directionalLight.shadow.mapSize.width = 2048;
  directionalLight.shadow.mapSize.height = 2048;
  scene.add(directionalLight);
}

function addDesktopControls() {
  controls = new PointerLockControls(camera, document.body);
  controls.getObject().position.y = -1.5;
}

function addTouchControls() {
  let container = document.getElementsByClassName("content");
  console.log(container);
  // Controls
  let options = {
    delta: 0.5, // coefficient of movement
    moveSpeed: 0.1, // speed of movement
    rotationSpeed: 0.02, // coefficient of rotation
    maxPitch: 25, // max camera pitch angle
    hitTest: false, // stop on hitting objects
    hitTestDistance: 5, // distance to test for hit
    raycasterObjects: specialObjects,
  };
  controls = new TouchControls(container[0].parentNode, camera, options);
  controls.setPosition(0, 2.5, 5);
  controls.addToScene(scene);
  // controls.setRotation(0.15, -0.15)
  console.log(controls);
  console.log("controls added");
}

function onWindowResize() {
  if (desktop) {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize(window.innerWidth / 2, window.innerHeight / 2);
  }
}

function restartGame() {

}

function handleRaycaster(name) {
  inRaycaster = true;
  var currentHTML = document.getElementById(name);
  currentHTML.style.visibility = "visible";
  for (let j = 0; j < specialObjects.length; j++) {
    if (specialObjects[j].name == name) {
      specialObjects.splice(j, 1);
      if (debugOn) console.log("the new special objects are: ", specialObjects);
    }
  }
  var current_val = afterImagePass.uniforms.damp.value; 
  afterImagePass.uniforms.damp.value = 0.925;
  // pencilLinePass.material.uniforms.uThresh.value = 0.75;
  // setTimeout(resetAfterImage(current_val, -0.1), 5000);
  var viewfinderText1 = document.getElementById("viewfinderText1");
  // if(current_val<0.7) viewfinderText1.innerHTML = positive_array[Math.floor(Math.random()*positive_array.length)]
  // if(current_val>0.7)viewfinderText1.innerHTML = negative_array[Math.floor(Math.random()*negative_array.length)]
  viewfinderText1.innerHTML = "";
  setTimeout(function(){var indexVal =Math.floor(Math.random()*story_array.length-1);if(story_array.length>1) viewfinderText1.innerHTML = story_array[indexVal]; story_array.splice(indexVal, 1); inRaycaster=false;}, 5000);
  setTimeout(function(){viewfinderText1.innerHTML = ""}, 9000);
  // setTimeout(setAfterImage(current_val, "negative"), 7000);
  setTimeout(function(){resetAfterImage(mainAfterImageVal)}, 7000 )
}
function handleIntersections(currentIntersections, currentName, currentTrigger){
  console.log(currentName)
  if (currentIntersections.object.name == currentName) {
    if(currentTrigger){
      handleRaycaster(currentName);
      currentTrigger = false;
    }
  }
  return currentTrigger;
}

function scale (number, inMin, inMax, outMin, outMax) {
    return (number - inMin) * (outMax - outMin) / (inMax - inMin) + outMin;
}