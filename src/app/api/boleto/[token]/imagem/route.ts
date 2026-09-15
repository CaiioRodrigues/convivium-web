import { ApiError, api } from '@/lib/api';

/**
 * Boleto em imagem pelo link público, sem login.
 *
 * Deixa quem recebeu o boleto salvar o PNG e repassar por conta própria — o
 * inquilino mandando para o proprietário, por exemplo. A autorização é o
 * próprio token da URL, igual à rota do PDF ao lado.
 */
export async function GET(_pedido: Request, contexto: RouteContext<'/api/boleto/[token]/imagem'>) {
  const { token } = await contexto.params;

  try {
    const arquivo = await api.billing.publicImage(token);

    return new Response(arquivo.body, {
      headers: {
        'Content-Type': arquivo.contentType,
        'Content-Disposition': `inline; filename="${arquivo.fileName ?? 'boleto.png'}"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (erro) {
    const foraDoAr = !(erro instanceof ApiError) || erro.status >= 500;

    return new Response(
      foraDoAr
        ? 'Não foi possível gerar a imagem agora. Tente de novo em instantes.'
        : 'Boleto não encontrado ou link expirado.',
      {
        status: foraDoAr ? 502 : 404,
        headers: { 'Content-Type': 'text/plain; charset=utf-8' },
      },
    );
  }
}
