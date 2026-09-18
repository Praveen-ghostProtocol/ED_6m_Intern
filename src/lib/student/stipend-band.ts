export type StudentStipendBand = "0-20" | "20-40" | "40+" | "Not specified";

export function getStudentStipendBand(stipend: string | null | undefined): StudentStipendBand {
  if (!stipend?.trim()) return "Not specified";

  const normalized = stipend.toLowerCase().replace(/,/g, "");
  if (normalized.includes("unpaid")) return "0-20";

  const values = [...normalized.matchAll(/\d+(?:\.\d+)?/g)].map((match) => Number(match[0]));
  if (values.length === 0 || values.some((value) => !Number.isFinite(value))) {
    return "Not specified";
  }

  const usesThousands = normalized.includes("k") || values.every((value) => value < 1000);
  const monthlyValues = usesThousands ? values.map((value) => value * 1000) : values;
  const representativeValue = monthlyValues.reduce((sum, value) => sum + value, 0) / monthlyValues.length;

  if (representativeValue < 20_000) return "0-20";
  if (representativeValue < 40_000) return "20-40";
  return "40+";
}
