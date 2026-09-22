import { createAdaptiveSession } from './adaptive-engine.js';
import { recordResponse } from './learner-model.js';
import { indexKnowledge } from './knowledge-model.js';
import { smootherstep, clamp } from './motion.js';

export const STORY_DURATION = 116;
export const STORY_RATE = 1;
export const instructionCandidates = ['foundations','probability','vectors','matrices','linear-transformations','eigenvectors','mdp','optimization','policy-value','q-learning','policy-learning','reinforcement-learning'];
export const storyBeats = [
  [0, 'Knowledge is connected.'],
  [4, 'Concepts build on one another.'],
  [9, 'Not everything comes at once.'],
  [13, 'Some ideas unlock others.'],
  [18, 'The next step depends on what you already know.'],
  [24, 'Same goal. Different starting points.'],
  [29, 'Already understood. No need to repeat it.', 'Learner A · vectors and matrices'],
  [34, 'A missing foundation changes the next step.', 'Learner B · vector components'],
  [39, 'The destination can be the same. The path doesn’t have to be.'],
  [44, 'Skatebored chooses what comes next.'],
  [48, 'The next step isn’t always another lesson.'],
  [52, 'Sometimes the best move is a question.'],
  [56, 'Sometimes it’s a different explanation.'],
  [60, 'Sometimes it’s only the part you need.'],
  [64, 'You don’t need the whole lecture.'],
  [69, 'Every learner spends time differently.'],
  [73, 'Skatebored learns which actions actually help you learn.'],
  [78, 'Your responses change what comes next.'],
  [82, 'Over time, the path becomes more personal.'],
  [87, 'Less time repeating what you already know.'],
  [91, 'More time learning what you actually need.'],
  [95, 'The goal isn’t more content.'],
  [99, 'It’s better learning.'],
  [103, 'One knowledge space.'],
  [107, 'Millions of possible paths.'],
  [111, 'One learner at a time.'],
  [115, 'SKATEBORED', 'Learning that adapts as you do.'],
];
export function neededStops(state, candidates = instructionCandidates) {
  return candidates.filter(id => state.components[id] && state.components[id].mastery <= .7);
}
const centers = {
  foundations: [-100,-4,22], 'linear-algebra': [-70,8,-80], probability: [63,3,-64],
  optimization: [105,12,-157], mdp: [-19,13,-178], 'policy-value': [-87,2,-223],
  'q-learning': [12,9,-242], 'policy-learning': [85,-6,-249], 'reinforcement-learning': [0,19,-306],
};
export function landscapeLayout(map) {
  const landmarks = [];
  map.children.forEach((region,regionIndex) => {
    const center = centers[region.id] || [regionIndex*28-100,0,-regionIndex*30];
    [...indexKnowledge(region).values()].forEach((node,index) => {
      const strand=index%3, step=Math.floor(index/3);
      const p=index===0 ? [...center] : [center[0]+(strand-1)*25+Math.sin(step*.85+strand)*13,
        center[1]+Math.sin(step*.7+strand)*9-5,center[2]+30-step*13];
      landmarks.push({id:node.id,title:node.title,region:region.id,index,position:p.map(n=>n*.84),
        major:index===0 || instructionCandidates.includes(node.id) || ['components','dot-product'].includes(node.id),
        label:index<7 || instructionCandidates.includes(node.id) || ['components','dot-product'].includes(node.id)});
    });
  });
  return landmarks;
}
// Two subtle copies of the SAME fixed knowledge space. No motion-dependent
// geometry. The early regions separate, and both lanes meet at the same goal.
export function learnerPosition(item,lane='shared') {
  const p=[...item.position];
  if(lane==='shared') return p;
  const spread = item.id==='reinforcement-learning' ? 0 : item.region==='linear-algebra' ? 48 :
    ['foundations','probability','optimization'].includes(item.region) ? 32 : 18;
  p[0]+=(lane==='a' ? -1 : 1)*spread;
  p[1]+=(lane==='a' ? 3 : -3)*(spread/48);
  return p;
}

export function createLearningStory(map) {
  // Fictional observations are deliberately isolated from the real user. Scroll
  // reversal reconstructs the illustrative snapshot, never erases user evidence.
  let a=createAdaptiveSession(map), b=createAdaptiveSession(map), applied=0;
  const observe=(session,ids,passed,key) => ids.forEach(id=>recordResponse(session.state,
    {id:`${key}:${id}`,kcId:id,answer:'yes',strength:2.5,choices:[{id:'yes'},{id:'no'}]},passed?'yes':'no',`${key}:${id}`));
  const events=[
    [26,()=>observe(a,['vectors','matrices'],true,'simulated-known-check')],
    [31,()=>observe(b,['linear-transformations'],false,'simulated-gap-check')],
    [34,()=>{const action=b.start('vectors'),q=b.question(action); b.respond(action.id,q.choices.find(c=>c.id!==q.answer).id);}],
    [42,()=>{const action=b.continue('components'),q=b.question(action);b.respond(action.id,q.answer);}],
    [78,()=>{for(let i=0;i<3;i++) observe(b,['vectors'],true,`simulated-transfer-${i}`);}],
  ];
  return {
    get a(){return a;}, get b(){return b;},
    at(value) {
      const time=clamp(value,0,STORY_DURATION), count=events.filter(([at])=>time>=at).length;
      if(count<applied) {a=createAdaptiveSession(map);b=createAdaptiveSession(map);applied=0;}
      while(applied<count) events[applied++][1]();
      const index=storyBeats.findLastIndex(([at])=>time>=at), [start,heading,detail='']=storyBeats[index];
      const next=storyBeats[index+1]?.[0] ?? Infinity;
      const opacity=smootherstep((time-start)/.65)*(1-smootherstep((time-next+.6)/.6));
      const pair=smootherstep((time-24)/3)*(1-smootherstep((time-96)/7));
      const assessed=time>=26;
      const routeA=assessed?neededStops(a.state):[];
      const routeB=assessed?neededStops(b.state):[];
      if(time>=34 && time<42) routeB.splice(routeB.indexOf('vectors')+1,0,'components');
      const action=time<52?'possibilities':time<56?'Question':time<60?'Explanation':'Video segment';
      return {time,heading,detail,eyebrow:'',captionOpacity:time>=STORY_DURATION?1:opacity,
        pair,labels:smootherstep((time-7)/3),a,b,routeA,routeB,
        route:time>=78?routeB:routeA,profile:time<31?'a':'b',session:time<31?a:b,
        branch:time>=34&&time<42?'components':null,
        actions:time>=44&&time<69,selectedAction:action,video:time>=60&&time<69,
        refinement:smootherstep((time-78)/5),done:time>=STORY_DURATION,
        learnerA:time>=26?'Vectors & matrices understood':'Assessing the same knowledge',
        learnerB:time<34?'Gaps in vectors & transformations':time<42?'Strengthening vector components':time<78?'Reconnected · continue learning':'Understanding changed the route'};
    },
  };
}
