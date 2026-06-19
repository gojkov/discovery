# Steve Discovery Engine

Music discovery that actually understands why you like what you like. Metadata is not enough.

A local-first, rejection-aware app that optimizes for craving and replay probability—not artist similarity or skip avoidance.

## What works now

- Manual track entry with 10 / 8 / 5 / 1 verdicts
- One-tap grading and re-rating for every saved track
- Inline editing for track metadata, notes, tags, source, and rating
- Seeded replay monsters, true 8s, and hard negatives
- Transparent 0–100 candidate scoring
- Mixed-artist warnings for artists such as Landon Sears and JMSN
- Candidate listening/review funnel
- Promotion of reviewed candidates into the known-track library
- Live taste-profile learnings
- JSON and CSV exports
- Local SQLite storage

## Setup

```bash
npm install
npm run db:push
npm run db:seed
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

On Windows PowerShell systems where `npm.ps1` is blocked, use `npm.cmd` for the same commands.

## Example workflow

1. Start the app.
2. Seed the known taste data.
3. Add 20 candidate songs manually.
4. Read the score, evidence, risks, and suggested action.
5. Listen in Spotify, Apple Music, or YouTube outside the app.
6. Rate each candidate and mark it promoted or rejected.
7. Re-rate any known track as your taste changes.
8. Re-score the remaining candidates with the latest learnings.
9. Export the updated profile.

## Scoring model

The v1 scorer lives in `lib/scoring`. It starts from a neutral prior and combines:

- Known 10/10 and false-positive history for the artist
- Explicit artist priors from the brief
- Manual tags and source-reason text
- Positive and negative phrases from `taste-rules.ts`
- A confidence level based on the amount of available evidence

Artist overlap is intentionally weak unless there are multiple proven 10s. Any artist with both loved and rejected tracks gets:

> Artist match is unreliable here. Requires song-level validation.

Run the unit tests with:

```bash
npm test
```

## Waiting for Spotify Export

The app is useful now with manual seeds and candidates; no Spotify connection or data export is needed.

The placeholder route at `/import/spotify-csv` and parser boundary in `lib/spotify-csv.ts` document the future mapping for:

- Track URI
- Track Name
- Artist Name(s)
- Genres
- Danceability
- Energy
- Valence
- Tempo

Once a real CSV arrives, it can be used as a fixture to finish a robust parser and improve song-level scoring. Imported metadata should enrich—not override—your listening verdicts.

## Privacy and media

The app does not download, rip, stream, or analyze full Spotify or Apple Music audio. All data is stored locally in SQLite.
