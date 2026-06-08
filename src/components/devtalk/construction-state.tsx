"use client";

import Image from "next/image";
import { AppShell } from "@/components/devtalk/app-shell";

export function ConstructionState() {
  return (
    <AppShell showPageHeader={false}>
      <section className="grid min-h-[70vh] place-items-center">
        <div className="grid justify-items-center gap-6 rounded-[28px] border border-(--border) bg-(--surface) px-8 py-10 text-center shadow-(--shadow)">
          <Image
            src="/construction.svg"
            alt="개발 중"
            width={220}
            height={220}
            priority
            className="theme-icon h-auto w-[180px] md:w-[220px]"
          />
          <p className="text-xl font-semibold text-(--foreground)">개발 중입니다.</p>
        </div>
      </section>
    </AppShell>
  );
}
