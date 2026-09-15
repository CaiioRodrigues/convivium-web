'use server';

import { revalidatePath } from 'next/cache';

import { api } from '@/lib/api';
import { mensagemDeErro } from '@/lib/actions/erros';

export interface ResultadoDaPlataforma {
  erro?: string;
  sucesso?: string;
  /** Link de primeiro acesso do síndico, para repassar quando o e-mail não chegar. */
  convite?: string;
  /** O que foi digitado, devolvido quando a gravação falha. */
  valores?: Record<string, string>;
}

const CAMPOS_SENSIVEIS = new Set(['senha', 'confirmacao', 'token']);

function digitados(dados: FormData): Record<string, string> {
  const valores: Record<string, string> = {};

  for (const [chave, valor] of dados.entries()) {
    if (typeof valor === 'string' && !CAMPOS_SENSIVEIS.has(chave)) {
      valores[chave] = valor;
    }
  }

  return valores;
}

function tratar(erro: unknown, dados?: FormData): ResultadoDaPlataforma {
  const valores = dados ? { valores: digitados(dados) } : {};
  return { erro: mensagemDeErro(erro), ...valores };
}

function texto(dados: FormData, chave: string): string | null {
  const bruto = String(dados.get(chave) ?? '').trim();
  return bruto === '' ? null : bruto;
}

export async function criarCondominio(
  _anterior: ResultadoDaPlataforma,
  dados: FormData,
): Promise<ResultadoDaPlataforma> {
  const nome = texto(dados, 'nome');
  const sindico = texto(dados, 'sindico');
  const email = texto(dados, 'email');

  if (!nome) return { erro: 'Informe o nome do condomínio.', valores: digitados(dados) };
  if (!sindico) return { erro: 'Informe o nome do síndico.', valores: digitados(dados) };
  if (!email) {
    return {
      erro: 'Informe o e-mail do síndico: é por ele que sai o convite de acesso.',
      valores: digitados(dados),
    };
  }

  try {
    const criado = await api.platform.create({
      name: nome,
      city: texto(dados, 'cidade'),
      state: texto(dados, 'uf'),
      cnpj: texto(dados, 'cnpj'),
      managerName: sindico,
      managerEmail: email,
    });

    revalidatePath('/condominios');

    return {
      sucesso: criado.inviteUrl
        ? `${criado.name} criado. Envie o link abaixo para ${criado.managerEmail} escolher a senha.`
        : `${criado.name} criado. ${criado.managerEmail} já tinha acesso e agora responde por ele.`,
      convite: criado.inviteUrl || undefined,
    };
  } catch (erro) {
    return tratar(erro, dados);
  }
}

export async function gerarDemonstracao(): Promise<ResultadoDaPlataforma> {
  try {
    await api.platform.seedDemo();
    revalidatePath('/condominios');

    return { sucesso: 'Condomínio de demonstração gerado, com seis meses de histórico.' };
  } catch (erro) {
    return tratar(erro);
  }
}
