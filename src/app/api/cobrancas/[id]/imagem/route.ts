import { ApiError, api } from '@/lib/api';
import { getSession } from '@/lib/dal';

/**
 * Boleto em imagem, para anexar no WhatsApp.
 *
 * Mesma rota do PDF em tudo, menos o formato. Existe separada porque o
 * `Content-Type` decide o que o WhatsApp faz com o arquivo: imagem ele abre
 * na conversa, PDF vira cartão de documento que precisa ser tocado.
 */
export async function GET(_pedido: Request, contexto: RouteContext<'/api/cobrancas/[id]/imagem'>) {
  const sessao = await getSession();

  if (!sessao) {
    return texto('Não autenticado.', 401);
  }

  const { id } = await contexto.params;

  try {
    const arquivo = await api.billing.image(id);

    return new Response(arquivo.body, {
      headers: {
        'Content-Type': arquivo.contentType,
        'Content-Disposition': `inline; filename="${arquivo.fileName ?? 'boleto.png'}"`,
        // Boleto vencido tem multa e juros que mudam todo dia: nunca cachear.
        'Cache-Control': 'no-store',
      },
    });
  } catch (erro) {
    if (erro instanceof ApiError) {
      if (erro.status === 404) return texto('Cobrança não encontrada.', 404);
      if (erro.isUnauthorized) return texto('Sua sessão expirou. Entre novamente.', 401);
      if (erro.isForbidden) return texto('Seu acesso não permite baixar este boleto.', 403);
    }

    return texto('Não foi possível gerar a imagem agora. Tente de novo em instantes.', 502);
  }
}

function texto(corpo: string, status: number): Response {
  return new Response(corpo, {
    status,
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}
