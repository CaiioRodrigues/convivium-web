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

/**
 * Cadastra ou corrige uma despesa.
 *
 * "Entra no rateio" e o campo que decide dinheiro: despesa rateavel vira cota
 * de todo mundo, despesa que nao e fica so no caixa. O padrao vem da conta
 * contabil escolhida, e a caixinha permite discordar dela num lancamento
 * especifico — uma obra extraordinaria lancada em Manutencao, por exemplo.
 */
export async function salvarDespesa(
  _anterior: ResultadoDaAcao,
  dados: FormData,
): Promise<ResultadoDaAcao> {
  const id = texto(dados, 'despesaId');
  const descricao = texto(dados, 'descricao');
  const contaId = texto(dados, 'contaContabilId');
  const valor = numero(dados, 'valor');
  const vencimento = texto(dados, 'vencimento');

  if (!descricao) return { erro: 'Informe a descrição da despesa.' };
  if (!contaId) return { erro: 'Escolha a conta contábil.' };
  if (valor === null || valor <= 0) return { erro: 'Informe o valor da despesa.' };
  if (!vencimento) return { erro: 'Informe o vencimento.' };

  const corpo = {
    description: descricao,
    ledgerAccountId: contaId,
    amount: valor,
    dueDate: vencimento,
    competence: texto(dados, 'competencia') ?? undefined,
    supplierId: texto(dados, 'fornecedorId'),
    isApportionable: dados.get('rateavel') !== null,
    documentNumber: texto(dados, 'documento'),
    notes: texto(dados, 'observacoes'),
  };

  try {
    const despesa = id
      ? await api.expenses.update(id, corpo)
      : await api.expenses.create(corpo);

    revalidatePath('/despesas');
    revalidatePath('/cobrancas');
    revalidatePath('/painel');

    return {
      sucesso: `${despesa.description} ${id ? 'atualizada' : 'lançada'}: ${despesa.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}.`,
    };
  } catch (erro) {
    return tratar(erro);
  }
}

/** Campo de texto opcional: vazio vira nulo em vez de string em branco. */
function texto(dados: FormData, chave: string): string | null {
  const bruto = String(dados.get(chave) ?? '').trim();
  return bruto === '' ? null : bruto;
}

/** "1.234,56" vira 1234.56; vazio vira nulo. */
function numero(dados: FormData, chave: string): number | null {
  const bruto = String(dados.get(chave) ?? '').trim();
  if (bruto === '') return null;

  const valor = Number(bruto.replace(/\./g, '').replace(',', '.'));
  return Number.isFinite(valor) ? valor : null;
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
