import { prisma } from "@/lib/prisma";
import AiSettingsForm from "@/components/AiSettingsForm";

export default async function SettingsPage() {
  const profile = await prisma.aiProfile.findFirst({
    where: { isDefault: true },
  });

  const maskedKey = profile?.apiKey
    ? `${profile.apiKey.slice(0, 5)}…${profile.apiKey.slice(-4)}`
    : null;

  return (
    <div className="h-full overflow-y-auto p-8">
      <h1 className="mb-6 text-lg font-semibold text-zinc-100">AI 设置</h1>
      <AiSettingsForm
        initial={{
          baseUrl: profile?.baseUrl ?? "https://api.deepseek.com",
          model: profile?.model ?? "deepseek-chat",
          hasApiKey: Boolean(profile?.apiKey),
          maskedKey,
        }}
      />
    </div>
  );
}
