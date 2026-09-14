import type { Metadata } from 'next';

import { api } from '@/lib/api';
import { requireFinanceAccess } from '@/lib/dal';
import { dateTime } from '@/lib/format';
import { STATUS_DO_EMAIL, TIPO_DE_EMAIL } from '@/lib/rotulos';
import { CabecalhoDePagina } from '@/components/cabecalho-de-pagina';
import { Alert, Badge, Card, CardHeader, EmptyState, Table, Td, Th } from '@/components/ui';

export const metadata: Metadata = { title: 'Avisos' };

export default async function PaginaDeNotificacoes() {
  await requireFinanceAccess();

  const fila = await api.notifications.list({ PageSize: 50 });

  const falhas = fila.items.filter((m) => m.status === 'Failed');
  const naFila = fila.items.filter((m) => m.status === 'Pending' || m.status === 'Sending');

  return (
    <>
      <CabecalhoDePagina
        titulo="Avisos por e-mail"
        descricao="Fila de saída: o que foi enviado aos moradores e o que falhou"
      />

      {falhas.length > 0 ? (
        <div className="mb-6">
          <Alert tone="negative" title={`${falhas.length} mensagem(ns) não entregue(s)`}>
            Depois de esgotar as tentativas, o envio para. Confira se o e-mail cadastrado está
            correto — um endereço errado aparece aqui, não na caixa do morador.
          </Alert>
        </div>
      ) : naFila.length > 0 ? (
        <div className="mb-6">
          <Alert tone="info">
            {naFila.length} mensagem(ns) aguardando envio. O disparo acontece em segundo plano.
          </Alert>
        </div>
      ) : null}

      <Card>
        <CardHeader title="Mensagens" description={`${fila.total} no histórico`} />

        {fila.items.length === 0 ? (
          <EmptyState
            title="Nenhum aviso enviado ainda"
            description="Ao publicar um rateio, use 'Enviar avisos' na tela de cobranças para notificar os moradores."
          />
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Destinatário</Th>
                <Th>Tipo</Th>
                <Th>Assunto</Th>
                <Th>Situação</Th>
                <Th>Enviado em</Th>
              </tr>
            </thead>
            <tbody>
              {fila.items.map((mensagem) => {
                const situacao = STATUS_DO_EMAIL[mensagem.status];

                return (
                  <tr key={mensagem.id}>
                    <Td>
                      <span className="block">{mensagem.toName ?? '—'}</span>
                      <span className="text-xs text-ink-subtle">{mensagem.toAddress}</span>
                    </Td>
                    <Td className="text-ink-muted">{TIPO_DE_EMAIL[mensagem.kind]}</Td>
                    <Td>
                      <span className="block max-w-xs truncate">{mensagem.subject}</span>
                      {mensagem.lastError ? (
                        <span className="block max-w-xs truncate text-xs text-negative">
                          {mensagem.lastError}
                        </span>
                      ) : null}
                    </Td>
                    <Td>
                      <Badge tone={situacao.tom}>{situacao.texto}</Badge>
                      {mensagem.attempts > 1 ? (
                        <span className="ml-1 text-xs text-ink-subtle">
                          {mensagem.attempts} tentativas
                        </span>
                      ) : null}
                    </Td>
                    <Td className="whitespace-nowrap text-ink-muted">
                      {mensagem.sentAt ? dateTime(mensagem.sentAt) : '—'}
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
