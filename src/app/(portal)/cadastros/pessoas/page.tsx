import type { Metadata } from 'next';

import { api } from '@/lib/api';
import { requireAccountsAccess } from '@/lib/dal';
import { canManageCondominium } from '@/lib/roles';
import { count, dateTime, document as formatarDocumento } from '@/lib/format';
import { ROLE_LABEL } from '@/lib/roles';
import { CabecalhoDePagina } from '@/components/cabecalho-de-pagina';
import { Alert, Badge, Card, CardHeader, EmptyState, Table, Td, Th } from '@/components/ui';
import {
  BotaoDeConvite,
  BotaoDesativarPessoa,
  BotaoDesvincular,
  FormularioDePessoa,
  FormularioDeVinculo,
  SeletorDePapel,
} from '@/app/(portal)/cadastros/pessoas/formularios';

export const metadata: Metadata = { title: 'Pessoas' };

const RELACAO: Record<string, string> = {
  Owner: 'proprietário',
  Tenant: 'inquilino',
  Occupant: 'morador',
};

export default async function PaginaDePessoas() {
  const sessao = await requireAccountsAccess();
  const podeEditar = canManageCondominium(sessao.activeRole);

  const [pessoas, unidades] = await Promise.all([
    api.people.list({ IncludeInactive: true }),
    api.units.list(false),
  ]);

  const semEmail = pessoas.filter((p) => p.isActive && !p.email);
  const semAcesso = pessoas.filter((p) => p.isActive && p.email && !p.canSignIn);

  return (
    <>
      <CabecalhoDePagina
        titulo="Pessoas"
        descricao={`${count(pessoas.filter((p) => p.isActive).length)} ativas no condomínio`}
      />

      {semEmail.length > 0 || semAcesso.length > 0 ? (
        <div className="mb-6 space-y-3">
          {semEmail.length > 0 ? (
            <Alert tone="warning" title={`${semEmail.length} pessoa(s) sem e-mail`}>
              A cobrança das unidades delas sai sem destinatário. Preencha o e-mail para o boleto
              chegar sozinho.
            </Alert>
          ) : null}

          {semAcesso.length > 0 ? (
            <Alert tone="info" title={`${semAcesso.length} pessoa(s) ainda sem acesso ao portal`}>
              Envie o convite: a pessoa escolhe a própria senha por um link que vale 7 dias. O
              sistema nunca manda senha por e-mail.
            </Alert>
          ) : null}
        </div>
      ) : null}

      {podeEditar ? (
        <Card className="mb-6">
          <CardHeader
            title="Nova pessoa"
            description="Quem já existe em outro condomínio é reaproveitada, mantendo o login"
          />
          <div className="px-5 py-4">
            <FormularioDePessoa unidades={unidades.units} />
          </div>
        </Card>
      ) : null}

      <Card>
        <CardHeader title="Cadastradas" />

        {pessoas.length === 0 ? (
          <EmptyState title="Ninguém cadastrado ainda" />
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Pessoa</Th>
                <Th>Papel</Th>
                <Th>Unidades</Th>
                <Th>Acesso</Th>
                {podeEditar ? <Th numeric>Ação</Th> : null}
              </tr>
            </thead>
            <tbody>
              {pessoas.map((pessoa) => (
                <tr key={pessoa.id} className={pessoa.isActive ? undefined : 'opacity-60'}>
                  <Td>
                    <span className="font-medium">{pessoa.name}</span>
                    {!pessoa.isActive ? (
                      <Badge tone="neutral" className="ml-2">
                        Desativada
                      </Badge>
                    ) : null}
                    <span className="block text-xs text-ink-subtle">
                      {pessoa.email ?? 'sem e-mail'}
                      {pessoa.cpf ? ` · ${formatarDocumento(pessoa.cpf)}` : ''}
                    </span>
                  </Td>

                  <Td>
                    {podeEditar && pessoa.isActive ? (
                      <SeletorDePapel pessoaId={pessoa.id} papel={pessoa.role} />
                    ) : (
                      <span className="text-sm text-ink-muted">{ROLE_LABEL[pessoa.role]}</span>
                    )}
                  </Td>

                  <Td>
                    {pessoa.units.length === 0 ? (
                      <span className="text-xs text-ink-subtle">nenhuma</span>
                    ) : (
                      <ul className="space-y-0.5">
                        {pessoa.units.map((vinculo) => (
                          <li key={vinculo.occupancyId} className="text-sm">
                            {vinculo.unitIdentifier}
                            <span className="text-xs text-ink-subtle">
                              {' '}
                              · {RELACAO[vinculo.relation] ?? vinculo.relation}
                              {/* Curto de propósito: repetido em toda linha, o texto
                                  inteiro empurrava a coluna de ações para fora da tela. */}
                              {vinculo.isBillingResponsible ? ' · cobrança' : ''}
                            </span>
                            {podeEditar ? (
                              <>
                                {' '}
                                <BotaoDesvincular vinculoId={vinculo.occupancyId} />
                              </>
                            ) : null}
                          </li>
                        ))}
                      </ul>
                    )}

                    {podeEditar && pessoa.isActive && unidades.units.length > 0 ? (
                      /*
                        Colapsado de propósito. Aberto em todas as linhas, o
                        formulário de três campos multiplicava a altura da
                        tabela por pessoa e a lista de 28 moradores virava uma
                        página de rolagem infinita.
                      */
                      <details className="mt-1.5 group">
                        <summary className="cursor-pointer list-none text-xs text-brand underline underline-offset-2 marker:content-[''] hover:text-brand-strong">
                          <span className="group-open:hidden">+ vincular unidade</span>
                          <span className="hidden group-open:inline">cancelar</span>
                        </summary>

                        <div className="mt-2">
                          <FormularioDeVinculo pessoaId={pessoa.id} unidades={unidades.units} />
                        </div>
                      </details>
                    ) : null}
                  </Td>

                  <Td>
                    {pessoa.canSignIn ? (
                      <>
                        <Badge tone="positive">Ativo</Badge>
                        <span className="mt-0.5 block text-xs text-ink-subtle">
                          {pessoa.lastLoginAt
                            ? `último acesso ${dateTime(pessoa.lastLoginAt)}`
                            : 'nunca entrou'}
                        </span>
                      </>
                    ) : pessoa.hasPendingInvite ? (
                      <Badge tone="info">Convite enviado</Badge>
                    ) : (
                      <Badge tone="neutral">Sem acesso</Badge>
                    )}

                    {podeEditar && pessoa.isActive && pessoa.email ? (
                      <div className="mt-2">
                        <BotaoDeConvite
                          pessoaId={pessoa.id}
                          temAcesso={pessoa.canSignIn}
                          convitePendente={pessoa.hasPendingInvite}
                        />
                      </div>
                    ) : null}
                  </Td>

                  {podeEditar ? (
                    <Td numeric>
                      {pessoa.isActive ? <BotaoDesativarPessoa pessoaId={pessoa.id} /> : null}
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
