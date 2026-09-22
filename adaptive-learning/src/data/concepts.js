export const concepts = {
  KC_01: { index: 0, name: 'Arithmetic Mean', description: 'Understanding the arithmetic mean as the center of a dataset.', prerequisites: [] },
  KC_02: { index: 1, name: 'Standard Deviation', description: 'Understanding standard deviation as a measure of variability around the mean.', prerequisites: ['KC_01'] },
  KC_03: { index: 2, name: 'Standardized Distance', description: 'Understanding differences between values or group means in units of standard deviations.', prerequisites: ['KC_01', 'KC_02'] },
  KC_04: { index: 3, name: 'Normal Distributions and Percentiles', description: 'Understanding the relationship between standard deviations and percentile ranks under a normal-distribution assumption.', prerequisites: ['KC_02', 'KC_03'] },
  KC_05: { index: 4, name: "Bloom's Experimental Conditions", description: "Understanding the conventional instruction, mastery learning, and tutoring conditions compared in Bloom's research.", prerequisites: [] },
  KC_06: { index: 5, name: 'Mastery Learning', description: 'Understanding formative assessment, feedback, corrective instruction, and reassessment.', prerequisites: ['KC_05'] },
  KC_07: { index: 6, name: 'Experimental Evidence and Generalization', description: "Understanding the design, scope, and limits of Bloom's reported experiments.", prerequisites: ['KC_05'] },
  KC_08: { index: 7, name: "Bloom's Reported Results", description: 'Understanding the approximately one-sigma mastery-learning result and two-sigma tutoring result.', prerequisites: ['KC_03', 'KC_04', 'KC_05', 'KC_06', 'KC_07'] },
  KC_09: { index: 8, name: 'The 2 Sigma Problem', description: "Understanding Bloom's challenge of reproducing tutoring-level achievement through practical, scalable instruction.", prerequisites: ['KC_08'] },
  KC_10: { index: 9, name: 'Application and Interpretation', description: "Understanding how Bloom's findings motivate adaptive learning without guaranteeing identical results across interventions.", prerequisites: ['KC_07', 'KC_08', 'KC_09'] },
}
