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

        {process.env.NODE_ENV !== 'production' ? (
          <div className="mt-5 rounded-lg border border-line bg-surface-muted px-4 py-3 text-xs text-ink-muted">
            <p className="font-medium text-ink">Acessos de demonstração</p>
            <p className="mt-1.5">
              Senha para todos: <code className="font-mono">Convivium@123</code>
            </p>
            <ul className="mt-1.5 space-y-0.5">
              <li>
                <code className="font-mono">sindico@convivium.local</code> — síndico
              </li>
              <li>
                <code className="font-mono">conselho@convivium.local</code> — conselho
              </li>
              <li>
                <code className="font-mono">morador@convivium.local</code> — morador
              </li>
            </ul>
          </div>
        ) : null}
      </div>
    </main>
  );
}
