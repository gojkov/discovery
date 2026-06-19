import Link from "next/link";
import {
  ArrowRight,
  CircleX,
  Flame,
  ListMusic,
  Sparkles,
  type LucideIcon
} from "lucide-react";
import { db } from "@/lib/db";
import { buildTasteProfile } from "@/lib/profile";
import { Card, Eyebrow } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [tracks, candidates, streamCount, behavioralLoves, pendingReview] =
    await Promise.all([
      db.track.findMany(),
      db.candidate.findMany(),
      db.streamStat.count(),
      db.streamStat.count({ where: { derivedRating: 10 } }),
      db.streamStat.count({
        where: { reviewed: false, derivedRating: { in: [10, 1] } }
      })
    ]);
  const profile = buildTasteProfile(
    tracks.map((track) => ({ ...track, tags: track.tags }))
  );
  const funnel = Object.fromEntries(
    ["unreviewed", "sampled", "promoted", "rejected"].map((status) => [
      status,
      candidates.filter((candidate) => candidate.status === status).length
    ])
  );
  const metrics: Array<[string, number, LucideIcon, string]> = [
    ["obsession · 10", profile.counts.tens, Flame, "bg-lime/15 text-lime"],
    ["good · 8", profile.counts.eights, Sparkles, "bg-cyan/15 text-cyan"],
    ["skip · 1", profile.counts.skips, CircleX, "bg-coral/15 text-coral"],
    ["candidates", candidates.length, ListMusic, "bg-violet/15 text-violet"]
  ];

  return (
    <div className="space-y-10">
      <section className="relative grid overflow-hidden rounded-5xl border border-white/[0.08] bg-[linear-gradient(135deg,#0d0d16_0%,#08080d_56%,#120a16_100%)] px-7 py-12 shadow-card md:grid-cols-[1.4fr_0.6fr] md:px-12">
        <div className="pointer-events-none absolute -right-24 -top-40 size-96 rounded-full bg-pink/10 blur-[100px]" />
        <div className="pointer-events-none absolute -bottom-52 left-1/4 size-96 rounded-full bg-cyan/10 blur-[110px]" />
        <div className="relative">
          <Eyebrow>Local taste intelligence</Eyebrow>
          <h1 className="max-w-3xl text-4xl font-medium tracking-tight text-fg md:text-[4.25rem] md:leading-[1.02]">
            Find the songs you&apos;ll{" "}
            <span className="font-semibold text-cyan">crave</span>, not merely
            tolerate.
          </h1>
          <p className="mt-6 max-w-xl text-base leading-7 text-muted">
            A transparent, rejection-aware ranking system trained on your
            manually entered 10s, 8s, and hard no&apos;s.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/candidates"
              className="inline-flex items-center gap-2 rounded-full bg-cyan px-5 py-3 text-sm font-semibold text-ink shadow-glow transition hover:-translate-y-0.5 hover:bg-fg"
            >
              Rank candidates <ArrowRight size={16} />
            </Link>
            <Link
              href="/tracks"
              className="rounded-full border border-white/15 bg-white/[0.03] px-5 py-3 text-sm font-medium text-fg transition hover:border-pink/60 hover:text-pink"
            >
              Add a known track
            </Link>
          </div>
        </div>
        <div className="relative flex min-h-64 items-end justify-center">
          <div className="relative grid size-56 place-items-center rounded-full border border-cyan/20 bg-cyan/[0.03]">
            <div className="absolute inset-5 rounded-full border border-pink/30 shadow-[0_0_60px_rgba(255,92,192,0.12)]" />
            <div className="absolute inset-12 rounded-full bg-cyan shadow-[0_0_80px_rgba(92,214,255,0.28)]" />
            <div className="relative text-center text-ink">
              <span className="tabular block text-6xl font-bold">
                {profile.counts.tens}
              </span>
              <span className="font-mono text-[10px] font-semibold uppercase tracking-eyebrow">
                replay monsters
              </span>
            </div>
          </div>
        </div>
      </section>

      {streamCount > 0 && (
        <Link href="/review" className="block">
          <Card className="!border-violet/25 !bg-[linear-gradient(145deg,rgba(161,129,255,0.12),rgba(92,214,255,0.05))] transition hover:!border-violet/40">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <Eyebrow className="!text-violet">Behavioral intelligence</Eyebrow>
                <p className="text-base text-fg">
                  Trained on{" "}
                  <span className="tabular font-semibold">
                    {streamCount.toLocaleString()}
                  </span>{" "}
                  tracks from your real listening —{" "}
                  <span className="tabular font-semibold text-lime">
                    {behavioralLoves.toLocaleString()}
                  </span>{" "}
                  behavioral 10s detected.
                </p>
              </div>
              {pendingReview > 0 && (
                <span className="inline-flex shrink-0 items-center gap-2 rounded-full bg-violet/20 px-4 py-2 text-sm font-semibold text-violet">
                  <span className="tabular">{pendingReview}</span> to review →
                </span>
              )}
            </div>
          </Card>
        </Link>
      )}

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {metrics.map(([label, value, Icon, color]) => (
          <Card key={String(label)} className="relative overflow-hidden">
            <div
              className={`mb-8 grid size-11 place-items-center rounded-2xl ${color}`}
            >
              <Icon size={20} />
            </div>
            <p className="tabular text-4xl font-semibold text-fg">
              {String(value)}
            </p>
            <p className="mt-1 font-mono text-xs uppercase tracking-eyebrow text-subtle">
              {String(label)}
            </p>
          </Card>
        ))}
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <Card>
          <Eyebrow>High-signal artists</Eyebrow>
          <h2 className="text-2xl font-semibold tracking-tight text-fg">
            Most proven replay sources
          </h2>
          <div className="mt-6 space-y-1">
            {profile.topArtists.slice(0, 8).map((artist, index) => (
              <div
                key={artist.artist}
                className="flex items-center justify-between border-b border-white/[0.06] py-2.5 last:border-0"
              >
                <div className="flex items-center gap-3">
                  <span className="tabular text-xs text-subtle">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span className="font-medium text-fg">{artist.artist}</span>
                </div>
                <span className="tabular rounded-full bg-lime/12 px-2.5 py-1 text-xs font-semibold text-lime">
                  {artist.tens} × 10
                </span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="!border-violet/25 !bg-[linear-gradient(145deg,rgba(161,129,255,0.16),rgba(255,92,192,0.06))]">
          <Eyebrow className="!text-lime">Current learnings</Eyebrow>
          <h2 className="text-2xl font-semibold tracking-tight text-fg">
            What the engine believes now
          </h2>
          <div className="mt-6 space-y-3">
            {profile.learnings.map((learning) => (
              <div
                key={learning}
                className="rounded-2xl border border-white/12 bg-white/[0.06] p-4 text-sm leading-6 text-fg"
              >
                {learning}
              </div>
            ))}
          </div>
        </Card>
      </section>

      <section className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
        <Card>
          <Eyebrow>Candidate funnel</Eyebrow>
          <div className="mt-5 space-y-4">
            {Object.entries(funnel).map(([status, count]) => (
              <div key={status}>
                <div className="mb-2 flex justify-between text-sm">
                  <span className="font-medium capitalize text-muted">
                    {status}
                  </span>
                  <span className="tabular font-semibold text-fg">{count}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-white/[0.06]">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-cyan to-violet"
                    style={{
                      width: `${
                        candidates.length
                          ? Math.max(5, (count / candidates.length) * 100)
                          : 0
                      }%`
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <Eyebrow>Taste rules with evidence</Eyebrow>
          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <h3 className="text-sm font-semibold text-fg">
                Strongest positive
              </h3>
              <div className="mt-4 space-y-2.5">
                {profile.strongestPositiveRules.slice(0, 5).map((rule) => (
                  <div
                    key={rule.phrase}
                    className="flex justify-between gap-3 text-sm"
                  >
                    <span className="text-muted">{rule.phrase}</span>
                    <span className="tabular font-semibold text-fg">
                      {rule.count}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-fg">
                Strongest negative
              </h3>
              <div className="mt-4 space-y-2.5">
                {profile.strongestNegativeRules.slice(0, 5).map((rule) => (
                  <div
                    key={rule.phrase}
                    className="flex justify-between gap-3 text-sm"
                  >
                    <span className="text-muted">{rule.phrase}</span>
                    <span className="tabular font-semibold text-fg">
                      {rule.count}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>
      </section>
    </div>
  );
}
