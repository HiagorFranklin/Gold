"use client";

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <p className="eyebrow">Erro</p>
      <h1 className="heading-display mt-4 text-5xl">Algo não saiu como esperado</h1>
      <p className="mt-4 max-w-md text-mist">Tente novamente em instantes.</p>
      <button onClick={reset} className="btn-gold mt-8">Tentar novamente</button>
    </main>
  );
}
