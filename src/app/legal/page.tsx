import Link from "next/link";
import { AppShell } from "@/components/devtalk/app-shell";
import { legalDocuments } from "@/lib/legal";

export default function LegalIndexPage() {
  return (
    <AppShell title="약관 및 정책" description="Devtalk 서비스 이용과 개인정보 처리 기준을 확인할 수 있습니다.">
      <section className="grid gap-4 md:grid-cols-2">
        {Object.values(legalDocuments).map((doc) => (
          <Link
            key={doc.key}
            href={`/legal/${doc.key}`}
            className="grid min-h-44 content-between rounded-[24px] border border-(--border) bg-(--surface) p-5 shadow-(--shadow) transition duration-150 hover:-translate-y-px hover:border-(--accent) hover:bg-(--surface-raised)"
          >
            <div className="grid gap-3">
              <h2 className="text-xl font-semibold">{doc.title}</h2>
              <p className="text-sm leading-6 text-(--muted-strong)">{doc.summary}</p>
            </div>
            <p className="mt-5 text-xs font-semibold text-(--muted-strong)">
              {doc.version} · 시행일 {doc.effectiveDate}
            </p>
          </Link>
        ))}
      </section>
    </AppShell>
  );
}
