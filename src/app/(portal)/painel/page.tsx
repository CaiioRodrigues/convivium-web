import type { Metadata } from 'next';
import Link from 'next/link';

import { api } from '@/lib/api';
import { requireAccountsAccess } from '@/lib/dal';
import { competenceLabel, count, money, percent } from '@/lib/format';
import { CabecalhoDePagina } from '@/components/cabecalho-de-pagina';
import { Alert, Badge, Card, CardHeader, Stat } from '@/components/ui';
import { GastosPorCategoria } from '@/components/charts/gastos-por-categoria';
import { ReceitaDespesa } from '@/components/charts/receita-despesa';
import { SaldoMensal } from '@/components/charts/saldo-mensal';
import { Consumo } from '@/components/charts/consumo';

export const metadata: Metadata = { title: 'Painel' };

export default async function PaginaDoPainel() {
  await requireAccountsAccess();

  // Em paralelo: são consultas independentes e sequenciar somaria a latência
  // de todas antes da primeira pintura.
  const [resumo, categorias, serieMensal, consumo, fornecedores] = await Promise.all([
    api.dashboard.summary(),
    api.dashboard.expensesByCategory({ months: 6 }),
    api.dashboard.monthlySeries(12),
    api.dashboard.consumption('Cemig', 12),
    api.dashboard.topSuppliers(6, 5),
  ]);

  const resultadoPositivo = resumo.monthResult >= 0;
  const temInadimplencia = resumo.overdueReceivables > 0;

  const pendencias = [
    resumo.billsAwaitingReview > 0
      ? {
          href: '/faturas',
          texto: `${resumo.billsAwaitingReview} fatura(s) em PDF aguardando conferência`,
        }
      : null,
    resumo.failedEmails > 0
      ? { href: '/notificacoes', texto: `${resumo.failedEmails} e-mail(s) não entregues` }
      : null,
    resumo.overdueExpenses > 0
      ? {
          href: '/despesas?OnlyOverdue=true',
          texto: `${money(resumo.overdueExpenses)} em contas vencidas a pagar`,
        }
      : null,
  ].filter((item) => item !== null);

  return (
    <>
      <CabecalhoDePagina
        titulo="Painel"
        descricao={`Competência de ${competenceLabel(resumo.competence)}`}
      />

      {pendencias.length > 0 ? (
        <div className="mb-6">
          <Alert tone="warning" title="Precisa da sua atenção">
            <ul className="mt-1 space-y-0.5">
              {pendencias.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="underline underline-offset-2">
                    {item.texto}
                  </Link>
                </li>
              ))}
            </ul>
          </Alert>
        </div>
      ) : null}

      {/* Números de manchete são ladrilhos, não gráficos de uma barra só. */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat
          label="Saldo em caixa"
          value={money(resumo.totalBalance)}
          tone="brand"
          hint={`${money(resumo.operatingBalance)} operacional · ${money(resumo.reserveFundBalance)} em fundo de reserva`}
        />
        <Stat
          label="Resultado do mês"
          value={money(resumo.monthResult)}
          tone={resultadoPositivo ? 'positive' : 'negative'}
          hint={`${money(resumo.monthRevenue)} de receita contra ${money(resumo.monthExpense)} de despesa`}
        />
        <Stat
          label="A receber vencido"
          value={money(resumo.overdueReceivables)}
          tone={temInadimplencia ? 'negative' : 'positive'}
          hint={
            temInadimplencia
              ? `+ ${money(resumo.overdueLateCharges)} de multa e juros já apurados`
              : 'Nenhuma cobrança vencida em aberto'
          }
        />
        <Stat
          label="Inadimplência"
          value={percent(resumo.delinquencyRate)}
          tone={resumo.delinquentUnits > 0 ? 'warning' : 'positive'}
          hint={`${count(resumo.delinquentUnits)} de ${count(resumo.activeUnits)} unidades em atraso`}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader
            title="Para onde vai o dinheiro"
            description="Gasto por grupo do plano de contas, nos últimos 6 meses"
          />
          <div className="p-4">
            <GastosPorCategoria dados={categorias} />
          </div>
        </Card>

        <Card>
          <CardHeader
            title="Receita e despesa"
            description="Últimos 12 meses, por competência"
          />
          <div className="p-4">
            <ReceitaDespesa dados={serieMensal} />
          </div>
        </Card>

        <Card>
          <CardHeader
            title="Saldo de caixa"
            description="Saldo ao final de cada mês, somando todas as contas"
          />
          <div className="p-4">
            <SaldoMensal dados={serieMensal} />
          </div>
        </Card>

        <Card>
          <CardHeader
            title="Consumo de energia"
            description={
              consumo.averageConsumption
                ? `Média de ${count(consumo.averageConsumption)} ${consumo.unit} por mês, das faturas lidas em PDF`
                : 'Das faturas da CEMIG lidas em PDF'
            }
          />
          <div className="p-4">
            <Consumo serie={consumo} />
          </div>
        </Card>
      </div>

      {fornecedores.length > 0 ? (
        <Card className="mt-6">
          <CardHeader
            title="Maiores fornecedores"
            description="Gasto acumulado nos últimos 6 meses"
          />
          <ul className="divide-y divide-line">
            {fornecedores.map((fornecedor) => (
              <li
                key={fornecedor.supplierId ?? fornecedor.name}
                className="flex items-center justify-between gap-4 px-5 py-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-ink">{fornecedor.name}</p>
                  <p className="text-xs text-ink-subtle">
                    {count(fornecedor.expenseCount)} despesa(s)
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <Badge tone="neutral">{percent(fornecedor.share, 0)}</Badge>
                  <span className="tabular text-sm font-medium text-ink">
                    {money(fornecedor.amount)}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      ) : null}
    </>
  );
}
