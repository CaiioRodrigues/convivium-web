import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { api } from '@/lib/api';
import { CartaoDeCobranca } from '@/components/cobranca/cartao';

export const metadata: Metadata = {
  title: 'Seu boleto',
  // Um link de boleto não deve acabar num índice de busca.
  robots: { index: false, follow: false },
};

/**
 * Boleto aberto pelo link do e-mail, sem login.
 *
 * A autorização é o próprio token da URL — 256 bits de entropia, válido para
 * uma única cobrança. É o que permite mandar o boleto para um proprietário
 * que nunca criou conta no sistema.
 */
export default async function PaginaDoBoletoPublico({
  params,
}: PageProps<'/boleto/[token]'>) {
  const { token } = await params;

  const cobranca = await api.billing.byPublicToken(token).catch(() => null);

  if (!cobranca) {
    notFound();
  }

  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-10">
      <div className="mb-6 text-center">
        <p className="text-xl font-semibold tracking-tight text-brand">Convivium</p>
        <p className="mt-1 text-sm text-ink-muted">Aviso de cobrança condominial</p>
      </div>

      <CartaoDeCobranca
        cobranca={cobranca}
        urlDoPdf={`/api/boleto/${token}/pdf`}
        urlDaImagem={`/api/boleto/${token}/imagem`}
      />

      <p className="mt-6 text-center text-xs text-ink-subtle">
        Guarde este link: ele dá acesso apenas a esta cobrança.
      </p>
    </main>
  );
}
