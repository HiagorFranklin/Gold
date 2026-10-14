import type { Metadata } from "next";
import { LegalPage } from "@/components/site/LegalPage";

export const metadata: Metadata = { title: "Política de privacidade" };

export default function Page() {
  return <LegalPage settingKey="privacy_policy" title="Política de privacidade" />;
}
