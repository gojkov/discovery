import {
  createTasteReason,
  mergeTasteReason,
  restoreTasteReason,
  retireTasteReason,
  updateTasteReason
} from "@/app/actions";
import { Card, Eyebrow, inputClass } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function ReasonsPage() {
  const reasons = await db.tasteReason.findMany({
    include: { mergedInto: true },
    orderBy: [{ active: "desc" }, { sortOrder: "asc" }, { label: "asc" }]
  });
  const active = reasons.filter(
    (reason) => reason.active && !reason.mergedIntoId
  );

  return (
    <div className="space-y-8">
      <div>
        <Eyebrow>Controlled vocabulary</Eyebrow>
        <h1 className="text-4xl font-medium tracking-tight text-fg">
          Taste reasons
        </h1>
        <p className="mt-3 max-w-2xl text-muted">
          These chips are the only song-level labels the scorer learns from.
          Notes remain qualitative context and never become scoring evidence.
        </p>
      </div>

      <Card>
        <h2 className="text-xl font-semibold text-fg">Create a reason</h2>
        <form action={createTasteReason} className="mt-5 grid gap-3 md:grid-cols-4">
          <input className={inputClass} name="label" placeholder="Reason label" required />
          <input className={inputClass} name="category" placeholder="Category" required />
          <select className={inputClass} name="polarity" defaultValue="positive">
            <option value="positive">Positive</option>
            <option value="negative">Negative</option>
            <option value="trajectory">Trajectory</option>
          </select>
          <input className={inputClass} name="weight" type="number" min="-20" max="20" defaultValue="5" />
          <div className="md:col-span-4">
            <SubmitButton pendingLabel="Creating…">Create reason</SubmitButton>
          </div>
        </form>
      </Card>

      <div className="space-y-3">
        {reasons.map((reason) => (
          <Card key={reason.id} className={reason.active ? "" : "opacity-65"}>
            <form action={updateTasteReason} className="grid gap-3 md:grid-cols-6">
              <input type="hidden" name="id" value={reason.id} />
              <input className={`${inputClass} md:col-span-2`} name="label" defaultValue={reason.label} />
              <input className={inputClass} name="category" defaultValue={reason.category} />
              <select className={inputClass} name="polarity" defaultValue={reason.polarity}>
                <option value="positive">Positive</option>
                <option value="negative">Negative</option>
                <option value="trajectory">Trajectory</option>
              </select>
              <input className={inputClass} name="weight" type="number" min="-20" max="20" defaultValue={reason.weight} />
              <input className={inputClass} name="sortOrder" type="number" min="0" defaultValue={reason.sortOrder} />
              <div className="md:col-span-6">
                <SubmitButton pendingLabel="Saving…">Save</SubmitButton>
              </div>
            </form>
            <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-white/[0.06] pt-3">
              {reason.mergedInto ? (
                <span className="text-xs font-medium text-muted">
                  Merged into {reason.mergedInto.label}
                </span>
              ) : reason.active ? (
                <>
                  <form action={retireTasteReason}>
                    <input type="hidden" name="id" value={reason.id} />
                    <SubmitButton pendingLabel="Retiring…">Retire</SubmitButton>
                  </form>
                  {active.length > 1 && (
                    <form action={mergeTasteReason} className="flex gap-2">
                      <input type="hidden" name="sourceId" value={reason.id} />
                      <select className={inputClass} name="targetId" required>
                        <option value="">Merge into…</option>
                        {active
                          .filter((target) => target.id !== reason.id)
                          .map((target) => (
                            <option key={target.id} value={target.id}>
                              {target.label}
                            </option>
                          ))}
                      </select>
                      <SubmitButton pendingLabel="Merging…">Merge</SubmitButton>
                    </form>
                  )}
                </>
              ) : (
                <form action={restoreTasteReason}>
                  <input type="hidden" name="id" value={reason.id} />
                  <SubmitButton pendingLabel="Restoring…">Restore</SubmitButton>
                </form>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
