'use server';

import { revalidatePath } from 'next/cache';

import { api } from '@/lib/api';
import { mensagemDeErro } from '@/lib/actions/erros';

export interface ResultadoDaAcao {
  erro?: string;
  sucesso?: string;
}

/** Traduz a falha da API numa mensagem exibível, sem vazar erro interno. */
function tratar(erro: unknown): ResultadoDaAcao {
  return { erro: mensagemDeErro(erro) };
}

export async function pagarDespesa(
  _anterior: ResultadoDaAcao,
  dados: FormData,
): Promise<ResultadoDaAcao> {
  const id = String(dados.get('despesaId') ?? '');
  const bankAccountId = String(dados.get('contaId') ?? '');

  if (!id || !bankAccountId) {
    return { erro: 'Escolha a conta de onde o pagamento saiu.' };
  }

  try {
    const despesa = await api.expenses.pay(id, { bankAccountId });
    revalidatePath('/despesas');
    revalidatePath('/caixa');
    revalidatePath('/painel');

    return { sucesso: `Baixa registrada: ${despesa.description}.` };
  } catch (erro) {
    return tratar(erro);
  }
}

export async function estornarDespesa(
  _anterior: ResultadoDaAcao,
  dados: FormData,
): Promise<ResultadoDaAcao> {
  const id = String(dados.get('despesaId') ?? '');

  try {
    await api.expenses.reverse(id);
    revalidatePath('/despesas');
    revalidatePath('/caixa');
    revalidatePath('/painel');

    return { sucesso: 'Pagamento estornado e lançamento removido do caixa.' };
  } catch (erro) {
    return tratar(erro);
  }
}

export async function abrirCiclo(
  _anterior: ResultadoDaAcao,
  dados: FormData,
): Promise<ResultadoDaAcao> {
  const competence = String(dados.get('competencia') ?? '').trim();

  if (!competence) {
    return { erro: 'Informe a competência, no formato MM/AAAA.' };
  }

  try {
    const ciclo = await api.billing.openCycle({ competence });
    revalidatePath('/cobrancas');

    return { sucesso: `Ciclo de ${ciclo.competence} aberto em rascunho.` };
  } catch (erro) {
    return tratar(erro);
  }
}

export async function fecharCiclo(
  _anterior: ResultadoDaAcao,
  dados: FormData,
): Promise<ResultadoDaAcao> {
  const id = String(dados.get('cicloId') ?? '');

  try {
    const ciclo = await api.billing.closeCycle(id);
    revalidatePath('/cobrancas');
    revalidatePath('/painel');

    return {
      sucesso: `Rateio fechado: ${ciclo.chargeCount} cobranças geradas.`,
    };
  } catch (erro) {
    return tratar(erro);
  }
}

export async function publicarCiclo(
  _anterior: ResultadoDaAcao,
  dados: FormData,
): Promise<ResultadoDaAcao> {
  const id = String(dados.get('cicloId') ?? '');

  try {
    await api.billing.publishCycle(id);
    revalidatePath('/cobrancas');

    return { sucesso: 'Ciclo publicado. Os moradores já conseguem acessar os boletos.' };
  } catch (erro) {
    return tratar(erro);
  }
}

export async function enviarAvisosDoCiclo(
  _anterior: ResultadoDaAcao,
  dados: FormData,
): Promise<ResultadoDaAcao> {
  const id = String(dados.get('cicloId') ?? '');

  try {
    const resultado = await api.notifications.sendCycleNotices(id);
    revalidatePath('/cobrancas');
    revalidatePath('/notificacoes');

    if (resultado.queued === 0 && resultado.skippedWithoutEmail === 0) {
      return { sucesso: 'Todos os avisos deste ciclo já estavam na fila.' };
    }

    const semEmail = resultado.skippedWithoutEmail;

    return {
      sucesso:
        `${resultado.queued} aviso(s) na fila de envio.` +
        (semEmail > 0
          ? ` ${semEmail} unidade(s) ficaram de fora por não ter e-mail cadastrado: ${resultado.skipped.join(', ')}.`
          : ''),
    };
  } catch (erro) {
    return tratar(erro);
  }
}
