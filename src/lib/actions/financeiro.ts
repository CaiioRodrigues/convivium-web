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

/**
 * Dá baixa numa cobrança: o morador pagou, o dinheiro entra no caixa.
 *
 * É a metade que faltava do ciclo. Sem ela a cobrança fica em aberto para
 * sempre, quem pagou aparece como inadimplente e o balancete mostra receita
 * zero — o sistema emitia o boleto e nunca sabia que ele tinha sido pago.
 *
 * O valor vem do formulário, e não do total da cobrança, porque pagamento
 * parcial acontece: o morador paga a cota e deixa a multa para depois.
 */
export async function receberCobranca(
  _anterior: ResultadoDaAcao,
  dados: FormData,
): Promise<ResultadoDaAcao> {
  const id = String(dados.get('cobrancaId') ?? '');
  const bankAccountId = String(dados.get('contaId') ?? '');
  const valor = numero(dados, 'valor');

  if (!id || !bankAccountId) {
    return { erro: 'Escolha a conta em que o dinheiro entrou.' };
  }

  if (valor === null || valor <= 0) {
    return { erro: 'Informe o valor recebido.' };
  }

  try {
    const cobranca = await api.billing.registerPayment(id, {
      amount: valor,
      bankAccountId,
      // A data fica a cargo da API, que usa hoje. Quem dá baixa no mesmo dia
      // — o caso comum — não precisa preencher mais um campo.
      method: String(dados.get('meio') ?? 'Pix'),
    });

    revalidatePath('/cobrancas');
    // A lista de boletos e uma rota dinamica: revalidar '/cobrancas' nao
    // alcanca '/cobrancas/<id>', e a linha continuaria dizendo "Em aberto"
    // depois da baixa. Quem visse isso clicaria de novo.
    revalidatePath('/cobrancas/[cicloId]', 'page');
    revalidatePath('/caixa');
    revalidatePath('/painel');
    revalidatePath('/prestacao-de-contas');

    const quitada = cobranca.status === 'Paid';

    return {
      sucesso: quitada
        ? `${cobranca.unitIdentifier}: recebimento registrado.`
        : `${cobranca.unitIdentifier}: parcial, restam ${cobranca.outstandingAmount.toLocaleString(
            'pt-BR',
            { style: 'currency', currency: 'BRL' },
          )}.`,
    };
  } catch (erro) {
    return tratar(erro);
  }
}

/**
 * Lançamento avulso no caixa: o que não nasce de cobrança nem de despesa.
 *
 * Rendimento de poupança, taxa do banco, reembolso, aporte do síndico. Sem
 * isto, dinheiro que entra ou sai por fora dos dois fluxos principais não
 * tem como ser registrado, e o saldo do sistema deixa de bater com o extrato.
 */
export async function lancarNoCaixa(
  _anterior: ResultadoDaAcao,
  dados: FormData,
): Promise<ResultadoDaAcao> {
  const bankAccountId = texto(dados, 'contaId');
  const ledgerAccountId = texto(dados, 'contaContabilId');
  const descricao = texto(dados, 'descricao');
  const data = texto(dados, 'data');
  const valor = numero(dados, 'valor');
  const direcao = String(dados.get('direcao') ?? 'Out');

  if (!bankAccountId) return { erro: 'Escolha a conta bancária.' };
  if (!ledgerAccountId) return { erro: 'Escolha a conta contábil.' };
  if (!descricao) return { erro: 'Descreva o lançamento.' };
  if (!data) return { erro: 'Informe a data.' };
  if (valor === null || valor <= 0) return { erro: 'Informe um valor maior que zero.' };

  try {
    await api.cash.createEntry({
      bankAccountId,
      ledgerAccountId,
      direction: direcao === 'In' ? 'In' : 'Out',
      amount: valor,
      date: data,
      description: descricao,
      documentNumber: texto(dados, 'documento') ?? undefined,
    });

    revalidatePath('/caixa');
    revalidatePath('/painel');
    revalidatePath('/prestacao-de-contas');

    return {
      sucesso: `Lançamento registrado: ${descricao}.`,
    };
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
