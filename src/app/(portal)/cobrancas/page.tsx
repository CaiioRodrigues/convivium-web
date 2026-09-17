import type { Metadata } from 'next';
import Link from 'next/link';

import { api } from '@/lib/api';
import { requireAccountsAccess } from '@/lib/dal';
import { canManageCondominium } from '@/lib/roles';
import { competenceLabel, count, currentCompetence, date, money, percent } from '@/lib/format';
import { STATUS_DO_CICLO } from '@/lib/rotulos';
import { CabecalhoDePagina } from '@/components/cabecalho-de-pagina';
import { Alert, Badge, Card, CardHeader, EmptyState, Table, Td, Th } from '@/components/ui';
import { AbrirCiclo, AcoesDoCiclo } from '@/app/(portal)/cobrancas/acoes';

export const metadata: Metadata = { title: 'Cobranças' };

export default async function PaginaDeCobrancas() {
  const sessao = await requireAccountsAccess();
  const podeFechar = canManageCondominium(sessao.activeRole);

  const competencia = currentCompetence();

  const [ciclos, inadimplencia, previa] = await Promise.all([
    api.billing.cycles(),
    api.billing.delinquency(),
    // A prévia pode falhar legitimamente (competência sem despesa lançada);
    // isso não deve derrubar a página inteira.
    api.billing.preview(competencia).catch(() => null),
  ]);

  const totalEmAtraso = inadimplencia.reduce((soma, u) => soma + u.outstandingAmount, 0);
  const totalDeEncargos = inadimplencia.reduce((soma, u) => soma + u.lateCharges, 0);

  return (
    <>
      <CabecalhoDePagina
        titulo="Cobranças"
        descricao="Rateio mensal, boletos por unidade e inadimplência"
      />

      {podeFechar ? (
        <Card className="mb-6">
          <CardHeader
            title="Novo rateio"
            description="Abre a competência em rascunho. Nada é cobrado até o fechamento."
          />
          <div className="px-5 py-4">
            <AbrirCiclo competenciaSugerida={competencia} />
          </div>
        </Card>
      ) : null}

      {previa ? (
        <Card className="mb-6">
          <CardHeader
            title={`Prévia de ${competenceLabel(previa.competence)}`}
            description="Simulação com os números de hoje. Nada aqui está gravado."
          />

          {/*
            O consumo individual só aparece quando existe: prédio sem medidor
            não precisa de um cartão zerado. Quando aparece, ele é o que faz os
            números fecharem — sem ele a tela mostrava despesas mais fundo de
            reserva e um total maior, sem dizer de onde vinha a diferença.
          */}
          <div
            className={
              previa.meteredTotal > 0
                ? 'grid grid-cols-2 gap-4 px-5 py-4 sm:grid-cols-3 lg:grid-cols-5'
                : 'grid gap-4 px-5 py-4 sm:grid-cols-4'
            }
          >
            <div>
              <p className="text-xs tracking-wide text-ink-subtle uppercase">Despesas rateáveis</p>
              <p className="tabular mt-1 text-lg font-semibold text-ink">
                {money(previa.apportionableTotal)}
              </p>
              <p className="text-xs text-ink-subtle">{previa.expenseCount} despesa(s)</p>
            </div>
            <div>
              <p className="text-xs tracking-wide text-ink-subtle uppercase">Fundo de reserva</p>
              <p className="tabular mt-1 text-lg font-semibold text-ink">
                {money(previa.reserveFundTotal)}
              </p>
              <p className="text-xs text-ink-subtle">
                {percent(previa.reserveFundRate, 0)} das despesas
              </p>
            </div>

            {previa.meteredTotal > 0 ? (
              <div>
                <p className="text-xs tracking-wide text-ink-subtle uppercase">
                  Consumo individual
                </p>
                <p className="tabular mt-1 text-lg font-semibold text-ink">
                  {money(previa.meteredTotal)}
                </p>
                <p className="text-xs text-ink-subtle">medido, fora do rateio</p>
              </div>
            ) : null}

            <div>
              <p className="text-xs tracking-wide text-ink-subtle uppercase">Total a cobrar</p>
              <p className="tabular mt-1 text-lg font-semibold text-brand">
                {money(previa.chargedTotal)}
              </p>
              <p className="text-xs text-ink-subtle">
                {previa.meteredTotal > 0
                  ? 'soma dos três'
                  : `${count(previa.unitCount)} unidades`}
              </p>
            </div>
            <div>
              <p className="text-xs tracking-wide text-ink-subtle uppercase">Cota média</p>
              <p className="tabular mt-1 text-lg font-semibold text-ink">
                {money(previa.unitCount > 0 ? previa.chargedTotal / previa.unitCount : 0)}
              </p>
              {/*
                Com gás no meio, "cota média" não é o que ninguém paga: o rateio
                é igual para todos, o consumo não. Dizer "média" sem essa
                ressalva faz o síndico repetir o número como se fosse o boleto.
              */}
              <p className="text-xs text-ink-subtle">
                {previa.meteredTotal > 0
                  ? `entre ${count(previa.unitCount)} unidades, o consumo varia`
                  : 'por unidade'}
              </p>
            </div>
          </div>

          {previa.warnings.length > 0 ? (
            <div className="px-5 pb-4">
              <Alert tone="warning" title="Confira antes de fechar">
                <ul className="mt-1 list-disc space-y-0.5 pl-4">
                  {previa.warnings.map((aviso) => (
                    <li key={aviso}>{aviso}</li>
                  ))}
                </ul>
              </Alert>
            </div>
          ) : null}
        </Card>
      ) : null}

      <Card className="mb-6">
        <CardHeader title="Ciclos" description="Rascunho → fechado → publicado" />

        {ciclos.length === 0 ? (
          <EmptyState
            title="Nenhum rateio ainda"
            description="Abra a competência do mês para gerar as cobranças das unidades."
          />
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Competência</Th>
                <Th>Vencimento</Th>
                <Th>Situação</Th>
                <Th numeric>Total cobrado</Th>
                <Th numeric>Recebido</Th>
                <Th numeric>Pagas</Th>
                {podeFechar ? <Th numeric>Ações</Th> : null}
              </tr>
            </thead>
            <tbody>
              {ciclos.map((ciclo) => {
                const situacao = STATUS_DO_CICLO[ciclo.status];
                const recebido =
                  ciclo.chargedTotal > 0 ? ciclo.receivedTotal / ciclo.chargedTotal : 0;

                return (
                  <tr key={ciclo.id}>
                    <Td className="font-medium whitespace-nowrap">
                      {/* O ciclo em rascunho ainda não gerou boleto nenhum. */}
                      {ciclo.status === 'Draft' ? (
                        competenceLabel(ciclo.competence)
                      ) : (
                        <Link
                          href={`/cobrancas/${ciclo.id}`}
                          className="text-brand hover:underline"
                        >
                          {competenceLabel(ciclo.competence)}
                        </Link>
                      )}
                    </Td>
                    <Td className="whitespace-nowrap text-ink-muted">{date(ciclo.dueDate)}</Td>
                    <Td>
                      <Badge tone={situacao.tom}>{situacao.texto}</Badge>
                    </Td>
                    <Td numeric>{money(ciclo.chargedTotal)}</Td>
                    <Td numeric className={recebido >= 1 ? 'text-positive' : undefined}>
                      {money(ciclo.receivedTotal)}
                      <span className="ml-1 text-xs text-ink-subtle">{percent(recebido, 0)}</span>
                    </Td>
                    <Td numeric className="text-ink-muted">
                      {count(ciclo.paidCount)} / {count(ciclo.chargeCount)}
                    </Td>
                    {podeFechar ? (
                      <Td numeric>
                        <AcoesDoCiclo cicloId={ciclo.id} status={ciclo.status} />
                      </Td>
                    ) : null}
                  </tr>
                );
              })}
            </tbody>
          </Table>
        )}
      </Card>

      <Card>
        <CardHeader
          title="Inadimplência"
          description={
            inadimplencia.length > 0
              ? `${money(totalEmAtraso)} em aberto, mais ${money(totalDeEncargos)} de multa e juros já apurados`
              : 'Nenhuma cobrança vencida em aberto'
          }
        />

        {inadimplencia.length === 0 ? (
          <EmptyState title="Todas as cobranças em dia" />
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Unidade</Th>
                <Th>Responsável</Th>
                <Th numeric>Cobranças</Th>
                <Th>Vencida desde</Th>
                <Th numeric>Em aberto</Th>
                <Th numeric>Multa e juros</Th>
                <Th numeric>Total hoje</Th>
              </tr>
            </thead>
            <tbody>
              {inadimplencia.map((unidade) => (
                <tr key={unidade.unitId}>
                  <Td className="font-medium whitespace-nowrap">{unidade.unitIdentifier}</Td>
                  <Td>
                    <span className="block">{unidade.payerName ?? '—'}</span>
                    {unidade.payerEmail ? (
                      <span className="text-xs text-ink-subtle">{unidade.payerEmail}</span>
                    ) : (
                      <span className="text-xs text-warning">sem e-mail cadastrado</span>
                    )}
                  </Td>
                  <Td numeric className="text-ink-muted">
                    {count(unidade.openCharges)}
                  </Td>
                  <Td className="whitespace-nowrap text-ink-muted">
                    {date(unidade.oldestDueDate)}
                    <span className="ml-1 text-xs text-ink-subtle">
                      ({count(unidade.maxDaysLate)} dias)
                    </span>
                  </Td>
                  <Td numeric>{money(unidade.outstandingAmount)}</Td>
                  <Td numeric className="text-negative">
                    {money(unidade.lateCharges)}
                  </Td>
                  <Td numeric className="font-semibold">
                    {money(unidade.outstandingAmount + unidade.lateCharges)}
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>
    </>
  );
}
