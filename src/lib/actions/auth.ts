'use server';

import { redirect } from 'next/navigation';

import { ApiError, api } from '@/lib/api';
import { mensagemDeErro } from '@/lib/actions/erros';
import { clearSession, readSession, sessionFromAuth, writeSession } from '@/lib/session';

export interface LoginState {
  erro?: string;
  /**
   * O e-mail digitado, devolvido quando a entrada falha.
   *
   * O React limpa o formulário assim que a action termina, e errar a senha
   * obrigaria a redigitar o e-mail inteiro a cada tentativa. A senha nunca
   * volta por aqui — só o e-mail.
   */
  email?: string;
}

export async function entrar(_anterior: LoginState, dados: FormData): Promise<LoginState> {
  const email = String(dados.get('email') ?? '').trim();
  const senha = String(dados.get('senha') ?? '');
  const destino = String(dados.get('destino') ?? '') || '/painel';

  if (!email || !senha) {
    return { erro: 'Informe e-mail e senha.', email };
  }

  try {
    const auth = await api.auth.login(email, senha);
    await writeSession(sessionFromAuth(auth));
  } catch (erro) {
    // A API responde 401 com mensagem genérica de propósito, para não revelar
    // quais e-mails existem na base.
    if (erro instanceof ApiError && erro.isUnauthorized) {
      return { erro: 'E-mail ou senha inválidos.', email };
    }

    return { erro: mensagemDeErro(erro), email };
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

/**
 * Reemite o token e regrava o cookie da sessão.
 *
 * A lista de condomínios que a barra lateral mostra vem do cookie, escrito no
 * login. Criar um condomínio muda o banco e não o cookie — sem isto, o
 * condomínio recém-criado só apareceria no próximo login ou quando o token
 * vencesse, e o seletor continuaria escondido por achar que só existe um.
 */
export async function renovarSessao(): Promise<void> {
  const sessao = await readSession();

  if (!sessao) return;

  try {
    const auth = await api.auth.refresh(sessao.refreshToken);
    await writeSession(sessionFromAuth(auth));
  } catch {
    // Renovar é conveniência: falhando, a sessão atual continua valendo e a
    // lista só fica desatualizada até o próximo login. Derrubar quem acabou de
    // criar um condomínio seria pior do que um seletor atrasado.
  }
}

export async function trocarCondominio(condominiumId: string): Promise<void> {
  const auth = await api.auth.switchCondominium(condominiumId);
  await writeSession(sessionFromAuth(auth));

  redirect('/painel');
}
