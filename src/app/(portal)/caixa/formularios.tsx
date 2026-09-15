'use client';

import { useActionState, useState } from 'react';

import { salvarConta, type ResultadoDoCadastro } from '@/lib/actions/cadastros';
import { RetornoDaAcao } from '@/components/retorno-da-acao';
import { Button, Field, Input, Select } from '@/components/ui';
import type { BankAccountSummary } from '@/lib/types';

const VAZIO: ResultadoDoCadastro = {};

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
