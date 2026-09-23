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
  board.scale.setScalar(6.35 / size.z * 1.02);
  board.position.set(0, -.45, 0);
  board.rotation.set(-1.8151424220741028, 2.478367537831948, 0.06981317007977318, 'XYZ');
  const ride = new THREE.Group();
  ride.add(board);
  scene.add(ride);

  // Fixed framing and motion from the supplied scene export. No tuning UI.
  let resumeSpinTimer;

  const homePosition = board.position.clone();
  const homeRotation = board.quaternion.clone();
  const homeScale = board.scale.clone();
  // The fixed OBJ correction is separate from the riding pivot's roll/yaw/tilt.
  const ridingPose = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI / 2);
  const cameraPose = new THREE.Quaternion();
  const carve = new THREE.Euler(0, 0, 0, 'ZYX');
  const sweepPose = new THREE.Quaternion();
  const spread = new THREE.Matrix4();
  // The sweep pose in camera space. The deck's top face is model -Y, so -90 degrees
  // of roll turns it toward the viewer; that roll keeps travelling through the sweep
  // but stays far short of edge-on, over a constant nose-up tilt. Yaw still carves:
  // straight → toward camera → straight → away → straight, with soft endpoints.
  const _pose = progress => {
    const turn = Math.sin(2 * Math.PI * progress) * Math.sin(Math.PI * progress);
    carve.set(THREE.MathUtils.degToRad(-90 + 34 * (2 * progress - 1)),
      THREE.MathUtils.degToRad(-12 * turn), THREE.MathUtils.degToRad(10));
    return sweepPose.setFromEuler(carve);
  };
  const projected = new THREE.Vector3();
  const projection = new THREE.Matrix4();
  const meshes = [];
  model.traverse(child => { if (child.isMesh) meshes.push(child); });
  let page = 'home';
  const transition = createSkateboardTransition({
    pages: [...document.querySelectorAll('.page')],
    viewer: {
      begin() {
        clearTimeout(resumeSpinTimer);
        controls.enabled = controls.autoRotate = false;
        board.visible = true;
        camera.updateMatrixWorld();
        cameraPose.copy(camera.quaternion);
        board.position.set(0, 0, 0);
        board.quaternion.copy(ridingPose);
        this.move(0);
      },
      move(progress) {
        const width = container.clientWidth;
        const depth = 5.9;
        const lens = camera.projectionMatrix.elements;
        // Fill the viewport: the board is longer than the visible width at its depth.
        const length = 1.25 * 2 * depth / lens[0];
        board.scale.setScalar(length / size.z);
        // Clear each edge by the exact projected reach of the pose actually held there,
        // not by a loose sphere: the board is wider than the screen now, so a sphere
        // would overshoot by seconds. Each axis contributes its own worst corner, at
        // its near depth. Both ends are fixed, so the sweep stays monotonic.
        const clearance = (at, edge) => {
          spread.makeRotationFromQuaternion(_pose(at).multiply(ridingPose));
          const reach = spread.elements;
          return (Math.abs(lens[0] * reach[0] + edge * reach[2]) * size.x
            + Math.abs(lens[0] * reach[4] + edge * reach[6]) * size.y
            + Math.abs(lens[0] * reach[8] + edge * reach[10]) * size.z)
            * board.scale.x / (2 * depth) + .02;
        };
        const x = THREE.MathUtils.lerp(-1 - clearance(0, lens[8] - 1), 1 + clearance(1, lens[8] + 1), progress);
        ride.position.set((x + lens[8]) * depth / lens[0], lens[9] * depth / lens[5], -depth)
          .applyMatrix4(camera.matrixWorld);
        ride.quaternion.copy(_pose(progress)).premultiply(cameraPose);
        ride.updateMatrixWorld(true);
        let left = Infinity, right = -Infinity;
        for (const mesh of meshes) {
          projection.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse).multiply(mesh.matrixWorld);
          const vertices = mesh.geometry.attributes.position;
          for (let index = 0; index < vertices.count; index++) {
            projected.fromBufferAttribute(vertices, index).applyMatrix4(projection);
            const screenX = (projected.x + 1) * width / 2;
            left = Math.min(left, screenX);
            right = Math.max(right, screenX);
          }
        }
        // The persistent knowledge canvas lives outside the clipped page sections.
        const volume = document.querySelector('#knowledge-volume');
        const rect = volume.getBoundingClientRect();
        // The projected silhouette may not be centered on the OBJ pivot or canvas.
        const center = (left + right) / 2;
        // Let the bokeh pass's outermost taps clear the viewport too.
        this.exited = left >= width + Math.max(8, width * .005);
        const boundary = THREE.MathUtils.clamp(center, 0, width);
        volume.style.clipPath = page === 'home'
          ? `inset(0 ${Math.max(0, rect.right - boundary)}px 0 0)`
          : `inset(0 0 0 ${Math.max(0, boundary - rect.left)}px)`;
        composer.render();
        return center;
      },
      finish(id) {
        page = id;
        document.body.dataset.page = id;
        document.querySelector('#knowledge-volume').style.clipPath = id === 'demo' ? 'inset(0)' : 'inset(0 100% 0 0)';
        board.visible = id === 'home';
        ride.position.set(0, 0, 0);
        ride.quaternion.identity();
        board.scale.copy(homeScale);
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
  // Compile the existing model before navigation can start.
  await renderer.compileAsync(scene, camera);
  const demoPage = document.querySelector('#demo');
  if (!demoPage.dataset.ready) await new Promise(resolve => {
    const ready = new MutationObserver(() => {
      if (!demoPage.dataset.ready) return;
      ready.disconnect();
      resolve();
    });
    ready.observe(demoPage, { attributes: true, attributeFilter: ['data-ready'] });
  });
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
