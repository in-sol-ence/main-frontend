import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../vendor/three.module.min.js';
import { createLanding, landingEnvelope, deckHeight, deckWidth, LANDING_DURATION } from '../src/landing.js';
import { openingPose } from '../src/knowledge-field.js';

test('landing stages are bounded and hand off at the exact existing opening',()=>{
  for(let i=-10;i<=200;i++) {
    const state=landingEnvelope(i/10);
    for(const [key,value] of Object.entries(state)) if(key!=='done')assert.ok(value>=0&&value<=1,key);
  }
  const done=landingEnvelope(LANDING_DURATION);
  assert.equal(done.board,0);assert.equal(done.line,0);assert.equal(done.field,1);assert.equal(done.prompt,1);assert.equal(done.done,true);
});
test('deck has rounded ends, concave edges, and raised nose/tail without invalid coordinates',()=>{
  for(let i=0;i<=200;i++){const z=-4.2+i/200*8.4;assert.ok(Number.isFinite(deckWidth(z)));assert.ok(Number.isFinite(deckHeight(deckWidth(z),z)));}
  assert.ok(deckWidth(0)>1);assert.ok(deckWidth(4.2)<1e-7);
  assert.ok(deckHeight(0,4)>deckHeight(0,0)+.4);assert.ok(deckHeight(1,0)>deckHeight(0,0));
});
test('desktop, short, and portrait compositions keep the board clear of the identity and CTA',()=>{
  for(const [width,height] of [[1920,1080],[1366,768],[1280,720],[1024,600],[844,390],[390,844],[375,667]]) {
    const landing=createLanding();landing.update(0,width,height,true);landing.scene.updateMatrixWorld(true);
    landing.board.traverse(object=>{
      if(!object.geometry)return;
      const vertices=object.geometry.attributes.position;
      for(let i=0;i<vertices.count;i++){
        const point=new THREE.Vector3().fromBufferAttribute(vertices,i).applyMatrix4(object.matrixWorld).project(landing.camera);
        assert.ok(Math.abs(point.x)<.96,`${width}x${height}: horizontal margin`);
        assert.ok(point.y>-.43&&point.y<.9,`${width}x${height}: identity clearance ${point.y}`);
      }
    });
    landing.dispose();
  }
});
test('the launch is single-use, continuous, and never rewrites board or trail geometry',()=>{
  const landing=createLanding(),width=1280,height=720;
  let state=landing.update(0,width,height),previous=state.pose;
  const snapshots=landing.geometryArrays.map(a=>[...a]);assert.equal(landing.start(),true);assert.equal(landing.start(),false);
  for(let frame=0;frame<600;frame++) {
    state=landing.update(1/60,width,height);
    assert.ok(state.pose.position.distanceTo(previous.position)<.4,'continuous camera position');
    assert.ok(state.pose.quaternion.angleTo(previous.quaternion)<.06,'continuous orientation');
    previous=state.pose;
  }
  const destination=openingPose();assert.ok(state.done);
  assert.ok(state.pose.position.distanceTo(destination.position)<1e-9);
  assert.ok(state.pose.quaternion.angleTo(destination.quaternion)<1e-7);
  assert.equal(landing.camera.fov,53);
  landing.geometryArrays.forEach((array,i)=>assert.deepEqual([...array],snapshots[i]));landing.dispose();
});
test('reduced motion keeps idle still and changes viewpoint only while the object and field are absent',()=>{
  const landing=createLanding(),initial=landing.update(0,390,844,true);
  for(let i=0;i<60;i++){const s=landing.update(1/60,390,844,true);assert.deepEqual(s.pose,initial.pose);}
  landing.start();let previous=initial.pose;
  for(let i=0;i<90;i++) {
    const state=landing.update(1/60,390,844,true);
    if(state.pose.position.distanceTo(previous.position)>1) {assert.equal(state.board,0);assert.ok(state.field<.001);}
    previous=state.pose;
  }
  assert.equal(landing.camera.fov,67);landing.dispose();
});
test('bounded cursor response and frame-rate independent idle motion',()=>{
  const a=createLanding(),b=createLanding();a.pointer(1,1);b.pointer(1,1);
  for(let i=0;i<180;i++)a.update(1/60,1280,720);
  for(let i=0;i<360;i++)b.update(1/120,1280,720);
  assert.ok(a.camera.position.distanceTo(b.camera.position)<1e-8);
  assert.ok(Math.abs(a.board.rotation.y+.48)<.026);assert.ok(Math.abs(a.board.position.y)<.036);
  a.dispose();b.dispose();
});
