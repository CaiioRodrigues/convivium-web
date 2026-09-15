import type { Metadata } from 'next';
import Link from 'next/link';

import { api } from '@/lib/api';
import { requireFinanceAccess } from '@/lib/dal';
import { amount, barcodeLine, competenceLabel, date, dateTime, money } from '@/lib/format';
import { CONCESSIONARIA, STATUS_DA_FATURA } from '@/lib/rotulos';
import { CabecalhoDePagina } from '@/components/cabecalho-de-pagina';
import { Alert, Badge, Card, CardHeader, EmptyState } from '@/components/ui';
import { CorrigirLeitura, EnviarFatura, GerarDespesa } from '@/app/(portal)/faturas/acoes';

export const metadata: Metadata = { title: 'Faturas' };

export default async function PaginaDeFaturas() {
  await requireFinanceAccess();

  const faturas = await api.utilityBills.list({ PageSize: 30 });

  return (
    <>
      <CabecalhoDePagina
        titulo="Faturas de concessionária"
        descricao="Envie o PDF da conta e o sistema lê valor, vencimento, competência e consumo"
      />

      <Card className="mb-6">
        <CardHeader
          title="Importar fatura"
          description="Importar apenas lê e guarda. Gerar a despesa é um passo separado, depois de você conferir."
        />
        <div className="px-5 py-4">
          <EnviarFatura />
        </div>
      </Card>

      {faturas.items.length === 0 ? (
        <Card>
          <EmptyState
            title="Nenhuma fatura importada"
            description="Envie o PDF da conta de luz ou de água. O leitor extrai os campos e você confere antes de lançar no caixa."
          />
        </Card>
      ) : (
        <div className="space-y-4">
          {faturas.items.map((fatura) => {
            const situacao = STATUS_DA_FATURA[fatura.status];
            // Corrigir vale enquanto a fatura nao virou despesa, e nao so
            // quando o leitor admite que falhou. Leitura errada com cara de
            // certa e o caso perigoso: o valor esta la, plausivel, e sem
            // formulario nao havia como troca-lo.
            const podeCorrigir = fatura.status !== 'Converted';
            const precisaConferir = fatura.status === 'NeedsReview';
            const podeGerarDespesa =
              fatura.status !== 'Converted' && fatura.amount !== null && fatura.dueDate !== null;

            return (
              <Card key={fatura.id}>
                <CardHeader
                  title={
                    <span className="flex flex-wrap items-center gap-2">
                      {CONCESSIONARIA[fatura.provider]}
                      {fatura.referenceMonth ? (
                        <span className="font-normal text-ink-muted">
                          · {competenceLabel(fatura.referenceMonth)}
                        </span>
                      ) : null}
                      <Badge tone={situacao.tom}>{situacao.texto}</Badge>
                    </span>
                  }
                  description={`${fatura.sourceFileName} · importado em ${dateTime(fatura.importedAt)}`}
                />

                <dl className="grid gap-4 px-5 py-4 sm:grid-cols-4">
                  <div>
                    <dt className="text-xs tracking-wide text-ink-subtle uppercase">Valor</dt>
                    <dd className="tabular mt-1 text-lg font-semibold text-ink">
                      {fatura.amount !== null ? money(fatura.amount) : '— não lido'}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs tracking-wide text-ink-subtle uppercase">Vencimento</dt>
                    <dd className="mt-1 text-lg font-semibold text-ink">
                      {fatura.dueDate ? date(fatura.dueDate) : '— não lido'}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs tracking-wide text-ink-subtle uppercase">Consumo</dt>
                    <dd className="tabular mt-1 text-lg font-semibold text-ink">
                      {fatura.consumptionKwh !== null
                        ? `${amount(fatura.consumptionKwh)} kWh`
                        : fatura.consumptionCubicMeters !== null
                          ? `${amount(fatura.consumptionCubicMeters)} m³`
                          : '— não lido'}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs tracking-wide text-ink-subtle uppercase">Instalação</dt>
                    <dd className="mt-1 text-lg font-semibold text-ink">
                      {fatura.installationCode ?? '—'}
                    </dd>
                  </div>
                </dl>

                {fatura.barcodeLine ? (
                  <p className="px-5 pb-3 font-mono text-xs break-all text-ink-muted">
                    {barcodeLine(fatura.barcodeLine)}
                  </p>
                ) : null}

                {fatura.warnings.length > 0 ? (
                  <div className="px-5 pb-4">
                    <Alert tone="warning" title="O leitor não teve certeza de tudo">
                      <ul className="mt-1 list-disc space-y-0.5 pl-4">
                        {fatura.warnings.map((aviso) => (
                          <li key={aviso}>{aviso}</li>
                        ))}
                      </ul>
                    </Alert>
                  </div>
                ) : null}

                {podeCorrigir ? (
                  <details className="border-t border-line px-5 py-4" open={precisaConferir}>
                    <summary className="cursor-pointer text-sm font-medium text-brand">
                      {precisaConferir ? 'Corrigir leitura' : 'Conferir ou corrigir a leitura'}
                    </summary>
                    <div className="mt-3">
                      <CorrigirLeitura fatura={fatura} />
                    </div>
                  </details>
                ) : (
                  <div className="border-t border-line px-5 py-4">
                    <p className="text-sm text-ink-muted">
                      Esta fatura já virou despesa. Corrigir a leitura agora não mudaria o valor
                      lançado — edite a despesa em{' '}
                      <Link href="/despesas" className="text-brand underline underline-offset-2">
                        Despesas
                      </Link>
                      .
                    </p>
                  </div>
                )}

                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-5 py-4">
                  <a
                    href={`/faturas/${fatura.id}/texto`}
                    className="text-sm text-ink-muted underline underline-offset-2 hover:text-ink"
                  >
                    Ver o texto extraído do PDF
                  </a>

                  {fatura.status === 'Converted' ? (
                    <span className="text-sm text-positive">Já virou despesa no caixa</span>
                  ) : podeGerarDespesa ? (
                    <GerarDespesa faturaId={fatura.id} />
                  ) : (
                    <span className="text-sm text-ink-subtle">
                      Preencha valor e vencimento para gerar a despesa
                    </span>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </>
  );
}
