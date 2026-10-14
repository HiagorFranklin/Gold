/* eslint-disable @next/next/no-img-element */
import { requireActor } from "@/lib/auth";
import { getSettings } from "@/lib/data";
import { whatsappLink } from "@/lib/format";
import { saveSettingsAction } from "@/app/admin/actions";
import { ActionForm } from "@/components/admin/ActionForm";
import { PageTitle } from "@/components/admin/ui";

export const metadata = { title: "Site e WhatsApp" };

const IMAGES = [
  ["hero", "Banner principal (horizontal, mín. 1920×1080)"],
  ["training", "Treino de força"],
  ["recovery", "Recuperação e descanso"],
  ["nutrition", "Nutrição e hábitos"],
  ["science", "Ciência / laboratório"],
  ["about", "Institucional"],
] as const;

function Field({ s, k, label, rows, hint, type }: { s: Record<string, string>; k: string; label: string; rows?: number; hint?: string; type?: string }) {
  return (
    <div className={rows ? "md:col-span-2" : ""}>
      <label htmlFor={k} className="label-gp">{label}</label>
      {rows ? (
        <textarea id={k} name={k} rows={rows} defaultValue={s[k]} className="input-gp" />
      ) : (
        <input id={k} name={k} type={type ?? "text"} defaultValue={s[k]} className="input-gp" />
      )}
      {hint && <p className="mt-1 text-xs text-mist-2">{hint}</p>}
    </div>
  );
}

export default async function SettingsAdmin() {
  await requireActor("settings:edit");
  const s = getSettings();
  const preview = whatsappLink(s.whatsapp_number, s.whatsapp_message);
  return (
    <div className="max-w-5xl">
      <PageTitle title="Site e WhatsApp" intro="Textos, imagens, contato e informações legais. As alterações aparecem no site imediatamente." />
      <ActionForm action={saveSettingsAction} submitLabel="Salvar configurações">
        <section className="card-gp grid gap-4 p-6 md:grid-cols-2">
          <h2 className="font-display text-2xl md:col-span-2">WhatsApp</h2>
          <Field s={s} k="whatsapp_number" label="Número comercial (DDD + número)" hint="Ex.: 11 98765-4321. O código do Brasil (55) é adicionado automaticamente." />
          <div>
            <p className="label-gp">Teste do link</p>
            {preview ? (
              <a href={preview} target="_blank" rel="noopener noreferrer" className="text-sm text-gold break-all hover:underline">{preview.slice(0, 60)}…</a>
            ) : (
              <p className="text-sm text-amber-200">Não configurado: os botões levam à página de contato.</p>
            )}
          </div>
          <Field s={s} k="whatsapp_message" label="Mensagem padrão" rows={3} hint="O cliente revisa e envia manualmente. Em itens liberados, o nome do item é acrescentado." />
        </section>

        <section className="card-gp grid gap-4 p-6 md:grid-cols-2">
          <h2 className="font-display text-2xl md:col-span-2">Banner principal</h2>
          <Field s={s} k="hero_title" label="Título" />
          <Field s={s} k="hero_subtitle" label="Subtítulo" />
        </section>

        <section className="card-gp p-6">
          <h2 className="font-display text-2xl">Conteúdo visual</h2>
          <p className="mt-1 text-sm text-mist">Use apenas imagens próprias, licenciadas ou autorizadas, sem marca-d’água. Sem imagem, o site exibe uma composição gráfica da marca.</p>
          <div className="mt-5 grid gap-5 md:grid-cols-2">
            {IMAGES.map(([k, label]) => {
              const url = s[`${k}_image_url`];
              return (
                <div key={k} className="rounded-xl border border-line p-4">
                  <p className="text-sm font-semibold">{label}</p>
                  <div className="mt-3 flex gap-4">
                    <div className="flex h-20 w-28 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-dashed border-white/15 bg-ink">
                      {url ? <img src={url} alt="" className="h-full w-full object-cover" /> : <span className="text-[10px] text-mist-2">sem imagem</span>}
                    </div>
                    <div className="min-w-0 flex-1 space-y-2">
                      <input name={`${k}_image_file`} type="file" accept="image/jpeg,image/png,image/webp,image/avif" aria-label={`Enviar imagem: ${label}`} className="input-gp !py-1.5 text-xs" />
                      <input name={`${k}_image_url`} defaultValue={url} placeholder="ou URL https" aria-label={`URL da imagem: ${label}`} className="input-gp !py-1.5 text-xs" />
                      {url && (
                        <label className="flex items-center gap-2 text-xs text-mist">
                          <input type="checkbox" name={`${k}_remove`} className="accent-[#D4AF37]" /> Remover
                        </label>
                      )}
                    </div>
                  </div>
                  <input name={`${k}_image_alt`} defaultValue={s[`${k}_image_alt`]} aria-label={`Texto alternativo: ${label}`} placeholder="Texto alternativo" className="input-gp mt-3 !py-1.5 text-xs" />
                </div>
              );
            })}
          </div>
        </section>

        <section className="card-gp grid gap-4 p-6 md:grid-cols-2">
          <h2 className="font-display text-2xl md:col-span-2">Institucional</h2>
          <Field s={s} k="about_title" label="Título da apresentação" />
          <Field s={s} k="mission" label="Missão (rodapé e página Sobre)" />
          <Field s={s} k="about_text" label="Texto institucional (parágrafos separados por linha em branco)" rows={6} />
          <Field s={s} k="values" label="Valores (um por linha)" rows={4} />
        </section>

        <section className="card-gp grid gap-4 p-6 md:grid-cols-2">
          <h2 className="font-display text-2xl md:col-span-2">Contato e dados da empresa</h2>
          <Field s={s} k="contact_email" label="E-mail" type="email" />
          <Field s={s} k="contact_phone" label="Telefone" />
          <Field s={s} k="business_hours" label="Horário de atendimento" />
          <Field s={s} k="company_legal_name" label="Razão social" />
          <Field s={s} k="cnpj" label="CNPJ" />
          <Field s={s} k="technical_responsible" label="Responsável técnico (nome e registro)" />
          <Field s={s} k="address" label="Endereço" rows={2} />
        </section>

        <section className="card-gp grid gap-4 p-6 md:grid-cols-2">
          <h2 className="font-display text-2xl md:col-span-2">Políticas e informações legais</h2>
          <Field s={s} k="privacy_policy" label="Política de privacidade" rows={10} />
          <Field s={s} k="terms_of_use" label="Termos de uso" rows={10} />
          <Field s={s} k="legal_info" label="Informações legais" rows={8} />
          <Field s={s} k="footer_disclaimer" label="Aviso do rodapé" rows={2} />
        </section>
      </ActionForm>
    </div>
  );
}
