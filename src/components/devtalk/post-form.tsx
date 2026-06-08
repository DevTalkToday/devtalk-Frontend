"use client";

import { startTransition, useState } from "react";
import { useRouter } from "next/navigation";
import MajorMultiSelect from "@/components/MajorMultiSelect";
import MarkdownEditor from "@/components/editor/MarkdownEditor";
import { Button, ChipGroup, Field, Input, Textarea } from "@/components/ui";
import { FetchPostAuth, FetchPutAuth } from "@/lib/api/fetch";
import { isKnownMajorValue, normalizeMajorValues } from "@/lib/majors/normalize";
import { BUG_STATUS_LABELS, CATEGORY_LABELS, type BugStatus, type PostCategory, type PostDetail } from "@/lib/posts/types";
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
  customMajorsText: string;
  content: string;
  questionExpected: string;
  questionActual: string;
  questionSteps: string;
  bugStatus: BugStatus;
  bugExpected: string;
  bugActual: string;
  bugSteps: string;
};

const BUG_STATUS_FORM_OPTIONS: BugStatus[] = ["open", "fixed", "closed"];
const MAX_MAJOR_COUNT = 3;
const CUSTOM_MAJOR_BUTTON_LABEL = "기타 입력";
const CUSTOM_MAJOR_PLACEHOLDER = "직접 입력";
const CUSTOM_MAJOR_HINT = "쉼표로 구분해 입력할 수 있으며, 선택 항목을 포함해 최대 3개까지 저장됩니다.";
const CUSTOM_MAJOR_MAX_LENGTH = 80;

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

const splitInitialMajors = (values: string[]) => {
  const normalized = normalizeMajorValues(values, MAX_MAJOR_COUNT);

  return {
    selectedMajors: normalized.filter(isKnownMajorValue),
    customMajorsText: toCsv(normalized.filter((value) => !isKnownMajorValue(value))),
  };
};

const createInitialState = (post?: PostDetail): FormState => {
  const initialMajors = splitInitialMajors(post?.majors ?? []);

  return {
    title: post?.title ?? "",
    category: post?.category ?? "bug",
    tagsText: toCsv(post?.tags ?? []),
    majors: initialMajors.selectedMajors,
    customMajorsText: initialMajors.customMajorsText,
    content: post?.content ?? "",
    questionExpected: post?.question?.expected ?? "",
    questionActual: post?.question?.actual ?? "",
    questionSteps: (post?.question?.reproductionSteps ?? []).join("\n"),
    bugStatus: post?.bug?.status ?? "open",
    bugExpected: post?.bug?.expected ?? "",
    bugActual: post?.bug?.actual ?? "",
    bugSteps: (post?.bug?.reproductionSteps ?? []).join("\n"),
  };
};

export function PostForm({ mode, postId, initialPost }: Props) {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(() => createInitialState(initialPost));
  const [showCustomMajorInput, setShowCustomMajorInput] = useState(
    () => splitInitialMajors(initialPost?.majors ?? []).customMajorsText.length > 0,
  );
  const [submitting, setSubmitting] = useState(false);

  const customMajors = fromCsv(form.customMajorsText);
  const selectedMajors = normalizeMajorValues([...form.majors, ...customMajors], MAX_MAJOR_COUNT);
  const customMajorSelected = showCustomMajorInput || customMajors.length > 0;
  const customMajorDisabled = !customMajorSelected && selectedMajors.length >= MAX_MAJOR_COUNT;
  const canSubmit = form.title.trim().length > 0 && form.content.trim().length > 0;

  const patch = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const toggleCustomMajorInput = () => {
    if (customMajors.length > 0) {
      setShowCustomMajorInput(true);
      return;
    }

    if (customMajorDisabled) return;
    setShowCustomMajorInput((current) => !current);
  };

  const submit = async () => {
    if (submitting) return;
    if (!canSubmit) {
      showErrorToast("필수 정보를 입력해 주세요.");
      return;
    }

    setSubmitting(true);

    try {
      const payload = {
        title: form.title,
        content: form.content,
        category: form.category,
        tags: fromCsv(form.tagsText),
        majors: selectedMajors,
        question:
          form.category === "qna"
            ? {
                expected: form.questionExpected,
                actual: form.questionActual,
                reproductionSteps: fromLines(form.questionSteps),
                acceptedCommentId: initialPost?.question?.acceptedCommentId ?? null,
              }
            : undefined,
        bug:
          form.category === "bug"
            ? {
                status: form.bugStatus,
                expected: form.bugExpected,
                actual: form.bugActual,
                reproductionSteps: fromLines(form.bugSteps),
                watchers: initialPost?.bug?.watchers ?? 0,
                acceptedCommentId: initialPost?.bug?.acceptedCommentId ?? null,
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
              label="제목*"
              content="제목에 핵심 내용을 담아 작성해 주세요"
              value={form.title}
              onChange={(event) => patch("title", event.target.value)}
            />

            <ChipGroup
              label="기록 유형*"
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
              content="nextjs, auth, cache"
              hint="쉼표로 구분해 최대 8개까지 입력할 수 있습니다."
              value={form.tagsText}
              onChange={(event) => patch("tagsText", event.target.value)}
            />

            <Field label="직무/영역">
              <MajorMultiSelect
                value={selectedMajors}
                onChange={(next) => patch("majors", next.filter(isKnownMajorValue))}
                maxSelect={MAX_MAJOR_COUNT}
                valueMode="label"
                afterOptions={(
                  <button
                    type="button"
                    aria-pressed={customMajorSelected}
                    aria-disabled={customMajorDisabled}
                    disabled={customMajorDisabled}
                    onClick={toggleCustomMajorInput}
                    className={[
                      "inline-flex items-center justify-center gap-2 rounded-full border px-4 py-3 text-[0.88rem] font-medium transition duration-150",
                      customMajorSelected
                        ? "border-(--accent) bg-(--surface-soft) text-(--foreground)"
                        : customMajorDisabled
                          ? "cursor-not-allowed border-(--border) bg-(--surface-raised) text-(--muted) opacity-60"
                          : "border-(--border) bg-(--surface-raised) text-(--muted-strong) hover:-translate-y-px hover:border-(--accent) hover:bg-(--surface-soft) hover:text-(--foreground)",
                    ].join(" ")}
                  >
                    {CUSTOM_MAJOR_BUTTON_LABEL}
                  </button>
                )}
              />
              {customMajorSelected ? (
                <div className="mt-3">
                  <Input
                    content={CUSTOM_MAJOR_PLACEHOLDER}
                    hint={CUSTOM_MAJOR_HINT}
                    value={form.customMajorsText}
                    maxLength={CUSTOM_MAJOR_MAX_LENGTH}
                    onChange={(event) => patch("customMajorsText", event.target.value)}
                  />
                </div>
              ) : null}
            </Field>
          </div>
        </div>
      </section>

      {form.category === "qna" ? (
        <section className="space-y-5 rounded-4xl border border-(--border) bg-(--surface) p-6 shadow-(--shadow) backdrop-blur-[18px]">
          <Field
            label="해결 기록 정보"
            description="해결 기록은 항상 해결됨 상태로 저장됩니다."
          >
            {null}
          </Field>

          <div className="grid gap-4 md:grid-cols-2">
            <Textarea
              id="qna-expected"
              label="기대 결과"
              content="정상 동작 시 기대하는 결과를 작성해 주세요"
              className="min-h-[148px]"
              value={form.questionExpected}
              onChange={(event) => patch("questionExpected", event.target.value)}
            />
            <Textarea
              id="qna-actual"
              label="실제 결과"
              content="실제로 확인된 결과를 작성해 주세요"
              className="min-h-[148px]"
              value={form.questionActual}
              onChange={(event) => patch("questionActual", event.target.value)}
            />
          </div>

          <Textarea
            id="qna-steps"
            label="재현 절차"
            content={`1. 페이지 접속\n2. 버튼 클릭\n3. 결과 확인`}
            className="min-h-[148px]"
            value={form.questionSteps}
            onChange={(event) => patch("questionSteps", event.target.value)}
          />
        </section>
      ) : null}

      {form.category === "bug" ? (
        <section className="space-y-5 rounded-4xl border border-(--border) bg-(--surface) p-6 shadow-(--shadow) backdrop-blur-[18px]">
          <ChipGroup
            label="상태*"
            value={form.bugStatus}
            onChange={(status) => patch("bugStatus", status)}
            options={BUG_STATUS_FORM_OPTIONS.map((status) => ({
              value: status,
              label: BUG_STATUS_LABELS[status],
            }))}
          />

          <div className="grid gap-4 md:grid-cols-2">
            <Textarea
              id="bug-expected"
              label="기대 결과"
              content="정상 동작 시 기대하는 결과를 작성해 주세요"
              className="min-h-[148px]"
              value={form.bugExpected}
              onChange={(event) => patch("bugExpected", event.target.value)}
            />
            <Textarea
              id="bug-actual"
              label="실제 결과"
              content="실제로 확인된 결과를 작성해 주세요"
              className="min-h-[148px]"
              value={form.bugActual}
              onChange={(event) => patch("bugActual", event.target.value)}
            />
          </div>

          <Textarea
            id="bug-steps"
            label="재현 절차"
            content={`1. 페이지 접속\n2. 버튼 클릭\n3. 결과 확인`}
            className="min-h-[148px]"
            value={form.bugSteps}
            onChange={(event) => patch("bugSteps", event.target.value)}
          />
        </section>
      ) : null}

      <section className="space-y-4 rounded-4xl border border-(--border) bg-(--surface) p-6 shadow-(--shadow) backdrop-blur-[18px]">
        <Field label="본문*">{null}</Field>
        <MarkdownEditor value={form.content} onChange={(next) => patch("content", next)} />
      </section>

      <section className="flex flex-col gap-4 rounded-4xl border border-(--border) bg-(--surface) p-6 shadow-(--shadow) backdrop-blur-[18px] md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <p className="text-sm font-medium">{mode === "create" ? "새 기록 게시" : "기록 업데이트"}</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button type="button" onClick={() => router.back()}>
            취소
          </Button>
          <Button type="button" variant="primary" onClick={submit} disabled={!canSubmit || submitting}>
            {submitting ? "저장 중.." : mode === "create" ? "기록 게시" : "수정 저장"}
          </Button>
        </div>
      </section>
    </div>
  );
}
