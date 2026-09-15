'use server';

import { revalidatePath } from 'next/cache';

import { api } from '@/lib/api';
import { mensagemDeErro } from '@/lib/actions/erros';
import type {
  ApportionmentMethod,
  BankAccountKind,
  MembershipRole,
  OccupancyRelation,
  PixKeyType,
  UnitKind,
} from '@/lib/types';

export interface ResultadoDoCadastro {
  erro?: string;
  sucesso?: string;
  /** Link do convite, para o síndico repassar quando o e-mail não chegar. */
  link?: string;
  /**
   * O que a pessoa tinha digitado, devolvido quando a gravação falha.
   *
   * O React limpa os campos de um formulário não controlado assim que a action
   * termina. Sem isto, um cadastro de dez campos recusado por causa de um CPF
   * errado voltaria em branco e teria de ser redigitado inteiro. Os formulários
   * usam estes valores como `defaultValue`.
   */
  valores?: Record<string, string>;
}

/** Campos que nunca voltam para o cliente, mesmo num erro. */
const CAMPOS_SENSIVEIS = new Set(['senha', 'confirmacao', 'token']);

/** Guarda o que foi digitado para o formulário conseguir se remontar. */
function digitados(dados: FormData): Record<string, string> {
  const valores: Record<string, string> = {};

  for (const [chave, valor] of dados.entries()) {
    if (typeof valor === 'string' && !CAMPOS_SENSIVEIS.has(chave)) {
      valores[chave] = valor;
    }
  }

  return valores;
}

function tratar(erro: unknown, dados?: FormData): ResultadoDoCadastro {
  const valores = dados ? { valores: digitados(dados) } : {};
  return { erro: mensagemDeErro(erro), ...valores };
}

/** Campo de texto opcional: vazio vira nulo em vez de string em branco. */
function texto(dados: FormData, chave: string): string | null {
  const bruto = String(dados.get(chave) ?? '').trim();
  return bruto === '' ? null : bruto;
}

/**
 * Converte número digitado no formato brasileiro.
 * "1.234,56" vira 1234.56; vazio vira nulo.
 */
function numero(dados: FormData, chave: string): number | null {
  const bruto = String(dados.get(chave) ?? '').trim();
  if (bruto === '') return null;

  const valor = Number(bruto.replace(/\./g, '').replace(',', '.'));
  return Number.isFinite(valor) ? valor : null;
}

/** Percentual digitado como "2" ou "2,5" vira a fração 0.02 / 0.025. */
function percentual(dados: FormData, chave: string): number {
  return (numero(dados, chave) ?? 0) / 100;
}

// --- Contas do caixa ---

/**
 * Cadastra ou corrige uma conta bancária.
 *
 * O saldo de abertura é o que o condomínio já tinha quando entrou no sistema.
 * Ele não é um lançamento: não aparece no extrato nem entra na receita do mês —
 * só desloca o ponto de partida do saldo. Lançar os R$ 20.000 que já existiam
 * como uma entrada contaminaria o resultado do mês com dinheiro antigo.
 */
export async function salvarConta(
  _anterior: ResultadoDoCadastro,
  dados: FormData,
): Promise<ResultadoDoCadastro> {
  const id = texto(dados, 'contaId');
  const nome = texto(dados, 'nome');

  if (!nome) {
    return { erro: 'Informe o nome da conta.', valores: digitados(dados) };
  }

  const corpo = {
    name: nome,
    kind: (texto(dados, 'tipo') as BankAccountKind) ?? 'Checking',
    bankCode: texto(dados, 'banco'),
    agency: texto(dados, 'agencia'),
    accountNumber: texto(dados, 'numero'),
    openingBalance: numero(dados, 'saldoInicial') ?? 0,
    openingDate: texto(dados, 'dataInicial'),
    isReserveFund: dados.get('fundoDeReserva') !== null,
  };

  try {
    const conta = id
      ? await api.cash.updateBankAccount(id, { ...corpo, isActive: dados.get('ativa') !== null })
      : await api.cash.createBankAccount(corpo);

    revalidatePath('/caixa');
    revalidatePath('/painel');

    return {
      sucesso: id
        ? `Conta "${conta.name}" atualizada. Saldo atual: ${moeda(conta.currentBalance)}.`
        : `Conta "${conta.name}" criada com saldo de ${moeda(conta.currentBalance)}.`,
    };
  } catch (erro) {
    return tratar(erro, dados);
  }
}

/** Formata o saldo na mensagem de retorno, sem depender do componente. */
function moeda(valor: number): string {
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

// --- Condomínio ---

export async function salvarCondominio(
  _anterior: ResultadoDoCadastro,
  dados: FormData,
): Promise<ResultadoDoCadastro> {
  const nome = texto(dados, 'nome');

  if (!nome) {
    return { erro: 'Informe o nome do condomínio.', valores: digitados(dados) };
  }

  try {
    await api.condominium.update({
      name: nome,
      legalName: texto(dados, 'razaoSocial'),
      cnpj: texto(dados, 'cnpj'),
      address: {
        street: texto(dados, 'rua') ?? '',
        number: texto(dados, 'numero') ?? '',
        complement: texto(dados, 'complemento'),
        district: texto(dados, 'bairro') ?? '',
        city: texto(dados, 'cidade') ?? '',
        state: texto(dados, 'uf') ?? '',
        zipCode: texto(dados, 'cep') ?? '',
      },
      billing: {
        dueDay: numero(dados, 'diaVencimento') ?? 10,
        reserveFundRate: percentual(dados, 'fundoReserva'),
        lateFeeRate: percentual(dados, 'multa'),
        monthlyInterestRate: percentual(dados, 'juros'),
        defaultApportionmentMethod:
          (texto(dados, 'metodoRateio') as ApportionmentMethod) ?? 'IdealFraction',
      },
      pixKey: texto(dados, 'chavePix'),
      pixKeyType: texto(dados, 'tipoChavePix') as PixKeyType | null,
      pixReceiverName: texto(dados, 'beneficiario'),
      pixReceiverCity: texto(dados, 'cidadeBeneficiario'),
    });

    revalidatePath('/cadastros/condominio');
    revalidatePath('/painel');

    return { sucesso: 'Dados do condomínio atualizados.' };
  } catch (erro) {
    return tratar(erro, dados);
  }
}

// --- Unidades ---

export async function salvarUnidade(
  _anterior: ResultadoDoCadastro,
  dados: FormData,
): Promise<ResultadoDoCadastro> {
  const id = texto(dados, 'unidadeId');
  const identificador = texto(dados, 'identificador');

  if (!identificador) {
    return { erro: 'Informe a identificação da unidade.', valores: digitados(dados) };
  }

  const corpo = {
    identifier: identificador,
    blockId: texto(dados, 'blocoId'),
    newBlockName: texto(dados, 'novoBloco'),
    floor: numero(dados, 'andar'),
    kind: (texto(dados, 'tipo') as UnitKind) ?? 'Apartment',
    areaM2: numero(dados, 'area'),
    // A fração é digitada em porcentagem, que é como a convenção do
    // condomínio costuma expressá-la.
    idealFraction: numero(dados, 'fracao') === null ? null : percentual(dados, 'fracao'),
    isActive: dados.get('ativa') !== null,
  };

  try {
    const unidade = id
      ? await api.units.update(id, corpo)
      : await api.units.create(corpo);

    revalidatePath('/cadastros/unidades');
    revalidatePath('/cobrancas');

    return { sucesso: `Unidade ${unidade.fullIdentifier} salva.` };
  } catch (erro) {
    return tratar(erro, dados);
  }
}

export async function recalcularFracoes(
  _anterior: ResultadoDoCadastro,
  _dados: FormData,
): Promise<ResultadoDoCadastro> {
  try {
    const resultado = await api.units.redistributeByArea();
    revalidatePath('/cadastros/unidades');

    return {
      sucesso:
        `${resultado.unitsAffected} unidade(s) recalculadas pela área privativa. ` +
        `A soma das frações agora é ${resultado.idealFractionSum}.`,
    };
  } catch (erro) {
    return tratar(erro);
  }
}

export async function desativarUnidade(
  _anterior: ResultadoDoCadastro,
  dados: FormData,
): Promise<ResultadoDoCadastro> {
  const id = String(dados.get('unidadeId') ?? '');

  try {
    const unidade = await api.units.deactivate(id);
    revalidatePath('/cadastros/unidades');

    return { sucesso: `${unidade.fullIdentifier} saiu do rateio.` };
  } catch (erro) {
    return tratar(erro);
  }
}

// --- Pessoas ---

export async function salvarPessoa(
  _anterior: ResultadoDoCadastro,
  dados: FormData,
): Promise<ResultadoDoCadastro> {
  const id = texto(dados, 'pessoaId');
  const nome = texto(dados, 'nome');

  if (!nome) {
    return { erro: 'Informe o nome da pessoa.', valores: digitados(dados) };
  }

  try {
    if (id) {
      await api.people.update(id, {
        name: nome,
        email: texto(dados, 'email'),
        cpf: texto(dados, 'cpf'),
        phone: texto(dados, 'telefone'),
      });
    } else {
      await api.people.create({
        name: nome,
        email: texto(dados, 'email'),
        cpf: texto(dados, 'cpf'),
        phone: texto(dados, 'telefone'),
        role: (texto(dados, 'papel') as MembershipRole) ?? 'Resident',
        unitId: texto(dados, 'unidadeId'),
        relation: (texto(dados, 'relacao') as OccupancyRelation) ?? 'Owner',
        isBillingResponsible: dados.get('responsavel') !== null,
      });
    }

    revalidatePath('/cadastros/pessoas');
    revalidatePath('/cadastros/unidades');

    return { sucesso: `${nome} salvo(a).` };
  } catch (erro) {
    return tratar(erro, dados);
  }
}

export async function alterarPapel(
  _anterior: ResultadoDoCadastro,
  dados: FormData,
): Promise<ResultadoDoCadastro> {
  const id = String(dados.get('pessoaId') ?? '');
  const papel = String(dados.get('papel') ?? '') as MembershipRole;

  try {
    const pessoa = await api.people.changeRole(id, papel);
    revalidatePath('/cadastros/pessoas');

    return { sucesso: `Papel de ${pessoa.name} atualizado.` };
  } catch (erro) {
    return tratar(erro);
  }
}

export async function vincularUnidade(
  _anterior: ResultadoDoCadastro,
  dados: FormData,
): Promise<ResultadoDoCadastro> {
  const id = String(dados.get('pessoaId') ?? '');
  const unitId = texto(dados, 'unidadeId');

  if (!unitId) {
    return { erro: 'Escolha a unidade.', valores: digitados(dados) };
  }

  try {
    await api.people.linkUnit(id, {
      unitId,
      relation: (texto(dados, 'relacao') as OccupancyRelation) ?? 'Owner',
      isBillingResponsible: dados.get('responsavel') !== null,
    });

    revalidatePath('/cadastros/pessoas');
    revalidatePath('/cadastros/unidades');

    return { sucesso: 'Vínculo criado.' };
  } catch (erro) {
    return tratar(erro, dados);
  }
}

export async function desvincularUnidade(
  _anterior: ResultadoDoCadastro,
  dados: FormData,
): Promise<ResultadoDoCadastro> {
  const occupancyId = String(dados.get('vinculoId') ?? '');

  try {
    await api.people.unlinkUnit(occupancyId);
    revalidatePath('/cadastros/pessoas');
    revalidatePath('/cadastros/unidades');

    return { sucesso: 'Vínculo encerrado. O histórico da unidade fica preservado.' };
  } catch (erro) {
    return tratar(erro);
  }
}

export async function enviarConvite(
  _anterior: ResultadoDoCadastro,
  dados: FormData,
): Promise<ResultadoDoCadastro> {
  const id = String(dados.get('pessoaId') ?? '');

  try {
    const convite = await api.people.invite(id);
    revalidatePath('/cadastros/pessoas');
    revalidatePath('/notificacoes');

    return {
      sucesso: `Convite enviado para ${convite.email}. O link vale 7 dias e é de uso único.`,
      link: convite.inviteUrl,
    };
  } catch (erro) {
    return tratar(erro);
  }
}

export async function desativarPessoa(
  _anterior: ResultadoDoCadastro,
  dados: FormData,
): Promise<ResultadoDoCadastro> {
  const id = String(dados.get('pessoaId') ?? '');

  try {
    const pessoa = await api.people.deactivate(id);
    revalidatePath('/cadastros/pessoas');

    return { sucesso: `${pessoa.name} foi desativado(a).` };
  } catch (erro) {
    return tratar(erro);
  }
}

// --- Fornecedores ---

export async function salvarFornecedor(
  _anterior: ResultadoDoCadastro,
  dados: FormData,
): Promise<ResultadoDoCadastro> {
  const id = texto(dados, 'fornecedorId');
  const nome = texto(dados, 'nome');

  if (!nome) {
    return { erro: 'Informe o nome do fornecedor.', valores: digitados(dados) };
  }

  const corpo = {
    name: nome,
    document: texto(dados, 'documento'),
    email: texto(dados, 'email'),
    phone: texto(dados, 'telefone'),
    notes: texto(dados, 'observacoes'),
  };

  try {
    if (id) {
      await api.suppliersAdmin.update(id, corpo);
    } else {
      await api.suppliersAdmin.create(corpo);
    }

    revalidatePath('/cadastros/fornecedores');
    revalidatePath('/despesas');

    return { sucesso: `${nome} salvo.` };
  } catch (erro) {
    return tratar(erro, dados);
  }
}

export async function desativarFornecedor(
  _anterior: ResultadoDoCadastro,
  dados: FormData,
): Promise<ResultadoDoCadastro> {
  const id = String(dados.get('fornecedorId') ?? '');

  try {
    await api.suppliersAdmin.deactivate(id);
    revalidatePath('/cadastros/fornecedores');

    return { sucesso: 'Fornecedor desativado. O histórico de despesas dele fica preservado.' };
  } catch (erro) {
    return tratar(erro);
  }
}

// --- Primeiro acesso ---

export async function definirSenha(
  _anterior: ResultadoDoCadastro,
  dados: FormData,
): Promise<ResultadoDoCadastro> {
  const token = String(dados.get('token') ?? '');
  const senha = String(dados.get('senha') ?? '');
  const confirmacao = String(dados.get('confirmacao') ?? '');

  if (senha.length < 8) {
    return { erro: 'A senha precisa ter pelo menos 8 caracteres.' };
  }

  if (senha !== confirmacao) {
    return { erro: 'As duas senhas não são iguais.' };
  }

  try {
    await api.people.setPassword(token, senha);
    return { sucesso: 'Senha definida. Você já pode entrar.' };
  } catch (erro) {
    return tratar(erro);
  }
}
