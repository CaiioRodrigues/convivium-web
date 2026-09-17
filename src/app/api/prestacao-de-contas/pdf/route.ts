import { ApiError, api } from '@/lib/api';
import { getSession } from '@/lib/dal';

/**
 * Balancete do mês em PDF.
 *
 * A competência vem na query e é repassada crua para a API, que a valida —
 * aceitar aqui o que ela recusa só criaria dois lugares para o mesmo erro.
 */
export async function GET(pedido: Request) {
  const sessao = await getSession();

  if (!sessao) {
    return texto('Não autenticado.', 401);
  }

  const competencia = new URL(pedido.url).searchParams.get('competencia');

  if (!competencia) {
    return texto('Informe a competência.', 400);
  }

  try {
    const arquivo = await api.accountability.pdf(competencia);

    return new Response(arquivo.body, {
      headers: {
        'Content-Type': arquivo.contentType,
        'Content-Disposition': `inline; filename="${arquivo.fileName ?? 'prestacao-de-contas.pdf'}"`,
        // O balancete muda enquanto o mês está aberto: nunca cachear.
        'Cache-Control': 'no-store',
      },
    });
  } catch (erro) {
    if (erro instanceof ApiError) {
      if (erro.isUnauthorized) return texto('Sua sessão expirou. Entre novamente.', 401);
      if (erro.isForbidden) return texto('Seu acesso não permite ver a prestação de contas.', 403);
      if (erro.status === 422) return texto(erro.message, 422);
    }

    return texto('Não foi possível gerar o documento agora. Tente de novo em instantes.', 502);
  }
}

function texto(corpo: string, status: number): Response {
  return new Response(corpo, {
    status,
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}
