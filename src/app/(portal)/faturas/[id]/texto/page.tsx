import type { Metadata } from 'next';
import Link from 'next/link';

import { api } from '@/lib/api';
import { requireFinanceAccess } from '@/lib/dal';
import { CabecalhoDePagina } from '@/components/cabecalho-de-pagina';
import { Card } from '@/components/ui';

export const metadata: Metadata = { title: 'Texto extraído' };

/**
 * Texto bruto que o leitor viu no PDF.
 *
 * Existe para quando um campo não foi encontrado: dá para ver exatamente como
 * a concessionária escreveu o rótulo e ajustar o leitor, sem precisar do
 * arquivo original em mãos.
 */
export default async function PaginaDoTextoDaFatura({
  params,
}: PageProps<'/faturas/[id]/texto'>) {
  await requireFinanceAccess();

  const { id } = await params;
  const [fatura, texto] = await Promise.all([
    api.utilityBills.get(id),
    api.utilityBills.rawText(id),
  ]);

  return (
    <>
      <CabecalhoDePagina
        titulo="Texto extraído do PDF"
        descricao={fatura.sourceFileName}
        acao={
          <Link
            href="/faturas"
            className="text-sm text-ink-muted underline underline-offset-2 hover:text-ink"
          >
            Voltar para faturas
          </Link>
        }
      />

      <Card className="p-5">
        <pre className="overflow-x-auto font-mono text-xs leading-relaxed whitespace-pre-wrap text-ink">
          {texto}
        </pre>
      </Card>
    </>
  );
}
