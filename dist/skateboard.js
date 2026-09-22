import * as THREE from 'three';
import { OBJLoader } from './vendor/three/OBJLoader.js';
import { RoomEnvironment } from './vendor/three/RoomEnvironment.js';
import { OrbitControls } from './vendor/three/OrbitControls.js';
import { EffectComposer } from './vendor/three/postprocessing/EffectComposer.js';
import { RenderPass } from './vendor/three/postprocessing/RenderPass.js';
import { BokehPass } from './vendor/three/postprocessing/BokehPass.js';
import { OutputPass } from './vendor/three/postprocessing/OutputPass.js';

async function _createSkateboard() {
  const container = document.querySelector('#skateboard');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(52, 1, .1, 30);
  camera.position.set(-1.2, -1.1, -4.8);
  const cameraTarget = new THREE.Vector3(0, 0, .7);
  const viewDirection = cameraTarget.clone().sub(camera.position).normalize();
  camera.up.applyAxisAngle(viewDirection, 1.35);
  camera.lookAt(cameraTarget);

  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.setClearColor(0xEDE8D0, 1);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;
  container.append(renderer.domElement);

  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  const bokehPass = new BokehPass(scene, camera, {
    focus: 5.2,
    aperture: .003,
    maxblur: .009
  });
  composer.addPass(bokehPass);
  composer.addPass(new OutputPass());

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.target.copy(cameraTarget);
  controls.enableDamping = true;
  controls.dampingFactor = .07;
  controls.enablePan = false;
  controls.enableZoom = false;
  controls.zoomToCursor = true;
  controls.rotateSpeed = .9;
  controls.minDistance = 3.8;
  controls.maxDistance = 8;
  controls.minPolarAngle = 1.15;
  controls.maxPolarAngle = 1.95;
  controls.autoRotate = !reducedMotion.matches;
  controls.autoRotateSpeed = 6;
  controls.saveState();

  // Light the actual object without adding a floor, backdrop, or visible props.
  const environment = new RoomEnvironment();
  const pmrem = new THREE.PMREMGenerator(renderer);
  const environmentTarget = pmrem.fromScene(environment, .04);
  scene.environment = environmentTarget.texture;
  scene.environmentIntensity = .8;
  environment.dispose();
  pmrem.dispose();
  scene.add(new THREE.HemisphereLight(0xffffff, 0xc6b9a5, 1.3));
  const keyLight = new THREE.DirectionalLight(0xffffff, 3);
  keyLight.position.set(-3, 5, 6);
  scene.add(keyLight);

  const textureLoader = new THREE.TextureLoader();
  const [model, albedo, normal, roughness, metalness] = await Promise.all([
    new OBJLoader().loadAsync('./models/board.obj'),
    textureLoader.loadAsync('./models/albedo.webp'),
    textureLoader.loadAsync('./models/normal.webp'),
    textureLoader.loadAsync('./models/roughness.webp'),
    textureLoader.loadAsync('./models/metalness.webp')
  ]);
  albedo.colorSpace = THREE.SRGBColorSpace;
  const anisotropy = Math.min(renderer.capabilities.getMaxAnisotropy(), 8);
  for (const texture of [albedo, normal, roughness, metalness]) texture.anisotropy = anisotropy;
  const material = new THREE.MeshStandardMaterial({
    map: albedo, normalMap: normal, roughnessMap: roughness,
    metalnessMap: metalness, metalness: 1, roughness: 1,
    normalScale: new THREE.Vector2(.75, .75)
  });
  model.traverse(child => {
    if (!child.isMesh) return;
    child.material.dispose();
    child.material = material;
  });

  const bounds = new THREE.Box3().setFromObject(model);
  const size = bounds.getSize(new THREE.Vector3());
  model.position.sub(bounds.getCenter(new THREE.Vector3()));
  const board = new THREE.Group();
  board.add(model);
  board.scale.setScalar(6.35 / size.z);
  scene.add(board);

  const resize = new ResizeObserver(() => {
    const width = container.clientWidth;
    const height = container.clientHeight;
    if (!width || !height) return;
    camera.aspect = width / height;
    camera.fov = camera.aspect < .8 ? 72 : 52;
    camera.clearViewOffset();
    camera.setViewOffset(width, height, -width * .18, height * .26, width, height);
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
    composer.setSize(width, height);
    composer.render();
  });
  resize.observe(container);

  let resumeSpinTimer;
  controls.addEventListener('start', () => {
    clearTimeout(resumeSpinTimer);
    controls.autoRotate = false;
  });
  controls.addEventListener('end', () => {
    clearTimeout(resumeSpinTimer);
    resumeSpinTimer = setTimeout(() => {
      controls.autoRotate = !reducedMotion.matches;
    }, 900);
  });
  renderer.domElement.addEventListener('dblclick', () => {
    controls.reset();
    controls.autoRotate = !reducedMotion.matches;
  });

  const clock = new THREE.Clock();
  const render = time => {
    controls.update(Math.min(clock.getDelta(), .05));
    composer.render();
  };
  const updateMotion = () => {
    controls.autoRotate = !reducedMotion.matches;
    renderer.setAnimationLoop(document.hidden ? null : render);
    clock.getDelta();
    render(performance.now());
  };
  updateMotion();
  reducedMotion.addEventListener('change', updateMotion);
  document.addEventListener('visibilitychange', updateMotion);
  window.addEventListener('pagehide', event => {
    if (event.persisted) return;
    renderer.setAnimationLoop(null);
    clearTimeout(resumeSpinTimer);
    controls.dispose();
    resize.disconnect();
    reducedMotion.removeEventListener('change', updateMotion);
    document.removeEventListener('visibilitychange', updateMotion);
    model.traverse(child => { if (child.isMesh) child.geometry.dispose(); });
    material.dispose();
    for (const texture of [albedo, normal, roughness, metalness]) texture.dispose();
    environmentTarget.dispose();
    bokehPass.dispose();
    composer.dispose();
    renderer.dispose();
  });
}

_createSkateboard().catch(error => {
  console.error('The skateboard could not be loaded.', error);
});
