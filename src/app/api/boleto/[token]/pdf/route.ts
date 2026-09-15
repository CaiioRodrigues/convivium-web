import { ApiError, api } from '@/lib/api';

/**
 * Repassa o boleto em PDF vindo da API.
 *
 * Existe porque o navegador não fala direto com o convivium-api: nas rotas
 * autenticadas o token está num cookie httpOnly que o JavaScript não alcança,
 * e manter todo o tráfego passando pelo Next também evita expor o endereço da
 * API. Aqui a rota é pública — a autorização é o próprio token do link.
 */
export async function GET(_pedido: Request, contexto: RouteContext<'/api/boleto/[token]/pdf'>) {
  const { token } = await contexto.params;

  try {
    const arquivo = await api.billing.publicPdf(token);

    return new Response(arquivo.body, {
      headers: {
        'Content-Type': arquivo.contentType,
        'Content-Disposition': `inline; filename="${arquivo.fileName ?? 'boleto.pdf'}"`,
        // Boleto vencido tem multa e juros que mudam todo dia: nunca cachear.
        'Cache-Control': 'no-store',
      },
    });
  } catch (erro) {
    // Link errado e API fora do ar não são a mesma coisa: mandar quem tem um
    // link bom procurar outro, porque a API caiu, é o pior dos dois erros.
    const foraDoAr = !(erro instanceof ApiError) || erro.status >= 500;

    return new Response(
      foraDoAr
        ? 'Não foi possível gerar o boleto agora. Tente de novo em instantes.'
        : 'Boleto não encontrado ou link expirado.',
      {
        status: foraDoAr ? 502 : 404,
        headers: { 'Content-Type': 'text/plain; charset=utf-8' },
      },
    );
  }
}
