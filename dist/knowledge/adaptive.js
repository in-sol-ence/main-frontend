import { r as g, j as d, K as A, c as k } from "./KnowledgeScene-DmcaLnKC.js";
const S = "skatebored-bloom-two-sigma", E = 1, B = !1, D = "Bloom’s 2 Sigma Problem", j = "stage-01", z = { KC_01: { index: 0, name: "Arithmetic Mean", description: "Understanding the arithmetic mean as the center of a dataset.", prerequisites: [] }, KC_02: { index: 1, name: "Standard Deviation", description: "Understanding standard deviation as a measure of variability around the mean.", prerequisites: ["KC_01"] }, KC_03: { index: 2, name: "Standardized Distance", description: "Understanding differences between values or group means in units of standard deviations.", prerequisites: ["KC_01", "KC_02"] }, KC_04: { index: 3, name: "Normal Distributions and Percentiles", description: "Understanding the relationship between standard deviations and percentile ranks under a normal-distribution assumption.", prerequisites: ["KC_02", "KC_03"] }, KC_05: { index: 4, name: "Bloom's Experimental Conditions", description: "Understanding the conventional instruction, mastery learning, and tutoring conditions compared in Bloom's research.", prerequisites: [] }, KC_06: { index: 5, name: "Mastery Learning", description: "Understanding formative assessment, feedback, corrective instruction, and reassessment.", prerequisites: ["KC_05"] }, KC_07: { index: 6, name: "Experimental Evidence and Generalization", description: "Understanding the design, scope, and limits of Bloom's reported experiments.", prerequisites: ["KC_05"] }, KC_08: { index: 7, name: "Bloom's Reported Results", description: "Understanding the approximately one-sigma mastery-learning result and two-sigma tutoring result.", prerequisites: ["KC_03", "KC_04", "KC_05", "KC_06", "KC_07"] }, KC_09: { index: 8, name: "The 2 Sigma Problem", description: "Understanding Bloom's challenge of reproducing tutoring-level achievement through practical, scalable instruction.", prerequisites: ["KC_08"] }, KC_10: { index: 9, name: "Application and Interpretation", description: "Understanding how Bloom's findings motivate adaptive learning without guaranteeing identical results across interventions.", prerequisites: ["KC_07", "KC_08", "KC_09"] } }, R = /* @__PURE__ */ JSON.parse(`{"stage-01-core":{"id":"stage-01-core","stageId":"stage-01","conceptIds":["KC_01"],"questionType":"multiple_choice","questionText":"Four students score 60, 70, 80, and 90 on a test.\\n\\nWhat is the class mean?","choices":[{"id":"A","text":"70"},{"id":"B","text":"75"},{"id":"C","text":"80"},{"id":"D","text":"90"}],"correctAnswer":"B","answerExplanation":"(60+70+80+90) / 4=75 \\n\\nThe mean gives a reference point for the center of these scores.","difficulty":"Introductory","prerequisiteConceptIds":[],"sourceIds":[]},"stage-01-transfer":{"id":"stage-01-transfer","stageId":"stage-01","conceptIds":["KC_01"],"questionType":"multiple_choice","questionText":"A class has an average test score of 72.\\n\\nEvery student's score is then increased by exactly 5 points.\\n\\nWhat is the new mean?","choices":[{"id":"A","text":"72"},{"id":"B","text":"75"},{"id":"C","text":"77"},{"id":"D","text":"Cannot tell"}],"correctAnswer":"C","answerExplanation":"Adding 5 to every observation increases the mean by 5.","difficulty":"Introductory","prerequisiteConceptIds":[],"sourceIds":[]},"stage-02-core":{"id":"stage-02-core","stageId":"stage-02","conceptIds":["KC_02"],"questionType":"multiple_choice","questionText":"Two classes both have a mean score of 80.\\n\\nClass A's scores are mostly between 78 and 82.\\n\\nClass B's scores are mostly between 60 and 100.\\n\\nWhich class has the larger standard deviation?","choices":[{"id":"A","text":"Class A"},{"id":"B","text":"Class B"},{"id":"C","text":"They have the same standard deviation because their means are equal"},{"id":"D","text":"Cannot be determined"}],"correctAnswer":"B","answerExplanation":"Standard deviation measures spread around the mean.\\n\\nClass B's scores are much farther apart despite both classes having the same mean.","difficulty":"Introductory","prerequisiteConceptIds":["KC_01"],"sourceIds":[]},"stage-02-transfer":{"id":"stage-02-transfer","stageId":"stage-02","conceptIds":["KC_02"],"questionType":"multiple_choice","questionText":"Every student in a class receives exactly 85 points.\\n\\nWhat is the standard deviation?","choices":[{"id":"A","text":"0"},{"id":"B","text":"1"},{"id":"C","text":"85"},{"id":"D","text":"It depends on the number of students"}],"correctAnswer":"A","answerExplanation":"Every observation equals the mean.\\n\\nThere is no variability, so the standard deviation is zero.","difficulty":"Introductory","prerequisiteConceptIds":["KC_01"],"sourceIds":[]},"stage-03-core":{"id":"stage-03-core","stageId":"stage-03","conceptIds":["KC_03"],"questionType":"multiple_choice","questionText":"A conventional class has a mean achievement score of 70 and a standard deviation of 6.\\n\\nAnother group's mean is 82.\\n\\nHow far above the conventional mean is the second group's mean?","choices":[{"id":"A","text":"1 standard deviation"},{"id":"B","text":"2 standard deviations"},{"id":"C","text":"6 standard deviations"},{"id":"D","text":"12 standard deviations"}],"correctAnswer":"B","answerExplanation":"82 − 70 = 12; 12 ÷ 6 = 2.\\n\\nThe second mean is two conventional-group standard deviations above the conventional mean.","difficulty":"Intermediate","prerequisiteConceptIds":["KC_01","KC_02"],"sourceIds":[]},"stage-03-transfer":{"id":"stage-03-transfer","stageId":"stage-03","conceptIds":["KC_03"],"questionType":"multiple_choice","questionText":"Imagine a graph where the conventional mean is at z=0.\\n\\nThe average for another instructional condition appears at z=+2.\\n\\nWhat does that mean?","choices":[{"id":"A","text":"Its mean is twice the conventional score"},{"id":"B","text":"Its mean is two percentage points higher"},{"id":"C","text":"Its mean is two conventional-group standard deviations higher"},{"id":"D","text":"Every student improved by two standard deviations"}],"correctAnswer":"C","answerExplanation":"A standardized distance of +2 indicates that the second group's mean is two reference-group standard deviations above the reference mean.","difficulty":"Intermediate","prerequisiteConceptIds":["KC_01","KC_02"],"sourceIds":[]},"stage-04-core":{"id":"stage-04-core","stageId":"stage-04","conceptIds":["KC_04"],"questionType":"multiple_choice","questionText":"In an approximately normal reference distribution, a score two standard deviations above the mean is closest to which percentile?","choices":[{"id":"A","text":"68th"},{"id":"B","text":"84th"},{"id":"C","text":"95th"},{"id":"D","text":"98th"}],"correctAnswer":"D","answerExplanation":"For a normal distribution:\\n\\n z=2 \\n\\ncorresponds to approximately the 97.7th percentile.\\n\\nThis means approximately 97.7% of the reference distribution lies below that value.","difficulty":"Intermediate","prerequisiteConceptIds":["KC_02","KC_03"],"sourceIds":[]},"stage-04-transfer":{"id":"stage-04-transfer","stageId":"stage-04","conceptIds":["KC_04"],"questionType":"multiple_choice","questionText":"A student is at approximately the 97.7th percentile of a normal reference population.\\n\\nWhich standardized score is closest?","choices":[{"id":"A","text":"z=0"},{"id":"B","text":"z=1"},{"id":"C","text":"z=2"},{"id":"D","text":"z=3"}],"correctAnswer":"C","answerExplanation":"Approximately 97.7% of a normal distribution lies below a value two standard deviations above its mean.","difficulty":"Intermediate","prerequisiteConceptIds":["KC_02","KC_03"],"sourceIds":[]},"stage-05-core":{"id":"stage-05-core","stageId":"stage-05","conceptIds":["KC_05"],"questionType":"multiple_choice","questionText":"Which set best matches the three instructional conditions described in Bloom's 1984 paper?","choices":[{"id":"A","text":"Lecture, homework, final exam"},{"id":"B","text":"Conventional classroom, mastery-learning classroom, tutoring"},{"id":"C","text":"Public school, private school, homeschool"},{"id":"D","text":"Human tutoring, computer tutoring, no instruction"}],"correctAnswer":"B","answerExplanation":"Bloom reported three instructional conditions:\\n\\nConventional classroom instruction.\\nMastery-learning classroom instruction.\\nTutoring.\\n\\nThe purpose was to compare student achievement under different instructional approaches.","difficulty":"Intermediate","prerequisiteConceptIds":[],"sourceIds":["bloom-1984","bloom-copy"]},"stage-05-transfer":{"id":"stage-05-transfer","stageId":"stage-05","conceptIds":["KC_05"],"questionType":"multiple_choice","questionText":"A researcher creates three groups:\\n\\nNormal classroom instruction.\\nSimilar classroom instruction plus mastery procedures.\\nIndividualized tutoring.\\n\\nWhich historical comparison is this attempting to reproduce?","choices":[{"id":"A","text":"Bloom's comparison of conventional instruction, mastery learning, and tutoring"},{"id":"B","text":"A comparison of students from three different schools"},{"id":"C","text":"A comparison of three examinations"},{"id":"D","text":"A comparison of three statistical distributions"}],"correctAnswer":"A","answerExplanation":"Although the descriptions differ, the three instructional conditions have the same structure as Bloom's comparison.","difficulty":"Intermediate","prerequisiteConceptIds":[],"sourceIds":["bloom-1984","bloom-copy"]},"stage-06-core":{"id":"stage-06-core","stageId":"stage-06","conceptIds":["KC_06"],"questionType":"multiple_choice","questionText":"What was the central additional process used in Bloom's mastery-learning condition?","choices":[{"id":"A","text":"Students simply spent twice as long studying"},{"id":"B","text":"Formative testing → feedback → corrective instruction → a parallel formative test"},{"id":"C","text":"Students selected whichever topics interested them"},{"id":"D","text":"Students were placed in much smaller classes"}],"correctAnswer":"B","answerExplanation":"Mastery learning uses formative assessment to identify gaps, feedback and corrective instruction to address them, and reassessment to check whether the learner has achieved mastery.","difficulty":"Intermediate","prerequisiteConceptIds":["KC_05"],"sourceIds":["bloom-1984","bloom-copy"]},"stage-06-transfer":{"id":"stage-06-transfer","stageId":"stage-06","conceptIds":["KC_06"],"questionType":"multiple_choice","questionText":"A student takes a short quiz and discovers that she cannot use conditional probability.\\n\\nShe receives targeted practice, then takes a different quiz on conditional probability before advancing.\\n\\nWhich aspect makes this mastery learning rather than ordinary grading?","choices":[{"id":"A","text":"The student receives a numerical score."},{"id":"B","text":"Assessment identifies a gap, triggers corrective instruction, and is followed by reassessment before progression."},{"id":"C","text":"The student completes all questions without feedback."},{"id":"D","text":"The teacher gives every student the same additional lecture."}],"correctAnswer":"B","answerExplanation":"The assessment controls what happens next in the learning process rather than merely recording the student's performance.","difficulty":"Intermediate","prerequisiteConceptIds":["KC_05"],"sourceIds":["bloom-1984","bloom-copy"]},"stage-07-core":{"id":"stage-07-core","stageId":"stage-07","conceptIds":["KC_07"],"questionType":"multiple_choice","questionText":"Which statement most accurately describes the studies Bloom summarized?","choices":[{"id":"A","text":"Millions of students were followed across all school subjects for several years."},{"id":"B","text":"Students self-selected whether they wanted tutoring."},{"id":"C","text":"Four samples across grades 4, 5, and 8 studied Probability or Cartography; students were randomly assigned, and each sub-study lasted 11 instructional periods over three weeks."},{"id":"D","text":"The studies exclusively examined university mathematics students."}],"correctAnswer":"C","answerExplanation":"Four samples in grades 4, 5, and 8 studied Probability or Cartography. Students were randomly assigned; each sub-study lasted 11 instructional periods over three weeks. These were specific populations, subjects, and durations, not every educational setting.","difficulty":"Intermediate","prerequisiteConceptIds":["KC_05"],"sourceIds":["bloom-1984","bloom-copy"]},"stage-07-transfer":{"id":"stage-07-transfer","stageId":"stage-07","conceptIds":["KC_07"],"questionType":"multiple_choice","questionText":"Which conclusion goes furthest beyond what those experiments alone establish?","choices":[{"id":"A","text":"Large achievement differences appeared in those particular instructional comparisons."},{"id":"B","text":"Bloom thought tutoring provided an important benchmark."},{"id":"C","text":"Every subject, age group, tutor, and future tutoring system should produce a 2σ effect."},{"id":"D","text":"Mastery learning was also compared with conventional instruction."}],"correctAnswer":"C","answerExplanation":"Evidence from particular experiments cannot establish that an identical effect will occur under every possible instructional condition.","difficulty":"Intermediate","prerequisiteConceptIds":["KC_05"],"sourceIds":["bloom-1984","bloom-copy"]},"stage-08-core":{"id":"stage-08-core","stageId":"stage-08","conceptIds":["KC_08"],"questionType":"multiple_choice","questionText":"Which summary matches the result Bloom reported?","choices":[{"id":"A","text":"Mastery learning ≈ +2σ; tutoring ≈ +1σ"},{"id":"B","text":"Mastery learning ≈ +1σ; tutoring ≈ +2σ"},{"id":"C","text":"Both treatments ≈ +2σ"},{"id":"D","text":"Neither differed substantially from conventional instruction"}],"correctAnswer":"B","answerExplanation":"Using the conventional group’s standard deviation (σ) as the reference:\\n\\nMean(mastery) ≈ Mean(conventional) + 1σ\\nMean(tutoring) ≈ Mean(conventional) + 2σ\\n\\nThese are differences between group means, expressed in conventional-group standard deviation units.","difficulty":"Intermediate","prerequisiteConceptIds":["KC_03","KC_04","KC_05","KC_06","KC_07"],"sourceIds":["bloom-1984","bloom-copy"]},"stage-08-transfer":{"id":"stage-08-transfer","stageId":"stage-08","conceptIds":["KC_08"],"questionType":"multiple_choice","questionText":"Suppose the conventional achievement distribution is standardized to a mean of 0 and a standard deviation of 1.\\n\\nWhich approximate pair represents Bloom's reported group means?","choices":[{"id":"A","text":"Mastery = 0, Tutoring = 1"},{"id":"B","text":"Mastery = 1, Tutoring = 2"},{"id":"C","text":"Mastery = 2, Tutoring = 4"},{"id":"D","text":"Mastery = −1, Tutoring = −2"}],"correctAnswer":"B","answerExplanation":"Relative to the conventional mean:\\n\\nMastery learning: approximately +1σ.\\nTutoring: approximately +2σ.","difficulty":"Intermediate","prerequisiteConceptIds":["KC_03","KC_04","KC_05","KC_06","KC_07"],"sourceIds":["bloom-1984","bloom-copy"]},"stage-09-core":{"id":"stage-09-core","stageId":"stage-09","conceptIds":["KC_09"],"questionType":"multiple_choice","questionText":"What was Bloom's \\"2 Sigma Problem\\"?","choices":[{"id":"A","text":"Determine why standard deviation is represented by sigma."},{"id":"B","text":"Find a cheaper statistical test for educational experiments."},{"id":"C","text":"Find practical group-instruction methods capable of approaching the achievement attained under effective tutoring."},{"id":"D","text":"Prove that every student needs a private tutor."}],"correctAnswer":"C","answerExplanation":"Bloom identified the challenge of achieving tutoring-like educational outcomes through practical instructional methods that could be provided to large numbers of learners.","difficulty":"Intermediate","prerequisiteConceptIds":["KC_08"],"sourceIds":["bloom-1984","bloom-copy"]},"stage-09-transfer":{"id":"stage-09-transfer","stageId":"stage-09","conceptIds":["KC_09"],"questionType":"multiple_choice","questionText":"Which research project is most directly attempting to address Bloom's problem?","choices":[{"id":"A","text":"Finding a new symbol for standard deviation."},{"id":"B","text":"Building an affordable instructional system that adapts feedback and remediation to individual learners, then testing whether it approaches tutoring-level outcomes."},{"id":"C","text":"Hiring one private human tutor for every learner regardless of cost."},{"id":"D","text":"Replacing all assessments with lectures."}],"correctAnswer":"B","answerExplanation":"The proposed system attempts to provide the benefits of individualized instruction without requiring an individual human tutor for every student.\\n\\nIts effectiveness would still need to be established experimentally.","difficulty":"Intermediate","prerequisiteConceptIds":["KC_08"],"sourceIds":["bloom-1984","bloom-copy"]},"stage-10-core":{"id":"stage-10-core","stageId":"stage-10","conceptIds":["KC_10"],"questionType":"multiple_choice","questionText":"A company builds an adaptive AI tutor that gives every learner personalized questions and remediation.\\n\\nWhich statement is scientifically justified from Bloom's work alone?","choices":[{"id":"A","text":"Because it is personalized, it will automatically improve achievement by 2σ."},{"id":"B","text":"Bloom proves that every AI tutor performs as well as a strong human tutor."},{"id":"C","text":"The system addresses the kind of scalable individualized-instruction problem Bloom highlighted, but its actual learning effect must be measured experimentally."},{"id":"D","text":"If it uses mastery learning, a +1σ gain is guaranteed."}],"correctAnswer":"C","answerExplanation":"Bloom's findings provide a motivating benchmark and research problem.\\n\\nThey do not establish the performance of a future instructional system.\\n\\nAn adaptive system needs independent experimental evidence to establish its actual effectiveness.","difficulty":"Advanced","prerequisiteConceptIds":["KC_07","KC_08","KC_09"],"sourceIds":["bloom-1984","bloom-copy","vanlehn-2011","vanlehn-copy"]},"stage-10-transfer":{"id":"stage-10-transfer","stageId":"stage-10","conceptIds":["KC_10"],"questionType":"multiple_choice","questionText":"A new adaptive platform runs a randomized controlled trial and finds an achievement effect of +0.35 standard deviations compared with ordinary instruction.\\n\\nWhich interpretation is strongest?","choices":[{"id":"A","text":"It failed because Bloom proved successful tutoring must achieve +2 standard deviations."},{"id":"B","text":"It solved Bloom's problem because every adaptive system automatically counts as a solution."},{"id":"C","text":"It produced a measured positive effect; comparison with Bloom's 2σ benchmark requires attention to differences in intervention, population, outcome, and experimental design."},{"id":"D","text":"+0.35 standard deviations means students learned 35% more material."}],"correctAnswer":"C","answerExplanation":"Standardized achievement effects can be compared descriptively, but their interpretation depends on the instructional approach, learner population, comparison condition, assessment, and experimental design.","difficulty":"Advanced","prerequisiteConceptIds":["KC_07","KC_08","KC_09"],"sourceIds":["bloom-1984","bloom-copy","vanlehn-2011","vanlehn-copy"]}}`), M = { "stage-01-video": { id: "stage-01-video", title: "Mean, median, & mode example", creator: "Khan Academy", url: "https://www.youtube.com/watch?v=k3aKKasOmIw", startTime: 0, endTime: 75, segmentDuration: 75, conceptIds: ["KC_01"], description: "Calculating and interpreting the arithmetic mean.", sourceIds: ["khan-1"], verification: { checkedAt: "2026-09-22", method: "Source page, metadata and transcript access attempts", status: "timing-unverified", notes: "Khan Academy YouTube upload title and publisher confirmed from public player metadata. Caption requests returned empty responses. Proposed clip timing and instructional coverage remain unverified. Original Khan Academy page retained in Sources." } }, "stage-02-video": { id: "stage-02-video", title: "Measures of spread: range, variance & standard deviation", creator: "Khan Academy", url: "https://www.youtube.com/watch?v=E4HAYd0QnRc", startTime: 0, endTime: 90, segmentDuration: 90, conceptIds: ["KC_02"], description: "Standard deviation and variability.", sourceIds: ["khan-2"], verification: { checkedAt: "2026-09-22", method: "Source page, metadata and transcript access attempts", status: "timing-unverified", notes: "Khan Academy YouTube upload title and publisher confirmed from public player metadata. Caption requests returned empty responses. Proposed clip timing and instructional coverage remain unverified. Original Khan Academy page retained in Sources." } }, "stage-03-video": { id: "stage-03-video", title: "Z-score introduction", creator: "Khan Academy", url: "https://www.youtube.com/watch?v=5S-Zfa-vOXs", startTime: 0, endTime: 50, segmentDuration: 50, conceptIds: ["KC_03"], description: "Expressing the distance between a value and a reference mean using standard deviations.", sourceIds: ["khan-3"], verification: { checkedAt: "2026-09-22", method: "Source page, metadata and transcript access attempts", status: "timing-unverified", notes: "Khan Academy YouTube upload title and publisher confirmed from public player metadata. Caption requests returned empty responses. Proposed clip timing and instructional coverage remain unverified. Original Khan Academy page retained in Sources." } }, "stage-04-video": { id: "stage-04-video", title: "Normal distribution problems: Empirical rule", creator: "Khan Academy", url: "https://www.youtube.com/watch?v=OhRr26AfFBU", startTime: 207, endTime: 248, segmentDuration: 41, conceptIds: ["KC_04"], description: "The relationship between standard deviations and the proportion of observations in a normal distribution.", sourceIds: ["khan-4"], verification: { checkedAt: "2026-09-22", method: "Source page, metadata and transcript access attempts", status: "timing-unverified", notes: "Khan Academy YouTube upload title and publisher confirmed from public player metadata. Caption requests returned empty responses. Proposed clip timing and instructional coverage remain unverified. Original Khan Academy page retained in Sources." } }, "stage-05-video": { id: "stage-05-video", title: "What we're learning from online education", creator: "Daphne Koller / TED", url: "https://www.youtube.com/watch?v=U6FvJ6jMGHU", startTime: 969, endTime: 1e3, segmentDuration: 31, conceptIds: ["KC_05"], description: "The three instructional conditions in Bloom's comparison.", sourceIds: ["ted-koller"], verification: { checkedAt: "2026-09-22", method: "TED official transcript and YouTube player metadata", status: "transcript-verified", notes: "TED identifies U6FvJ6jMGHU as the official YouTube edition. This uses the supplied YouTube-edition timestamps. Bloom (1984) remains the factual authority." } }, "stage-06-video": { id: "stage-06-video", title: "What is mastery learning?", creator: "Khan Academy", url: "https://www.youtube.com/watch?v=zRuiDvz8p5o", startTime: 0, endTime: 60, segmentDuration: 60, conceptIds: ["KC_06"], description: "Learning through the identification and correction of knowledge gaps before progression.", sourceIds: ["khan-6"], verification: { checkedAt: "2026-09-22", method: "Source page, metadata and transcript access attempts", status: "timing-unverified", notes: "YouTube title, publisher and embed metadata resolved. Caption requests returned empty responses. Exact segment content and proposed timing remain unverified; the written concept review is available if playback fails." } }, "stage-07-video": { id: "stage-07-video", title: "Bloom's 2 Sigma Problem Debunked: One-to-One Tutoring Isn't Going to Save Education", creator: "Dr. Luke Rowe / Powerful Learning", url: "https://www.youtube.com/watch?v=IaTk7lHC470", startTime: 172, endTime: 230, segmentDuration: 58, conceptIds: ["KC_07"], description: "The evidence underlying Bloom's reported findings and why the research context matters.", sourceIds: ["rowe"], verification: { checkedAt: "2026-09-22", method: "Source page, metadata and transcript access attempts", status: "timing-unverified", notes: "YouTube title, publisher and embed metadata resolved. Caption requests returned empty responses. Exact segment content and proposed timing remain unverified; the written concept review is available if playback fails." } }, "stage-08-video": { id: "stage-08-video", title: "What we're learning from online education", creator: "Daphne Koller / TED", url: "https://www.youtube.com/watch?v=U6FvJ6jMGHU", startTime: 1e3, endTime: 1012, segmentDuration: 12, conceptIds: ["KC_08"], description: "The approximately one-sigma mastery-learning result and two-sigma tutoring result.", sourceIds: ["ted-koller"], verification: { checkedAt: "2026-09-22", method: "TED official transcript and YouTube player metadata", status: "transcript-verified", notes: "TED identifies U6FvJ6jMGHU as the official YouTube edition. This uses the supplied YouTube-edition timestamps. Bloom (1984) remains the factual authority." } }, "stage-09-video": { id: "stage-09-video", title: "What we're learning from online education", creator: "Daphne Koller / TED", url: "https://www.youtube.com/watch?v=U6FvJ6jMGHU", startTime: 1037, endTime: 1049, segmentDuration: 12, conceptIds: ["KC_09"], description: "The challenge of reproducing the educational benefits associated with individualized tutoring at scale.", sourceIds: ["ted-koller"], verification: { checkedAt: "2026-09-22", method: "TED official transcript and YouTube player metadata", status: "transcript-verified", notes: "TED identifies U6FvJ6jMGHU as the official YouTube edition. This uses the supplied YouTube-edition timestamps. Bloom (1984) remains the factual authority." } }, "stage-10-video": { id: "stage-10-video", title: "Bloom's 2 Sigma Problem Debunked: One-to-One Tutoring Isn't Going to Save Education", creator: "Dr. Luke Rowe / Powerful Learning", url: "https://www.youtube.com/watch?v=IaTk7lHC470", startTime: 745, endTime: 817, segmentDuration: 72, conceptIds: ["KC_10"], description: "Later tutoring research has produced meaningful but variable effects, which should not be automatically equated with Bloom's reported 2σ result.", sourceIds: ["rowe"], verification: { checkedAt: "2026-09-22", method: "Source page, metadata and transcript access attempts", status: "timing-unverified", notes: "YouTube title, publisher and embed metadata resolved. Caption requests returned empty responses. Exact segment content and proposed timing remain unverified; the written concept review is available if playback fails." } } }, O = { "stage-01-explanation": { id: "stage-01-explanation", title: "Arithmetic Mean — explained", conceptIds: ["KC_01"], content: `The mean is the arithmetic average of a set of numbers.

Add every value together and divide by the number of values.

If every observation changes by the same amount, the mean changes by that amount too.

Bloom's research compares the average achievement of different groups, so understanding the mean is necessary before interpreting his findings.`, sourceIds: [] }, "stage-02-explanation": { id: "stage-02-explanation", title: "Standard Deviation — explained", conceptIds: ["KC_02"], content: `The mean describes where the center of a dataset is.

Standard deviation describes how spread out the observations are around that center.

Two groups can have identical means but different standard deviations.

If every observation has the same value, the standard deviation is zero.`, sourceIds: [] }, "stage-03-explanation": { id: "stage-03-explanation", title: "Standardized Distance — explained", conceptIds: ["KC_03"], content: `Sigma, written σ, represents standard deviation.

A difference of 2σ means a separation equal to twice the reference group's standard deviation.

It does not mean the score doubled.

For example, if the conventional mean is 70 and its standard deviation is 6, then a mean two standard deviations higher is:

 70+2(6)=82`, sourceIds: [] }, "stage-04-explanation": { id: "stage-04-explanation", title: "Normal Distributions and Percentiles — explained", conceptIds: ["KC_04"], content: `In a normal distribution, approximately 95.4% of observations lie within two standard deviations of the mean.

That leaves approximately 2.3% of observations above +2σ.

A value at +2σ is therefore around the 97.7th percentile.

Bloom described the average tutored student as performing above approximately 98% of conventional students.

This does not mean 98% of tutored students were above the conventional mean.`, sourceIds: [] }, "stage-05-explanation": { id: "stage-05-explanation", title: "Bloom's Experimental Conditions — explained", conceptIds: ["KC_05"], content: `Bloom compared three approaches to instruction:

Conventional instruction involved ordinary group teaching.

Mastery learning added formative testing and corrective procedures to group instruction.

Tutoring provided highly individualized instruction, while also using formative assessment and feedback.

Understanding these conditions is necessary before comparing their reported outcomes.`, sourceIds: ["bloom-1984", "bloom-copy"] }, "stage-06-explanation": { id: "stage-06-explanation", title: "Mastery Learning — explained", conceptIds: ["KC_06"], content: `In ordinary grading, a test may simply measure how well a student performed before the class continues.

In mastery learning, assessments are used to identify missing knowledge.

Students receive targeted corrective instruction and are reassessed before progressing.

The central cycle is:

 Assessment → Feedback → Correction → Reassessment`, sourceIds: ["bloom-1984", "bloom-copy"] }, "stage-07-explanation": { id: "stage-07-explanation", title: "Experimental Evidence and Generalization — explained", conceptIds: ["KC_07"], content: `Bloom summarized four samples across grades 4, 5, and 8 studying Probability or Cartography, with random assignment and 11 instructional periods over three weeks per sub-study.

An experiment can establish findings for the specific population, intervention, and outcome measures that were studied.

It does not automatically establish that the same results will occur across all other settings.

Bloom's studies provide evidence about particular instructional comparisons.

Their reported effect sizes should not be interpreted as a universal guarantee for all tutoring systems.`, sourceIds: ["bloom-1984", "bloom-copy"] }, "stage-08-explanation": { id: "stage-08-explanation", title: "Bloom's Reported Results — explained", conceptIds: ["KC_08"], content: `Bloom reported two important comparisons.

The mastery-learning group had an average achievement level approximately one conventional-group standard deviation above the conventional mean.

The tutoring group had an average achievement level approximately two conventional-group standard deviations above the conventional mean.

Remember:

 Conventional = 0σ
Mastery = +1σ
Tutoring = +2σ 

The values describe standardized differences between group averages.`, sourceIds: ["bloom-1984", "bloom-copy"] }, "stage-09-explanation": { id: "stage-09-explanation", title: "The 2 Sigma Problem — explained", conceptIds: ["KC_09"], content: `Bloom's finding and Bloom's problem are different things.

Finding: The tutoring group performed approximately two conventional-group standard deviations above the conventional mean.

Problem: How can educators reproduce similarly strong learning outcomes using instructional methods that are affordable and practical for large numbers of students?

The problem concerns scalable instructional design.`, sourceIds: ["bloom-1984", "bloom-copy"] }, "stage-10-explanation": { id: "stage-10-explanation", title: "Application and Interpretation — explained", conceptIds: ["KC_10"], content: `Bloom's result describes the achievement differences observed in particular instructional experiments.

It does not guarantee a two-standard-deviation improvement for every future tutoring or adaptive-learning system.

An adaptive platform may address Bloom's scalability challenge by providing individualized instruction to many learners.

However, its actual learning effect must be measured independently.`, sourceIds: ["bloom-1984", "bloom-copy", "vanlehn-2011", "vanlehn-copy"] } }, V = { "stage-01": { stageId: "stage-01", title: "Arithmetic Mean", purpose: "Establish the arithmetic mean as the center of a dataset.", conceptIds: ["KC_01"], prerequisiteConceptIds: [], coreQuestionId: "stage-01-core", remediationVideoIds: ["stage-01-video"], transferQuestionId: "stage-01-transfer", fallbackExplanationId: "stage-01-explanation", nextStageId: "stage-02" }, "stage-02": { stageId: "stage-02", title: "Standard Deviation", purpose: "Establish the difference between a dataset's center and its spread.", conceptIds: ["KC_02"], prerequisiteConceptIds: ["KC_01"], coreQuestionId: "stage-02-core", remediationVideoIds: ["stage-02-video"], transferQuestionId: "stage-02-transfer", fallbackExplanationId: "stage-02-explanation", nextStageId: "stage-03" }, "stage-03": { stageId: "stage-03", title: "Standardized Distance", purpose: "Teach the learner to interpret differences in units of standard deviations.", conceptIds: ["KC_03"], prerequisiteConceptIds: ["KC_01", "KC_02"], coreQuestionId: "stage-03-core", remediationVideoIds: ["stage-03-video"], transferQuestionId: "stage-03-transfer", fallbackExplanationId: "stage-03-explanation", nextStageId: "stage-04" }, "stage-04": { stageId: "stage-04", title: "Normal Distributions and Percentiles", purpose: "Explain the percentile interpretation associated with a two-standard-deviation difference.", conceptIds: ["KC_04"], prerequisiteConceptIds: ["KC_02", "KC_03"], coreQuestionId: "stage-04-core", remediationVideoIds: ["stage-04-video"], transferQuestionId: "stage-04-transfer", fallbackExplanationId: "stage-04-explanation", nextStageId: "stage-05" }, "stage-05": { stageId: "stage-05", title: "Bloom's Experimental Conditions", purpose: "Introduce the instructional conditions compared in Bloom's research.", conceptIds: ["KC_05"], prerequisiteConceptIds: [], coreQuestionId: "stage-05-core", remediationVideoIds: ["stage-05-video"], transferQuestionId: "stage-05-transfer", fallbackExplanationId: "stage-05-explanation", nextStageId: "stage-06" }, "stage-06": { stageId: "stage-06", title: "Mastery Learning", purpose: "Explain the formative-assessment and corrective-instruction process associated with mastery learning.", conceptIds: ["KC_06"], prerequisiteConceptIds: ["KC_05"], coreQuestionId: "stage-06-core", remediationVideoIds: ["stage-06-video"], transferQuestionId: "stage-06-transfer", fallbackExplanationId: "stage-06-explanation", nextStageId: "stage-07" }, "stage-07": { stageId: "stage-07", title: "Experimental Evidence and Generalization", purpose: "Establish the scope and limitations of the experiments summarized by Bloom.", conceptIds: ["KC_07"], prerequisiteConceptIds: ["KC_05"], coreQuestionId: "stage-07-core", remediationVideoIds: ["stage-07-video"], transferQuestionId: "stage-07-transfer", fallbackExplanationId: "stage-07-explanation", nextStageId: "stage-08" }, "stage-08": { stageId: "stage-08", title: "Bloom's Reported Results", purpose: "Establish the central findings of Bloom's research.", conceptIds: ["KC_08"], prerequisiteConceptIds: ["KC_03", "KC_04", "KC_05", "KC_06", "KC_07"], coreQuestionId: "stage-08-core", remediationVideoIds: ["stage-08-video"], transferQuestionId: "stage-08-transfer", fallbackExplanationId: "stage-08-explanation", nextStageId: "stage-09" }, "stage-09": { stageId: "stage-09", title: "The 2 Sigma Problem", purpose: "Distinguish Bloom's reported finding from the actual problem he wanted researchers to solve.", conceptIds: ["KC_09"], prerequisiteConceptIds: ["KC_08"], coreQuestionId: "stage-09-core", remediationVideoIds: ["stage-09-video"], transferQuestionId: "stage-09-transfer", fallbackExplanationId: "stage-09-explanation", nextStageId: "stage-10" }, "stage-10": { stageId: "stage-10", title: "Application and Interpretation", purpose: "Evaluate whether the learner can apply Bloom's ideas without exaggerating the original findings.", conceptIds: ["KC_10"], prerequisiteConceptIds: ["KC_07", "KC_08", "KC_09"], coreQuestionId: "stage-10-core", remediationVideoIds: ["stage-10-video"], transferQuestionId: "stage-10-transfer", fallbackExplanationId: "stage-10-explanation", nextStageId: null } }, N = [{ id: "bloom-1984", title: "Bloom (1984) — The 2 Sigma Problem (primary source, pp. 4–5)", url: "https://web.mit.edu/5.95/readings/bloom-two-sigma.pdf" }, { id: "bloom-copy", title: "Bloom (1984) — accessible copy", url: "https://gwern.net/doc/psychology/1984-bloom.pdf" }, { id: "vanlehn-2011", title: "VanLehn (2011) — The Relative Effectiveness of Human Tutoring, Intelligent Tutoring Systems, and Other Tutoring Systems", url: "https://doi.org/10.1080/00461520.2011.611369" }, { id: "vanlehn-copy", title: "VanLehn (2011) — author-hosted paper", url: "https://www.public.asu.edu/~kvanlehn/Stringent/PDF/EffectivenessOfTutoring_Vanlehn.pdf" }, { id: "khan-1", title: "Mean, median, & mode example", url: "https://www.khanacademy.org/math/statistics-probability/summarizing-quantitative-data/mean-median-basics/v/mean-median-and-mode" }, { id: "khan-2", title: "Measures of spread: range, variance & standard deviation", url: "https://www.khanacademy.org/v/range-variance-and-standard-deviation-as-measures-of-dispersion" }, { id: "khan-3", title: "Z-score introduction", url: "https://www.khanacademy.org/v/z-score-introduction" }, { id: "khan-4", title: "Normal distribution problems: Empirical rule", url: "https://www.khanacademy.org/math/ap-statistics/density-curves-normal-distribution-ap/stats-normal-distributions/v/ck12-org-normal-distribution-problems-empirical-rule" }, { id: "ted-koller", title: "What we're learning from online education", url: "https://www.ted.com/talks/daphne_koller_what_we_re_learning_from_online_education" }, { id: "khan-6", title: "What is mastery learning?", url: "https://www.youtube.com/watch?v=zRuiDvz8p5o" }, { id: "rowe", title: "Bloom's 2 Sigma Problem Debunked: One-to-One Tutoring Isn't Going to Save Education", url: "https://www.youtube.com/watch?v=IaTk7lHC470" }], I = {
  id: S,
  version: E,
  isFixture: B,
  title: D,
  firstStageId: j,
  concepts: z,
  questions: R,
  videos: M,
  explanations: O,
  stages: V,
  sources: N
}, b = {
  home: "Back to skatebored",
  restart: "Start again",
  continue: "Continue",
  openVideo: "Open video",
  videoUnavailable: "The video could not load here. Open the segment, then continue when you’re ready.",
  complete: "Your knowledge, expanded.",
  completion: "You’ve reached the end of this lesson. Your knowledge space shows the concepts you demonstrated.",
  knowledge: "Your knowledge space",
  unavailable: "Your knowledge space is unavailable on this device. You can still complete the lesson.",
  empty: "Answer a question to begin shaping your knowledge space.",
  correct: "Correct. Your knowledge space has grown.",
  incorrect: "Let’s look at this idea another way."
};
function _(e) {
  function t(i, r) {
    if (!i) throw new Error(r);
  }
  function s(i) {
    return typeof i == "string" && i.trim().length > 0;
  }
  t(e && typeof e == "object", "Choose a curriculum JSON object."), t(s(e.id) && Number.isInteger(e.version) && e.version > 0 && s(e.title) && typeof e.isFixture == "boolean", "Curriculum needs id, positive integer version, title and isFixture.");
  for (const i of ["concepts", "questions", "videos", "explanations", "stages"])
    t(e[i] && typeof e[i] == "object" && !Array.isArray(e[i]), `Missing ${i} dictionary.`);
  t(Array.isArray(e.sources), "sources must be an array.");
  const o = /* @__PURE__ */ new Set();
  for (const i of e.sources)
    t(s(i.id) && !o.has(i.id) && s(i.title) && T(i.url), "Sources need unique ids, titles and HTTP(S) URLs."), o.add(i.id);
  const a = Object.entries(e.concepts).sort((i, r) => i[1].index - r[1].index);
  t(a.length > 0, "At least one concept is required.");
  function m(i, r, n = !1) {
    t(Array.isArray(i) && (!n || i.length > 0) && new Set(i).size === i.length && i.every((p) => Object.hasOwn(e.concepts, p)), `${r}: invalid concept references.`);
  }
  for (const [i, [r, n]] of a.entries())
    t(n.index === i && s(n.name) && s(n.description), `${r}: indices must be unique and contiguous from zero; name and description are required.`), m(n.prerequisites, r), t(!n.prerequisites.includes(r), `${r}: cannot require itself.`);
  const h = /* @__PURE__ */ new Set(), v = /* @__PURE__ */ new Set();
  function c(i) {
    t(!v.has(i), "Concept prerequisites contain a cycle."), !h.has(i) && (v.add(i), e.concepts[i].prerequisites.forEach(c), v.delete(i), h.add(i));
  }
  a.forEach(([i]) => c(i));
  const f = /* @__PURE__ */ new Set();
  for (const i of ["questions", "videos", "explanations"])
    for (const [r, n] of Object.entries(e[i]))
      t(!f.has(r), `${r}: resource IDs must be unique across resource types.`), f.add(r), t(n.id === r, `${r}: resource ID must match its dictionary key.`), m(n.conceptIds, r, !0), t(Array.isArray(n.sourceIds ?? []) && (n.sourceIds ?? []).every((p) => o.has(p)), `${r}: unknown source reference.`), i === "questions" ? (t(Object.hasOwn(e.stages, n.stageId) && s(n.questionText) && s(n.answerExplanation) && s(n.difficulty), `${r}: missing question fields.`), n.explanationId !== void 0 && t(Object.hasOwn(e.explanations, n.explanationId), `${r}: unknown feedback explanation.`), m(n.prerequisiteConceptIds, r), t(["multiple_choice", "numerical", "short_answer"].includes(n.questionType), `${r}: unsupported question type.`), n.questionType === "multiple_choice" ? t(Array.isArray(n.choices) && n.choices.length >= 2 && n.choices.every((p) => s(p.id) && s(p.text)) && new Set(n.choices.map((p) => p.id)).size === n.choices.length && n.choices.some((p) => p.id === n.correctAnswer), `${r}: invalid choices or correct answer.`) : n.questionType === "numerical" ? t(Number.isFinite(n.correctAnswer?.value) && Number.isFinite(n.correctAnswer?.tolerance) && n.correctAnswer.tolerance >= 0, `${r}: numerical answers need value and nonnegative tolerance.`) : t(Array.isArray(n.correctAnswer?.acceptedResponses) && n.correctAnswer.acceptedResponses.length > 0 && n.correctAnswer.acceptedResponses.every(s), `${r}: short answers need acceptedResponses.`)) : i === "videos" ? (t(s(n.title) && s(n.creator) && s(n.description), `${r}: missing video metadata.`), t(e.isFixture && n.url === null || T(n.url), `${r}: video needs an HTTP(S) URL.`), t(Number.isFinite(n.startTime) && n.startTime >= 0 && Number.isFinite(n.endTime) && n.endTime > n.startTime && Math.abs(n.segmentDuration - (n.endTime - n.startTime)) < 0.01, `${r}: invalid video segment timing.`)) : t(s(n.title) && s(n.content), `${r}: explanation needs title and content.`);
  const u = [], y = /* @__PURE__ */ new Set();
  let l = e.firstStageId;
  for (; l !== null; ) {
    t(typeof l == "string" && Object.hasOwn(e.stages, l) && !u.includes(l), "Stage sequence contains a missing reference or cycle.");
    const i = e.stages[l];
    t(i.stageId === l && s(i.title) && s(i.purpose), `${l}: missing stage fields.`), m(i.conceptIds, l, !0), m(i.prerequisiteConceptIds, l);
    const r = /* @__PURE__ */ new Set([...i.prerequisiteConceptIds, ...i.conceptIds.flatMap((n) => e.concepts[n].prerequisites)]);
    for (const n of r) t(y.has(n), `${l}: prerequisite ${n} must be assessed earlier.`);
    for (const n of ["coreQuestionId", "transferQuestionId"]) {
      const p = e.questions[i[n]];
      t(p && p.stageId === l && p.conceptIds.every((w) => i.conceptIds.includes(w)), `${l}: invalid ${n} mapping.`);
      for (const w of p.prerequisiteConceptIds) t(y.has(w), `${p.id}: prerequisites must be assessed earlier.`);
    }
    t(i.conceptIds.every((n) => e.questions[i.coreQuestionId].conceptIds.includes(n) && e.questions[i.transferQuestionId].conceptIds.includes(n)), `${l}: both questions must assess all stage concepts.`), t(Array.isArray(i.remediationVideoIds) && i.remediationVideoIds.length > 0 && new Set(i.remediationVideoIds).size === i.remediationVideoIds.length && i.remediationVideoIds.every((n) => e.videos[n]), `${l}: missing remediation videos.`), t(i.conceptIds.every((n) => i.remediationVideoIds.some((p) => e.videos[p].conceptIds.includes(n))), `${l}: remediation must cover stage concepts.`), t(e.explanations[i.fallbackExplanationId] && i.conceptIds.every((n) => e.explanations[i.fallbackExplanationId].conceptIds.includes(n)), `${l}: missing matching fallback explanation.`), i.conceptIds.forEach((n) => y.add(n)), u.push(l), l = i.nextStageId;
  }
  return t(u.length > 0 && u.length === Object.keys(e.stages).length && y.size === a.length, "Every stage must be reachable and every concept assessed."), u;
}
function T(e) {
  try {
    return typeof e == "string" && ["https:", "http:"].includes(new URL(e).protocol);
  } catch {
    return !1;
  }
}
function x(e) {
  return {
    stageId: e.firstStageId,
    activity: "core",
    completedStageIds: [],
    assessmentStatus: Object.fromEntries(Object.keys(e.concepts).map((t) => [t, "not_assessed"])),
    masteryVector: Array(Object.keys(e.concepts).length).fill(0),
    masteryOrigin: {},
    history: [],
    actions: [],
    feedback: null,
    videoIndex: 0
  };
}
function P(e, t) {
  if (typeof t != "string" || !t.trim()) return !1;
  if (e.questionType === "multiple_choice") return t === e.correctAnswer;
  if (e.questionType === "numerical") {
    if (!/^[+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?$/i.test(t.trim())) return !1;
    const o = Number(t);
    return Number.isFinite(o) && Math.abs(o - e.correctAnswer.value) <= e.correctAnswer.tolerance + Number.EPSILON * Math.max(1, Math.abs(o));
  }
  const s = (o) => o.normalize("NFKC").trim().replace(/\s+/g, " ").toLocaleLowerCase("en-US");
  return e.correctAnswer.acceptedResponses.some((o) => s(o) === s(t));
}
function q(e, t, s) {
  if (t.activity === "complete") return t;
  const o = e.stages[t.stageId], a = structuredClone(t), m = [...t.masteryVector];
  function h(c, f = {}) {
    a.history.push({
      type: c,
      timestamp: s.timestamp,
      stageId: o.stageId,
      conceptIds: o.conceptIds,
      masteryVectorBefore: [...m],
      masteryVectorAfter: [...a.masteryVector],
      ...f
    });
  }
  function v() {
    a.completedStageIds.push(o.stageId), a.stageId = o.nextStageId, a.activity = a.stageId ? "core" : "complete", a.videoIndex = 0;
  }
  if (s.type === "answer" && ["core", "transfer"].includes(t.activity)) {
    const c = e.questions[t.activity === "core" ? o.coreQuestionId : o.transferQuestionId];
    if (s.questionId && s.questionId !== c.id || typeof s.answer != "string" || !s.answer.trim() || c.questionType === "multiple_choice" && !c.choices.some((u) => u.id === s.answer)) return t;
    const f = P(c, s.answer);
    for (const u of c.conceptIds)
      f ? (a.assessmentStatus[u] = "mastered", a.masteryVector[e.concepts[u].index] = 1, a.masteryOrigin[u] ??= t.activity) : a.masteryVector[e.concepts[u].index] || (a.assessmentStatus[u] = "not_mastered");
    h("answer", {
      questionId: c.id,
      conceptIds: c.conceptIds,
      questionType: c.questionType,
      submittedAnswer: s.answer,
      isCorrect: f,
      attemptType: t.activity
    }), a.feedback = { questionId: c.id, isCorrect: f, attemptType: t.activity }, f ? v() : t.activity === "core" ? (a.activity = "remediation", h("remediation_displayed", { videoId: o.remediationVideoIds[0] })) : (a.activity = "fallback", h("fallback_displayed", { explanationId: o.fallbackExplanationId }));
  } else if (s.type === "remediation_completed" && t.activity === "remediation")
    h("remediation_completed", { videoId: o.remediationVideoIds[t.videoIndex], completion: "learner_reported" }), a.feedback = null, t.videoIndex + 1 < o.remediationVideoIds.length ? (a.videoIndex++, h("remediation_displayed", { videoId: o.remediationVideoIds[a.videoIndex] })) : a.activity = "transfer";
  else if (s.type === "fallback_completed" && t.activity === "fallback")
    h("fallback_completed", { explanationId: o.fallbackExplanationId }), a.feedback = null, v();
  else return t;
  return a.actions.push(s), a;
}
function F(e, t) {
  _(e);
  const s = JSON.parse(t);
  if (s.curriculum !== JSON.stringify(e) || !Array.isArray(s.actions)) throw new Error("Saved session belongs to a different curriculum.");
  let o = x(e);
  for (const a of s.actions) {
    if (!a || !Number.isFinite(Date.parse(a.timestamp))) throw new Error("Invalid session timestamp.");
    const m = q(e, o, a);
    if (m === o) throw new Error("Invalid saved learning sequence.");
    o = m;
  }
  return o;
}
function U(e, t) {
  return JSON.stringify({ curriculum: JSON.stringify(e), actions: t.actions });
}
const K = "skatebored-adaptive-demo-v5";
let C;
function $() {
  return window.YT?.Player ? Promise.resolve(window.YT) : (C || (C = new Promise((e, t) => {
    const s = window.onYouTubeIframeAPIReady;
    if (window.onYouTubeIframeAPIReady = () => {
      s?.(), e(window.YT);
    }, document.querySelector('script[src="https://www.youtube.com/iframe_api"]')) return;
    const a = document.createElement("script");
    a.src = "https://www.youtube.com/iframe_api", a.onerror = () => t(new Error("YouTube player unavailable")), document.head.appendChild(a);
  })), C);
}
function Q(e) {
  try {
    const t = new URL(e);
    return t.hostname === "youtu.be" ? t.pathname.slice(1) : t.searchParams.get("v") || t.pathname.match(/^\/(?:embed|shorts)\/([^/]+)/)?.[1] || null;
  } catch {
    return null;
  }
}
function Y() {
  _(I);
  try {
    const e = localStorage.getItem(K);
    return e ? F(I, e) : x(I);
  } catch {
    return x(I);
  }
}
function L({ question: e, onAnswer: t, locked: s }) {
  return /* @__PURE__ */ d.jsxs("section", { className: "question", "aria-labelledby": "question-text", children: [
    /* @__PURE__ */ d.jsx("h1", { id: "question-text", tabIndex: -1, children: e.questionText }),
    /* @__PURE__ */ d.jsx("div", { className: "answers", children: e.choices.map((o) => /* @__PURE__ */ d.jsx("button", { type: "button", disabled: s, onClick: () => t(o.id), children: o.text }, o.id)) })
  ] });
}
function W({ video: e, onComplete: t }) {
  const s = g.useRef(null), o = g.useRef(null), a = g.useRef(!1), m = g.useRef(t), [h, v] = g.useState(!1), c = Q(e.url);
  m.current = t, g.useEffect(() => {
    if (!c) {
      v(!0);
      return;
    }
    let u = !1, y, l = !1;
    a.current = !1;
    const i = window.setTimeout(() => {
      !l && !u && v(!0);
    }, 12e3), r = () => {
      a.current || u || (a.current = !0, m.current());
    };
    return $().then((n) => {
      u || !s.current || (o.current = new n.Player(s.current, {
        videoId: c,
        width: "100%",
        height: "100%",
        playerVars: {
          autoplay: 1,
          controls: 1,
          playsinline: 1,
          rel: 0,
          start: Math.floor(e.startTime),
          end: Math.ceil(e.endTime),
          origin: window.location.origin
        },
        events: {
          onReady: (p) => {
            u || (l = !0, v(!1), p.target.getIframe?.().setAttribute("title", e.title), window.clearTimeout(i), p.target.loadVideoById({
              videoId: c,
              startSeconds: e.startTime,
              endSeconds: e.endTime
            }), y = window.setInterval(() => {
              p.target.getCurrentTime?.() >= e.endTime - 0.2 && r();
            }, 250));
          },
          onStateChange: (p) => {
            p.data === n.PlayerState.ENDED && r();
          },
          onError: () => v(!0)
        }
      }));
    }).catch(() => {
      u || v(!0);
    }), () => {
      u = !0, window.clearTimeout(i), window.clearInterval(y), o.current?.destroy?.();
    };
  }, [e.endTime, e.startTime, c]);
  const f = new URL(e.url);
  return f.searchParams.set("t", `${Math.floor(e.startTime)}s`), /* @__PURE__ */ d.jsxs("div", { className: "video-container", tabIndex: -1, children: [
    /* @__PURE__ */ d.jsx("div", { className: "video-frame", hidden: h, children: /* @__PURE__ */ d.jsx("div", { ref: s }) }),
    h && /* @__PURE__ */ d.jsxs("div", { className: "video-fallback", children: [
      /* @__PURE__ */ d.jsx("p", { children: b.videoUnavailable }),
      /* @__PURE__ */ d.jsx("a", { href: f.href, target: "_blank", rel: "noreferrer", children: b.openVideo }),
      /* @__PURE__ */ d.jsx("button", { type: "button", onClick: t, children: b.continue })
    ] })
  ] });
}
function H({ explanation: e, onContinue: t }) {
  return /* @__PURE__ */ d.jsxs("section", { className: "fallback", tabIndex: -1, children: [
    /* @__PURE__ */ d.jsx("p", { children: e.content }),
    /* @__PURE__ */ d.jsx("button", { type: "button", onClick: t, children: b.continue })
  ] });
}
class G extends g.Component {
  state = { failed: !1 };
  static getDerivedStateFromError() {
    return { failed: !0 };
  }
  render() {
    return this.state.failed ? /* @__PURE__ */ d.jsx("p", { className: "scene-message", children: b.unavailable }) : this.props.children;
  }
}
function J() {
  const [e, t] = g.useState(Y), [s, o] = g.useState(!1), a = g.useRef(!1), m = g.useRef(null), h = g.useRef(null), v = g.useMemo(
    () => [...e.masteryVector, ...Array(24 - e.masteryVector.length).fill(0)],
    [e.masteryVector]
  ), c = e.stageId ? I.stages[e.stageId] : null, f = c && I.questions[e.activity === "transfer" ? c.transferQuestionId : c.coreQuestionId];
  g.useEffect(() => {
    try {
      localStorage.setItem(K, U(I, e));
    } catch {
    }
  }, [e]), g.useEffect(() => {
    h.current?.scrollTo(0, 0), matchMedia("(max-width: 760px)").matches && window.scrollTo(0, 0), h.current?.querySelector("h1, .fallback, .video-container")?.focus({ preventScroll: !0 });
  }, [e.activity, e.stageId, e.videoIndex]), g.useEffect(() => () => clearTimeout(m.current), []);
  function u(l, i) {
    a.current || (a.current = !0, o(!0), m.current = setTimeout(() => {
      a.current = !1, o(!1);
    }, 450), t((r) => q(I, r, {
      type: l,
      ...i !== void 0 ? { answer: i, questionId: f.id } : {},
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    })));
  }
  let y;
  return e.activity === "remediation" ? y = /* @__PURE__ */ d.jsx(W, { video: I.videos[c.remediationVideoIds[e.videoIndex]], onComplete: () => u("remediation_completed") }, `${e.stageId}-${e.videoIndex}`) : e.activity === "fallback" ? y = /* @__PURE__ */ d.jsx(H, { explanation: I.explanations[c.fallbackExplanationId], onContinue: () => u("fallback_completed") }) : e.activity === "complete" ? y = /* @__PURE__ */ d.jsxs("section", { className: "completion", children: [
    /* @__PURE__ */ d.jsx("h1", { tabIndex: -1, children: b.complete }),
    /* @__PURE__ */ d.jsx("p", { children: b.completion }),
    /* @__PURE__ */ d.jsx("button", { type: "button", onClick: () => {
      clearTimeout(m.current), a.current = !1, o(!1), t(x(I));
    }, children: b.restart })
  ] }) : y = /* @__PURE__ */ d.jsx(L, { question: f, locked: s, onAnswer: (l) => u("answer", l) }), /* @__PURE__ */ d.jsxs(d.Fragment, { children: [
    /* @__PURE__ */ d.jsx("a", { className: "learn-home", href: "../", children: b.home }),
    /* @__PURE__ */ d.jsxs("main", { className: "learning-demo", children: [
      /* @__PURE__ */ d.jsx("div", { className: "activity-panel", ref: h, children: y }),
      /* @__PURE__ */ d.jsxs("div", { className: "knowledge-window", role: "region", "aria-label": b.knowledge, children: [
        /* @__PURE__ */ d.jsx(G, { children: /* @__PURE__ */ d.jsx(
          A,
          {
            mastery: v,
            radius: 8,
            isolation: 45,
            surface: { color: "#FF1414", roughness: 0.42, metalness: 0.25 },
            autoRotate: !1,
            background: "#000000"
          }
        ) }),
        !e.masteryVector.some(Boolean) && /* @__PURE__ */ d.jsx("p", { className: "scene-message", children: b.empty })
      ] }),
      /* @__PURE__ */ d.jsx("p", { className: "sr-only", role: "status", children: e.feedback ? e.feedback.isCorrect ? b.correct : b.incorrect : "" })
    ] })
  ] });
}
k.createRoot(document.querySelector("#learning-root")).render(/* @__PURE__ */ d.jsx(J, {}));
