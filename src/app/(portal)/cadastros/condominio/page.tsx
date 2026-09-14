import type { Metadata } from 'next';

import { api } from '@/lib/api';
import { requireAccountsAccess } from '@/lib/dal';
import { canManageCondominium } from '@/lib/roles';
import { count } from '@/lib/format';
import { CabecalhoDePagina } from '@/components/cabecalho-de-pagina';
import { Alert, Card, CardHeader } from '@/components/ui';
import { FormularioDoCondominio } from '@/app/(portal)/cadastros/condominio/formulario';

export const metadata: Metadata = { title: 'Condomínio' };

export default async function PaginaDoCondominio() {
  const sessao = await requireAccountsAccess();
  const podeEditar = canManageCondominium(sessao.activeRole);

  const condominio = await api.condominium.get();

  const fracaoFecha = Math.abs(condominio.idealFractionSum - 1) <= 0.0001;

  return (
    <>
      <CabecalhoDePagina
        titulo="Condomínio"
        descricao="Cadastro, endereço, chave PIX e parâmetros de cobrança"
      />

      {!fracaoFecha ? (
        <div className="mb-6">
          <Alert tone="warning" title="A soma das frações ideais não fecha em 1">
            Está em {condominio.idealFractionSum}. Enquanto não fechar, o rateio cobra a mais ou
            a menos de todas as {count(condominio.activeUnitCount)} unidades ativas. Ajuste em
            Unidades.
          </Alert>
        </div>
      ) : null}

      {!podeEditar ? (
        <div className="mb-6">
          <Alert tone="info">
            Você tem acesso de leitura. Só o síndico ou a administradora podem alterar estes dados.
          </Alert>
        </div>
      ) : null}

      <Card>
        <CardHeader
          title={condominio.name}
          description={`${count(condominio.activeUnitCount)} unidades ativas de ${count(condominio.unitCount)}`}
        />
        <div className="px-5 py-5">
          {podeEditar ? (
            <FormularioDoCondominio condominio={condominio} />
          ) : (
            <dl className="grid gap-4 sm:grid-cols-2">
              <div>
                <dt className="text-xs tracking-wide text-ink-subtle uppercase">Endereço</dt>
                <dd className="mt-1 text-sm text-ink">
                  {condominio.address.street}, {condominio.address.number} —{' '}
                  {condominio.address.district}, {condominio.address.city}/
                  {condominio.address.state}
                </dd>
              </div>
              <div>
                <dt className="text-xs tracking-wide text-ink-subtle uppercase">Cobrança</dt>
                <dd className="mt-1 text-sm text-ink">
                  Vence dia {condominio.billing.dueDay} · fundo de reserva{' '}
                  {(condominio.billing.reserveFundRate * 100).toFixed(0)}% · multa{' '}
                  {(condominio.billing.lateFeeRate * 100).toFixed(0)}% · juros{' '}
                  {(condominio.billing.monthlyInterestRate * 100).toFixed(0)}% ao mês
                </dd>
              </div>
            </dl>
          )}
        </div>
      </Card>
    </>
  );
}
