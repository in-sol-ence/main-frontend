import * as THREE from 'three';
import { OBJLoader } from './vendor/three/OBJLoader.js';
import { RoomEnvironment } from './vendor/three/RoomEnvironment.js';
import { OrbitControls } from './vendor/three/OrbitControls.js';

async function _createSkateboard() {
  const container = document.querySelector('#skateboard');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-2, 2, 2.2, -2.2, .1, 30);
  camera.position.set(0, 0, 8);

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;
  container.append(renderer.domElement);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = .07;
  controls.enablePan = false;
  controls.enableZoom = false;
  controls.zoomToCursor = true;
  controls.minZoom = .78;
  controls.maxZoom = 1.85;
  controls.rotateSpeed = .9;
  controls.zoomSpeed = .8;
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
  const upright = new THREE.Group();
  upright.add(model);
  upright.scale.setScalar(3.6 / size.z);
  upright.rotation.x = -Math.PI / 2;
  const board = new THREE.Group();
  board.add(upright);
  board.rotation.set(.12, -.32, -.3);
  scene.add(board);

  const resize = new ResizeObserver(() => {
    const width = container.clientWidth;
    const height = container.clientHeight;
    if (!width || !height) return;
    const aspect = width / height;
    const viewHeight = Math.max(4.4, 2.5 / aspect);
    camera.left = -viewHeight * aspect / 2;
    camera.right = viewHeight * aspect / 2;
    camera.top = viewHeight / 2;
    camera.bottom = -viewHeight / 2;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
    renderer.render(scene, camera);
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
    renderer.render(scene, camera);
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
    renderer.dispose();
  });
}

_createSkateboard().catch(error => {
  console.error('The skateboard could not be loaded.', error);
});
