import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../vendor/three.module.min.js';
import { buildJourney } from '../src/journey-provider.js';
import { createLearningStory, landscapeLayout, learnerPosition, instructionCandidates, storyBeats, STORY_DURATION } from '../src/route-plan.js';
import { createAdaptiveSession } from '../src/adaptive-engine.js';
import { createRouteSpace, cameraBlend } from '../src/route-space.js';

const baseline = async () => (await buildJourney({ userGoal: 'Understand Reinforcement Learning' })).map;
test('both learners begin with the same unassessed knowledge space', async () => {
  const map=await baseline(), story=createLearningStory(map), layout=landscapeLayout(map);
  assert.ok(layout.length>100);
  assert.deepEqual(story.a.state,story.b.state);
  assert.deepEqual(story.at(25).routeA,[]);
  assert.deepEqual(story.at(25).routeB,[]);
  assert.equal(story.a.state.responses.length,0);
  for(const id of instructionCandidates) assert.ok(layout.some(n=>n.id===id&&n.major&&n.label));
  assert.equal(new Set(layout.map(n=>n.id)).size,layout.length);
});
test('assessment removes only demonstrated knowledge; two routes genuinely diverge', async () => {
  const story=createLearningStory(await baseline()), state=story.at(32);
  assert.ok(!state.routeA.includes('vectors')&&!state.routeA.includes('matrices'));
  assert.ok(state.routeB.includes('vectors')&&state.routeB.includes('matrices'));
  assert.ok(state.routeA.includes('probability'),'knowing vectors does not prove all mathematics');
  assert.ok(story.a.state.components.vectors.mastery>.7);
  assert.ok(story.b.state.components['linear-transformations'].mastery<.2);
  assert.equal(state.routeA.at(-1),state.routeB.at(-1));
});
test('the actual adaptive engine detours, teaches, reassesses, and reconnects', async () => {
  const story=createLearningStory(await baseline()), detour=story.at(36);
  assert.equal(detour.branch,'components');
  assert.ok(detour.routeB.includes('components')&&!detour.routeA.includes('components'));
  assert.equal(story.b.state.detours[0].prerequisiteId,'components');
  const recovered=story.at(43);
  assert.equal(recovered.branch,null);
  assert.equal(story.b.state.detours.length,0);
  assert.ok(story.b.state.components.components.mastery>.7);
  assert.ok(story.b.state.actions.some(action=>action.reconnect));
  assert.ok(recovered.routeB.includes('vectors'),'a single foundation check does not prove all vectors mastered');
  const refined=story.at(83);
  assert.ok(!refined.routeB.includes('vectors'));
  assert.ok(refined.routeB.includes('linear-transformations'));
  assert.ok(refined.routeB.length<recovered.routeB.length);
});
test('scrolling backward restores the illustrative state and replay never duplicates evidence', async () => {
  const story=createLearningStory(await baseline()); story.at(83);
  const responses=structuredClone(story.b.state.responses);
  story.at(84);assert.deepEqual(story.b.state.responses,responses);
  story.at(20);assert.equal(story.a.state.responses.length,0);assert.equal(story.b.state.responses.length,0);
  story.at(83);assert.deepEqual(story.b.state.responses,responses);
});
test('simulated evidence never reaches the real learner', async () => {
  const map=await baseline(),demo=createLearningStory(map),real=createAdaptiveSession(map);demo.at(STORY_DURATION);
  assert.equal(real.state.responses.length,0);assert.equal(real.state.components['dot-product'].mastery,.2);
  const question=real.start('dot-product'),item=real.question(question);
  assert.equal(real.respond(question.id,item.choices.find(c=>c.id!==item.answer).id).action.type,'PREREQUISITE');
});
test('micro explanations are progressive; the video is a bounded illustrative selection', async () => {
  const story=createLearningStory(await baseline());
  assert.equal(story.at(2).labels,0);
  assert.equal(story.at(5).heading,'Concepts build on one another.');
  for(let i=1;i<storyBeats.length;i++) assert.ok(storyBeats[i][0]-storyBeats[i-1][0]>=4);
  assert.equal(story.at(53).selectedAction,'Question');
  assert.equal(story.at(57).selectedAction,'Explanation');
  assert.equal(story.at(65).selectedAction,'Video segment');
  assert.equal(story.at(65).video,true);assert.equal(story.at(70).video,false);
  assert.equal(story.at(STORY_DURATION).heading,'SKATEBORED');assert.ok(story.at(STORY_DURATION).done);
});
test('the fixed spaces diverge in mathematics and converge at the identical RL destination', async () => {
  const layout=landscapeLayout(await baseline());
  const vectors=layout.find(n=>n.id==='vectors'),goal=layout.find(n=>n.id==='reinforcement-learning');
  assert.ok(new THREE.Vector3(...learnerPosition(vectors,'a')).distanceTo(new THREE.Vector3(...learnerPosition(vectors,'b')))>90);
  assert.deepEqual(learnerPosition(goal,'a'),learnerPosition(goal,'b'));
});
test('camera handoff has exact endpoints and eased starts and ends', () => {
  const from={position:new THREE.Vector3(1,2,3),quaternion:new THREE.Quaternion()};
  const to={position:new THREE.Vector3(150,20,-200),quaternion:new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,1,0),1)};
  assert.deepEqual(cameraBlend(from,to,0).position,from.position);
  assert.ok(cameraBlend(from,to,1).position.distanceTo(to.position)<1e-10);
  assert.ok(cameraBlend(from,to,.001).position.distanceTo(from.position)<.00001);
  assert.ok(cameraBlend(from,to,.999).position.distanceTo(to.position)<.00001);
});
test('the entire camera story is continuous; route geometry is immutable and raycasting works', async () => {
  const map=await baseline(),story=createLearningStory(map),previous=globalThis.document;
  globalThis.document={createElement:()=>({dataset:{},style:{},textContent:'',remove(){}})};
  try {
    const space=createRouteSpace({append(){}}),from={position:new THREE.Vector3(0,10,50),quaternion:new THREE.Quaternion()};
    space.reset(map,from,1280,720);assert.deepEqual(space.camera.position,from.position);
    const snapshots=new Map();let last=from.position.clone();
    for(let frame=0;frame<=STORY_DURATION*20;frame++) {
      space.update(1/20,story.at(frame/20),1280,720);
      assert.ok(space.pose.position.distanceTo(last)<5,'no camera jump at a story boundary');last.copy(space.pose.position);
      for(const array of space.geometryArrays) if(!snapshots.has(array))snapshots.set(array,[...array]);
    }
    for(const [array,snapshot] of snapshots)assert.deepEqual([...array],snapshot);
    for(let i=0;i<60;i++)space.update(1/60,story.at(58),1280,720);
    const hit=space.candidates.find(n=>n.id==='q-learning'&&n.labelOpacity>.12);
    assert.ok(hit,'Q-Learning is visible and selectable');
    assert.equal(space.pick({x:hit.rect.x+5,y:hit.rect.y+5},1280,720).id,'q-learning');
    const pose=space.pose.position.clone();space.update(.016,story.at(90),1280,720);space.update(.016,story.at(58),1280,720);
    assert.ok(space.pose.position.distanceTo(pose)<1e-9,'rewind returns the exact camera composition');
    space.dispose();
  } finally {globalThis.document=previous;}
});
