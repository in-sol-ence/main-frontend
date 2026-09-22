import * as THREE from '../vendor/three.module.min.js';
import { landscapeLayout, learnerPosition, instructionCandidates, STORY_DURATION } from './route-plan.js';
import { indexKnowledge } from './knowledge-model.js';
import { smootherstep, clamp } from './motion.js';
const v=values=>new THREE.Vector3(...values);
export function cameraBlend(from,to,progress) {
  const t=smootherstep(progress);
  return {position:from.position.clone().lerp(to.position,t),quaternion:from.quaternion.clone().slerp(to.quaternion,t)};
}
export function createRouteSpace(host) {
  const scene=new THREE.Scene(), camera=new THREE.PerspectiveCamera(53,1,.08,1400);
  const group=new THREE.Group();scene.add(group);
  const dotGeometry=new THREE.SphereGeometry(.32,10,8), entries=[], ribbons=[], captions=[], routeCache=new Map();
  const raycaster=new THREE.Raycaster(), sphere=new THREE.Sphere(), projection=new THREE.Vector3(), lookCamera=camera.clone();
  let layout=[], lookup=new Map(), graph=new Map(), origin=null, currentPose=null, focusId=null, focusStrength=0;
  let activeA=null,activeB=null,timeline=null,selection=null,connector=null,movers=[],hitCandidates=[];
  const colorFor=lane=>lane==='a'?0xc1dbc4:lane==='b'?0xcbbfa7:0x82998d;
  function label(text,className='space-landmark') {
    const node=document.createElement('div');node.className=className;node.textContent=text;host.append(node);return node;
  }
  function ribbon(points,color,width=.13) {
    const curve=new THREE.CatmullRomCurve3(points,false,'centripetal'),positions=[],indices=[],count=200;
    for(let i=0;i<=count;i++) {
      const center=curve.getPoint(i/count),tangent=curve.getTangent(i/count);
      const right=new THREE.Vector3().crossVectors(tangent,new THREE.Vector3(0,1,0)).normalize().multiplyScalar(width);
      if(right.lengthSq()<1e-12) right.set(width,0,0);
      positions.push(...center.clone().add(right).toArray(),...center.clone().sub(right).toArray());
      if(i<count) indices.push(i*2,i*2+1,i*2+2,i*2+1,i*2+3,i*2+2);
    }
    const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geometry.setIndex(indices);
    const material=new THREE.MeshBasicMaterial({color,transparent:true,opacity:0,side:THREE.DoubleSide,depthWrite:false});
    const mesh=new THREE.Mesh(geometry,material);mesh.frustumCulled=false;group.add(mesh);
    const result={geometry,material,mesh,curve,count};ribbons.push(result);return result;
  }
  const world=(id,lane='shared')=>v(learnerPosition(lookup.get(id),lane));
  function poseAt(position,target) {lookCamera.position.copy(position);lookCamera.lookAt(target);return {position,quaternion:lookCamera.quaternion.clone()};}
  function overview(width,height) {return poseAt(new THREE.Vector3(width<height?20:80,145,width<height?290:165),new THREE.Vector3(0,0,-132));}
  function near(id,width,height,scale=1) {
    const point=world(id);
    return poseAt(point.clone().add(new THREE.Vector3(22,43, width<height?170:115).multiplyScalar(scale)),point.clone().add(new THREE.Vector3(0,0,-12)));
  }
  function cameraAt(time,width,height,reduced) {
    const wide=overview(width,height);
    if(reduced) return wide;
    const frames=[
      [0,origin],[8,wide],[14,near('foundations',width,height,1.15)],
      [21,near('vectors',width,height,1.25)],[27,wide],[43,wide],
      [51,near('q-learning',width,height,1.3)],[68,near('q-learning',width,height,1.3)],
      [82,near('linear-transformations',width,height,1.4)],[94,near('reinforcement-learning',width,height,1.4)],
      [105,wide],[STORY_DURATION,wide],
    ];
    let index=frames.findIndex(([at])=>at>time);if(index<0) return frames.at(-1)[1];
    if(index===0) return origin;
    const [start,from]=frames[index-1],[end,to]=frames[index];return cameraBlend(from,to,(time-start)/(end-start));
  }
  function route(ids,lane) {
    if(!ids.length) return null;
    const key=`${lane}:${ids.join(',')}`;
    if(!routeCache.has(key)) {
      const points=[new THREE.Vector3(-10,0,40),...ids.map(id=>world(id,lane))];
      const item=ribbon(points,colorFor(lane),.26);item.ids=ids;item.lane=lane;item.kind='route';routeCache.set(key,item);
    }
    return routeCache.get(key);
  }
  function caption(text,point,kind) {
    const item={node:label(text,`space-note space-note--${kind}`),point,kind,opacity:0};captions.push(item);return item;
  }
  function clear() {
    for(const entry of entries){entry.label?.remove();entry.material.dispose();}
    for(const item of ribbons){item.geometry.dispose();item.material.dispose();}
    for(const item of captions)item.node.remove();
    for(const mover of movers)mover.material.dispose();
    entries.length=0;ribbons.length=0;captions.length=0;routeCache.clear();group.clear();movers=[];hitCandidates=[];focusId=null;focusStrength=0;activeA=null;activeB=null;
  }
  return {
    scene,camera,
    reset(map,from,width,height) {
      clear();origin={position:from.position.clone(),quaternion:from.quaternion.clone()};currentPose=origin;
      camera.position.copy(from.position);camera.quaternion.copy(from.quaternion);camera.aspect=width/height;camera.updateProjectionMatrix();camera.updateMatrixWorld();
      graph=indexKnowledge(map);layout=landscapeLayout(map);lookup=new Map(layout.map(item=>[item.id,item]));
      for(const lane of ['shared','a','b']) {
        for(const item of layout) {
          const material=new THREE.MeshBasicMaterial({color:item.major?colorFor(lane):0x71847a,transparent:true,opacity:0,depthWrite:false});
          const dot=new THREE.Mesh(dotGeometry,material);dot.position.copy(world(item.id,lane));dot.scale.setScalar(item.major?1.15:.4);group.add(dot);
          const showLabel=item.label && (lane==='shared' || ['vectors','matrices','linear-transformations','components'].includes(item.id));
          const node=showLabel?label(item.title,`space-landmark${item.major?' space-landmark--major':''}`):null;
          if(node){node.dataset.concept=item.id;node.dataset.lane=lane;}
          entries.push({...item,lane,dot,material,label:node,opacity:0,labelOpacity:0});
        }
        for(const root of map.children) {
          const members=layout.filter(item=>item.region===root.id);
          for(let strand=0;strand<3;strand++) {
            const membersOnStrand=members.filter((_,i)=>i%3===strand);
            if(membersOnStrand.length<2)continue;
            const line=ribbon(membersOnStrand.map(item=>world(item.id,lane)),colorFor(lane),.07);
            line.kind='landscape';line.lane=lane;
          }
        }
      }
      // Authored prerequisite links remain attached to their actual concepts.
      for(const item of layout.filter(item=>item.major)) for(const prerequisite of graph.get(item.id).prerequisites) {
        if(!lookup.get(prerequisite)?.major)continue;
        const from=world(prerequisite),to=world(item.id),mid=from.clone().lerp(to,.5).add(new THREE.Vector3(5,-4,0));
        const line=ribbon([from,mid,to],0x9aaa91,.10);line.kind='relationship';
      }
      for(const lane of ['a','b']) {
        const material=new THREE.MeshBasicMaterial({color:colorFor(lane),transparent:true,opacity:0,depthWrite:false});
        const dot=new THREE.Mesh(dotGeometry,material);dot.scale.setScalar(2.1);group.add(dot);movers.push({dot,material,lane});
        caption(`LEARNER ${lane.toUpperCase()}`,world('linear-algebra',lane).add(new THREE.Vector3(lane==='a'?-9:3,21,4)),lane);
      }
      const q=world('q-learning'),start=q.clone().add(new THREE.Vector3(28,17,3)),end=start.clone().add(new THREE.Vector3(62,0,0));
      timeline=ribbon([start,end],0x809082,.14);timeline.kind='video';
      selection=ribbon([start.clone().lerp(end,.42),start.clone().lerp(end,.57)],0xe0d6b9,.53);selection.kind='segment';
      connector=ribbon([q,q.clone().lerp(start,.5).add(new THREE.Vector3(0,9,0)),start.clone().lerp(end,.49)],0xb6bda7,.09);connector.kind='video';
      caption('Relevant segment',start.clone().lerp(end,.42).add(new THREE.Vector3(0,6,0)),'segment');
      caption('Q-value update',start.clone().lerp(end,.42).add(new THREE.Vector3(0,-7,0)),'segment-detail');
      ['Question','Practice','Explanation','Video segment'].forEach((text,i)=>caption(text,q.clone().add(new THREE.Vector3([-29,17,-32,22][i],[19,29,-9,-15][i],-3)),`action-${i}`));
      caption('',new THREE.Vector3(),'focus');
    },
    get geometryArrays(){return ribbons.map(item=>item.geometry.attributes.position.array);},
    get pose(){return currentPose;},
    get activeIds(){return activeB?.ids || activeA?.ids || [];},
    get candidates(){return hitCandidates;},
    get focused(){return focusId;},
    focus(hit){focusId=hit?.id ?? null;},
    pick(pointer,width,height) {
      if(!pointer)return null;
      raycaster.setFromCamera({x:pointer.x/width*2-1,y:1-pointer.y/height*2},camera);
      const hits=[];
      for(const item of hitCandidates) {
        const rect=item.rect;
        const textHit=item.labelOpacity>.12 && pointer.x>=rect.x-5 && pointer.x<=rect.x+rect.width+5 && pointer.y>=rect.y-5 && pointer.y<=rect.y+rect.height+5;
        const radius=Math.max(.65,item.depth*Math.tan(camera.fov*Math.PI/360)*2/height*(item.major?13:9));
        sphere.set(item.point,radius);
        const markerHit=raycaster.ray.intersectsSphere(sphere);
        if(textHit||markerHit) hits.push({...item,score:textHit?0:1});
      }
      hits.sort((a,b)=>a.score-b.score||a.depth-b.depth);return hits[0]||null;
    },
    update(dt,state,width,height,externalPose=null,reduced=false) {
      const time=state.time, ease=reduced?1:1-Math.exp(-4*dt), exit=state.exit ?? 1;
      camera.aspect=width/height;camera.fov=camera.aspect<1?67:53;camera.updateProjectionMatrix();
      currentPose=externalPose || cameraAt(time,width,height,reduced);camera.position.copy(currentPose.position);camera.quaternion.copy(currentPose.quaternion);camera.updateMatrixWorld();
      focusStrength+=(Number(Boolean(focusId))-focusStrength)*ease;
      activeA=route(state.routeA,'a');activeB=route(state.routeB,'b');
      const pair=state.pair, formed=smootherstep((time-26)/5);
      for(const item of ribbons) {
        let opacity=0;
        if(item.kind==='landscape') opacity=(item.lane==='shared'?.19*(1-.65*pair):.085*pair)*state.labels;
        if(item.kind==='relationship') opacity=.22*state.labels*(1-.8*pair);
        if(item.kind==='route') {
          const active=item===activeA||item===activeB;
          opacity=active?(item.lane==='a'?.75*(1-.86*smootherstep((time-69)/9)):.93)*pair:(pair*.025);
          if(time>=103&&active) opacity=.20;
          item.geometry.setDrawRange(0,Math.floor(formed*item.count)*6);
        }
        if(item.kind==='video') opacity=state.video?.42:0;
        if(item.kind==='segment') opacity=state.video?1:0;
        item.material.opacity+=(opacity*exit*(1-.25*focusStrength)-item.material.opacity)*ease;
      }
      for(const mover of movers) {
        const selected=mover.lane==='a'?activeA:activeB;
        let progress=clamp((time-27)/(mover.lane==='a'?16:26),0,1);
        if(selected&&mover.lane==='b'&&state.branch) {
          // Attend to the actual prerequisite, not an arbitrary fraction of a curve.
          const target=world(state.branch,'b');let nearest=0,distance=Infinity;
          for(let i=0;i<=100;i++){const d=selected.curve.getPointAt(i/100).distanceToSquared(target);if(d<distance){distance=d;nearest=i/100;}}
          progress=nearest;
        }
        if(selected){const target=selected.curve.getPointAt(progress);if(!mover.initialized){mover.dot.position.copy(target);mover.initialized=true;}else mover.dot.position.lerp(target,ease);}
        mover.material.opacity+=(Number(Boolean(selected&&time<53))*.8*pair*exit-mover.material.opacity)*ease;
      }
      const noteBoxes=[];
      for(const note of captions) {
        let opacity=0;
        if(note.kind==='a'||note.kind==='b') {opacity=pair;note.node.textContent=`LEARNER ${note.kind.toUpperCase()} · ${note.kind==='a'?state.learnerA:state.learnerB}`;}
        if(note.kind.startsWith('action')) opacity=state.actions?(state.selectedAction==='possibilities'?.45:note.node.textContent===state.selectedAction?1:.14):0;
        if(note.kind.startsWith('segment')) opacity=state.video?1:0;
        if(note.kind==='focus'&&focusId){const item=hitCandidates.find(item=>item.id===focusId);if(item){note.point.copy(item.point).add(new THREE.Vector3(0,6,0));note.node.textContent=`${item.title} · ${item.definition.description}`;opacity=focusStrength;}}
        projection.copy(note.point).project(camera);
        const maxWidth=width<700?145:175;
        let x=(projection.x*.5+.5)*width,y=(-projection.y*.5+.5)*height;
        if(note.kind==='a'||note.kind==='b') {
          // Keep each caption beside its own lane, never stacked by edge clamping.
          x-=note.kind==='a'?maxWidth+8:-8;
        }
        x=clamp(x,20,width-(note.kind==='focus'?235:maxWidth)-20);
        if(note.kind==='focus')y-=35;
        if(opacity>.05&&noteBoxes.some(box=>x<box.x+box.w+12&&x+maxWidth+12>box.x&&y<box.y+box.h+12&&y+42>box.y))y+=45;
        opacity*=projection.z>-1&&projection.z<1&&y>height*.29&&y+44<height-105?exit:0;
        if(opacity>.05)noteBoxes.push({x,y,w:note.kind.startsWith('action')?note.node.textContent.length*6:maxWidth,h:note.kind.startsWith('action')?18:40});
        note.opacity+=(opacity-note.opacity)*ease;
        note.node.style.cssText=`left:${x}px;top:${y}px;opacity:${note.opacity}`;
      }
      const boxes=[...noteBoxes];hitCandidates=[];
      const ordered=[...entries].sort((a,b)=>Number(b.id===focusId)-Number(a.id===focusId)||Number(b.major)-Number(a.major)||a.index-b.index);
      for(const entry of ordered) {
        const session=entry.lane==='a'?state.a:state.b;
        const known=entry.lane!=='shared'&&session.state.components[entry.id]?.mastery>.7;
        const lanePresence=entry.lane==='shared'?1-(entry.major?.40:.77)*pair:pair;
        const selected=entry.id===focusId;
        const target=(known?.075:selected||entry.id===state.branch?1:entry.major?.85:.23)*state.labels*lanePresence*exit*(selected?1:1-.42*focusStrength);
        entry.opacity+=(target-entry.opacity)*ease;entry.material.opacity=entry.opacity;
        projection.copy(entry.dot.position).project(camera);
        const depth=entry.dot.position.clone().applyMatrix4(camera.matrixWorldInverse).z*-1;
        const x=(projection.x*.5+.5)*width+7,y=(-projection.y*.5+.5)*height-9;
        const size=entry.major?(width<700?11:15):(width<700?9:10);
        const w=entry.title.length*size*.5,h=size*1.35;
        const onScreen=depth>0&&projection.z<1&&x>8&&x+w<width-10&&y>height*.31&&y+h<height-110;
        let visible=Boolean(entry.label)&&onScreen&&entry.opacity>.02;
        if(visible&&boxes.some(box=>x<box.x+box.w+12&&x+w+12>box.x&&y<box.y+box.h+10&&y+h+10>box.y))visible=false;
        if(visible)boxes.push({x,y,w,h});
        if(entry.label){entry.labelOpacity+=((visible?entry.opacity:0)-entry.labelOpacity)*ease;entry.label.style.cssText=`transform:translate3d(${x}px,${y}px,0);font-size:${size}px;opacity:${entry.labelOpacity}`;entry.label.dataset.known=String(known);}
        if(onScreen&&entry.opacity>.045)hitCandidates.push({id:entry.id,definition:graph.get(entry.id),title:entry.title,lane:entry.lane,point:entry.dot.position,depth,major:entry.major,labelOpacity:entry.labelOpacity,rect:{x,y,width:w,height:h}});
      }

    },
    dispose(){clear();dotGeometry.dispose();},
  };
}
