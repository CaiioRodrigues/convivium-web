import type { Metadata } from 'next';

import { FormularioDeSenha } from '@/app/definir-senha/[token]/formulario';
import { Card } from '@/components/ui';

export const metadata: Metadata = {
  title: 'Definir senha',
  robots: { index: false, follow: false },
};

/**
 * Primeiro acesso, aberto pelo link do convite.
 *
 * Rota pública: quem chega aqui ainda não tem conta. A validade do token é
 * conferida no servidor, na hora de salvar — não adianta checar antes, já que
 * a pessoa precisa digitar a senha de qualquer forma.
 */
export default async function PaginaDeDefinirSenha({
  params,
}: PageProps<'/definir-senha/[token]'>) {
  const { token } = await params;

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <p className="text-2xl font-semibold tracking-tight text-brand">Convivium</p>
          <p className="mt-1 text-sm text-ink-muted">Escolha a senha do seu acesso</p>
        </div>

        <Card className="p-6">
          <FormularioDeSenha token={token} />
        </Card>

        <p className="mt-5 text-center text-xs text-ink-subtle">
          O link do convite vale 7 dias e só pode ser usado uma vez.
        </p>
      </div>
    </main>
  );
}
