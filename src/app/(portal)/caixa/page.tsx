import type { Metadata } from 'next';

import { api } from '@/lib/api';
import { requireAccountsAccess } from '@/lib/dal';
import { amount, competenceLabel, date, money } from '@/lib/format';
import { CabecalhoDePagina } from '@/components/cabecalho-de-pagina';
import {
  Badge,
  Card,
  CardHeader,
  EmptyState,
  Stat,
  Table,
  Td,
  Th,
} from '@/components/ui';
import { FiltroDeLancamentos } from '@/app/(portal)/caixa/filtro';
import { ContaComFormulario } from '@/app/(portal)/caixa/formularios';
import { canManageCondominium } from '@/lib/roles';

export const metadata: Metadata = { title: 'Caixa' };

const TIPO_DE_CONTA: Record<string, string> = {
  Checking: 'Conta corrente',
  Savings: 'Poupança',
  Investment: 'Aplicação',
  Cash: 'Dinheiro em espécie',
};

export default async function PaginaDoCaixa({ searchParams }: PageProps<'/caixa'>) {
  const sessao = await requireAccountsAccess();
  const podeGerirContas = canManageCondominium(sessao.activeRole);

  const filtros = await searchParams;
  const texto = (chave: string) =>
    typeof filtros[chave] === 'string' ? (filtros[chave] as string) : undefined;

  const [posicao, lancamentos] = await Promise.all([
    api.cash.position(),
    api.cash.entries({
      BankAccountId: texto('conta'),
      Direction: texto('direcao') as 'In' | 'Out' | undefined,
      From: texto('de'),
      To: texto('ate'),
      Search: texto('busca'),
      PageSize: 40,
    }),
  ]);

  return (
    <>
      <CabecalhoDePagina
        titulo="Caixa"
        descricao="Saldo, extrato e lançamentos do condomínio"
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <Stat
          label="Saldo total"
          value={money(posicao.totalBalance)}
          tone="brand"
          hint="Soma de todas as contas ativas"
        />
        <Stat
          label="Caixa operacional"
          value={money(posicao.operatingBalance)}
          hint="Disponível para o custeio do mês"
        />
        <Stat
          label="Fundo de reserva"
          value={money(posicao.reserveFundBalance)}
          tone="info"
          hint="Destinação vinculada: obras e emergências"
        />
      </div>

      <Card className="mb-6">
        <CardHeader
          title="Contas"
          description="O saldo é sempre o valor de abertura mais os lançamentos — nunca um número guardado"
        />

        {posicao.accounts.length === 0 ? (
          <EmptyState
            title="Nenhuma conta cadastrada"
            description={
              podeGerirContas
                ? 'Cadastre abaixo a conta do condomínio, informando quanto já havia nela.'
                : 'Peça ao síndico para cadastrar a conta do condomínio.'
            }
          />
        ) : (
        <Table>
          <thead>
            <tr>
              <Th>Conta</Th>
              <Th>Tipo</Th>
              <Th>Banco</Th>
              <Th numeric>Saldo de abertura</Th>
              <Th numeric>Saldo atual</Th>
            </tr>
          </thead>
          <tbody>
            {posicao.accounts.map((conta) => (
              <tr key={conta.id}>
                <Td>
                  <span className="font-medium">{conta.name}</span>
                  {conta.isReserveFund ? (
                    <Badge tone="info" className="ml-2">
                      Fundo de reserva
                    </Badge>
                  ) : null}
                </Td>
                <Td className="text-ink-muted">{TIPO_DE_CONTA[conta.kind] ?? conta.kind}</Td>
                <Td className="text-ink-muted">
                  {conta.bankCode ? `${conta.bankCode} · ${conta.agency ?? ''}` : '—'}
                  {conta.accountNumber ? ` / ${conta.accountNumber}` : ''}
                </Td>
                <Td numeric className="text-ink-muted">
                  {money(conta.openingBalance)}
                </Td>
                <Td numeric className="font-semibold">
                  {money(conta.currentBalance)}
                </Td>
              </tr>
            ))}
          </tbody>
        </Table>
        )}

        {/*
          Editar fica junto da tabela, e nao numa tela separada, porque o campo
          que costuma precisar de correcao — o saldo ja existente — so faz
          sentido olhando para o saldo atual da linha de cima.
        */}
        {podeGerirContas ? (
          <div className="divide-y divide-line border-t border-line">
            {posicao.accounts.map((conta) => (
              <ContaComFormulario
                key={conta.id}
                conta={conta}
                rotulo={`Editar ${conta.name}`}
              />
            ))}

            <ContaComFormulario rotulo="Cadastrar nova conta" />
          </div>
        ) : null}
      </Card>

      <Card>
        <CardHeader
          title="Lançamentos"
          description={`${lancamentos.total} movimento(s) no filtro atual`}
        />

        <div className="border-b border-line px-5 py-4">
          <FiltroDeLancamentos contas={posicao.accounts} />
        </div>

        {lancamentos.items.length === 0 ? (
          <EmptyState
            title="Nenhum lançamento encontrado"
            description="Ajuste os filtros acima ou registre uma movimentação."
          />
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Data</Th>
                <Th>Competência</Th>
                <Th>Descrição</Th>
                <Th>Conta contábil</Th>
                <Th>Conta</Th>
                <Th numeric>Valor</Th>
              </tr>
            </thead>
            <tbody>
              {lancamentos.items.map((lancamento) => {
                const entrada = lancamento.direction === 'In';

                return (
                  <tr key={lancamento.id}>
                    <Td className="whitespace-nowrap text-ink-muted">{date(lancamento.date)}</Td>
                    <Td className="whitespace-nowrap text-ink-muted">
                      {competenceLabel(lancamento.competence)}
                    </Td>
                    <Td>
                      <span className="block max-w-xs truncate">{lancamento.description}</span>
                      {lancamento.isReconciled ? (
                        <span className="text-xs text-ink-subtle">Conciliado</span>
                      ) : null}
                    </Td>
                    <Td className="text-ink-muted">
                      {lancamento.ledgerAccountCode} · {lancamento.ledgerAccountName}
                    </Td>
                    <Td className="text-ink-muted">{lancamento.bankAccountName}</Td>
                    <Td numeric className={entrada ? 'text-positive' : 'text-negative'}>
                      {entrada ? '+' : '−'} {amount(lancamento.amount)}
                    </Td>
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
