import type { Metadata } from "next";
import { LegalPage } from "@/components/site/LegalPage";

export const metadata: Metadata = { title: "Termos de uso" };

export default function Page() {
  return <LegalPage settingKey="terms_of_use" title="Termos de uso" />;
}
