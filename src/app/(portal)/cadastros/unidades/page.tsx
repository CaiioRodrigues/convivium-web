import type { Metadata } from 'next';

import { api } from '@/lib/api';
import { requireAccountsAccess } from '@/lib/dal';
import { canManageCondominium } from '@/lib/roles';
import { amount, count, money, percent } from '@/lib/format';
import { CabecalhoDePagina } from '@/components/cabecalho-de-pagina';
import { Alert, Badge, Card, CardHeader, EmptyState, Table, Td, Th } from '@/components/ui';
import {
  BotaoDesativarUnidade,
  BotaoRecalcularFracoes,
  FormularioDeUnidade,
} from '@/app/(portal)/cadastros/unidades/formularios';

export const metadata: Metadata = { title: 'Unidades' };

const TIPO_DE_UNIDADE: Record<string, string> = {
  Apartment: 'Apartamento',
  House: 'Casa',
  Store: 'Loja',
  Room: 'Sala',
  ParkingSpot: 'Vaga',
  Storage: 'Depósito',
};

const RELACAO: Record<string, string> = {
  Owner: 'proprietário',
  Tenant: 'inquilino',
  Occupant: 'morador',
};

export default async function PaginaDeUnidades() {
  const sessao = await requireAccountsAccess();
  const podeEditar = canManageCondominium(sessao.activeRole);

  const lista = await api.units.list();

  return (
    <>
      <CabecalhoDePagina
        titulo="Unidades"
        descricao={`${count(lista.units.filter((u) => u.isActive).length)} ativas de ${count(lista.units.length)}`}
      />

      {/*
        A soma das frações fica no topo de propósito: é o número que decide se
        o rateio vai cobrar o valor certo, e ele só apareceria no fechamento
        do mês se ficasse escondido numa coluna.
      */}
      <Card className="mb-6">
        <div className="flex flex-wrap items-center justify-between gap-4 px-5 py-4">
          <div>
            <p className="text-xs font-medium tracking-wide text-ink-subtle uppercase">
              Soma das frações ideais
            </p>
            <p
              className={`tabular mt-1 text-2xl font-semibold ${
                lista.idealFractionIsBalanced ? 'text-positive' : 'text-negative'
              }`}
            >
              {lista.idealFractionSum}
              <span className="ml-2 text-sm font-normal text-ink-muted">
                {lista.idealFractionIsBalanced ? 'fecha em 1' : 'deveria fechar em 1'}
              </span>
            </p>
          </div>

          {podeEditar ? <BotaoRecalcularFracoes /> : null}
        </div>

        {lista.warnings.length > 0 ? (
          <div className="border-t border-line px-5 py-4">
            <Alert tone="warning" title="Confira antes do próximo rateio">
              <ul className="mt-1 list-disc space-y-0.5 pl-4">
                {lista.warnings.map((aviso) => (
                  <li key={aviso}>{aviso}</li>
                ))}
              </ul>
            </Alert>
          </div>
        ) : null}
      </Card>

      {podeEditar ? (
        <Card className="mb-6">
          <CardHeader
            title="Nova unidade"
            description="O bloco pode ser criado junto, sem cadastro em dois passos"
          />
          <div className="px-5 py-4">
            <FormularioDeUnidade blocos={lista.blocks} />
          </div>
        </Card>
      ) : null}

      <Card>
        <CardHeader
          title="Cadastradas"
          description={
            lista.blocks.length > 0
              ? lista.blocks.map((b) => `${b.name} (${b.unitCount})`).join(' · ')
              : 'Sem blocos cadastrados'
          }
        />

        {lista.units.length === 0 ? (
          <EmptyState
            title="Nenhuma unidade cadastrada"
            description="Cadastre as unidades para conseguir fechar o rateio do mês."
          />
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Unidade</Th>
                <Th>Tipo</Th>
                <Th numeric>Área</Th>
                <Th numeric>Fração ideal</Th>
                <Th>Moradores</Th>
                <Th numeric>Em aberto</Th>
                {podeEditar ? <Th numeric>Ação</Th> : null}
              </tr>
            </thead>
            <tbody>
              {lista.units.map((unidade) => (
                <tr key={unidade.id} className={unidade.isActive ? undefined : 'opacity-60'}>
                  <Td>
                    <span className="font-medium">{unidade.fullIdentifier}</span>
                    {!unidade.isActive ? (
                      <Badge tone="neutral" className="ml-2">
                        Fora do rateio
                      </Badge>
                    ) : null}
                    {unidade.floor !== null ? (
                      <span className="block text-xs text-ink-subtle">
                        {unidade.floor}º andar
                      </span>
                    ) : null}
                  </Td>
                  <Td className="text-ink-muted">
                    {TIPO_DE_UNIDADE[unidade.kind] ?? unidade.kind}
                  </Td>
                  <Td numeric className="text-ink-muted">
                    {unidade.areaM2 !== null ? `${amount(unidade.areaM2)} m²` : '—'}
                  </Td>
                  <Td numeric className={unidade.idealFraction <= 0 ? 'text-negative' : undefined}>
                    {unidade.idealFraction <= 0 ? 'não definida' : percent(unidade.idealFraction, 4)}
                  </Td>
                  <Td>
                    {unidade.occupants.length === 0 ? (
                      <span className="text-xs text-warning">sem morador vinculado</span>
                    ) : (
                      <ul className="space-y-0.5">
                        {unidade.occupants.map((ocupante) => (
                          <li key={ocupante.occupancyId} className="text-sm">
                            {ocupante.name}
                            <span className="text-xs text-ink-subtle">
                              {' '}
                              · {RELACAO[ocupante.relation] ?? ocupante.relation}
                              {/* Curto de propósito: repetido em toda linha, o texto
                                  inteiro empurrava a coluna de ações para fora da tela. */}
                              {ocupante.isBillingResponsible ? ' · cobrança' : ''}
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </Td>
                  <Td numeric className={unidade.outstandingAmount > 0 ? 'text-negative' : 'text-ink-muted'}>
                    {unidade.outstandingAmount > 0 ? money(unidade.outstandingAmount) : '—'}
                  </Td>
                  {podeEditar ? (
                    <Td numeric>
                      {unidade.isActive ? (
                        <BotaoDesativarUnidade unidadeId={unidade.id} />
                      ) : null}
                    </Td>
                  ) : null}
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>
    </>
  );
}
