"use client";

import { AppShell } from "./app-shell";

type FeaturePageProps = {
  title: string;
  description: string;
  items: string[];
};

export function FeaturePage({ title, description, items }: FeaturePageProps) {
  return (
    <AppShell title={title} description={description}>
      <section className="grid gap-3 rounded-[28px] border border-(--border) bg-(--surface) p-6 shadow-(--shadow)">
        {items.map((item) => (
          <div key={item} className="rounded-2xl border border-(--border) bg-(--surface-raised) p-4 text-sm text-(--muted-strong)">
            {item}
          </div>
        ))}
      </section>
    </AppShell>
  );
}
