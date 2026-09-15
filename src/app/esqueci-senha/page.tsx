import type { Metadata } from 'next';

import { FormularioDeEsqueciSenha } from '@/app/esqueci-senha/formulario';
import { Card } from '@/components/ui';

export const metadata: Metadata = {
  title: 'Esqueci minha senha',
  robots: { index: false, follow: false },
};

/**
 * Pedido de redefinição de senha.
 *
 * Rota pública, e a única saída de quem perdeu o acesso sem ter o síndico por
 * perto. O resultado é sempre o mesmo, com e-mail cadastrado ou não: a tela
 * não pode virar um jeito de descobrir quem mora no prédio.
 */
export default function PaginaDeEsqueciSenha() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <p className="text-2xl font-semibold tracking-tight text-brand">Convivium</p>
          <p className="mt-1 text-sm text-ink-muted">Recuperar o acesso</p>
        </div>

        <Card className="p-6">
          <FormularioDeEsqueciSenha />
        </Card>
      </div>
    </main>
  );
}
