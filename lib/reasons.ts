import { negativeTasteRules, positiveTasteRules } from "@/taste-rules";

export type ReasonPolarity = "positive" | "negative" | "trajectory";

export type ReasonSignal = {
  id?: string;
  slug: string;
  label: string;
  polarity: ReasonPolarity | string;
  category: string;
  weight: number;
};

const slugify = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

const categoryFor = (label: string) => {
  if (/chorus|melody|groove|identity/i.test(label)) return "songcraft";
  if (/vocal|falsetto/i.test(label)) return "vocals";
  if (/production|synth|algorithmic/i.test(label)) return "production";
  if (/attention|replay|craving|fatigue|seek/i.test(label)) return "behavior";
  if (/artist|fit|lovable|sincere|effortless/i.test(label)) return "connection";
  return "overall";
};

export const defaultTasteReasons = [
  ...positiveTasteRules.map((rule, index) => ({
    slug: slugify(rule.phrase),
    label: rule.phrase,
    polarity: "positive" as const,
    category: categoryFor(rule.phrase),
    weight: rule.weight,
    sortOrder: index
  })),
  ...negativeTasteRules.map((rule, index) => ({
    slug: slugify(rule.phrase),
    label: rule.phrase,
    polarity: "negative" as const,
    category: categoryFor(rule.phrase),
    weight: rule.weight,
    sortOrder: 100 + index
  })),
  {
    slug: "grew-on-me",
    label: "grew on me",
    polarity: "trajectory" as const,
    category: "trajectory",
    weight: 0,
    sortOrder: 200
  },
  {
    slug: "fell-off",
    label: "fell off",
    polarity: "trajectory" as const,
    category: "trajectory",
    weight: 0,
    sortOrder: 201
  },
  {
    slug: "fatigue-increased",
    label: "fatigue increased",
    polarity: "trajectory" as const,
    category: "trajectory",
    weight: 0,
    sortOrder: 202
  }
];

export function selectedReasonIds(formData: FormData, field = "reasonIds") {
  return Array.from(
    new Set(
      formData
        .getAll(field)
        .map(String)
        .map((value) => value.trim())
        .filter(Boolean)
    )
  );
}

export function reasonSignals<
  T extends {
    reason: {
      id: string;
      slug: string;
      label: string;
      polarity: string;
      category: string;
      weight: number;
    };
  }
>(links: T[]): ReasonSignal[] {
  return links.map(({ reason }) => reason);
}
