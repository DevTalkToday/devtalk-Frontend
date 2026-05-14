import type { PostDetail } from "@/lib/posts/types";

const now = Date.now();

const author = (id: string, nickname: string, role: string) => ({
  id,
  nickname,
  role,
  avatarUrl: null,
});

export const posts: PostDetail[] = [
  {
    id: "101",
    title: "Next.js 배포 후 라우트 캐시가 갱신되지 않은 기록",
    excerpt: "App Router에서 수정된 상세 페이지가 계속 이전 데이터로 보였고, 캐시 무효화 범위를 좁혀 해결했습니다.",
    content: `## 발생 상황

운영 배포 이후 게시글 상세에서 수정한 내용이 즉시 반영되지 않았습니다. 목록은 최신 상태였지만 상세 라우트만 이전 HTML을 계속 보여주었습니다.

## 원인 추적

- 서버 액션 이후 \`revalidatePath\`가 목록 경로에만 적용됨
- 상세 경로는 \`fetch\` 캐시와 라우트 캐시가 함께 남아 있었음
- React Query 무효화만으로는 서버 캐시가 갱신되지 않음

## 해결

\`revalidatePath("/")\`와 함께 \`revalidatePath(\`/\${id}\`)\`를 호출하고, 클라이언트에서는 상세 쿼리만 invalidate하도록 정리했습니다.

## 남긴 교훈

App Router에서는 클라이언트 캐시와 서버 캐시를 분리해서 기록해야 합니다. 재현 환경, 시도한 방법, 실제 수정 포인트를 같이 적어두면 같은 증상을 빠르게 판별할 수 있습니다.`,
    category: "qna",
    author: author("u1", "민재", "Frontend Engineer"),
    createdAt: new Date(now - 1000 * 60 * 42).toISOString(),
    updatedAt: new Date(now - 1000 * 60 * 18).toISOString(),
    commentCount: 2,
    likeCount: 18,
    bookmarkCount: 12,
    viewCount: 246,
    tags: ["nextjs", "app-router", "cache"],
    majors: ["프론트엔드"],
    question: {
      solved: true,
      environment: "Next.js 16 / React 19 / TanStack Query v5",
      tried: "router.refresh, invalidateQueries, revalidatePath 목록 경로",
      acceptedCommentId: "c-101-2",
    },
    comments: [
      {
        id: "c-101-1",
        author: author("u2", "서연", "Platform Engineer"),
        body: "목록과 상세의 캐시 키를 나눠서 기록하면 원인 범위가 훨씬 빨리 좁혀집니다.",
        createdAt: new Date(now - 1000 * 60 * 30).toISOString(),
        likeCount: 8,
      },
      {
        id: "c-101-2",
        author: author("u3", "준호", "Full Stack"),
        body: "서버 캐시를 갱신하지 않으면 클라이언트 invalidate만으로는 해결되지 않습니다. 상세 경로 revalidate가 핵심입니다.",
        createdAt: new Date(now - 1000 * 60 * 12).toISOString(),
        likeCount: 15,
        isAccepted: true,
      },
    ],
  },
  {
    id: "102",
    title: "Markdown 이미지 미리보기에서 메모리가 계속 증가한 에러",
    excerpt: "드래그 앤 드롭으로 만든 blob URL을 해제하지 않아 브라우저 메모리가 누적된 사례입니다.",
    content: `## 재현 환경

- Chrome 135
- Windows 11
- Next.js 16 client component
- Markdown 에디터 이미지 미리보기

## 기대 결과

이미지를 삭제하거나 페이지를 벗어나면 미리보기용 blob URL이 정리되어야 합니다.

## 실제 결과

이미지를 여러 번 붙여넣고 삭제하면 메모리 사용량이 계속 증가했습니다.

## 해결 기록

\`URL.createObjectURL\`로 만든 주소를 배열에 저장하고, 이미지 삭제 시점과 컴포넌트 unmount 시점에 \`URL.revokeObjectURL\`을 호출했습니다.`,
    category: "bug",
    author: author("u4", "하린", "QA Lead"),
    createdAt: new Date(now - 1000 * 60 * 180).toISOString(),
    updatedAt: new Date(now - 1000 * 60 * 55).toISOString(),
    commentCount: 3,
    likeCount: 11,
    bookmarkCount: 7,
    viewCount: 198,
    tags: ["markdown", "blob", "memory-leak"],
    majors: ["프론트엔드", "QA"],
    bug: {
      status: "investigating",
      priority: "P1",
      assignee: "@editor-owner",
      environment: "Chrome 135 / Windows 11 / React 19",
      expected: "사용하지 않는 blob URL은 즉시 revoke된다.",
      actual: "이미지 추가 횟수만큼 메모리 사용량이 누적된다.",
      reproductionSteps: [
        "에디터 페이지를 연다",
        "PNG 이미지를 10개 이상 드래그한다",
        "이미지를 삭제하고 다시 추가한다",
        "Task Manager에서 메모리 사용량을 확인한다",
      ],
      labels: ["editor", "preview", "performance"],
      watchers: 14,
      acceptedCommentId: "c-102-2",
    },
    comments: [
      {
        id: "c-102-1",
        author: author("u5", "유진", "Frontend Engineer"),
        body: "drop/paste 이벤트에서 만든 object URL을 추적하고 unmount 때 한 번 더 정리하는 방식이 좋습니다.",
        createdAt: new Date(now - 1000 * 60 * 130).toISOString(),
        likeCount: 9,
      },
      {
        id: "c-102-2",
        author: author("u6", "다온", "Infra"),
        body: "파일 업로드 자체보다 preview URL 생명주기 관리가 원인일 가능성이 높습니다.",
        createdAt: new Date(now - 1000 * 60 * 70).toISOString(),
        likeCount: 6,
        isAccepted: true,
      },
      {
        id: "c-102-3",
        author: author("u4", "하린", "QA Lead"),
        body: "재현 영상과 heap snapshot을 추가했습니다. 브라우저별 차이도 확인 중입니다.",
        createdAt: new Date(now - 1000 * 60 * 48).toISOString(),
        likeCount: 4,
      },
    ],
  },
  {
    id: "103",
    title: "같은 인증 에러가 반복되지 않도록 남긴 팀 회고",
    excerpt: "토큰 만료 처리 누락으로 발생한 장애를 기록 템플릿과 체크리스트로 재발 방지한 사례입니다.",
    content: `## 배경

로그인 세션 만료 시 API가 401을 반환했지만, 화면은 빈 상태로 남았습니다. 같은 문제가 다른 페이지에서도 반복될 가능성이 있었습니다.

## 회고

1. 에러 메시지가 사용자의 다음 행동을 안내하지 못했습니다.
2. refresh token 실패 로그가 검색하기 어려운 형태로 남았습니다.
3. 해결 후에도 재발 방지 체크리스트가 없었습니다.

## 개선

- 인증 에러 기록 템플릿 추가
- 재현 절차, 로그 키워드, 최종 수정 PR을 필수 항목으로 정리
- 로그인 만료 케이스를 공통 테스트에 포함`,
    category: "talk",
    author: author("u7", "인아", "Product Designer"),
    createdAt: new Date(now - 1000 * 60 * 420).toISOString(),
    updatedAt: new Date(now - 1000 * 60 * 300).toISOString(),
    commentCount: 4,
    likeCount: 29,
    bookmarkCount: 20,
    viewCount: 431,
    tags: ["auth", "retrospective", "incident"],
    majors: ["제품", "프론트엔드"],
    comments: [
      {
        id: "c-103-1",
        author: author("u8", "혜경", "Backend Engineer"),
        body: "로그 키워드와 해결 PR 링크를 같이 남기면 온콜 때 검색 비용이 확 줄어듭니다.",
        createdAt: new Date(now - 1000 * 60 * 380).toISOString(),
        likeCount: 5,
      },
      {
        id: "c-103-2",
        author: author("u9", "지윤", "Engineering Manager"),
        body: "에러 해결 기록은 자유 글보다 템플릿이 있을 때 팀 지식으로 남기 쉽습니다.",
        createdAt: new Date(now - 1000 * 60 * 340).toISOString(),
        likeCount: 11,
      },
      {
        id: "c-103-3",
        author: author("u7", "인아", "Product Designer"),
        body: "사용자 안내 문구까지 해결 기록에 남기면 비슷한 화면을 만들 때 참고하기 좋겠습니다.",
        createdAt: new Date(now - 1000 * 60 * 315).toISOString(),
        likeCount: 7,
      },
      {
        id: "c-103-4",
        author: author("u10", "현우", "Mobile Developer"),
        body: "모바일에서도 같은 만료 플로우를 공통 체크리스트로 가져가겠습니다.",
        createdAt: new Date(now - 1000 * 60 * 304).toISOString(),
        likeCount: 3,
      },
    ],
  },
];
