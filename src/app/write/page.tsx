"use client";

import Link from "next/link";
import { RequireLogin } from "@/components/auth/require-login";
import { AppShell } from "@/components/devtalk/app-shell";
import { ArrowLeftIcon } from "@/components/devtalk/icons";
import { buttonClassName } from "@/components/ui";
import { PostForm } from "@/components/devtalk/post-form";

export default function WritePage() {
  return (
    <RequireLogin>
      <AppShell
      title="에러 해결 기록 작성"
      actions={
        <Link href="/" className={buttonClassName()}>
          <ArrowLeftIcon className="size-4" />
          피드로
        </Link>
      }
      >
        <PostForm mode="create" />
      </AppShell>
    </RequireLogin>
  );
}
