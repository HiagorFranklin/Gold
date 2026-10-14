import { requireActor } from "@/lib/auth";
import { ROLE_LABELS } from "@/lib/permissions";
import { changePasswordAction } from "@/app/admin/actions";
import { ActionForm } from "@/components/admin/ActionForm";
import { PageTitle } from "@/components/admin/ui";

export const metadata = { title: "Minha conta" };

export default async function Account() {
  const actor = await requireActor();
  return (
    <div className="max-w-xl">
      <PageTitle title="Minha conta" intro={`${actor.email} · ${ROLE_LABELS[actor.role]}`} />
      <section className="card-gp p-6">
        <h2 className="mb-4 font-display text-2xl">Alterar senha</h2>
        <ActionForm action={changePasswordAction} submitLabel="Alterar senha">
          <div><label htmlFor="current" className="label-gp">Senha atual</label><input id="current" name="current" type="password" required autoComplete="current-password" className="input-gp" /></div>
          <div><label htmlFor="next" className="label-gp">Nova senha (mín. 10 caracteres)</label><input id="next" name="next" type="password" required minLength={10} autoComplete="new-password" className="input-gp" /></div>
          <div><label htmlFor="confirm" className="label-gp">Confirmar nova senha</label><input id="confirm" name="confirm" type="password" required autoComplete="new-password" className="input-gp" /></div>
        </ActionForm>
      </section>
    </div>
  );
}
