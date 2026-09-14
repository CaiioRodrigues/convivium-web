'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useTransition } from 'react';

import { Button, Input, Select } from '@/components/ui';
import type { BankAccountSummary } from '@/lib/types';

/**
 * Filtros do extrato.
 *
 * O estado vive na URL, não no componente: assim um filtro pode ser
 * compartilhado por link, sobrevive ao recarregar a página e o botão voltar
 * do navegador funciona como a pessoa espera.
 */
export function FiltroDeLancamentos({ contas }: { contas: BankAccountSummary[] }) {
  const router = useRouter();
  const parametros = useSearchParams();
  const [aplicando, aplicar] = useTransition();

  function enviar(dados: FormData) {
    const novos = new URLSearchParams();

    for (const [chave, valor] of dados.entries()) {
      const texto = String(valor).trim();
      if (texto) novos.set(chave, texto);
    }

    aplicar(() => {
      router.push(novos.size > 0 ? `/caixa?${novos}` : '/caixa');
    });
  }

  return (
    <form action={enviar} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
      <Select name="conta" defaultValue={parametros.get('conta') ?? ''} aria-label="Conta">
        <option value="">Todas as contas</option>
        {contas.map((conta) => (
          <option key={conta.id} value={conta.id}>
            {conta.name}
          </option>
        ))}
      </Select>

      <Select name="direcao" defaultValue={parametros.get('direcao') ?? ''} aria-label="Tipo">
        <option value="">Entradas e saídas</option>
        <option value="In">Só entradas</option>
        <option value="Out">Só saídas</option>
      </Select>

      <Input type="date" name="de" defaultValue={parametros.get('de') ?? ''} aria-label="De" />
      <Input type="date" name="ate" defaultValue={parametros.get('ate') ?? ''} aria-label="Até" />

      <div className="flex gap-2">
        <Input
          name="busca"
          defaultValue={parametros.get('busca') ?? ''}
          placeholder="Buscar descrição"
          aria-label="Buscar"
        />
        <Button type="submit" disabled={aplicando} className="shrink-0">
          {aplicando ? '…' : 'Filtrar'}
        </Button>
      </div>
    </form>
  );
}
