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

  const tuning = {
    pageColor: '#ede8d0', textColor: '#3d2412', cursorColor: '#000000', accentColor: '#3d2412',
    idle: !reducedMotion.matches, resumeDelay: 900, limitTilt: true,
    fov: container.clientWidth / container.clientHeight < .8 ? 72 : 52,
    horizontal: .18, vertical: .26, scale: 1, pitch: 0, yaw: 0, roll: 0
  };
  const fields = document.querySelector('#tuning-fields');
  fields.replaceChildren();
  const bindings = [];
  let resumeSpinTimer;

  function _syncTuning() {
    for (const { object, key, input, range } of bindings) {
      if (input.type === 'checkbox') input.checked = object[key];
      else if (input.type === 'color') input.value = object[key];
      else if (document.activeElement !== input && document.activeElement !== range) {
        input.value = Number(object[key].toFixed(6));
        range.value = object[key];
      }
    }
  }

  function _control(parent, label, object, key, min, max, step, change) {
    const row = document.createElement('label');
    row.className = 'tune-row';
    const name = document.createElement('span');
    name.textContent = label;
    const input = document.createElement('input');
    const checkbox = typeof object[key] === 'boolean';
    const color = typeof object[key] === 'string';
    input.type = checkbox ? 'checkbox' : color ? 'color' : 'number';
    input.setAttribute('aria-label', label);
    row.append(name, input);
    let range;
    if (!checkbox && !color) {
      range = document.createElement('input');
      range.type = 'range';
      range.setAttribute('aria-label', label);
      for (const element of [input, range]) Object.assign(element, { min, max, step });
      row.append(range);
    }
    for (const element of [input, range].filter(Boolean)) {
      element.addEventListener('input', () => {
        if (!checkbox && !color && !Number.isFinite(element.valueAsNumber)) return;
        object[key] = checkbox ? input.checked : color ? input.value : THREE.MathUtils.clamp(element.valueAsNumber, min, max);
        if (range) { range.value = object[key]; input.value = object[key]; }
        change?.();
        composer.render();
      });
    }
    parent.append(row);
    bindings.push({ object, key, input, range });
  }

  for (const title of ['Colors', 'Motion & scrolling', 'Board position', 'Board angle', 'Camera', 'Focus & light']) {
    const section = document.createElement('fieldset');
    const legend = document.createElement('legend');
    legend.textContent = title;
    section.append(legend);
    fields.append(section);
    if (title === 'Colors') {
      for (const [label, key, property] of [
        ['Page background', 'pageColor', '--page-color'],
        ['Text', 'textColor', '--text-color'],
        ['Cursor', 'cursorColor', '--cursor-color'],
        ['Panel accent', 'accentColor', '--accent-color']
      ]) {
        _control(section, label, tuning, key, null, null, null, () => {
          document.documentElement.style.setProperty(property, tuning[key]);
          if (key === 'pageColor') {
            renderer.setClearColor(tuning.pageColor, 1);
            document.querySelector('meta[name="theme-color"]').content = tuning.pageColor;
          }
        });
      }
    } else if (title === 'Motion & scrolling') {
      _control(section, 'Idle spin', tuning, 'idle', null, null, null, () => {
        clearTimeout(resumeSpinTimer);
        controls.autoRotate = tuning.idle;
      });
      _control(section, 'Idle speed / direction', controls, 'autoRotateSpeed', -20, 20, .1);
      _control(section, 'Resume delay (ms)', tuning, 'resumeDelay', 0, 5000, 100);
      _control(section, 'Drag speed', controls, 'rotateSpeed', .1, 3, .05);
      _control(section, 'Drag smoothing', controls, 'dampingFactor', .01, 1, .01);
      _control(section, 'Scroll / pinch zoom', controls, 'enableZoom');
      _control(section, 'Scroll sensitivity', controls, 'zoomSpeed', .1, 3, .05);
      _control(section, 'Limit tilt', tuning, 'limitTilt', null, null, null, () => {
        controls.minPolarAngle = tuning.limitTilt ? 1.15 : .01;
        controls.maxPolarAngle = tuning.limitTilt ? 1.95 : Math.PI - .01;
      });
    } else if (title === 'Board position') {
      for (const axis of ['x', 'y', 'z']) _control(section, axis.toUpperCase(), board.position, axis, -8, 8, .05);
      _control(section, 'Size', tuning, 'scale', .2, 3, .01, () => board.scale.setScalar(6.35 / size.z * tuning.scale));
    } else if (title === 'Board angle') {
      for (const [key, axis] of [['pitch', 'x'], ['yaw', 'y'], ['roll', 'z']]) {
        _control(section, `${key} (degrees)`, tuning, key, -180, 180, 1, () => {
          board.rotation[axis] = THREE.MathUtils.degToRad(tuning[key]);
        });
      }
    } else if (title === 'Camera') {
      for (const [name, object] of [['Position', camera.position], ['Look at', controls.target]]) {
        for (const axis of ['x', 'y', 'z']) _control(section, `${name} ${axis.toUpperCase()}`, object, axis, -12, 12, .05, () => {
          tuning.idle = controls.autoRotate = false;
          clearTimeout(resumeSpinTimer);
          camera.lookAt(controls.target);
          _syncTuning();
        });
      }
      _control(section, 'Field of view', tuning, 'fov', 20, 100, 1);
      _control(section, 'Minimum camera distance', controls, 'minDistance', .2, 8, .1);
      _control(section, 'Maximum camera distance', controls, 'maxDistance', 8, 30, .1);
      _control(section, 'Frame left / right', tuning, 'horizontal', -.7, .7, .01);
      _control(section, 'Frame down / up', tuning, 'vertical', -.7, .7, .01);
      section.addEventListener('input', () => {
        const width = container.clientWidth, height = container.clientHeight;
        camera.fov = tuning.fov;
        camera.setViewOffset(width, height, -width * tuning.horizontal, height * tuning.vertical, width, height);
        camera.updateProjectionMatrix();
        composer.render();
      });
    } else {
      _control(section, 'Depth of field', bokehPass, 'enabled');
      _control(section, 'Focus distance', bokehPass.uniforms.focus, 'value', .1, 20, .1);
      _control(section, 'Aperture', bokehPass.uniforms.aperture, 'value', 0, .02, .0001);
      _control(section, 'Maximum blur', bokehPass.uniforms.maxblur, 'value', 0, .03, .001);
      _control(section, 'Exposure', renderer, 'toneMappingExposure', .2, 3, .05);
      _control(section, 'Environment light', scene, 'environmentIntensity', 0, 3, .05);
    }
  }
  _syncTuning();
  document.querySelector('#reset-tuning').addEventListener('click', () => location.reload());
  document.querySelector('#copy-tuning').addEventListener('click', async event => {
    const settings = { tuning, position: board.position.toArray(), rotation: board.rotation.toArray(),
      camera: camera.position.toArray(), up: camera.up.toArray(), target: controls.target.toArray(),
      idleSpeed: controls.autoRotateSpeed, dragSpeed: controls.rotateSpeed, smoothing: controls.dampingFactor,
      zoom: controls.enableZoom, scrollSpeed: controls.zoomSpeed, depthOfField: bokehPass.enabled,
      focus: bokehPass.uniforms.focus.value, aperture: bokehPass.uniforms.aperture.value,
      blur: bokehPass.uniforms.maxblur.value, exposure: renderer.toneMappingExposure, light: scene.environmentIntensity };
    try {
      await navigator.clipboard.writeText(JSON.stringify(settings, null, 2));
      event.target.textContent = 'Copied';
    } catch { event.target.textContent = 'Copy unavailable'; }
    setTimeout(() => { event.target.textContent = 'Copy settings'; }, 1800);
  });

  const resize = new ResizeObserver(() => {
    const width = container.clientWidth;
    const height = container.clientHeight;
    if (!width || !height) return;
    camera.aspect = width / height;
    camera.fov = tuning.fov;
    camera.clearViewOffset();
    camera.setViewOffset(width, height, -width * tuning.horizontal, height * tuning.vertical, width, height);
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
    composer.setSize(width, height);
    composer.render();
  });
  resize.observe(container);

  controls.addEventListener('start', () => {
    clearTimeout(resumeSpinTimer);
    controls.autoRotate = false;
  });
  controls.addEventListener('end', () => {
    clearTimeout(resumeSpinTimer);
    resumeSpinTimer = setTimeout(() => {
      controls.autoRotate = tuning.idle;
    }, tuning.resumeDelay);
  });
  renderer.domElement.addEventListener('dblclick', () => {
    controls.reset();
    controls.autoRotate = tuning.idle;
  });

  const clock = new THREE.Clock();
  let lastSync = 0;
  const render = time => {
    controls.update(Math.min(clock.getDelta(), .05));
    if (time - lastSync > 150) { _syncTuning(); lastSync = time; }
    composer.render();
  };
  const updateMotion = () => {
    controls.autoRotate = tuning.idle;
    renderer.setAnimationLoop(document.hidden ? null : render);
    clock.getDelta();
    render(performance.now());
  };
  updateMotion();
  const updatePreference = () => { tuning.idle = !reducedMotion.matches; updateMotion(); };
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
