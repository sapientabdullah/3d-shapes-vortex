import * as THREE from "three";
import { OrbitControls } from "jsm/controls/OrbitControls.js";
import { EffectComposer } from "jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "jsm/postprocessing/UnrealBloomPass.js";

const curvePath = [
  10.136, -1.374, 10.385, 9.115, -1.374, 8.585, 9.067, -1.067, 5.894, 10.151,
  -0.659, 3.434, 10.807, 1.886, 0.469, 10.761, 2.872, -1.281, 9.62, 2.872,
  -3.283, 6.976, 2.766, -4.759, 6.046, 1.073, -6.664, 7.347, -1.823, -9.069,
  7.226, -1.823, -10.5, 5.835, -1.823, -12.039, 3.653, -0.205, -13.877, -0.302,
  1.597, -14.88, -2.893, 2.297, -13.892, -4.538, 4.586, -12.141, -6.129, 5.965,
  -8.978, -6.012, 4.408, -6.712, -5.214, 2.821, -4.453, -2.342, 2.203, -3.079,
  -0.008, 1.893, -1.658, -0.248, 2.885, 0.074, -2.217, 4.242, 2.216, -3.453,
  3.062, 4.792, -3.736, 1.405, 7.843, -3.4, 1.192, 9.246, -1.885, 1.527, 10.306,
  0.011, 2.11, 10.491, 0.426, 2.276, 11.613, 0.096, 0.032, 16.223, 2.346, 0.389,
  19.912, 5.702, 1.733, 20.615, 7.972, 1.733, 19.303, 9.867, 0.09, 16.894,
  -1.374, 14.279, 11.289, -1.374, 11.926, 10.136, -1.374, 10.385, -3.0, 3.5,
  8.0, -5.0, 5.5, 6.0, -7.0, 6.0, 5.0, -9.0, 4.5, 2.0, -10.0, 2.5, 0.5, -8.0,
  1.0, -3.0, -6.0, 0.5, -5.5, -4.0, -0.5, -7.5, -2.0, -1.0, -9.0,
];

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x101020);
scene.fog = new THREE.FogExp2(0x101020, 0.05);

const { innerWidth: w, innerHeight: h } = window;
const camera = new THREE.PerspectiveCamera(75, w / h, 0.1, 1000);
camera.position.z = 6;

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(w, h);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.outputColorSpace = THREE.SRGBColorSpace;
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;

const ambientLight = new THREE.AmbientLight(0x404040, 1.5);
const pointLight = new THREE.PointLight(0xffffff, 1.2, 50);
pointLight.position.set(10, 10, 10);
scene.add(ambientLight, pointLight);

const composer = new EffectComposer(renderer);
const renderScene = new RenderPass(scene, camera);
const bloomPass = new UnrealBloomPass(new THREE.Vector2(w, h), 1.2, 0.6, 0.5);
bloomPass.threshold = 0.05;
bloomPass.strength = 1.8;
bloomPass.radius = 0.5;
composer.addPass(renderScene);
composer.addPass(bloomPass);

const particleCount = 1000;
const particles = new THREE.BufferGeometry();
const positions = new Float32Array(particleCount * 3);

for (let i = 0; i < particleCount; i++) {
  positions[i * 3] = (Math.random() - 0.5) * 10;
  positions[i * 3 + 1] = (Math.random() - 0.5) * 10;
  positions[i * 3 + 2] = (Math.random() - 0.5) * 10;
}

particles.setAttribute("position", new THREE.BufferAttribute(positions, 3));

const particleMaterial = new THREE.PointsMaterial({
  color: 0xf4e5f0,
  size: 0.1,
});
const particleSystem = new THREE.Points(particles, particleMaterial);
scene.add(particleSystem);

const points = [];
const len = curvePath.length;
for (let p = 0; p < len; p += 3) {
  points.push(
    new THREE.Vector3(curvePath[p], curvePath[p + 1], curvePath[p + 2])
  );
}

const spline = new THREE.CatmullRomCurve3(points);
const pointMaterial = new THREE.PointsMaterial({
  color: 0xffee88,
  size: 0.1,
  transparent: true,
  opacity: 0.9,
});
const pointsGeometry = new THREE.BufferGeometry().setFromPoints(points);
const pointsLine = new THREE.Points(pointsGeometry, pointMaterial);
scene.add(pointsLine);

const torus = createTorus();
scene.add(torus.mesh);
scene.add(torus.edges);

const numShapes = 40;
createIcosahedrons(numShapes);

function updateCamera(t) {
  const time = t * 0.2;
  const looptime = 10 * 1000;
  const p = (time % looptime) / looptime;
  const pos = spline.getPointAt(p);
  const lookAt = spline.getPointAt((p + 0.03) % 1);
  camera.position.copy(pos);
  camera.lookAt(lookAt);
}

function animate(t = 0) {
  requestAnimationFrame(animate);
  updateCamera(t);
  composer.render(scene, camera);
  controls.update();

  torus.mesh.rotation.y += 0.003;
  torus.edges.rotation.y += 0.003;
}
animate();

function handleWindowResize() {
  const { innerWidth, innerHeight } = window;
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
}
window.addEventListener("resize", handleWindowResize, false);

function createTorus() {
  const torusGeo = new THREE.TorusGeometry(2, 0.3, 30, 200);
  const torusMat = new THREE.MeshStandardMaterial({
    color: 0x0088ff,
    emissive: 0x004499,
    roughness: 0.3,
    metalness: 0.8,
  });
  const torusMesh = new THREE.Mesh(torusGeo, torusMat);
  torusMesh.rotation.set(0.5, 0.5, 0);

  const edgesGeo = new THREE.EdgesGeometry(torusGeo);
  const edgeMaterial = new THREE.LineBasicMaterial({ color: 0xffffff });
  const torusEdges = new THREE.LineSegments(edgesGeo, edgeMaterial);
  torusEdges.rotation.set(0.5, 0.5, 0);

  return { mesh: torusMesh, edges: torusEdges };
}

function createIcosahedrons(numShapes) {
  const icoGeo = new THREE.IcosahedronGeometry(0.2, 0);
  for (let i = 0; i < numShapes; i++) {
    const color = new THREE.Color().setHSL(i / numShapes, 1, 0.6);
    const icoMat = new THREE.MeshStandardMaterial({
      color,
      emissive: color.clone().multiplyScalar(0.3),
      metalness: 0.5,
      roughness: 0.4,
    });
    const ico = new THREE.Mesh(icoGeo, icoMat);

    const p = (i / numShapes + Math.random() * 0.05) % 1;
    const pos = spline.getPointAt(p);
    pos.x += Math.random() * 0.2 - 0.1;
    pos.z += Math.random() * 0.2 - 0.1;
    ico.position.copy(pos);

    ico.rotation.set(
      Math.random() * Math.PI,
      Math.random() * Math.PI,
      Math.random() * Math.PI
    );

    scene.add(ico);
  }
}
