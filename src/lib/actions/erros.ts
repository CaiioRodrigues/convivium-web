import 'server-only';

import { ApiError, API_BASE_URL } from '@/lib/api/core';

/**
 * Códigos de falha de rede do Node. Um `fetch` que não chega ao destino joga
 * `TypeError: fetch failed`, e o motivo real fica em `cause.code`.
 */
const FALHAS_DE_REDE = new Set([
  'ECONNREFUSED',
  'ENOTFOUND',
  'ECONNRESET',
  'EHOSTUNREACH',
  'ENETUNREACH',
  'ETIMEDOUT',
  'UND_ERR_CONNECT_TIMEOUT',
]);

function naoAlcancouAApi(erro: unknown): boolean {
  if (!(erro instanceof TypeError)) return false;

  const causa = (erro as { cause?: { code?: string } }).cause;
  return typeof causa?.code === 'string' && FALHAS_DE_REDE.has(causa.code);
}

/**
 * Traduz o erro de uma chamada à API na frase que a pessoa lê.
 *
 * O caso que mais acontece em desenvolvimento é a API não estar no ar, e ele
 * merece nome: "tente de novo" manda repetir o que vai falhar igual, e esconde
 * justamente a informação que resolveria — o endereço onde ninguém atendeu.
 */
export function mensagemDeErro(erro: unknown): string {
  if (erro instanceof ApiError) {
    if (erro.isForbidden) {
      return 'Seu papel no condomínio não permite esta ação.';
    }

    return erro.message;
  }

  if (naoAlcancouAApi(erro)) {
    return `Não foi possível falar com a API em ${API_BASE_URL}. Verifique se ela está no ar.`;
  }

  return 'Não foi possível concluir a operação. Tente de novo.';
}
