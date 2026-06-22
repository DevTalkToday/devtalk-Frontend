"use client";

import { KeyboardEvent, startTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { TrashIcon } from "@/components/devtalk/icons";
import MajorMultiSelect from "@/components/MajorMultiSelect";
import MarkdownEditor from "@/components/editor/MarkdownEditor";
import { Button, ChipGroup, Field, Input, InputAction, Textarea } from "@/components/ui";
import { FetchPostAuth, FetchPutAuth } from "@/lib/api/fetch";
import { isKnownMajorValue, normalizeMajorValues } from "@/lib/majors/normalize";
import { startNavigationProgress } from "@/lib/navigation/progress";
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
  tags: string[];
  tagInput: string;
  majors: string[];
  customMajors: string[];
  customMajorInput: string;
  content: string;
  questionExpected: string;
  questionActual: string;
  questionSteps: string;
  bugStatus: BugStatus;
  bugExpected: string;
  bugActual: string;
  bugSteps: string;
};

const BUG_STATUS_FORM_OPTIONS: BugStatus[] = ["open", "investigating", "closed"];
const MAX_MAJOR_COUNT = 3;
const MAX_TAG_COUNT = 8;
const MAX_POST_TITLE_LENGTH = 100;
const MAX_POST_CONTENT_LENGTH = 2000;
const CUSTOM_MAJOR_BUTTON_LABEL = "기타 입력";
const CUSTOM_MAJOR_PLACEHOLDER = "직접 입력";
const CUSTOM_MAJOR_HINT = "기타 직무/영역은 하나씩 추가되며, 선택 항목을 포함해 최대 3개까지 저장됩니다.";
const CUSTOM_MAJOR_MAX_LENGTH = 80;
const TAG_PLACEHOLDER = "예: nextjs";
const TAG_HINT = "태그는 하나씩 추가되며 최대 8개까지 저장됩니다.";

const normalizeToken = (value: string) => value.trim().replace(/^#/, "");

const dedupeTokens = (values: string[]) => {
  const seen = new Set<string>();

  return values.filter((value) => {
    const normalized = normalizeToken(value).toLowerCase();
    if (!normalized || seen.has(normalized)) return false;
    seen.add(normalized);
    return true;
  });
};

const fromLines = (value: string) =>
  value
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean);

const splitInitialMajors = (values: string[]) => {
  const normalized = normalizeMajorValues(values, MAX_MAJOR_COUNT);

  return {
    selectedMajors: normalized.filter(isKnownMajorValue),
    customMajors: normalized.filter((value) => !isKnownMajorValue(value)),
  };
};

const createInitialState = (post?: PostDetail): FormState => {
  const initialMajors = splitInitialMajors(post?.majors ?? []);

  return {
    title: post?.title ?? "",
    category: post?.category ?? "bug",
    tags: dedupeTokens(post?.tags ?? []).slice(0, MAX_TAG_COUNT),
    tagInput: "",
    majors: initialMajors.selectedMajors,
    customMajors: initialMajors.customMajors,
    customMajorInput: "",
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

const copyBugFieldsToQuestion = (form: FormState): FormState => ({
  ...form,
  questionExpected: form.bugExpected,
  questionActual: form.bugActual,
  questionSteps: form.bugSteps,
});

const copyQuestionFieldsToBug = (form: FormState): FormState => ({
  ...form,
  bugExpected: form.questionExpected,
  bugActual: form.questionActual,
  bugSteps: form.questionSteps,
});

function TokenList({
  values,
  prefix,
  onRemove,
}: {
  values: string[];
  prefix?: string;
  onRemove: (value: string) => void;
}) {
  if (values.length === 0) return null;

  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {values.map((value) => (
        <span
          key={value}
          className="inline-flex items-center gap-2 rounded-full border border-(--border) bg-(--surface-soft) px-3 py-1.5 text-xs font-semibold text-(--muted-strong)"
        >
          <span>
            {prefix}
            {value}
          </span>
          <button
            type="button"
            aria-label={`${value} 제거`}
            onClick={() => onRemove(value)}
            className="grid size-5 place-items-center rounded-full text-(--muted-strong) transition hover:bg-(--surface-raised) hover:text-(--danger)"
          >
            <TrashIcon className="size-3" />
          </button>
        </span>
      ))}
    </div>
  );
}

export function PostForm({ mode, postId, initialPost }: Props) {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(() => createInitialState(initialPost));
  const [showCustomMajorInput, setShowCustomMajorInput] = useState(
    () => splitInitialMajors(initialPost?.majors ?? []).customMajors.length > 0,
  );
  const [submitting, setSubmitting] = useState(false);

  const selectedMajors = normalizeMajorValues([...form.majors, ...form.customMajors], MAX_MAJOR_COUNT);
  const customMajorSelected = showCustomMajorInput || form.customMajors.length > 0;
  const customMajorDisabled = !customMajorSelected && selectedMajors.length >= MAX_MAJOR_COUNT;
  const canSubmit = form.title.trim().length > 0 && form.content.trim().length > 0;

  const patch = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const onEnter =
    (action: () => void) =>
    (event: KeyboardEvent<HTMLInputElement>) => {
      if (event.key !== "Enter") return;
      event.preventDefault();
      action();
    };

  const changeCategory = (category: PostCategory) => {
    setForm((current) => {
      if (current.category === category) return current;

      if (current.category === "bug" && category === "qna") {
        return {
          ...copyBugFieldsToQuestion(current),
          category,
        };
      }

      if (current.category === "qna" && category === "bug") {
        return {
          ...copyQuestionFieldsToBug(current),
          category,
          bugStatus: current.bugStatus === "closed" || current.bugStatus === "fixed" ? "open" : current.bugStatus,
        };
      }

      return {
        ...current,
        category,
      };
    });
  };

  const changeBugStatus = (status: BugStatus) => {
    setForm((current) => {
      if (status !== "closed") {
        return {
          ...current,
          bugStatus: status,
        };
      }

      return {
        ...copyBugFieldsToQuestion(current),
        category: "qna",
        bugStatus: status,
      };
    });
  };

  const toggleCustomMajorInput = () => {
    if (form.customMajors.length > 0) {
      setShowCustomMajorInput(true);
      return;
    }

    if (customMajorDisabled) return;
    setShowCustomMajorInput((current) => !current);
  };

  const addTag = () => {
    const nextTag = normalizeToken(form.tagInput);
    if (!nextTag) return;

    if (form.tags.length >= MAX_TAG_COUNT) {
      showErrorToast("태그는 최대 8개까지 추가할 수 있습니다.");
      return;
    }

    setForm((current) => ({
      ...current,
      tags: dedupeTokens([...current.tags, nextTag]).slice(0, MAX_TAG_COUNT),
      tagInput: "",
    }));
  };

  const removeTag = (tag: string) => {
    setForm((current) => ({
      ...current,
      tags: current.tags.filter((item) => item !== tag),
    }));
  };

  const addCustomMajor = () => {
    const nextMajor = normalizeToken(form.customMajorInput).slice(0, CUSTOM_MAJOR_MAX_LENGTH);
    if (!nextMajor) return;

    if (selectedMajors.length >= MAX_MAJOR_COUNT) {
      showErrorToast("직무/영역은 최대 3개까지 선택할 수 있습니다.");
      return;
    }

    setForm((current) => ({
      ...current,
      customMajors: dedupeTokens([...current.customMajors, nextMajor]).slice(0, MAX_MAJOR_COUNT),
      customMajorInput: "",
    }));
    setShowCustomMajorInput(true);
  };

  const removeCustomMajor = (major: string) => {
    setForm((current) => ({
      ...current,
      customMajors: current.customMajors.filter((item) => item !== major),
    }));
  };

  const submit = async () => {
    if (submitting) return;
    if (!canSubmit) {
      showErrorToast("필수 정보를 입력해 주세요.");
      return;
    }

    setSubmitting(true);

    try {
      const acceptedCommentId =
        form.category === "qna"
          ? initialPost?.question?.acceptedCommentId ?? initialPost?.bug?.acceptedCommentId ?? null
          : initialPost?.bug?.acceptedCommentId ?? initialPost?.question?.acceptedCommentId ?? null;

      const resolvedQuestionPayload = {
        expected: form.questionExpected,
        actual: form.questionActual,
        reproductionSteps: fromLines(form.questionSteps),
        acceptedCommentId,
        solved: true,
        environment: form.questionExpected,
        tried: form.questionActual,
      };

      const resolvedBugPayload = {
        status: "closed" as const,
        expected: form.questionExpected,
        actual: form.questionActual,
        reproductionSteps: fromLines(form.questionSteps),
        watchers: initialPost?.bug?.watchers ?? 0,
        acceptedCommentId,
        priority: initialPost?.bug?.priority ?? "P2",
        assignee: initialPost?.bug?.assignee ?? "",
        environment: initialPost?.bug?.environment ?? "",
        labels: initialPost?.bug?.labels ?? [],
      };

      const activeBugPayload = {
        status: form.bugStatus,
        expected: form.bugExpected,
        actual: form.bugActual,
        reproductionSteps: fromLines(form.bugSteps),
        watchers: initialPost?.bug?.watchers ?? 0,
        acceptedCommentId,
        priority: initialPost?.bug?.priority ?? "P2",
        assignee: initialPost?.bug?.assignee ?? "",
        environment: initialPost?.bug?.environment ?? "",
        labels: initialPost?.bug?.labels ?? [],
      };

      const payload = {
        title: form.title.trim().slice(0, MAX_POST_TITLE_LENGTH),
        content: form.content.trim().slice(0, MAX_POST_CONTENT_LENGTH),
        category: form.category === "qna" ? "bug" : form.category,
        tags: form.tags,
        majors: selectedMajors,
        question: form.category === "qna" ? resolvedQuestionPayload : undefined,
        bug: form.category === "qna" ? resolvedBugPayload : form.category === "bug" ? activeBugPayload : undefined,
      };

      const response =
        mode === "create"
          ? await FetchPostAuth("/posts", payload)
          : await FetchPutAuth(`/posts/${postId}`, payload);

      const id = (response as PostDetail).id;
      startNavigationProgress();
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
              maxLength={MAX_POST_TITLE_LENGTH}
              onChange={(event) => patch("title", event.target.value)}
              hint={`${form.title.length}/${MAX_POST_TITLE_LENGTH}`}
            />

            <ChipGroup
              label="기록 유형*"
              value={form.category}
              onChange={changeCategory}
              options={[
                { value: "qna", label: CATEGORY_LABELS.qna },
                { value: "bug", label: CATEGORY_LABELS.bug },
                { value: "discussion", label: CATEGORY_LABELS.discussion },
                { value: "info", label: CATEGORY_LABELS.info },
                { value: "talk", label: CATEGORY_LABELS.talk },
              ]}
            />
          </div>

          <div className="grid gap-4">
            <Field label="태그" hint={TAG_HINT}>
              <InputAction
                id="post-tags"
                content={TAG_PLACEHOLDER}
                value={form.tagInput}
                actionLabel="추가"
                actionDisabled={!normalizeToken(form.tagInput) || form.tags.length >= MAX_TAG_COUNT}
                onChange={(event) => patch("tagInput", event.target.value)}
                onKeyDown={onEnter(addTag)}
                onAction={addTag}
              />
              <TokenList values={form.tags} prefix="#" onRemove={removeTag} />
            </Field>

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
                  <InputAction
                    content={CUSTOM_MAJOR_PLACEHOLDER}
                    hint={CUSTOM_MAJOR_HINT}
                    value={form.customMajorInput}
                    maxLength={CUSTOM_MAJOR_MAX_LENGTH}
                    actionLabel="추가"
                    actionDisabled={!normalizeToken(form.customMajorInput) || selectedMajors.length >= MAX_MAJOR_COUNT}
                    onChange={(event) => patch("customMajorInput", event.target.value)}
                    onKeyDown={onEnter(addCustomMajor)}
                    onAction={addCustomMajor}
                  />
                  <TokenList values={form.customMajors} onRemove={removeCustomMajor} />
                </div>
              ) : null}
            </Field>
          </div>
        </div>
      </section>

      {form.category === "qna" ? (
        <section className="space-y-5 rounded-4xl border border-(--border) bg-(--surface) p-6 shadow-(--shadow) backdrop-blur-[18px]">
          <Field label="해결 기록 정보" description="해결 기록은 항상 해결됨 상태로 저장됩니다.">
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
            onChange={changeBugStatus}
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
        <MarkdownEditor value={form.content} onChange={(next) => patch("content", next)} maxLength={MAX_POST_CONTENT_LENGTH} />
      </section>

      <section className="flex flex-col gap-4 rounded-4xl border border-(--border) bg-(--surface) p-6 shadow-(--shadow) backdrop-blur-[18px] md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <p className="text-sm font-medium">{mode === "create" ? "새 기록 게시" : "기록 업데이트"}</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button
            type="button"
            onClick={() => {
              startNavigationProgress();
              router.back();
            }}
          >
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
