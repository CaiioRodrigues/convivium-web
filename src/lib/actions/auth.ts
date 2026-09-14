'use server';

import { redirect } from 'next/navigation';

import { ApiError, api } from '@/lib/api';
import { clearSession, readSession, sessionFromAuth, writeSession } from '@/lib/session';

export interface LoginState {
  erro?: string;
}

export async function entrar(_anterior: LoginState, dados: FormData): Promise<LoginState> {
  const email = String(dados.get('email') ?? '').trim();
  const senha = String(dados.get('senha') ?? '');
  const destino = String(dados.get('destino') ?? '') || '/painel';

  if (!email || !senha) {
    return { erro: 'Informe e-mail e senha.' };
  }

  try {
    const auth = await api.auth.login(email, senha);
    await writeSession(sessionFromAuth(auth));
  } catch (erro) {
    if (erro instanceof ApiError) {
      // A API responde 401 com mensagem genérica de propósito, para não
      // revelar quais e-mails existem na base.
      return { erro: erro.isUnauthorized ? 'E-mail ou senha inválidos.' : erro.message };
    }

    return {
      erro: 'Não foi possível falar com o servidor. Verifique se a API está no ar.',
    };
  }

  // Fora do try: redirect funciona lançando, e o catch acima engoliria.
  // Só aceita caminho interno — "destino" vem da URL e não pode virar
  // um redirecionamento para fora do site.
  redirect(destino.startsWith('/') && !destino.startsWith('//') ? destino : '/painel');
}

export async function sair(): Promise<void> {
  const sessao = await readSession();

  if (sessao) {
    try {
      // Revoga o refresh token no servidor: só apagar o cookie deixaria a
      // sessão válida para quem tivesse uma cópia do token.
      await api.auth.logout(sessao.refreshToken);
    } catch {
      // Falha ao revogar não pode impedir o logout local.
    }
  }

  await clearSession();
  redirect('/entrar');
}

export async function trocarCondominio(condominiumId: string): Promise<void> {
  const auth = await api.auth.switchCondominium(condominiumId);
  await writeSession(sessionFromAuth(auth));

  redirect('/painel');
}
