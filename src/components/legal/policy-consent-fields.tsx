"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { legalDocuments, type LegalDocumentKey } from "@/lib/legal";

type ConsentValues = Record<LegalDocumentKey, boolean>;

type PolicyConsentFieldsProps = {
  value: ConsentValues;
  onChange: (name: LegalDocumentKey, checked: boolean) => void;
};

type PolicyConsentItemProps = {
  doc: (typeof legalDocuments)[LegalDocumentKey];
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
};

const policyDocuments = [legalDocuments.terms, legalDocuments.privacy] as const;

function PolicyConsentItem({ doc, checked, onCheckedChange }: PolicyConsentItemProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  const [readComplete, setReadComplete] = useState(false);
  const inputId = `policy-consent-${doc.key}`;

  const updateReadComplete = () => {
    const element = contentRef.current;
    if (!element) return;

    if (element.scrollTop + element.clientHeight >= element.scrollHeight - 12) {
      setReadComplete(true);
    }
  };

  return (
    <section className="grid gap-3 rounded-[22px] border border-(--border) bg-(--surface-raised) p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-(--foreground)">{doc.title}</h2>
        </div>
        <Link
          href={`/legal/${doc.key}`}
          target="_blank"
          rel="noreferrer"
          className="text-xs font-semibold text-(--accent) underline-offset-4 hover:underline"
        >
          전문 보기
        </Link>
      </div>

      <div
        ref={contentRef}
        role="region"
        aria-label={`${doc.title} 본문`}
        tabIndex={0}
        onScroll={updateReadComplete}
        className="themed-scrollbar max-h-44 overflow-y-auto rounded-2xl border border-(--border) bg-(--surface-soft) p-4 text-xs leading-6 text-(--muted-strong) outline-none transition focus:border-(--accent)"
      >
        <div className="whitespace-pre-wrap break-keep">{doc.content}</div>

        <label
          htmlFor={inputId}
          className={[
            "mt-5 flex items-start gap-3 rounded-2xl border border-(--border) bg-(--surface-raised) p-4 text-sm font-semibold",
            readComplete ? "cursor-pointer text-(--foreground)" : "cursor-not-allowed text-(--muted)",
          ].join(" ")}
        >
          <input
            id={inputId}
            type="checkbox"
            checked={checked}
            disabled={!readComplete}
            onChange={(event) => onCheckedChange(event.target.checked)}
            className="mt-0.5 size-4 accent-(--accent) disabled:cursor-not-allowed"
          />
          {doc.title}을 확인했으며 이에 동의합니다.
        </label>
      </div>
    </section>
  );
}

export function PolicyConsentFields({ value, onChange }: PolicyConsentFieldsProps) {
  return (
    <section className="mt-6 grid gap-4" aria-labelledby="policy-consent-title">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 id="policy-consent-title" className="text-sm font-semibold text-(--foreground)">
            약관 확인
          </h2>
          <p className="mt-1 text-xs leading-5 text-(--muted-strong)">
            각 정책 본문을 끝까지 읽은 뒤 확인 및 동의할 수 있습니다.
          </p>
        </div>
      </div>

      {policyDocuments.map((doc) => (
        <PolicyConsentItem
          key={doc.key}
          doc={doc}
          checked={value[doc.key]}
          onCheckedChange={(checked) => onChange(doc.key, checked)}
        />
      ))}
    </section>
  );
}
