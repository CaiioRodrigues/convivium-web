import type { Metadata } from 'next';

import { api } from '@/lib/api';
import { requireAccountsAccess } from '@/lib/dal';
import { canManageFinance } from '@/lib/roles';
import { count, document as formatarDocumento } from '@/lib/format';
import { CabecalhoDePagina } from '@/components/cabecalho-de-pagina';
import { Card, CardHeader, EmptyState, Table, Td, Th } from '@/components/ui';
import {
  BotaoDesativarFornecedor,
  FormularioDeFornecedor,
} from '@/app/(portal)/cadastros/fornecedores/formularios';

export const metadata: Metadata = { title: 'Fornecedores' };

export default async function PaginaDeFornecedores() {
  const sessao = await requireAccountsAccess();
  const podeEditar = canManageFinance(sessao.activeRole);

  const fornecedores = await api.suppliers.list();

  return (
    <>
      <CabecalhoDePagina
        titulo="Fornecedores"
        descricao="Concessionárias e prestadores de serviço do condomínio"
      />

      {podeEditar ? (
        <Card className="mb-6">
          <CardHeader title="Novo fornecedor" />
          <div className="px-5 py-4">
            <FormularioDeFornecedor />
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
                      <BotaoDesativarFornecedor fornecedorId={fornecedor.id} />
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
