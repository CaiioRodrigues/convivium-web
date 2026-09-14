'use client';

import { Alert } from '@/components/ui';
import type { ResultadoDoCadastro } from '@/lib/actions/cadastros';

/** Faixa de retorno das Server Actions, com o erro da API exibido como veio. */
export function RetornoDaAcao({ estado }: { estado: ResultadoDoCadastro }) {
  if (!estado.erro && !estado.sucesso) return null;

  return (
    <div className="mt-3">
      <Alert tone={estado.erro ? 'negative' : 'positive'}>
        {estado.erro ?? estado.sucesso}

        {estado.link ? (
          <span className="mt-2 block rounded-md bg-surface px-2 py-1.5 font-mono text-xs break-all">
            {estado.link}
          </span>
        ) : null}
      </Alert>
    </div>
  );
}
