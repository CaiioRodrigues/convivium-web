'use client';

import { useActionState } from 'react';

import {
  ajustarFracoes,
  desativarUnidade,
  recalcularFracoes,
  salvarUnidade,
  type ResultadoDoCadastro,
} from '@/lib/actions/cadastros';
import { RetornoDaAcao } from '@/components/retorno-da-acao';
import { Button, Field, Input, Select } from '@/components/ui';
import type { Block, Unit } from '@/lib/types';

const VAZIO: ResultadoDoCadastro = {};

export function FormularioDeUnidade({
  blocos,
  unidade,
}: {
  blocos: Block[];
  unidade?: Unit;
}) {
  const [estado, acao, salvando] = useActionState(salvarUnidade, VAZIO);
  // Volta com o que foi digitado quando a gravação falha (ver ResultadoDoCadastro).
  const digitado = estado.valores ?? {};

  /*
   * O `key` nos campos de seleção não é decoração.
   *
   * Quando a action termina, o React limpa o formulário. Num `<input>` a
   * limpeza devolve o `defaultValue`, que já vem com o valor digitado. Num
   * `<select>` não: o React só marca a opção como padrão do formulário na
   * montagem, nunca quando o `defaultValue` muda depois. Sem remontar, a
   * limpeza voltaria para a primeira opção e o papel escolhido viraria
   * "Morador" caladamente — pior do que perder o formulário, porque quem
   * reenviasse gravaria a pessoa errada sem perceber.
   */
  return (
    <form action={acao} className="grid gap-4 sm:grid-cols-6">
      {unidade ? <input type="hidden" name="unidadeId" value={unidade.id} /> : null}

      <div className="sm:col-span-2">
        <Field label="Identificação" hint="Ex.: 101, Loja 3">
          <Input
            name="identificador"
            defaultValue={digitado.identificador ?? unidade?.identifier ?? ''}
            required
          />
        </Field>
      </div>

      <div className="sm:col-span-2">
        <Field label="Bloco">
          <Select
            key={digitado.blocoId ?? unidade?.blockId ?? ''}
            name="blocoId"
            defaultValue={digitado.blocoId ?? unidade?.blockId ?? ''}
          >
            <option value="">Sem bloco</option>
            {blocos.map((bloco) => (
              <option key={bloco.id} value={bloco.id}>
                {bloco.name}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      <div className="sm:col-span-2">
        <Field label="Ou criar bloco novo" hint="Deixe em branco para usar o de cima">
          <Input name="novoBloco" defaultValue={digitado.novoBloco} placeholder="Bloco C" />
        </Field>
      </div>

      <Field label="Tipo">
        <Select
          key={digitado.tipo ?? unidade?.kind ?? 'Apartment'}
          name="tipo"
          defaultValue={digitado.tipo ?? unidade?.kind ?? 'Apartment'}
        >
          <option value="Apartment">Apartamento</option>
          <option value="House">Casa</option>
          <option value="Store">Loja</option>
          <option value="Room">Sala</option>
          <option value="ParkingSpot">Vaga</option>
          <option value="Storage">Depósito</option>
        </Select>
      </Field>

      <Field label="Andar">
        <Input name="andar" type="number" defaultValue={digitado.andar ?? unidade?.floor ?? ''} />
      </Field>

      <Field label="Área (m²)">
        <Input
          name="area"
          inputMode="decimal"
          defaultValue={digitado.area ?? unidade?.areaM2?.toString().replace('.', ',') ?? ''}
        />
      </Field>

      <Field
        label="Fração ideal"
        hint="Como está na convenção: 0,1046 é 10,46% do condomínio"
      >
        <Input
          name="fracao"
          inputMode="decimal"
          placeholder="0,1046"
          defaultValue={
            digitado.fracao ??
            (unidade ? unidade.idealFraction.toFixed(6).replace('.', ',') : '')
          }
        />
      </Field>

      <div className="flex items-end sm:col-span-2">
        <label className="flex items-center gap-2 pb-2 text-sm text-ink">
          <input
            type="checkbox"
            name="ativa"
            defaultChecked={
              estado.valores ? digitado.ativa !== undefined : (unidade?.isActive ?? true)
            }
            className="size-4 accent-[var(--color-brand)]"
          />
          Entra no rateio
        </label>
      </div>

      <div className="sm:col-span-6">
        <Button type="submit" disabled={salvando}>
          {salvando ? 'Salvando…' : unidade ? 'Salvar unidade' : 'Cadastrar unidade'}
        </Button>

        <RetornoDaAcao estado={estado} />
      </div>
    </form>
  );
}

/**
 * Recalcula todas as frações pela área privativa.
 *
 * É a saída quando a soma não fecha em 1 e ajustar unidade por unidade seria
 * trabalho de horas — a última unidade absorve o arredondamento.
 */
export function BotaoRecalcularFracoes() {
  const [estado, acao, recalculando] = useActionState(recalcularFracoes, VAZIO);

  return (
    <div>
      <form action={acao}>
        <Button type="submit" variant="secondary" disabled={recalculando}>
          {recalculando ? 'Recalculando…' : 'Recalcular frações pela área'}
        </Button>
      </form>

      <RetornoDaAcao estado={estado} />
    </div>
  );
}

/**
 * Escala as fracoes existentes para fecharem em 1, sem mexer na proporcao.
 *
 * Diferente do recalculo pela area, este nao decide quanto cada unidade pesa —
 * quem decide continua sendo a convencao. Ele so corrige a escala, que e o que
 * falta quando a convencao arredonda e nao fecha em 1, ou quando os numeros
 * foram digitados em outra unidade.
 */
export function BotaoAjustarFracoes() {
  const [estado, acao, ajustando] = useActionState(ajustarFracoes, VAZIO);

  return (
    <div>
      <form action={acao}>
        <Button type="submit" variant="secondary" disabled={ajustando}>
          {ajustando ? 'Ajustando…' : 'Ajustar para fechar em 1'}
        </Button>
      </form>

      <RetornoDaAcao estado={estado} />
    </div>
  );
}

export function BotaoDesativarUnidade({ unidadeId }: { unidadeId: string }) {
  const [estado, acao, enviando] = useActionState(desativarUnidade, VAZIO);

  return (
    <form action={acao} className="flex items-center justify-end gap-2">
      <input type="hidden" name="unidadeId" value={unidadeId} />

      <Button type="submit" variant="ghost" disabled={enviando} className="py-1 text-xs">
        {enviando ? '…' : 'Desativar'}
      </Button>

      {estado.erro ? (
        <span className="max-w-xs text-xs text-negative" role="alert">
          {estado.erro}
        </span>
      ) : null}
    </form>
  );
}
