import { getSiteSettings } from "@/actions/settingsActions";
import SettingsFormClient from "@/components/admin/SettingsFormClient";

export default async function SettingsPage() {
  const settings = await getSiteSettings();

  return (
    <div className="max-w-screen-xl mx-auto px-6 py-12">
      <div className="mb-12">
        <h1 className="text-3xl font-serif font-bold text-gray-900 mb-2">
          사이트 설정
        </h1>
        <p className="text-gray-500">
          링크 공유 시 보여질 이미지와 문구를 관리합니다.
        </p>
      </div>

      <SettingsFormClient settings={settings} />
    </div>
  );
}
