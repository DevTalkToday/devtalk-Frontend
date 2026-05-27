import { notFound } from "next/navigation";
import Link from "next/link";
import { AppShell } from "@/components/devtalk/app-shell";
import { legalDocuments, type LegalDocumentKey } from "@/lib/legal";

type PageProps = {
  params: Promise<{ type: string }>;
};

export async function generateStaticParams() {
  return [{ type: "terms" }, { type: "privacy" }];
}

export default async function LegalDocumentPage({ params }: PageProps) {
  const { type } = await params;

  if (!(type in legalDocuments)) {
    notFound();
  }

  const doc = legalDocuments[type as LegalDocumentKey];

  return (
    <AppShell title={doc.title} description={doc.summary}>
      <article className="mx-auto max-w-4xl rounded-[28px] border border-(--border) bg-(--surface) p-5 shadow-(--shadow) backdrop-blur-[18px] sm:p-7">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-(--border) pb-5">
          <div className="text-sm font-semibold text-(--muted-strong)">
            <span>{doc.version}</span>
            <span className="mx-2">·</span>
            <span>시행일 {doc.effectiveDate}</span>
          </div>
          <Link
            href="/legal"
            className="rounded-full border border-(--border) bg-(--surface-raised) px-4 py-2 text-sm font-semibold text-(--muted-strong) transition hover:border-(--accent) hover:text-(--foreground)"
          >
            목록
          </Link>
        </div>

        <div className="whitespace-pre-wrap break-keep text-sm leading-8 text-(--muted-strong) sm:text-[15px]">
          {doc.content}
        </div>
      </article>
    </AppShell>
  );
}
