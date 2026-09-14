import { NextResponse, type NextRequest } from 'next/server';

import { API_BASE_URL } from '@/lib/api/core';
import {
  SESSION_COOKIE,
  cookieOptions,
  parseSession,
  serializeSession,
  sessionFromAuth,
  type Session,
} from '@/lib/session';
import type { AuthResult } from '@/lib/types';

/**
 * No Next 16 o antigo `middleware` passou a se chamar `proxy`, roda sempre no
 * runtime Node e nao aceita mais o runtime edge.
 *
 * Este e o unico ponto do fluxo que roda antes da pagina e pode gravar cookie:
 * um Server Component nao consegue escrever cookie durante o render. Por isso
 * a renovacao do token de acesso mora aqui, e nao no cliente da API.
 */

/** Renova com folga, para o token nao vencer no meio do render da pagina. */
const RENEW_WHEN_LESS_THAN_MS = 60_000;

/*
 * Rotas que dispensam sessão. `/api/boleto` precisa entrar aqui junto com
 * `/boleto`: a página do boleto é pública, mas o download do PDF sai por uma
 * rota de API própria — sem ela na lista, o link do e-mail abriria a página e
 * depois jogaria o morador na tela de login ao tentar baixar o boleto.
 */
const PUBLIC_PREFIXES = ['/entrar', '/boleto', '/api/boleto'];

function isPublic(pathname: string): boolean {
  return PUBLIC_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export default async function proxy(request: NextRequest): Promise<NextResponse> {
  const { pathname, search } = request.nextUrl;

  const session = parseSession(request.cookies.get(SESSION_COOKIE)?.value);
  const publicRoute = isPublic(pathname);

  if (!session) {
    if (publicRoute) {
      return NextResponse.next();
    }

    // Guarda para onde a pessoa queria ir, para voltar depois do login.
    const login = new URL('/entrar', request.url);
    if (pathname !== '/') {
      login.searchParams.set('destino', `${pathname}${search}`);
    }

    return NextResponse.redirect(login);
  }

  // Ja autenticado abrindo a tela de entrada: manda para dentro do portal.
  if (pathname === '/entrar') {
    return NextResponse.redirect(new URL('/painel', request.url));
  }

  const expiresIn = new Date(session.expiresAt).getTime() - Date.now();

  if (expiresIn > RENEW_WHEN_LESS_THAN_MS) {
    return NextResponse.next();
  }

  const renewed = await renew(session);

  if (!renewed) {
    // Refresh recusado: a sessao acabou de verdade (token revogado, expirado
    // ou acesso desativado). Limpa o cookie e pede login de novo.
    if (publicRoute) {
      const response = NextResponse.next();
      response.cookies.delete(SESSION_COOKIE);
      return response;
    }

    const login = new URL('/entrar', request.url);
    login.searchParams.set('motivo', 'sessao-expirada');

    const response = NextResponse.redirect(login);
    response.cookies.delete(SESSION_COOKIE);
    return response;
  }

  const response = NextResponse.next();
  response.cookies.set(SESSION_COOKIE, serializeSession(renewed), cookieOptions());

  // O cookie novo so chegaria ao navegador na resposta; reescrever tambem na
  // requisicao faz o render desta mesma pagina ja usar o token renovado.
  request.cookies.set(SESSION_COOKIE, serializeSession(renewed));

  return response;
}

async function renew(session: Session): Promise<Session | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: session.refreshToken }),
    });

    if (!response.ok) {
      return null;
    }

    return sessionFromAuth((await response.json()) as AuthResult);
  } catch {
    // API fora do ar: nao derruba a sessao por isso. O token atual ainda pode
    // valer alguns segundos, e a pagina mostra o erro se a chamada falhar.
    return null;
  }
}

export const config = {
  matcher: [
    /*
     * Roda em tudo, menos nos caminhos internos do Next e em arquivos
     * estaticos — pedir refresh de token para carregar um icone seria
     * desperdicio a cada navegacao.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
};
