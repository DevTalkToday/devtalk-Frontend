"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { clearGithubSession, readGithubSession } from "@/lib/auth/github";

type Result =
  | { ok: true; code: string; state: string }
  | { ok: false; message: string };

export default function GithubCallbackPage() {
  const sp = useSearchParams();
  const [result, setResult] = useState<Result | null>(null);

  const code = useMemo(() => sp.get("code") ?? "", [sp]);
  const state = useMemo(() => sp.get("state") ?? "", [sp]);
  const error = useMemo(() => sp.get("error") ?? "", [sp]);
  const errorDesc = useMemo(() => sp.get("error_description") ?? "", [sp]);

  useEffect(() => {
    if (error) {
      setResult({ ok: false, message: `${error}${errorDesc ? `: ${errorDesc}` : ""}` });
      return;
    }

    if (!code || !state) {
      setResult({ ok: false, message: "Missing code/state" });
      return;
    }

    const sess = readGithubSession();
    if (!sess) {
      setResult({ ok: false, message: "No login session (state not found)" });
      return;
    }

    if (sess.state !== state) {
      clearGithubSession();
      setResult({ ok: false, message: "State mismatch" });
      return;
    }

    // ✅ 여기까지가 4번: code 받기 성공
    setResult({ ok: true, code, state });
  }, [code, state, error, errorDesc]);

  return (
    <div className="mx-auto max-w-2xl p-6">
      <h1 className="text-2xl font-semibold">GitHub Callback</h1>

      {!result && <div className="mt-6">Processing...</div>}

      {result?.ok === false && (
        <div className="mt-6 rounded-lg border p-4">
          <div className="font-semibold">Failed</div>
          <div className="mt-2 text-sm text-gray-600">{result.message}</div>
        </div>
      )}

      {result?.ok === true && (
        <div className="mt-6 rounded-lg border p-4">
          <div className="font-semibold">OK (Step 4 complete)</div>
          <div className="mt-2 text-sm text-gray-600">Authorization code received:</div>
          <pre className="mt-2 overflow-auto rounded bg-gray-50 p-3 text-xs">
            {result.code}
          </pre>
        </div>
      )}
    </div>
  );
}
