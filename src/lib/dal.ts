import 'server-only';

import { cache } from 'react';
import { redirect } from 'next/navigation';

import { readSession, type Session } from '@/lib/session';
import { canManageFinance, canSeeAccounts } from '@/lib/roles';

/**
 * Camada de acesso a sessao.
 *
 * `cache` memoriza dentro de um mesmo render: varios componentes da pagina
 * chamam `requireSession()` sem reler o cookie a cada vez.
 */
export const getSession = cache(async (): Promise<Session | null> => readSession());

/** Sessao obrigatoria. Sem ela, manda para a tela de entrada. */
export async function requireSession(): Promise<Session> {
  const session = await getSession();

  if (!session) {
    redirect('/entrar');
  }

  return session;
}

/**
 * Exige um condominio ativo alem da sessao.
 *
 * Uma pessoa pode estar autenticada sem condominio ativo — por exemplo se
 * perdeu o vinculo enquanto a sessao estava aberta.
 */
export async function requireCondominium(): Promise<Session> {
  const session = await requireSession();

  if (!session.activeCondominiumId) {
    redirect('/sem-condominio');
  }

  return session;
}

/**
 * Exige papel de conselho para cima.
 *
 * Isto e uma checagem otimista, so para nao renderizar uma tela que o usuario
 * nao pode usar. Quem autoriza de verdade e a API, que le o papel de dentro do
 * JWT assinado — esta funcao nunca e a unica linha de defesa.
 */
export async function requireAccountsAccess(): Promise<Session> {
  const session = await requireCondominium();

  if (!canSeeAccounts(session.activeRole)) {
    redirect('/minhas-cobrancas');
  }

  return session;
}

export async function requireFinanceAccess(): Promise<Session> {
  const session = await requireCondominium();

  if (!canManageFinance(session.activeRole)) {
    redirect('/painel');
  }

  return session;
}
