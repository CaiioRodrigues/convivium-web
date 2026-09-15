import type { Metadata } from 'next';

import { FormularioDeEntrada } from '@/app/entrar/form';
import { Alert, Card } from '@/components/ui';

export const metadata: Metadata = { title: 'Entrar' };

export default async function PaginaDeEntrada({ searchParams }: PageProps<'/entrar'>) {
  // No Next 16 searchParams é uma Promise; acesso síncrono foi removido.
  const params = await searchParams;

  const destino = typeof params.destino === 'string' ? params.destino : '/painel';
  const expirou = params.motivo === 'sessao-expirada';

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <p className="text-2xl font-semibold tracking-tight text-brand">Convivium</p>
          <p className="mt-1 text-sm text-ink-muted">Gestão do seu condomínio</p>
        </div>

        {expirou ? (
          <div className="mb-4">
            <Alert tone="warning">Sua sessão expirou. Entre novamente para continuar.</Alert>
          </div>
        ) : null}

        <Card className="p-6">
          <FormularioDeEntrada destino={destino} />
        </Card>
      </div>
    </main>
  );
}
