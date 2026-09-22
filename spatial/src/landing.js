import * as THREE from '../vendor/three.module.min.js';
import { smootherstep, clamp } from './motion.js';
import { openingPose } from './knowledge-field.js';

export const LANDING_DURATION = 8.6;
export function landingEnvelope(seconds, reduced=false) {
  const t=clamp(seconds/(reduced?1.2:LANDING_DURATION),0,1);
  const ease=value=>clamp(smootherstep(value),0,1);
  return {t, travel:ease(t), identity:1-ease(t/.22),
    field:ease((t-(reduced?.5:.28))/(reduced?.5:.62)), board:1-ease(reduced?t/.45:(t-.66)/.23),
    line:1-ease((t-.76)/.24), prompt:ease((t-.78)/.22), done:t===1};
}
export function deckHeight(x,z) {
  return .16+.10*(x/1.09)**2+.55*smootherstep((Math.abs(z)-2.65)/1.55);
}
export function deckWidth(z) {
  return 1.09*Math.sqrt(Math.max(0,1-(Math.max(0,Math.abs(z)-3)/1.2)**2));
}
function deckGeometry(offset=0) {
  const positions=[],uv=[],indices=[],length=112,cross=24;
  for(let j=0;j<=length;j++) {
    const z=-4.2+8.4*j/length,half=deckWidth(z);
    for(let i=0;i<=cross;i++) {
      const x=(i/cross*2-1)*half;positions.push(x,deckHeight(x,z)+offset,z);uv.push(i/cross,j/length);
      if(i<cross&&j<length){const k=j*(cross+1)+i;indices.push(k,k+cross+1,k+1,k+1,k+cross+1,k+cross+2);}
    }
  }
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setIndex(indices);g.computeVertexNormals();return g;
}
function edgeGeometry(top,bottom) {
  const p=[],indices=[];const steps=224;
  for(let i=0;i<=steps;i++) {
    const side=i<=steps/2?-1:1,u=i<=steps/2?i/(steps/2):2-i/(steps/2),z=-4.2+8.4*u,x=side*deckWidth(z);
    p.push(x,deckHeight(x,z)+top,z,x,deckHeight(x,z)+bottom,z);
    if(i<steps)indices.push(i*2,i*2+1,i*2+2,i*2+1,i*2+3,i*2+2);
  }
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));g.setIndex(indices);g.computeVertexNormals();return g;
}
function gripTexture() {
  const size=128,bytes=new Uint8Array(size*size*4);let seed=17;
  for(let i=0;i<size*size;i++){seed=(Math.imul(seed,1664525)+1013904223)>>>0;const value=90+(seed>>>24)*.55;bytes.set([value,value,value,255],i*4);}
  const texture=new THREE.DataTexture(bytes,size,size);texture.wrapS=texture.wrapT=THREE.RepeatWrapping;texture.repeat.set(5,18);texture.needsUpdate=true;return texture;
}
export function createLanding() {
  const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(38,1,.1,1600),frame=new THREE.Group(),board=new THREE.Group();
  const anchor=openingPose();frame.position.copy(anchor.position);frame.quaternion.copy(anchor.quaternion);scene.add(frame);frame.add(board);
  const materials=[],geometries=[],lines=[];const grip=gripTexture();
  const standard=values=>{const material=new THREE.MeshStandardMaterial({...values,transparent:true});materials.push(material);return material;};
  const matte=standard({color:0x191e1e,roughness:.96,metalness:.04,bumpMap:grip,bumpScale:.009});
  const underside=standard({color:0x161d1d,roughness:.55,metalness:.18});
  const metal=standard({color:0xa6b0ad,roughness:.27,metalness:.76});
  const graphite=standard({color:0x252d2c,roughness:.43,metalness:.55});
  const rubber=standard({color:0xa0a092,roughness:.68,metalness:0});
  const hub=standard({color:0x3b4541,roughness:.36,metalness:.65});
  const dark=standard({color:0x111615,roughness:.65});
  function mesh(geometry,material,parent=board,position=[0,0,0]) {
    geometries.push(geometry);const obj=new THREE.Mesh(geometry,material);obj.position.set(...position);parent.add(obj);return obj;
  }
  mesh(deckGeometry(),matte);mesh(deckGeometry(-.17),underside).material.side=THREE.DoubleSide;
  for(let layer=0;layer<7;layer++)mesh(edgeGeometry(-layer*.024,-(layer+1)*.024),standard({color:layer%2?0x504a3d:0x72644f,roughness:.67,metalness:.05}));
  function cylinder(radius,length,material,position,axis='y') {
    const item=mesh(new THREE.CylinderGeometry(radius,radius,length,32),material,board,position);
    if(axis==='x')item.rotation.z=Math.PI/2;return item;
  }
  for(const z of [-2.48,2.48]) {
    mesh(new THREE.BoxGeometry(.68,.11,.92),graphite,board,[0,-.12,z]);
    const kingpin=cylinder(.14,.42,metal,[0,-.37,z+.1]);kingpin.rotation.x=-.3;
    cylinder(.21,.13,graphite,[0,-.37,z+.12]);
    const hanger=mesh(new THREE.CylinderGeometry(.16,.24,1.74,16),metal,board,[0,-.54,z]);hanger.rotation.z=Math.PI/2;
    cylinder(.065,2.69,metal,[0,-.57,z],'x');
    for(const side of [-1,1]) {
      const wheel=mesh(new THREE.LatheGeometry([new THREE.Vector2(.18,-.25),new THREE.Vector2(.36,-.25),new THREE.Vector2(.43,-.20),new THREE.Vector2(.45,-.13),new THREE.Vector2(.45,.13),new THREE.Vector2(.43,.20),new THREE.Vector2(.36,.25),new THREE.Vector2(.18,.25)],48),rubber,board,[side*1.23,-.57,z]);wheel.rotation.z=Math.PI/2;
      cylinder(.18,.49,hub,[side*1.23,-.57,z],'x');
      cylinder(.085,.045,metal,[side*1.5,-.57,z],'x');
      for(const dz of [-.29,.29]) {
        const x=side*.25,y=deckHeight(x,z+dz)+.012;
        cylinder(.045,.018,metal,[x,y,z+dz]);mesh(new THREE.BoxGeometry(.047,.006,.008),dark,board,[x,y+.012,z+dz]);
      }
    }
  }
  const hemi=new THREE.HemisphereLight(0xb0c5cf,0x24211b,1.8);frame.add(hemi);
  function light(color,intensity,position){const lamp=new THREE.DirectionalLight(color,intensity);lamp.position.set(...position);lamp.target=board;frame.add(lamp);return lamp;}
  light(0xe0e4d8,4.1,[3,8,5]);light(0xa5bebc,3.2,[-6,2,-5]);light(0xd6baa0,1.3,[6,1,-7]);
  // Fine, fixed geometry carries a slowly travelling variation in luminance.
  function flowingLine(points,radius,parent,branch=0) {
    const curve=new THREE.CatmullRomCurve3(points,false,'centripetal');
    const material=new THREE.ShaderMaterial({transparent:true,depthWrite:false,uniforms:{time:{value:0},alpha:{value:1},reveal:{value:1},branch:{value:branch}},
      vertexShader:'varying vec2 vUv; void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
      fragmentShader:'varying vec2 vUv; uniform float time,alpha,reveal,branch; void main(){float flow=.47+.24*sin(vUv.x*13.-time*.27+branch);float edge=1.-smoothstep(reveal-.025,reveal,vUv.x);gl_FragColor=vec4(mix(vec3(.42,.51,.47),vec3(.78,.79,.67),flow),alpha*edge*(.42+.58*flow));}'});
    materials.push(material);const item=mesh(new THREE.TubeGeometry(curve,240,radius,5,false),material,parent);item.renderOrder=3;lines.push(item);return item;
  }
  const deckPoints=[];for(let i=0;i<=72;i++){const z=3.85-i/72*7.7,x=.34*Math.sin(z*.95)+.12*Math.sin(z*1.6);deckPoints.push(new THREE.Vector3(x,deckHeight(x,z)+.018,z));}
  flowingLine(deckPoints,.016,board);
  for(const sign of [-1,1]){const points=[];for(let i=0;i<=32;i++){const t=i/32,z=sign*.6-t*1.7,x=.34*Math.sin(z*.95)+.12*Math.sin(z*1.6)+sign*smootherstep(t)*.40;points.push(new THREE.Vector3(x,deckHeight(x,z)+.022,z));}flowingLine(points,.006,board,sign);}
  const route=new THREE.CatmullRomCurve3([[0,.18,0],[2,.28,-4],[6,.6,-15],[-5,1.4,-31],[0,.7,-58],[10,4,-90]].map(p=>new THREE.Vector3(...p)),false,'centripetal');
  const trail=flowingLine(route.getPoints(100),.025,frame);trail.material.uniforms.alpha.value=0;
  let clock=0,launch=null,cursor=new THREE.Vector2(),targetCursor=new THREE.Vector2(),idlePose=null,startPose=null;
  const helper=new THREE.PerspectiveCamera(),localPosition=new THREE.Vector3(),target=new THREE.Vector3();
  function worldPose(position,quaternion){return {position:position.clone().applyQuaternion(anchor.quaternion).add(anchor.position),quaternion:anchor.quaternion.clone().multiply(quaternion)};}
  function poseForIdle(width,height,reduced) {
    const aspect=width/height,fit=aspect<1?Math.max(1,1.1/aspect):1;
    localPosition.set(8.4*fit,6.6*fit,12.8*fit);
    if(!reduced)localPosition.add(new THREE.Vector3(cursor.x*.22,cursor.y*.12,Math.sin(clock*.11)*.06));
    helper.position.copy(localPosition);helper.lookAt(0,.05,0);return {position:localPosition.clone(),quaternion:helper.quaternion.clone()};
  }
  return {scene,camera,board,
    get geometryArrays(){return geometries.map(g=>g.attributes.position.array);},
    get active(){return launch!==null;},
    pointer(x,y){targetCursor.set(clamp(x,-1,1),clamp(y,-1,1));},
    start(){if(launch!==null)return false;launch=0;startPose=idlePose;return true;},
    update(dt,width,height,reduced=false) {
      const safeDt=Math.min(Math.max(dt,0),.05);if(!reduced)clock+=safeDt;
      cursor.lerp(targetCursor,1-Math.exp(-safeDt*2));
      idlePose=poseForIdle(width,height,reduced);
      if(launch!==null)launch+=safeDt;
      const state=landingEnvelope(launch??0,reduced),t=launch===null?0:state.t;
      board.position.set(0,reduced?0:Math.sin(clock*.47)*.035,0);
      board.rotation.set(reduced?0:Math.sin(clock*.31)*.009,-.48+(!reduced?cursor.x*.025:0),.07+(!reduced?Math.sin(clock*.29)*.009+cursor.y*.012:0));
      let local=idlePose;
      if(launch!==null&&!reduced) {
        const progress=state.travel,point=route.getPointAt(progress*.97),direction=route.getTangentAt(progress*.97);
        board.position.lerp(point,smootherstep(t/.17));
        board.rotation.y=THREE.MathUtils.lerp(-.48,Math.atan2(-direction.x,-direction.z),smootherstep(t/.22));
        board.rotation.z=THREE.MathUtils.lerp(.07,clamp(direction.x*.13,-.075,.075),smootherstep(t/.3));
        const from=startPose||idlePose,u=1-progress;
        const position=from.position.clone().multiplyScalar(u**3).addScaledVector(new THREE.Vector3(11,5,12),3*u*u*progress).addScaledVector(new THREE.Vector3(1,1,3),3*u*progress*progress);
        target.copy(point).add(new THREE.Vector3(0,0,-8));helper.position.copy(position);helper.lookAt(target);
        const rotation=from.quaternion.clone().slerp(helper.quaternion,smootherstep(t/.5)).slerp(new THREE.Quaternion(),smootherstep((t-.45)/.55));
        local={position,quaternion:rotation};
      }
      if(reduced&&launch!==null)local=state.t<.5?idlePose:{position:new THREE.Vector3(),quaternion:new THREE.Quaternion()};
      const pose=worldPose(local.position,local.quaternion);camera.position.copy(pose.position);camera.quaternion.copy(pose.quaternion);
      // Lens also settles on the product's existing opening lens, without a cut.
      camera.aspect=width/height;camera.fov=THREE.MathUtils.lerp(38,width<height?67:53,state.travel);camera.updateProjectionMatrix();camera.updateMatrixWorld();
      const arrival=reduced?1:smootherstep(clock/1.4);
      for(const material of materials){if(material.uniforms){material.uniforms.time.value=clock;material.uniforms.alpha.value=state.board*arrival;}else material.opacity=state.board*arrival;}
      trail.material.uniforms.alpha.value=launch===null||reduced?0:smootherstep(t/.18)*state.line;
      trail.material.uniforms.reveal.value=clamp(state.travel+.075,0,1);
      board.visible=state.board>.001;
      return {...state,pose,started:launch!==null};
    },
    dispose(){for(const g of geometries)g.dispose();for(const m of materials)m.dispose();grip.dispose();scene.clear();},
  };
}
