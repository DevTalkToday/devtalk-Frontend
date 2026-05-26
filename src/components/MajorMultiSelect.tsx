"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { FetchGet } from "@/lib/api/fetch";

export type MajorOption = { code: string; label: string };

type Props = {
  value: string[];
  onChange: (next: string[]) => void;
  maxSelect?: number;
  valueMode?: "code" | "label";
};

type ItemsResponse = { items: MajorOption[] };

const hasItems = (data: unknown): data is ItemsResponse => {
  if (!data || typeof data !== "object") return false;
  const candidate = data as { items?: unknown };
  return Array.isArray(candidate.items);
};

const normalizeMajors = (data: unknown): MajorOption[] => {
  if (Array.isArray(data)) return data as MajorOption[];
  if (hasItems(data)) return data.items;
  return [];
};

export default function MajorMultiSelect({ value, onChange, maxSelect, valueMode = "code" }: Props) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["majors"],
    queryFn: () => FetchGet("/majors"),
    staleTime: 60_000,
  });

  const options = useMemo(() => normalizeMajors(data), [data]);

  const toggle = (option: MajorOption) => {
    const selectedValue = valueMode === "label" ? option.label : option.code;
    const has = value.includes(option.code) || value.includes(option.label);

    if (has) {
      onChange(value.filter((item) => item !== option.code && item !== option.label));
      return;
    }

    if (maxSelect && value.length >= maxSelect) return;
    onChange([...value, selectedValue]);
  };

  if (isLoading) return <div className="text-sm text-(--muted-strong)">전공 목록을 불러오는 중...</div>;
  if (isError) return <div className="text-sm text-(--danger)">전공 목록을 불러오지 못했습니다.</div>;

  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => {
        const selected = value.includes(option.code) || value.includes(option.label);

        return (
          <button
            key={option.code}
            type="button"
            aria-pressed={selected}
            onClick={() => toggle(option)}
            className={[
              "inline-flex items-center justify-center gap-2 rounded-full border px-4 py-3 text-[0.88rem] font-medium transition duration-150",
              selected
                ? "border-(--accent) bg-(--surface-soft) text-(--foreground)"
                : "border-(--border) bg-(--surface-raised) text-(--muted-strong) hover:-translate-y-px hover:border-(--accent) hover:bg-(--surface-soft) hover:text-(--foreground)",
            ].join(" ")}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
