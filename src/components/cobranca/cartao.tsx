import { PixCopiaECola } from '@/components/cobranca/pix';
import { Badge, Card, Td, Table, Th } from '@/components/ui';
import { competenceLabel, date, money } from '@/lib/format';
import { ITEM_DA_COBRANCA, STATUS_DA_COBRANCA } from '@/lib/rotulos';
import type { Charge } from '@/lib/types';

/**
 * Uma cobrança por inteiro. Serve tanto a página do morador autenticado
 * quanto o link público do e-mail, então não assume que existe sessão.
 *
 * `urlDoPdf` é injetada porque o caminho difere nos dois casos: por id para
 * quem está autenticado, por token no link público.
 */
export function CartaoDeCobranca({
  cobranca,
  urlDoPdf,
  urlDaImagem,
}: {
  cobranca: Charge;
  urlDoPdf: string;
  /** Mesmo boleto em PNG. Opcional: nem toda tela precisa oferecer. */
  urlDaImagem?: string;
}) {
  const status = STATUS_DA_COBRANCA[cobranca.status];
  const quitada = cobranca.status === 'Paid';
  const temEncargos = cobranca.lateFee + cobranca.interest > 0;

  const aPagar = quitada ? cobranca.totalAmount : cobranca.totalWithLateCharges;

  return (
    <Card className="overflow-hidden">
      <header className="flex flex-wrap items-start justify-between gap-3 border-b border-line px-5 py-4">
        <div>
          <p className="text-sm text-ink-muted">Unidade {cobranca.unitIdentifier}</p>
          <h2 className="text-lg font-semibold text-ink">
            {competenceLabel(cobranca.competence)}
          </h2>
          <p className="mt-0.5 text-sm text-ink-muted">
            Vencimento em {date(cobranca.dueDate)}
            {cobranca.daysLate > 0 && !quitada
              ? ` · ${cobranca.daysLate} dia(s) de atraso`
              : null}
          </p>
        </div>
        <Badge tone={status.tom}>{status.texto}</Badge>
      </header>

      <div className="px-5 py-4">
        <p className="text-xs font-medium tracking-wide text-ink-subtle uppercase">
          {quitada ? 'Valor pago' : 'Total a pagar'}
        </p>
        <p
          className={`tabular mt-1 text-3xl font-semibold ${
            quitada ? 'text-positive' : cobranca.status === 'Overdue' ? 'text-negative' : 'text-brand'
          }`}
        >
          {money(aPagar)}
        </p>

        {temEncargos && !quitada ? (
          <p className="mt-1 text-sm text-ink-muted">
            Inclui {money(cobranca.lateFee)} de multa e {money(cobranca.interest)} de juros.
          </p>
        ) : null}

        {cobranca.paidAmount > 0 && !quitada ? (
          <p className="mt-1 text-sm text-ink-muted">
            Já recebemos {money(cobranca.paidAmount)} desta cobrança.
          </p>
        ) : null}
      </div>

      <Table>
        <thead>
          <tr>
            <Th>Composição</Th>
            <Th numeric>Valor</Th>
          </tr>
        </thead>
        <tbody>
          {cobranca.items.map((item) => (
            <tr key={item.id}>
              <Td>
                <span className="block">{item.description}</span>
                <span className="text-xs text-ink-subtle">{ITEM_DA_COBRANCA[item.kind]}</span>
              </Td>
              <Td numeric>{money(item.amount)}</Td>
            </tr>
          ))}

          {temEncargos && !quitada ? (
            <>
              <tr>
                <Td className="text-ink-muted">Multa por atraso</Td>
                <Td numeric className="text-negative">
                  {money(cobranca.lateFee)}
                </Td>
              </tr>
              <tr>
                <Td className="text-ink-muted">Juros de mora</Td>
                <Td numeric className="text-negative">
                  {money(cobranca.interest)}
                </Td>
              </tr>
            </>
          ) : null}
        </tbody>
      </Table>

      <div className="space-y-4 px-5 py-4">
        {!quitada && cobranca.pixPayload ? (
          <PixCopiaECola payload={cobranca.pixPayload} />
        ) : null}

        <div className="flex flex-wrap gap-2">
          <a
            href={urlDoPdf}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-lg border border-line-strong bg-surface px-4 py-2 text-sm font-medium text-ink transition-colors hover:bg-surface-muted"
          >
            Abrir boleto em PDF
          </a>

          {/* A imagem existe para repassar: e o formato que o WhatsApp abre
              na conversa, com o QR Code a vista. */}
          {urlDaImagem ? (
            <a
              href={urlDaImagem}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-lg border border-line-strong bg-surface px-4 py-2 text-sm font-medium text-ink transition-colors hover:bg-surface-muted"
            >
              Ver como imagem
            </a>
          ) : null}
        </div>
      </div>
    </Card>
  );
}
