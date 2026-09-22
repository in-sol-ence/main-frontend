import * as THREE from '../vendor/three.module.min.js';
import { pointAt } from './trajectory.js';
import { smootherstep } from './motion.js';

export const FIELD_STRANDS = 72;
export const FIELD_SEGMENTS = 160;
const palette = ['#7895ad', '#9385a7', '#819d91', '#ac967a', '#7b999e', '#9893aa'];
const knots = [[-1.3,.2,.8],[-.65,.65,.3],[.1,.85,-.4],[.85,.15,-.9],[.5,-.6,-.25],[-.15,-.8,.5],[-.8,-.2,-.3],[-.1,.45,-1.15],[.9,.7,-.5],[1.3,-.15,.25],[.5,-.75,.85],[-.55,-.4,1.1]];
const fract = x => x - Math.floor(x);
const hash = n => fract(Math.sin(n * 127.1 + 311.7) * 43758.5453);
export function flowLife(line, time) {
  const duration = 28 + hash(line + 40) * 24;
  const age = fract(time / duration + hash(line + 81));
  return smootherstep(age / .12) * (1 - smootherstep((age - .82) / .18));
}

// Cubic B-spline control cages evolve in 3D. Each finite strand advances through
// its cage while the cage sweeps across the viewing volume. C2 joins and hidden
// lifecycle boundaries keep replenishment continuous, without particle trails.
const flowStates = new Map();
export function sampleFlow(line, u, time, out = new THREE.Vector3()) {
  let state=flowStates.get(line);
  if(!state){state={time:NaN,cage:new Float64Array(36)};flowStates.set(line,state);}
  if(state.time!==time){
    const family=Math.floor(line/12),lane=line%12-5.5;
    const duration=28+hash(line+40)*24,clock=time/duration+hash(line+81);
    const cycle=Math.floor(clock),travel=smootherstep(fract(clock));
    state.phase=family*1.71+cycle*2.3+travel*2.4;state.length=4.2+hash(family+4)*1.8;
    const angle=family*1.11+.13*Math.sin(time*.041+family);
    state.c=Math.cos(angle);state.s=Math.sin(angle);state.span=48+hash(family+10)*40;
    const drift=(travel-.5)*150;state.dx=drift*Math.cos(family*1.9);state.dy=drift*Math.sin(family*1.9)*.42;
    state.dz=drift*(family%2?1:-.75)-lane*2.1;state.lane=lane;state.family=family;
    for(let i=0;i<12;i++){const phase=time*.085+i*1.73+family*.8,a=knots[i];state.cage[i*3]=a[0]+.17*Math.sin(phase);state.cage[i*3+1]=a[1]+.22*Math.cos(phase*.79+i);state.cage[i*3+2]=a[2]+.19*Math.sin(phase*.63+family);}
    state.time=time;
  }
  const p=u*state.length+state.phase,cell=Math.floor(p),t=p-cell,t2=t*t,t3=t2*t;
  const w0=(1-t)**3/6,w1=(3*t3-6*t2+4)/6,w2=(-3*t3+3*t2+3*t+1)/6,w3=t3/6;
  const i0=((cell-1)%12+12)%12*3,i1=((cell)%12+12)%12*3,i2=((cell+1)%12+12)%12*3,i3=((cell+2)%12+12)%12*3,cage=state.cage;
  const x=cage[i0]*w0+cage[i1]*w1+cage[i2]*w2+cage[i3]*w3;
  const y=cage[i0+1]*w0+cage[i1+1]*w1+cage[i2+1]*w2+cage[i3+1]*w3;
  const z=cage[i0+2]*w0+cage[i1+2]*w1+cage[i2+2]*w2+cage[i3+2]*w3;
  const fan=.5+.5*smootherstep(Math.abs(u-.48)*1.8),lx=x*state.span+state.lane*1.3*fan,ly=y*(22+state.family*3)+state.lane*.7;
  return out.set(lx*state.c-ly*state.s+state.dx,lx*state.s*.58+ly*state.c+state.dy,-105+z*(50+state.family*13)+state.dz);
}

export function openingPose() {
  const position=pointAt(-76,new THREE.Vector3()).add(new THREE.Vector3(-20,16,0));
  const target=pointAt(18,new THREE.Vector3()).add(new THREE.Vector3(0,3,0));
  const matrix=new THREE.Matrix4().lookAt(position,target,new THREE.Vector3(0,1,0));
  return {position,quaternion:new THREE.Quaternion().setFromRotationMatrix(matrix)};
}

export function discoveryPose(from,to,progress,focus=null) {
  const t=smootherstep(progress), distance=from.position.distanceTo(to.position), forward=new THREE.Vector3(0,0,-1);
  const a=from.position.clone().addScaledVector(forward.clone().applyQuaternion(from.quaternion),distance*.42);
  const b=to.position.clone().addScaledVector(forward.clone().applyQuaternion(to.quaternion),-distance*.24),u=1-t;
  const position=from.position.clone().multiplyScalar(u**3).addScaledVector(a,3*u*u*t).addScaledVector(b,3*u*t*t).addScaledVector(to.position,t**3);
  const quaternion=from.quaternion.clone().slerp(to.quaternion,smootherstep(Math.min(1,progress/.91)));
  if(focus) {
    const aim=new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().lookAt(position,focus,new THREE.Vector3(0,1,0)));
    const angle=quaternion.angleTo(aim), weight=16*t*t*(1-t)*(1-t);
    if(angle>.0001)quaternion.slerp(aim,Math.min(.42,.18/angle)*weight);
  }
  return {position,quaternion};
}

export function createKnowledgeField() {
  const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(53,1,.08,600),origin=openingPose();
  const frame=new THREE.Matrix4().compose(origin.position,origin.quaternion,new THREE.Vector3(1,1,1));
  const positions=[],next=[],along=[],sides=[],strands=[],colors=[],selected=[],selectedNext=[],life=[],indices=[];
  for(let line=0;line<FIELD_STRANDS;line++) {
    const color=new THREE.Color(palette[Math.floor(line/12)]);
    for(let sample=0;sample<=FIELD_SEGMENTS;sample++) {
      for(const side of [-1,1]) {positions.push(0,0,0);next.push(0,0,0);along.push(sample/FIELD_SEGMENTS);sides.push(side);strands.push(line);colors.push(color.r,color.g,color.b);selected.push(0,0,0);selectedNext.push(0,0,0);life.push(1);}
      if(sample<FIELD_SEGMENTS){const o=line*(FIELD_SEGMENTS+1)*2+sample*2;indices.push(o,o+1,o+2,o+1,o+3,o+2);}
    }
  }
  const geometry=new THREE.BufferGeometry();
  for(const [name,data,size] of [['position',positions,3],['aPrevious',positions.slice(),3],['aNext',next,3],['aAlong',along,1],['aSide',sides,1],['aStrand',strands,1],['aColor',colors,3],['aSelected',selected,3],['aSelectedNext',selectedNext,3],['aLife',life,1]])geometry.setAttribute(name,new THREE.Float32BufferAttribute(data,size));
  for(const name of ['position','aPrevious','aNext','aLife'])geometry.attributes[name].setUsage(THREE.DynamicDrawUsage);
  geometry.setIndex(indices);
  const material=new THREE.ShaderMaterial({transparent:true,depthWrite:false,depthTest:true,side:THREE.DoubleSide,
    uniforms:{time:{value:0},fieldFrame:{value:frame},resolution:{value:new THREE.Vector2(1280,720)},convergence:{value:0},presence:{value:1},selection:{value:0},softness:{value:0},handoff:{value:0},chosenLine:{value:29},prompt:{value:1},promptCenter:{value:new THREE.Vector2(.5,.5)},promptSize:{value:new THREE.Vector2(.3,.24)}},
    vertexShader:`
      attribute vec3 aNext,aPrevious,aColor,aSelected,aSelectedNext;
      attribute float aAlong,aSide,aStrand,aLife;
      uniform mat4 fieldFrame; uniform vec2 resolution;
      uniform float convergence,presence,selection,softness,handoff,chosenLine;
      varying vec3 vColor; varying float vAlpha,vSide,vBlur; varying vec2 vScreen;
      void main(){
        float chosen=1.-step(.1,abs(aStrand-chosenLine));
        vec3 ambient=(fieldFrame*vec4(position,1.)).xyz;
        vec3 ambientNext=(fieldFrame*vec4(aNext,1.)).xyz;
        float neighborhood=exp(-abs(aStrand-chosenLine)*.23);
        float gather=smoothstep(0.,.82,convergence);
        float attract=sin(convergence*3.14159265)*neighborhood*.36*(1.-chosen);
        vec3 target=aSelected+(ambient-aSelected)*.32;
        vec3 center=mix(ambient,target,attract);
        vec3 nextCenter=mix(ambientNext,aSelectedNext+(ambientNext-aSelectedNext)*.32,attract);
        center=mix(center,aSelected,gather*chosen);
        nextCenter=mix(nextCenter,aSelectedNext,gather*chosen);
        vec3 tangent=normalize(nextCenter-center);
        vec4 view=modelViewMatrix*vec4(center,1.),clip=projectionMatrix*view;
        vec4 nextClip=projectionMatrix*(view+modelViewMatrix*vec4(tangent,0.));
        float cw=abs(clip.w)<.001?.001:clip.w,nw=abs(nextClip.w)<.001?.001:nextClip.w;
        vec2 delta=(nextClip.xy/nw-clip.xy/cw)*resolution;
        vec2 normal=normalize(vec2(-delta.y,delta.x)+vec2(.00001));
        float depth=max(0.,-view.z),near=exp(-depth/65.);
        float blur=(smoothstep(100.,270.,depth)*.75+(1.-smoothstep(6.,28.,depth))*.55)*(1.-chosen*selection);
        vec4 previousClip=projectionMatrix*modelViewMatrix*fieldFrame*vec4(aPrevious,1.);
        float pw=abs(previousClip.w)<.001?.001:previousClip.w;
        float swept=min(.65,length((clip.xy/cw-previousClip.xy/pw)*resolution)*.035)*(1.-chosen*selection);
        blur+=swept;
        float width=.56+near*.55+blur*1.4+chosen*selection*.48;
        clip.xy+=normal*aSide*width*2./resolution*clip.w;
        gl_Position=clip;vScreen=clip.xy/max(.01,clip.w)*.5+.5;
        float edge=smoothstep(0.,.065,aAlong)*(1.-smoothstep(.91,1.,aAlong));
        float fog=exp(-depth*.0038)*smoothstep(1.,10.,depth);
        float life=mix(aLife,1.,chosen*selection);
        float peripheral=mix(1.,.045,softness);
        float strength=mix((.34+near*.21)*peripheral,.74,chosen*selection);
        // The very same selected strip stays until the aligned native ribbon
        // takes its weight. The two share one envelope, never independent fades.
        vAlpha=edge*fog*life*presence*strength*(1.-chosen*handoff)/(1.+blur*.85);
        vColor=mix(aColor,vec3(.55,.56,.53),chosen*selection);vSide=aSide;vBlur=blur;
      }`,
    fragmentShader:`uniform float prompt; uniform vec2 promptCenter,promptSize;varying vec3 vColor;varying float vAlpha,vSide,vBlur;varying vec2 vScreen;
      void main(){vec2 q=(vScreen-promptCenter)/promptSize;float quiet=1.-prompt*.9*exp(-dot(q,q)*1.7);float edge=1.-smoothstep(mix(.12,0.,vBlur),1.,abs(vSide));gl_FragColor=vec4(vColor,vAlpha*edge*quiet);}`});
  const mesh=new THREE.Mesh(geometry,material);mesh.frustumCulled=false;scene.add(mesh);
  const point=new THREE.Vector3(),nextPoint=new THREE.Vector3(),guide=new THREE.Vector3();
  let elapsed=0,selectedAt=null,chosen=29,station=0;
  function animateGeometry(){
    const a=geometry.attributes;
    a.aPrevious.array.set(a.position.array);a.aPrevious.needsUpdate=true;
    for(let line=0;line<FIELD_STRANDS;line++) {
      const clock=line===chosen&&selectedAt!==null?selectedAt+1.6*(1-Math.exp(-(elapsed-selectedAt)/1.6)):elapsed;
      const alpha=flowLife(line,clock);
      for(let sample=0;sample<=FIELD_SEGMENTS;sample++) {
        sampleFlow(line,sample/FIELD_SEGMENTS,clock,point);sampleFlow(line,sample/FIELD_SEGMENTS+.002,clock,nextPoint);
        const index=(line*(FIELD_SEGMENTS+1)+sample)*2;
        for(let side=0;side<2;side++){a.position.setXYZ(index+side,point.x,point.y,point.z);a.aNext.setXYZ(index+side,nextPoint.x,nextPoint.y,nextPoint.z);a.aLife.setX(index+side,alpha);}
      }
    }
    a.position.needsUpdate=a.aNext.needsUpdate=a.aLife.needsUpdate=true;
  }
  function select(start=0){
    station=start;let score=Infinity;
    const target=pointAt(start+22,new THREE.Vector3());
    for(let line=0;line<FIELD_STRANDS;line++){
      if(flowLife(line,elapsed)<.9)continue;
      sampleFlow(line,.42,elapsed,point).applyMatrix4(frame);
      const d=point.distanceTo(target);if(d<score){score=d;chosen=line;}
    }
    selectedAt=elapsed;material.uniforms.chosenLine.value=chosen;
    const a=geometry.attributes;
    for(let line=0;line<FIELD_STRANDS;line++)for(let sample=0;sample<=FIELD_SEGMENTS;sample++) {
      pointAt(start-64+sample/FIELD_SEGMENTS*290,point);pointAt(start-64+sample/FIELD_SEGMENTS*290+.58,nextPoint);
      const index=(line*(FIELD_SEGMENTS+1)+sample)*2;
      for(let side=0;side<2;side++){a.aSelected.setXYZ(index+side,point.x,point.y,point.z);a.aSelectedNext.setXYZ(index+side,nextPoint.x,nextPoint.y,nextPoint.z);}
    }
    a.aSelected.needsUpdate=a.aSelectedNext.needsUpdate=true;
  }
  select();selectedAt=null;animateGeometry();
  return {scene,camera,geometry,material,select,
    get selectedLine(){return chosen;},
    release(){selectedAt=null;},
    guide(convergence=0){const clock=selectedAt===null?elapsed:selectedAt+1.6*(1-Math.exp(-(elapsed-selectedAt)/1.6));sampleFlow(chosen,.42,clock,guide).applyMatrix4(frame);return guide.lerp(pointAt(station-64+.42*290,point),smootherstep(convergence/.82));},
    resize(width,height){camera.aspect=width/height;camera.fov=camera.aspect<1?67:53;camera.updateProjectionMatrix();material.uniforms.resolution.value.set(width,height);},
    promptBounds(bounds,width,height){material.uniforms.promptCenter.value.set((bounds.left+bounds.width/2)/width,1-(bounds.top+bounds.height/2)/height);material.uniforms.promptSize.value.set(Math.max(.22,bounds.width/width*.6),Math.max(.2,bounds.height/height*.7));},
    update(dt,pose,{convergence=0,selection=0,softness=0,handoff=0,presence=1,prompt=0,reduced=false}={}){
      if(!reduced&&dt>0){elapsed+=dt;animateGeometry();}
      const u=material.uniforms;u.time.value=elapsed;u.convergence.value=convergence;u.selection.value=selection;u.softness.value=softness;u.handoff.value=handoff;u.presence.value=presence;u.prompt.value=prompt;
      camera.position.copy(pose.position);camera.quaternion.copy(pose.quaternion);camera.updateMatrixWorld();
    },
    dispose(){geometry.dispose();material.dispose();scene.remove(mesh);}
  };
}
