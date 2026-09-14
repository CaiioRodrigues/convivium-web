import type { Metadata } from 'next';

import { api } from '@/lib/api';
import { requireCondominium } from '@/lib/dal';
import { money } from '@/lib/format';
import { CabecalhoDePagina } from '@/components/cabecalho-de-pagina';
import { CartaoDeCobranca } from '@/components/cobranca/cartao';
import { Alert, Card, EmptyState } from '@/components/ui';

export const metadata: Metadata = { title: 'Minhas cobranças' };

export default async function PaginaDasMinhasCobrancas() {
  await requireCondominium();

  const cobrancas = await api.billing.myCharges();

  const emAberto = cobrancas.filter((c) => c.status !== 'Paid' && c.status !== 'Cancelled');
  const quitadas = cobrancas.filter((c) => c.status === 'Paid');

  const totalEmAberto = emAberto.reduce((soma, c) => soma + c.totalWithLateCharges, 0);
  const vencidas = emAberto.filter((c) => c.status === 'Overdue');

  return (
    <>
      <CabecalhoDePagina
        titulo="Minhas cobranças"
        descricao="Boletos das unidades em que você mora ou é proprietário"
      />

      {vencidas.length > 0 ? (
        <div className="mb-6">
          <Alert tone="negative" title="Você tem cobrança vencida">
            {vencidas.length === 1
              ? 'Uma cobrança está vencida. O valor abaixo já inclui multa e juros até hoje.'
              : `${vencidas.length} cobranças estão vencidas. Os valores abaixo já incluem multa e juros até hoje.`}
          </Alert>
        </div>
      ) : emAberto.length > 0 ? (
        <div className="mb-6">
          <Alert tone="info">
            Você tem {money(totalEmAberto)} em aberto.
          </Alert>
        </div>
      ) : null}

      {cobrancas.length === 0 ? (
        <Card>
          <EmptyState
            title="Nenhuma cobrança por aqui"
            description="Quando o síndico publicar o rateio do mês, seu boleto aparece nesta página e chega no seu e-mail."
          />
        </Card>
      ) : (
        <div className="space-y-6">
          {emAberto.map((cobranca) => (
            <CartaoDeCobranca
              key={cobranca.id}
              cobranca={cobranca}
              urlDoPdf={`/api/cobrancas/${cobranca.id}/pdf`}
            />
          ))}

          {quitadas.length > 0 ? (
            <section>
              <h2 className="mb-3 text-sm font-semibold text-ink-muted">
                Cobranças quitadas
              </h2>
              <div className="space-y-4">
                {quitadas.map((cobranca) => (
                  <CartaoDeCobranca
                    key={cobranca.id}
                    cobranca={cobranca}
                    urlDoPdf={`/api/cobrancas/${cobranca.id}/pdf`}
                  />
                ))}
              </div>
            </section>
          ) : null}
        </div>
      )}
    </>
  );
}
