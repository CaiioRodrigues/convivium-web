import type { Metadata } from 'next';
import Link from 'next/link';

import { api } from '@/lib/api';
import { requireAccountsAccess } from '@/lib/dal';
import { canManageFinance } from '@/lib/roles';
import { competenceLabel, date, money } from '@/lib/format';
import { STATUS_DA_DESPESA } from '@/lib/rotulos';
import { CabecalhoDePagina } from '@/components/cabecalho-de-pagina';
import { Badge, Card, CardHeader, EmptyState, Stat, Table, Td, Th } from '@/components/ui';
import { BotaoDeEstornar, BotaoDePagar } from '@/app/(portal)/despesas/acoes';

export const metadata: Metadata = { title: 'Despesas' };

export default async function PaginaDeDespesas({ searchParams }: PageProps<'/despesas'>) {
  const sessao = await requireAccountsAccess();
  const podeMovimentar = canManageFinance(sessao.activeRole);

  const filtros = await searchParams;
  const competencia = typeof filtros.competencia === 'string' ? filtros.competencia : undefined;
  const status = typeof filtros.status === 'string' ? filtros.status : undefined;
  const soVencidas = filtros.vencidas === 'true';

  const filtro = {
    Competence: competencia,
    Status: status as 'Pending' | 'Paid' | 'Cancelled' | undefined,
    OnlyOverdue: soVencidas || undefined,
  };

  const [despesas, totais, posicao] = await Promise.all([
    api.expenses.list({ ...filtro, PageSize: 60 }),
    api.expenses.totals(filtro),
    podeMovimentar ? api.cash.position() : Promise.resolve(null),
  ]);

  const contas = posicao?.accounts.filter((c) => c.isActive) ?? [];

  const abas = [
    { rotulo: 'Todas', href: '/despesas', ativo: !status && !soVencidas },
    { rotulo: 'A pagar', href: '/despesas?status=Pending', ativo: status === 'Pending' && !soVencidas },
    { rotulo: 'Vencidas', href: '/despesas?vencidas=true', ativo: soVencidas },
    { rotulo: 'Pagas', href: '/despesas?status=Paid', ativo: status === 'Paid' },
  ];

  return (
    <>
      <CabecalhoDePagina titulo="Despesas" descricao="Contas a pagar do condomínio" />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <Stat label="A pagar" value={money(totais.pending)} tone="warning" />
        <Stat label="Vencidas" value={money(totais.overdue)} tone={totais.overdue > 0 ? 'negative' : 'neutral'} />
        <Stat label="Pagas" value={money(totais.paid)} tone="positive" />
      </div>

      <Card>
        <CardHeader
          title="Lançamentos"
          description={`${despesas.total} despesa(s) no filtro atual`}
          action={
            <nav className="flex flex-wrap gap-1">
              {abas.map((aba) => (
                <Link
                  key={aba.href}
                  href={aba.href}
                  aria-current={aba.ativo ? 'page' : undefined}
                  className={
                    aba.ativo
                      ? 'rounded-lg bg-brand-soft px-3 py-1.5 text-xs font-medium text-brand'
                      : 'rounded-lg px-3 py-1.5 text-xs font-medium text-ink-muted hover:bg-surface-muted'
                  }
                >
                  {aba.rotulo}
                </Link>
              ))}
            </nav>
          }
        />

        {despesas.items.length === 0 ? (
          <EmptyState
            title="Nenhuma despesa neste filtro"
            description="Lance as contas do mês ou importe a fatura da concessionária em PDF."
          />
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Descrição</Th>
                <Th>Conta contábil</Th>
                <Th>Competência</Th>
                <Th>Vencimento</Th>
                <Th numeric>Valor</Th>
                <Th>Situação</Th>
                {podeMovimentar ? <Th numeric>Ação</Th> : null}
              </tr>
            </thead>
            <tbody>
              {despesas.items.map((despesa) => {
                const situacao = despesa.isOverdue
                  ? { texto: 'Vencida', tom: 'negative' as const }
                  : STATUS_DA_DESPESA[despesa.status];

                return (
                  <tr key={despesa.id}>
                    <Td>
                      <span className="block max-w-xs truncate font-medium">
                        {despesa.description}
                      </span>
                      {despesa.supplierName ? (
                        <span className="text-xs text-ink-subtle">{despesa.supplierName}</span>
                      ) : null}
                      {despesa.utilityBillId ? (
                        <span className="ml-1 text-xs text-ink-subtle">· lida de PDF</span>
                      ) : null}
                    </Td>
                    <Td className="text-ink-muted">
                      {despesa.ledgerAccountCode} · {despesa.ledgerAccountName}
                    </Td>
                    <Td className="whitespace-nowrap text-ink-muted">
                      {competenceLabel(despesa.competence)}
                    </Td>
                    <Td className="whitespace-nowrap text-ink-muted">{date(despesa.dueDate)}</Td>
                    <Td numeric className="font-medium">
                      {money(despesa.amount)}
                    </Td>
                    <Td>
                      <Badge tone={situacao.tom}>{situacao.texto}</Badge>
                      {!despesa.isApportionable ? (
                        <Badge tone="neutral" className="ml-1">
                          Fora do rateio
                        </Badge>
                      ) : null}
                    </Td>
                    {podeMovimentar ? (
                      <Td numeric>
                        {despesa.status === 'Pending' && contas.length > 0 ? (
                          <BotaoDePagar despesaId={despesa.id} contas={contas} />
                        ) : despesa.status === 'Paid' ? (
                          <BotaoDeEstornar despesaId={despesa.id} />
                        ) : null}
                      </Td>
                    ) : null}
                  </tr>
                );
              })}
            </tbody>
          </Table>
        )}
      </Card>
    </>
  );
}
