import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../vendor/three.module.min.js';
import { Journey, ScrollTravel, wheelPixels } from '../src/motion.js';
import { createRouteSpace } from '../src/route-space.js';
import { createLearningStory, STORY_RATE } from '../src/route-plan.js';
import { buildJourney } from '../src/journey-provider.js';
import { resolveLabels } from '../src/landmark-layout.js';

test('wheel and trackpad normalization preserve fine input and bound large bursts', () => {
  assert.equal(wheelPixels(.25),.25);
  assert.equal(wheelPixels(3,1),48);
  assert.equal(wheelPixels(-3,1),-48);
  assert.equal(wheelPixels(1,2,900),240);
  assert.equal(wheelPixels(9000),240);
});
test('scroll changes a target, not the camera; tiny motion is precise', () => {
  const travel = new ScrollTravel(); travel.begin(30); travel.move(.1,0,100);
  assert.equal(travel.position,30);
  for(let i=0;i<120;i++) travel.update(1/60);
  assert.ok(Math.abs(travel.position-30.1)<1e-6);
});
test('reverse scroll glides without snapping and settles without overshoot', () => {
  const travel = new ScrollTravel(); travel.begin(50); travel.move(20,0,100);
  for(let i=0;i<12;i++) travel.update(1/60);
  const before=travel.position; travel.move(-35,0,100);
  assert.equal(travel.position,before);
  assert.ok(Math.abs(travel.update(1/60)-before)<1);
  for(let i=0;i<240;i++) travel.update(1/60);
  assert.ok(Math.abs(travel.position-35)<1e-8);
});
test('scroll bounds and input queue cannot produce unbounded coasting', () => {
  const travel = new ScrollTravel(); travel.begin(15);
  for(let i=0;i<100;i++) travel.move(100,0,100);
  assert.equal(travel.target,57);
  for(let i=0;i<180;i++) travel.update(1/60);
  travel.move(-500,0,100);
  assert.ok(travel.target>=0);
  for(let i=0;i<180;i++) travel.update(1/60);
  assert.ok(travel.position>=0 && travel.position<=100);
});
test('manual travel is frame-rate independent and never auto-resumes', () => {
  const a=new Journey(), b=new Journey();
  for(const motor of [a,b]) motor.takeControl(30,0,300);
  for(let i=0;i<180;i++) a.update(1/60,true);
  for(let i=0;i<360;i++) b.update(1/120,true);
  assert.ok(Math.abs(a.distance-b.distance)<1e-9);
  const position=a.distance;
  for(let i=0;i<600;i++) a.update(1/60,true);
  assert.ok(Math.abs(a.distance-position)<1e-7);
  assert.equal(a.scroll.active,true);
  const beforeResume=a.distance;
  a.resume(); assert.equal(a.distance,beforeResume); assert.equal(a.scroll.active,false);
  a.update(1/60); assert.ok(a.distance>=beforeResume && a.distance<beforeResume+.001);
});
test('label collision ownership is stable as projected depth order changes', () => {
  const a={x:100,y:100,width:100,height:30,opacity:.8,depth:20,priority:.8,order:10};
  const b={...a,depth:20.01,priority:.6,order:20};
  resolveLabels([a,b],1280,720); assert.ok(a.targetOpacity>0); assert.equal(b.targetOpacity,0);
  a.depth=20.02; b.depth=19.99;
  resolveLabels([a,b],1280,720); assert.ok(a.targetOpacity>0); assert.equal(b.targetOpacity,0);
});
test('slower composition preserves all adaptive concepts and hierarchy', async () => {
  const {map}=await buildJourney({userGoal:'Understand Reinforcement Learning'});
  assert.equal(map.children.length,9);
  for(let i=1;i<map.children.length;i++) {
    const gap=map.children[i].at-map.children[i-1].at;
    assert.ok(gap>.035 && gap<.063);
  }
  assert.equal(STORY_RATE,1);
});
test('manual story travel drives reversible narration and resumes from the same moment', async () => {
  const {map}=await buildJourney({userGoal:'Understand Reinforcement Learning'});
  const story=createLearningStory(map),motor=new Journey({startDistance:28,cruiseSpeed:STORY_RATE,speedAt:()=>1});
  story.at(motor.distance);motor.takeControl(8,0,116);
  for(let i=0;i<180;i++)motor.update(1/60,true);
  assert.ok(Math.abs(motor.distance-36)<1e-7);
  assert.equal(story.at(motor.distance).branch,'components');
  motor.takeControl(-16,0,116);
  for(let i=0;i<180;i++)motor.update(1/60,true);
  story.at(motor.distance);assert.equal(story.b.state.responses.length,0);
  const at=motor.distance;motor.resume();motor.update(1/60,false);
  assert.ok(motor.distance>=at&&motor.distance<at+.001);
});
