import * as THREE from '../vendor/three.module.min.js';
import { pointAt, tangentAt, PERIOD } from './trajectory.js';

export function createAtmosphere() {
  const scene = new THREE.Scene();
  const camera = new THREE.Camera();
  const material = new THREE.ShaderMaterial({
    depthWrite: false, depthTest: false,
    uniforms: { learnerFocus: { value: 0 }, aspect: { value: 1 }, drift: { value: 0 }, eye: { value: new THREE.Vector3() }, viewRotation: { value: new THREE.Matrix3() }, lens: { value: .5 } },
    vertexShader: `varying vec2 vUv;
      void main(){ vUv=uv; gl_Position=vec4(position.xy,1.,1.); }`,
    fragmentShader: `precision highp float;
      varying vec2 vUv; uniform float aspect; uniform float drift;
      uniform vec3 eye; uniform mat3 viewRotation; uniform float lens; uniform float learnerFocus;
      float noise(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
      void main(){
        vec2 p=vUv-vec2(.53+drift*.015,.56); p.x*=min(aspect,1.8);
        float pool=exp(-dot(p*vec2(.93,1.45),p*vec2(.93,1.45))*4.4);
        float low=exp(-dot((p+vec2(.36,.22))*vec2(1.2,2.),(p+vec2(.36,.22))*vec2(1.2,2.))*4.);
        vec3 color=mix(vec3(.043,.049,.057),vec3(.134,.143,.150),pool);
        color+=vec3(.025,.019,.010)*low;
        vec3 ray=normalize(viewRotation*vec3((vUv*2.-1.)*vec2(aspect,1.)*lens,-1.));
        float atmosphere=0.;
        for(int i=0;i<5;i++){
          vec3 samplePoint=(eye+ray*(24.+float(i)*34.))*.017;
          float density=sin(samplePoint.x*.8+samplePoint.z*.35)*sin(samplePoint.y*.65-samplePoint.z*.3);
          atmosphere+=density*.0028;
        }
        color+=vec3(.88,.94,1.)*atmosphere;
        float vignette=smoothstep(.30,1.,length((vUv-.5)*vec2(1.,.9)));
        color*=1.-vignette*.32;
        color+=(noise(gl_FragCoord.xy)-.5)/460.;
        gl_FragColor=vec4(color*(1.-.10*learnerFocus),1.);
      }`,
  });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material);
  mesh.frustumCulled = false; scene.add(mesh);
  return { scene, camera, material, dispose() { mesh.geometry.dispose(); material.dispose(); } };
}

function createRibbonGeometry() {
  const segments = 3072;
  const positions = [], centers = [], normals = [], uvs = [], indices = [];
  const center = new THREE.Vector3(), tangent = new THREE.Vector3();
  const right = new THREE.Vector3(), normal = new THREE.Vector3(), up = new THREE.Vector3(0, 1, 0);
  // An elliptical cross-section would read as a tube. This is a slender four-
  // sided strip, with a broad satin face and an almost invisible dark edge.
  const corners = [[-1,1], [1,1], [1,-1], [-1,-1]];
  for (let i = 0; i <= segments; i++) {
    const station = i * PERIOD / segments;
    pointAt(station, center); tangentAt(station, tangent);
    right.crossVectors(tangent, up).normalize();
    right.applyAxisAngle(tangent, .28 * Math.sin(station / PERIOD * Math.PI * 4 + .6));
    normal.crossVectors(right, tangent).normalize();
    for (let face = 0; face < 4; face++) {
      const a = corners[face], b = corners[(face + 1) % 4];
      const nx = a[0] + b[0], ny = a[1] + b[1];
      const faceNormal = right.clone().multiplyScalar(nx).addScaledVector(normal, ny).normalize();
      for (const corner of [a, b]) {
        const vertex = center.clone().addScaledVector(right, corner[0] * .072).addScaledVector(normal, corner[1] * .009);
        positions.push(vertex.x, vertex.y, vertex.z);
        centers.push(center.x, center.y, center.z);
        normals.push(faceNormal.x, faceNormal.y, faceNormal.z);
        uvs.push(corner[0] * .5 + .5, i / segments);
      }
      if (i < segments) {
        const start = i * 8 + face * 2;
        indices.push(start, start + 1, start + 8, start + 1, start + 9, start + 8);
      }
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('aCenter', new THREE.Float32BufferAttribute(centers, 3));
  geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices); geometry.computeBoundingSphere();
  return geometry;
}

export function createWorld() {
  const scene = new THREE.Scene();
  const geometry = createRibbonGeometry();
  const material = new THREE.ShaderMaterial({
    side: THREE.FrontSide, transparent: true, depthWrite: false,
    uniforms: { eye: { value: new THREE.Vector3() }, journeyStation: { value: 0 }, layerPresence: { value: 1 }, entryStation: { value: -1000000 }, formationCenter: { value: 0 }, formationRadius: { value: 1000000 }, formationBlend: { value: 1 }, domainPoint: { value: new THREE.Vector3() }, domainTint: { value: new THREE.Color() }, domainStrength: { value: 0 }, routeExit: { value: 1000000 } },
    vertexShader: `attribute vec3 aCenter; uniform float formationBlend; varying vec3 vPosition; varying vec3 vNormal; varying vec2 vUv;
      void main(){vec3 formed=aCenter+(position-aCenter)*mix(.06,1.,formationBlend); vec4 world=modelMatrix*vec4(formed,1.); vPosition=world.xyz;
        vNormal=mat3(modelMatrix)*normal; vUv=uv;
        gl_Position=projectionMatrix*viewMatrix*world;}`,
    fragmentShader: `precision highp float;
      varying vec3 vPosition; varying vec3 vNormal; varying vec2 vUv; uniform vec3 eye; uniform float journeyStation; uniform float layerPresence; uniform float entryStation;
      uniform float formationCenter; uniform float formationRadius; uniform float formationBlend;
      uniform vec3 domainPoint; uniform vec3 domainTint; uniform float domainStrength;
      uniform float routeExit;
      void main(){
        vec3 N=normalize(vNormal); if(!gl_FrontFacing) N=-N;
        vec3 V=normalize(eye-vPosition);
        vec3 L=normalize(vec3(-.45,.82,.36));
        float diffuse=max(dot(N,L),0.);
        float spec=pow(max(dot(N,normalize(L+V)),0.),38.);
        float grazing=pow(1.-abs(dot(N,V)),3.);
        float edge=pow(abs(vUv.x-.5)*2.,8.);
        float reflectedSoftbox=pow(max(dot(reflect(-V,N),normalize(vec3(-.25,.7,-.5))),0.),7.);
        vec3 satin=vec3(.64,.65,.63)*(.32+.48*diffuse);
        satin+=vec3(.32,.30,.25)*spec+vec3(.23,.235,.23)*grazing;
        satin+=reflectedSoftbox*vec3(.38,.36,.31);
        satin+=edge*vec3(.075,.078,.08);
        float domainPool=exp(-pow(length(vPosition-domainPoint)/12.,2.))*domainStrength;
        satin=mix(satin,satin*domainTint*1.24,domainPool*.13);
        satin+=vec3(.024,.025,.023)*domainPool;
        float distanceToEye=length(eye-vPosition);
        float visibility=exp(-pow(distanceToEye/91.,1.65));
        float nearFade=smoothstep(.35,1.2,distanceToEye);
        float ahead=-vPosition.z-journeyStation;
        float progression=mix(.72,1.,smoothstep(-28.,8.,ahead));
        float localPresence=1.+.055*exp(-pow((ahead-8.)/18.,2.));
        float entrance=smoothstep(entryStation,entryStation+5.,-vPosition.z);
        float formation=1.-smoothstep(max(0.,formationRadius-8.),max(.001,formationRadius),abs(-vPosition.z-formationCenter));
        float destinationFade=1.-smoothstep(routeExit-18.,routeExit,-vPosition.z);
        gl_FragColor=vec4(satin*localPresence,visibility*nearFade*progression*layerPresence*entrance*formation*destinationFade*formationBlend);
      }`,
  });
  const ribbons = [-1, 0, 1, 2].map(cycle => {
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.z = -cycle * PERIOD; scene.add(mesh); return mesh;
  });
  return {
    scene,
    update(station, camera, presence = 1, entryStation = -1000000, formation = null, illumination = null, routeExit = 1000000) {
      const cycle = Math.floor(station / PERIOD);
      ribbons.forEach((mesh, i) => { mesh.position.z = -(cycle + i - 1) * PERIOD; });
      material.uniforms.eye.value.copy(camera.position);
      material.uniforms.journeyStation.value = station;
      material.uniforms.layerPresence.value = presence;
      material.uniforms.entryStation.value = entryStation;
      material.uniforms.formationCenter.value = formation?.center ?? 0;
      material.uniforms.formationRadius.value = formation?.radius ?? 1000000;
      material.uniforms.formationBlend.value = formation?.ribbon ?? 1;
      material.uniforms.routeExit.value = routeExit;
      material.uniforms.domainStrength.value = illumination?.strength ?? 0;
      if (illumination) {
        material.uniforms.domainPoint.value.copy(illumination.point);
        material.uniforms.domainTint.value.copy(illumination.tint);
      }
    },
    dispose() { geometry.dispose(); material.dispose(); },
  };
}
