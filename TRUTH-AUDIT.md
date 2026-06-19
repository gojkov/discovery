# Discovery Engine Truth Audit

Audited against `main` at `2cfa192`, then updated with the structured-reason and saved-neutrality corrections in this workspace.

## Where the engine is genuinely strong

1. **Manual verdicts are the clearest source of truth.** `lib/scoring/knowledge.ts` overlays manually rated `Track` records on behavioral labels for the same normalized title and artist. The new `RatingEvent` records also preserve future changes instead of silently replacing the only judgment.
2. **Discovery excludes previously streamed tracks.** `lib/discover.ts` removes the manual library, candidate queue, and all `StreamStat` identities before inserting recommendations. That is a meaningful novelty guarantee.
3. **Same-name impostors are blocked in automated discovery.** Spotify artist IDs are checked when a candidate name collides with a loved artist. This directly fixes the false-Cube failure.
4. **The Spotify export pipeline is privacy-conscious and operationally practical.** It aggregates file by file and stores track-level statistics rather than raw playback records.
5. **Negative evidence is first-class.** Artist rejects and selected negative reasons reduce candidate scores instead of letting similarity dominate.
6. **The model is inspectable.** Candidate evidence and risk explanations are visible, tests cover core behavior, and scoring remains deterministic.

## Misleading assumptions and language

1. **Saved did not mean loved.** Previously, a save forced a derived 8 and added eight craving points. That was an organizational action masquerading as preference. It is now metadata only in `lib/scoring/behavior.ts`.
2. **Free-text “learning” was partly echo.** Notes, recommendation prose, titles, and arbitrary tags were phrase-matched against scoring rules. A user or provider could manufacture evidence simply by using expected words. Scoring now accepts only selected `TasteReason` records.
3. **“Behavioral 10” is an inference, not a verdict.** Completion and distinct-day thresholds identify high-interest candidates, but cannot prove love. Dashboard and review language now says “candidate” or “suggests.”
4. **Confidence is evidence volume, not calibrated certainty.** `lib/scoring/index.ts` still calls a score high-confidence when enough artist/reason evidence accumulates. It does not measure prediction accuracy or uncertainty.
5. **Craving is a heuristic index, not probability.** Its 0–100 range is useful for ranking but has no demonstrated mapping to the chance of a 10.
6. **Behavioral data is not purely intentional.** Track completion can include passive listening, autoplay, background play, sleep, shared-device activity, or failure to reach the skip control.

## Outright holes

1. **No outcome calibration.** There is no report comparing score bands with later 10/8/5/1 judgments, no false-positive rate, and no minimum sample threshold.
2. **No scorer version or score-run history.** Candidate scores are overwritten. An old recommendation cannot be reproduced after reason weights, artist evidence, or scoring code changes.
3. **Collaboration evidence can be overcounted.** `lib/scoring/learn.ts` indexes both the full credit and each artist part, then aggregates all matching parts. Exact collaborations can contribute through multiple keys. Artist identity should be modeled explicitly and exact-credit evidence separated from collaborator evidence.
4. **Identity protection is discovery-only.** Manually added candidates and historical normalization still rely on names, so same-name artists can contaminate scoring outside `lib/discover.ts`.
5. **Behavior lacks recency and duration context.** `StreamStat` has first/last dates and total milliseconds, but the craving formula ignores recency, track duration, session context, and whether interest continued after saving.
6. **Automatic behavioral labels enter training before confirmation.** `loadKnowledge()` includes all non-null derived ratings, including unreviewed ones. The review queue is therefore not a gate on model learning.
7. **No exposure-aware negative inference.** A low play count may mean low exposure rather than dislike; a high play count may be playlist placement rather than demand. The current fixed thresholds do not model either mechanism.
8. **No rating-history interface or undo.** Events are now recorded, but the UI does not yet expose timelines, reversals, or reason changes.
9. **Reason weight edits are not historically reproducible.** Event-to-reason identity is preserved, including retired and merged reasons, but the weight at the time of a score is not snapshotted.
10. **Duplicate identity remains title/name based in several flows.** Remasters, punctuation changes, featured-credit changes, and provider aliases can still split or merge the wrong records.
11. **The current Next.js dependency chain carries a moderate PostCSS advisory.** The audit tool proposes an invalid framework downgrade rather than a safe patched Next 15 release, so this remains documented and should be revisited on the next supported Next upgrade.

## Corrections implemented

- Added normalized `TasteReason`, `TrackReason`, `CandidateReason`, `RatingEvent`, and `RatingEventReason` models.
- Added curated, editable reason chips with create, rename, reorder, retire, restore, and merge workflows at `/reasons`.
- Preserved original reason identities on historical rating events when reasons are merged.
- Removed free-text notes, provider suggestion text, titles, and legacy tag strings from song-level scoring.
- Kept notes editable as qualitative context.
- Removed all positive scoring and derived-rating effects from Spotify saved status.
- Added a migration that seeds reasons, converts recognized legacy tags, and recomputes every behavioral rating and craving score.
- Added tests proving saved neutrality and structured-reason-only scoring.

## Recommended next work, in order

1. Gate behavioral labels from the training corpus until manually confirmed, while retaining continuous behavioral craving for review prioritization.
2. Add immutable `ScoreRun` snapshots with scorer version, selected reason IDs and weights, artist evidence, and input corpus version.
3. Build calibration by score band and suppress certainty language until enough reviewed outcomes exist.
4. Replace name-fragment artist learning with canonical artist entities, exact-credit evidence, and capped collaborator evidence.
5. Add rating-history and undo UI over the new event records.
6. Improve behavior inference with recency, post-save listening, duration-normalized completion, and explicit exposure uncertainty.

## Verification

- TypeScript: passed.
- Unit tests: 24 passed.
- Production build: passed.
- Dependency audit: the critical/high Vitest and Vite advisories were removed by upgrading to Vitest 4.1.9; two moderate Next/PostCSS findings remain.
- Local migration: 28 reasons seeded, 28 legacy track-reason links created, and 43 initial rating events backfilled.
- This checkout’s SQLite database contained zero `StreamStat` rows, so before/after behavioral-label counts were both zero. Running `npm run migrate:taste-model` on an imported database reports the exact changed-rating and changed-craving counts.
