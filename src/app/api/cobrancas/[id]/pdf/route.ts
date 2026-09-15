import { ApiError, api } from '@/lib/api';
import { getSession } from '@/lib/dal';

/**
 * Boleto em PDF de uma cobrança, para quem está autenticado.
 *
 * Repassa o status que a API devolveu em vez de responder 404 para tudo.
 * Enquanto este arquivo dizia "cobrança não encontrada" a qualquer erro, um
 * morador sem permissão via a mesma frase de uma cobrança inexistente — e não
 * havia como distinguir, nem pela tela nem pelo log, boleto apagado de boleto
 * barrado.
 */
export async function GET(_pedido: Request, contexto: RouteContext<'/api/cobrancas/[id]/pdf'>) {
  const sessao = await getSession();

  if (!sessao) {
    return texto('Não autenticado.', 401);
  }

  const { id } = await contexto.params;

  try {
    const arquivo = await api.billing.pdf(id);

    return new Response(arquivo.body, {
      headers: {
        'Content-Type': arquivo.contentType,
        'Content-Disposition': `inline; filename="${arquivo.fileName ?? 'boleto.pdf'}"`,
        // Boleto vencido tem multa e juros que mudam todo dia: nunca cachear.
        'Cache-Control': 'no-store',
      },
    });
  } catch (erro) {
    if (erro instanceof ApiError) {
      if (erro.status === 404) {
        return texto('Cobrança não encontrada.', 404);
      }

      if (erro.isUnauthorized) {
        return texto('Sua sessão expirou. Entre novamente.', 401);
      }

      if (erro.isForbidden) {
        return texto('Seu acesso não permite baixar este boleto.', 403);
      }
    }

    // Erro de rede ou falha da API: 502 diz a verdade — o problema está entre
    // o Next e a API, não na cobrança que a pessoa pediu.
    return texto('Não foi possível gerar o boleto agora. Tente de novo em instantes.', 502);
  }
}

function texto(corpo: string, status: number): Response {
  return new Response(corpo, {
    status,
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}
