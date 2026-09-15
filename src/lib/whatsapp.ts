/**
 * Monta o link `wa.me` que abre o WhatsApp com a conversa e a mensagem prontas.
 *
 * Não é integração com o WhatsApp: é um link que o navegador entrega ao
 * aplicativo. Nada sai daqui sozinho — quem aperta enviar é a pessoa, do
 * próprio número dela. Envio automático exigiria a API oficial da Meta, com
 * número dedicado e modelos aprovados.
 */

/**
 * Telefone brasileiro no formato que o `wa.me` espera: só dígitos, com o 55 na
 * frente. Devolve `null` quando o cadastro não tem número aproveitável — é o
 * que faz o botão sumir em vez de abrir uma conversa com ninguém.
 */
export function telefoneParaWhatsApp(telefone: string | null | undefined): string | null {
  const digitos = (telefone ?? '').replace(/\D/g, '');

  // Já veio com código do país.
  if ((digitos.length === 12 || digitos.length === 13) && digitos.startsWith('55')) {
    return digitos;
  }

  // DDD + número, fixo (10) ou celular (11).
  if (digitos.length === 10 || digitos.length === 11) {
    return `55${digitos}`;
  }

  return null;
}

export function linkDeWhatsApp(telefone: string | null | undefined, mensagem: string): string | null {
  const numero = telefoneParaWhatsApp(telefone);

  return numero ? `https://wa.me/${numero}?text=${encodeURIComponent(mensagem)}` : null;
}

export interface CobrancaParaEnvio {
  condominio: string;
  unidade: string;
  competencia: string;
  vencimento: string;
  valor: string;
  morador: string | null;
  link: string;
}

/**
 * O texto que vai na conversa.
 *
 * Traz unidade, competência, valor e vencimento antes do link: é por eles que
 * o morador confere que a mensagem é do prédio dele antes de clicar em
 * qualquer coisa. Link de boleto solto no WhatsApp é o formato preferido do
 * golpe do boleto, e uma mensagem conferível é a defesa que cabe aqui.
 */
export function mensagemDoBoleto(cobranca: CobrancaParaEnvio): string {
  const saudacao = cobranca.morador ? `Olá, ${cobranca.morador}!` : 'Olá!';

  return [
    `${saudacao} Segue o boleto do ${cobranca.condominio}.`,
    '',
    `Unidade: ${cobranca.unidade}`,
    `Competência: ${cobranca.competencia}`,
    `Vencimento: ${cobranca.vencimento}`,
    `Valor: ${cobranca.valor}`,
    '',
    `Boleto e PIX: ${cobranca.link}`,
  ].join('\n');
}
