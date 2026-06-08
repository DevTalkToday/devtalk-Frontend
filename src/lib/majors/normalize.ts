export type MajorOption = { code: string; label: string };

const KNOWN_MAJORS: MajorOption[] = [
  { code: "frontend", label: "프론트엔드" },
  { code: "backend", label: "백엔드" },
  { code: "ai", label: "AI" },
  { code: "devops", label: "DevOps" },
  { code: "design", label: "디자인" },
  { code: "mobile", label: "모바일" },
  { code: "qa", label: "QA" },
];

const findKnownMajor = (value: string) => {
  const normalized = value.trim();
  if (!normalized) return null;

  return KNOWN_MAJORS.find((major) => major.code === normalized || major.label === normalized) ?? null;
};

export const isKnownMajorValue = (value: string) => findKnownMajor(value) !== null;

export const getMajorLabel = (value: string) => {
  const normalized = value.trim();
  if (!normalized) return "";

  const matched = findKnownMajor(normalized);
  return matched?.label ?? normalized;
};

export const normalizeMajorValues = (values: string[], maxItems = 5) => {
  const seen = new Set<string>();
  const normalized: string[] = [];

  for (const value of values) {
    const label = getMajorLabel(value);
    if (!label || seen.has(label)) continue;

    seen.add(label);
    normalized.push(label);

    if (normalized.length >= maxItems) break;
  }

  return normalized;
};
