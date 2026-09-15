'use client';

import { useActionState } from 'react';

import {
  desativarFornecedor,
  salvarFornecedor,
  type ResultadoDoCadastro,
} from '@/lib/actions/cadastros';
import { RetornoDaAcao } from '@/components/retorno-da-acao';
import { Button, Field, Input } from '@/components/ui';

const VAZIO: ResultadoDoCadastro = {};

export function FormularioDeFornecedor() {
  const [estado, acao, salvando] = useActionState(salvarFornecedor, VAZIO);
  // Volta com o que foi digitado quando a gravação falha (ver ResultadoDoCadastro).
  const digitado = estado.valores ?? {};

  return (
    <form action={acao} className="grid gap-4 sm:grid-cols-4">
      <div className="sm:col-span-2">
        <Field label="Nome">
          <Input name="nome" defaultValue={digitado.nome} required placeholder="Atlas Elevadores Ltda" />
        </Field>
      </div>

      <div className="sm:col-span-2">
        <Field label="CNPJ ou CPF" hint="Conferido pelo dígito verificador">
          <Input name="documento" defaultValue={digitado.documento} placeholder="00.000.000/0000-00" />
        </Field>
      </div>

      <div className="sm:col-span-2">
        <Field label="E-mail">
          <Input name="email" defaultValue={digitado.email} type="email" />
        </Field>
      </div>

      <div className="sm:col-span-2">
        <Field label="Telefone">
          <Input name="telefone" defaultValue={digitado.telefone} />
        </Field>
      </div>

      <div className="sm:col-span-4">
        <Field label="Observações">
          <Input name="observacoes" defaultValue={digitado.observacoes} placeholder="Contrato, contato, periodicidade…" />
        </Field>
      </div>

      <div className="sm:col-span-4">
        <Button type="submit" disabled={salvando}>
          {salvando ? 'Salvando…' : 'Cadastrar fornecedor'}
        </Button>

        <RetornoDaAcao estado={estado} />
      </div>
    </form>
  );
}

export function BotaoDesativarFornecedor({ fornecedorId }: { fornecedorId: string }) {
  const [estado, acao, enviando] = useActionState(desativarFornecedor, VAZIO);

  return (
    <form action={acao} className="flex items-center justify-end gap-2">
      <input type="hidden" name="fornecedorId" value={fornecedorId} />

      <Button type="submit" variant="ghost" disabled={enviando} className="py-1 text-xs">
        {enviando ? '…' : 'Desativar'}
      </Button>

      {estado.erro ? (
        <span className="text-xs text-negative" role="alert">
          {estado.erro}
        </span>
      ) : null}
    </form>
  );
}
