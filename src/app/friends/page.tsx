"use client";

import { useState } from "react";
import { AppShell } from "@/components/devtalk/app-shell";
import { Button } from "@/components/ui";

type FriendTab = "friends" | "received" | "sent";

type Person = {
  id: string;
  name: string;
  description: string;
  major: string;
  accent: string;
};

const tabs: Array<{ id: FriendTab; label: string }> = [
  { id: "friends", label: "친구 목록" },
  { id: "received", label: "받은 요청" },
  { id: "sent", label: "보낸 요청" },
];

const friendItems: Person[] = [
  {
    id: "minjae",
    name: "김민재",
    description: "Next.js 배포와 캐시 이슈를 자주 정리합니다.",
    major: "프론트엔드",
    accent: "#2563ff",
  },
  {
    id: "seoyeon",
    name: "이서연",
    description: "API 에러 로그와 재현 절차를 꼼꼼하게 공유합니다.",
    major: "백엔드",
    accent: "#14b8a6",
  },
  {
    id: "hyunwoo",
    name: "박현우",
    description: "운영 환경 장애 대응 기록을 모아두고 있습니다.",
    major: "DevOps",
    accent: "#f97316",
  },
];

const receivedItems: Person[] = [
  {
    id: "jiyun",
    name: "최지윤",
    description: "React Query 상태 관리와 폼 검증 경험을 공유합니다.",
    major: "프론트엔드",
    accent: "#7c3aed",
  },
  {
    id: "taeho",
    name: "정태호",
    description: "데이터베이스 성능 문제와 해결 기록을 작성합니다.",
    major: "데이터베이스",
    accent: "#0891b2",
  },
];

const sentItems: Person[] = [
  {
    id: "arin",
    name: "한아린",
    description: "테스트 자동화와 회귀 버그 분석에 관심이 많습니다.",
    major: "QA 엔지니어링",
    accent: "#db2777",
  },
  {
    id: "joon",
    name: "오준",
    description: "인증 흐름과 보안 설정 관련 노트를 정리합니다.",
    major: "보안",
    accent: "#16a34a",
  },
];

const itemsByTab: Record<FriendTab, Person[]> = {
  friends: friendItems,
  received: receivedItems,
  sent: sentItems,
};

const titleByTab: Record<FriendTab, string> = {
  friends: "친구 목록",
  received: "받은 요청",
  sent: "보낸 요청",
};

const summaryByTab: Record<FriendTab, string> = {
  friends: "함께 개발 기록을 공유하는 사람들입니다.",
  received: "나에게 친구 요청을 보낸 사람들입니다.",
  sent: "내가 친구 요청을 보낸 사람들입니다.",
};

function ProfileCard({ person, tab }: { person: Person; tab: FriendTab }) {
  return (
    <article className="grid gap-4 rounded-[24px] border border-(--border) bg-(--surface-raised) p-5 md:grid-cols-[auto_minmax(0,1fr)_auto] md:items-center">
      <div
        className="grid size-14 place-items-center rounded-full text-lg font-bold text-white"
        style={{ backgroundColor: person.accent }}
      >
        {person.name.slice(0, 1)}
      </div>

      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-lg font-semibold">{person.name}</h3>
          <span className="rounded-full border border-(--border) bg-(--surface-soft) px-3 py-1 text-xs font-semibold text-(--muted-strong)">
            {person.major}
          </span>
        </div>
        <p className="mt-1 text-sm leading-6 text-(--muted-strong)">{person.description}</p>
      </div>

      {tab === "received" ? (
        <div className="flex flex-wrap gap-2 md:justify-end">
          <Button type="button" size="sm" variant="primary">
            수락
          </Button>
          <Button type="button" size="sm">
            거절
          </Button>
        </div>
      ) : null}

      {tab === "sent" ? (
        <div className="flex flex-wrap gap-2 md:justify-end">
          <Button type="button" size="sm">
            요청 취소
          </Button>
        </div>
      ) : null}
    </article>
  );
}

export default function FriendsPage() {
  const [activeTab, setActiveTab] = useState<FriendTab>("friends");
  const items = itemsByTab[activeTab];

  return (
    <AppShell showPageHeader={false}>
      <section className="rounded-[28px] border border-(--border) bg-white/88 p-5 shadow-(--shadow) backdrop-blur-[18px] dark:bg-(--surface)">
        <div className="grid gap-6 lg:grid-cols-[190px_minmax(0,1fr)] xl:grid-cols-[220px_minmax(0,1fr)]">
          <aside className="rounded-[24px] border border-(--border) bg-white p-4 shadow-[0_18px_50px_rgba(51,94,180,0.08)] dark:bg-(--surface-raised)">
            <h1 className="px-3 pb-4 text-3xl font-semibold">친구</h1>
            <div className="grid gap-3">
              {tabs.map((tab) => {
                const selected = tab.id === activeTab;

                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={[
                      "h-[3.25rem] rounded-2xl border px-4 text-left text-sm font-semibold transition duration-150",
                      selected
                        ? "border-(--accent) bg-(--accent-soft) text-(--foreground)"
                        : "border-(--border) bg-white text-(--muted-strong) hover:border-(--accent) hover:text-(--foreground) dark:bg-(--surface)",
                    ].join(" ")}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </aside>

          <div className="min-h-[520px] rounded-[24px] border border-(--border) bg-white p-5 shadow-[0_18px_50px_rgba(51,94,180,0.08)] dark:bg-(--surface)">
            <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 className="text-2xl font-semibold">{titleByTab[activeTab]}</h2>
                <p className="mt-1 text-sm text-(--muted-strong)">{summaryByTab[activeTab]}</p>
              </div>
              <span className="rounded-full border border-(--border) bg-(--surface-soft) px-3 py-1 text-xs font-semibold text-(--muted-strong)">
                {items.length}명
              </span>
            </div>

            <div className="grid gap-3">
              {items.map((person) => (
                <ProfileCard key={person.id} person={person} tab={activeTab} />
              ))}
            </div>
          </div>
        </div>
      </section>
    </AppShell>
  );
}
