'use server';

import { revalidatePath } from 'next/cache';

import { ApiError, api } from '@/lib/api';
import type { UtilityProvider } from '@/lib/types';

export interface ResultadoDaFatura {
  erro?: string;
  sucesso?: string;
}

function tratar(erro: unknown): ResultadoDaFatura {
  if (erro instanceof ApiError) {
    return { erro: erro.message };
  }

  return { erro: 'Não foi possível processar o arquivo. Tente de novo.' };
}

export async function importarFatura(
  _anterior: ResultadoDaFatura,
  dados: FormData,
): Promise<ResultadoDaFatura> {
  const arquivo = dados.get('arquivo');
  const concessionaria = String(dados.get('concessionaria') ?? '') as UtilityProvider | '';

  if (!(arquivo instanceof File) || arquivo.size === 0) {
    return { erro: 'Escolha o PDF da fatura.' };
  }

  if (!arquivo.name.toLowerCase().endsWith('.pdf')) {
    return { erro: 'O arquivo precisa ser um PDF.' };
  }

  try {
    const fatura = await api.utilityBills.import(
      arquivo,
      concessionaria === '' ? undefined : concessionaria,
    );

    revalidatePath('/faturas');
    revalidatePath('/painel');

    if (fatura.status === 'NeedsReview') {
      return {
        sucesso:
          'Fatura importada, mas alguns campos precisam de conferência antes de virar despesa.',
      };
    }

    return { sucesso: `Fatura de ${fatura.referenceMonth ?? 'competência não lida'} importada.` };
  } catch (erro) {
    return tratar(erro);
  }
}

export async function corrigirFatura(
  _anterior: ResultadoDaFatura,
  dados: FormData,
): Promise<ResultadoDaFatura> {
  const id = String(dados.get('faturaId') ?? '');

  const numero = (chave: string) => {
    const bruto = String(dados.get(chave) ?? '').trim();
    if (!bruto) return undefined;

    // O formulário usa vírgula decimal, como o brasileiro digita.
    const valor = Number(bruto.replace(/\./g, '').replace(',', '.'));
    return Number.isFinite(valor) ? valor : undefined;
  };

  const texto = (chave: string) => {
    const bruto = String(dados.get(chave) ?? '').trim();
    return bruto || undefined;
  };

  try {
    await api.utilityBills.review(id, {
      amount: numero('valor'),
      dueDate: texto('vencimento'),
      referenceMonth: texto('competencia'),
      consumptionKwh: numero('consumo'),
    });

    revalidatePath('/faturas');
    return { sucesso: 'Leitura corrigida.' };
  } catch (erro) {
    return tratar(erro);
  }
}

export async function gerarDespesaDaFatura(
  _anterior: ResultadoDaFatura,
  dados: FormData,
): Promise<ResultadoDaFatura> {
  const id = String(dados.get('faturaId') ?? '');

  try {
    const despesa = await api.utilityBills.convertToExpense(id, {});

    revalidatePath('/faturas');
    revalidatePath('/despesas');
    revalidatePath('/painel');

    return { sucesso: `Despesa criada: ${despesa.description}.` };
  } catch (erro) {
    return tratar(erro);
  }
}
