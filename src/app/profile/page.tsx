import { FeaturePage } from "@/components/devtalk/feature-page";

export default function ProfilePage() {
  return (
    <FeaturePage
      title="프로필"
      description="내 작성 기록과 활동 정보를 모아보는 공간입니다."
      items={["내 게시글", "내 댓글", "저장한 글"]}
    />
  );
}
