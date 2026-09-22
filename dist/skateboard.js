import * as THREE from 'three';
import { createSkateboardTransition } from './transition.js';
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
  camera.position.set(0.1328305864251409, 2.077583808205999, 6.044717163173346);
  const cameraTarget = new THREE.Vector3(0, 0, .7);
  camera.up.set(-0.9042679616674021, 0.24773014936104823, 0.3477487981279509);
  camera.lookAt(cameraTarget);

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.5;
  container.append(renderer.domElement);

  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  const bokehPass = new BokehPass(scene, camera, {
    focus: 5.9,
    aperture: .002,
    maxblur: .009
  });
  // Preserve transparent pixels instead of the stock shader's opaque backdrop.
  bokehPass.materialBokeh.fragmentShader = bokehPass.materialBokeh.fragmentShader
    .replace('gl_FragColor.a = 1.0;', '');
  bokehPass.enabled = true;
  composer.addPass(bokehPass);
  composer.addPass(new OutputPass());

  const controls = new OrbitControls(camera, document.querySelector('#pages'));
  controls.target.copy(cameraTarget);
  controls.enableDamping = true;
  controls.dampingFactor = .02;
  controls.enablePan = false;
  controls.enableZoom = false;
  controls.zoomToCursor = true;
  controls.zoomSpeed = 1;
  controls.rotateSpeed = .7;
  controls.minDistance = 3.8;
  controls.maxDistance = 8;
  controls.minPolarAngle = 1.15;
  controls.maxPolarAngle = 1.95;
  controls.autoRotate = !reducedMotion.matches;
  controls.autoRotateSpeed = 3.5;
  controls.saveState();

  // Light the actual object without adding a floor, backdrop, or visible props.
  const environment = new RoomEnvironment();
  const pmrem = new THREE.PMREMGenerator(renderer);
  const environmentTarget = pmrem.fromScene(environment, .04);
  scene.environment = environmentTarget.texture;
  scene.environmentIntensity = .35;
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
  board.scale.setScalar(6.35 / size.z * 1.06);
  board.position.set(0, -.45, 0);
  board.rotation.set(-1.8151424220741028, 2.478367537831948, 0.06981317007977318, 'XYZ');
  scene.add(board);

  // Fixed framing and motion from the supplied scene export. No tuning UI.
  let resumeSpinTimer;

  const homePosition = board.position.clone();
  const homeRotation = board.quaternion.clone();
  const wipeCamera = new THREE.OrthographicCamera(-4, 4, 4, -4, .1, 30);
  wipeCamera.position.set(0, -8, 0);
  wipeCamera.up.set(0, 0, 1);
  wipeCamera.lookAt(0, 0, 0);
  const wipeBounds = new THREE.Box3();
  let page = 'home';
  const transition = createSkateboardTransition({
    pages: [...document.querySelectorAll('.page')],
    viewer: {
      begin() {
        clearTimeout(resumeSpinTimer);
        controls.enabled = controls.autoRotate = false;
        board.visible = true;
        // Model +Z points right; +Y points up, placing the wheels below the deck.
        board.rotation.set(Math.PI / 2, Math.PI / 2, 0);
      },
      move(progress) {
        const width = container.clientWidth;
        const halfWidth = 4 * width / container.clientHeight;
        wipeCamera.left = -halfWidth;
        wipeCamera.right = halfWidth;
        wipeCamera.updateProjectionMatrix();
        board.position.set(0, 0, 0);
        // Precise transformed vertex bounds, not a separately timed CSS offset.
        wipeBounds.setFromObject(board, true);
        const x = progress * width;
        board.position.x = -halfWidth + progress * halfWidth * 2 - wipeBounds.min.x;
        renderer.render(scene, wipeCamera);
        return x;
      },
      finish(id) {
        page = id;
        document.body.dataset.page = id;
        board.visible = id === 'home';
        board.position.copy(homePosition);
        board.quaternion.copy(homeRotation);
        controls.enabled = id === 'home';
        controls.autoRotate = id === 'home' && !reducedMotion.matches;
        composer.render();
      }
    }
  });
  for (const actions of document.querySelectorAll('.actions')) {
    actions.addEventListener('pointerdown', event => event.stopPropagation());
  }
  // Compile the sweep's direct-render shader before navigation can start.
  await renderer.compileAsync(scene, wipeCamera);
  const demoButton = document.querySelector('#demo-button');
  demoButton.disabled = false;
  demoButton.addEventListener('click', () => transition.navigate(document.querySelector('#demo')));
  document.querySelector('#back-button').addEventListener('click', () => transition.navigate(document.querySelector('#home')));

  const resize = new ResizeObserver(() => {
    const width = container.clientWidth;
    const height = container.clientHeight;
    if (!width || !height) return;
    camera.aspect = width / height;
    camera.fov = 52;
    camera.clearViewOffset();
    camera.setViewOffset(width, height, -width * .23, height * .04, width, height);
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
    composer.setSize(width, height);
    if (!transition.active) composer.render();
  });
  resize.observe(container);

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
  document.querySelector('#pages').addEventListener('dblclick', event => {
    if (page !== 'home' || transition.active || event.target.closest('.actions')) return;
    controls.reset();
    controls.autoRotate = !reducedMotion.matches;
  });

  const clock = new THREE.Clock();
  const render = (time = performance.now()) => {
    if (transition.tick(time)) return;
    if (page !== 'home') return;
    controls.update(Math.min(clock.getDelta(), .05));
    composer.render();
  };
  const updateMotion = () => {
    controls.autoRotate = page === 'home' && !transition.active && !reducedMotion.matches;
    renderer.setAnimationLoop(document.hidden ? null : render);
    clock.getDelta();
    render(performance.now());
  };
  updateMotion();
  const updatePreference = () => { clearTimeout(resumeSpinTimer); updateMotion(); };
  reducedMotion.addEventListener('change', updatePreference);
  document.addEventListener('visibilitychange', updateMotion);
  window.addEventListener('pagehide', event => {
    if (event.persisted) return;
    renderer.setAnimationLoop(null);
    clearTimeout(resumeSpinTimer);
    controls.dispose();
    resize.disconnect();
    reducedMotion.removeEventListener('change', updatePreference);
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
