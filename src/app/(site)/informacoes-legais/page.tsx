import type { Metadata } from "next";
import { LegalPage } from "@/components/site/LegalPage";

export const metadata: Metadata = { title: "Informações legais" };

export default function Page() {
  return <LegalPage settingKey="legal_info" title="Informações legais" />;
}
