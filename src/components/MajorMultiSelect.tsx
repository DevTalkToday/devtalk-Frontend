"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { FetchGet } from "@/lib/api/fetch";

export type MajorOption = { code: string; label: string };

type Props = {
  value: string[];
  onChange: (next: string[]) => void;
  maxSelect?: number;
};

const normalizeMajors = (data: unknown): MajorOption[] => {
  if (Array.isArray(data)) return data as MajorOption[];
  if (data && typeof data === "object" && Array.isArray((data as any).items)) return (data as any).items as MajorOption[];
  return [];
};

export default function MajorMultiSelect({ value, onChange, maxSelect }: Props) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["majors"],
    queryFn: () => FetchGet("/api/majors"),
    staleTime: 60_000,
  });

  const options = useMemo(() => normalizeMajors(data), [data]);

  const toggle = (code: string) => {
    const has = value.includes(code);
    if (has) {
      onChange(value.filter((v) => v !== code));
      return;
    }
    if (maxSelect && value.length >= maxSelect) return;
    onChange([...value, code]);
  };

  if (isLoading) return <div className="text-sm text-gray-500">전공 목록 불러오는 중...</div>;
  if (isError) return <div className="text-sm text-red-600">전공 목록을 불러오지 못했습니다.</div>;

  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => {
        const selected = value.includes(opt.code);

        return (
          <button
            key={opt.code}
            type="button"
            aria-pressed={selected}
            onClick={() => toggle(opt.code)}
            className="h-9 rounded-full border px-3 text-sm transition"
            style={{
                borderColor: selected ? "#3B82F6" : "#D1D5DB",
                backgroundColor: selected ? "#EFF6FF" : "#FFFFFF",
                color: selected ? "#1D4ED8" : "#374151",
            }}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
