# Steve Discovery Engine

Music discovery that actually understands why you like what you like. Metadata is not enough.

A local-first, rejection-aware app that optimizes for craving and replay probability—not artist similarity or skip avoidance.

## What works now

- Manual track entry with 10 / 8 / 5 / 1 verdicts
- One-tap grading and re-rating for every saved track
- Inline editing for track metadata, notes, tags, source, and rating
- Seeded replay monsters, true 8s, and hard negatives
- Transparent 0–100 candidate scoring that **learns from your real outcomes**
  (per-artist hit-rate priors + selected taste-reason chips)
- Curated, editable taste-reason chips; free-text notes never become scoring evidence
- Durable rating events and reason history
- **Active discovery** — seed from your proven 10s, pull similar tracks from
  Last.fm, dedupe, score, and queue the best (`/discover`)
- Optional Spotify play-link enrichment on discovered candidates
- Mixed-artist warnings for artists such as Landon Sears and JMSN
- Candidate listening/review funnel
- Promotion of reviewed candidates into the known-track library
- Live taste-profile learnings
- JSON and RFC-4180 CSV exports
- Local SQLite storage
- Validated inputs (zod), accessible refined-dark UI with real typography

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

## Importing your Spotify history (behavioral signal)

Request your data from Spotify (Privacy Settings → "Extended streaming history"),
unzip both archives into a local `spotify-export/` folder (gitignored), then:

```bash
npm run import:spotify -- spotify-export
```

This aggregates every play/skip/replay into a `StreamStat` per track, derives
ratings for confident cases (loved replay monsters, hard skips), and computes a
0–100 craving score. The scoring engine then trains on this decade of real
listening alongside your manual library (manual ratings always win). Confirm or
dismiss the auto-detected loves/rejects on the **Review** page. Only track-level
aggregates are stored — no IPs or other PII from the raw export, which stays
gitignored and is never committed.

Spotify saved-library status is retained as metadata only. A save does not add
craving points, create an 8/10 label, or override contradictory behavior.

After upgrading an existing database, run:

```bash
npm run db:push
npm run migrate:taste-model
```

The migration seeds the controlled reason taxonomy, maps recognized legacy
tags, backfills initial rating events, and recomputes behavioral labels using
the saved-neutral model.

> The export is **behavioral, not acoustic** — it has no audio features. It
> supercharges the preference/craving model; true sound analysis would need a
> separate audio provider.

## Discovery integration

Discovery is live once you add a free Last.fm key. Copy `.env.example` to
`.env` and set:

- `LASTFM_API_KEY` — required for `/discover` (create at
  [last.fm/api](https://www.last.fm/api/account/create), no OAuth)
- `SPOTIFY_CLIENT_ID` / `SPOTIFY_CLIENT_SECRET` — optional, attaches Spotify
  play links to finds (create at
  [developer.spotify.com](https://developer.spotify.com/dashboard))

Without keys the app is still fully usable with manual seeds and candidates;
`/discover` shows a setup card instead of failing.

> Note: Spotify deprecated Audio Features, Recommendations, and Related Artists
> for newly-created apps (Nov 2024), so similarity sourcing runs through Last.fm
> and Spotify is used only for metadata/links.

## Spotify CSV import

The parser in `lib/spotify-csv.ts` is implemented and tested (quoted commas,
BOM, embedded newlines, header aliases, dedupe, partial rows). It documents the
mapping for:

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
