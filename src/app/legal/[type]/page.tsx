import { notFound } from "next/navigation";
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
    <div className="mx-auto max-w-3xl px-6 py-10">
      <div className="mb-6 border-b pb-4">
        <h1 className="text-2xl font-semibold">{doc.title}</h1>
        <div className="mt-2 text-sm text-gray-500">
          <span>{doc.version}</span>
          <span className="mx-2">·</span>
          <span>시행일 {doc.effectiveDate}</span>
        </div>
      </div>

      <article className="whitespace-pre-wrap ...">
        {doc.content}
      </article>
    </div>
  );
}