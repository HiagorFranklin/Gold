import { requireActor } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { ROLES, ROLE_LABELS, type Role } from "@/lib/permissions";
import { createUserAction, updateUserAction } from "@/app/admin/actions";
import { ActionForm } from "@/components/admin/ActionForm";
import { PageTitle } from "@/components/admin/ui";

export const metadata = { title: "Usuários" };

export default async function UsersAdmin() {
  const actor = await requireActor("users:manage");
  const users = getDb().prepare("SELECT id, email, name, role, active FROM admins ORDER BY id").all() as {
    id: number; email: string; name: string; role: Role; active: number;
  }[];
  return (
    <div className="max-w-4xl">
      <PageTitle title="Usuários e permissões" intro="Administrador: acesso total. Editor: produtos (exceto preço e situação regulatória), categorias e conteúdo. Leitura: apenas consulta." />
      <ul className="space-y-3">
        {users.map((u) => (
          <li key={u.id} className="card-gp flex flex-wrap items-center justify-between gap-4 p-4">
            <div>
              <p className="font-semibold">{u.name}</p>
              <p className="text-xs text-mist">{u.email}</p>
            </div>
            {u.id === actor.id ? (
              <span className="text-xs text-mist">{ROLE_LABELS[u.role]} (você)</span>
            ) : (
              <form action={updateUserAction} className="flex flex-wrap items-center gap-3">
                <input type="hidden" name="id" value={u.id} />
                <select name="role" defaultValue={u.role} aria-label={`Perfil de ${u.email}`} className="input-gp !w-auto !py-1.5 text-xs">
                  {ROLES.map((r) => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
                </select>
                <label className="flex items-center gap-2 text-xs text-mist">
                  <input type="checkbox" name="active" defaultChecked={!!u.active} className="accent-[#D4AF37]" /> Ativo
                </label>
                <button className="btn-outline !px-4 !py-1.5 text-xs">Atualizar</button>
              </form>
            )}
          </li>
        ))}
      </ul>
      <section className="card-gp mt-8 p-6">
        <h2 className="mb-4 font-display text-2xl">Novo usuário</h2>
        <ActionForm action={createUserAction} submitLabel="Criar usuário">
          <div className="grid gap-4 md:grid-cols-2">
            <div><label htmlFor="u-name" className="label-gp">Nome</label><input id="u-name" name="name" required className="input-gp" /></div>
            <div><label htmlFor="u-email" className="label-gp">E-mail</label><input id="u-email" name="email" type="email" required className="input-gp" /></div>
            <div><label htmlFor="u-role" className="label-gp">Perfil</label>
              <select id="u-role" name="role" defaultValue="editor" className="input-gp">{ROLES.map((r) => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}</select>
            </div>
            <div><label htmlFor="u-pass" className="label-gp">Senha inicial (mín. 10 caracteres)</label><input id="u-pass" name="password" type="password" required minLength={10} autoComplete="new-password" className="input-gp" /></div>
          </div>
        </ActionForm>
      </section>
    </div>
  );
}
