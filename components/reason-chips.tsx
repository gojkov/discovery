import clsx from "clsx";

type Reason = {
  id: string;
  label: string;
  polarity: string;
  category: string;
};

export function ReasonChips({
  reasons,
  selected = [],
  name = "reasonIds",
  includeTrajectory = false
}: {
  reasons: Reason[];
  selected?: string[];
  name?: string;
  includeTrajectory?: boolean;
}) {
  const visible = includeTrajectory
    ? reasons
    : reasons.filter((reason) => reason.polarity !== "trajectory");

  return (
    <fieldset className="md:col-span-2">
      <legend className="mb-2 text-sm font-medium text-fg">
        Taste reasons <span className="font-normal text-subtle">(optional)</span>
      </legend>
      <div className="flex flex-wrap gap-2">
        {visible.map((reason) => {
          const checked = selected.includes(reason.id);
          return (
            <label
              key={reason.id}
              className={clsx(
                "cursor-pointer rounded-full border px-3 py-2 text-xs font-medium transition has-[:focus-visible]:ring-4 has-[:focus-visible]:ring-cyan/15",
                reason.polarity === "negative"
                  ? "border-coral/25 text-coral has-[:checked]:bg-coral/20"
                  : reason.polarity === "trajectory"
                    ? "border-violet/25 text-violet has-[:checked]:bg-violet/20"
                    : "border-cyan/25 text-cyan has-[:checked]:bg-cyan/20"
              )}
            >
              <input
                className="sr-only"
                type="checkbox"
                name={name}
                value={reason.id}
                defaultChecked={checked}
              />
              {reason.label}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
