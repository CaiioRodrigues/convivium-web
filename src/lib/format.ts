/**
 * Formatacao pt-BR. Centralizada para que "R$ 1.234,56" e "14/09/2026"
 * saiam iguais em toda a aplicacao.
 */

const currency = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

const decimal = new Intl.NumberFormat('pt-BR', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const integer = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 });

export function money(value: number | null | undefined): string {
  return currency.format(value ?? 0);
}

/** Valor sem o simbolo, para tabelas onde a coluna ja diz "R$". */
export function amount(value: number | null | undefined): string {
  return decimal.format(value ?? 0);
}

export function count(value: number | null | undefined): string {
  return integer.format(value ?? 0);
}

/** Fracao (0.1234) para percentual ("12,3%"). */
export function percent(value: number | null | undefined, digits = 1): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'percent',
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value ?? 0);
}

/**
 * Datas da API vem como "2026-09-14" (DateOnly) ou ISO completo.
 * Uma data pura e formatada sem passar por fuso: converter "2026-09-14" para
 * Date local e depois formatar pode voltar um dia, dependendo do fuso.
 */
export function date(value: string | null | undefined): string {
  if (!value) return '—';

  const dateOnly = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);

  if (dateOnly) {
    const [, year, month, day] = dateOnly;
    return `${day}/${month}/${year}`;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime())
    ? '—'
    : parsed.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' });
}

export function dateTime(value: string | null | undefined): string {
  if (!value) return '—';

  const parsed = new Date(value);

  return Number.isNaN(parsed.getTime())
    ? '—'
    : parsed.toLocaleString('pt-BR', {
        timeZone: 'America/Sao_Paulo',
        dateStyle: 'short',
        timeStyle: 'short',
      });
}

/** "09/2026" -> "setembro de 2026". */
export function competenceLabel(competence: string | null | undefined): string {
  if (!competence) return '—';

  const match = /^(\d{2})\/(\d{4})$/.exec(competence);
  if (!match) return competence;

  const [, month, year] = match;
  const name = new Date(Number(year), Number(month) - 1, 1).toLocaleDateString('pt-BR', {
    month: 'long',
  });

  return `${name} de ${year}`;
}

/** Competência atual no formato que a API espera. */
export function currentCompetence(): string {
  const now = new Date();
  return `${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}`;
}

/** "12345678000195" -> "12.345.678/0001-95"; CPF de 11 dígitos também. */
export function document(value: string | null | undefined): string {
  if (!value) return '—';

  const digits = value.replace(/\D/g, '');

  if (digits.length === 14) {
    return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12)}`;
  }

  if (digits.length === 11) {
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
  }

  return value;
}

/** Linha digitável em blocos de 12, como vem impressa na fatura. */
export function barcodeLine(value: string | null | undefined): string {
  if (!value) return '—';

  return (value.match(/.{1,12}/g) ?? [value]).join(' ');
}
