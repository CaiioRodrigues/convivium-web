import 'server-only';

import { readSession } from '@/lib/session';
import type { ProblemDetails } from '@/lib/types';

/**
 * Endereco do convivium-api. Sem prefixo NEXT_PUBLIC de proposito: a URL da
 * API nunca vai para o pacote do navegador, porque quem fala com ela e sempre
 * o servidor do Next.
 */
export const API_BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:5080';

/** Erro vindo da API, ja com o ProblemDetails desempacotado. */
export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly problem: ProblemDetails | null,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }

  /** Regra de negocio recusada pela API: a mensagem pode ser mostrada ao usuário. */
  get isBusinessRule(): boolean {
    return this.status === 422;
  }

  get isUnauthorized(): boolean {
    return this.status === 401;
  }

  get isForbidden(): boolean {
    return this.status === 403;
  }
}

export interface RequestOptions extends Omit<RequestInit, 'body'> {
  /** Corpo serializado como JSON. Para upload de arquivo, use `formData`. */
  json?: unknown;
  formData?: FormData;
  /** Parametros de query; chaves nulas ou indefinidas sao omitidas. */
  query?: Record<string, string | number | boolean | null | undefined>;
  /** Rota publica, sem token. Padrao: envia o token da sessao. */
  auth?: boolean;
}

export function buildQuery(
  query: Record<string, string | number | boolean | null | undefined> | undefined,
): string {
  if (!query) return '';

  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(query)) {
    if (value !== null && value !== undefined && value !== '') {
      params.set(key, String(value));
    }
  }

  const serialized = params.toString();
  return serialized ? `?${serialized}` : '';
}

/**
 * Chama a API do lado do servidor.
 *
 * Nao tenta renovar o token aqui: um Server Component nao pode gravar cookie
 * durante o render. A renovacao acontece no proxy, que roda antes da pagina e
 * pode escrever a resposta — ver `src/proxy.ts`.
 */
export async function apiFetch<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { json, formData, query, auth = true, headers, ...rest } = options;

  const requestHeaders = new Headers(headers);

  if (auth) {
    const session = await readSession();

    if (session) {
      requestHeaders.set('Authorization', `Bearer ${session.accessToken}`);
    }
  }

  let body: BodyInit | undefined;

  if (formData) {
    // Sem Content-Type: o fetch precisa definir o boundary do multipart.
    body = formData;
  } else if (json !== undefined) {
    requestHeaders.set('Content-Type', 'application/json');
    body = JSON.stringify(json);
  }

  const response = await fetch(`${API_BASE_URL}${path}${buildQuery(query)}`, {
    ...rest,
    headers: requestHeaders,
    body,
    // O Next 16 nao cacheia fetch por padrao, que e o que queremos num painel
    // financeiro: saldo e inadimplencia precisam refletir o estado de agora.
  });

  if (!response.ok) {
    throw await toApiError(response);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const contentType = response.headers.get('content-type') ?? '';

  if (!contentType.includes('json')) {
    return (await response.text()) as T;
  }

  return (await response.json()) as T;
}

/** Baixa um arquivo da API (boleto em PDF). */
export async function apiFetchBlob(
  path: string,
  options: RequestOptions = {},
): Promise<{ body: ArrayBuffer; contentType: string; fileName: string | null }> {
  const { query, auth = true, headers, ...rest } = options;
  const requestHeaders = new Headers(headers);

  if (auth) {
    const session = await readSession();
    if (session) {
      requestHeaders.set('Authorization', `Bearer ${session.accessToken}`);
    }
  }

  const response = await fetch(`${API_BASE_URL}${path}${buildQuery(query)}`, {
    ...rest,
    headers: requestHeaders,
  });

  if (!response.ok) {
    throw await toApiError(response);
  }

  const disposition = response.headers.get('content-disposition') ?? '';
  const match = /filename="?([^";]+)"?/i.exec(disposition);

  return {
    body: await response.arrayBuffer(),
    contentType: response.headers.get('content-type') ?? 'application/octet-stream',
    fileName: match?.[1] ?? null,
  };
}

async function toApiError(response: Response): Promise<ApiError> {
  let problem: ProblemDetails | null = null;

  try {
    const contentType = response.headers.get('content-type') ?? '';

    if (contentType.includes('json')) {
      problem = (await response.json()) as ProblemDetails;
    }
  } catch {
    // Resposta de erro sem corpo legivel; segue com a mensagem generica.
  }

  const message =
    problem?.detail ??
    problem?.title ??
    `A API respondeu ${response.status} em ${response.url}`;

  return new ApiError(response.status, problem, message);
}
