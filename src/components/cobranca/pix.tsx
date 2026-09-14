'use client';

import { useState } from 'react';

import { Button } from '@/components/ui';

/**
 * Bloco do PIX copia e cola.
 *
 * O botão é o caminho principal: ninguém digita 140 caracteres de BR Code à
 * mão. O código continua visível para quem prefere selecionar, e para o caso
 * de a área de transferência estar bloqueada pelo navegador.
 */
export function PixCopiaECola({ payload }: { payload: string }) {
  const [copiado, setCopiado] = useState(false);
  const [falhou, setFalhou] = useState(false);

  async function copiar() {
    try {
      await navigator.clipboard.writeText(payload);
      setFalhou(false);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2500);
    } catch {
      // Área de transferência negada (contexto inseguro ou permissão): o
      // código segue na tela para seleção manual.
      setFalhou(true);
    }
  }

  return (
    <div className="rounded-lg border border-line bg-surface-muted p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-semibold text-brand">Pague com PIX</p>
        <Button type="button" onClick={copiar} variant="secondary" className="py-1.5 text-xs">
          {copiado ? 'Copiado' : 'Copiar código'}
        </Button>
      </div>

      <p className="mt-1 text-xs text-ink-muted">
        Abra o aplicativo do seu banco, escolha PIX e use a opção Copia e Cola.
      </p>

      <p className="mt-3 rounded-md bg-surface px-3 py-2 font-mono text-[11px] leading-relaxed break-all text-ink">
        {payload}
      </p>

      {falhou ? (
        <p className="mt-2 text-xs text-warning">
          Seu navegador bloqueou a cópia automática. Selecione o código acima e copie.
        </p>
      ) : null}

      <p aria-live="polite" className="sr-only">
        {copiado ? 'Código PIX copiado para a área de transferência.' : ''}
      </p>
    </div>
  );
}
