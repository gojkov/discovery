import { Download } from "lucide-react";
import { Card, Eyebrow } from "@/components/ui";

const exports = [
  ["All tracks", "Known loves, neutrals, and hard negatives.", "/api/export/tracks", "JSON"],
  ["Candidates", "Full queue, scores, reasons, and reviews.", "/api/export/candidates", "JSON"],
  ["Candidate rankings", "Spreadsheet-ready ranked candidate list.", "/api/export/rankings", "CSV"],
  ["Taste profile", "Artist signals, learned rules, and summary counts.", "/api/export/taste-profile", "JSON"]
];

export default function ExportsPage() {
  return (
    <div className="space-y-8">
      <div>
        <Eyebrow>Portable learnings</Eyebrow>
        <h1 className="text-4xl font-black tracking-[-0.04em]">Export your taste</h1>
        <p className="mt-3 text-cream/50">
          Your data remains legible and yours—no lock-in, no mystery blob.
        </p>
      </div>
      <div className="grid gap-5 md:grid-cols-2">
        {exports.map(([title, copy, href, format]) => (
          <Card key={href}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-widest text-cyan">
                  {format}
                </p>
                <h2 className="mt-2 text-xl font-black">{title}</h2>
                <p className="mt-2 text-sm leading-6 text-cream/45">{copy}</p>
              </div>
              <a
                href={href}
                className="grid size-11 shrink-0 place-items-center rounded-full bg-cyan text-ink shadow-[0_0_26px_rgba(70,232,255,0.2)] transition hover:scale-105 hover:bg-pink"
                aria-label={`Download ${title}`}
              >
                <Download size={18} />
              </a>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
