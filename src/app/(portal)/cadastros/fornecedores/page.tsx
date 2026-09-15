import type { Metadata } from 'next';

import { api } from '@/lib/api';
import { requireAccountsAccess } from '@/lib/dal';
import { canManageFinance } from '@/lib/roles';
import { count, document as formatarDocumento } from '@/lib/format';
import { CabecalhoDePagina } from '@/components/cabecalho-de-pagina';
import { LinkDeCancelar, LinkDeEdicao } from '@/components/link-de-edicao';
import { Card, CardHeader, EmptyState, Table, Td, Th } from '@/components/ui';
import {
  BotaoDesativarFornecedor,
  FormularioDeFornecedor,
} from '@/app/(portal)/cadastros/fornecedores/formularios';

export const metadata: Metadata = { title: 'Fornecedores' };

export default async function PaginaDeFornecedores({
  searchParams,
}: PageProps<'/cadastros/fornecedores'>) {
  const sessao = await requireAccountsAccess();
  const podeEditar = canManageFinance(sessao.activeRole);

  const filtros = await searchParams;

  const fornecedores = await api.suppliers.list();

  const emEdicao =
    typeof filtros.editar === 'string'
      ? (fornecedores.find((f) => f.id === filtros.editar) ?? null)
      : null;

  return (
    <>
      <CabecalhoDePagina
        titulo="Fornecedores"
        descricao="Concessionárias e prestadores de serviço do condomínio"
      />

      {podeEditar ? (
        <Card className="mb-6" id="formulario">
          <CardHeader
            title={emEdicao ? `Editar ${emEdicao.name}` : 'Novo fornecedor'}
            action={emEdicao ? <LinkDeCancelar href="/cadastros/fornecedores" /> : undefined}
          />
          <div className="px-5 py-4">
            {/* O `key` remonta o formulário ao trocar de fornecedor; sem ele os
                campos guardariam os dados do anterior. */}
            <FormularioDeFornecedor
              key={emEdicao?.id ?? 'novo'}
              fornecedor={emEdicao ?? undefined}
            />
          </div>
        </Card>
      ) : null}

      <Card>
        <CardHeader title="Cadastrados" description={`${count(fornecedores.length)} ativo(s)`} />

        {fornecedores.length === 0 ? (
          <EmptyState
            title="Nenhum fornecedor cadastrado"
            description="Cadastre a CEMIG, a COPASA e os prestadores para as despesas saírem identificadas."
          />
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Nome</Th>
                <Th>CNPJ / CPF</Th>
                <Th>Contato</Th>
                <Th numeric>Despesas</Th>
                {podeEditar ? <Th numeric>Ação</Th> : null}
              </tr>
            </thead>
            <tbody>
              {fornecedores.map((fornecedor) => (
                <tr key={fornecedor.id}>
                  <Td className="font-medium">{fornecedor.name}</Td>
                  <Td className="text-ink-muted">
                    {fornecedor.document ? formatarDocumento(fornecedor.document) : '—'}
                  </Td>
                  <Td className="text-ink-muted">
                    {fornecedor.email ?? '—'}
                    {fornecedor.phone ? (
                      <span className="block text-xs text-ink-subtle">{fornecedor.phone}</span>
                    ) : null}
                  </Td>
                  <Td numeric className="text-ink-muted">
                    {count(fornecedor.expenseCount)}
                  </Td>
                  {podeEditar ? (
                    <Td numeric>
                      <div className="flex items-center justify-end gap-3">
                        <LinkDeEdicao
                          href={`/cadastros/fornecedores?editar=${fornecedor.id}#formulario`}
                          rotulo={`Editar ${fornecedor.name}`}
                        />
                        <BotaoDesativarFornecedor fornecedorId={fornecedor.id} />
                      </div>
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
