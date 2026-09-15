'use server';

import { revalidatePath } from 'next/cache';

import { api } from '@/lib/api';
import { mensagemDeErro } from '@/lib/actions/erros';
import type { ResultadoDoCadastro } from '@/lib/actions/cadastros';

/**
 * Grava a folha de leitura inteira de uma vez.
 *
 * Os campos chegam como `leitura-<unitId>` e `anterior-<unitId>`: um formulário
 * só, preenchido de cima a baixo como a planilha que ele substitui. Salvar
 * linha por linha faria a pessoa clicar dez vezes para uma tarefa que ela pensa
 * como uma coisa só.
 */
export async function salvarLeituras(
  _anterior: ResultadoDoCadastro,
  dados: FormData,
): Promise<ResultadoDoCadastro> {
  const competencia = String(dados.get('competencia') ?? '').trim();
  const preco = numero(dados.get('preco'));

  if (!competencia) {
    return { erro: 'Informe a competência.' };
  }

  if (preco === null || preco <= 0) {
    return { erro: 'Informe o preço do metro cúbico.' };
  }

  const leituras: Array<{
    unitId: string;
    previousReading: number | null;
    currentReading: number | null;
  }> = [];

  for (const [chave, valor] of dados.entries()) {
    if (!chave.startsWith('leitura-') || typeof valor !== 'string') continue;

    const unitId = chave.slice('leitura-'.length);

    leituras.push({
      unitId,
      previousReading: numero(dados.get(`anterior-${unitId}`)),
      currentReading: numero(valor),
    });
  }

  try {
    const folha = await api.metering.save({
      competence: competencia,
      utility: 'Gas',
      unitPrice: preco,
      readOn: String(dados.get('lidoEm') ?? '') || null,
      readings: leituras,
    });

    revalidatePath('/medicoes');
    revalidatePath('/cobrancas');

    const pendentes =
      folha.pendingCount > 0
        ? ` ${folha.pendingCount} unidade(s) ainda sem leitura.`
        : '';

    return {
      sucesso:
        `Leituras salvas: ${folha.totalConsumption.toLocaleString('pt-BR', { minimumFractionDigits: 3 })} m³, ` +
        `${folha.totalAmount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} no total.${pendentes}`,
    };
  } catch (erro) {
    return { erro: mensagemDeErro(erro) };
  }
}

/** Número no formato brasileiro; vazio vira nulo em vez de zero. */
function numero(valor: FormDataEntryValue | null): number | null {
  const bruto = String(valor ?? '').trim();
  if (bruto === '') return null;

  const convertido = Number(bruto.replace(/\./g, '').replace(',', '.'));
  return Number.isFinite(convertido) ? convertido : null;
}
