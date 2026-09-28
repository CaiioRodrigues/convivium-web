'use client';

import { useActionState } from 'react';

import { receberCobranca, type ResultadoDaAcao } from '@/lib/actions/financeiro';
import { Button, Input, Select } from '@/components/ui';
import type { BankAccountSummary } from '@/lib/types';

const VAZIO: ResultadoDaAcao = {};

/**
 * Dá baixa numa cobrança direto da lista de boletos.
 *
 * O síndico abre o aplicativo do banco, vê os PIX que caíram, e vem aqui
 * marcar um por um. Por isso o formulário é uma linha só, com o valor já
 * preenchido: o caso comum é receber exatamente o que foi cobrado, e nesse
 * caso o trabalho é escolher a conta e apertar o botão.
 */
export function BotaoDeReceber({
  cobrancaId,
  valorSugerido,
  contas,
}: {
  cobrancaId: string;
  /** Total com multa e juros, que é o que o morador deve hoje. */
  valorSugerido: number;
  contas: BankAccountSummary[];
}) {
  const [estado, acao, enviando] = useActionState(receberCobranca, VAZIO);

  return (
    <form action={acao} className="flex items-center justify-end gap-1.5">
      <input type="hidden" name="cobrancaId" value={cobrancaId} />

      {/* Editável porque pagamento parcial acontece: o morador paga a cota e
          deixa a multa para o mês seguinte. */}
      <Input
        name="valor"
        type="text"
        inputMode="decimal"
        aria-label="Valor recebido"
        defaultValue={valorSugerido.toFixed(2).replace('.', ',')}
        className="w-24 py-1.5 text-right text-xs"
      />

      <Select name="contaId" aria-label="Conta de destino" className="w-auto py-1.5 text-xs">
        {contas.map((conta) => (
          <option key={conta.id} value={conta.id}>
            {conta.name}
          </option>
        ))}
      </Select>

      <Button type="submit" disabled={enviando} className="py-1.5 text-xs whitespace-nowrap">
        {enviando ? '…' : 'Receber'}
      </Button>

      {estado.erro ? (
        <span className="text-xs text-negative" role="alert">
          {estado.erro}
        </span>
      ) : null}
    </form>
  );
}
