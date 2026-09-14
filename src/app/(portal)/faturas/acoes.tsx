'use client';

import { useActionState } from 'react';

import {
  corrigirFatura,
  gerarDespesaDaFatura,
  importarFatura,
  type ResultadoDaFatura,
} from '@/lib/actions/faturas';
import { Alert, Button, Field, Input, Select } from '@/components/ui';
import type { UtilityBill } from '@/lib/types';

const VAZIO: ResultadoDaFatura = {};

function Mensagem({ estado }: { estado: ResultadoDaFatura }) {
  if (!estado.erro && !estado.sucesso) return null;

  return (
    <div className="mt-3">
      <Alert tone={estado.erro ? 'negative' : 'positive'}>{estado.erro ?? estado.sucesso}</Alert>
    </div>
  );
}

export function EnviarFatura() {
  const [estado, acao, enviando] = useActionState(importarFatura, VAZIO);

  return (
    <div>
      <form action={acao} className="grid gap-3 sm:grid-cols-[1fr_auto_auto] sm:items-end">
        <Field label="PDF da fatura">
          <Input
            type="file"
            name="arquivo"
            accept="application/pdf,.pdf"
            required
            className="file:mr-3 file:rounded-md file:border-0 file:bg-brand-soft file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-brand"
          />
        </Field>

        <Field label="Concessionária">
          <Select name="concessionaria" defaultValue="" className="sm:w-44">
            <option value="">Detectar sozinho</option>
            <option value="Cemig">CEMIG</option>
            <option value="Copasa">COPASA</option>
            <option value="Gasmig">GASMIG</option>
          </Select>
        </Field>

        <Button type="submit" disabled={enviando} className="sm:mb-0.5">
          {enviando ? 'Lendo…' : 'Importar'}
        </Button>
      </form>

      <Mensagem estado={estado} />
    </div>
  );
}

/** Correção manual do que o leitor não conseguiu extrair. */
export function CorrigirLeitura({ fatura }: { fatura: UtilityBill }) {
  const [estado, acao, enviando] = useActionState(corrigirFatura, VAZIO);

  return (
    <div>
      <form action={acao} className="grid gap-3 sm:grid-cols-4">
        <input type="hidden" name="faturaId" value={fatura.id} />

        <Field label="Valor (R$)">
          <Input
            name="valor"
            defaultValue={fatura.amount?.toFixed(2).replace('.', ',') ?? ''}
            inputMode="decimal"
            placeholder="0,00"
          />
        </Field>

        <Field label="Vencimento">
          <Input type="date" name="vencimento" defaultValue={fatura.dueDate ?? ''} />
        </Field>

        <Field label="Competência">
          <Input
            name="competencia"
            defaultValue={fatura.referenceMonth ?? ''}
            placeholder="MM/AAAA"
            pattern="\d{2}/\d{4}"
          />
        </Field>

        <Field label="Consumo">
          <Input
            name="consumo"
            defaultValue={fatura.consumptionKwh?.toString() ?? ''}
            inputMode="decimal"
          />
        </Field>

        <div className="sm:col-span-4">
          <Button type="submit" variant="secondary" disabled={enviando}>
            {enviando ? 'Salvando…' : 'Salvar correção'}
          </Button>
        </div>
      </form>

      <Mensagem estado={estado} />
    </div>
  );
}

export function GerarDespesa({ faturaId }: { faturaId: string }) {
  const [estado, acao, enviando] = useActionState(gerarDespesaDaFatura, VAZIO);

  return (
    <div>
      <form action={acao}>
        <input type="hidden" name="faturaId" value={faturaId} />
        <Button type="submit" disabled={enviando}>
          {enviando ? 'Gerando…' : 'Gerar despesa'}
        </Button>
      </form>

      <Mensagem estado={estado} />
    </div>
  );
}
