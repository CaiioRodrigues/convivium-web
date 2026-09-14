import { cookies } from 'next/headers';

import type { AuthResult, CondominiumAccess, MembershipRole } from '@/lib/types';

export const SESSION_COOKIE = 'convivium_sessao';

/**
 * O que guardamos no cookie de sessao.
 *
 * O token de acesso fica aqui, num cookie httpOnly, e nunca no localStorage:
 * assim nenhum script da pagina consegue le-lo, o que fecha a porta mais comum
 * de roubo de sessao. Todas as chamadas a API saem do servidor do Next.
 *
 * O papel guardado aqui serve so para decidir o que mostrar no menu. Quem
 * autoriza de verdade e a API, que le o papel de dentro do JWT assinado —
 * adulterar este cookie muda o menu e nao muda nenhuma permissao.
 */
export interface Session {
  accessToken: string;
  refreshToken: string;
  /** Expiracao do token de acesso, em ISO 8601. */
  expiresAt: string;
  person: {
    id: string;
    name: string;
    email: string | null;
    isSuperAdmin: boolean;
  };
  condominiums: CondominiumAccess[];
  activeCondominiumId: string | null;
  activeRole: MembershipRole | null;
}

export function sessionFromAuth(auth: AuthResult): Session {
  return {
    accessToken: auth.accessToken,
    refreshToken: auth.refreshToken,
    expiresAt: auth.expiresAt,
    person: auth.person,
    condominiums: auth.condominiums,
    activeCondominiumId: auth.activeCondominiumId,
    activeRole: auth.activeRole,
  };
}

export function serializeSession(session: Session): string {
  return JSON.stringify(session);
}

export function parseSession(raw: string | undefined): Session | null {
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as Session;
    return parsed?.accessToken ? parsed : null;
  } catch {
    // Cookie corrompido ou de uma versao antiga do formato: trata como
    // deslogado em vez de derrubar a pagina.
    return null;
  }
}

/** Opcoes do cookie. Secure so em producao, senao o dev em http nao grava. */
export function cookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
  };
}

/** Le a sessao do cookie da requisicao atual. */
export async function readSession(): Promise<Session | null> {
  const store = await cookies();
  return parseSession(store.get(SESSION_COOKIE)?.value);
}

/** Grava a sessao. So funciona em Server Action, Route Handler ou proxy. */
export async function writeSession(session: Session): Promise<void> {
  const store = await cookies();
  store.set(SESSION_COOKIE, serializeSession(session), cookieOptions());
}

export async function clearSession(): Promise<void> {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

/** Quanto falta para o token de acesso expirar, em milissegundos. */
export function millisecondsUntilExpiry(session: Session): number {
  return new Date(session.expiresAt).getTime() - Date.now();
}
