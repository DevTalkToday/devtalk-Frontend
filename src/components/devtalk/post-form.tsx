"use client";

import { startTransition, useState } from "react";
import { useRouter } from "next/navigation";
import MajorMultiSelect from "@/components/MajorMultiSelect";
import MarkdownEditor from "@/components/editor/MarkdownEditor";
import { Button, ChipGroup, Field, Input, Textarea } from "@/components/ui";
import { normalizeMajorValues } from "@/lib/majors/normalize";
import { FetchPostAuth, FetchPutAuth } from "@/lib/api/fetch";
import {
  BUG_PRIORITIES,
  BUG_STATUS_LABELS,
  CATEGORY_LABELS,
  type BugPriority,
  type BugStatus,
  type PostCategory,
  type PostDetail,
} from "@/lib/posts/types";
import { showErrorToast } from "@/lib/toast/events";

type Props = {
  mode: "create" | "edit";
  postId?: string;
  initialPost?: PostDetail;
};

type FormState = {
  title: string;
  category: PostCategory;
  tagsText: string;
  majors: string[];
  content: string;
  questionSolved: boolean;
  questionEnvironment: string;
  questionTried: string;
  bugStatus: BugStatus;
  bugPriority: BugPriority;
  bugAssignee: string;
  bugEnvironment: string;
  bugExpected: string;
  bugActual: string;
  bugSteps: string;
  bugLabelsText: string;
};

const toCsv = (items: string[]) => items.join(", ");

const fromCsv = (value: string) =>
  value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

const fromLines = (value: string) =>
  value
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean);

const BUG_STATUS_FORM_OPTIONS: BugStatus[] = ["open", "fixed", "closed"];

const createInitialState = (post?: PostDetail): FormState => ({
  title: post?.title ?? "",
  category: post?.category ?? "bug",
  tagsText: toCsv(post?.tags ?? []),
  majors: normalizeMajorValues(post?.majors ?? [], 3),
  content: post?.content ?? "",
  questionSolved: post?.question?.solved ?? false,
  questionEnvironment: post?.question?.environment ?? "",
  questionTried: post?.question?.tried ?? "",
  bugStatus: post?.bug?.status ?? "open",
  bugPriority: post?.bug?.priority ?? "P2",
  bugAssignee: post?.bug?.assignee ?? "",
  bugEnvironment: post?.bug?.environment ?? "",
  bugExpected: post?.bug?.expected ?? "",
  bugActual: post?.bug?.actual ?? "",
  bugSteps: (post?.bug?.reproductionSteps ?? []).join("\n"),
  bugLabelsText: toCsv(post?.bug?.labels ?? []),
});

export function PostForm({ mode, postId, initialPost }: Props) {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(() => createInitialState(initialPost));
  const [submitting, setSubmitting] = useState(false);

  const canSubmit = form.title.trim().length > 0 && form.content.trim().length > 0;

  const patch = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const submit = async () => {
    if (submitting) return;
    if (!canSubmit) {
      showErrorToast("필수 정보를 입력해주세요.");
      return;
    }

    setSubmitting(true);

    try {
      const payload = {
        title: form.title,
        content: form.content,
        category: form.category,
        tags: fromCsv(form.tagsText),
        majors: form.majors,
        question:
          form.category === "qna"
            ? {
                solved: form.questionSolved,
                environment: form.questionEnvironment,
                tried: form.questionTried,
              }
            : undefined,
        bug:
          form.category === "bug"
            ? {
                status: form.bugStatus,
                priority: form.bugPriority,
                assignee: form.bugAssignee,
                environment: form.bugEnvironment,
                expected: form.bugExpected,
                actual: form.bugActual,
                reproductionSteps: fromLines(form.bugSteps),
                labels: fromCsv(form.bugLabelsText),
                watchers: initialPost?.bug?.watchers ?? 0,
              }
            : undefined,
      };

      const response =
        mode === "create"
          ? await FetchPostAuth("/posts", payload)
          : await FetchPutAuth(`/posts/${postId}`, payload);

      const id = (response as PostDetail).id;
      startTransition(() => router.push(`/${id}`));
    } catch {
      // Request helper shows a toast with a safe message.
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="grid gap-6">
      <section className="space-y-6 rounded-4xl border border-(--border) bg-(--surface) p-6 shadow-(--shadow) backdrop-blur-[18px]">
        <div className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
          <div className="space-y-4">
            <Input
              id="post-title"
              label="제목"
              content="제목에 들어갈 내용을 작성해주세요"
              value={form.title}
              onChange={(event) => patch("title", event.target.value)}
            />

            <ChipGroup
              label="기록 유형"
              value={form.category}
              onChange={(category) => patch("category", category)}
              options={[
                { value: "qna", label: CATEGORY_LABELS.qna },
                { value: "bug", label: CATEGORY_LABELS.bug },
                { value: "talk", label: CATEGORY_LABELS.talk },
              ]}
            />
          </div>

          <div className="grid gap-4">
            <Input
              id="post-tags"
              label="태그"
              content="nextjs, auth, memory-leak"
              hint="쉼표로 구분해 최대 8개까지 입력합니다."
              value={form.tagsText}
              onChange={(event) => patch("tagsText", event.target.value)}
            />

            <Field label="직무/영역" hint="기록을 찾을 때 사용할 메타 정보입니다.">
              <MajorMultiSelect value={form.majors} onChange={(next) => patch("majors", next)} maxSelect={3} valueMode="label" />
            </Field>
          </div>
        </div>
      </section>

      {form.category === "qna" ? (
        <section className="space-y-4 rounded-4xl border border-(--border) bg-(--surface) p-6 shadow-(--shadow) backdrop-blur-[18px]">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Field
              label="해결 기록 메타"
              description="문제가 발생한 환경과 이미 시도한 방법을 함께 남깁니다."
            >
              {null}
            </Field>
            <ChipGroup
              value={form.questionSolved ? "solved" : "waiting"}
              onChange={(next) => patch("questionSolved", next === "solved")}
              options={[
                { value: "waiting", label: "해결 대기" },
                { value: "solved", label: "해결됨" },
              ]}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Input
              id="qna-env"
              label="문제 환경"
              content="Next.js 16 / Chrome 135 / Node 22"
              value={form.questionEnvironment}
              onChange={(event) => patch("questionEnvironment", event.target.value)}
            />
            <Input
              id="qna-tried"
              label="시도한 방법"
              content="캐시 무효화, 로그 확인, 재현 테스트"
              value={form.questionTried}
              onChange={(event) => patch("questionTried", event.target.value)}
            />
          </div>
        </section>
      ) : null}

      {form.category === "bug" ? (
        <section className="space-y-5 rounded-4xl border border-(--border) bg-(--surface) p-6 shadow-(--shadow) backdrop-blur-[18px]">
          <Field
            label="도움 필요"
            description="상태, 우선순위, 환경, 재현 절차를 이슈처럼 관리합니다."
          >
            {null}
          </Field>

          <div className="grid gap-4 lg:grid-cols-[1fr_1fr_1fr]">
            <ChipGroup
              label="상태"
              value={form.bugStatus}
              onChange={(status) => patch("bugStatus", status)}
              options={BUG_STATUS_FORM_OPTIONS.map((status) => ({
                value: status,
                label: BUG_STATUS_LABELS[status],
              }))}
            />

            <ChipGroup
              label="우선순위"
              value={form.bugPriority}
              onChange={(priority) => patch("bugPriority", priority)}
              options={BUG_PRIORITIES.map((priority) => ({
                value: priority,
                label: priority,
              }))}
            />

            <Input
              id="bug-assignee"
              label="담당자"
              content="ex) @frontend-owner 또는 @platform"
              value={form.bugAssignee}
              onChange={(event) => patch("bugAssignee", event.target.value)}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Input
              id="bug-env"
              label="환경"
              content="ex) 브라우저, OS, 패키지 버전"
              value={form.bugEnvironment}
              onChange={(event) => patch("bugEnvironment", event.target.value)}
            />
            <Input
              id="bug-labels"
              label="라벨"
              content="ex) editor, performance, auth"
              value={form.bugLabelsText}
              onChange={(event) => patch("bugLabelsText", event.target.value)}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Textarea
              id="bug-expected"
              label="기대 결과"
              content="정상 동작 시 기대하는 결과를 작성해주세요"
              className="min-h-[148px]"
              value={form.bugExpected}
              onChange={(event) => patch("bugExpected", event.target.value)}
            />
            <Textarea
              id="bug-actual"
              label="실제 결과"
              content="현재 관찰되는 실제 결과를 작성해주세요"
              className="min-h-[148px]"
              value={form.bugActual}
              onChange={(event) => patch("bugActual", event.target.value)}
            />
          </div>

          <Textarea
            id="bug-steps"
            label="재현 절차"
            content={`1. 페이지 접속\n2. 버튼 클릭\n3. 에러 발생`}
            className="min-h-[148px]"
            value={form.bugSteps}
            onChange={(event) => patch("bugSteps", event.target.value)}
          />
        </section>
      ) : null}

      <section className="space-y-4 rounded-4xl border border-(--border) bg-(--surface) p-6 shadow-(--shadow) backdrop-blur-[18px]">
        <Field
          label="본문"
        >
          {null}
        </Field>
        <MarkdownEditor value={form.content} onChange={(next) => patch("content", next)} />
      </section>

      <section className="flex flex-col gap-4 rounded-4xl border border-(--border) bg-(--surface) p-6 shadow-(--shadow) backdrop-blur-[18px] md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <p className="text-sm font-medium">{mode === "create" ? "새 기록 게시" : "기록 업데이트"}</p>
          <p className="text-sm text-(--muted-strong)">
            {mode === "create"
              ? "저장하면 피드와 상세 화면에 바로 반영됩니다."
              : "기존 메타 정보와 본문을 최신 해결 기록으로 갱신합니다."}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button type="button" onClick={() => router.back()}>
            취소
          </Button>
          <Button type="button" variant="primary" onClick={submit} disabled={!canSubmit || submitting}>
            {submitting ? "저장 중..." : mode === "create" ? "기록 게시" : "수정 저장"}
          </Button>
        </div>
      </section>
    </div>
  );
}
