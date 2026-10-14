import { requireActor } from "@/lib/auth";
import { listMessages } from "@/lib/data";
import { formatDateTime } from "@/lib/format";
import { toggleMessageAction } from "@/app/admin/actions";
import { PageTitle } from "@/components/admin/ui";

export const metadata = { title: "Mensagens" };

export default async function MessagesAdmin() {
  await requireActor("messages:view");
  const messages = listMessages();
  return (
    <div className="max-w-4xl">
      <PageTitle title="Mensagens de contato" intro="Recebidas pelo formulário do site." />
      {messages.length === 0 && <p className="text-mist">Nenhuma mensagem recebida.</p>}
      <ul className="space-y-4">
        {messages.map((m) => (
          <li key={m.id} className={`card-gp p-5 ${m.handled ? "opacity-60" : ""}`}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-semibold">{m.name} <span className="font-normal text-mist">· {m.contact}</span></p>
                {m.subject && <p className="text-sm text-gold/90">{m.subject}</p>}
              </div>
              <span className="text-xs text-mist-2">{formatDateTime(m.created_at)}</span>
            </div>
            <p className="mt-3 whitespace-pre-line text-sm text-white/85">{m.message}</p>
            <form action={toggleMessageAction} className="mt-3">
              <input type="hidden" name="id" value={m.id} />
              <button className="text-xs text-gold hover:underline">{m.handled ? "Marcar como pendente" : "Marcar como respondida"}</button>
            </form>
          </li>
        ))}
      </ul>
    </div>
  );
}
