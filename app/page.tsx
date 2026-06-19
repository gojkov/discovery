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
  const [tracks, candidates] = await Promise.all([
    db.track.findMany(),
    db.candidate.findMany()
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
    ["10 / obsession", profile.counts.tens, Flame, "bg-acid text-ink"],
    ["8 / good", profile.counts.eights, Sparkles, "bg-cyan/15 text-cyan"],
    ["1 / skip", profile.counts.skips, CircleX, "bg-coral/15 text-coral"],
    ["candidates", candidates.length, ListMusic, "bg-violet/15 text-violet"]
  ];

  return (
    <div className="space-y-8">
      <section className="relative grid overflow-hidden rounded-[2.25rem] border border-white/[0.08] bg-[linear-gradient(135deg,#0c0c12_0%,#07070b_56%,#100914_100%)] px-7 py-10 text-cream shadow-card md:grid-cols-[1.4fr_0.6fr] md:px-12">
        <div className="pointer-events-none absolute -right-24 -top-40 size-96 rounded-full bg-pink/10 blur-[100px]" />
        <div className="pointer-events-none absolute -bottom-52 left-1/4 size-96 rounded-full bg-cyan/10 blur-[110px]" />
        <div>
          <Eyebrow>Local taste intelligence</Eyebrow>
          <h1 className="max-w-3xl text-4xl font-black leading-[0.98] tracking-[-0.05em] md:text-7xl">
            Find the songs you&apos;ll crave, not merely tolerate.
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-7 text-cream/55">
            A transparent, rejection-aware ranking system trained on your
            manually entered 10s, 8s, and hard no&apos;s.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/candidates"
              className="inline-flex items-center gap-2 rounded-full bg-cyan px-5 py-3 text-sm font-black text-ink shadow-[0_0_34px_rgba(70,232,255,0.2)] transition hover:-translate-y-0.5 hover:bg-cream"
            >
              Rank candidates <ArrowRight size={16} />
            </Link>
            <Link
              href="/tracks"
              className="rounded-full border border-white/15 bg-white/[0.03] px-5 py-3 text-sm font-black transition hover:border-pink/60 hover:text-pink"
            >
              Add a known track
            </Link>
          </div>
        </div>
        <div className="flex min-h-64 items-end justify-center">
          <div className="relative grid size-56 place-items-center rounded-full border border-cyan/20 bg-cyan/[0.03]">
            <div className="absolute inset-5 rounded-full border border-pink/30 shadow-[0_0_60px_rgba(255,60,172,0.12)]" />
            <div className="absolute inset-12 rounded-full bg-cyan text-ink shadow-[0_0_80px_rgba(70,232,255,0.28)]" />
            <div className="relative text-center text-ink">
              <span className="block text-6xl font-black">{profile.counts.tens}</span>
              <span className="text-[10px] font-black uppercase tracking-[0.2em]">
                replay monsters
              </span>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {metrics.map(([label, value, Icon, color]) => (
          <Card key={String(label)} className="relative overflow-hidden">
            <div className={`mb-8 grid size-11 place-items-center rounded-full ${color}`}>
              <Icon size={20} />
            </div>
            <p className="text-4xl font-black tracking-tight">{String(value)}</p>
            <p className="mt-1 text-sm font-bold text-cream/40">{String(label)}</p>
          </Card>
        ))}
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <Card>
          <Eyebrow>High-signal artists</Eyebrow>
          <h2 className="text-2xl font-black tracking-tight">
            Most proven replay sources
          </h2>
          <div className="mt-6 space-y-3">
            {profile.topArtists.slice(0, 8).map((artist, index) => (
              <div
                key={artist.artist}
                className="flex items-center justify-between border-b border-white/[0.07] pb-3"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xs font-black text-cream/25">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span className="font-bold">{artist.artist}</span>
                </div>
                <span className="rounded-full bg-acid/15 px-2.5 py-1 text-xs font-black text-acid">
                  {artist.tens} × 10
                </span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="!border-pink/20 !bg-[linear-gradient(145deg,rgba(139,92,255,0.18),rgba(255,60,172,0.08))] text-white">
          <Eyebrow className="!text-acid">Current learnings</Eyebrow>
          <h2 className="text-2xl font-black tracking-tight">
            What the engine believes now
          </h2>
          <div className="mt-6 space-y-4">
            {profile.learnings.map((learning) => (
              <div
                key={learning}
                className="rounded-2xl border border-white/15 bg-white/10 p-4 text-sm font-semibold leading-6"
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
                <div className="mb-2 flex justify-between text-sm font-bold">
                  <span className="capitalize">{status}</span>
                  <span>{count}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-white/[0.06]">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-cyan to-violet shadow-[0_0_18px_rgba(70,232,255,0.3)]"
                    style={{
                      width: `${
                        candidates.length ? Math.max(5, (count / candidates.length) * 100) : 0
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
              <h3 className="font-black">Strongest positive</h3>
              <div className="mt-4 space-y-3">
                {profile.strongestPositiveRules.slice(0, 5).map((rule) => (
                  <div key={rule.phrase} className="flex justify-between gap-3 text-sm">
                    <span className="text-cream/50">{rule.phrase}</span>
                    <span className="font-black">{rule.count}</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h3 className="font-black">Strongest negative</h3>
              <div className="mt-4 space-y-3">
                {profile.strongestNegativeRules.slice(0, 5).map((rule) => (
                  <div key={rule.phrase} className="flex justify-between gap-3 text-sm">
                    <span className="text-cream/50">{rule.phrase}</span>
                    <span className="font-black">{rule.count}</span>
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
