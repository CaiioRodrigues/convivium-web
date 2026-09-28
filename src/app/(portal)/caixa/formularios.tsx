'use client';

import { useActionState, useState } from 'react';

import { salvarConta, type ResultadoDoCadastro } from '@/lib/actions/cadastros';
import { lancarNoCaixa, type ResultadoDaAcao } from '@/lib/actions/financeiro';
import { RetornoDaAcao } from '@/components/retorno-da-acao';
import { Button, Field, Input, Select } from '@/components/ui';
import type { BankAccountSummary, LedgerAccountNode } from '@/lib/types';

const VAZIO: ResultadoDoCadastro = {};
const VAZIO_FINANCEIRO: ResultadoDaAcao = {};

/**
 * Uma conta dobrada num expansor, com o formulario dentro.
 *
 * E um `<details>` de verdade, e nao um botao com estado so no React, porque
 * assim o formulario continua alcancavel sem JavaScript — do mesmo jeito que
 * as Server Actions deste projeto continuam gravando por submit nativo.
 *
 * O `open` e controlado para os dois nao divergirem: quando a action termina,
 * o `revalidatePath` re-renderiza a pagina, e um `<details>` que guarda o
 * estado so no DOM voltaria fechado, levando junto a confirmacao de "salvo".
 */
export function ContaComFormulario({
  conta,
  rotulo,
}: {
  conta?: BankAccountSummary;
  rotulo: string;
}) {
  const [aberto, setAberto] = useState(false);

  return (
    <details
      open={aberto}
      onToggle={(evento) => setAberto(evento.currentTarget.open)}
      className="px-5 py-3"
    >
      <summary className="cursor-pointer text-sm font-medium text-brand">{rotulo}</summary>
      <div className="pt-4 pb-2">
        <FormularioDeConta conta={conta} />
      </div>
    </details>
  );
}

/**
 * Cadastro e correcao de uma conta do caixa.
 *
 * O campo que importa aqui e o saldo de abertura. Um condominio que ja existia
 * antes do sistema tem dinheiro em conta, e esse dinheiro precisa entrar sem
 * virar receita do mes — por isso ele e um campo da conta, e nao um lancamento.
 */
export function FormularioDeConta({ conta }: { conta?: BankAccountSummary }) {
  const [estado, acao, salvando] = useActionState(salvarConta, VAZIO);
  // Volta com o que foi digitado quando a gravação falha (ver ResultadoDoCadastro).
  const digitado = estado.valores ?? {};

  const hoje = new Date().toISOString().slice(0, 10);

  return (
    <form action={acao} className="grid gap-4 sm:grid-cols-6">
      {conta ? <input type="hidden" name="contaId" value={conta.id} /> : null}

      <div className="sm:col-span-3">
        <Field label="Nome da conta" hint="Ex.: Conta Corrente Itaú, Dinheiro em espécie">
          <Input
            name="nome"
            defaultValue={digitado.nome ?? conta?.name ?? ''}
            required
            autoComplete="off"
          />
        </Field>
      </div>

      <div className="sm:col-span-3">
        <Field label="Tipo">
          {/*
            O `key` remonta o campo quando a action termina: um `<select>` só
            recebe o valor padrão na montagem, então sem ele a escolha voltaria
            silenciosamente para a primeira opção depois de um erro.
          */}
          <Select
            key={digitado.tipo ?? conta?.kind ?? 'Checking'}
            name="tipo"
            defaultValue={digitado.tipo ?? conta?.kind ?? 'Checking'}
          >
            <option value="Checking">Conta corrente</option>
            <option value="Savings">Poupança</option>
            <option value="Investment">Aplicação</option>
            <option value="Cash">Dinheiro em espécie</option>
          </Select>
        </Field>
      </div>

      <div className="sm:col-span-3">
        <Field
          label="Saldo já existente"
          hint="Quanto havia nesta conta quando o condomínio entrou no sistema"
        >
          <Input
            name="saldoInicial"
            inputMode="decimal"
            placeholder="20.000,00"
            defaultValue={
              digitado.saldoInicial ??
              (conta ? conta.openingBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : '')
            }
          />
        </Field>
      </div>

      <div className="sm:col-span-3">
        <Field label="Na data de" hint="A partir daqui o extrato é do sistema">
          <Input
            type="date"
            name="dataInicial"
            defaultValue={digitado.dataInicial ?? hoje}
          />
        </Field>
      </div>

      <div className="sm:col-span-2">
        <Field label="Banco" hint="Código, ex.: 341">
          <Input name="banco" defaultValue={digitado.banco ?? conta?.bankCode ?? ''} />
        </Field>
      </div>

      <div className="sm:col-span-2">
        <Field label="Agência">
          <Input name="agencia" defaultValue={digitado.agencia ?? conta?.agency ?? ''} />
        </Field>
      </div>

      <div className="sm:col-span-2">
        <Field label="Conta">
          <Input name="numero" defaultValue={digitado.numero ?? conta?.accountNumber ?? ''} />
        </Field>
      </div>

      <div className="flex flex-wrap items-center gap-6 sm:col-span-6">
        <label className="flex items-center gap-2 text-sm text-ink">
          <input
            type="checkbox"
            name="fundoDeReserva"
            defaultChecked={conta?.isReserveFund ?? false}
            className="size-4 rounded border-line-strong"
          />
          É o fundo de reserva
        </label>

        {conta ? (
          <label className="flex items-center gap-2 text-sm text-ink">
            <input
              type="checkbox"
              name="ativa"
              defaultChecked={conta.isActive}
              className="size-4 rounded border-line-strong"
            />
            Conta ativa
          </label>
        ) : null}
      </div>

      <div className="sm:col-span-6">
        <Button type="submit" disabled={salvando}>
          {salvando ? 'Salvando…' : conta ? 'Salvar alterações' : 'Cadastrar conta'}
        </Button>

        <RetornoDaAcao estado={estado} />
      </div>
    </form>
  );
}

/**
 * Lançamento avulso: o dinheiro que não nasce de cobrança nem de despesa.
 *
 * Rendimento de poupança, tarifa do banco, reembolso de fornecedor, aporte
 * do síndico. Sem esta tela, tudo isso ficava de fora e o saldo do sistema
 * deixava de bater com o extrato — que é justamente o número que o conselho
 * confere.
 *
 * Mesmo `<details>` controlado do formulário de conta acima, pelo mesmo
 * motivo: sem ele, o `revalidatePath` fecharia o expansor e levaria junto a
 * confirmação de que salvou.
 */
export function NovoLancamento({ contas, plano }: { contas: BankAccountSummary[]; plano: LedgerAccountNode[] }) {
  const [aberto, setAberto] = useState(false);
  const [estado, acao, enviando] = useActionState(lancarNoCaixa, VAZIO_FINANCEIRO);

  const folhas = achatarTodas(plano);
  const hoje = new Date().toISOString().slice(0, 10);

  return (
    <details
      open={aberto}
      onToggle={(evento) => setAberto(evento.currentTarget.open)}
      className="border-t border-line"
    >
      <summary className="cursor-pointer px-5 py-3 text-sm font-medium text-brand select-none">
        Novo lançamento
      </summary>

      <form action={acao} className="grid gap-4 px-5 pb-5 sm:grid-cols-6">
        <div className="sm:col-span-2">
          <Field label="Tipo">
            <Select name="direcao" defaultValue="Out">
              <option value="In">Entrada</option>
              <option value="Out">Saída</option>
            </Select>
          </Field>
        </div>

        <div className="sm:col-span-2">
          <Field label="Conta bancária">
            <Select name="contaId" required>
              {contas.map((conta) => (
                <option key={conta.id} value={conta.id}>
                  {conta.name}
                </option>
              ))}
            </Select>
          </Field>
        </div>

        <div className="sm:col-span-2">
          <Field label="Data">
            <Input name="data" type="date" defaultValue={hoje} required />
          </Field>
        </div>

        <div className="sm:col-span-3">
          <Field label="Descrição" hint="O que aparece no extrato e no balancete">
            <Input name="descricao" placeholder="Rendimento da poupança" required />
          </Field>
        </div>

        <div className="sm:col-span-3">
          <Field label="Conta contábil">
            <Select name="contaContabilId" required>
              {folhas.map((no) => (
                <option key={no.id} value={no.id}>
                  {no.code} · {no.name}
                </option>
              ))}
            </Select>
          </Field>
        </div>

        <div className="sm:col-span-2">
          <Field label="Valor (R$)">
            <Input name="valor" type="text" inputMode="decimal" placeholder="0,00" required />
          </Field>
        </div>

        <div className="sm:col-span-2">
          <Field label="Documento" hint="Opcional">
            <Input name="documento" placeholder="NF 1234" />
          </Field>
        </div>

        <div className="flex items-end sm:col-span-2">
          <Button type="submit" disabled={enviando} className="w-full">
            {enviando ? 'Lançando…' : 'Lançar'}
          </Button>
        </div>

        <div className="sm:col-span-6">
          <RetornoDaAcao estado={estado} />
        </div>
      </form>
    </details>
  );
}

/**
 * Só as folhas do plano de contas, de qualquer natureza.
 *
 * Diferente do formulário de despesa, que filtra por `Expense`: aqui o
 * lançamento pode ser entrada ou saída, e limitar a um lado impediria de
 * registrar um rendimento.
 */
function achatarTodas(nos: LedgerAccountNode[]): LedgerAccountNode[] {
  return nos.flatMap((no) => (no.isGroup ? achatarTodas(no.children) : [no]));
}
