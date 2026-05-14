"use client";

import { Suspense, useEffect, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { clearGithubSession, readGithubSession } from "@/lib/auth/github";

type Result =
  | { ok: true; code: string; state: string }
  | { ok: false; message: string };

function GithubCallbackContent() {
  const searchParams = useSearchParams();

  const code = useMemo(() => searchParams.get("code") ?? "", [searchParams]);
  const state = useMemo(() => searchParams.get("state") ?? "", [searchParams]);
  const error = useMemo(() => searchParams.get("error") ?? "", [searchParams]);
  const errorDesc = useMemo(() => searchParams.get("error_description") ?? "", [searchParams]);

  const result = useMemo<Result>(() => {
    if (error) {
      return { ok: false, message: `${error}${errorDesc ? `: ${errorDesc}` : ""}` };
    }

    if (!code || !state) {
      return { ok: false, message: "Missing code/state" };
    }

    const session = readGithubSession();
    if (!session) {
      return { ok: false, message: "No login session (state not found)" };
    }

    if (session.state !== state) {
      return { ok: false, message: "State mismatch" };
    }

    return { ok: true, code, state };
  }, [code, state, error, errorDesc]);

  useEffect(() => {
    if (result.ok === false && result.message === "State mismatch") {
      clearGithubSession();
    }
  }, [result]);

  return (
    <>
      {result.ok === false && (
        <div className="mt-6 rounded-lg border p-4">
          <div className="font-semibold">Failed</div>
          <div className="mt-2 text-sm text-gray-600">{result.message}</div>
        </div>
      )}

      {result.ok === true && (
        <div className="mt-6 rounded-lg border p-4">
          <div className="font-semibold">OK (Step 4 complete)</div>
          <div className="mt-2 text-sm text-gray-600">Authorization code received:</div>
          <pre className="mt-2 overflow-auto rounded bg-gray-50 p-3 text-xs">{result.code}</pre>
        </div>
      )}
    </>
  );
}

export default function GithubCallbackPage() {
  return (
    <div className="mx-auto max-w-2xl p-6">
      <h1 className="text-2xl font-semibold">GitHub Callback</h1>

      <Suspense fallback={<div className="mt-6">Processing...</div>}>
        <GithubCallbackContent />
      </Suspense>
    </div>
  );
}
