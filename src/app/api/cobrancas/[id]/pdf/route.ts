import { api } from '@/lib/api';
import { getSession } from '@/lib/dal';

/** Boleto em PDF de uma cobrança, para quem está autenticado. */
export async function GET(_pedido: Request, contexto: RouteContext<'/api/cobrancas/[id]/pdf'>) {
  const sessao = await getSession();

  if (!sessao) {
    return new Response('Não autenticado.', { status: 401 });
  }

  const { id } = await contexto.params;

  try {
    const arquivo = await api.billing.pdf(id);

    return new Response(arquivo.body, {
      headers: {
        'Content-Type': arquivo.contentType,
        'Content-Disposition': `inline; filename="${arquivo.fileName ?? 'boleto.pdf'}"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch {
    return new Response('Cobrança não encontrada.', {
      status: 404,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  }
}
