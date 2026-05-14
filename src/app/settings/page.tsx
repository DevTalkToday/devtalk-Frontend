import { FeaturePage } from "@/components/devtalk/feature-page";

export default function SettingsPage() {
  return (
    <FeaturePage
      title="설정"
      description="계정, 알림, 표시 방식을 조정하는 공간입니다."
      items={["계정 설정", "알림 설정", "화면 표시"]}
    />
  );
}
