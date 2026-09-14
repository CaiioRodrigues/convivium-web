'use client';

import { useActionState } from 'react';

import { estornarDespesa, pagarDespesa, type ResultadoDaAcao } from '@/lib/actions/financeiro';
import { Alert, Button, Select } from '@/components/ui';
import type { BankAccountSummary } from '@/lib/types';

const VAZIO: ResultadoDaAcao = {};

/** Dá baixa na despesa escolhendo de qual conta o dinheiro saiu. */
export function BotaoDePagar({
  despesaId,
  contas,
}: {
  despesaId: string;
  contas: BankAccountSummary[];
}) {
  const [estado, acao, enviando] = useActionState(pagarDespesa, VAZIO);

  return (
    <form action={acao} className="flex items-center justify-end gap-2">
      <input type="hidden" name="despesaId" value={despesaId} />

      <Select name="contaId" aria-label="Conta de origem" className="w-auto py-1.5 text-xs">
        {contas.map((conta) => (
          <option key={conta.id} value={conta.id}>
            {conta.name}
          </option>
        ))}
      </Select>

      <Button type="submit" disabled={enviando} className="py-1.5 text-xs whitespace-nowrap">
        {enviando ? '…' : 'Dar baixa'}
      </Button>

      {estado.erro ? (
        <span className="text-xs text-negative" role="alert">
          {estado.erro}
        </span>
      ) : null}
    </form>
  );
}

export function BotaoDeEstornar({ despesaId }: { despesaId: string }) {
  const [estado, acao, enviando] = useActionState(estornarDespesa, VAZIO);

  return (
    <form action={acao} className="flex items-center justify-end gap-2">
      <input type="hidden" name="despesaId" value={despesaId} />

      <Button type="submit" variant="ghost" disabled={enviando} className="py-1.5 text-xs">
        {enviando ? '…' : 'Estornar'}
      </Button>

      {estado.erro ? (
        <span className="text-xs text-negative" role="alert">
          {estado.erro}
        </span>
      ) : null}
    </form>
  );
}

/** Faixa de retorno usada no topo das telas que executam ações. */
export function Retorno({ estado }: { estado: ResultadoDaAcao }) {
  if (!estado.erro && !estado.sucesso) return null;

  return (
    <div className="mb-4">
      <Alert tone={estado.erro ? 'negative' : 'positive'}>{estado.erro ?? estado.sucesso}</Alert>
    </div>
  );
}
