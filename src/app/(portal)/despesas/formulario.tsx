'use client';

import { useActionState } from 'react';

import { salvarDespesa, type ResultadoDaAcao } from '@/lib/actions/financeiro';
import { Retorno } from '@/app/(portal)/despesas/acoes';
import { Button, Field, Input, Select } from '@/components/ui';
import type { Expense, LedgerAccountNode, Supplier } from '@/lib/types';

const VAZIO: ResultadoDaAcao = {};

/**
 * Lancamento e correcao de uma despesa.
 *
 * As contas contabeis vem em arvore e sao achatadas aqui: so as folhas podem
 * receber lancamento, e o codigo na frente ("3.1.02 - Energia") mantem a ordem
 * do plano de contas legivel dentro de um `<select>`.
 */
export function FormularioDeDespesa({
  contas,
  fornecedores,
  despesa,
  competenciaPadrao,
}: {
  contas: LedgerAccountNode[];
  fornecedores: Supplier[];
  despesa?: Expense;
  competenciaPadrao: string;
}) {
  const [estado, acao, salvando] = useActionState(salvarDespesa, VAZIO);

  const folhas = achatar(contas);

  return (
    <form action={acao} className="grid gap-4 sm:grid-cols-6">
      {despesa ? <input type="hidden" name="despesaId" value={despesa.id} /> : null}

      <div className="sm:col-span-3">
        <Field label="Descrição">
          <Input
            name="descricao"
            defaultValue={despesa?.description ?? ''}
            placeholder="Cemig - agosto"
            required
          />
        </Field>
      </div>

      <div className="sm:col-span-3">
        <Field label="Conta contábil" hint="Decide onde a despesa aparece na prestação de contas">
          {/* `key`: o React só marca a opção padrão na montagem, então sem
              remontar a escolha voltaria para a primeira depois da action. */}
          <Select
            key={despesa?.ledgerAccountId ?? 'nova'}
            name="contaContabilId"
            defaultValue={despesa?.ledgerAccountId ?? ''}
            required
          >
            <option value="">Escolha a conta</option>
            {folhas.map((conta) => (
              <option key={conta.id} value={conta.id}>
                {conta.code} - {conta.name}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      <div className="sm:col-span-2">
        <Field label="Valor">
          <Input
            name="valor"
            inputMode="decimal"
            placeholder="1.378,07"
            defaultValue={
              despesa ? despesa.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : ''
            }
            required
          />
        </Field>
      </div>

      <div className="sm:col-span-2">
        <Field label="Vencimento">
          <Input type="date" name="vencimento" defaultValue={despesa?.dueDate ?? ''} required />
        </Field>
      </div>

      <div className="sm:col-span-2">
        <Field label="Competência" hint="O mês a que a despesa se refere">
          <Input
            name="competencia"
            placeholder="08/2026"
            defaultValue={despesa?.competence ?? competenciaPadrao}
          />
        </Field>
      </div>

      <div className="sm:col-span-2">
        <Field label="Fornecedor">
          <Select
            key={despesa?.supplierId ?? 'sem'}
            name="fornecedorId"
            defaultValue={despesa?.supplierId ?? ''}
          >
            <option value="">Sem fornecedor</option>
            {fornecedores.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      <div className="sm:col-span-2">
        <Field label="Documento" hint="Nota fiscal, contrato">
          <Input name="documento" defaultValue={despesa?.documentNumber ?? ''} />
        </Field>
      </div>

      <div className="flex items-end sm:col-span-2">
        <label className="flex items-center gap-2 pb-2 text-sm text-ink">
          <input
            type="checkbox"
            name="rateavel"
            defaultChecked={despesa?.isApportionable ?? true}
            className="size-4 accent-[var(--color-brand)]"
          />
          Entra no rateio
        </label>
      </div>

      <div className="sm:col-span-6">
        <Field label="Observações">
          <Input name="observacoes" defaultValue={despesa?.notes ?? ''} />
        </Field>
      </div>

      <div className="sm:col-span-6">
        <Button type="submit" disabled={salvando}>
          {salvando ? 'Salvando…' : despesa ? 'Salvar alterações' : 'Lançar despesa'}
        </Button>

        <Retorno estado={estado} />
      </div>
    </form>
  );
}

/**
 * So as folhas recebem lancamento; os grupos existem para somar.
 *
 * E so as de despesa entram na lista: oferecer "4.1 - Taxa Condominial" num
 * formulario de despesa e convidar o erro, e a API recusa depois de a pessoa
 * ja ter preenchido a tela inteira.
 */
function achatar(nos: LedgerAccountNode[]): LedgerAccountNode[] {
  return nos.flatMap((no) =>
    no.isGroup ? achatar(no.children) : no.nature === 'Expense' ? [no] : [],
  );
}
