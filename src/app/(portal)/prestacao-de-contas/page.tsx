import type { Metadata } from 'next';

import { ApiError, api } from '@/lib/api';
import { requireAccountsAccess } from '@/lib/dal';
import { competenceLabel, currentCompetence, date, money, percent } from '@/lib/format';
import { CabecalhoDePagina } from '@/components/cabecalho-de-pagina';
import { SeletorDeCompetencia } from '@/components/seletor-de-competencia';
import { Alert, Badge, Card, CardHeader, EmptyState, Table, Td, Th } from '@/components/ui';
import type { StatementLine } from '@/lib/types';

export const metadata: Metadata = { title: 'Prestação de contas' };

/**
 * Balancete do mês, do jeito que vai para a assembleia.
 *
 * Regime de caixa: conta pela data em que o dinheiro se moveu, e não pela
 * competência contábil do lançamento. É o único jeito de saldo anterior mais
 * resultado fechar com o saldo final — e é contra o extrato bancário que o
 * conselho confere isto.
 */
export default async function PaginaDePrestacaoDeContas({
  searchParams,
}: PageProps<'/prestacao-de-contas'>) {
  await requireAccountsAccess();

  const params = await searchParams;
  const pedida = typeof params.competencia === 'string' ? params.competencia : null;

  // O mês corrente quase nunca está fechado; o anterior é o que se apresenta.
  const competencia = pedida ?? mesAnterior(currentCompetence());

  const balancete = await api.accountability.monthly(competencia).catch((erro) => {
    if (erro instanceof ApiError && erro.status === 422) return null;
    throw erro;
  });

  return (
    <>
      <CabecalhoDePagina
        titulo="Prestação de contas"
        descricao="Balancete mensal pelo caixa, para levar à assembleia"
      />

      <Card className="mb-6">
        <CardHeader
          title="Competência"
          description="Conta pela data em que o dinheiro entrou ou saiu, que é o que fecha com o extrato."
        />
        <div className="px-5 py-4">
          <SeletorDeCompetencia competencia={competencia} destino="/prestacao-de-contas" />
        </div>
      </Card>

      {!balancete ? (
        <Card>
          <EmptyState
            title="Competência inválida"
            description="Use o formato MM/AAAA, como 08/2026."
          />
        </Card>
      ) : (
        <>
          <Card className="mb-6">
            <CardHeader
              title={`Resumo de ${competenceLabel(balancete.competence)}`}
              description={`${date(balancete.from)} a ${date(balancete.to)}`}
            />

            <div className="grid grid-cols-2 gap-4 px-5 py-4 sm:grid-cols-3 lg:grid-cols-5">
              <div>
                <p className="text-xs tracking-wide text-ink-subtle uppercase">Saldo anterior</p>
                <p className="tabular mt-1 text-lg font-semibold text-ink">
                  {money(balancete.openingBalance)}
                </p>
                <p className="text-xs text-ink-subtle">em {date(balancete.from)}</p>
              </div>
              <div>
                <p className="text-xs tracking-wide text-ink-subtle uppercase">Receitas</p>
                <p className="tabular mt-1 text-lg font-semibold text-positive">
                  {money(balancete.totalIncome)}
                </p>
                <p className="text-xs text-ink-subtle">entrou no caixa</p>
              </div>
              <div>
                <p className="text-xs tracking-wide text-ink-subtle uppercase">Despesas</p>
                <p className="tabular mt-1 text-lg font-semibold text-negative">
                  {money(balancete.totalExpense)}
                </p>
                <p className="text-xs text-ink-subtle">saiu do caixa</p>
              </div>
              <div>
                <p className="text-xs tracking-wide text-ink-subtle uppercase">Resultado</p>
                <p
                  className={`tabular mt-1 text-lg font-semibold ${
                    balancete.result < 0 ? 'text-negative' : 'text-ink'
                  }`}
                >
                  {money(balancete.result)}
                </p>
                <p className="text-xs text-ink-subtle">
                  {balancete.result < 0 ? 'o mês fechou no vermelho' : 'sobrou no mês'}
                </p>
              </div>
              <div>
                <p className="text-xs tracking-wide text-ink-subtle uppercase">Saldo final</p>
                <p className="tabular mt-1 text-lg font-semibold text-brand">
                  {money(balancete.closingBalance)}
                </p>
                <p className="text-xs text-ink-subtle">em {date(balancete.to)}</p>
              </div>
            </div>

            {balancete.warnings.length > 0 ? (
              <div className="px-5 pb-4">
                <Alert tone="warning" title="Antes de apresentar">
                  <ul className="mt-1 list-disc space-y-0.5 pl-4">
                    {balancete.warnings.map((aviso) => (
                      <li key={aviso}>{aviso}</li>
                    ))}
                  </ul>
                </Alert>
              </div>
            ) : null}

            <div className="border-t border-line px-5 py-4">
              <a
                href={`/api/prestacao-de-contas/pdf?competencia=${encodeURIComponent(competencia)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
              >
                Baixar balancete em PDF
              </a>
              <p className="mt-2 text-xs text-ink-subtle">
                Traz o mesmo resumo, os saldos por conta e o movimento lançamento por lançamento.
              </p>
            </div>
          </Card>

          {/* items-start para cada cartao ter a altura do proprio conteudo: sem
              isso, um mes com duas receitas e onze despesas deixa metade da
              tela em branco do lado esquerdo. */}
          <div className="mb-6 grid items-start gap-6 lg:grid-cols-2">
            <Movimentos titulo="Receitas" linhas={balancete.income} total={balancete.totalIncome} />
            <Movimentos
              titulo="Despesas"
              linhas={balancete.expenses}
              total={balancete.totalExpense}
            />
          </div>

          <Card className="mb-6">
            <CardHeader
              title="Saldos por conta"
              description="É esta tabela que o conselho cruza com o extrato do banco"
            />

            {balancete.accounts.length === 0 ? (
              <EmptyState title="Nenhuma conta cadastrada" />
            ) : (
              <Table>
                <thead>
                  <tr>
                    <Th>Conta</Th>
                    <Th numeric>Anterior</Th>
                    <Th numeric>Entradas</Th>
                    <Th numeric>Saídas</Th>
                    <Th numeric>Saldo final</Th>
                  </tr>
                </thead>
                <tbody>
                  {balancete.accounts.map((conta) => (
                    <tr key={conta.name}>
                      <Td className="font-medium">
                        {conta.name}
                        {conta.isReserveFund ? (
                          <span className="ml-2">
                            <Badge tone="info">fundo de reserva</Badge>
                          </span>
                        ) : null}
                      </Td>
                      <Td numeric className="text-ink-muted">
                        {money(conta.opening)}
                      </Td>
                      <Td numeric className="text-positive">
                        {money(conta.in)}
                      </Td>
                      <Td numeric className="text-negative">
                        {money(conta.out)}
                      </Td>
                      <Td numeric className="font-medium">
                        {money(conta.closing)}
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            )}
          </Card>

          <Card>
            <CardHeader
              title="Inadimplência"
              description={`Cobranças vencidas e em aberto até ${date(balancete.to)}`}
            />
            <div className="px-5 py-4">
              {balancete.delinquency.units === 0 ? (
                <p className="text-sm text-ink-muted">
                  Nenhuma cobrança vencida em aberto no fim do período.
                </p>
              ) : (
                <p className="text-sm text-ink">
                  <span className="font-semibold">
                    {balancete.delinquency.units} unidade(s)
                  </span>{' '}
                  com{' '}
                  <span className="font-semibold text-negative">
                    {money(balancete.delinquency.outstanding)}
                  </span>{' '}
                  em aberto, mais{' '}
                  <span className="font-semibold">{money(balancete.delinquency.lateCharges)}</span>{' '}
                  de multa e juros apurados até {date(balancete.to)}.
                </p>
              )}
            </div>
          </Card>
        </>
      )}
    </>
  );
}

function Movimentos({
  titulo,
  linhas,
  total,
}: {
  titulo: string;
  linhas: StatementLine[];
  total: number;
}) {
  return (
    <Card>
      <CardHeader title={titulo} description={`${money(total)} no período`} />

      {linhas.length === 0 ? (
        <EmptyState title={`Nenhuma ${titulo.slice(0, -1).toLowerCase()} no período`} />
      ) : (
        <Table>
          <thead>
            <tr>
              <Th>Conta</Th>
              <Th numeric>Valor</Th>
              <Th numeric>%</Th>
            </tr>
          </thead>
          <tbody>
            {linhas.map((linha) => (
              <tr key={linha.code}>
                <Td>
                  <span className="font-medium">{linha.name}</span>
                  <span className="block text-xs text-ink-subtle">
                    {linha.code} · {linha.count} lançamento(s)
                  </span>
                </Td>
                <Td numeric>{money(linha.amount)}</Td>
                <Td numeric className="text-ink-muted">
                  {percent(linha.share, 0)}
                </Td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </Card>
  );
}

/** "09/2026" -> "08/2026". */
function mesAnterior(competencia: string): string {
  const [mes, ano] = competencia.split('/').map(Number);
  const anterior = new Date(Date.UTC(ano, mes - 2, 1));

  return `${String(anterior.getUTCMonth() + 1).padStart(2, '0')}/${anterior.getUTCFullYear()}`;
}
