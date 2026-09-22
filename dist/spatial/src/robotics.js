const n = (id, title, domain, importance, description, prerequisites = [], children = []) => ({ id, title, domain, importance, description, prerequisites, children });
const m = (id, title, description, prerequisites = [], children = []) => n(id, title, 'mathematics', .7, description, prerequisites, children);
const c = (id, title, description, prerequisites = [], children = []) => n(id, title, 'computing', .7, description, prerequisites, children);
const p = (id, title, description, prerequisites = [], children = []) => n(id, title, 'physics', .8, description, prerequisites, children);
export const roboticsMap = n('robotics-journey', 'Autonomous Robot Navigation', 'computing', 1, 'Connect sensing, reasoning, and action in one navigating robot.', [], [
  c('robot-programming', 'Programming', 'Turn observations into actions.', [], [c('robot-loops', 'Control Loops', 'Read, compute, act, and repeat.'), c('robot-data', 'Data Structures', 'Represent the robot and its surroundings.', ['robot-loops'])]),
  m('robot-geometry', 'Geometry', 'Describe locations and relative directions.', [], [
    m('robot-coordinates', 'Coordinates', 'Locate a point in a reference frame.', [], [
      m('robot-frames', 'Reference Frames', 'Choose the origin and axes.', [], [
        m('robot-frame-transforms', 'Frame Transforms', 'Move a position between frames.', [], [
          m('robot-homogeneous', 'Homogeneous Coordinates', 'Represent translation and rotation together.'),
          m('robot-transform-compose', 'Transform Composition', 'Chain transformations in the correct order.', ['robot-homogeneous']),
        ]), m('robot-relative-pose', 'Relative Pose', 'Position and orientation between two frames.', ['robot-frame-transforms']),
      ]), m('robot-distance', 'Distance & Direction', 'Measure separation and bearing.', ['robot-frames']),
    ]), m('robot-shapes', 'Spatial Boundaries', 'Represent obstacles and free space.', ['robot-coordinates']),
  ]),
  m('robot-linear', 'Linear Algebra', 'Transform states and measurements.', ['robot-geometry'], [m('robot-vectors', 'Vectors & Matrices', 'Represent states and linear operations.'), m('robot-jacobians', 'Jacobians', 'Approximate local changes in a nonlinear system.', ['robot-vectors'])]),
  p('robot-sensors', 'Sensors', 'Measure a world with noise and blind spots.', ['robot-programming'], [p('robot-encoders', 'Encoders & IMUs', 'Estimate motion from onboard measurements.'), p('robot-range', 'Range Sensors', 'Measure distance to nearby surfaces.'), p('robot-calibration', 'Calibration', 'Estimate sensor offsets and alignment.', ['robot-encoders', 'robot-range'])]),
  n('robot-probability', 'Probability', 'probability', .78, 'Reason about uncertain measurements.', [], [n('robot-belief', 'Belief States', 'probability', .7, 'Represent uncertainty over possible locations.'), n('robot-bayes', 'Bayesian Updates', 'probability', .85, 'Combine a prior belief with a measurement.', ['robot-belief'])]),
  n('robot-vision', 'Computer Vision', 'learning', .84, 'Infer structure from images.', ['robot-linear', 'robot-sensors'], [n('robot-features', 'Visual Features', 'learning', .6, 'Find repeatable patterns in images.'), n('robot-matching', 'Feature Matching', 'learning', .8, 'Associate landmarks across views.', ['robot-features']), n('robot-localization', 'Visual Localization', 'learning', .9, 'Estimate camera motion using the scene.', ['robot-matching'])]),
  p('robot-control', 'Control Theory', 'Correct motion using feedback.', ['robot-linear', 'robot-sensors'], [p('robot-error', 'Tracking Error', 'Compare desired and measured state.'), p('robot-feedback', 'Feedback Control', 'Adjust actions to reduce the error.', ['robot-error']), p('robot-stability', 'Stability', 'Keep corrections from amplifying disturbances.', ['robot-feedback'])]),
  c('robot-planning', 'Path Planning', 'Find safe routes through free space.', ['robot-geometry', 'robot-probability'], [c('robot-map', 'Occupancy Maps', 'Record where obstacles might be.'), c('robot-search', 'Graph Search', 'Find low-cost routes through a map.', ['robot-map']), c('robot-replan', 'Replanning', 'Update the route as the world changes.', ['robot-search'])]),
  n('robot-autonomy', 'Robotics', 'computing', 1, 'Close the loop between perception, planning, and control.', ['robot-vision', 'robot-control', 'robot-planning'], [c('robot-fusion', 'Sensor Fusion', 'Combine complementary measurements.'), c('robot-state-estimation', 'State Estimation', 'Infer position and motion over time.', ['robot-fusion']), c('robot-stack', 'Navigation Stack', 'Coordinate estimation, planning, and control.', ['robot-state-estimation'])]),
]);
