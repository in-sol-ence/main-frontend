# Bloom curriculum resource audit

Checked 2026-09-22. Verification is partial: do not interpret metadata availability
as proof of successful audiovisual playback or exact instructional coverage.

## Factual sources

- [Bloom (1984), primary paper](https://web.mit.edu/5.95/readings/bloom-two-sigma.pdf).
  MIT copy resolved; the [accessible copy](https://gwern.net/doc/psychology/1984-bloom.pdf)
  supplied searchable text. Printed pp. 4–5 support the three conditions, formative
  testing/correction, random assignment, four samples, grades/subjects/duration,
  conventional-group SD denominator, approximate mean differences and scalability
  problem. The 98% statement concerns the average tutored student relative to the
  conventional distribution, not a percentage of tutored students above its mean.
- [VanLehn (2011)](https://doi.org/10.1080/00461520.2011.611369).
  DOI fetching was blocked. Publication identity and scope were corroborated by the
  [author’s university record](https://asu.elsevierpure.com/en/publications/the-relative-effectiveness-of-human-tutoring-intelligent-tutoring/)
  and the indexed [author-hosted paper](https://www.public.asu.edu/~kvanlehn/Stringent/PDF/EffectivenessOfTutoring_Vanlehn.pdf).
  No new numerical claim from that paper is added to the curriculum.

## Video checks

Original supplied pages are retained in the curriculum Sources entries. Khan pages
were empty in direct web extraction or blocked in direct HTTP access. Indexed Khan
transcripts confirm the mean and z-score topics. Public YouTube watch metadata
resolved titles and publishers for the listed uploads. YouTube caption endpoints
returned empty bodies; the browser transcript exporter also reported no transcript for Rowe, so no exact timed verification is claimed for these clips.
The application now uses the YouTube IFrame Player API for every remediation. It
loads each video with explicit start/end seconds, checks playback time, and advances
at the configured endpoint. External fallback links seek to the start but cannot
enforce the endpoint.

| Stage | Delivery source | Clip | Evidence and remaining check |
| --- | --- | --- | --- |
| KC_01 | [Khan: mean/median/mode](https://www.youtube.com/watch?v=k3aKKasOmIw) | 0:00–1:15 | Khan upload metadata and indexed lesson transcript; proposed timing unverified. |
| KC_02 | [Khan: dispersion](https://www.youtube.com/watch?v=E4HAYd0QnRc) | 0:00–1:30 | Khan upload metadata; must check whether this opening explains SD itself sufficiently, not just spread/range. |
| KC_03 | [Khan: z-score](https://www.youtube.com/watch?v=5S-Zfa-vOXs) | 0:00–0:50 | Khan upload metadata and indexed introductory transcript match concept; exact timing unverified. |
| KC_04 | [Khan: empirical rule](https://www.youtube.com/watch?v=OhRr26AfFBU) | 3:27–4:08 | Khan upload metadata; exact interval unverified. Written review clarifies 95.4% within ±2σ and 97.7th percentile at +2σ. |
| KC_05 | [Koller / TED](https://www.youtube.com/watch?v=U6FvJ6jMGHU) | 16:09–16:40 | TED metadata identifies this as its official YouTube edition; supplied YouTube timing retained. |
| KC_06 | [Khan: mastery learning](https://www.youtube.com/watch?v=zRuiDvz8p5o) | 0:00–1:00 | oEmbed confirms title, Khan Academy publisher and iframe; exact timing unverified. |
| KC_07 | [Rowe / Powerful Learning](https://www.youtube.com/watch?v=IaTk7lHC470) | 2:52–3:50 | oEmbed confirms title/publisher; watch metadata allows embedding. Study-design coverage unverified. Primary-source written review explicitly provides design details. |
| KC_08 | Koller / TED, same YouTube source as KC_05 | 16:40–16:52 | Supplied YouTube timing retained for the +1σ and +2σ comparison. |
| KC_09 | Koller / TED, same YouTube source as KC_05 | 17:17–17:29 | Supplied YouTube timing retained for the scalability challenge. |
| KC_10 | Rowe / Powerful Learning, same source as KC_07 | 12:25–13:37 | Source identity/embed metadata checked; precise treatment of later research in this interval remains unverified. |

TED's page metadata identifies `U6FvJ6jMGHU` as the official YouTube edition. That
edition has a different timebase from TED's native MP4, so the curriculum uses the
original supplied YouTube timestamps. The official transcript supports the topics,
but full audiovisual review of those exact YouTube intervals remains outstanding.

The transcript's passage around 16:50 says 98% of tutored learners exceed a
conventional threshold. That is not the paper's stated percentile comparison.
The written content preserves the paper's actual distinction. Videos supplement,
rather than supersede, the primary source.

## Outstanding media validation

Watch the seven unverified intervals and confirm that each teaches its concept;
replace or retime any that do not, particularly KC_02 and KC_07. Confirm the three
TED YouTube intervals against the visible audiovisual content.
No replacement clip is labeled verified without this evidence. The demo remains
navigable when third-party playback is blocked through a minimal external link and
Continue control, without granting mastery.
