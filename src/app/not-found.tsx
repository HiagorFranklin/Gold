import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <p className="eyebrow">Erro 404</p>
      <h1 className="heading-display mt-4 text-5xl">Página não encontrada</h1>
      <p className="mt-4 max-w-md text-mist">O conteúdo procurado não existe ou não está disponível para exibição pública.</p>
      <Link href="/" className="btn-gold mt-8">Voltar ao início</Link>
    </main>
  );
}
