import Link from "next/link";

export default function LegalIndexPage() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      <h1 className="text-2xl font-semibold">약관 및 정책</h1>

      <div className="mt-6 space-y-3">
        <Link href="/legal/terms" className="block rounded-lg border px-4 py-3 hover:bg-gray-50">
          이용약관
        </Link>
        <Link href="/legal/privacy" className="block rounded-lg border px-4 py-3 hover:bg-gray-50">
          개인정보 처리방침
        </Link>
      </div>
    </div>
  );
}